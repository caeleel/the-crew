"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const redis_1 = require("redis");
const wss = new ws_1.WebSocketServer({ port: 8080 });
const redis = (0, redis_1.createClient)().connect();
const sockets = {};
function send(ws, data) {
    ws.send(JSON.stringify(data));
}
function sendError(ws, error) {
    send(ws, {
        type: 'error',
        error,
    });
}
function broadcast(channel, data) {
    const wsMap = sockets[channel];
    if (!wsMap) {
        return;
    }
    for (const guid in wsMap) {
        const info = wsMap[guid];
        send(info.ws, data);
    }
}
function seedGen() {
    return (Math.random() * 2 ** 32) >>> 0;
}
function filledSeats(gameState) {
    let count = 0;
    if (gameState.seat1)
        count++;
    if (gameState.seat2)
        count++;
    if (gameState.seat3)
        count++;
    if (gameState.seat4)
        count++;
    if (gameState.seat5)
        count++;
    return count;
}
function whichSeat(guid, gameState) {
    if (gameState.seat2.split(':', 2)[0] === guid)
        return 'seat2';
    if (gameState.seat3.split(':', 2)[0] === guid)
        return 'seat3';
    if (gameState.seat4.split(':', 2)[0] === guid)
        return 'seat4';
    if (gameState.seat5.split(':', 2)[0] === guid)
        return 'seat5';
    if (gameState.seat1.split(':', 2)[0] === guid)
        return 'seat1';
    return null;
}
wss.on('connection', async (ws) => {
    let channel = null;
    let guid = '';
    let name = 'Anonymous';
    let gameKey = '';
    let moveKey = '';
    const client = await redis;
    async function getGameState() {
        const gameState = await client.hGetAll(gameKey);
        if (Object.keys(gameState).length === 0) {
            return null;
        }
        return gameState;
    }
    async function setGameState(gameState) {
        await client.hSet(gameKey, gameState);
        await client.expire(gameKey, 3600);
        broadcastGameState();
    }
    async function getMoves() {
        return await client.lRange(moveKey, 0, -1);
    }
    async function broadcastGameState() {
        broadcast(channel, {
            type: 'game',
            gameState: await getGameState(),
        });
    }
    ws.on('close', () => {
        if (channel) {
            const wsMap = sockets[channel];
            delete wsMap[guid];
        }
    });
    ws.on('message', async (data) => {
        let msgJson;
        try {
            msgJson = JSON.parse(data.toString());
        }
        catch (e) {
            return sendError(ws, e.message);
        }
        if (!channel && msgJson.type !== 'subscribe') {
            return sendError(ws, 'Must join channel first');
        }
        switch (msgJson.type) {
            case 'subscribe': {
                const subscribeMsg = msgJson;
                if (!subscribeMsg.channel) {
                    return sendError(ws, 'Subscribe is missing channel');
                }
                channel = subscribeMsg.channel;
                if (!sockets[channel]) {
                    sockets[channel] = {};
                }
                sockets[channel][guid] = { ws, name };
                gameKey = `game:${channel}`;
                moveKey = `moves:${channel}`;
                let gameState = await getGameState();
                if (!gameState) {
                    // game has not been created, create it and seed
                    gameState = {
                        seed1: seedGen(),
                        seed2: seedGen(),
                        seed3: seedGen(),
                        seed4: seedGen(),
                        seat1: '',
                        seat2: '',
                        seat3: '',
                        seat4: '',
                        seat5: '',
                        status: 'waiting'
                    };
                    setGameState(gameState);
                }
                await broadcastGameState();
                send(ws, {
                    type: 'moves',
                    moves: await getMoves(),
                });
                break;
            }
            case 'join': {
                const gameState = await getGameState();
                if (!gameState) {
                    return sendError(ws, 'Cannot join game, game does not exist');
                }
                if (whichSeat(guid, gameState)) {
                    return sendError(ws, 'Already joined');
                }
                if (filledSeats(gameState) > 4) {
                    return sendError(ws, 'Too many players already');
                }
                if (gameState.status === 'started') {
                    return sendError(ws, 'Game already started');
                }
                const seat = msgJson.seat;
                if (seat !== 'seat1' && seat !== 'seat2' && seat !== 'seat3' && seat !== 'seat4' && seat !== 'seat5') {
                    return sendError(ws, 'Invalid seat');
                }
                gameState[seat] = `${guid}:${name}`;
                setGameState(gameState);
                break;
            }
            case 'start': {
                const gameState = await getGameState();
                if (!gameState) {
                    return sendError(ws, 'Cannot start game, game does not exist');
                }
                if (gameState.status === 'started') {
                    return sendError(ws, 'Game already started');
                }
                if (filledSeats(gameState) < 3) {
                    return sendError(ws, 'Not enough players');
                }
                setGameState({ status: 'started' });
            }
            case 'leave': {
                const guid = msgJson.guid;
                const gameState = await getGameState();
                if (!gameState) {
                    return sendError(ws, 'Game does not exist');
                }
                const seat = whichSeat(guid, gameState);
                if (!seat) {
                    return sendError(ws, 'Player is not in the game');
                }
                if (gameState.status === 'started') {
                    return sendError(ws, `Can't leave game in progress`);
                }
                setGameState({ [seat]: '' });
            }
            case 'move': {
                const gameState = await getGameState();
                if (!gameState) {
                    return sendError(ws, 'Game does not exist');
                }
                if (gameState.status === 'waiting') {
                    return sendError(ws, 'Game not started');
                }
                const move = msgJson.move;
                await client.lPush(moveKey, `${guid}:${move}`);
                client.expire(moveKey, 3600);
                broadcast(channel, {
                    type: 'move',
                    move,
                    guid,
                });
            }
            case 'reset': {
                const gameState = await getGameState();
                if (!gameState) {
                    return sendError(ws, 'Game does not exist');
                }
                await client.del(moveKey);
                await setGameState({
                    seed1: seedGen(),
                    seed2: seedGen(),
                    seed3: seedGen(),
                    seed4: seedGen(),
                    status: 'waiting',
                });
                broadcast(channel, {
                    type: 'moves',
                    moves: await getMoves(),
                });
            }
        }
    });
    send(ws, { type: 'connected' });
});

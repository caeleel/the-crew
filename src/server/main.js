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
        const msgJson = JSON.parse(data.toString());
        if (!channel && msgJson.type !== 'subscribe') {
            return sendError(ws, 'Must join channel first');
        }
        switch (msgJson.type) {
            case 'subscribe': {
                const subscribeMsg = msgJson;
                if (!subscribeMsg.channel || !subscribeMsg.name || !subscribeMsg.guid) {
                    return sendError(ws, 'Subscribe is missing field');
                }
                ({ channel, guid, name } = subscribeMsg);
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
                        guids: guid,
                        names: name,
                        status: 'waiting'
                    };
                    setGameState(gameState);
                }
                broadcastGameState();
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
                const guids = gameState.guids.split(',');
                if (guids.includes(guid)) {
                    return sendError(ws, 'Already joined');
                }
                if (guids.length > 4) {
                    return sendError(ws, 'Too many players already');
                }
                if (gameState.status === 'started') {
                    return sendError(ws, 'Game already started');
                }
                gameState.guids += `,${guid}`;
                gameState.names += `,${name}`;
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
                if (gameState.guids.split(',').length < 3) {
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
                const guids = gameState.guids.split(',');
                const names = gameState.names.split(',');
                if (!gameState.guids.includes(guid)) {
                    return sendError(ws, 'Player is not in the game');
                }
                if (gameState.status === 'started') {
                    return sendError(ws, `Can't leave game in progress`);
                }
                const idx = guids.indexOf(guid);
                guids.splice(idx, 1);
                names.splice(idx, 1);
                setGameState({ guids: guids.join(','), names: names.join(',') });
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
                setGameState({
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

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const redis_1 = require("redis");
const wss = new ws_1.WebSocketServer({ port: 8082 });
const redis = (0, redis_1.createClient)().connect();
const sockets = {};
function send(ws, data) {
    ws.send(JSON.stringify(data));
}
function sendError(ws, error) {
    send(ws, {
        type: "error",
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
function getStartingSeats(gameState) {
    const seats = [];
    for (const key in gameState) {
        if (key.substring(0, 4) === "seat") {
            if (gameState[key]) {
                seats.push(key);
            }
        }
    }
    return seats;
}
function filledSeats(gameState) {
    return getStartingSeats(gameState).length;
}
function whichSeat(guid, gameState) {
    for (const key in gameState) {
        if (key.substring(0, 4) === "seat") {
            const seatKey = key;
            if (gameState[seatKey].split(":", 2)[0] === guid) {
                return seatKey;
            }
        }
    }
    return null;
}
wss.on("connection", async (ws) => {
    let channel = null;
    let guid = "";
    let name = "";
    let gameKey = "";
    let moveKey = "";
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
        await broadcastGameState();
    }
    async function getMoves() {
        return await client.lRange(moveKey, 0, -1);
    }
    async function broadcastGameState() {
        broadcast(channel, {
            type: "game",
            gameState: await getGameState(),
        });
    }
    ws.on("close", async () => {
        if (channel) {
            const wsMap = sockets[channel];
            delete wsMap[guid];
        }
    });
    ws.on("message", async (data) => {
        let msgJson;
        try {
            msgJson = JSON.parse(data.toString());
        }
        catch (e) {
            return sendError(ws, e.message);
        }
        if (!channel && msgJson.type !== "subscribe") {
            return sendError(ws, "Must join channel first");
        }
        switch (msgJson.type) {
            case "subscribe": {
                const subscribeMsg = msgJson;
                if (!subscribeMsg.channel || !subscribeMsg.channel) {
                    return sendError(ws, "Subscribe is missing channel");
                }
                channel = subscribeMsg.channel;
                guid = subscribeMsg.guid;
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
                        seat1: "",
                        seat2: "",
                        seat3: "",
                        seat4: "",
                        seat5: "",
                        meta: "",
                        startingSeats: "",
                        status: "waiting",
                    };
                    setGameState(gameState);
                }
                send(ws, {
                    type: "moves",
                    moves: await getMoves(),
                });
                await broadcastGameState();
                break;
            }
            case "join": {
                const gameState = await getGameState();
                if (!gameState) {
                    return sendError(ws, "Cannot join game, game does not exist");
                }
                if (whichSeat(guid, gameState)) {
                    return sendError(ws, "Already joined");
                }
                if (filledSeats(gameState) > 4) {
                    return sendError(ws, "Too many players already");
                }
                const seat = msgJson.seat;
                name = msgJson.name || "Anonymous";
                if (seat !== "seat1" &&
                    seat !== "seat2" &&
                    seat !== "seat3" &&
                    seat !== "seat4" &&
                    seat !== "seat5") {
                    return sendError(ws, "Invalid seat");
                }
                gameState[seat] = `${guid}:${name}`;
                setGameState(gameState);
                break;
            }
            case "start": {
                const gameState = await getGameState();
                if (!gameState) {
                    return sendError(ws, "Cannot start game, game does not exist");
                }
                if (gameState.status === "started") {
                    return sendError(ws, "Game already started");
                }
                if (filledSeats(gameState) < 3) {
                    return sendError(ws, "Not enough players");
                }
                setGameState({
                    status: "started",
                    meta: msgJson.meta ? JSON.stringify(msgJson.meta) : "",
                    startingSeats: getStartingSeats(gameState).join(","),
                });
            }
            case "leave": {
                const guid = msgJson.guid;
                const gameState = await getGameState();
                if (!gameState) {
                    return sendError(ws, "Game does not exist");
                }
                const seat = whichSeat(guid, gameState);
                if (!seat) {
                    return sendError(ws, "Player is not in the game");
                }
                setGameState({ [seat]: "" });
            }
            case "move": {
                const gameState = await getGameState();
                if (!gameState) {
                    return sendError(ws, "Game does not exist");
                }
                if (gameState.status === "waiting") {
                    return sendError(ws, "Game not started");
                }
                const move = msgJson.move;
                await client.lPush(moveKey, `${guid}:${move}`);
                client.expire(moveKey, 3600);
                broadcast(channel, {
                    type: "move",
                    move,
                    guid,
                });
                break;
            }
            case "reset": {
                const gameState = await getGameState();
                if (!gameState) {
                    return sendError(ws, "Game does not exist");
                }
                await client.del(moveKey);
                await setGameState({
                    seed1: seedGen(),
                    seed2: seedGen(),
                    seed3: seedGen(),
                    seed4: seedGen(),
                    startingSeats: "",
                    status: "waiting",
                });
                broadcast(channel, {
                    type: "moves",
                    moves: await getMoves(),
                });
                break;
            }
        }
    });
    send(ws, { type: "connected" });
});

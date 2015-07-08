/// <reference path='typings/node/node.d.ts' />
/// <reference path='typings/ws/ws.d.ts' />
/// <reference path="lib/types.ts" />
/// <reference path="lib/assets.ts" />
/// <reference path="maps.ts" />
/// <reference path="players.ts" />
/// <reference path="scene.ts" />
/// <reference path="stickmen.ts" />

const ws = require('ws');
const WebSocketServer = ws.Server

module RippyShreddy {

export function startGame(): void {
    const wss = new WebSocketServer({ port: 8080 });
    const map = new TwoFortMap();
    const scene = new Scene(map);

    let lastTick = Date.now();

    function tick() {
        lastTick = Date.now();

        // Update scene
        scene.tick(0.03);

        // Broadcast update to all players
        let data = {
            type: 'update',
            players: []
        };
        for (const [player, playerState] of scene.getPlayers()) {
            let playerData = {
                id: player.id,
                input: player.input,
                stickman: null
            };

            const stickman = scene.getStickman(player);
            if (stickman) {
                playerData.stickman = {
                    pos: stickman.getPosition()
                }
            }
            
            data.players.push(playerData);
        }
        const packet = JSON.stringify(data);
        for (const client of wss.clients) {
            if (client.readyState === ws.OPEN) {
                client.send(packet);
            }
        }
    }

    setInterval(tick, 30);

    let nextPlayerId = 1;

    wss.on('connection', function connection(ws) {
        const player = new LocalPlayer(nextPlayerId++);
        scene.addPlayer(player);
        scene.spawnPlayer(player);

        ws.on('message', function incoming(message) {
            const data = JSON.parse(message);

            if (data.type == 'input') {
                player.setInput(data.input);
            }
        });

        ws.on('close', function() {
            scene.removePlayer(player);
            const playerLeavePacket = JSON.stringify({
                type: 'playerLeave',
                id: player.id,
            });
            for (const client of wss.clients) {
                if (client.readyState === ws.OPEN) {
                    client.send(playerLeavePacket);
                }
            }
        });

        // Send welcome packet to player
        let players = [];
        for (const [player, playerState] of scene.getPlayers()) {
            players.push({
                id: player.id,
            });
        }
        ws.send(JSON.stringify({
            type: 'welcome',
            id: player.id,
            players: players,
        }));

        // Send a playerJoin packet to everyone
        const playerJoinPacket = JSON.stringify({
            type: 'playerJoin',
            id: player.id,
        });
        for (const client of wss.clients) {
            if (client.readyState === ws.OPEN) {
                client.send(playerJoinPacket);
            }
        }
    });
}

}

console.log("Starting game");

RippyShreddy.startGame();

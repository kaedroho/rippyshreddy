/// <reference path="lib/types.ts" />
/// <reference path="players.ts" />
/// <reference path="stickmen.ts" />
/// <reference path="fx/particles.ts" />
/// <reference path="fx/bullettrails.ts" />
/// <reference path="maps.ts" />

module RippyShreddy {

interface SceneUpdatePacket {
    players: any[],
}

class PlayerState {
    public kills: number;
    public deaths: number;
    public respawnTimer: number
    public stickman: Stickman;

    isInGame() {
        return this.stickman != null;
    }

    getScore() {
        return this.kills * 100;
    }
}

export class Scene {
    public map: Map;
    private players: [Player, PlayerState][] = [];
    public particles: ParticleEngine;
    public bulletTrails: BulletTrailEngine;

    constructor(map: Map) {
        this.map = map;
        this.particles = new ParticleEngine();
        this.bulletTrails = new BulletTrailEngine();
    }

    getStickmen(): Stickman[] {
        const stickmen: Stickman[] = [];

        for (const [player, playerState] of this.players) {
            if (playerState.stickman) {
                stickmen.push(playerState.stickman);
            }
        }

        return stickmen;
    }

    addPlayer(player: Player) {
        this.players.push([player, new PlayerState()]);
    }

    removePlayer(playerToRemove: Player) {
        for (const i in this.players) {
            const [player, playerState] = this.players[i];
            if (player == playerToRemove) {
                this.players.splice(i, 1);
                return;
            }
        }
    }

    getPlayerState(player: Player): PlayerState {
        for (const p of this.players) {
            if (p[0] === player) {
                return p[1];
            }
        }
    }

    getPlayerById(id: number): Player {
        for (const [player, playerState] of this.players) {
            if (id === player.id) {
                return player;
            }
        }
    }

    getPlayers(): [Player, PlayerState][] {
        return this.players;
    }

    getStickman(player: Player): Stickman {
        const playerState = this.getPlayerState(player);

        if (playerState) {
            return playerState.stickman;
        }
    }

    getStickmanByPlayerId(id: number): Stickman {
        const player = this.getPlayerById(id);

        if (player) {
            return this.getStickman(player);
        }
    }

    spawnPlayer(player: Player, timer: number = 0) {
        const playerState = this.getPlayerState(player);

        if (playerState) {
            playerState.respawnTimer = timer;
        }
    }

    leaderBoard(): [Player, PlayerState][] {
        return [];
    }

    draw(context: Context2D, at: number) {
        this.bulletTrails.draw(context, at);

        for (const stickman of this.getStickmen()) {
            stickman.draw(context, at);
        }

        this.map.draw(context);

        this.particles.draw(context, at);
    }

    tick(dt: number) {
        for (const [player, playerState] of this.players) {
            if (!playerState.isInGame() && playerState.respawnTimer != null) {
                playerState.respawnTimer -= dt;

                if (playerState.respawnTimer <= 0) {
                    playerState.stickman = new Stickman(this, player);
                    playerState.respawnTimer = null;
                }
            }
        }

        this.bulletTrails.tick(dt);

        for (const stickman of this.getStickmen()) {
            stickman.tick(dt);
        }

        this.particles.tick(dt);
    }
}

}

/// <reference path="lib/types.ts" />
/// <reference path="players.ts" />
/// <reference path="stickmen.ts" />
/// <reference path="particles.ts" />
/// <reference path="bullets.ts" />

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

class Scene {
    public map: Map;
    private players: [Player, PlayerState][] = [];
    public particles: ParticleEngine;
    public bullets: BulletEngine;

    constructor(map: Map) {
        this.map = map;
        this.particles = new ParticleEngine();
        this.bullets = new BulletEngine(this);
    }

    private getStickmen(): Stickman[] {
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

    getPlayerState(player: Player): PlayerState {
        for (const p of this.players) {
            if (p[0] === player) {
                return p[1];
            }
        }
    }

    getStickman(player: Player): Stickman {
        const playerState = this.getPlayerState(player);

        if (playerState) {
            return playerState.stickman;
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
        this.bullets.draw(context, at);

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

        this.bullets.tick(dt);

        for (const stickman of this.getStickmen()) {
            stickman.tick(dt);
        }

        this.particles.tick(dt);
    }
}

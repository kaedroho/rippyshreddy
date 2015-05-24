/// <reference path="player.ts" />
/// <reference path="stickman.ts" />

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

    constructor(map: Map) {
        this.map = map;
    }

    private getStickmen(): Stickman[] {
        const stickmen: Stickman[] = [];

        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (player[1].stickman) {
                stickmen.push(player[1].stickman);
            }
        }

        return stickmen;
    }

    addPlayer(player: Player) {
        this.players.push([player, new PlayerState()]);
    }

    getPlayerState(player: Player): PlayerState {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i][0] === player) {
                return this.players[i][1];
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
        this.getStickmen().forEach(function(stickman) {
            stickman.draw(context, at);
        })

        this.map.draw(context);
    }

    tick(dt: number) {
        const scene = this;

        this.players.forEach(function(p) {
            const player = p[0];
            const playerState = p[1];

            if (!playerState.isInGame() && playerState.respawnTimer != null) {
                playerState.respawnTimer -= dt;

                if (playerState.respawnTimer <= 0) {
                    playerState.stickman = new Stickman(scene, player);
                    playerState.respawnTimer = null;
                }
            }
        });

        this.getStickmen().forEach(function(stickman) {
            stickman.tick(dt);
        })
    }
}

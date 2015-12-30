import {Context2D, Vector2, CollisionResult} from "./lib/types";


export default class Map {
    private sizeX: number;
    private sizeY: number;
    private tiles: Uint8Array;

    constructor(sizeX: number, sizeY: number) {
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.tiles = new Uint8Array(sizeX * sizeY);
    }

    setTile(x: number, y: number, value: number) {
        this.tiles[y * this.sizeX + x] = value;
    }

    getTile(x: number, y: number): number {
        return this.tiles[y * this.sizeX + x];
    }

    fillArea(x: number, y: number, width: number, height: number, value: number) {
        for (let i = 0; i < width; i++) {
            for (let  j = 0; j < height; j++) {
                this.setTile(x+i, y+j, value);
            }
        }
    }

    draw(context: Context2D) {
        for (let i = 0; i < this.sizeX; i++) {
            for (let j = 0; j < this.sizeY; j++) {
                const value = this.getTile(i, j);

                if (value) {
                    if (value == 1) {
                        // Plain block
                        context.fillStyle = 'rgb(128, 128, 128)';
                        context.strokeStyle = 'rgb(64, 64, 64)';
                    }

                    // Draw box
                    context.fillRect(i * 64, j * 64, 65, 65);
                }
            }
        }
    }

    raycast(from: Vector2, to: Vector2): CollisionResult {
        // http://dev.mothteeth.com/2011/11/2d-ray-casting-on-a-grid-in-as3/
        // http://www.cse.yorku.ca/~amana/research/grid.pdf

        // Scale points
        const fromX = from[0] / 64;
        const fromY = from[1] / 64;
        const toX = to[0] / 64;
        const toY = to[1] / 64;

        // Work out direction
        const directionX = toX - fromX;
        const directionY = toY - fromY;

        // Work out step
        const stepX = (directionX < 0) ? -1 : 1;
        const stepY = (directionY < 0) ? -1 : 1;

        // Get tiles
        let X = Math.floor(fromX);
        let Y = Math.floor(fromY);
        const endX = Math.floor(toX);
        const endY = Math.floor(toY);

        // Check if this starts on a tile boundary (and heading into the tile. If so, check collision on this tile
        if (((fromX % 1 == 0 && directionX > 0) || (fromY % 1 == 0 && directionY > 0)) && this.tiles[Y * this.sizeX + X]) {
            return {
                position: <Vector2>from.slice(),
                normal: <Vector2>[0, 0], // TODO
            };
        }

        // Check that it crosses a tile
        if (X == endX && Y == endY) {
            return;
        }

        // Work out ratios
        const ratioX = directionX / directionY;
        const ratioY = directionY / directionX;

        // Work out deltas
        const deltaX = Math.abs(directionY);
        const deltaY = Math.abs(directionX);

        // Work out maxes
        let maxX = deltaX * (( stepX > 0) ? (1 - (fromX % 1)) : (fromX % 1));
        let maxY = deltaY * (( stepY > 0) ? (1 - (fromY % 1)) : (fromY % 1));

        // Traverse
        let limit = 1000;
        while ((X != endX || Y != endY) && limit > 0 && X >= 0 && Y >= 0 && X < this.sizeX && Y < this.sizeY) {
            limit--;
            if (maxX < maxY) {
                // Move along X axis
                maxX += deltaX;
                X += stepX;

                // Check for collision
            if (this.getTile(X, Y) > 0) {
                    const collisionX = X + (stepX < 0 ? 1 : 0);
                    const collisionY = fromY + ratioY * (collisionX - fromX);

                    return {
                        position: <Vector2>[
                            collisionX * 64,
                            collisionY * 64,
                        ],
                        normal: <Vector2>[-stepX, 0],
                    };
                }
            } else {
                // Move along Y axis
                maxY += deltaY;
                Y += stepY;

                // Check for collision
                if (this.getTile(X, Y) > 0) {
                    const collisionY = Y + (stepY < 0 ? 1 : 0);
                    const collisionX = fromX + ratioX * (collisionY - fromY);

                    return {
                        position: <Vector2>[
                            collisionX * 64,
                            collisionY * 64,
                        ],
                        normal: <Vector2>[0, -stepY],
                    };
                }
            }
        }

        // No collision
        return;
    }
}

export class TwoFortMap extends Map {
    constructor() {
        super(100, 100);

        // Right fort
        this.fillArea(35, 13, 8, 1, 1);
        this.fillArea(35, 0, 1, 13, 1);
        this.fillArea(35, 0, 20, 1, 1);
        this.fillArea(55, 0, 1, 22, 1);
        this.fillArea(35, 22, 21, 1, 1);
        this.fillArea(50, 16, 5, 6, 1);

        // Left fort
        this.fillArea(13, 13, 8, 1, 1);
        this.fillArea(20, 0, 1, 13, 1);
        this.fillArea(0, 0, 20, 1, 1);
        this.fillArea(0, 0, 1, 22, 1);
        this.fillArea(0, 22, 21, 1, 1);
        this.fillArea(1, 16, 5, 6, 1);

        // Middle
        this.fillArea(21, 22, 14, 1, 1);
        this.fillArea(21, 22, 7, 1, 1);
    }
}

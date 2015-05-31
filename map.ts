/// <reference path="lib/types.ts" />
/// <reference path="lib/assets.ts" />

class Map {
    private sizeX: number;
    private sizeY: number;
    private tiles: Uint8Array;
    private static tileImages: Assets.ImageAsset[] = [
        null, // 0 - Air
        new Assets.ImageAsset('tiles/brick.png'), // 1 - Brick
    ]

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
                    context.drawImage(Map.tileImages[value].image, i * 64, j * 64, 64, 64);
                }
            }
        }
    }
}

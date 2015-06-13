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

class TwoFortMap extends Map {
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
    }
}

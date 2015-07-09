/// <reference path="lib/types.ts" />
/// <reference path="lib/assets.ts" />
/// <reference path="scene.ts" />
/// <reference path="players.ts" />

module RippyShreddy {

export class BaseWeapon {
    protected scene: Scene;
    protected player: Player;

    constructor(scene: Scene, player: Player) {
        this.scene = scene;
        this.player = player;
    }

    tick(dt: number, isAttacking: boolean, position: Vector2, facingLeft: boolean, pitch: number): void {};
    draw(context: Context2D, position: Vector2, facingLeft: boolean, pitch: number): void {}
    getHandPositions(): [Vector2, Vector2] { return [null, null]; }
}

export class BaseGun extends BaseWeapon {
    protected image: Assets.ImageAsset;
    protected imageOffset: Vector2 = [0, 0];
    protected leftHandPosition: Vector2 = [0, 0];
    protected rightHandPosition: Vector2 = [0, 0];
    protected muzzlePosition: Vector2 = [0, 0];
    private recoil: number = 0;

    tick(dt: number, isAttacking: boolean, position: Vector2, facingLeft: boolean, pitch: number) {
        this.recoil -= dt * 200;

        if (this.recoil < 0) {
            this.recoil = 0;

            if (isAttacking) {
                this.shoot(position, facingLeft, pitch)
            }
        }
    }

    shoot(position: Vector2, facingLeft: boolean, pitch: number) {
        // Muzzle position
        const muzzlePosition = <Vector2>[
            this.muzzlePosition[0] - this.recoil * 1.5,
            40 - this.muzzlePosition[1],
        ];

        // Muzzle direction
        const muzzleDirection = <Vector2>[
            Math.cos(pitch),
            Math.sin(pitch),
        ];

        // Transform muzzle position by muzzle direction
        const transformedMuzzlePosition = <Vector2>[
            muzzlePosition[0] * muzzleDirection[0] - muzzlePosition[1] * muzzleDirection[1],
            muzzlePosition[0] * muzzleDirection[1] + muzzlePosition[1] * muzzleDirection[0],
        ];

        // Transform muzzle direction
        const transformedMuzzleDirection = <Vector2>muzzleDirection.slice();

        // Reverse direction if player is facing left
        if (facingLeft) {
            transformedMuzzleDirection[0] = -transformedMuzzleDirection[0];
            transformedMuzzlePosition[0] = -transformedMuzzlePosition[0];
        }

        // Add player position to muzzle position
        transformedMuzzlePosition[0] += position[0];
        transformedMuzzlePosition[1] += position[1];

        // Direction in radians
        const direction = Math.atan2(transformedMuzzleDirection[0], transformedMuzzleDirection[1]);

        // Raycast from neck to muzzle to make sure weapon isn't going through a wall
        const muzzleInWall = this.scene.map.raycast(position, transformedMuzzlePosition);

        if (muzzleInWall) {
            return;
        }

        // Find target
        let target = <Vector2>[
            transformedMuzzlePosition[0] + transformedMuzzleDirection[0] * 1000,
            transformedMuzzlePosition[1] + transformedMuzzleDirection[1] * 1000,
        ];

        // Do raycast against map
        const mapCollision = this.scene.map.raycast(transformedMuzzlePosition, target);

        if (mapCollision) {
            target = mapCollision.position;
        }

        // Do raycast against stickmen
        let hitStickman = null;
        for (const stickman of this.scene.getStickmen()) {
            const stickmanCollision = stickman.raycast(transformedMuzzlePosition, target);

            if (stickmanCollision) {
                target = stickmanCollision.position;
                hitStickman = stickman;
            }
        }

        // Add trail
        this.scene.bulletTrails.addTrail('bullet', transformedMuzzlePosition, target);

        // Make smoke particles
        for (let i = 0; i < 2; i++) {
            this.scene.particles.addParticle('smoke', transformedMuzzlePosition, [100*transformedMuzzleDirection[0]+Math.random()*50, 100*transformedMuzzleDirection[1]+Math.random()*50]);
        }

        // Add recoil
        this.recoil += 20;
    }

    draw(context: Context2D, position: Vector2, facingLeft: boolean, pitch: number) {
        context.save();
        context.translate(position[0], position[1]);
        if (facingLeft) {
            context.scale(-1, 1);
        }
        context.rotate(pitch);
        context.translate(-this.recoil, 0);
        context.drawImage(this.image.image, this.imageOffset[0], this.imageOffset[1]);
        context.restore();
    }

    getHandPositions(): [Vector2, Vector2] {
        return [
            [this.leftHandPosition[0] - this.recoil, this.leftHandPosition[1]],
            [this.rightHandPosition[0] - this.recoil, this.rightHandPosition[1]],
        ];
    }
}

export class MachineGun extends BaseGun {
    static image = new Assets.ImageAsset('weapons/machinegun.png');

    image = MachineGun.image;
    imageOffset = <Vector2>[-30, 30];
    leftHandPosition = <Vector2>[85, 45];
    rightHandPosition = <Vector2>[40, 45];
    muzzlePosition = <Vector2>[120, 2];
}

}

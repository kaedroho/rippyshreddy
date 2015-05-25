class BaseWeapon {
    tick(dt: number, isAttacking: boolean): void {};
    draw(context: Context2D, position: Vector2, facingLeft: boolean, pitch: number): void {}
    getHandPositions(): [Vector2, Vector2] { return [null, null]; }
}

class BaseGun extends BaseWeapon {
    protected image: Assets.ImageAsset;
    protected imageOffset: Vector2 = [0, 0];
    protected leftHandPosition: Vector2 = [0, 0];
    protected rightHandPosition: Vector2 = [0, 0];
    private recoil: number = 0;

    tick(dt: number, isAttacking: boolean) {
        this.recoil -= dt * 200;
        if (this.recoil < 0) {
            if (isAttacking) {
                this.recoil = 20;
            } else {
                this.recoil = 0;
            }
        }
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

class MachineGun extends BaseGun {
    static image = new Assets.ImageAsset('weapons/machinegun.png');

    image = MachineGun.image;
    imageOffset = <Vector2>[-30, 30];
    leftHandPosition = <Vector2>[85, 45];
    rightHandPosition = <Vector2>[40, 45];
}

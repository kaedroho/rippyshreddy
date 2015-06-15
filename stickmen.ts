/// <reference path="lib/types.ts" />
/// <reference path="players.ts" />
/// <reference path="scene.ts" />
/// <reference path="weapons.ts" />

module RippyShreddy {

function calculateJoint(p1: Vector2, p2: Vector2, length: number, invert: number): Vector2 {
    // Work out middle
    const midX = (p1[0] + p2[0]) / 2;
    const midY = (p1[1] + p2[1]) / 2;

    // Work out distance to middle
    const midDistX = midX - p1[0];
    const midDistY = midY - p1[1];

    // Work out position
    const angle = Math.atan2(midDistY, midDistX);
    const distSquared = midDistX * midDistX + midDistY * midDistY;
    const jointHeight = Math.sqrt(Math.abs(length * length - distSquared));
    const jointAngle = angle + Math.atan2(jointHeight, Math.sqrt(distSquared)) * invert;
    const pos = <Vector2>[0, 0];
    pos[0] = p1[0] + length * Math.cos(jointAngle);
    pos[1] = p1[1] + length * Math.sin(jointAngle);

    return pos;
};

export class Stickman {
    private posX: number = 10;
    private posY: number = -100;
    private velX: number = 0;
    private velY: number = 0;
    private scene: Scene;
    public player: Player;
    private weapon: BaseWeapon;

    private movePhase: number = 0;
    private duckTransition: number = 0;
    private pitch: number = 0;
    private facingLeft: boolean = false;

    constructor(scene: Scene, player: Player) {
        this.scene = scene;
        this.player = player;
        this.weapon = new MachineGun(scene, player);
    }

    tick(dt: number) {
        // Ducking
        const ducking = this.player.input.duck;
        const duckDistanceLeft = Math.abs((ducking ? 1 : 0) - this.duckTransition);
        const duckSpeed = duckDistanceLeft * dt * 10;

        // Update duck transition
        if (ducking) {
            this.duckTransition += duckSpeed;
        } else {
            this.duckTransition -= duckSpeed;
        }

        if (this.duckTransition < 0) {
            // Ducking
            this.duckTransition = 0;
        } else if (this.duckTransition > 1) {
            // Standing
            this.duckTransition = 1;
        }

        // Velocity
        this.velX = this.player.input.move / (1 + this.duckTransition) * 450;
        this.velY += dt * 2000;

        // Limit velocity to 2000 units/second
        if (Math.abs(this.velX) > 2000) {
            if (this.velX > 0) {
                this.velX = 2000;
            } else {
                this.velX = -2000;
            }
        }
        if (Math.abs(this.velY) > 2000) {
            if (this.velY > 0) {
                this.velY = 2000;
            } else {
                this.velY = -2000;
            }
        }

        const neckHeight = 100 - 25 * this.duckTransition;
        const hipHeight = 75 - 25 * this.duckTransition;
        const height = neckHeight + hipHeight + 60;

        // X position
        const oldPosX = this.posX;
        this.posX += this.velX * dt;

        if (this.posX !== oldPosX) {
            const movingRight = this.posX > oldPosX;
            let collided = false;

            let firstRow = (this.posY - height) / 64;
            let lastRow = this.posY / 64;

            const column = movingRight ?  Math.floor((this.posX + 25) / 64) :  Math.floor((this.posX - 25) / 64);

            firstRow = Math.floor(firstRow);

            if (lastRow === Math.floor(lastRow)) {
                lastRow -= 0.01;
            }
            lastRow = Math.floor(lastRow);

            for (var row = firstRow; row < lastRow + 1; row++) {
                if (this.scene.map.getTile(column, row) > 0) {
                    collided = true;
                    break;
                }
            }

            if (collided) {
                this.posX = column * 64;
                if (movingRight) {
                    this.posX -= 25.001;
                } else {
                    this.posX += 64;
                    this.posX += 25.001;
                }
                this.velX = 0;
            }
        }

        // Y position
        const oldPosY = this.posY;
        this.posY += this.velY * dt;
        let onFloor = false;

        if (this.posY !== oldPosY) {
            const movingDown = this.posY > oldPosY;
            let collided = false;
            let firstColumn = (this.posX - 25) / 64;
            let lastColumn = (this.posX + 25) / 64;
            const row = movingDown ? Math.floor(this.posY / 64) : Math.floor((this.posY - height) / 64);

            firstColumn = Math.floor(firstColumn);

            if (lastColumn === Math.floor(lastColumn)) {
                lastColumn -= 0.01;
            }
            lastColumn = Math.floor(lastColumn);

            for (var column = firstColumn; column < lastColumn + 1; column++) {
                if (this.scene.map.getTile(column, row) > 0) {
                    collided = true;
                    break;
                }
            }

            if (collided) {
                onFloor = movingDown;
                this.posY = row * 64;
                if (movingDown) {
                    this.posY -= 0.001;
                } else {
                    this.posY += 64;
                    this.posY += height + 0.001;
                }
                this.velY = 0;
            }
        }

        if (onFloor && this.player.input.jump) {
            this.velY -= 1400;
            onFloor = false;
        }

        const neckPositionX = this.posX;
        const neckPositionY = this.posY - neckHeight - hipHeight;

        // Targeting
        const target = this.player.input.lookAt;
        if (target) {
            const targetX = target[0];
            const targetY = target[1];

            // Get difference between position and target
            const diffX = targetX - neckPositionX;
            const diffY = targetY - neckPositionY;

            // Direction
            this.facingLeft = diffX < 0;

            // Find the distance
            const distance = Math.sqrt(diffX * diffX + diffY * diffY);

            // Work out the muzzle height
            const muzzleHeight = 40;

            // Find the angle (40 is the how low the gun is held below the neck)
            this.pitch = Math.atan2(diffY, Math.abs(diffX)) - Math.asin(muzzleHeight / distance);

            // Prevent NaN
            if (!this.pitch) {
                this.pitch = 0;
            }
        }

        // Update weapon
        if (this.weapon) {
            this.weapon.tick(dt, this.player.input.attack, [neckPositionX, neckPositionY], this.facingLeft, this.pitch);
        }

        // Move phase
        if (onFloor) {
            let legSpeed = this.velX * dt * (1 + this.duckTransition * 0.5) / 30;
            if (this.player.input.move < 0) {
                legSpeed *= -1;
            }
            this.movePhase += legSpeed;
        } else {
            this.movePhase = Math.PI / 8;
        }
    }

    draw(context: Context2D, at: number) {
        const duckTransition = this.duckTransition;
        const neckHeight = 100 - 35 * duckTransition;
        const hipHeight = 75 - 30 * duckTransition;
        const legHeight = 40;

        const hipPositionX = 0;
        const hipPositionY = -hipHeight;

        const neckPositionX = hipPositionX;
        const neckPositionY = hipPositionY - neckHeight;

        // TODO: Add recoil to neck position

        const middlePositionX = (hipPositionX + neckPositionX) / 2;
        const middlePositionY = (hipPositionY + neckPositionY) / 2;

        // Legs

        let leftFootPositionX = -20;
        let leftFootPositionY = 0;
        let rightFootPositionX = 20;
        let rightFootPositionY = 0;

        const movingLeft = this.player.input.move < 0;
        const movingRight = this.player.input.move > 0;
        const moving = movingLeft || movingRight
        const running = 1;

        if (this.player.input.move != 0) {
            const movePhase = this.movePhase + at * 15;

            leftFootPositionX = Math.sin(-this.movePhase) * hipPositionY / 2;
            rightFootPositionX = Math.sin(-this.movePhase + Math.PI) * hipPositionY / 2;

            leftFootPositionY = Math.cos(-this.movePhase) * hipPositionY / 4 + (hipPositionY / 8) * running;
            rightFootPositionY = Math.cos(-this.movePhase + Math.PI) * hipPositionY / 4 + (hipPositionY / 8) * running;
        }

        // Work out knee inversion
        const leftKneeInversion = moving ? -1: 1;
        const rightKneeInversion = -1;

        // Work out knee positions
        let [leftKneePositionX, leftKneePositionY] = calculateJoint(
            [hipPositionX, hipPositionY],
            [leftFootPositionX, leftFootPositionY],
            legHeight, leftKneeInversion);
        let [rightKneePositionX, rightKneePositionY] = calculateJoint(
            [hipPositionX, hipPositionY],
            [rightFootPositionX, rightFootPositionY],
            legHeight, rightKneeInversion);

        if (movingLeft) {
            // Reverse leg direction
            leftFootPositionX = -leftFootPositionX;
            rightFootPositionX = -rightFootPositionX;
            leftKneePositionX = -leftKneePositionX;
            rightKneePositionX = -rightKneePositionX;
        }

        // Arms

        // Hands
        let leftHandPosition = <Vector2>[30, 40];
        let rightHandPosition = <Vector2>[30, 40];

        if (this.weapon) {
            const handPositions = this.weapon.getHandPositions();
            leftHandPosition = handPositions[0];
            rightHandPosition = handPositions[1];
        }

        // Elbows
        let leftElbowPosition = calculateJoint(
            [0, 0],
            leftHandPosition,
            55, 1);
        let rightElbowPosition = calculateJoint(
            [0, 0],
            rightHandPosition,
            55, 1);

        let headPosition = <Vector2>[0, -30];

        // Rotate
        function rotate(vector: Vector2, a: number, b: number) {
            const x = vector[0], y = vector[1];
            vector[0] = x * b - y * a;
            vector[1] = x * a + y * b;
        }

        var a = Math.sin(this.pitch);
        var b = Math.cos(this.pitch);
        rotate(leftHandPosition, a, b);
        rotate(rightHandPosition, a, b);
        rotate(leftElbowPosition, a, b);
        rotate(rightElbowPosition, a, b);
        rotate(headPosition, a, b);

        // Invert if facing left
        if (this.facingLeft) {
            leftElbowPosition[0] = -leftElbowPosition[0];
            rightElbowPosition[0] = -rightElbowPosition[0];
            leftHandPosition[0] = -leftHandPosition[0];
            rightHandPosition[0] = -rightHandPosition[0];
            headPosition[0] = -headPosition[0];
        }

        // Translate
        leftHandPosition[0] += neckPositionX;
        leftHandPosition[1] += neckPositionY;
        rightHandPosition[0] += neckPositionX;
        rightHandPosition[1] += neckPositionY;
        leftElbowPosition[0] += neckPositionX;
        leftElbowPosition[1] += neckPositionY;
        rightElbowPosition[0] += neckPositionX;
        rightElbowPosition[1] += neckPositionY;
        headPosition[0] += neckPositionX;
        headPosition[1] += neckPositionY;

        context.save();
        context.translate(this.posX + this.velX * at, this.posY + this.velY * at);

        // Draw weapon
        if (this.weapon) {
            this.weapon.draw(context, [neckPositionX, neckPositionY], this.facingLeft, this.pitch);
        }

        context.lineWidth = 10;
        context.lineJoin = 'round';
        context.lineCap = 'round';

        context.beginPath();
        context.moveTo(leftFootPositionX, leftFootPositionY);
        context.lineTo(leftKneePositionX, leftKneePositionY);
        context.lineTo(hipPositionX, hipPositionY);

        context.moveTo(rightFootPositionX, rightFootPositionY);
        context.lineTo(rightKneePositionX, rightKneePositionY);
        context.lineTo(hipPositionX, hipPositionY);

        context.moveTo(leftHandPosition[0], leftHandPosition[1]);
        context.lineTo(leftElbowPosition[0], leftElbowPosition[1]);
        context.lineTo(neckPositionX, neckPositionY);

        context.moveTo(rightHandPosition[0], rightHandPosition[1]);
        context.lineTo(rightElbowPosition[0], rightElbowPosition[1]);
        context.lineTo(neckPositionX, neckPositionY);

        context.moveTo(neckPositionX, neckPositionY);
        context.lineTo(hipPositionX, hipPositionY);

        context.stroke();

        // Draw head
        context.beginPath();
        context.arc(headPosition[0], headPosition[1], 30, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }

    getCentroid() {
        const neckHeight = 100 - 25 * this.duckTransition;
        const hipHeight = 75 - 25 * this.duckTransition;
        const height = neckHeight + hipHeight + 60;

        const position = this.getPosition();
        position[1] -= height / 2;
        return position;
    }

    getPosition(): [number, number] {
        return [this.posX, this.posY]
    }
}

}

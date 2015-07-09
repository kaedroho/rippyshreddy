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

    buildSkeleton(at: number = 0) {
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

        return {
            leftFoot: <Vector2>[leftFootPositionX, leftFootPositionY],
            rightFoot: <Vector2>[rightFootPositionX, rightFootPositionY],
            leftKnee: <Vector2>[leftKneePositionX, leftKneePositionY],
            rightKnee: <Vector2>[rightKneePositionX, rightKneePositionY],
            hip: <Vector2>[hipPositionX, hipPositionY],
            neck: <Vector2>[neckPositionX, neckPositionY],
            leftElbow: leftElbowPosition,
            rightElbow: rightElbowPosition,
            leftHand: leftHandPosition,
            rightHand: rightHandPosition,
            head: headPosition,
        }
    }

    draw(context: Context2D, at: number) {
        const skel = this.buildSkeleton(at);

        context.save();
        context.translate(this.posX + this.velX * at, this.posY + this.velY * at);

        // Draw weapon
        if (this.weapon) {
            this.weapon.draw(context, skel.neck, this.facingLeft, this.pitch);
        }

        context.lineWidth = 10;
        context.lineJoin = 'round';
        context.lineCap = 'round';

        context.beginPath();
        context.moveTo(skel.leftFoot[0], skel.leftFoot[1]);
        context.lineTo(skel.leftKnee[0], skel.leftKnee[1]);
        context.lineTo(skel.hip[0], skel.hip[1]);

        context.moveTo(skel.rightFoot[0], skel.rightFoot[1]);
        context.lineTo(skel.rightKnee[0], skel.rightKnee[1]);
        context.lineTo(skel.hip[0], skel.hip[1]);

        context.moveTo(skel.leftHand[0], skel.leftHand[1]);
        context.lineTo(skel.leftElbow[0], skel.leftElbow[1]);
        context.lineTo(skel.neck[0], skel.neck[1]);

        context.moveTo(skel.rightHand[0], skel.rightHand[1]);
        context.lineTo(skel.rightElbow[0], skel.rightElbow[1]);
        context.lineTo(skel.neck[0], skel.neck[1]);

        context.lineTo(skel.neck[0], skel.neck[1]);
        context.lineTo(skel.hip[0], skel.hip[1]);

        context.stroke();

        // Draw head
        context.beginPath();
        context.arc(skel.head[0], skel.head[1], 30, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }

    raycast(from: Vector2, to: Vector2): CollisionResult {
        // Build a skeleton from the stickman
        const skel = this.buildSkeleton();

        // The from/to vectors are in global space but the skeleton is not
        // convert from and to to stickman-space
        from = [from[0] - this.posX, from[1] - this.posY];
        to = [to[0] - this.posX, to[1] - this.posY]

        // A couple of raycast helpers
        function raycastLine(from: Vector2, to: Vector2, lineFrom: Vector2, lineTo: Vector2): CollisionResult {
            // http://processingjs.org/learning/custom/intersect/

            const x1 = lineFrom[0];
            const y1 = lineFrom[1];
            const x2 = lineTo[0];
            const y2 = lineTo[1];
            const x3 = from[0];
            const y3 = from[1];
            const x4 = to[0];
            const y4 = to[1];

            let a1, a2, b1, b2, c1, c2;
            let r1, r2, r3, r4;
            let denom, offset, num;
            let x, y;

            // Compute a1, b1, c1, where line joining points 1 and 2
            // is "a1 x + b1 y + c1 = 0".
            a1 = y2 - y1;
            b1 = x1 - x2;
            c1 = (x2 * y1) - (x1 * y2);

            // Compute r3 and r4.
            r3 = ((a1 * x3) + (b1 * y3) + c1);
            r4 = ((a1 * x4) + (b1 * y4) + c1);

            // Check signs of r3 and r4. If both point 3 and point 4 lie on
            // same side of line 1, the line segments do not intersect.
            if ((r3 != 0) && (r4 != 0) && ((r3 * r4) >= 0)) {
                return;
            }

            // Compute a2, b2, c2
            a2 = y4 - y3;
            b2 = x3 - x4;
            c2 = (x4 * y3) - (x3 * y4);

            // Compute r1 and r2
            r1 = (a2 * x1) + (b2 * y1) + c2;
            r2 = (a2 * x2) + (b2 * y2) + c2;

            // Check signs of r1 and r2. If both point 1 and point 2 lie
            // on same side of second line segment, the line segments do
            // not intersect.
            if ((r1 != 0) && (r2 != 0) && ((r1 * r2) >= 0)) {
                return;
            }

            // Line segments intersect: compute intersection point.
            denom = (a1 * b2) - (a2 * b1);

            if (denom == 0) {
                return; // Co linear
            }

            if (denom < 0){
                offset = -denom / 2;
            } else {
                offset = denom / 2 ;
            }

            // The denom/2 is to get rounding instead of truncating. It
            // is added or subtracted to the numerator, depending upon the
            // sign of the numerator.
            num = (b1 * c2) - (b2 * c1);
            if (num < 0) {
                x = (num - offset) / denom;
            } else {
                x = (num + offset) / denom;
            }

            num = (a2 * c1) - (a1 * c2);
            if (num < 0) {
                y = ( num - offset) / denom;
            } else {
                y = (num + offset) / denom;
            }

            // Lines intersect
            return {
                position: [x, y],
                normal: [0, 0],
            }
        }

        function raycastCircle(from: Vector2, to: Vector2, circleCentre: Vector2, circleRadius: number): CollisionResult {
            return;
        }

        // Collision handler
        // This gets called with the result of each raycast and is responsible
        // for changing the currentTarget and currentCollision variables when
        // a collision occurs
        let currentTarget = to;
        let currentCollision: CollisionResult = null;
        function handleCollision(collision: CollisionResult, part: string) {
            if (collision) {
                currentCollision = collision;
                currentCollision['part'] = part;
                currentTarget = collision.position;
            }
        }

        // Run raycast against each part. Call handleCollision with the result
        handleCollision(raycastLine(from, currentTarget, skel.leftFoot, skel.leftKnee), 'lowerLeftLeg');
        handleCollision(raycastLine(from, currentTarget, skel.rightFoot, skel.rightKnee), 'lowerRightleg');
        handleCollision(raycastLine(from, currentTarget, skel.leftKnee, skel.hip), 'upperLeftLeg');
        handleCollision(raycastLine(from, currentTarget, skel.rightKnee, skel.hip), 'upperRightLeg');
        handleCollision(raycastLine(from, currentTarget, skel.hip, skel.neck), 'body');
        handleCollision(raycastLine(from, currentTarget, skel.neck, skel.leftElbow), 'upperLeftArm');
        handleCollision(raycastLine(from, currentTarget, skel.neck, skel.rightElbow), 'upperRightArm');
        handleCollision(raycastLine(from, currentTarget, skel.leftElbow, skel.leftHand), 'lowerLeftArm');
        handleCollision(raycastLine(from, currentTarget, skel.rightElbow, skel.rightHand), 'lowerRightArm');
        handleCollision(raycastLine(from, currentTarget, skel.rightElbow, skel.rightHand), 'head');

        // Convert collision coordinates into global space
        if (currentCollision) {
            currentCollision.position[0] += this.posX;
            currentCollision.position[1] += this.posY;
        }

        return currentCollision;
    }

    damage(part: string, amount) {
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
        return [this.posX, this.posY];
    }

    setPosition(position: [number, number]) {
        this.posX = position[0];
        this.posY = position[1];
    }
}

}

import {Vector2, Context2D, CollisionResult} from "./lib/types";
import {stringEndsWith} from "./lib/helpers";
import {Player} from "./players";
import Scene from "./scene";
import {BaseWeapon, MachineGun} from "./weapons";


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


class StickmanPart {
    public health: number;
    public exists: boolean;

    constructor(public initialHealth: number) {
        this.reset();
    }

    reset() {
        this.exists = true;
        this.health = this.initialHealth;
    }
}


export default class Stickman {
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

    private parts: {[name: string]: StickmanPart;} = {
        head: new StickmanPart(200),
        upperBody: new StickmanPart(200),
        lowerBody: new StickmanPart(200),
        leftArm: new StickmanPart(100),
        rightArm: new StickmanPart(100),
        leftLeg: new StickmanPart(100),
        rightLeg: new StickmanPart(100),
    };

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
        const neckPositionY = this.posY - this.getHeights().neck;

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

    getHeights(): {base: number, hip: number, neck: number} {
        const duckTransition = this.duckTransition;
        const neckHeight = 100 - 35 * duckTransition;
        const hipHeight = 75 - 30 * duckTransition;
        let baseHeight = 0;

        if (!this.parts['lowerBody'].exists) {
            // No legs or lower body
            baseHeight = -(hipHeight + neckHeight / 2);
        } else if (!this.parts['leftLeg'].exists && !this.parts['rightLeg'].exists) {
            // No legs
            baseHeight = -hipHeight;
        }

        return {
            base: baseHeight,
            hip: baseHeight + hipHeight,
            neck: baseHeight + hipHeight + neckHeight,
        };
    }

    buildSkeleton(at: number = 0) {
        const heights = this.getHeights();
        const legHeight = 40;

        const hipPositionX = 0;
        const hipPositionY = -heights.hip;

        const neckPositionX = hipPositionX;
        const neckPositionY = -heights.neck;

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
            middle: <Vector2>[(hipPositionX + neckPositionX) / 2, (hipPositionY + neckPositionY) / 2],
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

        // Legs
        if (this.parts['leftLeg'].exists) {
            context.moveTo(skel.leftFoot[0], skel.leftFoot[1]);
            context.lineTo(skel.leftKnee[0], skel.leftKnee[1]);
            context.lineTo(skel.hip[0], skel.hip[1]);
        }

        if (this.parts['rightLeg'].exists) {
            context.moveTo(skel.rightFoot[0], skel.rightFoot[1]);
            context.lineTo(skel.rightKnee[0], skel.rightKnee[1]);
            context.lineTo(skel.hip[0], skel.hip[1]);
        }

        // Arms
        if (this.parts['leftArm'].exists) {
            context.moveTo(skel.leftHand[0], skel.leftHand[1]);
            context.lineTo(skel.leftElbow[0], skel.leftElbow[1]);
            context.lineTo(skel.neck[0], skel.neck[1]);
        }

        if (this.parts['rightArm'].exists) {
            context.moveTo(skel.rightHand[0], skel.rightHand[1]);
            context.lineTo(skel.rightElbow[0], skel.rightElbow[1]);
            context.lineTo(skel.neck[0], skel.neck[1]);
        }

        // Body
        if (this.parts['upperBody'].exists && this.parts['lowerBody'].exists) {
            context.moveTo(skel.neck[0], skel.neck[1]);
            context.lineTo(skel.hip[0], skel.hip[1]);
        } else if (this.parts['upperBody'].exists) {
            context.moveTo(skel.neck[0], skel.neck[1]);
            context.lineTo(skel.middle[0], skel.middle[1]);
        } else if (this.parts['lowerBody'].exists) {
            context.moveTo(skel.middle[0], skel.middle[1]);
            context.lineTo(skel.hip[0], skel.hip[1]);
        }

        context.stroke();

        // Head
        if (this.parts['head'].exists) {
            context.beginPath();
            context.arc(skel.head[0], skel.head[1], 30, 0, Math.PI * 2);
            context.fill();
        }

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

            let a1: number, a2: number, b1: number, b2: number, c1: number, c2: number;
            let r1: number, r2: number, r3: number, r4: number;
            let denom: number, offset: number, num: number;
            let x: number, y: number;

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

        const checkCollision = (partName: string, checker: () => CollisionResult) => {
            // Make sure the part exists first
            if (!this.parts[partName].exists) {
                return;
            }

            // Check collision
            const collision = checker();

            if (collision) {
                currentCollision = collision;
                currentCollision['partName'] = partName;
                currentTarget = collision.position;
            }
        }

        // Run raycast against each part.
        checkCollision('head', () => raycastCircle(from, currentTarget, skel.neck, 30));
        checkCollision('upperBody', () => raycastLine(from, currentTarget, skel.middle, skel.neck));
        checkCollision('lowerBody', () => raycastLine(from, currentTarget, skel.hip, skel.middle));
        checkCollision('leftArm', () => raycastLine(from, currentTarget, skel.neck, skel.leftElbow));
        checkCollision('leftArm', () => raycastLine(from, currentTarget, skel.leftElbow, skel.leftHand));
        checkCollision('rightArm', () => raycastLine(from, currentTarget, skel.neck, skel.rightElbow));
        checkCollision('rightArm', () => raycastLine(from, currentTarget, skel.rightElbow, skel.rightHand));
        checkCollision('leftLeg', () => raycastLine(from, currentTarget, skel.leftFoot, skel.leftKnee));
        checkCollision('leftLeg', () => raycastLine(from, currentTarget, skel.leftKnee, skel.hip));
        checkCollision('rightLeg', () => raycastLine(from, currentTarget, skel.rightFoot, skel.rightKnee));
        checkCollision('rightLeg', () => raycastLine(from, currentTarget, skel.rightKnee, skel.hip));

        // Convert collision coordinates into global space
        if (currentCollision) {
            currentCollision.position[0] += this.posX;
            currentCollision.position[1] += this.posY;
        }

        return currentCollision;
    }

    damage(partName: string, amount: number) {
        const part = this.parts[partName];
        part.health -= amount;

        if (part.health < 0) {
            part.health = 0;
        }

        if (part.exists && part.health === 0) {
            // Record base height
            const oldBaseHeight = this.getHeights().base;

            // Remove part
            part.exists = false;

            // Adjust position if the base height has changed
            // If the legs are blown off, the players origin moves the hip
            // from the feet. When this happens, we need to lift the player
            // off the ground so they fall into the new position.
            this.posY += this.getHeights().base - oldBaseHeight;

            // Create a limb fragment
            const skel = this.buildSkeleton();

            const linePart = (from: Vector2, to: Vector2): {type: string, params: {fromX: number, fromY: number, toX: number, toY: number}} => {
                return {
                    type: 'line',
                    params: {
                        fromX: this.posX + from[0],
                        fromY: this.posY + from[1],
                        toX: this.posX + to[0],
                        toY: this.posY + to[1],
                    }
                };
            }

            const circlePart = (position: Vector2, radius: number): {type: string, params: {posX: number, posY: number, radius: number}} => {
                return {
                    type: 'circle',
                    params: {
                        posX: this.posX + position[0],
                        posY: this.posY + position[1],
                        radius: radius
                    }
                };
            }

            if (partName === 'head') {
                this.scene.limbFrags.addFragment([
                    circlePart(skel.head, 30),
                ]);
            } else if (partName === 'upperBody') {
                this.scene.limbFrags.addFragment([
                    linePart(skel.neck, skel.middle),
                ]);
            } else if (partName === 'lowerBody') {
                this.scene.limbFrags.addFragment([
                    linePart(skel.middle, skel.hip),
                ]);
            } else if (partName === 'leftLeg') {
                this.scene.limbFrags.addFragment([
                    linePart(skel.hip, skel.leftKnee),
                    linePart(skel.leftKnee, skel.leftFoot),
                ]);
            } else if (partName === 'rightLeg') {
                this.scene.limbFrags.addFragment([
                    linePart(skel.hip, skel.rightKnee),
                    linePart(skel.rightKnee, skel.rightFoot),
                ]);
            } else if (partName === 'leftArm') {
                this.scene.limbFrags.addFragment([
                    linePart(skel.neck, skel.leftElbow),
                    linePart(skel.leftElbow, skel.leftHand),
                ]);
            } else if (partName === 'rightArm') {
                this.scene.limbFrags.addFragment([
                    linePart(skel.neck, skel.rightElbow),
                    linePart(skel.rightElbow, skel.rightHand),
                ]);
            }
        }
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

    getVelocity(): [number, number] {
        return [this.velX, this.velY];
    }

    setVelocity(velocity: [number, number]) {
        this.velX = velocity[0];
        this.velY = velocity[1];
    }

    getHealth(): {[name: string]: number} {
        let partHealth: {[name: string]: number} = {};

        for (let partName in this.parts) {
            partHealth[partName] = this.parts[partName].health;
        }

        return partHealth;
    }

    setHealth(partHealth: {[name: string]: number}) {
        for (let partName in partHealth) {
            this.parts[partName].health = partHealth[partName];
            this.parts[partName].exists = partHealth[partName] !== 0;
        }
    }
}

class Camera {
    private posX: number = 0;
    private posY: number = 0;
    private posZ: number = 0;

    private velX: number = 0;
    private velY: number = 0;
    private velZ: number = 0;

    private targetX: number = null;
    private targetY: number = null;
    private targetZ: number = null;

    constructor(x: number, y: number, z: number) {
        this.posX = x;
        this.posY = y;
        this.posZ = z;
    }

    setPosition(x: number, y: number, z: number) {
        this.posX = x;
        this.posY = y;
        this.posZ = z;
        this.velX = 0;
        this.velY = 0;
        this.velZ = 0;
        this.targetX = null;
        this.targetY = null;
        this.targetZ = null;
    }

    moveTo(x: number, y: number, z: number) {
        this.targetX = x;
        this.targetY = y;
        this.targetZ = z;
    }

    private updateAxisVelocity(pos: number, vel: number, target: number, dt: number): number {
        return (target) ? (target - pos) * 10 : 0;
    }

    update(dt: number) {
        this.velX = this.updateAxisVelocity(this.posX, this.velX, this.targetX, dt);
        this.velY = this.updateAxisVelocity(this.posY, this.velY, this.targetY, dt);
        this.velZ = this.updateAxisVelocity(this.posZ, this.velZ, this.targetZ, dt);

        this.posX += this.velX * dt;
        this.posY += this.velY * dt;
        this.posZ += this.velZ * dt;
    }

    transformContext(context: Context2D, at: number) {
        const posX = this.posX + this.velX * at;
        const posY = this.posY + this.velY * at;
        const posZ = this.posZ + this.velZ * at;
        const canvas = context.canvas;
        const scale = 1 / (posZ /  Math.max(canvas.width, canvas.height * (16/9.0)));

        context.translate(canvas.width/2, canvas.height/2);
        context.scale(scale, scale);
        context.translate(-posX, -posY);
    }

    screenToScene(canvas: HTMLCanvasElement, x: number, y: number) {
        const scale = this.posZ / ( Math.max(canvas.width, canvas.height * (16/9.0)));

        return [
            (x - canvas.width/2) * scale + this.posX,
            (y - canvas.height/2) * scale + this.posY,
       ];
    }
}

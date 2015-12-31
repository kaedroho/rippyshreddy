import {Context2D} from "../lib/types";


const MAX_LIFE = 10;


interface LimbFragmentPart {
    draw(context: Context2D);
}


class LimbFragmentLine implements LimbFragmentPart {
    constructor(public fromX: number, public fromY: number, public toX: number, public toY: number) {
    }

    draw(context: Context2D) {
        context.beginPath();
        context.moveTo(this.fromX, this.fromY);
        context.lineTo(this.toX, this.toY);
        context.stroke();
    }
}


class LimbFragmentCircle implements LimbFragmentPart {
    constructor(public posX: number, public posY: number, public radius: number) {
    }

    draw(context: Context2D) {
    }
}


interface LimbFragment {
    parts: LimbFragmentPart[];
    posX: number;
    posY: number;
    velX: number;
    velY: number;
    life: number;
}

function drawFragment(frag: LimbFragment, context: Context2D) {
    context.save();
    context.translate(frag.posX, frag.posY);

    context.lineWidth = 10;
    context.lineJoin = 'round';
    context.lineCap = 'round';

    // Fading
    if (frag.life < (MAX_LIFE / 2)) {
        context.globalAlpha = frag.life / (MAX_LIFE / 2);
    }

    for (const part of frag.parts) {
        part.draw(context);
    }

    context.restore();
}


export default class LimbFragmentEngine {
    private frags: LimbFragment[] = [];

    addFragment(partData: [{type: string, params: {}}], velX: number = 0, velY: number = 0) {
        let posX = 0;
        let posY = 0;

        let parts = partData.map(function(data): LimbFragmentPart {
            if (data.type == 'line') {
                posX += (data.params['fromX'] + data.params['toX']) / 2;
                posY += (data.params['fromY'] + data.params['toY']) / 2;
                return new LimbFragmentLine(data.params['fromX'], data.params['fromY'], data.params['toX'], data.params['toY']);
            } else if (data.type == 'circle') {
                posX += data.params['posX'];
                return new LimbFragmentCircle(data.params['posX'], data.params['posY'], data.params['radius']);
            }
        })

        // Work out position (average of all part positions)
        posX /= parts.length;
        posY /= parts.length;

        // Subtract position from each part position to make them relative
        for (let part of parts) {
            if (part instanceof LimbFragmentLine) {
                part.fromX -= posX;
                part.fromY -= posY;
                part.toX -= posX;
                part.toY -= posY;
            } else if (part instanceof LimbFragmentCircle) {
                part.posX -= posX;
                part.posY -= posY;
            }
        }

        this.frags.push({
            parts: parts,
            posX: posX,
            posY: posY,
            velX: velX,
            velY: velY,
            life: MAX_LIFE,
        });
    }

    tick(dt: number) {
        // Move particles
        for (const frag of this.frags) {
            if (frag.life > 0) {
                // Gravity
                frag.velY += 1000 * dt;

                // Damping
                const applyDamping = function(velocity: number, damping: number, dt: number) {
                    const force = (-velocity *  damping) ^ 0.5;
                    return velocity + force * dt;
                }
                frag.velX = applyDamping(frag.velX, 0.1, dt);
                frag.velY = applyDamping(frag.velY, 0.1, dt);

                // Apply velocity to position
                frag.posX += frag.velX * dt;
                frag.posY += frag.velY * dt;

                // Update life
                frag.life -= dt;
            }
        }
    }

    draw(context: Context2D, at: number) {
        context.save();

        for (const frag of this.frags) {
            if (frag.life > 0) {
                drawFragment(frag, context);
            }
        }

        context.restore();
    }
}

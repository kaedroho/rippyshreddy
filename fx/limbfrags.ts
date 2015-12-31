import {Vector2, Context2D} from "../lib/types";

const MAX_LIFE = 10;

interface LimbFragmentPart {
    draw(context: Context2D);
}

class LimbFragmentLine implements LimbFragmentPart {
    constructor(public from: Vector2, public to: Vector2) {

    }

    draw(context: Context2D) {
        context.beginPath();
        context.moveTo(this.from[0], this.from[1]);
        context.lineTo(this.to[0], this.to[1]);
        context.stroke();
    }
}

class LimbFragmentCircle implements LimbFragmentPart {
    constructor(public position: Vector2, public radius: number) {

    }

    draw(context: Context2D) {

    }
}

interface LimbFragment {
    parts: LimbFragmentPart[];
    position: Vector2;
    velocity: Vector2;
    life: number;
}

function drawFragment(frag: LimbFragment, context: Context2D) {
    context.save();
    context.translate(frag.position[0], frag.position[1]);

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

function partFromDict(data: {type: string, params: {}}): LimbFragmentPart {
    if (data.type == 'line') {
        return new LimbFragmentLine(data.params['from'].slice(), data.params['to'].slice());
    } else if (data.type == 'circle') {
        return new LimbFragmentCircle(data.params['position'].slice(), data.params['radius']);
    }
}

export default class LimbFragmentEngine {
    private frags: LimbFragment[] = [];

    addFragment(partData: [{type: string, params: {}}], velocity: Vector2 = [0, 0]) {
        let position = [0, 0];

        let parts = partData.map(function(data): LimbFragmentPart {
            if (data.type == 'line') {
                position[0] += (data.params['from'][0] + data.params['to'][0]) / 2;
                position[1] += (data.params['from'][1] + data.params['to'][1]) / 2;
                return new LimbFragmentLine(data.params['from'].slice(), data.params['to'].slice());
            } else if (data.type == 'circle') {
                position[0] += data.params['position'][0];
                return new LimbFragmentCircle(data.params['position'].slice(), data.params['radius']);
            }
        })

        // Work out position (average of all part positions)
        position = [
            position[0] / parts.length,
            position[1] / parts.length,
        ]

        // Subtract position from each part position to make them relative
        for (let part of parts) {
            if (part instanceof LimbFragmentLine) {
                part.from[0] -= position[0];
                part.from[1] -= position[1];
                part.to[0] -= position[0];
                part.to[1] -= position[1];
            } else if (part instanceof LimbFragmentCircle) {
                part.position[0] -= position[0];
                part.position[1] -= position[1];
            }
        }

        this.frags.push({
            parts: parts,
            position: <Vector2>position,
            velocity: <Vector2>velocity.slice(),
            life: MAX_LIFE,
        });
    }

    tick(dt: number) {
        // Move particles
        for (const frag of this.frags) {
            if (frag.life > 0) {
                // Gravity
                frag.velocity[1] += 1000 * dt;

                // Damping
                const applyDamping = function(velocity: number, damping: number, dt: number) {
                    const force = (-velocity *  damping) ^ 0.5;
                    return velocity + force * dt;
                }
                frag.velocity[0] = applyDamping(frag.velocity[0], 0.1, dt);
                frag.velocity[1] = applyDamping(frag.velocity[1], 0.1, dt);

                // Apply velocity to position
                frag.position[0] += frag.velocity[0] * dt;
                frag.position[1] += frag.velocity[1] * dt;

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

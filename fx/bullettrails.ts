import {Vector2, Context2D} from "../lib/types";


interface BulletTrail {
    type: string;
    start: Vector2;
    dir: Vector2;
    dist: number;
    age: number;
}

export default class BulletTrailEngine {
    private trails: BulletTrail[] = [];

    addTrail(type: string, start: Vector2, end: Vector2) {
        // Get direction vector
        let dir = <Vector2>[
            end[0] - start[0],
            end[1] - start[1]
        ];

        // Calculate distance to target
        const dist = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1]);

        // Normalise direction vector
        dir[0] /= dist;
        dir[1] /= dist;

        // Add trail
        this.trails.push({
            type: type,
            start: <Vector2>start.slice(),
            dir: dir,
            dist: dist,
            age: 0,
        })
    }

    tick(dt: number) {
        for (const trail of this.trails) {
            trail.age += dt;
        }
    }

    draw(context: Context2D, at: number) {
        context.save();
        for (const trail of this.trails) {
            if (trail.age < 0.2) {
                const progress = trail.age * 5 * 1000;

                if (progress < trail.dist) {
                    const endProgress = Math.min(progress + 300, trail.dist)

                    context.globalAlpha = 1 - progress / 1000;

                    context.beginPath();
                    context.moveTo(
                        trail.start[0] + trail.dir[0] * progress,
                        trail.start[1] + trail.dir[1] * progress
                    );
                    context.lineTo(
                        trail.start[0] + trail.dir[0] * endProgress,
                        trail.start[1] + trail.dir[1] * endProgress
                    );
                    context.stroke();
                }
            }
        }
        context.restore();
    }
}

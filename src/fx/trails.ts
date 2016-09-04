import {Context2D} from "../lib/types";


interface Trail {
    type: string;
    startX: number;
    startY: number;
    dirX: number;
    dirY: number;
    dist: number;
    age: number;
}

export default class TrailEngine {
    private trails: Trail[] = [];

    addTrail(type: string, startX: number, startY: number, endX: number, endY: number) {
        // Get direction vector
        let dirX = endX - startX;
        let dirY = endY - startY;

        // Calculate distance to target
        const dist = Math.sqrt(dirX * dirX + dirY * dirY);

        // Normalise direction vector
        dirX /= dist;
        dirY /= dist;

        // Add trail
        this.trails.push({
            type: type,
            startX: startX,
            startY: startY,
            dirX: dirX,
            dirY: dirY,
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
                        trail.startX + trail.dirX * progress,
                        trail.startY + trail.dirY * progress
                    );
                    context.lineTo(
                        trail.startX + trail.dirX * endProgress,
                        trail.startY + trail.dirY * endProgress
                    );
                    context.stroke();
                }
            }
        }
        context.restore();
    }
}

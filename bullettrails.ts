/// <reference path="lib/types.ts" />
/// <reference path="scene.ts" />

module RippyShreddy {

interface BulletTrail {
    type: string;
    start: Vector2;
    end: Vector2;
    age: number;
}

export class BulletTrailEngine {
    private trails: BulletTrail[] = [];

    addTrail(type: string, start: Vector2, end: Vector2) {
        // Add a trail for the bullet
        this.trails.push({
            type: type,
            start: <Vector2>start.slice(),
            end: <Vector2>end.slice(),
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
                const progress = 1 - trail.age * 5;
                context.globalAlpha = progress;
                context.beginPath();
                context.moveTo(
                    trail.start[0] + (trail.end[0] - trail.start[0]) * (1 - progress),
                    trail.start[1] + (trail.end[1] - trail.start[1]) * (1 - progress)
                );
                context.lineTo(
                    trail.start[0] + (trail.end[0] - trail.start[0]) * (1 - (progress - 0.3)),
                    trail.start[1] + (trail.end[1] - trail.start[1]) * (1 - (progress - 0.3))
                );
                context.stroke();
            }
        }
        context.restore();
    }
}

}

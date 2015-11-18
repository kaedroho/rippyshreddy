import {Vector2, Context2D} from "../lib/types";
import * as Assets from "../lib/assets";


interface ParticleType {
    image: Assets.ImageAsset;
    forces: Vector2;
    damping: number;
    maxLife: number;
}

interface Particle {
    type: string;
    position: Vector2;
    velocity: Vector2;
    life: number;
}

export default class ParticleEngine {
    private static particleTypes: { [key: string]: ParticleType } = {
        smoke: {
            image: new Assets.ImageAsset('particles/smoke.png'),
            forces: [0, -30],
            damping: 0.6,
            maxLife: 5,
        },
        blood: {
            image: new Assets.ImageAsset('particles/blood.png'),
            forces: [0, 1000],
            damping: 0.1,
            maxLife: 5,
        }
    }

    private particles: Particle[] = [];

    addParticle(type: string, position: Vector2, velocity: Vector2 = [0, 0]) {
        this.particles.push({
            type: type,
            position: <Vector2>position.slice(),
            velocity: <Vector2>velocity.slice(),
            life: ParticleEngine.particleTypes[type].maxLife,
        });
    }

    tick(dt: number) {
        // Move particles
        for (const particle of this.particles) {
            if (particle.life > 0) {
                // Apply forces to velocity
                const forces = ParticleEngine.particleTypes[particle.type].forces;
                particle.velocity[0] += forces[0] * dt;
                particle.velocity[1] += forces[1] * dt;

                // Apply damping to velocity
                function applyDamping(velocity: number, damping: number, dt: number) {
                    const force = (-velocity *  damping) ^ 0.5;
                    return velocity + force * dt;
                }
                const damping = ParticleEngine.particleTypes[particle.type].damping;
                particle.velocity[0] = applyDamping(particle.velocity[0], damping, dt);
                particle.velocity[1] = applyDamping(particle.velocity[1], damping, dt);

                // Apply velocity to position
                particle.position[0] += particle.velocity[0] * dt;
                particle.position[1] += particle.velocity[1] * dt;

                // Update life
                particle.life -= dt;
            }
        }
    }

    draw(context: Context2D, at: number) {
        context.save();

        // Draw particles
        for (const particle of this.particles) {
            if (particle.life > 0) {
                context.globalAlpha = particle.life / ParticleEngine.particleTypes[particle.type].maxLife;

                const image = ParticleEngine.particleTypes[particle.type].image.image;
                context.drawImage(image, particle.position[0] - image.width / 2, particle.position[1] - image.height / 2);
            }
        }

        context.restore();
    }
}

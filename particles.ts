/// <reference path="lib/types.ts" />
/// <reference path="lib/assets.ts" />

interface ParticleType {
    image: Assets.ImageAsset;
    forces: Vector2;
    damping: number;
}

interface Particle {
    type: string;
    position: Vector2;
    velocity: Vector2;
    life: number;
}

class ParticleEngine {
    private static particleTypes: { [key: string]: ParticleType } = {
        smoke: {
            image: new Assets.ImageAsset('particles/smoke.png'),
            forces: [0, -30],
            damping: 0.6,
        }
    }

    private particles: Particle[] = [];    

    addParticle(type: string, position: Vector2, velocity: Vector2 = [0, 0]) {
        this.particles.push({
            type: type,
            position: <Vector2>position.slice(),
            velocity: <Vector2>velocity.slice(),
            life: 10
        });
    }

    tick(dt: number) {
        // Move particles
        for (const particle of this.particles) {
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
        }
    }

    draw(context: Context2D, at: number) {
        // Draw particles
        for (const particle of this.particles) {
            const image = ParticleEngine.particleTypes[particle.type].image.image;
            context.drawImage(image, particle.position[0] - image.width / 2, particle.position[1] - image.height / 2);
        }
    }
}

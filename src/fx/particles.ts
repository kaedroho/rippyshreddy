import {Context2D} from "../lib/types";
import * as Assets from "../lib/assets";


interface ParticleType {
    image: Assets.ImageAsset;
    forceX: number;
    forceY: number;
    damping: number;
    maxLife: number;
}

interface Particle {
    type: string;
    posX: number;
    posY: number;
    velX: number;
    velY: number;
    life: number;
}

export default class ParticleEngine {
    private static particleTypes: { [key: string]: ParticleType } = {
        smoke: {
            image: new Assets.ImageAsset('particles/smoke.png'),
            forceX: 0,
            forceY: -30,
            damping: 0.6,
            maxLife: 5,
        },
        blood: {
            image: new Assets.ImageAsset('particles/blood.png'),
            forceX: 0,
            forceY: 1000,
            damping: 0.1,
            maxLife: 5,
        }
    }

    private particles: Particle[] = [];

    addParticle(type: string, posX: number, posY: number, velX: number = 0, velY: number = 0) {
        this.particles.push({
            type: type,
            posX: posX,
            posY: posY,
            velX: velX,
            velY: velY,
            life: ParticleEngine.particleTypes[type].maxLife,
        });
    }

    tick(dt: number) {
        // Move particles
        for (const particle of this.particles) {
            if (particle.life > 0) {
                const particleType = ParticleEngine.particleTypes[particle.type];

                // Apply forces to velocity
                particle.velX += particleType.forceX * dt;
                particle.velY += particleType.forceY * dt;

                // Apply damping to velocity
                const applyDamping = function(velocity: number, damping: number, dt: number) {
                    const force = (-velocity *  damping) ^ 0.5;
                    return velocity + force * dt;
                }
                const damping = particleType.damping;
                particle.velX = applyDamping(particle.velX, damping, dt);
                particle.velY = applyDamping(particle.velY, damping, dt);

                // Apply velocity to position
                particle.posX += particle.velX * dt;
                particle.posY += particle.velY * dt;

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
                context.drawImage(image, particle.posX - image.width / 2, particle.posY - image.height / 2);
            }
        }

        context.restore();
    }
}

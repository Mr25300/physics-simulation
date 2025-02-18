import { Simulation } from "../core/simulation.js";
import { Vector2 } from "../math/vector2.js";
import { Obstacle } from "./obstacle.js";
import { Projectile } from "./projectile.js";

export interface CollisionInfo {
    object: Projectile | Obstacle,
    overlap: number,
    normal: Vector2
}

export class CollisionManager {
    public static queryCollision(projectile: Projectile): CollisionInfo | undefined {
        let collisionInfo: CollisionInfo | undefined;

        for (const otherProj of Simulation.instance.projectiles) {
            if (otherProj == projectile) continue;
            
            const info: CollisionInfo | undefined = projectile.getCollision(otherProj);

            if (info && (collisionInfo === undefined || info.overlap > collisionInfo.overlap)) {
                collisionInfo = info;
            }
        }

        for (const obstacle of Simulation.instance.obstacles) {
            const info: CollisionInfo | undefined = obstacle.getCollision(projectile);

            if (info && (collisionInfo === undefined || info.overlap > collisionInfo.overlap)) {
                collisionInfo = info;
            }
        }

        return collisionInfo;
    }
}
import { Simulation } from "../core/simulation.js";
import { Util } from "../math/util.js";
import { Vector2 } from "../math/vector2.js";
import { Obstacle } from "./obstacle.js";
import { Projectile } from "./projectile.js";

export interface CollisionInfo {
    object: Projectile | Obstacle,
    overlap: number,
    normal: Vector2
}

export class CollisionManager {
    public static determineBestTime(times: number[]): number | undefined {
        let foundTime: boolean = false;
        let bestTime: number = -Infinity;

        for (const time of times) {
            if (time <= 1e-8 && time > bestTime) {
                foundTime = true;
                bestTime = time;
            }
        }

        if (foundTime) return bestTime;
    }

    public static vertexCollision(projectile: Projectile, vertex: Vector2, timeThreshold: number): number | undefined {
        const relativePos: Vector2 = projectile.position.subtract(vertex);
        const vel: Vector2 = projectile.velocity;
        const accel: Vector2 = projectile.acceleration;

        // (px + vxt + 1/2axt^2)^2 + (py + vyt + 1/2ayt^2)^2 = r^2 --> quartic equation
        // a: ax^2 / 4
        // b: vxax + vyay
        // c: pxax + vx^2 + pyay + vy^2
        // d: 2(pxvx + pyvy)
        // e: px^2 + py^2 - r^2
        const times: number[] = Util.solveQuartic(
            (accel.x ** 2 + accel.y ** 2) / 4, // A
            vel.x * accel.x + vel.y * accel.y, // B
            relativePos.x * accel.x + vel.x ** 2 + relativePos.y * accel.y + vel.y ** 2, // C
            2 * (relativePos.x * vel.x + relativePos.y * vel.y), // D
            relativePos.x ** 2 + relativePos.y ** 2 - projectile.radius ** 2 // E
        );

        const time: number | undefined = this.determineBestTime(times);

        if (time !== undefined && time + timeThreshold >= 1e-4) return time;
    }

    public static queryCollision(projectile: Projectile): CollisionInfo | undefined {
        let collisionInfo: CollisionInfo | undefined;

        for (const obstacle of Simulation.instance.obstacles) {
            const info: CollisionInfo | undefined = obstacle.getCollision(projectile);

            if (info && (collisionInfo === undefined || info.overlap < collisionInfo.overlap)) {
                collisionInfo = info;
            }
        }

        return collisionInfo;
    }
}
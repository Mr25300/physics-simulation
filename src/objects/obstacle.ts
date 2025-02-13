import { Simulation } from "../core/simulation.js";
import { Util } from "../math/util.js";
import { Vector2 } from "../math/vector2.js";
import { Projectile } from "./projectile.js";

export class Obstacle {
    public readonly angle: number;

    constructor(
        private position: Vector2,
        public readonly vertices: Vector2[],
        private elasticity: number
    ) {
        
    }

    private determineBestTime(times: number[]): number | undefined {
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

    public getVertexCollisionTime(projectile: Projectile, vertex: Vector2, timeThreshold: number): number | undefined {
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

        return this.determineBestTime(times);
    }

    public getCollisionTime(projectile: Projectile, timeThreshold: number): number | undefined { // Get normal too
        let collision: boolean = false;
        let time: number = -Infinity;

        for (let i = 0; i < this.vertices.length; i++) {
            if (this.vertices.length === 2 && i > 0) break;

            const v1: Vector2 = this.vertices[i];
            const v2: Vector2 = this.vertices[(i + 1) % this.vertices.length];
            const lineDir: Vector2 = v2.subtract(v1);

            // Change perspective so that (0, 0) is v1 and the line is flat, and get the metrics from that point of reference
            const relativePos: Vector2 = projectile.position.subtract(v1).rotate(-lineDir.angle);
            const relativeVel: Vector2 = projectile.velocity.rotate(-lineDir.angle);
            const relativeAccel: Vector2 = projectile.acceleration.rotate(-lineDir.angle);

            // r = py + vy * t + 1/2ay * t^2
            // 0 = (1/2ay)t^2 + (vy)t + (py - r)
            const times: number[] = Util.solveQuadratic(
                relativeAccel.y / 2,
                relativeVel.y,
                relativePos.y - projectile.radius
            );

            let t: number | undefined = this.determineBestTime(times);

            if (t !== undefined) {
                const collisionX: number = relativePos.x + relativeVel.x * t + relativeAccel.x * (t ** 2) / 2;

                if (collisionX < 0) {
                    t = this.getVertexCollisionTime(projectile, v1, timeThreshold);

                } else if (collisionX > lineDir.magnitude) {
                    t = this.getVertexCollisionTime(projectile, v2, timeThreshold);
                }
            }

            if (t !== undefined && t > time && t + timeThreshold >= 1e-8) {
                collision = true;
                time = t;
            }
        }

        if (collision) return time;
    }
}
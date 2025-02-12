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

    public getVertexCollisionTime(projectile: Projectile, vertex: Vector2): number | undefined {
        const relativePos: Vector2 = projectile.position.subtract(vertex);
        const vel: Vector2 = projectile.velocity;
        const accel: Vector2 = projectile.acceleration;

        let t: number | undefined;

        // (px + vxt + 1/2axt^2)^2 + (py + vyt + 1/2ayt^2)^2 = r^2 --> quartic equation
        // a: ax^2 / 4
        // b: vxax + vyay
        // c: pxax + vx^2 + pyay + vy^2
        // d: 2(pxvx + pyvy)
        // e: px^2 + py^2 - r^2
        const times: number[] = Util.solveQuartic(
            (accel.x ** 2 + accel.y ** 2) / 4,
            vel.x * accel.x + vel.y * accel.y,
            relativePos.x * accel.x + vel.x ** 2 + relativePos.y * accel.y + vel.y ** 2,
            2 * (relativePos.x * vel.x + relativePos.y + vel.y),
            relativePos.x ** 2 + relativePos.y ** 2 - projectile.radius ** 2
        );

        for (const time of times) {
            if (t === undefined || time > t) t = time;
        }

        return t;
    }

    public getCollisionTime(projectile: Projectile): number | undefined { // Get normal too
        let collision: boolean = false;
        let time: number = Infinity;

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

            let t: number | undefined;
            if (times.length > 0) t = times.length === 1 ? times[0] : Math.max(times[0], times[1]);

            console.log(t);

            console.log(Util.solveQuartic(1, -4, -1, 16, -12));

            if (t && t <= 0) {
                const collisionX: number = relativePos.x + relativeVel.x * t + relativeAccel.x * (t ** 2) / 2;

                if (collisionX < 0) {
                    t = this.getVertexCollisionTime(projectile, v1);

                } else if (collisionX > lineDir.magnitude) {
                    t = this.getVertexCollisionTime(projectile, v2);
                }

                if (t !== undefined && t < time) {
                    collision = true;
                    time = t;
                }
            }
        }

        if (collision) return time;
    }
}
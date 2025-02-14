import { Simulation } from "../core/simulation.js";
import { Util } from "../math/util.js";
import { Vector2 } from "../math/vector2.js";
import { CollisionInfo, CollisionManager } from "./collisions.js";
import { Projectile } from "./projectile.js";

export class Edge {
    private direction: Vector2;
    private tangent: Vector2;
    private normal: Vector2;

    constructor(private start: Vector2, private end: Vector2) {
        this.direction = end.subtract(start);
        this.tangent = this.direction.unit;
        this.normal = this.tangent.orthogonal;
    }

    public projectOnLine(position: Vector2): number {
        return this.tangent.dot(position.subtract(this.start)) / this.direction.magnitude;
    }

    public getPoint(t: number): Vector2 {
        t = Math.min(Math.max(t, 0), 1);

        return this.start.add(this.direction.multiply(t));
    }

    public getCollision(projectile: Projectile, timeThreshold: number): number | undefined {
        // Change perspective so that (0, 0) is v1 and the line is flat, and get the metrics from that point of reference
        const difference: Vector2 = projectile.position.subtract(this.start);
        const posY: number = this.normal.dot(difference);
        const velY: number = this.normal.dot(projectile.velocity);
        const accelY: number = this.normal.dot(projectile.acceleration);

        // r = py + vy * t + 1/2ay * t^2
        // 0 = (1/2ay)t^2 + (vy)t + (py - r)
        const times: number[] = [
            ...Util.solveQuadratic(
                accelY / 2,
                velY,
                posY - projectile.radius
            ),
            ...Util.solveQuadratic(
                accelY / 2,
                velY,
                posY + projectile.radius
            )
        ];

        let t: number | undefined = CollisionManager.determineBestTime(times);

        if (t !== undefined) {
            const posX: number = this.tangent.dot(difference);
            const velX: number = this.tangent.dot(projectile.velocity);
            const accelX: number = this.tangent.dot(projectile.acceleration);

            const collisionX: number = posX + velX * t + accelX * t ** 2 / 2;

            if (collisionX < 0) {
                t = CollisionManager.vertexCollision(projectile, this.start, timeThreshold);

            } else if (collisionX > this.direction.magnitude) {
                t = CollisionManager.vertexCollision(projectile, this.end, timeThreshold);
            }
        }

        if (t !== undefined && t + timeThreshold >= 1e-4) return t;
    }
}

export class Obstacle {
    private edges: Edge[] = [];

    constructor(public readonly elasticity: number, public readonly vertices: Vector2[]) {
        for (let i = 0; i < vertices.length; i++) {
            if (vertices.length === 2 && i > 0) break;

            this.edges.push(new Edge(
                vertices[i],
                vertices[(i + 1) % vertices.length]
            ));
        }
    }

    public getCollision(projectile: Projectile, timeThreshold: number): CollisionInfo | undefined {
        let collision: boolean = false;
        let time: number = -Infinity;
        let collidedEdge: Edge;

        for (const edge of this.edges) {
            const t: number | undefined = edge.getCollision(projectile, timeThreshold);

            if (t !== undefined && t > time) {
                collision = true;
                time = t;
                collidedEdge = edge;
            }
        }

        if (collision) {
            const projCollisionPos: Vector2 = projectile.getPosition(time);
            const edgeProjection: number = collidedEdge!.projectOnLine(projCollisionPos);
            const edgeCollisionPos: Vector2 = collidedEdge!.getPoint(edgeProjection);
            const normal: Vector2 = edgeCollisionPos.subtract(projCollisionPos).unit;

            return {
                time: time,
                normal: normal,
                object: this
            };
        }
    }
}
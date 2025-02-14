import { Vector2 } from "../math/vector2.js";
import { CollisionInfo } from "./collisions.js";
import { Projectile } from "./projectile.js";

interface NormalInfo {
    normal: Vector2;
    axisRange: [number, number];
}

export class Obstacle {
    private normalInfos: NormalInfo[] = [];

    constructor(public readonly elasticity: number, public readonly vertices: Vector2[]) {
        const normals: Vector2[] = [];

        for (let i = 0; i < vertices.length; i++) {
            if (vertices.length === 2 && i > 1) break;

            const vertex1: Vector2 = vertices[i];
            const vertex2: Vector2 = vertices[(i + 1) % vertices.length];
            const edge: Vector2 = vertex2.subtract(vertex1);

            normals.push(edge.unit.orthogonal);
        }

        normals.filter((normal: Vector2) => {
            return normals.some((existing: Vector2) => {
                const dot: number = normal.dot(existing);

                return Math.abs(dot) > 0.999;
            });
        });

        for (const normal of normals) {
            this.normalInfos.push({
                normal: normal,
                axisRange: this.getProjectedRange(normal)
            });
        }
    }

    private getProjectedRange(axis: Vector2): [number, number] {
        let min: number = Infinity;
        let max: number = -Infinity;

        for (const vertex of this.vertices) {
            const projection: number = axis.dot(vertex);

            if (projection < min) min = projection;
            if (projection > max) max = projection;
        }

        return [min, max];
    }

    public getClosestVertex(position: Vector2): Vector2 {
        let minDistance: number = Infinity;
        let closestVertex: Vector2 = Vector2.zero;

        for (const vertex of this.vertices) {
            const distance: number = vertex.subtract(position).magnitude;

            if (distance < minDistance) {
                minDistance = distance;
                closestVertex = vertex;
            }
        }

        return closestVertex;
    }

    public getCollision(projectile: Projectile): CollisionInfo | undefined {
        let minOverlap: number = Infinity;
        let minNormal: Vector2 = Vector2.zero;

        for (const info of this.normalInfos) {
            const projProjection: number = info.normal.dot(projectile.position);
            const [projMin, projMax]: [number, number] = [projProjection - projectile.radius, projProjection + projectile.radius];
            const [obsMin, obsMax]: [number, number] = info.axisRange;

            if (projMin > obsMax - 1e-8 || obsMin > projMax - 1e-8) return;

            const overlap: number = Math.min(projMax - obsMin, obsMax - projMin);

            if (overlap < minOverlap) {
                minOverlap = overlap;
                minNormal = info.normal;
            }
        }

        return {
            object: this,
            overlap: minOverlap,
            normal: minNormal
        };
    }
}
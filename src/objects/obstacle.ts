import { Vector2 } from "../math/vector2.js";
import { CollisionInfo } from "./collisions.js";
import { Projectile } from "./projectile.js";

interface AxisInfo {
    point: Vector2;
    tangent: Vector2;
    normal: Vector2;
    axisRange: [number, number];
}

export class Obstacle {
    private axes: AxisInfo[] = [];

    constructor(public readonly elasticity: number, public readonly vertices: Vector2[]) {
        for (let i = 0; i < vertices.length; i++) {
            if (vertices.length === 2 && i > 1) break;

            const vertex1: Vector2 = vertices[i];
            const vertex2: Vector2 = vertices[(i + 1) % vertices.length];
            const edge: Vector2 = vertex2.subtract(vertex1);

            const exists: boolean = this.axes.some((existing: AxisInfo) => {
                return Math.abs(edge.unit.dot(existing.tangent)) > 0.999;
            });

            if (exists) continue;

            this.axes.push({
                point: vertex1,
                tangent: edge.unit,
                normal: edge.unit.orthogonal,
                axisRange: this.getProjectedRange(edge.unit.orthogonal)
            })
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
        let minInfo: AxisInfo | undefined;

        for (const info of this.axes) {
            const projProjection: number = info.normal.dot(projectile.position);
            const [projMin, projMax]: [number, number] = [projProjection - projectile.radius, projProjection + projectile.radius];
            const [obsMin, obsMax]: [number, number] = info.axisRange;

            if (projMin >= obsMax || obsMin >= projMax) return;

            const overlap: number = Math.min(projMax - obsMin, obsMax - projMin);

            if (overlap < minOverlap) {
                minOverlap = overlap;
                minInfo = info;
            }
        }

        if (minInfo) {
            const edgeProjection: number = projectile.position.subtract(minInfo.point).dot(minInfo.normal);
            const direction: number = edgeProjection < 0 ? -1 : 1;
    
            return {
                object: this,
                overlap: minOverlap,
                normal: minInfo!.normal.multiply(direction)
            };
        }
    }
}
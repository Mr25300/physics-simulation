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

    constructor(
        public readonly elasticity: number,
        public readonly staticFriction: number,
        public readonly kineticFriction: number,
        public readonly vertices: Vector2[],
        public readonly inverse: boolean = false
    ) {
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
        let minOverlap: number = this.inverse ? -Infinity : Infinity;
        let minInfo: AxisInfo | undefined;

        const closestVert: Vector2 = this.getClosestVertex(projectile._position);
        const vertNormal = projectile._position.subtract(closestVert).unit;

        const axes: AxisInfo[] = this.inverse ? this.axes : [...this.axes];

        if (!this.inverse) axes.push({
            point: closestVert,
            tangent: vertNormal.orthogonal,
            normal: vertNormal,
            axisRange: this.getProjectedRange(vertNormal)
        })

        for (const info of axes) {
            const projProjection: number = info.normal.dot(projectile.position);
            const [projMin, projMax]: [number, number] = [projProjection - projectile.radius, projProjection + projectile.radius];
            const [obsMin, obsMax]: [number, number] = info.axisRange;

            // let overlap: number | undefined;
            // if (overlap !== undefined) // DO MINOVERLAP COMPARISON STUFF

            // if (!this.inverse && (projMin >= obsMax + 1e-8 || obsMin >= projMax + 1e-8)) return;
            // else if (this.inverse && (projMin > obsMin && projMax < obsMin)) continue;

            const overlap: number = this.inverse ? Math.max(obsMin - projMin, projMax - obsMax) : Math.min(projMax - obsMin, obsMax - projMin);

            if (overlap < -1e-8) {
                if (this.inverse) continue;
                else return;
            }

            if ((!this.inverse && overlap < minOverlap) || (this.inverse && overlap > minOverlap)) {
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
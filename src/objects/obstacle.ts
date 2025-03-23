import { Vector2 } from "../math/vector2.js";
import { CollisionInfo } from "../collisions/collisions.js";
import { Projectile } from "./projectile.js";
import { PhysicsMaterial } from "./physicsMaterial.js";

interface AxisInfo {
  normal: Vector2;
  axisRange: [number, number];
}

export class Obstacle {
  private axes: AxisInfo[] = [];

  constructor(
    public readonly vertices: Vector2[],
    public readonly radius: number = 0,
    public readonly inverse: boolean = false,
    public readonly material: PhysicsMaterial
  ) {
    for (let i = 0; i < vertices.length; i++) {
      if (vertices.length === 2 && i > 1) break;

      const vertex1: Vector2 = vertices[i];
      const vertex2: Vector2 = vertices[(i + 1) % vertices.length];
      const normal: Vector2 = vertex2.subtract(vertex1).unit.orthogonal;

      const exists: boolean = this.axes.some((existing: AxisInfo) => {
        return Math.abs(normal.dot(existing.normal)) > 0.999;
      });

      if (exists) continue;

      this.axes.push({
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

    return [min - this.radius, max + this.radius];
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
    let intersection: boolean = false;
    let minOverlap: number = this.inverse ? -Infinity : Infinity;
    let minNormal: Vector2 = Vector2.zero;

    const closestVert: Vector2 = this.getClosestVertex(projectile.position);
    const vertNormal = projectile.position.subtract(closestVert).unit;

    const projVertAxis: AxisInfo = {
      normal: vertNormal,
      axisRange: this.getProjectedRange(vertNormal)
    }

    for (const info of [...this.axes, projVertAxis]) {
      const projProjection: number = info.normal.dot(projectile.position);
      const [projMin, projMax]: [number, number] = [projProjection - projectile.properties.radius, projProjection + projectile.properties.radius];
      const [obsMin, obsMax]: [number, number] = info.axisRange;

      // let overlap: number | undefined;
      // if (overlap !== undefined) // DO MINOVERLAP COMPARISON STUFF

      // if (!this.inverse && (projMin >= obsMax + 1e-8 || obsMin >= projMax + 1e-8)) return;
      // else if (this.inverse && (projMin > obsMin && projMax < obsMin)) continue;

      const overlap: number = this.inverse ? Math.max(obsMin - projMin, projMax - obsMax) : Math.min(projMax - obsMin, obsMax - projMin);

      // if (overlap < -1e-8) {
      //     if (this.inverse) continue;
      //     else return;
      // }

      if (overlap < -1e-8) {
        if (this.inverse) continue;
        else return;
      }

      if ((!this.inverse && overlap < minOverlap) || (this.inverse && overlap > minOverlap)) {
        const projCenter: number = (projMin + projMax) / 2;
        const obsCenter: number = (obsMin + obsMax) / 2;

        let normalDir: number = this.inverse ? -1 : 1;
        if (projCenter - obsCenter < 0) normalDir *= -1;

        intersection = true;
        minOverlap = overlap;
        minNormal = info.normal.multiply(normalDir);
      }
    }

    if (intersection) return {
      object: this,
      overlap: minOverlap,
      normal: minNormal
    };
  }

  public isPointInside(point: Vector2): boolean {
    const closestVert: Vector2 = this.getClosestVertex(point);
    const vertNormal = point.subtract(closestVert).unit;

    const projVertAxis: AxisInfo = {
      normal: vertNormal,
      axisRange: this.getProjectedRange(vertNormal)
    }

    for (const info of [projVertAxis, ...this.axes]) {
      const pointProjection: number = info.normal.dot(point);
      const [min, max] = info.axisRange;
      const inside: boolean = pointProjection >= min && pointProjection <= max;

      if (!inside) {
        if (this.inverse) return true;
        else return false;
      }
    }

    if (this.inverse) return false;
    else return true;
  }
}
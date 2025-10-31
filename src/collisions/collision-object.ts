import { Vector2 } from "../math/vector2";
import { Shape } from "./shape";

interface AxisInfo {
  normal: Vector2;
  axisRange: [number, number];
}

export interface CollisionInfo {
  object: CollisionObject,
  overlap: number,
  normal: Vector2,
  radialCurvature: number
}

export class CollisionObject {
  private _vertices: Vector2[];
  private _normals: Vector2[];
  private normalsDirty: boolean = true;

  public position: Vector2 = Vector2.zero;
  public rotation: number = 0;
  public scale: number = 1;
  public radius: number = 0; // Temporary, will be moved to shape class and also made private so that it cannot be assigned to a negative number
  private inverse: boolean = false;

  constructor(private shape: Shape) {
    this.updateVertices();
  }

  public setTransform(newPos: Vector2, newRot: number) {
    if (newPos.equals(this.position) && newRot == this.rotation) return;

    this.position = newPos;
    this.rotation = newRot;

    this.updateVertices();
  }

  private getTransformedVertex(vertex: Vector2) {
    return vertex.multiply(this.scale).rotate(this.rotation).add(this.position);
  }

  private updateVertices() {
    this._vertices = new Array(this.shape.vertices.length);

    for (let i = 0; i < this.shape.vertices.length; i++) {
      this._vertices[i] = this.getTransformedVertex(this.shape.vertices[i]);
    }

    this.normalsDirty = true;
  }

  private get normals() {
    if (this.normalsDirty) {
      this._normals = new Array(this._vertices.length);

      for (let i = 0; i < this._vertices.length; i++) {
        const vert1 = this._vertices[i];
        const vert2 = this._vertices[(i + 1) % this._vertices.length];

        this._normals[i] = vert2.subtract(vert1).unit.orthogonal;
      }

      this.normalsDirty = false;
    }

    return this._normals;
  }

  public getClosestVertex(position: Vector2): Vector2 {
    let minDistance: number = Infinity;
    let closestVertex: Vector2 = Vector2.zero;

    for (const vertex of this._vertices) {
      const distance: number = vertex.subtract(position).magnitude;

      if (distance < minDistance) {
        minDistance = distance;
        closestVertex = vertex;
      }
    }

    return closestVertex;
  }

  private getCollisionNormals() {
    
  }

  private getProjectedRange(axis: Vector2): [number, number] {
    let min: number = Infinity;
    let max: number = -Infinity;

    for (const vertex of this.shape.vertices) {
      const projection: number = axis.dot(vertex);

      if (projection < min) min = projection;
      if (projection > max) max = projection;
    }

    return [min - this.radius, max + this.radius];
  }

  // public getCollision(object: CollisionObject): CollisionInfo | undefined {
  //   let intersection: boolean = false;
  //   let minOverlap: number = this.inverse ? -Infinity : Infinity;
  //   let minNormal: Vector2 = Vector2.zero;
  //   let isCorner: boolean = false;

  //   const closestVert: Vector2 = this.getClosestVertex(projectile.position);
  //   const vertNormal = projectile.position.subtract(closestVert).unit;

  //   const projVertAxis: AxisInfo = {
  //     normal: vertNormal,
  //     axisRange: this.getProjectedRange(vertNormal)
  //   }

  //   for (const info of [...this.axes, projVertAxis]) {
  //     const projProjection: number = info.normal.dot(projectile.position);
  //     const [projMin, projMax]: [number, number] = [projProjection - projectile.radius, projProjection + projectile.radius];
  //     const [obsMin, obsMax]: [number, number] = info.axisRange;

  //     // let overlap: number | undefined;
  //     // if (overlap !== undefined) // DO MINOVERLAP COMPARISON STUFF

  //     // if (!this.inverse && (projMin >= obsMax + 1e-8 || obsMin >= projMax + 1e-8)) return;
  //     // else if (this.inverse && (projMin > obsMin && projMax < obsMin)) continue;

  //     const overlap: number = this.inverse ? Math.max(obsMin - projMin, projMax - obsMax) : Math.min(projMax - obsMin, obsMax - projMin);

  //     // if (overlap < -1e-8) {
  //     //     if (this.inverse) continue;
  //     //     else return;
  //     // }

  //     if (overlap < -1e-8) {
  //       if (this.inverse) continue;
  //       else return;
  //     }

  //     if ((!this.inverse && overlap < minOverlap) || (this.inverse && overlap > minOverlap)) {
  //       const projCenter: number = (projMin + projMax) / 2;
  //       const obsCenter: number = (obsMin + obsMax) / 2;

  //       let normalDir: number = this.inverse ? -1 : 1;
  //       if (projCenter - obsCenter < 0) normalDir *= -1;

  //       intersection = true;
  //       minOverlap = overlap;
  //       minNormal = info.normal.multiply(normalDir);
  //       isCorner = info === projVertAxis;
  //     }
  //   }

  //   if (intersection) return {
  //     object: this,
  //     overlap: minOverlap,
  //     normal: minNormal,
  //     radialCurvature: (this.inverse && isCorner) ? this.radius : 0
  //   };
  // }
}
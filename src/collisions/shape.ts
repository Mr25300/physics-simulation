import { Vector2 } from "../math/vector2";

export class Shape {
  private _vertices: readonly Vector2[];
  private _area: number;
  private _momentOfInertia: number; // Moment of inertia of the shape assuming density of 1kg/m^3

  constructor(vertices: Vector2[], private inverted: boolean) {
    this.setVertices(vertices);
  }

  public get vertices(): readonly Vector2[] {
    return this._vertices;
  }

  public get area(): number {
    return this._area;
  }

  public get momentOfInertia(): number {
    return this._momentOfInertia
  }

  public setVertices(newVertices: Vector2[]) {
    const n = newVertices.length;
    const [clockwise, area, centerOfMass] = this.getProperties(newVertices); // Add check for concavity and return false if so
    const vertices = new Array(n);
    const edges = new Array(n);

    let momentSum = 0;

    for (let i = 0; i < n; i++) {
      const vert1 = newVertices[i];
      const vert2 = newVertices[(i + 1) % n];

      const v1 = vert1.subtract(centerOfMass);
      const v2 = vert2.subtract(centerOfMass);
      const cross = v1.x * v2.y - v2.x * v1.y;

      vertices[i] = v1;
      edges[i] = v2.subtract(v1);

      momentSum += cross * (v1.x * v1.x + v1.x * v2.x + v2.x * v2.x + v1.y * v1.y + v1.y * v2.y + v2.y * v2.y);
    }

    if (!clockwise) vertices.reverse();

    this._vertices = vertices;
    this._area = area
    this._momentOfInertia = Math.abs(momentSum / 12);
  }

  private getProperties(vertices: Vector2[]): [boolean, number, Vector2] {
    const n = vertices.length;

    let detSum = 0
    let xCenterSum = 0
    let yCenterSum = 0

    for (let i = 0; i < n; i++) {
      const vert1 = vertices[i];
      const vert2 = vertices[(i + 1) % n];
      const cross = vert1.x * vert2.y - vert2.x * vert1.y;

      detSum += cross;
      xCenterSum += cross * (vert1.x + vert2.x);
      yCenterSum += cross * (vert1.y + vert2.y);
    }

    const clockwise = detSum > 0;
    const area = Math.abs(detSum / 2);
    const centerOfMass = new Vector2(xCenterSum, yCenterSum).divide(6 * area)

    return [clockwise, area, centerOfMass];
  }
}
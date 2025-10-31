import { Vector2 } from "../math/vector2";

export class BoundingBox {
  constructor(private min: Vector2, private max: Vector2) {}
}
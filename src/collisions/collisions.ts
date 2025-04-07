import { Simulation } from "../core/simulation.js";
import { Vector2 } from "../math/vector2.js";
import { Obstacle } from "../objects/obstacle.js";
import { Projectile } from "../objects/projectile.js";

export interface CollisionInfo {
  object: Projectile | Obstacle,
  overlap: number,
  normal: Vector2,
  radialCurvature: number
}

export class CollisionManager {
  public static queryCollision(projectile: Projectile): CollisionInfo | undefined {
    let maxInfo: CollisionInfo | undefined

    for (const object of [...Simulation.instance.projectiles, ...Simulation.instance.obstacles]) {
      if (object == projectile) continue;

      const info: CollisionInfo | undefined = object instanceof Projectile ? projectile.getCollision(object) : object.getCollision(projectile);

      if (info && (!maxInfo || info.overlap > maxInfo.overlap)) {
        maxInfo = info;
      }
    }

    return maxInfo;
  }
}
import { Vector2 } from "../math/vector2.js";
import { Material } from "./material.js";
import { ForceType, Projectile } from "./projectile.js";

export abstract class Constraint {
  constructor(
    public origin: Vector2, // Vector2 | Projectile
    public attachment: Projectile,
    public length: number,
    public material: Material
  ) { }

  public abstract updateForces(): void;
  public abstract updateKinematics(): void;
}

export class Rope extends Constraint {
  constructor(origin: Vector2, attachment: Projectile, length: number, material: Material) {
    super(origin, attachment, length, material);
  }

  public updateForces(): void {
    const centerDiff: Vector2 = this.origin.subtract(this.attachment.position);

    if (centerDiff.magnitude >= this.length - 1e-2) {
      const tangentialVel: number = centerDiff.unit.orthogonal.dot(this.attachment.velocity);

      const radialForce: number = centerDiff.unit.dot(this.attachment.netForce);
      const centripetalForce: number = this.attachment.mass * tangentialVel ** 2 / this.length;
      const tensionForce: number = Math.max(centripetalForce - radialForce, 0);

      this.attachment.applyForce(centerDiff.unit.multiply(tensionForce), false, ForceType.tension);
    }
  }

  public updateKinematics(): void {
    const centerDiff: Vector2 = this.origin.subtract(this.attachment.position);

    if (centerDiff.magnitude > this.length) {
      this.attachment.displace(centerDiff.unit.multiply(centerDiff.magnitude - this.length));
    }

    if (centerDiff.magnitude >= this.length - 1e-2) {
      const radialVel: number = centerDiff.unit.dot(this.attachment.velocity);

      let responseScale: number = 1;
      if (radialVel < -0.1) responseScale += this.material.elasticity;

      this.attachment.applyForce(centerDiff.unit.multiply(-radialVel * this.attachment.mass * responseScale), true);
    }
  }
}

export class Spring extends Constraint {
  constructor(origin: Vector2, attachment: Projectile, length: number, material: Material) {
    super(origin, attachment, length, material);
  }

  public updateForces(): void {
    let centerDiff: Vector2 = this.origin.subtract(this.attachment.position);
    if (centerDiff.magnitude === 0) centerDiff = new Vector2(0, 1);
    
    const displacement: number = this.length - centerDiff.magnitude;
    const parallelVelocity: number = centerDiff.dot(this.attachment.velocity);

    const restoringForce: number = -this.material.stiffness * displacement;
    const dampingForce: number = -this.material.damping * parallelVelocity;
    const totalForce: number = restoringForce + dampingForce;

    this.attachment.applyForce(centerDiff.unit.multiply(totalForce), false, ForceType.restoring);
  }

  public updateKinematics(): void {}
}
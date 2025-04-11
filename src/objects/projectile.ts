import { Util } from "../math/util.js";
import { Vector2 } from "../math/vector2.js";
import { CollisionInfo, CollisionManager } from "../collisions/collisions.js";
import { Obstacle } from "./obstacle.js";
import { Material } from "./material.js";
import { Simulation } from "../core/simulation.js";

export enum ForceType {
  unspecified = "Unspecified",
  gravity = "Gravity",
  electrostatic = "Electrostatic",
  normal = "Normal",
  sFriction = "Static Friction",
  kFriction = "Kinetic Friction",
  tension = "Tension",
  restoring = "Restoring",
  drag = "Drag"
}

export type Force = {
  vector: Vector2;
  type: ForceType;
};

export class Projectile {
  public readonly forces: Force[] = [];

  private _netForce: Vector2 = Vector2.zero;
  private _acceleration: Vector2 = Vector2.zero;

  private lastCollision: CollisionInfo | undefined;
  // private lastCentripetalForce: Vector2 = Vector2.zero;

  constructor(
    public radius: number,
    public mass: number,
    public charge: number,
    public material: Material,
    private _position: Vector2,
    private _velocity: Vector2 = Vector2.zero
  ) {}

  public get position(): Vector2 {
    return this._position;
  }

  public get velocity(): Vector2 {
    return this._velocity;
  }

  public get acceleration(): Vector2 {
    return this._acceleration;
  }

  public get netForce(): Vector2 {
    return this._netForce;
  }

  public get crossSectionArea() {
    return Math.PI * this.radius ** 2;
  }

  public get density() {
    return this.mass / this.crossSectionArea
  }

  public clearForces(): void {
    this.forces.length = 0;
    this._netForce = Vector2.zero;
  }

  public applyForce(force: Vector2, impulse: boolean = false, type: ForceType = ForceType.unspecified): void {
    if (impulse) {
      this._velocity = this._velocity.add(force.divide(this.mass));

    } else {
      this.forces.push({ vector: force, type });
      this._netForce = this._netForce.add(force);
    }
  }

  public displace(offset: Vector2): void {
    this._position = this._position.add(offset);
  }

  public getDisplacement(deltaTime: number): Vector2 {
    return this._velocity.multiply(deltaTime).add(this._acceleration.multiply(deltaTime * deltaTime / 2));
  }

  public getVelocity(deltaTime: number): Vector2 {
    return this._velocity.add(this._acceleration.multiply(deltaTime));
  }

  public updateForces(): void {
    const dragMagnitude: number = this.material.drag * Simulation.instance.constants.airDensity * this.crossSectionArea * this._velocity.magnitude ** 2 / 2;

    this.applyForce(this._velocity.unit.multiply(-dragMagnitude), false, ForceType.drag);

    if (this.lastCollision) {
      const parallelVelocity: number = this.lastCollision.normal.dot(this._velocity);

      if (Math.abs(parallelVelocity) < 0.2) {
        const surfaceTangent: Vector2 = this.lastCollision.normal.orthogonal;
        const tangentialVelocity: number = surfaceTangent.dot(this._velocity);

        const surfaceForce: number = this.lastCollision.normal.dot(this._netForce);
        const centripetalForce: number = this.lastCollision.radialCurvature > 0 ? this.mass * tangentialVelocity ** 2 / this.lastCollision.radialCurvature : 0;
        const normalForce: number = Math.max(centripetalForce - surfaceForce);

        this.applyForce(this.lastCollision.normal.multiply(-parallelVelocity * this.mass), true);

        if (normalForce > 0) {
          this.applyForce(this.lastCollision.normal.multiply(normalForce), false, ForceType.normal);
          
          const surfaceTangent: Vector2 = this.lastCollision.normal.orthogonal;
          const tangentialVelocity: number = surfaceTangent.dot(this._velocity);

          const object: Projectile | Obstacle = this.lastCollision.object;
          const otherMaterial: Material = object instanceof Obstacle ? object.material! : object.material;

          if (Math.abs(tangentialVelocity) < 0.05) {
            const staticFriction: number = this.material.combineStaticFrction(otherMaterial);
            const maxFriction: number = normalForce * staticFriction;
            const tangentialForce: number = surfaceTangent.dot(this._netForce);
            const tangentialMag: number = Math.abs(tangentialForce);
            const frictionForce: number = -Util.sign(tangentialForce) * Math.min(maxFriction, tangentialMag);

            if (maxFriction >= tangentialMag) this.applyForce(surfaceTangent.multiply(-tangentialVelocity), true);

            this.applyForce(surfaceTangent.multiply(frictionForce), false, ForceType.sFriction);

          } else {
            const kineticFriction: number = this.material.combineKineticFriction(otherMaterial);
            const frictionForce: number = -Util.sign(tangentialVelocity) * normalForce * kineticFriction;

            this.applyForce(surfaceTangent.multiply(frictionForce), false, ForceType.kFriction);
          }
        }
      }
    }
  }

  public updateKinematics(deltaTime: number): void {
    this._acceleration = this._netForce.divide(this.mass);
    this._position = this._position.add(this.getDisplacement(deltaTime));
    this._velocity = this.getVelocity(deltaTime);

    const info: CollisionInfo | undefined = CollisionManager.queryCollision(this);

    this.lastCollision = info;

    if (info) {
      if (info.object instanceof Obstacle) {
        this._position = this._position.add(info.normal.multiply(info.overlap));

        const normalVel: number = info.normal.dot(this._velocity);
        let normalImpulse: number = 0;

        if (normalVel * Util.sign(deltaTime) < 0) {
          const normalAccel: number = info.normal.dot(this._acceleration);

          normalImpulse -= normalVel;
          
          if (Math.abs(normalVel) > Math.abs(normalAccel * (deltaTime + 0.02))) { // small error term added to delta time due to limited timestep
            let restitution: number = this.material.combineElasticity(info.object.material);
            if (deltaTime < 0 && restitution !== 0) restitution = 1 / restitution;

            normalImpulse -= normalVel * restitution;
          }
        }

        this.applyForce(info.normal.multiply(normalImpulse * this.mass), true);

      } else if (info.object instanceof Projectile) {
        const mass1: number = this.mass;
        const mass2: number = info.object.mass;
        const massSum: number = mass1 + mass2;

        this._position = this._position.add(info.normal.multiply(info.overlap * mass1 / massSum));;
        info.object._position = info.object._position.subtract(info.normal.multiply(info.overlap * mass2 / massSum));

        const normalVel1: number = info.normal.dot(this._velocity);
        const normalVel2: number = info.normal.dot(info.object._velocity);
        const normalVelDiff: number = normalVel1 - normalVel2;

        if (normalVelDiff * Util.sign(deltaTime) < 0) {
          let restitution: number = this.material.combineElasticity(info.object.material);
          if (deltaTime < 0 && restitution !== 0) restitution = 1 / restitution;

          const impulse: number = mass1 * mass2 * (1 + restitution) * normalVelDiff / massSum;

          this.applyForce(info.normal.multiply(-impulse), true);
          info.object.applyForce(info.normal.multiply(impulse), true);
        }
      }
    }
  }

  public getCollision(projectile: Projectile): CollisionInfo | undefined {
    const difference: Vector2 = this._position.subtract(projectile._position);
    const radiiSum: number = this.radius + projectile.radius;

    if (difference.magnitude <= radiiSum + 1e-8) return {
      object: projectile,
      overlap: radiiSum - difference.magnitude,
      normal: difference.magnitude > 0 ? difference.unit : Vector2.y,
      radialCurvature: 0
    }
  }

  public isPointInside(point: Vector2): boolean {
    return this._position.subtract(point).magnitude <= this.radius;
  }
}
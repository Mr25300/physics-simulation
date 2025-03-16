import { Util } from "../math/util.js";
import { Vector2 } from "../math/vector2.js";
import { CollisionInfo, CollisionManager } from "../collisions/collisions.js";
import { Obstacle } from "./obstacle.js";
import { PhysicsMaterial } from "./physicsMaterial.js";
import { Simulation } from "../core/simulation.js";

export enum ForceType {
  unspecified = "Unspecified",
  gravity = "Gravity",
  normal = "Normal",
  friction = "Friction",
  drag = "Drag",
  tension = "Tension",
  electrostatic = "Electrostatic"
}

export type Force = {
  vector: Vector2;
  type: ForceType;
};

export class ProjectileProperties {
  public density: number;
  public crossSectionArea: number;

  constructor(
    public radius: number,
    public mass: number,
    public charge: number,
    public material: PhysicsMaterial
  ) {
    this.crossSectionArea = Math.PI * radius ** 2;
    this.density = mass / this.crossSectionArea;
  }
}

export class Projectile {
  public readonly forces: Force[] = [];

  private _netForce: Vector2 = Vector2.zero;
  private _acceleration: Vector2 = Vector2.zero;
  private _velocity: Vector2 = Vector2.zero;

  private lastCollision: CollisionInfo | undefined;
  // private lastCentripetalForce: Vector2 = Vector2.zero;

  constructor(
    public readonly properties: ProjectileProperties,
    private _position: Vector2
  ) { }

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

  public clearForces(): void {
    this.forces.length = 0;
    this._netForce = Vector2.zero;
  }

  public applyForce(force: Vector2, impulse: boolean = false, type: ForceType = ForceType.unspecified): void {
    if (impulse) {
      this._velocity = this._velocity.add(force.divide(this.properties.mass));

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
    const dragMagnitude: number = this.properties.material.drag * Simulation.instance.constants.airDensity * this.properties.crossSectionArea * this._velocity.magnitude ** 2 / 2;
    this.applyForce(this._velocity.unit.multiply(-dragMagnitude), false, ForceType.drag);

    if (this.lastCollision) {
      const normalVel: number = this.lastCollision.normal.dot(this._velocity);

      if (Math.abs(normalVel) < 0.2) {
        const normalForce: number = -this.lastCollision.normal.dot(this._netForce);

        this.applyForce(this.lastCollision.normal.multiply(-normalVel * this.properties.mass), true);

        if (normalForce > 0) {
          this.applyForce(this.lastCollision.normal.multiply(normalForce), false, ForceType.normal);

          const surfaceTangent: Vector2 = this.lastCollision.normal.orthogonal;
          const tangentialVelocity: number = surfaceTangent.dot(this._velocity);

          const object: Projectile | Obstacle = this.lastCollision.object;
          const otherMaterial: PhysicsMaterial = object instanceof Obstacle ? object.material : object.properties.material;

          if (Math.abs(tangentialVelocity) < 0.05) {
            const staticFriction: number = this.properties.material.combineStaticFrction(otherMaterial);
            const maxFriction: number = normalForce * staticFriction;
            const tangentialForce: number = surfaceTangent.dot(this._netForce);
            const tangentialMag: number = Math.abs(tangentialForce);
            const frictionForce: number = -Util.sign(tangentialForce) * Math.min(maxFriction, tangentialMag);

            if (maxFriction >= tangentialMag) this.applyForce(surfaceTangent.multiply(-tangentialVelocity), true);

            this.applyForce(surfaceTangent.multiply(frictionForce), false, ForceType.friction);

          } else {
            const kineticFriction: number = this.properties.material.combineKineticFriction(otherMaterial);
            const frictionForce: number = -Util.sign(tangentialVelocity) * normalForce * kineticFriction;

            this.applyForce(surfaceTangent.multiply(frictionForce));
          }
        }
      }
    }
  }

  public updateKinematics(deltaTime: number): void {
    this._acceleration = this._netForce.divide(this.properties.mass);
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

          if (Math.abs(normalVel) > Math.abs(normalAccel * (deltaTime + 1e-2))) { // 1e-2 error term due to limited timestep
            let restitution: number = this.properties.material.combineElasticity(info.object.material);
            if (deltaTime < 0 && restitution !== 0) restitution = 1 / restitution;

            normalImpulse -= normalVel * restitution;
          }
        }

        this.applyForce(info.normal.multiply(normalImpulse * this.properties.mass), true);

      } else if (info.object instanceof Projectile) {
        const mass1: number = this.properties.mass;
        const mass2: number = info.object.properties.mass;
        const massSum: number = mass1 + mass2;

        this._position = this._position.add(info.normal.multiply(info.overlap * mass1 / massSum));;
        info.object._position = info.object._position.subtract(info.normal.multiply(info.overlap * mass2 / massSum));

        const normalVel1: number = info.normal.dot(this._velocity);
        const normalVel2: number = info.normal.dot(info.object._velocity);
        const normalVelDiff: number = normalVel1 - normalVel2;

        if (normalVelDiff * Util.sign(deltaTime) < 0) {
          let restitution: number = this.properties.material.combineElasticity(info.object.properties.material);
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
    const radiiSum: number = this.properties.radius + projectile.properties.radius;

    if (difference.magnitude <= radiiSum) return {
      object: projectile,
      overlap: radiiSum - difference.magnitude,
      normal: difference.unit
    }
  }
}
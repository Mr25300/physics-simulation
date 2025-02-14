import { Simulation } from "../core/simulation.js";
import { Vector2 } from "../math/vector2.js";
import { Constants } from "../physics/constants.js";
import { CollisionInfo, CollisionManager } from "./collisions.js";
import { Obstacle } from "./obstacle.js";

export type ForceApplication = {
    force: Vector2;
    colorIndex: number;
};

export class Projectile {
    public static readonly VECTOR_COLORS: Record<number, string> = {
        0: "#FF5733", // Bright Red
        1: "#3498DB", // Vivid Blue
        2: "#2ECC71", // Bright Green
        3: "#F1C40F", // Vibrant Yellow
        4: "#9B59B6", // Deep Purple
        5: "#1ABC9C", // Teal
        6: "#E67E22", // Warm Orange
        7: "#8E44AD", // Rich Violet
        8: "#34495E", // Dark Gray-Blue
        9: "#2C3E50"  // Deep Navy
    };

    public forces: ForceApplication[] = [];
    public netForce: Vector2 = Vector2.zero;

    public _acceleration: Vector2 = Vector2.zero;
    public _velocity: Vector2 = Vector2.zero;

    constructor(
        public readonly mass: number,
        public readonly elasticity: number,
        public readonly radius: number,
        public _position: Vector2
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

    public clearForces(): void {
        this.forces.length = 0;
    }

    public applyForce(force: Vector2, colorIndex: number = 0): void {
        this.forces.push({ force, colorIndex });
    }

    public applyImpulse(force: Vector2): void {
        this._velocity = this._velocity.add(force.divide(this.mass));
    }

    public computeDrag(): Vector2 {
        const dragSurfaceArea: number = this.radius * 2;
        const dragMagnitude: number = Constants.DRAG_COEFFICIENT * Constants.AIR_DENSITY * dragSurfaceArea * this._velocity.magnitude ** 2 / 2;

        return this._velocity.unit.multiply(-dragMagnitude);
    }

    public getDisplacement(deltaTime: number): Vector2 {
        return this._velocity.multiply(deltaTime).add(this._acceleration.multiply(deltaTime ** 2 / 2));
    }

    public getVelocity(deltaTime: number): Vector2 {
        return this._velocity.add(this._acceleration.multiply(deltaTime));
    }

    public update(deltaTime: number): void {
        this.netForce = Vector2.zero;

        for (const force of this.forces) {
            this.netForce = this.netForce.add(force.force);
        }

        this._acceleration = this.netForce.divide(this.mass);

        const displacement: Vector2 = this.getDisplacement(deltaTime);
        const lastVelocity: Vector2 = this._velocity;

        this._position = this._position.add(displacement);
        this._velocity = this.getVelocity(deltaTime);

        this.clearForces();

        const info: CollisionInfo | undefined = CollisionManager.queryCollision(this);

        if (info) {
            const effectiveElasticity: number = this.elasticity * info.object.elasticity;

            const collisionPos: Vector2 = this._position.add(info.normal.multiply(info.overlap));
            const collisionProgress: number = Math.min(collisionPos.magnitude /  displacement.magnitude, 1);
            const collisionVel: Vector2 = lastVelocity.add(this._velocity.subtract(lastVelocity).multiply(collisionProgress));

            console.log(collisionVel);

            if (collisionVel.magnitude > 0.01) {
                const normalImpulse: number = collisionVel.dot(info.normal) * (1 + effectiveElasticity);

                this._velocity = collisionVel.subtract(info.normal.multiply(normalImpulse));

            } else {
                this._velocity = Vector2.zero;
            }

            this._position = this._position.add(info.normal.multiply(info.overlap));

            // Figure out how normal and friction forces should be applied

            const normalForceProjection: number = -info.normal.dot(this.netForce);

            this.applyForce(info.normal.multiply(normalForceProjection));

            const surfaceTangent: Vector2 = info.normal.orthogonal;
            const frictionForce: number = surfaceTangent.dot(collisionVel);

            this.applyForce(surfaceTangent.multiply(-frictionForce));
        }
    }
}
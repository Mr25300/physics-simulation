import { Simulation } from "../core/simulation.js";
import { Vector2 } from "../math/vector2.js";
import { Constants } from "../physics/constants.js";

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
    

    public _acceleration: Vector2 = Vector2.zero;
    public _velocity: Vector2 = Vector2.zero;

    constructor(
        public readonly mass: number,
        public readonly elasticity: number,
        public readonly radius: number,
        private _position: Vector2
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

    public update(deltaTime: number): void {
        let netForce = Vector2.zero;

        for (const force of this.forces) {
            netForce = netForce.add(force.force);
        }

        this._acceleration = netForce.divide(this.mass);
        this._position = this._position.add(this._velocity.multiply(deltaTime)).add(this._acceleration.multiply(deltaTime ** 2 / 2));
        this._velocity = this._velocity.add(this._acceleration.multiply(deltaTime));

        for (const obstacle of Simulation.instance.obstacles) {
            const t: number | undefined = obstacle.getCollisionTime(this);

            console.log(t);
        }
    }
}

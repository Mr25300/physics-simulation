import { Vector2 } from "../math/vector2.js";
import { Constants } from "./constants.js";

export class Projectile {
    public velocity: Vector2 = new Vector2(10, 0);
    public forces: Vector2[] = [];

    constructor(
        private mass: number,
        private elasticity: number,
        public radius: number,
        public position: Vector2
    ) {}

    public applyImpulse(force: Vector2): void {
        this.velocity = this.velocity.add(force.divide(this.mass));
    }

    public update(deltaTime: number): void {
        this.forces.length = 0;
        this.forces.push(new Vector2(0, Constants.ACCELERATION_DUE_TO_GRAVITY));

        let netForce = Vector2.zero;

        for (const force of this.forces) {
            netForce = netForce.add(force);
        }

        const accel: Vector2 = netForce.divide(this.mass);

        this.position = this.position.add(this.velocity.multiply(deltaTime)).add(accel.multiply(deltaTime ** 2 / 2));
        this.velocity = this.velocity.add(accel.multiply(deltaTime));
    }
}

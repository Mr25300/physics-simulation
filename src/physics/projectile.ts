import { Vector2 } from "../math/vector2.js";

export class Projectile {
    private velocity: Vector2 = Vector2.zero;
    private force: Vector2 = Vector2.zero;

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
        const accel: Vector2 = this.force.divide(this.mass);

        this.position = this.position.add(this.velocity.multiply(deltaTime)).add(accel.multiply(deltaTime ** 2 / 2));
        this.velocity = this.velocity.add(accel.multiply(deltaTime));
    }
}
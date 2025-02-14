import { Vector2 } from "../math/vector2";
import { Projectile } from "./projectile";

export class Rope {
    constructor(private origin: Vector2, private length: number, private attachment: Projectile) {

    }

    public applyForces(deltaTime: number): void {
        const centerDiff: Vector2 = this.attachment.position.subtract(this.origin);
        const radialVelocity: number = centerDiff.unit.dot(this.attachment.velocity);

        if (centerDiff.magnitude >= this.length - 1e-8 && radialVelocity > 0) {
            const tensionForce: number = radialVelocity;

            this.attachment.applyImpulse(centerDiff.unit.multiply(-radialVelocity));
        }
    }

    public update(): void {
        const centerDiff: Vector2 = this.attachment.position.subtract(this.origin);

        if (centerDiff.magnitude > this.length) {
            this.attachment._position = this.origin.add(centerDiff.unit.multiply(this.length));
        }
    }
}
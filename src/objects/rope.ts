import { Vector2 } from "../math/vector2.js";
import { ForceType, Projectile } from "./projectile.js";

export class Rope {
    constructor(public readonly origin: Vector2, public readonly length: number, public readonly attachment: Projectile) {}

    public updateForces(): void {
        const centerDiff: Vector2 = this.attachment.position.subtract(this.origin);

        if (centerDiff.magnitude >= this.length - 1e-8) {
            const radialForce: number = centerDiff.unit.dot(this.attachment.netForce);

            if (radialForce > 0) this.attachment.applyForce(centerDiff.unit.multiply(-radialForce), false, ForceType.tension);
        }
    }

    public updateKinematics(): void {
        const centerDiff: Vector2 = this.attachment.position.subtract(this.origin);

        if (centerDiff.magnitude > this.length) {
            this.attachment._position = this.origin.add(centerDiff.unit.multiply(this.length));
        }

        if (centerDiff.magnitude >= this.length - 1e-8) {
            const radialVel: number = centerDiff.unit.dot(this.attachment.velocity);

            if (radialVel > 0) this.attachment.applyForce(centerDiff.unit.multiply(-radialVel * this.attachment.mass), true);
        }
    }
}
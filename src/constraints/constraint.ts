import { Vector2 } from "../math/vector2.js";
import { ForceType, Projectile } from "../projectiles/projectile.js";

export abstract class Constraint {
    public origin: Vector2; // Vector2 | Projectile
    public attachment: Projectile;
    public length: number;

    public abstract updateForces(): void;
    public abstract updateKinematics(): void;
}

export class Rope extends Constraint {
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

export class Spring extends Constraint {
    public damping: number;
    public stiffness: number;

    public updateForces(): void {
        
    }

    public updateKinematics(): void {
        
    }
}
import { Vector2 } from "../math/vector2.js";
import { ForceType, Projectile } from "../objects/projectile.js";

export class ConstraintMaterial {
    constructor(
        public color: string
    ) {}
}

export class RopeMaterial extends ConstraintMaterial {
    constructor(
        public length: number,
        // public tensileStrength: number, // Force (newtons)
        public color: string
    ) {
        super(color)
    }
}

export class SpringMaterial extends ConstraintMaterial {
    constructor(
        public damping: number,
        public stiffness: number,
        color: string
    ) {
        super(color);
    }
}

export abstract class Constraint {
    public abstract material: ConstraintMaterial;

    constructor(
        public origin: Vector2, // Vector2 | Projectile
        public attachment: Projectile,
        public length: number
    ) {}

    public abstract updateForces(): void;
    public abstract updateKinematics(): void;
}

export class Rope extends Constraint {
    constructor(origin: Vector2, attachment: Projectile, length: number, public material: RopeMaterial) {
        super(origin, attachment, length);
    }

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
            this.attachment.displace(centerDiff.unit.multiply(this.length - centerDiff.magnitude));
        }

        if (centerDiff.magnitude >= this.length - 1e-8) {
            const radialVel: number = centerDiff.unit.dot(this.attachment.velocity);

            if (radialVel > 0) this.attachment.applyForce(centerDiff.unit.multiply(-radialVel * this.attachment.mass), true);
        }
    }
}

export class Spring extends Constraint {
    constructor(origin: Vector2, attachment: Projectile, length: number, public material: SpringMaterial) {
        super(origin, attachment, length);
    }

    public updateForces(): void {
        
    }

    public updateKinematics(): void {
        
    }
}
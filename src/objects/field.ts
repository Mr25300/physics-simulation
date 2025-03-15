import { Simulation } from "../core/simulation.js";
import { Vector2 } from "../math/vector2.js";
import { Projectile } from "./projectile.js";

export enum FieldType {
    gravitational = "Gravitational",
    electric = "Electric"
}

export class Field {
    constructor(
        public vector: Vector2,
        public positionBased: boolean,
        public type: FieldType,
        public strength: number
    ) {}

    public getVector(position: Vector2): Vector2 {
        let vector: Vector2;
        let magnitude: number = this.strength;

        if (this.positionBased) vector = this.vector.subtract(position).unit;
        else vector = this.vector.unit;

        return vector.multiply(magnitude);
    }

    public getForce(projectile: Projectile): Vector2 {
        const forceVector: Vector2 = this.getVector(projectile.position);
        const forceMultiplier: number = this.type === FieldType.gravitational ? projectile.properties.mass : projectile.properties.charge;

        return forceVector.multiply(forceMultiplier);
    }
}
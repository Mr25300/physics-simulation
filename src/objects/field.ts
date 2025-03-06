import { Vector2 } from "../math/vector2";

export enum FieldType {
    gravitational = 0,
    electric = 1,
    magnetic = 2
}

export class Field {
    public vector: Vector2;
    public directional: boolean;
    public type: FieldType;
    public strength: number;
}
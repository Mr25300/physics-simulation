export class Vector2 {
    private _magnitude?: number;
    private _unit?: Vector2;

    constructor(
        public x: number = 0,
        public y: number = 0
    ) {}

    public static readonly zero: Vector2 = new Vector2();

    public static fromAngle(angle: number): Vector2 {
        return new Vector2(
            Math.cos(angle),
            Math.sin(angle)
        )
    }

    public add(vector: Vector2): Vector2 {
        return new Vector2(this.x + vector.x, this.y + vector.y);
    }

    public subtract(vector: Vector2): Vector2 {
        return new Vector2(this.x - vector.x, this.y - vector.y);
    }

    public multiply(scalar: number): Vector2 {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    public divide(divisor: number): Vector2 {
        return new Vector2(this.x / divisor, this.y / divisor);
    }

    public get magnitude(): number {
        if (!this._magnitude) this._magnitude = Math.sqrt(this.x ** 2 + this.y ** 2);

        return this._magnitude;
    }

    public distance(vector: Vector2): number {
        return this.subtract(vector).magnitude;
    }

    public unit(): Vector2 {
        if (!this._unit) {
            this._unit = this.magnitude == 0 ? new Vector2() : this.divide(this.magnitude);
        }

        return this._unit;
    }

    public angle(): number {
        return Math.atan2(this.y, this.x);
    }

    public dot(vector: Vector2): number {
        return this.x * vector.x + this.y * vector.y;
    }

    public orthogonal(): Vector2 {
        return new Vector2(-this.y, this.x);
    }

    public rotate(rotation: number): Vector2 {
        const cos: number = Math.cos(rotation);
        const sin: number = Math.sin(rotation);

        return new Vector2(
            this.x * cos + this.y * sin,
            this.y * cos - this.x * sin
        );
    }
}

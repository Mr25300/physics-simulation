export class Vector2 {
  private _magnitude?: number;
  private _unit?: Vector2;
  private _angle?: number;

  constructor(
    public readonly x: number = 0,
    public readonly y: number = 0
  ) { }

  public static readonly zero: Vector2 = new Vector2();

  public static fromPolarForm(magnitude: number, angle: number): Vector2 {
    const newVector: Vector2 = new Vector2(
      magnitude * Math.cos(angle),
      magnitude * Math.sin(angle)
    );

    newVector._magnitude = magnitude;
    newVector._angle = angle;
    
    return newVector;
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

  public get unit(): Vector2 {
    if (!this._unit) {
      this._unit = this.magnitude == 0 ? Vector2.zero : this.divide(this.magnitude);
    }

    return this._unit;
  }

  public get angle(): number {
    if (!this._angle) this._angle = Math.atan2(this.y, this.x);

    return this._angle;
  }

  public get orthogonal(): Vector2 {
    return new Vector2(-this.y, this.x);
  }

  public dot(vector: Vector2): number {
    return this.x * vector.x + this.y * vector.y;
  }

  public rotate(rotation: number): Vector2 {
    const cos: number = Math.cos(rotation);
    const sin: number = Math.sin(rotation);

    return new Vector2(
      this.x * cos - this.y * sin,
      this.y * cos + this.x * sin
    );
  }
}

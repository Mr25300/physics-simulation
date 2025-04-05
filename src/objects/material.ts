export class Material {
  constructor(
    public name: string,
    public elasticity: number,
    public staticFriction: number,
    public kineticFriction: number,
    public drag: number,
    public color: string
  ) { }

  public combineElasticity(other: Material): number {
    return this.elasticity * other.elasticity;
  }

  public combineStaticFrction(other: Material): number {
    return this.staticFriction * other.staticFriction;
  }

  public combineKineticFriction(other: Material): number {
    return this.kineticFriction * other.kineticFriction;
  }
}
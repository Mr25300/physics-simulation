export class PhysicsMaterial {
  constructor(
    public elasticity: number,
    public staticFriction: number,
    public kineticFriction: number,
    public drag: number,
    public color: string
  ) { }

  public combineElasticity(other: PhysicsMaterial): number {
    return this.elasticity * other.elasticity;
  }

  public combineStaticFrction(other: PhysicsMaterial): number {
    return this.staticFriction * other.staticFriction;
  }

  public combineKineticFriction(other: PhysicsMaterial): number {
    return this.kineticFriction * other.kineticFriction;
  }
}
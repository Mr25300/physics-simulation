export class Material {
    constructor(
        public charge: number,
        public elasticity: number,
        public staticFriction: number,
        public kineticFriction: number,
        public drag: number,
        public color: string
    ) {}
}
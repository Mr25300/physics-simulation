
type Pair<T,K> = [T,K];
type Pairs<T,K> = Pair<T,K>[];

// this will be an object that can be added to the simulation for a projectile to bounce off of.
export class FixedObject {

    constructor(
        readonly verticies: Pairs<number, number>, // an array of x/y points that represent where the object is on the x/y coordinate plane
        public elasticity: number // the elasticity of the object
    ) {}
}
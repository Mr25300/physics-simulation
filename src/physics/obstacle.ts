
type Pair<T,K> = [T,K];
export type NumberPairs = Pair<number, number>[];

// this will be an object that can be added to the simulation for a projectile to bounce off of.
export class StaticObstacle {

    constructor(
        readonly verticies: NumberPairs, // an array of x/y points that represent where the object is on the x/y coordinate plane
        public elasticity: number // the elasticity of the object
    ) {}
}
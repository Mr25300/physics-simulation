import { Vector2 } from "../math/vector2.js";
import { Projectile } from "../objects/projectile.js";
import { Canvas } from "../rendering/canvas.js";
import { Loop } from "./loop.js";
import { Graph } from "../graphing/graph.js";
import { Obstacle } from "../objects/obstacle.js";
import { Constants } from "../physics/constants.js";
import { Rope } from "../objects/rope.js";

export class Simulation extends Loop {
    private canvas: Canvas;

    public readonly ropes: Rope[] = [];
    public readonly projectiles: Projectile[] = [];
    public readonly obstacles: Obstacle[] = [];

    private static _instance: Simulation;

    public static get instance(): Simulation {
        if (!this._instance) this._instance = new Simulation();

        return this._instance;
    }

    public init(): void {
        const canvas: HTMLCanvasElement | null = document.querySelector("canvas");
        if (!canvas) throw new Error("Failed to get canvas.");

        this.canvas = new Canvas(canvas);

        this.projectiles.push(new Projectile(1, 1, 0.5, new Vector2(2, 0)));
        // this.ropes.push(new Rope(Vector2.zero, 4, this.projectiles[0]));
        this.obstacles.push(new Obstacle(0.5, [new Vector2(-6, -4), new Vector2(6, -4), new Vector2(6, -6), new Vector2(-6, -6)]));
        this.obstacles.push(new Obstacle(0.5, [new Vector2(4, -4), new Vector2(4, 4)]));
        this.obstacles.push(new Obstacle(0.5, [new Vector2(4, 4), new Vector2(-4, 4)]));
        this.obstacles.push(new Obstacle(0.5, [new Vector2(-4, 4), new Vector2(-4, -4)]));

        this.obstacles.push(new Obstacle(1, [
            new Vector2(-1, -3),
            new Vector2(1, -3),
            new Vector2(0, -1)
        ]));

        this.projectiles[0].applyForce(new Vector2(10, 0), true);

        this.start();

        // const graphCanvas = document.getElementById("posGraph") as HTMLCanvasElement;
        // this.posGraph = new Graph(graphCanvas, "t", "dy");

        // const magCanvas = document.getElementById("magGraph") as HTMLCanvasElement;
        // this.magGraph = new Graph(magCanvas, "t", "v");

        // const accCanvas = document.getElementById("accGraph") as HTMLCanvasElement;
        // this.accGraph = new Graph(accCanvas, "t", "a");

        // this.staticObstacles.push(new StaticObstacle([[10, 10], [10, 20], [20, 20], [20, 10]], 0.5));
    }

    public update(deltaTime: number): void {
        for (const rope of this.ropes) {
            rope.applyForces(deltaTime);
        }

        for (const projectile of this.projectiles) {
            projectile.update(deltaTime);
            // tabContents[`Projectile ${i}`] = 
            //   `Position: (${projectile.position.x.toFixed(1)}, ${projectile.position.y.toFixed(1)}) <br> 
            //   V<sub>x</sub>: ${projectile.velocity.x.toFixed(2)} m/s <br>
            //   V<sub>y</sub>: ${projectile.velocity.y.toFixed(2)} m/s <br>
            //   V<sub>Magnitude</sub>: ${projectile.velocity.magnitude.toFixed(2)} m/s <br>
            //   A<sub>x</sub>: ${projectile.acceleration.x.toFixed(2)} m/s<sup>2</sup> <br>
            //   A<sub>y</sub>: ${projectile.acceleration.y.toFixed(2)} m/s<sup>2</sup> <br>
            //   A<sub>Magnitude</sub>: ${projectile.acceleration.magnitude.toFixed(2)} m/s<sup>2</sup> <br>
            //   `;

            // this.magGraph.addPoint(this.elapsedTime, projectile.velocity.magnitude);
            // this.posGraph.addPoint(this.elapsedTime, projectile.position.y);
            // this.accGraph.addPoint(this.elapsedTime, projectile.acceleration.magnitude);
        }

        for (const rope of this.ropes) {
            rope.update();
        }

        this.canvas.render();
    }
}

const sim: Simulation = Simulation.instance;
sim.init();
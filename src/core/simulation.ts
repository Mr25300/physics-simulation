import { Vector2 } from "../math/vector2.js";
import { Projectile } from "../objects/projectile.js";
import { Canvas } from "../rendering/canvas.js";
import { Loop } from "./loop.js";
import { Graph } from "../graphing/graph.js";
import { Constants } from "../physics/constants.js";
import { Obstacle } from "../objects/obstacle.js";

export class Simulation extends Loop {
    private canvas: Canvas;

    public readonly projectiles: Projectile[] = [];
    public readonly obstacles: Obstacle[] = [];

    private static _instance: Simulation;

    public static get instance(): Simulation {
        if (!this._instance) this._instance = new Simulation();

        return this._instance;
    }

    private posGraph: Graph;
    private magGraph: Graph;
    private accGraph: Graph;

    public init(): void {
        const canvas: HTMLCanvasElement | null = document.querySelector("canvas");
        if (!canvas) throw new Error("Failed to get canvas.");

        this.canvas = new Canvas(canvas);

        this.projectiles.push(new Projectile(1, 1, 0.5, Vector2.zero));
        this.obstacles.push(new Obstacle(Vector2.zero, [new Vector2(-2, -2), new Vector2(2, -2)], 1));

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
        for (const projectile of this.projectiles) {
            projectile.clearForces();
            projectile.applyForce(new Vector2(0, -Constants.ACCELERATION_DUE_TO_GRAVITY));
            // projectile.applyForce(projectile.computeDrag());

            projectile.update(deltaTime);

            // this.magGraph.addPoint(this.elapsedTime, projectile.velocity.magnitude);
            // this.posGraph.addPoint(this.elapsedTime, projectile.position.y);
            // this.accGraph.addPoint(this.elapsedTime, projectile.acceleration.magnitude);
        }

        this.canvas.render();
    }
}

const sim: Simulation = Simulation.instance;
sim.init();

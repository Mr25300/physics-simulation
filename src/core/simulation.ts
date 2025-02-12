import { Vector2 } from "../math/vector2.js";
import { Projectile } from "../physics/projectile.js";
import { Canvas } from "../rendering/canvas.js";
import { Loop } from "./loop.js";
import { StaticObstacle } from "../physics/obstacle.js";
import { Graph } from "../graphing/graph.js";
import { Constants } from "../physics/constants.js";

export class Simulation extends Loop {
    private canvas: Canvas;
    private timeElapsed: number = 0;

    public readonly projectiles: Projectile[] = [];

    public readonly staticObstacles: StaticObstacle[] = [];

    // Track if we have just rewound
    private justRewound: boolean = false;

    private static _instance: Simulation;

    public static get instance(): Simulation {
        if (!this._instance) this._instance = new Simulation();

        return this._instance;
    }
    private posGraph: Graph;
    private magGraph: Graph;
    public init(): void {
        const canvas: HTMLCanvasElement | null = document.querySelector("canvas");
        if (!canvas) throw new Error("Failed to get canvas.");

        this.canvas = new Canvas(canvas);

        this.start();

        this.projectiles.push(new Projectile(1, 1, 0.5, Vector2.zero, new Vector2(1,10)));
       
        const graphCanvas = document.getElementById("posGraph") as HTMLCanvasElement;
        this.posGraph = new Graph(graphCanvas, "dx", "dy");

        const magCanvas = document.getElementById("magGraph") as HTMLCanvasElement;
        this.magGraph = new Graph(magCanvas, "t", "v");
        // this.staticObstacles.push(new StaticObstacle([[10, 10], [10, 20], [20, 20], [20, 10]], 0.5));
    }
    private prevPosition = Vector2.zero;
public update(deltaTime: number): void {
        for (const projectile of this.projectiles) {
            // Check if we need to rewind
            if (this.timeElapsed >= 3) {
                deltaTime = -3;
                
                this.prevPosition = projectile.position; 
                // Clear graphs if needed to avoid mixing old and new data
                this.magGraph.reset();
                this.posGraph.reset();
                
                // Set the flag to indicate that we've just rewound
                this.justRewound = true;
            }

            projectile.clearForces();
            projectile.applyForce(new Vector2(0, Constants.ACCELERATION_DUE_TO_GRAVITY));
            
            // Update the projectile (forward update)
            projectile.update(deltaTime);

            // If we just rewound, skip computing the derivative this frame.
            if (this.justRewound) {
                // Update the graphs with the current position,
                // but don't compute a derivative from a stale previous value.
                this.posGraph.addPoint(projectile.position.x, projectile.position.y);
                
                // Optionally, you could add a zero derivative point or skip it entirely.
                // For example:
                // this.magGraph.addPoint(this.timeElapsed, 0);
                
                // Clear the flag so that derivative calculations resume on the next frame.
                this.justRewound = false;
            } else {
                        console.log(this.magGraph.points);

                // Compute the derivative (instantaneous velocity)
                const velocityX = (projectile.position.x - this.prevPosition.x) / deltaTime;
                const velocityY = (projectile.position.y - this.prevPosition.y) / deltaTime;
                const velocity = Math.sqrt(velocityX ** 2 + velocityY ** 2);

                // Store the computed values in the graphs
                this.magGraph.addPoint(this.timeElapsed, velocity);
                this.posGraph.addPoint(projectile.position.x, projectile.position.y);

                // Update the derivative baseline for the next frame
                this.prevPosition = projectile.position;
            }
        }

        this.timeElapsed += deltaTime;
        this.canvas.render();
    }
}

const sim: Simulation = Simulation.instance;
sim.init();

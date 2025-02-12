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
  private accGraph: Graph;
  public init(): void {
    const canvas: HTMLCanvasElement | null = document.querySelector("canvas");
    if (!canvas) throw new Error("Failed to get canvas.");

    this.canvas = new Canvas(canvas);

    this.start();

    this.projectiles.push(new Projectile(1, 1, 0.5, Vector2.zero, new Vector2(0,0)));

    const graphCanvas = document.getElementById("posGraph") as HTMLCanvasElement;
    this.posGraph = new Graph(graphCanvas, "t", "dy");

    const magCanvas = document.getElementById("magGraph") as HTMLCanvasElement;
    this.magGraph = new Graph(magCanvas, "t", "v");

    const accCanvas = document.getElementById("accGraph") as HTMLCanvasElement;
    this.accGraph = new Graph(accCanvas, "t", "a");

    // this.staticObstacles.push(new StaticObstacle([[10, 10], [10, 20], [20, 20], [20, 10]], 0.5));
  }
  public update(deltaTime: number): void {
    for (const projectile of this.projectiles) {
      if (this.timeElapsed >= 5) {
        deltaTime = -5;

        // Clear graphs if needed to avoid mixing old and new data
        this.magGraph.reset();
        this.posGraph.reset();
        this.accGraph.reset();
        this.justRewound = true; // Set flag when rewinding
      } 
projectile.clearForces(); // Clear existing forces
projectile.applyForce(new Vector2(0, Constants.ACCELERATION_DUE_TO_GRAVITY)); // Apply gravity

// Compute and apply drag
let drag = projectile.computeDrag(); // This is assuming you've defined `computeDrag()`
drag.x = +drag.x.toFixed(2);
drag.y = +drag.y.toFixed(2);
projectile.applyForce(drag);

// Update the projectile (forward update)
projectile.update(deltaTime);
      if (!this.justRewound) {
        this.magGraph.addPoint(this.timeElapsed, projectile.velocity.magnitude);
        this.posGraph.addPoint(this.timeElapsed, projectile.position.y);
        this.accGraph.addPoint(this.timeElapsed, projectile.acceleration.magnitude);
      }
    }
    
    this.timeElapsed += deltaTime;
    this.justRewound = false; // Set flag when rewinding
    this.canvas.render();
  }
}

const sim: Simulation = Simulation.instance;
sim.init();

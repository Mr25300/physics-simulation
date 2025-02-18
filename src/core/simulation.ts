import { Vector2 } from "../math/vector2.js";
import { Projectile } from "../objects/projectile.js";
import { Canvas } from "../rendering/canvas.js";
import { Loop } from "./loop.js";
import { Obstacle } from "../objects/obstacle.js";
import { Rope } from "../objects/rope.js";
import { GraphHandler } from "../graphing/graphHandler.js";
import { Camera } from "../rendering/camera.js";
import { Controller } from "../interface/controller.js";

import "../interface/collapsible.js";

export interface Constants {
    airDensity: number,
}

export class Simulation extends Loop {
    public fixedTimestep: number = 0.01;

    public airDensity: number = 1.225;
    public gravityDirection: Vector2 = new Vector2(0, -1);
    public gravityAcceleration: number = 9.81;
    public coloumbConstant: number = 30;
    public gravitationalConstant: number = 1;

    private borderWidth: number = 20;
    private borderHeight: number = 10;

    public camera: Camera = new Camera();
    public controller: Controller = new Controller();
    public canvas: Canvas;
    private graphHandler: GraphHandler = new GraphHandler();

    public readonly ropes: Rope[] = [];
    public readonly projectiles: Projectile[] = [];
    public readonly obstacles: Obstacle[] = [];

    private static _instance: Simulation;

    public static get instance(): Simulation {
        if (!this._instance) this._instance = new Simulation();

        return this._instance;
    }

    public init(): void {
        const canvas: HTMLCanvasElement | null = document.querySelector("#simulation-screen");
        if (!canvas) throw new Error("Failed to get canvas.");

        this.canvas = new Canvas(canvas);

        this.projectiles.push(new Projectile(0.25, 0.5, 1, 1, 0.5, 0.5, 0.2, new Vector2(-2, 2)));
        this.projectiles.push(new Projectile(0.25, 0.5, 0, 1, 0.5, 0.5, 0.2, new Vector2(1, 0)));
        // this.ropes.push(new Rope(Vector2.zero, 4, this.projectiles[0]));
        this.obstacles.push(new Obstacle(0, 0.5, 0.5, [new Vector2(6, -4), new Vector2(-6, -4), new Vector2(-6, -6), new Vector2(6, -6)]));
        this.obstacles.push(new Obstacle(0, 0.5, 0.5, [new Vector2(-2.5, -2), new Vector2(2, -4), new Vector2(-2.5, -4)]));
        // this.obstacles.push(new Obstacle(0.5, 0.4, 0.3, [new Vector2(4, -4), new Vector2(4, 4)]));
        // this.obstacles.push(new Obstacle(0.5, 0.4, 0.3, [new Vector2(4, 4), new Vector2(-4, 4)]));
        // this.obstacles.push(new Obstacle(0.5, 0.4, 0.3, [new Vector2(-4, 4), new Vector2(-4, -4)]));

        // this.projectiles[0].applyForce(new Vector2(0, 10), true);

        // this.obstacles.push(new Obstacle(1, [
        //     new Vector2(-1, -3),
        //     new Vector2(1, -3),
        //     new Vector2(0, -1)
        // ]));

        // this.projectiles[0].applyForce(new Vector2(0, -10), true);
        // this.projectiles[1].applyForce(new Vector2(-10, 0), true);

        // this.graphHandler.activateProjectile(this.projectiles[0], 1);

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
            projectile.updateForces();
        }

        for (const rope of this.ropes) {
            rope.updateForces();
        }

        for (const projectile of this.projectiles) {
            projectile.updateKinematics(deltaTime);
        }

        for (const rope of this.ropes) {
            rope.updateKinematics();
        }

        this.camera.update();

        // this.graphHandler.updateGraph(this.elapsedTime);
        this.canvas.render();
    }
}

const sim: Simulation = Simulation.instance;
sim.init();

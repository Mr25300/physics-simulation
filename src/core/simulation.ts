import { Projectile } from "../physics/projectile.js";
import { Canvas } from "../rendering/canvas.js";
import { Loop } from "./loop.js";

export class Simulation extends Loop {
    private canvas: Canvas;
    
    public readonly projectiles: Projectile[] = [];

    private static _instance: Simulation;

    public static get instance(): Simulation {
        if (!this._instance) this._instance = new Simulation();

        return this._instance;
    }

    public init(): void {
        const canvas: HTMLCanvasElement | null = document.querySelector("canvas");
        if (!canvas) throw new Error("Failed to get canvas.");

        this.canvas = new Canvas(canvas);

        this.start();
    }

    public update(deltaTime: number): void {
        this.canvas.render();
    }
}

const sim: Simulation = Simulation.instance;
sim.init();
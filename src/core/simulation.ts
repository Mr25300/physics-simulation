import { Vector2 } from "../math/vector2.js";
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

        this.projectiles.push(new Projectile(1, 1, 0.5, Vector2.zero));
    }

    public update(deltaTime: number): void {
        for (const projectile of this.projectiles) {
            projectile.update(deltaTime);
        }

        this.canvas.render();
    }
}

const sim: Simulation = Simulation.instance;
sim.init();
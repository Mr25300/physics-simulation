import { Simulation } from "../core/simulation.js";
import { Vector2 } from "../math/vector2.js";
import { Projectile } from "../physics/projectile.js";

export class Canvas {
    private SCREEN_UNIT_SCALE: number = 100;

    private context: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    private projectiles: Projectile[] = [];

    constructor(private canvas: HTMLCanvasElement) {
        const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
        if (!context) throw new Error("Failed to get canvas 2d context.");

        this.context = context;

        new ResizeObserver(() => {
            this.width = this.canvas.width = canvas.clientWidth;
            this.height = this.canvas.height = canvas.clientHeight;

        }).observe(canvas);
    }

    private posToPixel(position: Vector2): Vector2 {
        return new Vector2(this.width / 2, this.height / 2).add(this.vecToPixel(position));
    }

    private vecToPixel(vector: Vector2): Vector2 {
        return new Vector2(vector.x * this.SCREEN_UNIT_SCALE, -vector.y * this.SCREEN_UNIT_SCALE);
    }

    private drawArrow(origin: Vector2, vector: Vector2): void {
        const pixelOrigin: Vector2 = this.posToPixel(origin);
        const pixelEnd: Vector2 = this.posToPixel(origin.add(vector));
        const pixelDir: Vector2 = this.vecToPixel(vector).unit();

        this.context.beginPath();
        this.context.moveTo(pixelOrigin.x, pixelOrigin.y);
        this.context.lineTo(pixelEnd.x, pixelEnd.y);
        this.context.stroke();

        const corner1: Vector2 = pixelEnd.subtract(pixelDir.rotate(-30 * Math.PI / 180).multiply(10));
        const corner2: Vector2 = pixelEnd.subtract(pixelDir.rotate(30 * Math.PI / 180).multiply(10));

        this.context.beginPath();
        this.context.moveTo(pixelEnd.x, pixelEnd.y);
        this.context.lineTo(corner1.x, corner1.y);
        this.context.lineTo(corner2.x, corner2.y);
        this.context.lineTo(pixelEnd.x, pixelEnd.y);
        this.context.closePath();
        this.context.fill();
    }

    public render(): void {
        this.context.clearRect(0, 0, this.width, this.height);

        for (const projectile of Simulation.instance.projectiles) {
            const screenX: number = this.width / 2 + projectile.position.x / this.SCREEN_UNIT_SCALE;
            const screenY: number = this.height / 2 - projectile.position.y / this.SCREEN_UNIT_SCALE;
            const screenRad: number = projectile.radius / this.SCREEN_UNIT_SCALE;

            this.context.fillStyle = "black";
            this.context.beginPath();
            this.context.arc(screenX, screenY, screenRad, 0, 2 * Math.PI);
            this.context.fill();
        }

        const vector: Vector2 = Vector2.fromAngle(30 * Math.PI / 180).multiply(2);

        this.drawArrow(Vector2.zero, vector);
    }
}
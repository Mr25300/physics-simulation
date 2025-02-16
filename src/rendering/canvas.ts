import { Simulation } from "../core/simulation.js";
import { Vector2 } from "../math/vector2.js";
import { Projectile } from "../objects/projectile.js";

export class Canvas {
    private readonly SCREEN_UNIT_SCALE: number = 50;
    private readonly ARROW_HEIGHT: number = 0.12;
    private readonly ARROW_WIDTH: number = 0.13;

    private context: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    constructor(private canvas: HTMLCanvasElement) {
        const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
        if (!context) throw new Error("Failed to get canvas 2d context.");

        this.context = context;

        new ResizeObserver(() => {
            this.width = this.canvas.width = canvas.clientWidth;
            this.height = this.canvas.height = canvas.clientHeight;

        }).observe(canvas);
    }

    private pointToPixels(point: Vector2): Vector2 {
        return new Vector2(this.width / 2, this.height / 2).add(this.vecToPixels(point));
    }

    private vecToPixels(vector: Vector2): Vector2 {
        return new Vector2(vector.x * this.SCREEN_UNIT_SCALE, -vector.y * this.SCREEN_UNIT_SCALE);
    }

    private drawShape(corners: Vector2[], fill: boolean = false): void {
        const pixelCorners: Vector2[] = [];

        for (let i = 0; i < corners.length; i++) {
            pixelCorners[i] = this.pointToPixels(corners[i]);
        }

        this.context.beginPath();

        for (let i = 0; i < corners.length + 1; i++) {
            const corner: Vector2 = pixelCorners[i % corners.length];

            if (i === 0) this.context.moveTo(corner.x, corner.y);
            else this.context.lineTo(corner.x, corner.y);
        }

        this.context.closePath();
        if (fill) this.context.fill();
        else this.context.stroke();
    }

    private drawArrow(origin: Vector2, vector: Vector2, style: string): void {
        vector = vector.divide(5);
        
        if (vector.magnitude < 0.01) return;

        const arrowEnd: Vector2 = origin.add(vector);
        const widthVec: Vector2 = vector.unit.orthogonal.multiply(vector.magnitude * this.ARROW_WIDTH / 2 + 0.05);
        const lengthVec: Vector2 = vector.unit.multiply(vector.magnitude * this.ARROW_HEIGHT + 0.1);

        this.context.fillStyle = style;
        this.context.strokeStyle = style;
        this.context.lineWidth = 2;

        this.drawShape([origin, arrowEnd]);
        this.drawShape([arrowEnd.add(widthVec), arrowEnd.subtract(widthVec), arrowEnd.add(lengthVec)], true);
    }

    public render(): void {
        this.context.clearRect(0, 0, this.width, this.height);

        for (const obstacle of Simulation.instance.obstacles) {
            const screenVertices: Vector2[] = [];

            for (const vertex of obstacle.vertices) {
                screenVertices.push(this.pointToPixels(vertex));
            }
            
            this.context.strokeStyle = "black";
            this.context.fillStyle = "black";
            this.context.beginPath();
            this.context.moveTo(screenVertices[0].x, screenVertices[0].y);

            for (let i = 0; i < screenVertices.length; i++) {
                const vertex: Vector2 = screenVertices[(i + 1) % screenVertices.length];

                this.context.lineTo(vertex.x, vertex.y);
            }

            this.context.closePath();
            this.context.stroke();
            this.context.fill();
        }

        for (const projectile of Simulation.instance.projectiles) {
            const screenPos = this.pointToPixels(projectile.position);

            this.context.fillStyle = "black";
            this.context.beginPath();
            this.context.arc(screenPos.x, screenPos.y, projectile.radius * this.SCREEN_UNIT_SCALE, 0, 2 * Math.PI);
            this.context.fill();
        }

        for (const projectile of Simulation.instance.projectiles) {
            for (const force of projectile.forces) {
                this.drawArrow(projectile.position, force.vector, "red");
            }

            this.drawArrow(projectile.position, projectile._velocity, "green");
        }
    }
}

import { Simulation } from "../core/simulation.js";
import { Vector2 } from "../math/vector2.js";
import { ForceType } from "../objects/projectile.js";

export class Canvas {
    private readonly ARROW_HEIGHT: number = 0.2;
    private readonly ARROW_WIDTH: number = 0.2;
    private readonly ROPE_MIN_WIDTH: number = 0.05;
    private readonly ROPE_MAX_WIDTH: number = 0.2;

    private readonly BORDER_COLOR: string = "blue";

    private readonly FORCE_COLORS: Record<ForceType, string> = {
        [ForceType.unspecified]: "purple",
        [ForceType.gravity]: "blue",
        [ForceType.normal]: "red",
        [ForceType.tension]: "orange",
        [ForceType.friction]: "yellow",
        [ForceType.drag]: "white"
    }

    private context: CanvasRenderingContext2D;
    private width: number;
    private height: number;

    constructor(private canvas: HTMLCanvasElement) {
        const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
        if (!context) throw new Error("Failed to get canvas 2d context.");

        this.context = context;

        this.updateDimensions();

        new ResizeObserver(() => {
            this.updateDimensions();

        }).observe(canvas);
    }

    private updateDimensions(): void {
        this.width = this.canvas.width = this.canvas.clientWidth;
        this.height = this.canvas.height = this.canvas.clientHeight;
    }

    public scaleToPixels(scale: number): number {
        return scale / Simulation.instance.camera.range * this.height / 2;
    }

    public pixelsToScale(scale: number): number {
        return scale / (this.height / 2) * Simulation.instance.camera.range;
    }

    public vecToPixels(vector: Vector2): Vector2 {
        return new Vector2(this.scaleToPixels(vector.x), this.scaleToPixels(-vector.y));
    }

    public pixelsToVec(pixels: Vector2): Vector2 {
        return new Vector2(this.pixelsToScale(pixels.x), this.pixelsToScale(-pixels.y));
    }

    public pointToPixels(point: Vector2): Vector2 {
        const viewPoint: Vector2 = point.subtract(Simulation.instance.camera.position);

        return new Vector2(this.width / 2, this.height / 2).add(this.vecToPixels(viewPoint));
    }

    public pixelsToPoint(pixels: Vector2): Vector2 {
        const centerOffset: Vector2 = pixels.subtract(new Vector2(this.width / 2, this.height / 2));

        return Simulation.instance.camera.position.add(this.pixelsToVec(centerOffset));
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
        const widthVec: Vector2 = vector.unit.orthogonal.multiply((vector.magnitude / 2 + 1) * this.ARROW_WIDTH / 2);
        const lengthVec: Vector2 = vector.unit.multiply((vector.magnitude / 2 + 1) * this.ARROW_HEIGHT);

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
            // this.context.fill();
        }

        for (const projectile of Simulation.instance.projectiles) {
            const screenPos = this.pointToPixels(projectile.position);

            this.context.fillStyle = "black";
            this.context.beginPath();
            this.context.arc(screenPos.x, screenPos.y, this.scaleToPixels(projectile.radius), 0, 2 * Math.PI);
            this.context.fill();
        }

        for (const rope of Simulation.instance.ropes) {
            const start: Vector2 = rope.origin;
            const end: Vector2 = rope.attachment.position;
            const distance: number = start.subtract(end).magnitude;
            const ropeStretch: number = distance / rope.length;
            const ropeWidth: number = this.ROPE_MIN_WIDTH * ropeStretch + this.ROPE_MAX_WIDTH * (1 - ropeStretch);

            this.context.strokeStyle = "brown";
            this.context.lineWidth = this.scaleToPixels(ropeWidth);

            this.drawShape([start, end]);
        }

        for (const projectile of Simulation.instance.projectiles) {
            for (const force of projectile.forces) {
                this.drawArrow(projectile.position, force.vector, this.FORCE_COLORS[force.type]);
            }

            this.drawArrow(projectile.position, projectile._velocity, "green");
        }
    }
}

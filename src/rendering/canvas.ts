import { Simulation } from "../core/simulation.js";
import { Vector2 } from "../math/vector2.js";
import { ForceType } from "../objects/projectile.js";

interface DrawStyle {
    fill?: boolean;
    fillInvert?: boolean;
    stroke?: boolean;
    fillStyle?: string;
    strokeStyle?: string;
    strokeWidth?: number;
}

export class RenderLayer {
    public readonly element: HTMLCanvasElement;
    public readonly context: CanvasRenderingContext2D;

    constructor(private renderer: Renderer) {
        this.element = document.createElement("canvas");
        this.context = this.element.getContext("2d")!;
        if (!this.context) throw new Error("Failed to get mask canvas 2d context.");
    }

    public updateDimensions(width: number, height: number): void {
        this.element.width = width;
        this.element.height = height;
    }

    public drawShape(vertices: Vector2[], radius: number, drawStyle: DrawStyle): void {
        const pixelVertices: Vector2[] = [];

        for (let i = 0; i < vertices.length; i++) {
            pixelVertices[i] = this.renderer.pointToPixels(vertices[i]);
        }

        if (drawStyle.fillStyle) this.context.fillStyle = drawStyle.fillStyle;
        if (drawStyle.strokeStyle) this.context.strokeStyle = drawStyle.strokeStyle;
        if (drawStyle.strokeWidth) this.context.lineWidth = drawStyle.strokeWidth;

        this.context.beginPath();

        const pixelRad: number = this.renderer.scaleToPixels(radius);

        for (let i = 0; i < vertices.length; i++) {
            const pixelVert: Vector2 = pixelVertices[i % vertices.length];
            const prevVert: Vector2 = pixelVertices[(i - 1 + vertices.length) % vertices.length];
            const nextVert: Vector2 = pixelVertices[(i + 1) % vertices.length];

            let startAngle: number;
            let endAngle: number;

            if (vertices.length > 1) {
                const prevDir: Vector2 = pixelVert.subtract(prevVert).unit;
                const nextDir: Vector2 = nextVert.subtract(pixelVert).unit;
                const pixelRadStart: Vector2 = prevVert.add(prevDir.orthogonal.multiply(pixelRad));
                const pixelRadEnd: Vector2 = pixelVert.add(prevDir.orthogonal.multiply(pixelRad));

                startAngle = prevDir.angle;
                endAngle = nextDir.angle;

                if (i === 0) this.context.moveTo(pixelRadStart.x, pixelRadStart.y);
                else this.context.lineTo(pixelRadStart.x, pixelRadStart.y);

                this.context.lineTo(pixelRadEnd.x, pixelRadEnd.y);

            } else {
                startAngle = -0.001;
                endAngle = 2 * Math.PI;
            }

            this.context.arc(pixelVert.x, pixelVert.y, pixelRad, startAngle + Math.PI / 2, endAngle + Math.PI / 2, true);
        }

        this.context.closePath();

        if (drawStyle.fill && drawStyle.fillInvert) {
            this.context.fillRect(0, 0, this.element.width, this.element.height);
            this.context.globalCompositeOperation = "destination-out";
        }

        if (drawStyle.fill) this.context.fill();
        if (drawStyle.fill && drawStyle.fillInvert) this.context.globalCompositeOperation = "source-over";

        if (drawStyle.stroke) this.context.stroke();
    }

    public drawCircle(position: Vector2, radius: number, drawStyle: DrawStyle): void {
        const screenPos: Vector2 = this.renderer.pointToPixels(position);

        this.context.beginPath();
        this.context.arc(screenPos.x, screenPos.y, this.renderer.scaleToPixels(radius), 0, 2 * Math.PI);
        this.context.fill();
    }

    public drawArrow(origin: Vector2, vector: Vector2, tipWidth: number, tipHeight: number, lineWidth: number, drawStyle: DrawStyle): void {
        vector = vector.divide(5);

        if (vector.magnitude < 0.001) return;

        const arrowEnd: Vector2 = origin.add(vector);
        const thicknessVec: Vector2 = vector.unit.orthogonal.multiply(lineWidth);
        const widthVec: Vector2 = vector.unit.orthogonal.multiply((vector.magnitude / 2 + 1) * tipWidth / 2);
        const lengthVec: Vector2 = vector.unit.multiply((vector.magnitude / 2 + 1) * tipHeight);

        this.drawShape([
            origin.add(thicknessVec),
            arrowEnd.add(thicknessVec),
            arrowEnd.add(widthVec),
            arrowEnd.add(lengthVec),
            arrowEnd.subtract(widthVec),
            arrowEnd.subtract(thicknessVec),
            origin.subtract(thicknessVec)

        ], 0, drawStyle);
    }
}

export class Renderer {
    private readonly ARROW_HEIGHT: number = 0.2;
    private readonly ARROW_WIDTH: number = 0.2;
    private readonly ARROW_THICKNESS: number = 0.03;
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

    private inverseObstacleLayer: RenderLayer = new RenderLayer(this);
    private mainLayer: RenderLayer = new RenderLayer(this);
    private vectorLayer: RenderLayer = new RenderLayer(this);

    constructor(private canvas: HTMLCanvasElement) {
        this.context = canvas.getContext("2d")!;
        if (!this.context) throw new Error("Failed to get canvas 2d context.");

        this.updateDimensions();

        new ResizeObserver(() => {
            this.updateDimensions();

        }).observe(canvas);
    }

    private updateDimensions(): void {
        this.width = this.canvas.width = this.canvas.clientWidth;
        this.height = this.canvas.height = this.canvas.clientHeight;

        this.inverseObstacleLayer.updateDimensions(this.width, this.height);
        this.mainLayer.updateDimensions(this.width, this.height);
        this.vectorLayer.updateDimensions(this.width, this.height);
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

    public render(): void {
        this.context.clearRect(0, 0, this.width, this.height);
        this.inverseObstacleLayer.context.clearRect(0, 0, this.width, this.height);
        this.mainLayer.context.clearRect(0, 0, this.width, this.height);
        this.vectorLayer.context.clearRect(0, 0, this.width, this.height);

        for (const obstacle of Simulation.instance.obstacles) {
            const drawLayer: RenderLayer = obstacle.inverse ? this.inverseObstacleLayer : this.mainLayer;

            drawLayer.drawShape(obstacle.vertices, obstacle.radius, {
                fill: true,
                fillInvert: obstacle.inverse,
                stroke: true,
                fillStyle: obstacle.material.color,
                strokeStyle: "black",
                strokeWidth: 1
            });
        }

        for (const projectile of Simulation.instance.projectiles) {
            this.mainLayer.drawShape([projectile.position], projectile.radius, {
                fill: true,
                stroke: true,
                fillStyle: projectile.material.color,
                strokeStyle: "black",
                strokeWidth: 1
            });

            for (const force of projectile.forces) {
                this.vectorLayer.drawArrow(projectile.position, force.vector, this.ARROW_WIDTH, this.ARROW_HEIGHT, this.ARROW_THICKNESS, {
                    fill: true,
                    stroke: true,
                    fillStyle: this.FORCE_COLORS[force.type],
                    strokeStyle: "black",
                    strokeWidth: 1
                });
            }

            this.vectorLayer.drawArrow(projectile.position, projectile._velocity, this.ARROW_WIDTH, this.ARROW_HEIGHT, this.ARROW_THICKNESS, {
                fill: true,
                stroke: true,
                fillStyle: "green",
                strokeStyle: "black",
                strokeWidth: 1
            });
        }

        for (const rope of Simulation.instance.ropes) {
            const start: Vector2 = rope.origin;
            const end: Vector2 = rope.attachment.position;
            const distance: number = start.subtract(end).magnitude;
            const ropeStretch: number = distance / rope.length;
            const ropeWidth: number = this.ROPE_MIN_WIDTH * ropeStretch + this.ROPE_MAX_WIDTH * (1 - ropeStretch);

            this.context.strokeStyle = "brown";
            this.context.lineWidth = this.scaleToPixels(ropeWidth);

            this.mainLayer.drawShape([start, end], ropeWidth, {
                fill: true,
                stroke: true,
                fillStyle: rope.material.color,
                strokeStyle: "black",
                strokeWidth: 1
            });
        }

        this.context.drawImage(this.inverseObstacleLayer.element, 0, 0);
        this.context.drawImage(this.mainLayer.element, 0, 0);
        this.context.drawImage(this.vectorLayer.element, 0, 0);
    }
}

import { Simulation } from "../core/simulation.js";
import { Util } from "../math/util.js";
import { Vector2 } from "../math/vector2.js";
import { ForceType } from "../objects/projectile.js";
import { Camera } from "./camera.js";

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

  constructor(private renderer: Canvas) {
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
      this.context.fillStyle = "rgb(0, 0, 0)";
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
    if (vector.magnitude < 0.001) return;

    const logMagnitude: number = Math.min(Math.log(1 + vector.magnitude), 10);

    vector = vector.unit.multiply(logMagnitude);

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

  public drawText(text: string, position: Vector2, padScale: number, fontStyle: string, fontSize: number, drawStyle: DrawStyle): void {
    if (drawStyle.fillStyle) this.context.fillStyle = drawStyle.fillStyle;
    if (drawStyle.strokeStyle) this.context.strokeStyle = drawStyle.strokeStyle;
    if (drawStyle.strokeWidth) this.context.lineWidth = drawStyle.strokeWidth;

    this.context.font = `${fontSize}px "${fontStyle}"`;

    const metrics: TextMetrics = this.context.measureText(text);
    const width: number = metrics.width + metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    const height: number = fontSize + metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    const x: number = position.x + width / 2 * padScale;
    const y: number = position.y - height / 2 * padScale;

    if (drawStyle.fill) this.context.fillText(text, x, y);
    if (drawStyle.stroke) this.context.strokeText(text, x, y);
  }
}

export class Canvas {
  private readonly ARROW_HEIGHT: number = 0.2;
  private readonly ARROW_WIDTH: number = 0.2;
  private readonly ARROW_THICKNESS: number = 0.03;
  private readonly ROPE_MIN_WIDTH: number = 0.05;
  private readonly ROPE_MAX_WIDTH: number = 0.2;

  private readonly GRID_COLOR: string = "rgb(50, 50, 50)";
  private readonly GRID_TEXT_SIZE: number = 16;
  private readonly GRID_TEXT_COLOR: string = "rgb(100, 100, 100)";

  private readonly FORCE_COLORS: Record<ForceType, string> = {
    [ForceType.unspecified]: "green",
    [ForceType.gravity]: "blue",
    [ForceType.electrostatic]: "yellow",
    [ForceType.normal]: "white",
    [ForceType.tension]: "red",
    [ForceType.restoring]: "lightgreen",
    [ForceType.sFriction]: "purple",
    [ForceType.kFriction]: "orange",
    [ForceType.drag]: "lightblue"
  }

  private context: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private aspectRatio: number;

  private inverseObstacleLayer: RenderLayer = new RenderLayer(this);
  private mainLayer: RenderLayer = new RenderLayer(this);
  private detailLayer: RenderLayer = new RenderLayer(this);

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
    this.aspectRatio = this.width / this.height;

    this.inverseObstacleLayer.updateDimensions(this.width, this.height);
    this.mainLayer.updateDimensions(this.width, this.height);
    this.detailLayer.updateDimensions(this.width, this.height);
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
    const camera: Camera = Simulation.instance.camera;

    this.context.clearRect(0, 0, this.width, this.height);
    this.inverseObstacleLayer.context.clearRect(0, 0, this.width, this.height);
    this.mainLayer.context.clearRect(0, 0, this.width, this.height);
    this.detailLayer.context.clearRect(0, 0, this.width, this.height);

    let minX: number = camera.position.x - camera.range * this.aspectRatio;
    let maxX: number = camera.position.x + camera.range * this.aspectRatio;
    let minY: number = camera.position.y - camera.range;
    let maxY: number = camera.position.y + camera.range;

    let gridScale: number = 10 ** Math.floor(Math.log10(camera.range / 3));

    for (let x: number = Math.ceil(minX / gridScale); x <= Math.floor(maxX / gridScale); x++) {
      const start: Vector2 = new Vector2(x * gridScale, minY);
      const end: Vector2 = new Vector2(x * gridScale, maxY);

      this.mainLayer.drawShape([start, end], 0, {
        stroke: true,
        strokeWidth: 1,
        strokeStyle: this.GRID_COLOR
      });
    }

    for (let y: number = Math.ceil(minY / gridScale); y <= Math.floor(maxY / gridScale); y++) {
      const start: Vector2 = new Vector2(minX, y * gridScale);
      const end: Vector2 = new Vector2(maxX, y * gridScale);

      this.mainLayer.drawShape([start, end], 0, {
        stroke: true,
        strokeWidth: 1,
        strokeStyle: this.GRID_COLOR
      });
    }

    const text: string = `${Util.formatSigFigs(gridScale, 1)}m`;

    this.detailLayer.drawText(text, new Vector2(this.width - 10, 10), -1, "Courier New", this.GRID_TEXT_SIZE, {
      fill: true,
      fillStyle: this.GRID_TEXT_COLOR
    });

    for (const obstacle of Simulation.instance.obstacles) {
      const drawLayer: RenderLayer = obstacle.inverse ? this.inverseObstacleLayer : this.mainLayer;

      drawLayer.drawShape(obstacle.vertices, obstacle.radius, {
        fill: true,
        fillInvert: obstacle.inverse,
        fillStyle: obstacle.material.color
      });

      if (obstacle === Simulation.instance.controller.selected || obstacle === Simulation.instance.controller.hovering) {
        this.detailLayer.drawShape(obstacle.vertices, obstacle.radius, {
          fill: true,
          stroke: true,
          fillInvert: obstacle.inverse,
          fillStyle: "rgba(255, 255, 255, 0.5)",
          strokeStyle: "rgb(255, 255, 255)"
        });
      }
    }

    for (const projectile of Simulation.instance.projectiles) {
      this.mainLayer.drawShape([projectile.position], projectile.radius, {
        fill: true,
        fillStyle: projectile.material.color
      });

      if (projectile === Simulation.instance.controller.selected || projectile === Simulation.instance.controller.hovering) {
        this.detailLayer.drawShape([projectile.position], projectile.radius, {
          fill: true,
          stroke: true,
          fillStyle: "rgba(255, 255, 255, 0.5)",
          strokeStyle: "rgb(255, 255, 255)"
        });
      }

      for (const force of projectile.forces) {
        let relativeForce: Vector2 = force.vector;

        if (camera.frameOfReference) {
          for (const camForce of camera.frameOfReference.forces) {
            if (camForce.type === force.type) {
              relativeForce = relativeForce.subtract(camForce.vector.multiply(projectile.mass / camera.frameOfReference.mass));
            }
          }
        }

        this.detailLayer.drawArrow(projectile.position, relativeForce, this.ARROW_WIDTH, this.ARROW_HEIGHT, this.ARROW_THICKNESS, {
          fill: true,
          fillStyle: this.FORCE_COLORS[force.type]
        });
      }

      if (camera.frameOfReference) {
        for (const camForce of camera.frameOfReference.forces) {
          let forceFound: boolean = false;

          for (const force of projectile.forces) {
            if (force.type === camForce.type) {
              forceFound = true;

              break;
            }
          }

          if (!forceFound) {
            const relativeForce = camForce.vector.multiply(-projectile.mass / camera.frameOfReference.mass);

            this.detailLayer.drawArrow(projectile.position, relativeForce, this.ARROW_WIDTH, this.ARROW_HEIGHT, this.ARROW_THICKNESS, {
              fill: true,
              fillStyle: this.FORCE_COLORS[camForce.type]
            });
          }
        }
      }

      let relativeVel: Vector2 = projectile.velocity;

      if (camera.frameOfReference) {
        relativeVel = relativeVel.subtract(camera.frameOfReference.velocity);
      }

      this.detailLayer.drawArrow(projectile.position, relativeVel, this.ARROW_WIDTH, this.ARROW_HEIGHT, this.ARROW_THICKNESS, {
        fill: true,
        fillStyle: "green"
      });
    }

    for (const constraint of Simulation.instance.constraints) {
      const start: Vector2 = constraint.origin;
      const end: Vector2 = constraint.attachment.position;
      const distance: number = start.subtract(end).magnitude;
      const ropeStretch: number = distance / constraint.length;
      const ropeWidth: number = Math.max(this.ROPE_MIN_WIDTH * ropeStretch + this.ROPE_MAX_WIDTH * Math.abs(1 - ropeStretch), 0);

      this.mainLayer.drawShape([start, end], ropeWidth, {
        fill: true,
        fillStyle: constraint.material.color,
      });
    }

    this.context.drawImage(this.mainLayer.element, 0, 0);
    this.context.drawImage(this.inverseObstacleLayer.element, 0, 0);
    this.context.drawImage(this.detailLayer.element, 0, 0);
  }
}

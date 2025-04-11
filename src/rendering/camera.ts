import { Simulation } from "../core/simulation.js";
import { Util } from "../math/util.js";
import { Vector2 } from "../math/vector2.js";
import { Projectile } from "../objects/projectile.js";

export class Camera {
  private readonly MIN_ZOOM: number = 0;
  private readonly MAX_ZOOM: number = 2.5;
  private readonly ZOOM_SENSITIVITY: number = 0.001;

  private translation: Vector2 = Vector2.zero;
  private zoom: number = 1;

  private _position: Vector2 = Vector2.zero;
  private _range: number = 0;

  private _frameOfReference: Projectile | undefined;

  public get position(): Vector2 {
    return this._position;
  }

  public get range(): number {
    return this._range;
  }

  public get frameOfReference(): Projectile | undefined {
    return this._frameOfReference;
  }

  public update(): void {
    const moveAmount: Vector2 = Simulation.instance.canvas.pixelsToVec(Simulation.instance.inputHandler.drag);
    const zoomAmount: number = Simulation.instance.inputHandler.scroll * this.ZOOM_SENSITIVITY;

    this.zoom = Util.clamp(this.zoom + zoomAmount, this.MIN_ZOOM, this.MAX_ZOOM);
    this.translation = this.translation.subtract(moveAmount);

    this._range = 10 ** this.zoom;
    this._position = this.translation;

    if (this._frameOfReference) this._position = this._position.add(this._frameOfReference.position);
  }

  public setFrameOfReference(frame: Projectile | undefined): void {
    if (frame === undefined) {
      this.translation = this.position;

    } else {
      this.translation = Vector2.zero;
    }

    this._frameOfReference = frame;
  }
}
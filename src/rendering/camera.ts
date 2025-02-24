import { Simulation } from "../core/simulation.js";
import { Util } from "../math/util.js";
import { Vector2 } from "../math/vector2.js";
import { Projectile } from "../projectiles/projectile.js";

export class Camera {
    private readonly MIN_ZOOM: number = Math.log10(3);
    private readonly MAX_ZOOM: number = Math.log10(20);
    private readonly ZOOM_SENSITIVITY: number = 0.001;

    public frameOfReference: Projectile | undefined;

    private zoom: number = 1;

    private _position: Vector2 = Vector2.zero;
    private _range: number = 0;

    public get position(): Vector2 {
        return this._position;
    }

    public get range(): number {
        return this._range;
    }

    public update(): void {
        const moveAmount: Vector2 = Simulation.instance.canvas.pixelsToVec(Simulation.instance.controller.drag);
        const zoomAmount: number = Simulation.instance.controller.scroll * this.ZOOM_SENSITIVITY;

        this.zoom = Util.clamp(this.zoom + zoomAmount, this.MIN_ZOOM, this.MAX_ZOOM);

        this._position = this._position.subtract(moveAmount);
        this._range = 10 ** this.zoom;
    }
}
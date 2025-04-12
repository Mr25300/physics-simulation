import { Simulation } from "../core/simulation.js";
import { Vector2 } from "../math/vector2.js";
import { Obstacle } from "../objects/obstacle.js";
import { Projectile } from "../objects/projectile.js";

export class InputHandler {
  private rightMouseDown: boolean = false;
  private mousePos: Vector2 = Vector2.zero;
  private dragAmount: Vector2 = Vector2.zero;
  private scrollAmount: number = 0;
  private _clicked: boolean = false;

  constructor(private display: HTMLCanvasElement) {
    display.addEventListener("mousedown", (event: MouseEvent) => {
      if (event.button === 0) this._clicked = true;
      else if (event.button === 2) this.rightMouseDown = true;
    });

    document.addEventListener("mouseup", (event: MouseEvent) => {
      if (event.button === 2) this.rightMouseDown = false;
    });

    document.addEventListener("mousemove", (event: MouseEvent) => {
      const mousePos: Vector2 = new Vector2(event.clientX, event.clientY);

      if (this.rightMouseDown) this.dragAmount = this.dragAmount.add(mousePos.subtract(this.mousePos));
      this.mousePos = mousePos;
    });

    display.addEventListener("wheel", (event: WheelEvent) => {
      this.scrollAmount = event.deltaY;
    });
  }

  public get scroll(): number {
    const scrollAmount: number = this.scrollAmount;
    this.scrollAmount = 0;

    return scrollAmount;
  }

  public get drag(): Vector2 {
    const dragAmount: Vector2 = this.dragAmount;
    this.dragAmount = Vector2.zero;

    return dragAmount;
  }

  public get clicked(): boolean {
    if (this._clicked) {
      this._clicked = false;

      return true;
    }

    return false;
  }

  public getCursorObject(): Projectile | Obstacle | undefined {
    const mouseLocation: Vector2 = Simulation.instance.canvas.pixelsToPoint(this.mousePos);
    let selected: Projectile | Obstacle | undefined;

    for (const obstacle of Simulation.instance.obstacles) {
      if (obstacle.isPointInside(mouseLocation)) selected = obstacle;
    }

    for (const projectile of Simulation.instance.projectiles) {
      if (projectile.isPointInside(mouseLocation)) selected = projectile;
    }

    return selected;
  }

  public setHoverMode(mode: boolean): void {
    if (mode) this.display.classList.add("hovering");
    else this.display.classList.remove("hovering");
  }

  public setDragMode(mode: boolean): void {
    if (mode) this.display.classList.add("dragging");
    else this.display.classList.remove("dragging");
  }
}
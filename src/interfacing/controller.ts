import { Simulation } from "../core/simulation.js";
import { Vector2 } from "../math/vector2.js";
import { Obstacle } from "../objects/obstacle.js";
import { Projectile } from "../objects/projectile.js";

export class DisplayControl {
  private rightMouseDown: boolean = false;
  private mousePos: Vector2 = Vector2.zero;
  private dragAmount: Vector2 = Vector2.zero;
  private scrollAmount: number = 0;
  private _clicked: boolean = false;

  private _hovering: Projectile | Obstacle | undefined;
  private _selected: Projectile | Obstacle | undefined;

  constructor(display: HTMLCanvasElement) {
    display.addEventListener("mousedown", (event: MouseEvent) => {
      if (event.button === 2) this.rightMouseDown = true;
      this.mousePos = new Vector2(event.clientX, event.clientY);

      if (event.button === 1) {
        this._clicked = true;
        this._selected = this.getObjectAtMouse();
      }
    });

    document.addEventListener("mouseup", (event: MouseEvent) => {
      if (event.button === 2) this.rightMouseDown = false;
    });

    display.addEventListener("mousemove", (event: MouseEvent) => {
      const mousePos: Vector2 = new Vector2(event.clientX, event.clientY);

      if (this.rightMouseDown) this.dragAmount = this.dragAmount.add(mousePos.subtract(this.mousePos));
      this.mousePos = mousePos;

      this._hovering = this.getObjectAtMouse();

      if (this._hovering) display.classList.add("hovering");
      else display.classList.remove("hovering");
    });

    display.addEventListener("wheel", (event: WheelEvent) => {
      this.scrollAmount = event.deltaY;
    });
  }

  private getObjectAtMouse(): Projectile | Obstacle | undefined {
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

  public get hovering(): Projectile | Obstacle | undefined {
    return this._hovering;
  }

  public get selected(): Projectile | Obstacle | undefined {
    const selected = this._selected;
    this._selected = undefined;

    return selected;
  }
}
import { Vector2 } from "../math/vector2.js";

export class Controller {
  private rightMouseDown: boolean = false;
  private mousePos: Vector2 = Vector2.zero;
  private dragAmount: Vector2 = Vector2.zero;
  private scrollAmount: number = 0;
  private _clicked: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    canvas.addEventListener("mousedown", (event: MouseEvent) => {
      if (event.button === 2) this.rightMouseDown = true;
      this.mousePos = new Vector2(event.clientX, event.clientY);

      if (event.button === 1) this._clicked = true;
    });

    document.addEventListener("mouseup", (event: MouseEvent) => {
      if (event.button === 2) this.rightMouseDown = false;
    });

    document.addEventListener("mousemove", (event: MouseEvent) => {
      const mousePos: Vector2 = new Vector2(event.clientX, event.clientY);

      if (this.rightMouseDown) this.dragAmount = this.dragAmount.add(mousePos.subtract(this.mousePos));
      this.mousePos = mousePos;
    });

    canvas.addEventListener("wheel", (event: WheelEvent) => {
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
}
import { Util } from "../math/util.js";

export abstract class Loop {
  private _running: boolean = true;
  private _elapsedTime: number = 0;
  private _fps: number = 0;
  private _timeScale: number = 1;
  public timeReverse: boolean = false;

  private lastTime?: number;
  private deltaTime: number = 0;
  private minTimestep: number = 0.005;

  public get running(): boolean {
    return this._running;
  }

  public get elapsedTime(): number {
    return this._elapsedTime;
  }

  public get fps(): number {
    return this._fps;
  }

  public set timeScale(scale: number) {
    this._timeScale = Math.max(scale, 0);
  }

  protected start(): void {
    requestAnimationFrame((timestamp: number) => {
      this.loop(timestamp);
    });
  }

  public pause(): void {
    this._running = false;
  }

  public resume(): void {
    this._running = true;
  }

  public advance(deltaTime: number): void {
    this.deltaTime += deltaTime;
    this._elapsedTime += deltaTime;

    while (Math.abs(this.deltaTime) >= this.minTimestep) {
      const timeStep: number = Util.sign(this.deltaTime) * this.minTimestep;
      
      this.deltaTime -= timeStep;
      this.update(timeStep);
    }

    if (Math.abs(this.deltaTime) > 0) {
      this.update(this.deltaTime);
      this.deltaTime = 0;
    }
  }

  private loop(timestamp: number): void {
    const deltaTime: number = this.lastTime !== undefined ? (timestamp - this.lastTime) / 1000 : 0;
    this.lastTime = timestamp;
    this._fps = 1 / deltaTime;

    if (this._running) this.advance(deltaTime * (this.timeReverse ? -this._timeScale : this._timeScale));
    this.render();

    requestAnimationFrame((timestamp: number) => {
      this.loop(timestamp);
    });
  }

  protected abstract update(deltaTime: number): void;
  protected abstract render(): void;
}

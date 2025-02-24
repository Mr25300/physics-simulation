import { Util } from "../math/util.js";

export abstract class Loop {
    private _running: boolean = true;
    private _elapsedTime: number = 0;
    private _fps: number;
    private _timeScale: number = 1;

    private lastTime?: number;
    private deltaTime: number = 0;
    private updateTimestep: number = 0.01;

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
        this._timeScale = scale;
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
        const absTime: number = Math.abs(deltaTime);
        
        this.deltaTime += absTime;
        this._elapsedTime += absTime;

        while (this.deltaTime >= this.updateTimestep) {
            this.deltaTime -= this.updateTimestep;
            this.update(Util.sign(deltaTime) * this.updateTimestep);
        }
    }

    private loop(timestamp: number): void {
        const deltaTime: number = (this.lastTime !== undefined ? (timestamp - this.lastTime) / 1000 : 0) * this._timeScale;
        this.lastTime = timestamp;
        this._fps = 1 / Math.abs(deltaTime);

        if (this._running) this.advance(deltaTime);
        this.render();

        requestAnimationFrame((timestamp: number) => {
            this.loop(timestamp);
        });
    }

    protected abstract update(deltaTime: number): void;
    protected abstract render(): void;
}

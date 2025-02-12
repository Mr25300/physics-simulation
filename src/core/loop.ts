export abstract class Loop {
    private _running: boolean = false;
    private lastTime?: number;
    private _elapsedTime: number = 0;
    private _fps: number;

    public start(): void {
        if (this._running) return;
        this._running = true;

        requestAnimationFrame((timestamp: number) => {
            this.loop(timestamp);
        });
    }

    private loop(timestamp: number): void {
        if (!this._running) return;

        const deltaTime: number = this.lastTime !== undefined ? (timestamp - this.lastTime) / 1000 : 0;
        this.lastTime = timestamp;

        this._elapsedTime += deltaTime;
        this._fps = 1 / deltaTime;

        this.update(deltaTime);

        requestAnimationFrame((timestamp: number) => {
            this.loop(timestamp);
        });
    }

    public get running(): boolean {
        return this._running;
    }

    public get elapsedTime(): number {
        return this._elapsedTime;
    }

    public get fps(): number {
        return this._fps;
    }

    public stop(): void {
        if (!this._running) return;
        this._running = false;

        delete this.lastTime;
        this._elapsedTime = 0;
    }

    protected abstract update(deltaTime: number): void;
}

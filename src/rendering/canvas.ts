class Canvas {
    private context: CanvasRenderingContext2D;

    constructor(private canvas: HTMLCanvasElement) {
        const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
        if (!context) throw new Error("Failed to get canvas 2d context.");

        this.context = context;
    }

    public render(): void {
        
    }
}
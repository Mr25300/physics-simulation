/** 
 * Our base graph class
 * @example     
 * Creating a basic graph
 * ``const cc = document.getElementById('graphCanvas') as HTMLCanvasElement;
 * const graph = new Graph(cc, 'X Values', 'Y Values');
 * graph.addPoint(10, 20); 
 * graph.addPoint(20, 35);
 * graph.addPoint(30, 15);
 * graph.addPoint(12, 15);
 * graph.addPoint(27, 15);``
 * 
 **/
export class Graph {
  private _points: { x: number; y: number }[] = [];
  private ctx: CanvasRenderingContext2D;

  
  public get points() : { x: number; y: number }[] {
    return this._points;
  }
  
  public get canvas(): HTMLCanvasElement {
    return this._canvas;
  }


  constructor(
    private _canvas: HTMLCanvasElement,
    private xLabel: string,
    private yLabel: string
  ) {
    const ctx = _canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    this.ctx = ctx;

    // Handle high DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = _canvas.getBoundingClientRect();
    _canvas.width = rect.width * dpr;
    _canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.reset();
  }

  reset() {
    this._points = [];
    this.draw();
  }
  
  addPoint(x: number, y: number) {
    // Remove existing point with same x and add new point
    this._points = this._points.filter((point) => point.x !== x);
    this._points.push({ x, y });
    this._points.sort((a, b) => a.x - b.x);
    this.draw();
  }

  private draw() {
    const ctx = this.ctx;
    const canvas = this._canvas;
    const dpr = window.devicePixelRatio || 1;

    // Get dimensions in CSS pixels
    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width;
    const cssHeight = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up padding
    const padding = {
      top: 30,
      right: 30,
      bottom: 50,
      left: 60,
    };

    // Draw axes
    ctx.save();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, cssHeight - padding.bottom);

    // X-axis
    ctx.moveTo(padding.left, cssHeight - padding.bottom);
    ctx.lineTo(cssWidth - padding.right, cssHeight - padding.bottom);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = "black";
    ctx.font = "14px Arial";

    // X-axis label
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      this.xLabel,
      cssWidth / 2,
      cssHeight - padding.bottom + 25
    );

    // Y-axis label
    ctx.save();
    ctx.translate(
      padding.left - 45,
      padding.top + (cssHeight - padding.top - padding.bottom) / 2
    );
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.yLabel, 0, 0);
    ctx.restore();

    if (this._points.length === 0) {
      ctx.restore();
      return;
    }

    // Calculate data bounds
    const xs = this._points.map((p) => p.x);
    const ys = this._points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // Add padding for single-value cases
    const xRange = maxX - minX;
    const xPadding = xRange === 0 ? 1 : 0;
    const effectiveMinX = minX - xPadding;
    const effectiveMaxX = maxX + xPadding;

    const yRange = maxY - minY;
    const yPadding = yRange === 0 ? 1 : 0;
    const effectiveMinY = minY - yPadding;
    const effectiveMaxY = maxY + yPadding;

    // Generate ticks
    const xTicks = this.generateTicks(effectiveMinX, effectiveMaxX);
    const yTicks = this.generateTicks(effectiveMinY, effectiveMaxY);

    // Draw gridlines
    ctx.save();
    ctx.strokeStyle = "#eee";
    ctx.setLineDash([2, 2]);

    // Vertical gridlines (x-ticks)
    xTicks.forEach((x) => {
      const screenX = this.mapX(x, effectiveMinX, effectiveMaxX, padding, cssWidth);
      ctx.beginPath();
      ctx.moveTo(screenX, padding.top);
      ctx.lineTo(screenX, cssHeight - padding.bottom);
      ctx.stroke();
    });

    // Horizontal gridlines (y-ticks)
    yTicks.forEach((y) => {
      const screenY = this.mapY(y, effectiveMinY, effectiveMaxY, padding, cssHeight);
      ctx.beginPath();
      ctx.moveTo(padding.left, screenY);
      ctx.lineTo(cssWidth - padding.right, screenY);
      ctx.stroke();
    });
    ctx.restore();

    // Draw axis labels
    ctx.fillStyle = "black";
    ctx.font = "12px Arial";
    ctx.textBaseline = "top";
    ctx.textAlign = "center";

    // X-axis tick labels
    xTicks.forEach((x) => {
      const screenX = this.mapX(x, effectiveMinX, effectiveMaxX, padding, cssWidth);
      ctx.fillText(
        this.formatTick(x),
        screenX,
        cssHeight - padding.bottom + 5
      );
    });

    // Y-axis tick labels
    ctx.textAlign = "right";
    yTicks.forEach((y) => {
      const screenY = this.mapY(y, effectiveMinY, effectiveMaxY, padding, cssHeight);
      ctx.fillText(
        this.formatTick(y),
        padding.left - 5,
        screenY
      );
    });

    // Draw connecting line
    ctx.beginPath();
    this._points.forEach((point, index) => {
      const x = this.mapX(point.x, effectiveMinX, effectiveMaxX, padding, cssWidth);
      const y = this.mapY(point.y, effectiveMinY, effectiveMaxY, padding, cssHeight);
      index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw individual points
    ctx.fillStyle = "red";
    this._points.forEach((point) => {
      const x = this.mapX(point.x, effectiveMinX, effectiveMaxX, padding, cssWidth);
      const y = this.mapY(point.y, effectiveMinY, effectiveMaxY, padding, cssHeight);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  private mapX(
    x: number,
    effectiveMinX: number,
    effectiveMaxX: number,
    padding: { left: number; right: number },
    cssWidth: number
  ): number {
    return (
      padding.left +
      ((x - effectiveMinX) / (effectiveMaxX - effectiveMinX)) *
        (cssWidth - padding.left - padding.right)
    );
  }

  private mapY(
    y: number,
    effectiveMinY: number,
    effectiveMaxY: number,
    padding: { top: number; bottom: number },
    cssHeight: number
  ): number {
    return (
      cssHeight -
      padding.bottom -
      ((y - effectiveMinY) / (effectiveMaxY - effectiveMinY)) *
        (cssHeight - padding.top - padding.bottom)
    );
  }

  private generateTicks(min: number, max: number): number[] {
    const range = max - min;
    const tickCount = 8;
    const roughStep = range / (tickCount - 1);
    const step = this.niceNumber(roughStep);
    const firstTick = Math.ceil(min / step) * step;
    const lastTick = Math.floor(max / step) * step;
    const ticks: number[] = [];

    for (let t = firstTick; t <= lastTick + 0.000001; t += step) {
      ticks.push(t);
    }
    return ticks.length ? ticks : [min];
  }

  private niceNumber(value: number): number {
    const exponent = Math.floor(Math.log10(value));
    const fraction = value / Math.pow(10, exponent);
    let niceFraction = 1;

    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;

    return niceFraction * Math.pow(10, exponent);
  }

  private formatTick(value: number): string {
    // Format numbers with appropriate decimal places
    if (value === 0) return "0";
    const absValue = Math.abs(value);
    return absValue >= 1000 ? value.toExponential(0) :
           absValue >= 10 ? value.toFixed(0) :
           absValue >= 1 ? value.toFixed(1) :
           value.toFixed(2);
  }
}

export class Graph {
  private _points: { x: number; y: number }[] = [];
  private ctx: CanvasRenderingContext2D;
  private resizeObserver: ResizeObserver;

  public get points(): { x: number; y: number }[] {
    return this._points;
  }

  public get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  constructor(
    private _canvas: HTMLCanvasElement,
    public xLabel: string,
    public yLabel: string
  ) {
    const ctx = _canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    this.ctx = ctx;

    // Set canvas CSS dimensions to fill container
    _canvas.style.width = "100%";
    _canvas.style.height = "100%";

    // Handle initial high DPI scaling
    this.updateCanvasSize();

    // Setup resize observer to handle container size changes
    this.resizeObserver = new ResizeObserver(() => this.updateCanvasSize());
    this.resizeObserver.observe(_canvas.parentElement!);

    this.reset();
  }

  public updateCanvasSize() {
    const parent = this._canvas.parentElement;
    if (!parent) return;

    // Get dimensions from PARENT container
    const parentRect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set canvas buffer size to match parent
    this._canvas.width = parentRect.width * dpr;
    this._canvas.height = parentRect.height * dpr;

    // Scale context for DPI
    this.ctx.scale(dpr, dpr);
    this.draw(); // Force redraw
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
    if (this._points.length > 1000) {
      // console.log("DOWNLOAD");
    }
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
    ctx.strokeStyle = "white";
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
    ctx.fillStyle = "white";
    ctx.font = "14px Arial";

    // X-axis label
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(this.xLabel, cssWidth / 2, cssHeight - padding.bottom + 25);

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
      const screenX = this.mapX(
        x,
        effectiveMinX,
        effectiveMaxX,
        padding,
        cssWidth
      );
      ctx.beginPath();
      ctx.moveTo(screenX, padding.top);
      ctx.lineTo(screenX, cssHeight - padding.bottom);
      ctx.stroke();
    });

    // Horizontal gridlines (y-ticks)
    yTicks.forEach((y) => {
      const screenY = this.mapY(
        y,
        effectiveMinY,
        effectiveMaxY,
        padding,
        cssHeight
      );
      ctx.beginPath();
      ctx.moveTo(padding.left, screenY);
      ctx.lineTo(cssWidth - padding.right, screenY);
      ctx.stroke();
    });
    ctx.restore();

    // Draw axis labels
    ctx.fillStyle = "white";
    ctx.font = "12px Ubuntu";
    ctx.textBaseline = "top";
    ctx.textAlign = "center";

    // X-axis tick labels
    xTicks.forEach((x) => {
      const screenX = this.mapX(
        x,
        effectiveMinX,
        effectiveMaxX,
        padding,
        cssWidth
      );
      ctx.fillText(this.formatTick(x), screenX, cssHeight - padding.bottom + 5);
    });

    // Y-axis tick labels
    ctx.textAlign = "right";
    yTicks.forEach((y) => {
      const screenY = this.mapY(
        y,
        effectiveMinY,
        effectiveMaxY,
        padding,
        cssHeight
      );
      ctx.fillText(this.formatTick(y), padding.left - 5, screenY);
    });

    // Draw connecting line
    ctx.beginPath();
    this._points.forEach((point, index) => {
      const x = this.mapX(
        point.x,
        effectiveMinX,
        effectiveMaxX,
        padding,
        cssWidth
      );
      const y = this.mapY(
        point.y,
        effectiveMinY,
        effectiveMaxY,
        padding,
        cssHeight
      );
      index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw individual points
    ctx.fillStyle = "red";
    this._points.forEach((point) => {
      const x = this.mapX(
        point.x,
        effectiveMinX,
        effectiveMaxX,
        padding,
        cssWidth
      );
      const y = this.mapY(
        point.y,
        effectiveMinY,
        effectiveMaxY,
        padding,
        cssHeight
      );
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
    return absValue >= 1000
      ? value.toExponential(0)
      : absValue >= 10
        ? value.toFixed(0)
        : absValue >= 1
          ? value.toFixed(1)
          : value.toFixed(2);
  }

  private convertToCSV(
    delimiter: string = ",",
    maxPoints: number = 5000
  ): string {
    // Start with header
    let csv = `${this.xLabel}${delimiter}${this.yLabel}\n`;
    const totalPoints = this._points.length;

    if (totalPoints === 0) return csv; // Handle empty dataset

    if (totalPoints <= maxPoints) {
      // Simple case: use all points
      this._points.forEach(point => {
        csv += `${point.x}${delimiter}${point.y}\n`;
      });
      return csv;
    }

    // Reservoir Sampling with order preservation
    const reservoir: {x: number, y: number}[] = [];
    for (let i = 0; i < totalPoints; i++) {
      const point = this._points[i];

      // Fill reservoir first
      if (i < maxPoints) {
        reservoir.push(point);
      }
      // Randomly replace elements in reservoir
      else {
        const j = Math.floor(Math.random() * (i + 1));
        if (j < maxPoints) {
          reservoir[j] = point;
        }
      }
    }

    // Force include first and last original points
    reservoir[0] = this._points[0];  // Guarantee first point
    reservoir[maxPoints - 1] = this._points[totalPoints - 1];  // Guarantee last point

    // Sort reservoir by x-value to preserve order
    reservoir.sort((a, b) => a.x - b.x);

    // Add sampled points after header
    reservoir.forEach(point => {
      csv += `${point.x}${delimiter}${point.y}\n`;
    });

    return csv;
  }

  public startDownload(filename: string = "data.csv"): void {
    const csvContent = this.convertToCSV();

    // Create a Blob (binary large object) with the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create an invisible <a> element
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    // Make the <a> element invisible
    link.style.display = "none";

    // Append the <a> element to the document body (required for the download to work)
    document.body.appendChild(link);

    // Programmatically click the <a> element to trigger the download
    link.click();

    // Clean up by removing the <a> element and revoking the Blob URL
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  destroy() {
    this.resizeObserver.disconnect();
  }
}

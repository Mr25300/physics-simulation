import { Util } from "../math/util.js";

export class InputElement<Output> extends HTMLElement {
  private listenerCallback: (value: Output) => void;

  public addInputListener(callback: (value: Output) => void): void {
    this.listenerCallback = callback;
  }

  protected fireInputListener(value: Output): void {
    if (this.listenerCallback) this.listenerCallback(value);
  }
}

export class TextInput<V extends number | string> extends InputElement<V> {
  public static readonly commonUnits: Record<string, string> = {
    "gravitationalConstant": "m^3 * kg^-1 * s^-2",
    "coulombConstant": "N * m^2 * C^-2"
  };

  private textSpan: HTMLSpanElement;
  private unitSpan: HTMLSpanElement;

  private _value: V;
  private unitLength: number = 0;

  constructor(private numberInput?: boolean, private sigFigs: number = 2, value?: V, unit: string = "", private maxLength?: number) {
    super();

    if (numberInput || this.getAttribute("number-input") === "true") this.numberInput = true;

    this.className = "text-input-container";

    this.textSpan = document.createElement("span");
    this.textSpan.className = "text-input";
    this.textSpan.contentEditable = "true";
    this.textSpan.spellcheck = false;

    this.unitSpan = document.createElement("span");
    this.unitSpan.className = "text-input-unit";

    if (value !== undefined) this.value = value;
    this.unit = unit;
    this.initListeners();

    this.appendChild(this.textSpan);
    this.appendChild(this.unitSpan);
  }

  public get value(): V {
    return this._value;
  }

  public set value(newVal: V) {
    if (this.numberInput && isNaN(newVal as number)) {
      this.updateTextDisplay();

      return;
    }

    if (newVal !== this._value) {
      this._value = newVal;

      this.updateTextDisplay();
      this.fireInputListener(newVal);
    }
  }

  public set unit(newUnit: string) {
    const commonUnit: string = TextInput.commonUnits[newUnit];
    if (commonUnit) newUnit = commonUnit;

    const unitTerms: string[] = newUnit.replaceAll(" ", "").split("*");

    this.unitLength = 0;

    let unitNumeratorText: string = "";
    let unitDenominatorText: string = "";

    for (const term of unitTerms) {
      const termParts: string[] = term.split("^");
      let exponent = termParts[1] || "";
      let reciprocal: boolean = false;

      if (exponent !== "") {
        if (exponent.charAt(0) === "-") {
          reciprocal = true;
          exponent = exponent.substring(1);
        }

        if (exponent !== "1") exponent = `<sup>${exponent}</sup>`;
        else exponent = "";
      }

      const unitText: string = termParts[0];
      const finalTermText: string = unitText + exponent;

      this.unitLength += unitText.length;
      if (exponent.length > 0) this.unitLength++;

      if (reciprocal) {
        if (unitDenominatorText.length > 0) unitDenominatorText += "⋅";
        unitDenominatorText += finalTermText;

      } else {
        if (unitNumeratorText.length > 0) unitNumeratorText += "⋅";
        unitNumeratorText += finalTermText;
      }
    }

    this.unitSpan.innerHTML = unitNumeratorText;

    if (unitDenominatorText.length > 0) {
      this.unitSpan.innerHTML += "/";
      this.unitLength++;
    }

    this.unitSpan.innerHTML += unitDenominatorText;

    this.updateSizeDisplay();
  }

  private initListeners(): void {
    this.textSpan.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();

        this.textSpan.blur();

      } else if (this.numberInput && event.key !== "." && event.key !== "-" && event.key.toLowerCase() !== "e" && event.key !== "Backspace" && event.key !== "ArrowLeft" && event.key !== "ArrowRight" && isNaN(parseFloat(event.key))) {
        event.preventDefault();
      }
    });

    this.textSpan.addEventListener("input", () => {
      while (this.textSpan.firstElementChild) {
        this.textSpan.firstElementChild.remove();
      }
    });

    this.textSpan.addEventListener("blur", () => {
      const input: string = this.textSpan.innerText;

      if (this.numberInput) {
        const input: string = this.textSpan.innerText;

        let parts: string[] = input.split("e");
        if (parts.length === 1) parts = input.split("E");
    
        let value: number = parseFloat(parts[0]);
        if (parts.length > 1) value *= Math.pow(10, parseInt(parts[1]));

        this.value = value as V;

      } else if (input.replaceAll(" ", "").length > 0) {
        this.value = input as V;
      }

      this.updateTextDisplay();
    });
  }

  private updateTextDisplay(): void {
    this.textSpan.innerText = this.numberInput ? Util.formatSigFigs(this._value as number, this.sigFigs) : this._value as string;
  }

  private updateSizeDisplay(): void {
    if (this.numberInput) this.style.width = `${this.sigFigs + 4 + this.unitLength}ch`;
    else if (this.maxLength !== undefined) this.style.width = `calc(${this.maxLength}ch + 1px)`;
  }
}

export class QuantityInput extends InputElement<number> {
  private textInput: TextInput<number>;
  private slider: HTMLInputElement;
  private progress: HTMLDivElement;
  private markers: HTMLDivElement[] = [];

  private fillFrom: number;
  private _value: number;
  private _logVal: number;

  constructor(
    private min: number = 0,
    private max: number = 1,
    fillFrom?: number,
    private precision: number = 0.01, // maybe remove as property if not needed for rounding
    private snapDist: number = 0,
    markerCount: number = 0,
    sigFigs: number = 2,
    unit: string = "",
    private logBase?: number,
    value?: number
  ) {
    super();

    this.min = this.getNumberAttrib("min") ?? this.min;
    this.max = this.getNumberAttrib("max") ?? this.max;
    this.fillFrom = this.getNumberAttrib("fill-from") ?? fillFrom ?? this.min;
    this.precision = this.getNumberAttrib("precision") ?? this.precision;
    this.snapDist = this.getNumberAttrib("snap-distance") ?? this.snapDist;

    markerCount = this.getNumberAttrib("marker-count", true) ?? markerCount;
    sigFigs = this.getNumberAttrib("sig-figs") ?? sigFigs;
    unit = this.getAttribute("unit") ?? unit ?? "";

    this.logBase = this.getNumberAttrib("logarithmic") ?? this.logBase;

    const assignedValue: number | undefined = this.getNumberAttrib("value") ?? value;

    if (assignedValue !== undefined) this.value = assignedValue;
    else this.logVal = this.min + (this.max - this.min) * this.fillFrom;

    if (this.min > this.max) this.min = this.max;

    this.initElements(markerCount, sigFigs, unit);
    this.updateDisplay();
  }

  public set value(newVal: number) {
    this._value = newVal;
    this._logVal = this.logBase !== undefined ? Math.log(newVal) / Math.log(this.logBase) : newVal;
  }

  public set logVal(newVal: number) {
    this._value = this.logBase !== undefined ? Math.pow(this.logBase, newVal) : newVal;
    this._logVal = newVal;
  }

  public set unit(newUnit: string) {
    this.textInput.unit = newUnit;
  }

  private getNumberAttrib(name: string, intOnly: boolean = false): number | undefined {
    const attrib: string | null = this.getAttribute(name);

    if (attrib !== null) {
      let parsedValue: number;

      if (intOnly) parsedValue = parseInt(attrib);
      else parsedValue = parseFloat(attrib);

      if (!isNaN(parsedValue)) return parsedValue;
    }
  }

  private initElements(markerCount: number, sigFigs: number, unit: string): void {
    this.className = "qi-container";

    this.textInput = new TextInput(true, sigFigs, this._value, unit);

    const sliderContainer: HTMLDivElement = document.createElement("div");
    sliderContainer.className = "qi-slider-container";

    this.slider = document.createElement("input");
    this.slider.className = "qi-slider";
    this.slider.type = "range";
    this.slider.min = this.min.toString();
    this.slider.max = this.max.toString();
    this.slider.step = this.precision.toString();

    const sliderBackground: HTMLDivElement = document.createElement("div");
    sliderBackground.className = "qi-slider-background";

    this.progress = document.createElement("div");
    this.progress.className = "qi-slider-progress";

    const markerContainer = document.createElement("div");
    markerContainer.className = "qi-slider-marker-container";

    for (let i = 0; i < markerCount; i++) {
      const marker: HTMLDivElement = document.createElement("div");

      markerContainer.appendChild(marker);
      this.markers.push(marker);
    }

    sliderContainer.appendChild(this.slider);
    sliderContainer.appendChild(sliderBackground);
    sliderContainer.appendChild(this.progress);
    sliderContainer.appendChild(markerContainer);

    this.initListeners();

    this.appendChild(this.textInput);
    this.appendChild(sliderContainer);
  }

  private initListeners(): void {
    this.textInput.addInputListener((value: number) => {
      this.value = value;

      this.updateDisplay();
      this.fireInputListener(this._value);
    });

    this.slider.addEventListener("input", () => {
      const sliderVal: number = parseFloat(this.slider.value);

      if (!isNaN(sliderVal)) this.logVal = Util.clamp(sliderVal, this.min, this.max);
      
      // const rounded: number = Math.round(this.value);

      // if (Math.abs(this.value - rounded) <= this.snapDist) {
      //     this.value = rounded;
      // }

      this.updateDisplay();
      this.fireInputListener(this._value);
    });
  }

  private getProgress(value: number): number {
    return (value - this.min) / (this.max - this.min);
  }

  private updateDisplay(): void {
    const progress: number = this.getProgress(this._logVal);
    const fillProgress: number = this.getProgress(this.fillFrom);

    let minHiglight: number = fillProgress;
    let maxHighlight: number = fillProgress;

    if (progress >= fillProgress) maxHighlight = progress;
    else minHiglight = progress;

    this.textInput.value = this._value;
    this.slider.value = this._logVal.toString();
    this.progress.style.left = minHiglight * 100 + "%";
    this.progress.style.right = (1 - maxHighlight) * 100 + "%";

    for (let i = 0; i < this.markers.length; i++) {
      const child: HTMLDivElement = this.markers[i] as HTMLDivElement;
      const position: number = i / (this.markers.length - 1);

      if (position >= minHiglight && position <= maxHighlight) child.classList.add("highlighted");
      else child.classList.remove("highlighted");
    }
  }
}

export class AngleInput extends InputElement<number> {
  private static readonly ANGLE_AXES: string[] = ["R", "U", "L", "D"];

  private axis: number = 0;
  private angleDir: number = 1;
  private angleOffset: number = 0;

  private axis1: TextInput<string>;
  private axis2: TextInput<string>;
  private angleInput: TextInput<number>;

  constructor(angle?: number) {
    super();

    this.className = "vi-container";

    const bracket1: HTMLSpanElement = document.createElement("span");
    bracket1.innerText = "[";

    const bracket2: HTMLSpanElement = document.createElement("span");
    bracket2.innerText = "]";

    this.angleInput = new TextInput(true, 3, 0 as number, "°");
    this.axis1 = new TextInput(false, undefined, "" as string, undefined, 1);
    this.axis2 = new TextInput(false, undefined, "" as string, undefined, 1);

    if (angle !== undefined) this.setAngle(angle);
    this.updateDisplay();

    this.initListeners();

    this.appendChild(bracket1);
    this.appendChild(this.axis1);
    this.appendChild(this.angleInput);
    this.appendChild(this.axis2);
    this.appendChild(bracket2);
  }

  public get actualAngle(): number {
    return this.axis * Math.PI / 2 + this.angleDir * this.angleOffset;
  }

  private initListeners(): void {
    this.angleInput.addInputListener((value: number) => {
      let newAngle: number = value * Math.PI / 180 % (2 * Math.PI);

      if (this.angleOffset !== newAngle) {
        if (newAngle < 0) {
          newAngle = -newAngle;
          
          this.angleDir *= -1;
        }

        this.angleOffset = newAngle;

        this.fireInputListener(this.actualAngle);
      }

      this.updateDisplay();
    });

    this.axis1.addInputListener((value: string) => {
      const axis: number = AngleInput.ANGLE_AXES.indexOf(value);

      if (axis !== -1 && this.axis !== axis) {
        this.axis = axis;

        this.fireInputListener(this.actualAngle);
      }

      this.updateDisplay();
    });

    this.axis2.addInputListener((value: string) => {
      const axis: number = AngleInput.ANGLE_AXES.indexOf(value);

      if (axis !== -1) {
        let difference: number = axis - this.axis;
        if (difference >= 3) difference -= 4;
        if (difference <= -3) difference += 4;

        const direction: number = difference % 2;

        if (direction !== 0 && this.angleDir !== direction) {
          this.angleDir = direction;

          this.fireInputListener(this.actualAngle);
        }
      }

      this.updateDisplay();
    });
  }

  public setAngle(newAngle: number): void {
    const angleSegment: number = (newAngle - newAngle % (Math.PI / 4)) / (Math.PI / 4);
    const axis: number = Util.circleMod(Math.ceil(angleSegment / 2), 4);
    const axisAngleOffset: number = (newAngle - axis * Math.PI / 2) % (2 * Math.PI);
    
    this.angleOffset = Math.abs(axisAngleOffset);
    this.axis = axis;
    this.angleDir = axisAngleOffset > 0 ? Util.sign(axisAngleOffset) : 1;
  }

  private updateDisplay(): void {
    this.axis1.value = `${AngleInput.ANGLE_AXES[this.axis]}`;
    this.axis2.value = `${AngleInput.ANGLE_AXES[Util.circleMod(this.axis + this.angleDir, 4)]}`;
    this.angleInput.value = this.angleOffset / Math.PI * 180;
  }
}
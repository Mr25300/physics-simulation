import { Util } from "../math/util.js";
import { Vector2 } from "../math/vector2.js";

export class TextInput<V extends number | string> extends HTMLElement {
  public static readonly commonUnits: Record<string, string> = {
    "gravitationalConstant": "m^3 * kg^-1 * s^-2",
    "coulombConstant": "N * m^2 * C^-2"
  };

  private textSpan: HTMLSpanElement;
  private unitSpan: HTMLSpanElement;

  private _value: V;
  private unitLength: number = 0;

  private inputCallback: (value: V) => void | undefined;

  constructor(private numberInput?: boolean, private sigFigs: number = 2, value?: V, unit: string = "") {
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

    const prevVal: V = this._value;

    this._value = newVal;

    if (newVal !== prevVal) {
      this.updateTextDisplay();

      if (this.inputCallback) this.inputCallback(newVal);
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
    if (this.numberInput) this.style.width = `${this.sigFigs + 4 + this.unitLength}ch`
  }

  public addInputListener(callback: (value: V) => void): void {
    this.inputCallback = callback;
  }
}

export class QuantityInput extends HTMLElement {
  public textInput: TextInput<number>;
  private slider: HTMLInputElement;
  private progress: HTMLDivElement;
  private markers: HTMLDivElement[] = [];

  private fillFrom: number;
  private value: number;

  private callback: (value: number) => void;

  constructor(
    private min: number = 0,
    private max: number = 1,
    fillFrom?: number,
    private precision: number = 0.01,
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
    this.value = this.getNumberAttrib("value") ?? value ?? this.min + (this.max - this.min) * this.fillFrom;

    if (this.min > this.max) this.min = this.max;

    this.initElements(markerCount, sigFigs, unit);
    this.updateSlider();
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

    this.textInput = new TextInput(true, sigFigs, this.value, unit);

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
      this.setValue(value);
      this.fireListener();
    });

    this.slider.addEventListener("input", () => {
      this.setValue(parseFloat(this.slider.value), true);
      
      // const rounded: number = Math.round(this.value);

      // if (Math.abs(this.value - rounded) <= this.snapDist) {
      //     this.value = rounded;
      // }

      this.fireListener();
    });
  }

  public setValue(newVal: number, linear?: boolean): void {
    if (isNaN(newVal)) return;

    if (!linear && this.logBase !== undefined) newVal = Math.log(newVal) / Math.log(this.logBase);

    newVal = Util.clamp(newVal, this.min, this.max);
    newVal = Math.round(newVal / this.precision) * this.precision;

    this.value = newVal;
    this.updateSlider();
  }

  private getProgress(value: number): number {
    return (value - this.min) / (this.max - this.min);
  }

  private updateSlider(): void {
    const value: number = this.logBase !== undefined ? Math.pow(this.logBase, this.value) : this.value;
    const progress: number = this.getProgress(this.value);
    const fillProgress: number = this.getProgress(this.fillFrom);

    let minHiglight: number = fillProgress;
    let maxHighlight: number = fillProgress;

    if (progress >= fillProgress) maxHighlight = progress;
    else minHiglight = progress;

    this.textInput.value = value;
    this.slider.value = this.value.toString();
    this.progress.style.left = minHiglight * 100 + "%";
    this.progress.style.right = (1 - maxHighlight) * 100 + "%";

    for (let i = 0; i < this.markers.length; i++) {
      const child: HTMLDivElement = this.markers[i] as HTMLDivElement;
      const position: number = i / (this.markers.length - 1);

      if (position >= minHiglight && position <= maxHighlight) child.classList.add("highlighted");
      else child.classList.remove("highlighted");
    }
  }

  private fireListener(): void {
    if (!this.callback) return;

    let value: number = this.value;
    if (this.logBase !== undefined) value = Math.pow(this.logBase, value);

    this.callback(value);
  }

  public addInputListener(callback: (value: number) => void): void {
    this.callback = callback;
  }
}

export class VectorInput extends HTMLElement {
  private value: Vector2;

  constructor() {
    super();

    
  }
}
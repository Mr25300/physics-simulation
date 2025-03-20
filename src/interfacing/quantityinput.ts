import { Util } from "../math/util.js";
import { DisplayLabel } from "./displaylabel.js";

export class TextInput<V extends number | string> extends HTMLElement {
  private textSpan: HTMLSpanElement;

  private _value: V;
  private inputCallback: (value: V) => void | undefined;

  constructor(private numberInput?: boolean, private sigFigs: number = 2) {
    super();

    this.className = "text-input-container";

    this.textSpan = document.createElement("span");
    this.textSpan.className = "text-input";
    this.textSpan.contentEditable = "true";
    this.textSpan.spellcheck = false;
    this.appendChild(this.textSpan);

    if (numberInput || this.getAttribute("number-input") === "true") this.numberInput = true;

    this.initListeners();
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
    });
  }

  public get value(): V {
    return this._value;
  }

  public set value(newVal: V) {
    if (this.numberInput && isNaN(newVal as number)) {
      this.updateDisplay();

      return;
    }

    const prevVal: V = this._value;

    this._value = newVal;

    if (newVal !== prevVal) {
      this.updateDisplay();
      if (this.inputCallback) this.inputCallback(newVal);
    }
  }

  public listenToInput(callback: (value: V) => void): void {
    this.inputCallback = callback;
  }

  private updateDisplay(): void {
    this.textSpan.innerText = this.numberInput ? Util.formatSigFigs(this._value as number, this.sigFigs) : this._value as string;
  }
}

export class QuantityInput extends HTMLElement {
  private textInput: TextInput<number>;
  private slider: HTMLInputElement;
  private progress: HTMLDivElement;
  private markers: HTMLDivElement[] = [];
  private unitContainer: HTMLSpanElement;
  private textInputContainer: HTMLSpanElement;

  private readonly min: number = 0;
  private readonly max: number = 1;
  private readonly fillFrom: number;

  private readonly precision: number = 0.01;
  private readonly snapDist: number = 0;
  private readonly markerCount: number = 0;

  private readonly logBase: number | undefined;
  private readonly sigFigs: number = 2;

  private value: number;

  private callback: (value: number) => void;

  constructor(unit?: string, min?: number, max?: number, fillFrom?: number, precision?: number, snapDist?: number, markerCount?: number, sigFigs?: number, logBase?: number, value?: number) {
    super();

    if (min === undefined) min = this.getFloatAttribute("min");
    if (max === undefined) max = this.getFloatAttribute("max");
    if (fillFrom === undefined) fillFrom = this.getFloatAttribute("fill-from")
    if (precision === undefined) precision = this.getFloatAttribute("precision");
    if (snapDist === undefined) snapDist = this.getFloatAttribute("snap-distance");
    if (markerCount === undefined) markerCount = this.getFloatAttribute("marker-count");
    if (sigFigs === undefined) sigFigs = this.getIntAttribute("sig-figs");
    if (value === undefined) value = this.getFloatAttribute("value");

    if (min !== undefined) this.min = min;
    if (max !== undefined) this.max = max;
    if (this.min > this.max) this.min = this.max;

    this.fillFrom = fillFrom !== undefined ? fillFrom : this.min;

    if (precision !== undefined) this.precision = precision;
    if (snapDist !== undefined) this.snapDist = snapDist;
    if (markerCount !== undefined) this.markerCount = markerCount;

    if (sigFigs !== undefined) this.sigFigs = sigFigs;

    this.logBase = logBase || this.getFloatAttribute("logarithmic");
    this.value = value !== undefined ? value : this.fillFrom;

    this.initElements();
    this.initListeners();
    this.updateSlider();

    this.unit = unit || this.getAttribute("unit") || "";
  }

  public set unit(newUnit: string) {
    this.unitContainer.innerHTML = this.parseUnit(newUnit);
    this.textInputContainer.style.width = `calc(${this.sigFigs + 4}ch + ${this.unitContainer.clientWidth}px`;
  }

  private getIntAttribute(name: string, defaultVal?: number): number | undefined {
    if (this.hasAttribute(name)) return parseInt(this.getAttribute(name)!);
    else return defaultVal;
  }

  private getFloatAttribute(name: string, defaultVal?: number): number | undefined {
    if (this.hasAttribute(name)) return parseFloat(this.getAttribute(name)!);
    else return defaultVal;
  }

  private initElements(): void {
    this.className = "qi-input-container";

    this.unitContainer = document.createElement("span");

    this.textInputContainer = document.createElement("span");
    this.textInputContainer.className = "qi-text-input-container";

    this.textInput = new TextInput(true, this.sigFigs);

    this.textInputContainer.appendChild(this.textInput);
    this.textInputContainer.appendChild(this.unitContainer);

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

    for (let i = 0; i < this.markerCount; i++) {
      const marker: HTMLDivElement = document.createElement("div");

      markerContainer.appendChild(marker);
      this.markers.push(marker);
    }

    sliderContainer.appendChild(this.slider);
    sliderContainer.appendChild(sliderBackground);
    sliderContainer.appendChild(this.progress);
    sliderContainer.appendChild(markerContainer);

    this.appendChild(this.textInputContainer);
    this.appendChild(sliderContainer);
  }

  private parseUnit(unit: string): string {
    const unitTerms: string[] = unit.replaceAll(" ", "").split("*");

    let unitNumeratorText: string = "";
    let unitDenominatorText: string = "";

    for (const term of unitTerms) {
      const termParts: string[] = term.split("^");
      let exponent: string = termParts[1] || "";
      let reciprocal: boolean = false;

      if (exponent.length > 0) {
        if (exponent.charAt(0) === "-") {
          reciprocal = true;
          exponent = exponent.substring(1);
        }

        if (exponent !== "1") exponent = `<sup>${exponent}</sup>`;
        else exponent = "";
      }

      const finalTermText: string = termParts[0] + exponent;

      if (reciprocal) {
        if (unitDenominatorText.length > 0) unitDenominatorText += "⋅";
        unitDenominatorText += finalTermText;

      } else {
        if (unitNumeratorText.length > 0) unitNumeratorText += "⋅";
        unitNumeratorText += finalTermText;
      }
    }

    return unitNumeratorText + (unitDenominatorText.length > 0 ? "/" : "") + unitDenominatorText;
  }

  private initListeners(): void {
    this.textInput.listenToInput((value: number) => {
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

  public addListener(callback: (value: number) => void): void {
    this.callback = callback;
  }

  private fireListener(): void {
    if (!this.callback) return;

    let value: number = this.value;
    if (this.logBase !== undefined) value = Math.pow(this.logBase, value);

    this.callback(value);
  }
}
import { Util } from "../math/util.js";
import { Vector2 } from "../math/vector2.js";

type ListenerCallback = () => void;

export abstract class InputElement<V> extends HTMLElement {
  private listenerCallback: ListenerCallback;

  public abstract get value(): V | undefined;
  public abstract set value(newVal: V);

  protected getNumberAttrib(name: string, intOnly: boolean = false): number | undefined {
    const attrib: string | null = this.getAttribute(name);

    if (attrib !== null) {
      let parsedValue: number;

      if (intOnly) parsedValue = parseInt(attrib);
      else parsedValue = parseFloat(attrib);

      if (!isNaN(parsedValue)) return parsedValue;
    }
  }

  public addInputListener(callback: ListenerCallback): void {
    this.listenerCallback = callback;
  }

  protected fireInputListener(): void {
    if (this.listenerCallback) this.listenerCallback();
  }
}

export class UnitContainer extends HTMLElement {
  private length: number = 0;

  constructor(unit?: string) {
    super();

    this.className = "unit-container";

    if (unit !== undefined) this.unit = unit;
  }

  public get unitLength(): number {
    return this.length;
  }

  public set unit(newUnit: string) {
    const commonUnit: string = TextInput.commonUnits[newUnit];
    if (commonUnit) newUnit = commonUnit;

    const unitTerms: string[] = newUnit.replaceAll(" ", "").split("*");

    this.length = 0;

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

      this.length += unitText.length;
      if (exponent.length > 0) this.length++;

      if (reciprocal) {
        if (unitDenominatorText.length > 0) unitDenominatorText += "⋅";
        unitDenominatorText += finalTermText;

      } else {
        if (unitNumeratorText.length > 0) unitNumeratorText += "⋅";
        unitNumeratorText += finalTermText;
      }
    }

    this.innerHTML = unitNumeratorText;

    if (unitDenominatorText.length > 0) {
      this.innerHTML += "/";
      this.length++;
    }

    this.innerHTML += unitDenominatorText;
  }
}

export class TextInput<V extends number | string> extends InputElement<V> {
  public static readonly commonUnits: Record<string, string> = {
    "gravitationalConstant": "m^3 * kg^-1 * s^-2",
    "coulombConstant": "N * m^2 * C^-2"
  };

  private textSpan: HTMLSpanElement;
  private unitContainer: UnitContainer;

  private _value: V;

  constructor(private numberInput?: boolean, private sigFigs: number = 2, value?: V, unit: string = "", private maxLength?: number) {
    super();

    if (numberInput || this.getAttribute("number-input") === "true") this.numberInput = true;

    this.className = "text-input-container";

    this.textSpan = document.createElement("span");
    this.textSpan.className = "text-input";
    this.textSpan.contentEditable = "true";
    this.textSpan.spellcheck = false;

    this.unitContainer = new UnitContainer(unit);

    if (value !== undefined) this._value = value;

    this.updateTextDisplay();
    this.updateSizeDisplay();
    this.initListeners();

    this.append(this.textSpan, this.unitContainer);
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
      this.fireInputListener();
    }
  }

  public set unit(newUnit: string) {
    this.unitContainer.unit = newUnit;
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
    if (this.numberInput) this.style.width = `${this.sigFigs + 4 + this.unitContainer.unitLength}ch`;
    else if (this.maxLength !== undefined) this.style.width = `calc(${this.maxLength}ch + 1px)`;
  }
}

export class QuantityInput extends InputElement<number> {
  private textInput: TextInput<number>;
  private slider: HTMLInputElement;
  private progress: HTMLDivElement;
  private markers: HTMLDivElement[] = [];

  private actualMin: number;
  private actualMax: number;
  private fillFrom: number;

  private _value: number;
  private actualVal: number;

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

    this.logBase = this.getNumberAttrib("logarithmic") ?? this.logBase;

    this.min = this.getNumberAttrib("min") ?? min;
    this.max = this.getNumberAttrib("max") ?? max;
    if (min > max) this.min = max;

    this.actualMin = this.getExpVal(this.min);
    this.actualMax = this.getExpVal(this.max);

    this.fillFrom = this.getNumberAttrib("fill-from") ?? fillFrom ?? this.min;
    this.precision = this.getNumberAttrib("precision") ?? this.precision;
    this.snapDist = this.getNumberAttrib("snap-distance") ?? this.snapDist;

    markerCount = this.getNumberAttrib("marker-count", true) ?? markerCount;
    sigFigs = this.getNumberAttrib("sig-figs") ?? sigFigs;
    unit = this.getAttribute("unit") ?? unit ?? "";

    value = this.getNumberAttrib("value") ?? value;

    if (value !== undefined) this.setValue(value);
    else this.setValue(this.fillFrom, true);

    this.initElements(markerCount, sigFigs, unit);
    this.updateDisplay();
  }

  private getExpVal(n: number): number {
    if (this.logBase !== undefined) return Math.pow(this.logBase, n);
    else return n;
  }

  private getLogVal(n: number): number {
    if (this.logBase !== undefined) return Math.log(n) / Math.log(this.logBase);
    else return n;
  }

  private setValue(newVal: number, actual: boolean = false) {
    const prevVal: number = this.actualVal;

    if (actual) {
      this.actualVal = Util.clamp(newVal, this.actualMin, this.actualMax);
      this._value = this.getLogVal(this.actualVal);

    } else {
      this._value = Util.clamp(newVal, this.min, this.max);
      this.actualVal = this.getExpVal(this._value);
    }

    if (this.actualVal !== prevVal) this.fireInputListener();
  }

  public get value(): number {
    return this.actualVal;
  }

  public set value(newVal: number) {
    this.setValue(newVal, true);
    this.updateDisplay();
  }

  public set unit(newUnit: string) {
    this.textInput.unit = newUnit;
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

      markerContainer.append(marker);
      this.markers.push(marker);
    }

    sliderContainer.append(this.slider, sliderBackground, this.progress, markerContainer);

    this.initListeners();

    this.append(this.textInput, sliderContainer);
  }

  private initListeners(): void {
    this.textInput.addInputListener(() => {
      this.setValue(this.textInput.value, true);
      this.updateDisplay();
    });

    this.slider.addEventListener("input", () => {
      const sliderVal: number = parseFloat(this.slider.value);

      if (isNaN(sliderVal)) return;

      // const rounded: number = Math.round(this.value);

      // if (Math.abs(this.value - rounded) <= this.snapDist) {
      //     this.value = rounded;
      // }

      this.setValue(sliderVal);
      this.updateDisplay();
    });
  }

  private getProgress(value: number): number {
    return (value - this.min) / (this.max - this.min);
  }

  private updateDisplay(): void {
    const progress: number = this.getProgress(this._value);
    const fillProgress: number = this.getProgress(this.fillFrom);

    let minHiglight: number = fillProgress;
    let maxHighlight: number = fillProgress;

    if (progress >= fillProgress) maxHighlight = progress;
    else minHiglight = progress;

    this.textInput.value = this.actualVal;
    this.slider.value = this._value.toString();
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

  private axis1: TextInput<string>;
  private axis2: TextInput<string>;
  private angleInput: TextInput<number>;

  private axis: number = 0;
  private angleDir: number = 1;
  private angleOffset: number = 0;
  private actualVal: number = 0;

  constructor(angle?: number) {
    super();

    this.className = "ai-container";

    const bracket1: HTMLSpanElement = document.createElement("span");
    bracket1.innerText = "[";

    const bracket2: HTMLSpanElement = document.createElement("span");
    bracket2.innerText = "]";

    this.angleInput = new TextInput(true, 3, 0 as number, "°");
    this.axis1 = new TextInput(false, undefined, "" as string, undefined, 1);
    this.axis2 = new TextInput(false, undefined, "" as string, undefined, 1);

    if (angle !== undefined) this.value = angle;
    this.updateDisplay();

    this.initListeners();

    this.append(bracket1, this.axis1, this.angleInput, this.axis2, bracket2);
  }

  private toRad(a: number): number {
    return a * Math.PI / 180;
  }

  private toDeg(a: number): number {
    return a / Math.PI * 180
  }

  private updateActualAngle(): void {
    const newAngle: number = this.toRad(this.axis * 90 + this.angleDir * this.angleOffset);

    if (Math.abs(this.actualVal - newAngle) > 1e-8) {
      this.actualVal = newAngle;
      this.fireInputListener();
    }
  }

  public get value(): number {
    return this.actualVal;
  }

  public set value(newAngle: number) {
    const degAngle: number = Util.circleMod(this.toDeg(newAngle), 360);
    const angleSegment: number = (degAngle - degAngle % 45) / 45;
    const axis: number = Util.circleMod(Math.ceil(angleSegment / 2), 4);
    const axisAngleOffset: number = (degAngle - axis * 90) % 360;

    this.angleOffset = Math.abs(axisAngleOffset);
    this.axis = axis;
    this.angleDir = axisAngleOffset !== 0 ? Util.sign(axisAngleOffset) : 1;

    this.actualVal = newAngle;
    this.fireInputListener();
    this.updateDisplay();
  }

  private initListeners(): void {
    this.angleInput.addInputListener(() => {
      let newAngle: number = this.angleInput.value % 360;

      if (this.angleOffset !== newAngle) {
        if (newAngle < 0) {
          newAngle = -newAngle;
          this.angleDir *= -1;
        }

        this.angleOffset = newAngle;
        this.updateActualAngle();
      }

      this.updateDisplay();
    });

    this.axis1.addInputListener(() => {
      const axis: number = AngleInput.ANGLE_AXES.indexOf(this.axis1.value);

      if (axis !== -1 && this.axis !== axis) {
        this.axis = axis;
        this.updateActualAngle();
      }

      this.updateDisplay();
    });

    this.axis2.addInputListener(() => {
      const axis: number = AngleInput.ANGLE_AXES.indexOf(this.axis2.value);

      if (axis !== -1) {
        let difference: number = axis - this.axis;
        if (difference >= 3) difference -= 4;
        if (difference <= -3) difference += 4;

        const direction: number = Util.sign(difference % 2);

        if (direction !== 0 && this.angleDir !== direction) {
          this.angleDir = direction;
          this.updateActualAngle();
        }
      }

      this.updateDisplay();
    });
  }

  private updateDisplay(): void {
    this.axis1.value = `${AngleInput.ANGLE_AXES[this.axis]}`;
    this.axis2.value = `${AngleInput.ANGLE_AXES[Util.circleMod(this.axis + this.angleDir, 4)]}`;
    this.angleInput.value = this.angleOffset;
  }
}

export class VectorInput extends InputElement<Vector2> {
  private static readonly POLAR_TEXT = "D∠M";
  private static readonly COMPONENT_TEXT = "X/Y";

  private polarContainer: HTMLDivElement;
  private componentContainer: HTMLDivElement;
  private formatToggle: HTMLButtonElement;
  private magnitudeInput: TextInput<number>;
  private angleInput: AngleInput;
  private xInput: TextInput<number>;
  private yInput: TextInput<number>;

  private formatMode: boolean = false;
  private _value: Vector2 = Vector2.zero;

  constructor(unit?: string, value?: Vector2) {
    super();

    this.className = "vi-container";

    this.polarContainer = document.createElement("div");
    this.polarContainer.className = "vi-format-container";

    this.componentContainer = document.createElement("div");
    this.componentContainer.className = "vi-format-container";

    unit = this.getAttribute("unit") ?? unit;

    this.magnitudeInput = new TextInput<number>(true, 3, undefined, unit);
    this.angleInput = new AngleInput();
    this.polarContainer.append(this.magnitudeInput, this.angleInput);

    const componentUnit: UnitContainer = new UnitContainer(unit);

    this.xInput = new TextInput(true, 3);
    this.yInput = new TextInput(true, 3);
    this.componentContainer.append("[(", this.xInput, ")î + (", this.yInput, ")ĵ]", componentUnit);

    this.formatToggle = document.createElement("button");
    this.formatToggle.className = "vi-format-button";

    this.magnitudeInput.addInputListener(() => {
      let magVal: number = this.magnitudeInput.value;
      if (magVal === this._value.magnitude) return;

      let angle: number = this._value.angle;

      if (magVal < 0) {
        magVal = -magVal;
        angle += Math.PI;

        this.magnitudeInput.value = magVal;
        this.angleInput.value = angle;
      }

      this.setValue(Vector2.fromPolarForm(magVal, angle));
    });

    this.angleInput.addInputListener(() => {
      let angleVal: number = this.angleInput.value;
      if (angleVal === this._value.angle) return;

      this.setValue(Vector2.fromPolarForm(this._value.magnitude, angleVal));
    });

    this.xInput.addInputListener(() => {
      let xVal: number = this.xInput.value;
      if (xVal === this._value.x) return;

      this.setValue(new Vector2(xVal, this._value.y));
    });

    this.yInput.addInputListener(() => {
      let yVal: number = this.yInput.value;
      if (yVal === this._value.y) return;

      this.setValue(new Vector2(this._value.x, yVal));
    });

    this.formatToggle.addEventListener("click", () => {
      this.formatMode = !this.formatMode;
      this.updateFormatMode();
    });

    this.updateDisplay();
    this.updateFormatMode();

    if (value !== undefined) this.value = value;

    this.append(this.polarContainer, this.componentContainer, this.formatToggle);
  }

  private updateDisplay(): void {
    this.magnitudeInput.value = this._value.magnitude;
    this.angleInput.value = this._value.angle;
    this.xInput.value = this._value.x;
    this.yInput.value = this._value.y;
  }

  private updateFormatMode(): void {
    if (this.formatMode) {
      this.componentContainer.classList.remove("hidden");
      this.polarContainer.classList.add("hidden");
      this.formatToggle.innerText = VectorInput.COMPONENT_TEXT;

    } else {
      this.polarContainer.classList.remove("hidden");
      this.componentContainer.classList.add("hidden");
      this.formatToggle.innerText = VectorInput.POLAR_TEXT;
    }
  }

  private setValue(newVal: Vector2): void {
    this._value = newVal;
    this.fireInputListener();
    this.updateDisplay();
  }

  public get value(): Vector2 {
    return this._value;
  }

  public set value(newVal: Vector2) {
    this.setValue(newVal);
  }
}

type NamedObj = {
  name: string
};

export class OptionItem<OptionObj extends NamedObj> extends HTMLElement {
  constructor(public name: string = "", public readonly object?: OptionObj) {
    super();

    this.className = "option-item";
    this.innerText = name;
  }

  public select(): void {
    this.classList.add("selected");
  }

  public deselect(): void {
    this.classList.remove("selected");
  }
}

export class OptionSelect<OptionObj extends NamedObj> extends InputElement<OptionObj> {
  private selector: HTMLDivElement;
  private optionWrapper: HTMLDivElement;
  private optionContainer: HTMLDivElement;

  private optionElements: Map<OptionObj, OptionItem<OptionObj>> = new Map();
  private selected: OptionItem<OptionObj> | undefined;

  private optionsShowing: boolean = false;

  constructor(defaultOption?: string, private _optionObjects?: Set<OptionObj>) {
    super();

    this.className = "option-select";

    this.selector = document.createElement("div");
    this.selector.className = "option-selector";
    this.selector.tabIndex = 0;

    this.optionWrapper = document.createElement("div");
    this.optionWrapper.className = "option-wrapper";

    this.optionContainer = document.createElement("div");
    this.optionContainer.className = "option-container";
    this.optionContainer.append(this.optionWrapper);
    this.optionContainer.style.fontSize = getComputedStyle(this).fontSize;

    defaultOption = this.getAttribute("default-option") ?? defaultOption;
    if (defaultOption) this.createOption(defaultOption, undefined, true);

    this.selector.addEventListener("click", () => {
      this.updateOptionElements();
      this.toggleOptions();
    });

    this.selector.addEventListener("blur", () => {
      this.hideOptions();
    });

    new ResizeObserver(() => {
      this.updateDisplay();
    }).observe(this.optionWrapper);

    this.updateOptionElements();

    this.append(this.selector);
    document.body.append(this.optionContainer);
  }

  public get value(): OptionObj | undefined {
    if (this.selected) return this.selected.object;
  }

  public set value(newObject: OptionObj) {
    const existingElement: OptionItem<OptionObj> | undefined = this.optionElements.get(newObject);

    if (existingElement) {
      if (this.selected) this.selected.deselect();

      this.selected = existingElement;
      existingElement.select();
    }
  }

  public set optionObjects(objectList: Set<OptionObj>) {
    this._optionObjects = objectList;

    this.updateOptionElements();
  }

  private toggleOptions(): void {
    this.optionsShowing = !this.optionsShowing;
    this.updateDisplay();

    if (this.optionsShowing) {
      const bounds: DOMRect = this.getBoundingClientRect();

      this.optionContainer.style.top = `${bounds.bottom + 4}px`;
      this.optionContainer.style.left = `${bounds.left}px`;
    }
  }

  private hideOptions(): void {
    this.optionsShowing = false;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (this.optionsShowing) {
      this.classList.add("showing");
      this.optionContainer.style.height = this.optionWrapper.offsetHeight + 1 + "px";

    } else {
      this.classList.remove("showing");
      this.optionContainer.style.height = "0";
    }
  }

  private updateSelectDisplay(): void {
    if (this.selected) this.selector.innerText = this.selected.name;
    else this.selector.innerText = "N/A";
  }

  private updateOptionElements(): void {
    if (this._optionObjects) {
      this.optionElements.forEach((element: OptionItem<OptionObj>) => {
        if (element.object && !this._optionObjects!.has(element.object)) {
          element.remove();

          if (this.selected === element) this.selected = undefined;

        } else if (element.object) {
          element.innerText = element.name = element.object?.name;
        }
      });

      for (const option of this._optionObjects) {
        if (!this.optionElements.has(option)) {
          this.createOption(option.name, option);
        }
      }
    }

    this.updateSelectDisplay();
  }

  private createOption(name: string, object?: OptionObj, autoSelect?: boolean): void {
    const optionElement: OptionItem<OptionObj> = new OptionItem(name, object);
    if (object) this.optionElements.set(object, optionElement);

    optionElement.addEventListener("mousedown", () => {
      this.selectOption(optionElement);
    });

    if (autoSelect) this.selectOption(optionElement);

    this.optionWrapper.append(optionElement);
  }

  private selectOption(optionElement: OptionItem<OptionObj>) {
    if (this.selected) this.selected.deselect();

    this.selected = optionElement;
    optionElement.select();

    this.hideOptions();
    this.updateSelectDisplay();
    this.fireInputListener();
  }
}
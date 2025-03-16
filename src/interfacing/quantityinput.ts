import { Util } from "../math/util.js";

export class QuantityInput extends HTMLElement {
    private text: HTMLSpanElement;
    private slider: HTMLInputElement;
    private progress: HTMLDivElement;
    private markers: HTMLDivElement[] = [];

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

    constructor(label?: string, unit?: string, min?: number, max?: number, fillFrom?: number, precision?: number, snapDist?: number, markerCount?: number, sigFigs?: number, value?: number) {
        super();

        if (label === undefined) label = this.getAttribute("label") || "";
        if (unit === undefined) unit = this.getAttribute("unit") || "";
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

        this.logBase = this.getFloatAttribute("logarithmic");
        this.value = value !== undefined ? value : this.fillFrom;

        this.initElements(label, unit);
        this.initListeners();
        this.updateSlider();
    }

    private getIntAttribute(name: string, defaultVal?: number): number | undefined {
        if (this.hasAttribute(name)) return parseInt(this.getAttribute(name)!);
        else return defaultVal;
    }

    private getFloatAttribute(name: string, defaultVal?: number): number | undefined {
        if (this.hasAttribute(name)) return parseFloat(this.getAttribute(name)!);
        else return defaultVal;
    }

    private initElements(label: string, unit: string): void {
        const inputLabel: HTMLSpanElement = document.createElement("span");
        inputLabel.className = "qi-label";
        inputLabel.innerText = `${label}: `;

        const inputContainer: HTMLDivElement = document.createElement("div");
        inputContainer.className = "qi-input-container";

        const unitContainer: HTMLSpanElement = document.createElement("span");
        unitContainer.innerHTML = this.parseUnit(unit);

        const textInputContainer: HTMLSpanElement = document.createElement("span");
        textInputContainer.className = "qi-text-input-container";

        this.text = document.createElement("span");
        this.text.className = "qi-text-input";
        this.text.contentEditable = "true";
        this.text.spellcheck = false;

        textInputContainer.appendChild(this.text);
        textInputContainer.appendChild(unitContainer);
        inputContainer.appendChild(textInputContainer);
        this.appendChild(inputLabel);
        this.appendChild(inputContainer);

        textInputContainer.style.width = `calc(${this.sigFigs + 4}ch + ${unitContainer.clientWidth}px`;

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
        inputContainer.appendChild(sliderContainer);
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
        this.text.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.key === "Backspace") {
                if (this.text.innerText.length === 1) {
                    event.preventDefault();

                    this.text.innerText = "";
                }

            } else if (event.key === "Enter") {
                event.preventDefault();

                this.text.blur();

            } else if (event.key !== "." && event.key !== "-" && event.key !== "e" && event.key !== "ArrowLeft" && event.key !== "ArrowRight" && isNaN(parseFloat(event.key))) {
                event.preventDefault();
            }
        });

        this.text.addEventListener("blur", () => {
            const prevVal: number = this.value;

            this.setValue(this.parseTextInput());

            if (this.value !== prevVal) this.fireListener();
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

    private parseTextInput(): number {
        const input: string = this.text.innerText;
        const parts: string[] = input.split("e");

        let value: number = parseFloat(parts[0]);
        if (parts.length > 1) value *= Math.pow(10, parseInt(parts[1]));

        return value;
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

        this.text.innerText = Util.numberSigFigs(value, this.sigFigs);
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
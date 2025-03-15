import { Util } from "../math/util.js";

export class QuantityInput extends HTMLElement {
    private text: HTMLSpanElement;
    private slider: HTMLInputElement;
    private progress: HTMLDivElement;
    private markers: HTMLDivElement[] = [];

    private readonly min: number = 0;
    private readonly max: number = 1;
    private readonly fillFrom: number;

    private readonly step: number = 0.01;
    private readonly snapDist: number = 0;
    private readonly markerInc: number = 1;

    private readonly logBase: number | undefined;
    private readonly sigFigs: number = 2;

    private value: number;

    private callback: (value: number) => void;

    constructor() {
        super();

        const min: number | undefined = this.getFloatAttribute("min");
        const max: number | undefined = this.getFloatAttribute("max");
        const fillFrom: number | undefined = this.getFloatAttribute("fill-from")
        const step: number | undefined = this.getFloatAttribute("step");
        const snapDist: number | undefined = this.getFloatAttribute("snap-distance");
        const markerInc: number | undefined = this.getFloatAttribute("marker-increment");
        const sigFigs: number | undefined = this.getIntAttribute("sig-figs");
        const value: number | undefined = this.getFloatAttribute("value");

        if (min !== undefined) this.min = min;
        if (max !== undefined) this.max = max;
        if (this.min > this.max) this.min = this.max;

        this.fillFrom = fillFrom !== undefined ? fillFrom : this.min;
        
        if (step !== undefined) this.step = step;
        if (snapDist !== undefined) this.snapDist = snapDist;
        if (markerInc !== undefined) this.markerInc = markerInc;

        if (sigFigs !== undefined) this.sigFigs = sigFigs;

        this.logBase = this.getFloatAttribute("logarithmic");
        this.value = value !== undefined ? value : this.fillFrom;

        this.initElements();
        this.initListeners();
        this.updateSlider();
    }

    private initElements(): void {
        const inputLabel: HTMLSpanElement = document.createElement("span");
        inputLabel.className = "qi-label";
        inputLabel.innerText = (this.getAttribute("label") || "") + ": ";

        const inputContainer: HTMLDivElement = document.createElement("div");
        inputContainer.className = "qi-input-container";

        const unitContainer: HTMLSpanElement = document.createElement("span");
        unitContainer.innerHTML = this.parseUnit(this.getAttribute("unit") || "");

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
        this.slider.step = this.step.toString();

        const sliderBackground: HTMLDivElement = document.createElement("div");
        sliderBackground.className = "qi-slider-background";

        this.progress = document.createElement("div");
        this.progress.className = "qi-slider-progress";

        const markerContainer = document.createElement("div");
        markerContainer.className = "qi-slider-marker-container";

        for (let i = this.min; i <= this.max; i += this.markerInc) {
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
            let input: number = this.parseValue();
            if (this.logBase !== undefined) input = Math.log(input) / Math.log(this.logBase);

            if (!isNaN(input)) {
                this.value = Util.clamp(input, this.min, this.max);
                this.fireListener();
            }

            this.updateSlider();
        });

        this.slider.addEventListener("input", () => {
            this.value = parseFloat(this.slider.value);

            const rounded: number = Math.round(this.value);

            if (Math.abs(this.value - rounded) <= this.snapDist) {
                this.value = rounded;
            }

            this.fireListener();
            this.updateSlider();
        });
    }

    private parseValue(): number {
        const input: string = this.text.innerText;
        const parts: string[] = input.split("e");

        let value: number = parseFloat(parts[0]);
        if (parts.length > 1) value *= Math.pow(10, parseInt(parts[1]));

        return value;
    }

    private getIntAttribute(name: string, defaultVal?: number): number | undefined {
        if (this.hasAttribute(name)) return parseInt(this.getAttribute(name)!);
        else return defaultVal;
    }

    private getFloatAttribute(name: string, defaultVal?: number): number | undefined {
        if (this.hasAttribute(name)) return parseFloat(this.getAttribute(name)!);
        else return defaultVal;
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
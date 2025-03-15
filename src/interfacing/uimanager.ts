import { Simulation } from "../core/simulation.js";
import { Collapsible } from "./collapsible.js";
import { QuantityInput } from "./quantityinput.js";

export class UIManager {
    private collapsibles: Map<HTMLDivElement, Collapsible> = new Map();
    private quantityInputs: Map<string, QuantityInput> = new Map();

    private pauseButton: HTMLButtonElement;
    private reverseButton: HTMLButtonElement;

    public init(): void {
        document.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });

        customElements.define("collapsible-dropdown", Collapsible);
        customElements.define("quantity-input", QuantityInput);

        this.initSimulationControls();
        this.initConstantsControls();
    }

    private togglePause(): void {
        if (Simulation.instance.running) {
            Simulation.instance.pause();
            this.pauseButton.classList.add("paused");

        } else {
            Simulation.instance.resume();
            this.pauseButton.classList.remove("paused");
        }
    }

    private setupSkipButton(button: HTMLButtonElement, skipAmount: number): void {
        button.addEventListener("click", () => {
            button.classList.remove("skipped");
            void button.offsetWidth;
            button.classList.add("skipped");

            Simulation.instance.advance(skipAmount);
        });
    }

    private initSimulationControls(): void {
        this.pauseButton = document.querySelector("button#sim-pause")!;
        this.reverseButton = document.querySelector("button#sim-reverse")!;

        const skipButton: HTMLButtonElement = document.querySelector("button#sim-skip")!;
        const doubleSkipButton: HTMLButtonElement = document.querySelector("button#sim-double-skip")!;
        const backButton: HTMLButtonElement = document.querySelector("button#sim-back")!;
        const doubleBackButton: HTMLButtonElement = document.querySelector("button#sim-double-back")!;

        const timeSlider: QuantityInput = document.getElementById("sim-time-slider") as QuantityInput;

        // timeSlider.setValue(Simulation.instance.timeScale);

        timeSlider.addListener((value: number) => {
            Simulation.instance.timeScale = value;
        });

        this.pauseButton.addEventListener("click", () => {
            this.togglePause();
        });

        document.addEventListener("visibilitychange", () => {
            if (Simulation.instance.running) this.togglePause();
        });

        this.reverseButton.addEventListener("click", () => {
            Simulation.instance.timeReverse = !Simulation.instance.timeReverse;

            if (Simulation.instance.timeReverse) this.reverseButton.classList.add("reversed");
            else this.reverseButton.classList.remove("reversed");
        });

        this.setupSkipButton(skipButton, 0.1);
        this.setupSkipButton(doubleSkipButton, 1);
        this.setupSkipButton(backButton, -0.1);
        this.setupSkipButton(doubleBackButton, -1);
    }

    private initConstantsControls(): void {
        const gInput: QuantityInput = document.getElementById("grav-constant-input") as QuantityInput;
        const couloumbInput: QuantityInput = document.getElementById("coloumb-constant-input") as QuantityInput;
        const airInput: QuantityInput = document.getElementById("air-density-input") as QuantityInput;

        gInput.addListener((value: number) => {
            Simulation.instance.constants.gravitationalConstant = value;
        });

        couloumbInput.addListener((value: number) => {
            Simulation.instance.constants.coloumbConstant = value;
        });

        airInput.addListener((value: number) => {
            Simulation.instance.constants.airDensity = value;
        });

        // const airDensityInput: QuantityInput = document.querySelector("quantity-input#air-density-input")!;

        // airDensityInput.addListener(() => {
        //     console.log(airDensityInput.value);
        //     Simulation.instance.constants.airDensity = airDensityInput.value;
        // });
    }

    public update(): void {
        document.getElementById("sim-time-elapsed")!.innerText = Simulation.instance.elapsedTime.toFixed(2);
    }
}
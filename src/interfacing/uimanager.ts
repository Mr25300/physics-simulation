import { Simulation } from "../core/simulation.js";
import { Collapsible } from "./collapsible.js";
import { Slider } from "./slider.js";

export class UIManager {
    private collapsibles: Map<HTMLDivElement, Collapsible> = new Map();
    private sliders: Map<HTMLDivElement, Slider> = new Map();

    private pauseButton: HTMLButtonElement;
    private reverseButton: HTMLButtonElement;

    public init(): void {
        document.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });

        document.querySelectorAll(".collapsible").forEach((element: Element) => {
            this.collapsibles.set(element as HTMLDivElement, new Collapsible(element as HTMLDivElement));
        });

        this.initSimulationControls();
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

        const timeSlider: Slider = new Slider(document.querySelector("div#sim-time-slider")!, -7, 7, 0);

        timeSlider.addListener(() => {
            Simulation.instance.timeScale = 2 ** timeSlider.value;
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

    public update(): void {
        document.getElementById("sim-time-elapsed")!.innerText = Simulation.instance.elapsedTime.toFixed(2);
    }
}
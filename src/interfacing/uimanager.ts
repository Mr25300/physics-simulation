import { Simulation } from "../core/simulation.js";

export class UIManager {
    private pauseButton: HTMLButtonElement;
    private reverseButton: HTMLButtonElement;

    public init(): void {
        this.initSimulationControls();

        document.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
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
}
export class Slider {
    private text: HTMLSpanElement;
    private slider: HTMLInputElement;
    private progress: HTMLDivElement;
    private markerContainer: HTMLDivElement;
    private markers: HTMLDivElement[] = [];

    private progressBarStart: number = 0.5;

    private callback: () => void;

    constructor(
        private container: HTMLDivElement,
        private min: number,
        private max: number,
        public value: number = min,
        private lockToDist: number = 0.25
    ) {
        container.classList.add("slider-container");

        this.text = container.querySelector("span.text")!;

        this.slider = document.createElement("input");
        this.slider.type = "range";
        this.slider.min = min.toString();
        this.slider.max = max.toString();
        this.slider.step = "0.001";

        this.progress = document.createElement("div");
        this.progress.className = "slider-progress";

        this.markerContainer = document.createElement("div");
        this.markerContainer.className = "slider-marker-container";

        for (let i = this.min; i <= this.max; i++) {
            const marker: HTMLDivElement = document.createElement("div");
            
            this.markerContainer.appendChild(marker);
            this.markers.push(marker);
        }

        container.appendChild(this.slider);
        container.appendChild(this.progress);
        container.appendChild(this.markerContainer);

        this.slider.addEventListener("input", () => {
            this.value = parseFloat(this.slider.value);

            const rounded: number = Math.round(this.value);

            if (Math.abs(this.value - rounded) <= this.lockToDist) {
                this.value = rounded;
            }

            this.slider.value = this.value.toString();

            this.updateSlider();
            this.callback();
        });

        this.updateSlider();
    }

    private updateSlider(): void {
        const progress: number = (this.value - this.min) / (this.max - this.min);

        let minHiglight: number = this.progressBarStart;
        let maxHighlight: number = this.progressBarStart;

        if (progress >= this.progressBarStart) maxHighlight = progress;
        else minHiglight = progress;

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

    public addListener(callback: () => void): void {
        this.callback = callback;
    }
}
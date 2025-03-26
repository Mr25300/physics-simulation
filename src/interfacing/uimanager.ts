import { Simulation } from "../core/simulation.js";
import { Util } from "../math/util.js";
import { Collapsible } from "./displaycomponents.js";
import { DisplayLabel } from "./displaycomponents.js";
import { FieldItem, ItemLister, MaterialItem } from "./listcomponents.js";
import { QuantityInput, TextInput, AngleInput, VectorInput, UnitContainer } from "./inputcomponents.js";
import { Projectile } from "../objects/projectile.js";

export class UIManager {
  private selectedProjectile: Projectile;

  public init(): void {
    document.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
    
    customElements.define("collapsible-dropdown", Collapsible);
    customElements.define("display-label", DisplayLabel);

    customElements.define("text-input", TextInput);
    customElements.define("unit-container", UnitContainer);
    customElements.define("quantity-input", QuantityInput);
    customElements.define("angle-input", AngleInput);
    customElements.define("vector-input", VectorInput);

    customElements.define("item-lister", ItemLister);
    customElements.define("material-item", MaterialItem);
    customElements.define("field-item", FieldItem);

    // Promise.all([
    //   customElements.whenDefined("collapsible-dropdown"),
    //   customElements.whenDefined("display-label"),
    //   customElements.whenDefined("text-input"),
    //   customElements.whenDefined("quantity-input"),
    //   customElements.whenDefined("vector-input"),
    //   customElements.whenDefined("item-lister"),
    //   customElements.whenDefined("field-item")

    // ]).then(() => {
      this.initSimulationControls();
      this.initMaterialControls();
      this.initConstantsControls();
    // });
  }

  private initSimulationControls(): void {
    const pauseButton = document.querySelector("button#sim-pause")!;
    const reverseButton = document.querySelector("button#sim-reverse")!;
    const skipButton: HTMLButtonElement = document.querySelector("button#sim-skip")!;
    const doubleSkipButton: HTMLButtonElement = document.querySelector("button#sim-double-skip")!;
    const backButton: HTMLButtonElement = document.querySelector("button#sim-back")!;
    const doubleBackButton: HTMLButtonElement = document.querySelector("button#sim-double-back")!;

    const timeSlider: QuantityInput = document.getElementById("sim-time-slider") as QuantityInput;

    timeSlider.value = Simulation.instance.timeScale;

    timeSlider.addInputListener((value: number) => {
      Simulation.instance.timeScale = value;
    });
    
    const displayPause = () => {
      if (Simulation.instance.running) {
        pauseButton.classList.remove("paused");
  
      } else {
        pauseButton.classList.add("paused");
      }
    };

    const displayReverse = () => {
      if (Simulation.instance.timeReverse) reverseButton.classList.add("reversed");
      else reverseButton.classList.remove("reversed");
    };

    pauseButton.addEventListener("click", () => {
      if (Simulation.instance.running) Simulation.instance.pause();
      else Simulation.instance.resume();

      displayPause();
    });

    document.addEventListener("visibilitychange", () => {
      Simulation.instance.pause();
      displayPause();
    });

    reverseButton.addEventListener("click", () => {
      Simulation.instance.timeReverse = !Simulation.instance.timeReverse;
      displayReverse();
    });

    const handleSkipButton = (button: HTMLButtonElement, amount: number) => {
      button.addEventListener("click", () => {
        button.classList.remove("skipped");
        void button.offsetWidth;
        button.classList.add("skipped");
  
        Simulation.instance.advance(amount);
      });
    }

    handleSkipButton(skipButton, 0.1);
    handleSkipButton(doubleSkipButton, 1);
    handleSkipButton(backButton, -0.1);
    handleSkipButton(doubleBackButton, -1);

    displayPause();
    displayReverse();
  }

  private initMaterialControls(): void {
    const materialList: ItemLister = document.getElementById("material-list") as ItemLister;

    for (const material of Simulation.instance.materials) {
      materialList.createItem(material);
    }
  }

  private initConstantsControls(): void {
    const gInput: QuantityInput = document.getElementById("grav-constant-input") as QuantityInput;
    const couloumbInput: QuantityInput = document.getElementById("coulomb-constant-input") as QuantityInput;
    const airInput: QuantityInput = document.getElementById("air-density-input") as QuantityInput;
    const fieldList: ItemLister = document.getElementById("field-list") as ItemLister;

    gInput.value = Simulation.instance.constants.gravitationalConstant;
    couloumbInput.value = Simulation.instance.constants.coulombConstant;
    airInput.value = Simulation.instance.constants.airDensity;

    gInput.addInputListener((value: number) => {
      Simulation.instance.constants.gravitationalConstant = value;
    });

    couloumbInput.addInputListener((value: number) => {
      Simulation.instance.constants.coulombConstant = value;
    });

    airInput.addInputListener((value: number) => {
      Simulation.instance.constants.airDensity = value;
    });

    for (const field of Simulation.instance.fields) {
      fieldList.createItem(field);
    }
  }

  public update(): void {
    document.getElementById("sim-time-elapsed")!.innerText = Util.formatTime(Simulation.instance.elapsedTime);

    const selected = Simulation.instance.controller.selected;

    if (selected) {
      
    }
  }
}
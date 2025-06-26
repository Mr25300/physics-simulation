import { Simulation } from "../core/simulation.js";
import { Util } from "../math/util.js";
import { Collapsible } from "./displaycomponents.js";
import { DisplayLabel } from "./displaycomponents.js";
import { FieldItem, ItemList, MaterialItem } from "./listcomponents.js";
import { QuantityInput, TextInput, AngleInput, VectorInput, UnitContainer } from "./inputcomponents.js";
import { Projectile } from "../objects/projectile.js";
import { OptionSelect, OptionItem } from "./inputcomponents.js";
import { Material as Material } from "../objects/material.js";
import { Obstacle } from "../objects/obstacle.js";
import { Vector2 } from "../math/vector2.js";
import { Constraint, Rope, Spring } from "../objects/contraints.js";

export class Controller {
  private REFERENCE_FRAME_BUTTON: HTMLButtonElement;

  private PROJECTILE_DROPDOWN: Collapsible;

  private PROJ_TITLE: HTMLHeadingElement;
  private PROJ_POSITION_INPUT: VectorInput;
  private PROJ_VELOCITY_INPUT: VectorInput;
  private PROJ_RADIUS_INPUT: QuantityInput;
  private PROJ_MASS_INPUT: QuantityInput;
  private PROJ_CHARGE_INPUT: QuantityInput;
  private PROJ_MATERIAL_INPUT: OptionSelect<Material>;
  private PROJ_SPAWN_BUTTON: HTMLButtonElement;

  private CONSTRAINT_LENGTH_INPUT: QuantityInput;
  private CONSTRAINT_MATERIAL_INPUT: OptionSelect<Material>;
  private CONSTRAINT_POSITION_INPUT: VectorInput;
  private CONSTRAINT_ATTACH_BUTTON: HTMLButtonElement;

  private constraintType: "Rope" | "Spring" = "Rope";
  private constraintAttach: boolean = false;

  private referenceFrameSetting: boolean = false;

  private _hovering: Projectile | Obstacle | undefined;
  private _selected: Projectile | Obstacle | undefined;

  public get hovering(): Projectile | Obstacle | undefined {
    return this._hovering;
  }

  public get selected(): Projectile | Obstacle | undefined {
    return this._selected;
  }

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

    customElements.define("material-item", MaterialItem);
    customElements.define("field-item", FieldItem);
    customElements.define("item-list", ItemList);

    customElements.define("option-item", OptionItem);
    customElements.define("option-select", OptionSelect);

    this.PROJECTILE_DROPDOWN = document.getElementById("projectile-dropdown") as Collapsible;

    this.initSimulationControls();
    this.initProjectileControls();
    this.initConstraintControls();
    this.initMaterialControls();
    this.initConstantsControls();
    this.update();
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

    timeSlider.addInputListener(() => {
      Simulation.instance.timeScale = timeSlider.value;
    });

    const displayPause = () => {
      if (Simulation.instance.running) pauseButton.classList.remove("paused");
      else pauseButton.classList.add("paused");
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

    this.REFERENCE_FRAME_BUTTON = document.getElementById("reference-frame-button") as HTMLButtonElement;

    this.REFERENCE_FRAME_BUTTON.addEventListener("click", () => {
      if (Simulation.instance.camera.frameOfReference) Simulation.instance.camera.setFrameOfReference(undefined);
      else this.referenceFrameSetting = !this.referenceFrameSetting;
    });
  }

  private initProjectileControls(): void {
    this.PROJ_TITLE = document.getElementById("proj-title") as HTMLHeadingElement;

    this.PROJ_RADIUS_INPUT = document.getElementById("proj-radius") as QuantityInput;
    this.PROJ_MASS_INPUT = document.getElementById("proj-mass") as QuantityInput;
    this.PROJ_CHARGE_INPUT = document.getElementById("proj-charge") as QuantityInput;
    this.PROJ_MATERIAL_INPUT = document.getElementById("proj-material") as OptionSelect<Material>;
    this.PROJ_MATERIAL_INPUT.optionObjects = Simulation.instance.materials;

    this.PROJ_POSITION_INPUT = document.getElementById("proj-spawn-pos") as VectorInput;
    this.PROJ_VELOCITY_INPUT = document.getElementById("proj-spawn-vel") as VectorInput;

    this.PROJ_SPAWN_BUTTON = document.getElementById("proj-spawn") as HTMLButtonElement;

    this.PROJ_SPAWN_BUTTON.addEventListener("click", () => {
      if (this._selected && this._selected instanceof Projectile) {
        Simulation.instance.projectiles.delete(this._selected);

        this._selected = undefined;

      } else if (this.PROJ_MATERIAL_INPUT.value) {
        Simulation.instance.projectiles.add(new Projectile(
          this.PROJ_RADIUS_INPUT.value, this.PROJ_MASS_INPUT.value, this.PROJ_CHARGE_INPUT.value, this.PROJ_MATERIAL_INPUT.value,
          this.PROJ_POSITION_INPUT.value, this.PROJ_VELOCITY_INPUT.value
        ));
      }
    });

    this.PROJ_RADIUS_INPUT.addInputListener(() => {
      if (this._selected && this._selected instanceof Projectile) this._selected.radius = this.PROJ_RADIUS_INPUT.value;
    });

    this.PROJ_MASS_INPUT.addInputListener(() => {
      if (this._selected && this._selected instanceof Projectile) this._selected.mass = this.PROJ_MASS_INPUT.value;
    });

    this.PROJ_CHARGE_INPUT.addInputListener(() => {
      if (this._selected && this._selected instanceof Projectile) this._selected.charge = this.PROJ_CHARGE_INPUT.value;
    });

    this.PROJ_MATERIAL_INPUT.addInputListener(() => {
      if (this._selected && this._selected instanceof Projectile && this.PROJ_MATERIAL_INPUT.value) this._selected.material = this.PROJ_MATERIAL_INPUT.value;
    });

    this.PROJ_POSITION_INPUT.addInputListener(() => {
      if (this._selected && this._selected instanceof Projectile) this._selected.position = this.PROJ_POSITION_INPUT.value;
    });

    this.PROJ_VELOCITY_INPUT.addInputListener(() => {
      if (this._selected && this._selected instanceof Projectile) this._selected.velocity = this.PROJ_VELOCITY_INPUT.value;
    });
  }

  private initConstraintControls(): void {
    const typeButton: HTMLButtonElement = document.getElementById("constraint-type") as HTMLButtonElement;

    this.CONSTRAINT_LENGTH_INPUT = document.getElementById("constraint-length") as QuantityInput;
    this.CONSTRAINT_POSITION_INPUT = document.getElementById("constraint-position") as VectorInput;
    this.CONSTRAINT_MATERIAL_INPUT = document.getElementById("constraint-material") as OptionSelect<Material>;
    this.CONSTRAINT_MATERIAL_INPUT.optionObjects = Simulation.instance.materials;

    this.CONSTRAINT_ATTACH_BUTTON = document.getElementById("constraint-attach") as HTMLButtonElement;

    const updateTypeDisplay = () => {
      typeButton.innerText = this.constraintType;
    };
    
    typeButton.addEventListener("click", () => {
      if (this.constraintType === "Rope") this.constraintType = "Spring";
      else this.constraintType = "Rope";

      updateTypeDisplay();
    });

    updateTypeDisplay();

    this.CONSTRAINT_ATTACH_BUTTON.addEventListener("click", () => {
      this.constraintAttach = !this.constraintAttach;
    });
  }

  private initMaterialControls(): void {
    const materialList: ItemList = document.getElementById("material-list") as ItemList;

    for (const material of Simulation.instance.materials) {
      materialList.createItem(material);
    }
  }

  private initConstantsControls(): void {
    const gInput: QuantityInput = document.getElementById("grav-constant-input") as QuantityInput;
    const coulombInput: QuantityInput = document.getElementById("coulomb-constant-input") as QuantityInput;
    const airInput: QuantityInput = document.getElementById("air-density-input") as QuantityInput;
    const fieldList: ItemList = document.getElementById("field-list") as ItemList;

    gInput.value = Simulation.instance.constants.gravitationalConstant;
    coulombInput.value = Simulation.instance.constants.coulombConstant;
    airInput.value = Simulation.instance.constants.airDensity;

    gInput.addInputListener(() => {
      Simulation.instance.constants.gravitationalConstant = gInput.value;
    });

    coulombInput.addInputListener(() => {
      Simulation.instance.constants.coulombConstant = coulombInput.value;
    });

    airInput.addInputListener(() => {
      Simulation.instance.constants.airDensity = airInput.value;
    });

    for (const field of Simulation.instance.fields) {
      fieldList.createItem(field);
    }
  }

  public update(): void {
    const timeElapsed: HTMLSpanElement = document.getElementById("sim-time-elapsed") as HTMLSpanElement;
    timeElapsed.innerText = Util.formatTime(Simulation.instance.elapsedTime);

    const currentHover: Projectile | Obstacle | undefined = Simulation.instance.inputHandler.getCursorObject();

    this._hovering = currentHover;

    if (Simulation.instance.inputHandler.clicked) {
      this._selected = currentHover;

      if (this._selected && this._selected instanceof Projectile) {
        if (this.referenceFrameSetting) {
          Simulation.instance.camera.setFrameOfReference(this._selected);

          this.referenceFrameSetting = false;
          
        } else if (this.constraintAttach) {
          const material: Material | undefined = this.CONSTRAINT_MATERIAL_INPUT.value;

          if (material) {
            const length: number = this.CONSTRAINT_LENGTH_INPUT.value;
            const point: Vector2 = this.CONSTRAINT_POSITION_INPUT.value;
            const constraint: Constraint = this.constraintType === "Rope" ? new Rope(point, this._selected, length, material) : new Spring(point, this._selected, length, material);

            Simulation.instance.constraints.add(constraint);
          }

          this.constraintAttach = false;

        } else {
          this.PROJECTILE_DROPDOWN.dropdown();
        }

      } else {
        this.referenceFrameSetting = false;
        this.constraintAttach = false;
      }
    }

    const editingProj: boolean = this._selected !== undefined && this._selected instanceof Projectile;

    this.PROJ_TITLE.innerText = editingProj ? "Edit Projectile" : "Create Projectile";
    this.PROJ_SPAWN_BUTTON.innerText = editingProj ? "Destroy" : "Spawn";

    if (this._selected && this._selected instanceof Projectile) {
      this.PROJ_RADIUS_INPUT.value = this._selected.radius;
      this.PROJ_MASS_INPUT.value = this._selected.mass;
      this.PROJ_CHARGE_INPUT.value = this._selected.charge;
      this.PROJ_MATERIAL_INPUT.value = this._selected.material;
      this.PROJ_POSITION_INPUT.value = this._selected.position;
      this.PROJ_VELOCITY_INPUT.value = this._selected.velocity;
    }

    this.CONSTRAINT_ATTACH_BUTTON.innerText = this.constraintAttach ? "Attaching" : "Attach";

    this.REFERENCE_FRAME_BUTTON.innerText = Simulation.instance.camera.frameOfReference ? "Clear Frame of Reference" : (this.referenceFrameSetting ? "Setting Frame of Reference" : "Set Frame of Reference");

    Simulation.instance.inputHandler.setHoverMode(this._hovering !== undefined);
  }
}
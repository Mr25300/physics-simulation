import { Simulation } from "../core/simulation.js";
import { Vector2 } from "../math/vector2.js";
import { Field, FieldType } from "../objects/field.js";
import { Material } from "../objects/material.js";
import { DisplayLabel } from "./displaycomponents.js";
import { QuantityInput, TextInput, AngleInput, VectorInput, OptionSelect } from "./inputcomponents.js";

export abstract class ListedItem extends HTMLElement {
  private callback: () => void | undefined;

  constructor() {
    super();

    this.className = "listed-item";

    const destroyButton: HTMLButtonElement = document.createElement("button");
    destroyButton.className = "item-delete";
    destroyButton.innerText = "Delete";

    this.append(destroyButton);

    destroyButton.addEventListener("click", () => {
      this.remove();

      if (this.callback) this.callback();
    });
  }

  public addRemoveListener(callback: () => void): void {
    this.callback = callback;
  }
}

export class ItemList extends HTMLElement {
  private itemType: string;

  constructor() {
    super();

    this.className = "item-list-container";

    this.itemType = this.getAttribute("item-type") || "";
    this.initEvents();
  }

  private initEvents(): void {
    const createButton: HTMLButtonElement = document.createElement("button");
    createButton.className = "item-create";
    createButton.innerText = `Create ${this.getAttribute("item-name") || ""}`;

    this.append(createButton);

    createButton.addEventListener("click", () => {
      this.createItem();
    });
  }

  public createItem(...args: any[]): void {
    const constructor: CustomElementConstructor | undefined = customElements.get(this.itemType);

    if (constructor) this.append(new constructor(...args));
  }
}

export class MaterialItem extends ListedItem {
  constructor(material?: Material) {
    super();

    if (!material) material = new Material(`Material #${Simulation.instance.materials.size + 1}`, "grey", 0.5, 0.4, 0.3, 0.2, 0, 0);

    Simulation.instance.materials.add(material);

    this.addRemoveListener(() => {
      Simulation.instance.materials.delete(material);
    });

    const nameInput: TextInput<string> = new TextInput(false, undefined, material.name);

    const elasticityInput: QuantityInput = new QuantityInput(0, 1, 0, 0.01, 0.025, 11, 2, undefined, undefined, material.elasticity);
    const elasticityDisplay: DisplayLabel = new DisplayLabel("Elasticity", elasticityInput);

    const staticInput: QuantityInput = new QuantityInput(0, 1.2, 0, 0.01, 0.025, 11, 2, undefined, undefined, material.staticFriction);
    const staticDisplay: DisplayLabel = new DisplayLabel("Static Friction", staticInput);

    const kineticInput: QuantityInput = new QuantityInput(0, 1.2, 0, 0.01, 0.025, 11, 2, undefined, undefined, material.kineticFriction);
    const kineticDisplay: DisplayLabel = new DisplayLabel("Kinetic Friction", kineticInput);

    const dragInput: QuantityInput = new QuantityInput(0, 2, 0, 0.01, 0.025, 11, 2, undefined, undefined, material.elasticity);
    const dragDisplay: DisplayLabel = new DisplayLabel("Drag", dragInput);

    const stiffnessInput: QuantityInput = new QuantityInput(0, 500, 0, 0.01, 0.025, 11, 2, "N * m^-1", undefined, material.stiffness);
    const stiffnessDisplay: DisplayLabel = new DisplayLabel("Stiffness", stiffnessInput);

    const dampingInput: QuantityInput = new QuantityInput(0, 10, 0, 0.01, 0.025, 11, 2, "N * s * m^-1", undefined, material.damping);
    const dampingDisplay: DisplayLabel = new DisplayLabel("Damping", dampingInput);

    const colorInput: TextInput<string> = new TextInput(false, undefined, material.color);
    const colorDisplay: DisplayLabel = new DisplayLabel("Color", colorInput);

    nameInput.addInputListener(() => {
      material.name = nameInput.value;
    });

    elasticityInput.addInputListener(() => {
      material.elasticity = elasticityInput.value;
    });

    const limitKineticFriction: () => void = () => {
      if (material.kineticFriction > material.staticFriction) {
        kineticInput.value = material.kineticFriction = material.staticFriction;
      }
    };

    staticInput.addInputListener(() => {
      material.staticFriction = staticInput.value;

      limitKineticFriction();
    });

    kineticInput.addInputListener(() => {
      material.kineticFriction = kineticInput.value;

      limitKineticFriction();
    });

    dragInput.addInputListener(() => {
      material.drag = dragInput.value;
    });

    stiffnessInput.addInputListener(() => {
      material.stiffness = stiffnessInput.value;
    });

    dampingInput.addInputListener(() => {
      material.damping = dampingInput.value;
    });

    colorInput.addInputListener(() => {
      material.color = colorInput.value;
    });

    this.append(nameInput, elasticityDisplay, staticDisplay, kineticDisplay, dragDisplay, stiffnessDisplay, dampingDisplay, colorDisplay);
  }
}

export class FieldItem extends ListedItem {
  constructor(field?: Field) {
    super();

    if (!field) field = new Field(`Field #${Simulation.instance.fields.size + 1}`, new Vector2(0, -1), false, FieldType.gravitational, 0);

    Simulation.instance.fields.add(field);

    this.addRemoveListener(() => {
      Simulation.instance.fields.delete(field);
    });

    const fieldName: TextInput<string> = new TextInput();
    fieldName.value = field.name;

    const typeButton: HTMLButtonElement = document.createElement("button");
    typeButton.type = "button";
    typeButton.innerText = field.type;

    const typeLabel: DisplayLabel = new DisplayLabel("Field Type", typeButton);

    const strengthInput: QuantityInput = new QuantityInput(-100, 100, 0, 0.01, 1, 11, 3, undefined, undefined, field.strength);
    const strengthLabel: DisplayLabel = new DisplayLabel("Strength", strengthInput);

    const directionInput: AngleInput = new AngleInput(field.vector.angle);
    const directionLabel: DisplayLabel = new DisplayLabel("Direction", directionInput);

    const updateType: () => void = () => {
      if (field.type === FieldType.gravitational) strengthInput.unit = "gravitationalConstant";
      else strengthInput.unit = "coulombConstant";

      typeButton.innerText = field.type;
    }

    updateType();
    
    typeButton.addEventListener("click", () => {
      if (field.type === FieldType.gravitational) field.type = FieldType.electric;
      else field.type = FieldType.gravitational;

      updateType();
    });

    strengthInput.addInputListener(() => {
      field.strength = strengthInput.value;
    });

    directionInput.addInputListener(() => {
      field.vector = Vector2.fromPolarForm(1, directionInput.value);
    });

    this.append(fieldName, typeLabel, strengthLabel, directionLabel);
  }
}
import { Simulation } from "../core/simulation.js";
import { Vector2 } from "../math/vector2.js";
import { Field, FieldType } from "../objects/field.js";
import { PhysicsMaterial } from "../objects/physicsMaterial.js";
import { DisplayLabel } from "./displaycomponents.js";
import { QuantityInput, TextInput, AngleInput, VectorInput } from "./inputcomponents.js";

export abstract class ListedItem extends HTMLElement {
  private callback: () => void | undefined;

  constructor() {
    super();

    this.className = "listed-item";

    const destroyButton: HTMLButtonElement = document.createElement("button");
    destroyButton.className = "item-delete";
    destroyButton.innerText = "Delete";

    this.appendChild(destroyButton);

    destroyButton.addEventListener("click", () => {
      this.remove();

      if (this.callback) this.callback();
    });
  }

  public addRemoveListener(callback: () => void): void {
    this.callback = callback;
  }
}

export class ItemLister extends HTMLElement {
  private itemType: string;

  constructor() {
    super();

    this.itemType = this.getAttribute("item-type") || "";
    this.initEvents();
  }

  private initEvents(): void {
    const createButton: HTMLButtonElement = document.createElement("button");
    createButton.className = "item-create";
    createButton.innerText = `Create ${this.getAttribute("item-name") || ""}`;

    this.appendChild(createButton);

    createButton.addEventListener("click", () => {
      this.createItem();
    });
  }

  public createItem(...args: any[]): void {
    const constructor: CustomElementConstructor | undefined = customElements.get(this.itemType);

    if (constructor) this.appendChild(new constructor(...args));
  }
}

export class FieldItem extends ListedItem {
  private field: Field;

  constructor(field?: Field) {
    super();

    if (!field) field = new Field(`Field #${Simulation.instance.fields.size + 1}`, new Vector2(0, -1), false, FieldType.gravitational, 0);
    this.field = field;

    Simulation.instance.fields.add(field);

    this.addRemoveListener(() => {
      Simulation.instance.fields.delete(field);
    });

    this.initControls();
  }

  private initControls(): void {
    const fieldName: TextInput<string> = new TextInput();
    fieldName.value = this.field.name;

    const typeButton: HTMLButtonElement = document.createElement("button");
    typeButton.type = "button";
    typeButton.innerText = this.field.type;

    const typeLabel: DisplayLabel = new DisplayLabel("Field Type", typeButton);

    const strengthInput: QuantityInput = new QuantityInput(-100, 100, 0, 0.01, 1, 11, 3, undefined, undefined, this.field.strength);
    const strengthLabel: DisplayLabel = new DisplayLabel("Strength", strengthInput);

    const directionInput: AngleInput = new AngleInput(this.field.vector.angle);
    const directionLabel: DisplayLabel = new DisplayLabel("Direction", directionInput);

    const updateType: () => void = () => {
      if (this.field.type === FieldType.gravitational) strengthInput.unit = "gravitationalConstant";
      else strengthInput.unit = "coulombConstant";

      typeButton.innerText = this.field.type;
    }

    updateType();
    
    typeButton.addEventListener("click", () => {
      if (this.field.type === FieldType.gravitational) this.field.type = FieldType.electric;
      else this.field.type = FieldType.gravitational;

      updateType();
    });

    strengthInput.addInputListener((value: number) => {
      this.field.strength = value
    });

    directionInput.addInputListener((angle: number) => {
      this.field.vector = Vector2.fromPolarForm(1, angle);
    });

    this.appendChild(fieldName);
    this.appendChild(typeLabel);
    this.appendChild(strengthLabel);
    this.appendChild(directionLabel);
  }
}

export class MaterialItem extends ListedItem {
  private material: PhysicsMaterial;

  constructor(material?: PhysicsMaterial) {
    super();

    if (!material) material = new PhysicsMaterial(`Material #${Simulation.instance.materials.size + 1}`, 0.5, 0.4, 0.3, 0.2, "grey");
    this.material = material;

    Simulation.instance.materials.add(material);

    this.addRemoveListener(() => {
      Simulation.instance.materials.delete(material);
    });

    this.initControls();
  }

  private initControls(): void {
    const nameInput: TextInput<string> = new TextInput(false, undefined, this.material.name);

    const elasticityInput: QuantityInput = new QuantityInput(0, 1, 0, 0.01, 0.025, 11, 2, undefined, undefined, this.material.elasticity);
    const elasticityDisplay: DisplayLabel = new DisplayLabel("Elasticity", elasticityInput);

    const staticInput: QuantityInput = new QuantityInput(0, 5, 0, 0.01, 0.025, 11, 2, undefined, undefined, this.material.staticFriction);
    const staticDisplay: DisplayLabel = new DisplayLabel("Static Friction", staticInput);

    const kineticInput: QuantityInput = new QuantityInput(0, 5, 0, 0.01, 0.025, 11, 2, undefined, undefined, this.material.kineticFriction);
    const kineticDisplay: DisplayLabel = new DisplayLabel("Kinetic Friction", kineticInput);

    const dragInput: QuantityInput = new QuantityInput(0, 2, 0, 0.01, 0.025, 11, 2, undefined, undefined, this.material.elasticity);
    const dragDisplay: DisplayLabel = new DisplayLabel("Drag", dragInput);

    const colorInput: TextInput<string> = new TextInput(false, undefined, this.material.color);
    const colorDisplay: DisplayLabel = new DisplayLabel("Color", colorInput);

    nameInput.addInputListener((value: string) => {
      this.material.name = value;
    });

    elasticityInput.addInputListener((value: number) => {
      this.material.elasticity = value;
    });

    const limitKineticFriction: () => void = () => {
      if (this.material.kineticFriction > this.material.staticFriction) {
        kineticInput.value = this.material.kineticFriction = this.material.staticFriction;
      }
    };

    staticInput.addInputListener((value: number) => {
      this.material.staticFriction = value;

      limitKineticFriction();
    });

    kineticInput.addInputListener((value: number) => {
      this.material.kineticFriction = value;

      limitKineticFriction();
    });

    dragInput.addInputListener((value: number) => {
      this.material.drag = value;
    });

    colorInput.addInputListener((value: string) => {
      this.material.color = value;
    });

    this.append(nameInput, elasticityDisplay, staticDisplay, kineticDisplay, dragDisplay, colorDisplay);
  }
}
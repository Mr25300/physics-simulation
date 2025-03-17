import { Simulation } from "../core/simulation.js";
import { Vector2 } from "../math/vector2.js";
import { Field, FieldType } from "../objects/field.js";
import { QuantityInput } from "./quantityinput.js";

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

export class FieldItem extends ListedItem {
  private field: Field;

  constructor(field?: Field) {
    super();

    if (!field) field = new Field(new Vector2(0, -1), false, FieldType.gravitational, 0);
    this.field = field;

    Simulation.instance.fields.add(field);

    this.addRemoveListener(() => {
      Simulation.instance.fields.delete(field);
    });

    this.initControls();
  }

  private initControls(): void {
    const typeLabel: HTMLLabelElement = document.createElement("label");
    typeLabel.innerText = "Field Type: ";
    typeLabel.style.fontSize = "0.9em";

    const typeButton: HTMLButtonElement = document.createElement("button");
    typeButton.innerText = this.field.type;

    const typeContainer: HTMLDivElement = document.createElement("div");
    typeContainer.appendChild(typeLabel);
    typeContainer.appendChild(typeButton);

    const strengthInput: QuantityInput = new QuantityInput("Strength", "", -100, 100, 0, 0.01, 0.1, 11, 3, undefined, this.field.strength);

    this.appendChild(typeContainer);
    this.appendChild(strengthInput);
    
    typeButton.addEventListener("click", () => {
      if (this.field.type === FieldType.gravitational) this.field.type = FieldType.electric;
      else this.field.type = FieldType.gravitational;

      typeButton.innerText = this.field.type;
    });

    strengthInput.addListener((value: number) => {
      this.field.strength = value
    });
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
    createButton.className = "list-creator";
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
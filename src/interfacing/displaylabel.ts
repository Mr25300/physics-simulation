export class DisplayLabel extends HTMLElement {
  private displayElement: HTMLDivElement;

  constructor(label?: string) {
    super();

    this.className = "display-label";
    
    const labelElement: HTMLLabelElement = document.createElement("label");
    labelElement.className = "label";
    labelElement.innerText = (label || this.getAttribute("label") || "Label") + ": ";

    this.displayElement = document.createElement("div");
    this.displayElement.className = "display";
    this.displayElement.innerText = this.innerText;

    this.innerText = "";

    this.appendChild(labelElement);
    this.appendChild(this.displayElement);
  }

  public display(contents: HTMLElement | string): void {
    if (typeof(contents) === "string") this.displayElement.innerText = contents;
    else this.displayElement.appendChild(contents);
  }
}
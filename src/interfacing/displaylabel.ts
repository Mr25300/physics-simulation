export class DisplayLabel extends HTMLElement {
  private displayElement: HTMLDivElement;

  constructor(label?: string, contents?: string | HTMLElement) {
    super();

    this.className = "display-label";
    
    const labelElement: HTMLLabelElement = document.createElement("label");
    labelElement.className = "label";
    labelElement.innerText = (label || this.getAttribute("label") || "Label") + ": ";

    this.displayElement = document.createElement("div");
    this.displayElement.className = "display";
    this.displayElement.innerText = this.innerText;

    const displayContents: string | HTMLElement = contents || this.innerHTML;
    
    if (typeof(displayContents) === "string") this.displayElement.innerHTML = displayContents;
    else this.displayElement.appendChild(displayContents);

    this.innerText = "";

    this.appendChild(labelElement);
    this.appendChild(this.displayElement);
  }
}
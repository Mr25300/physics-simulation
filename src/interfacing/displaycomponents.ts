export class Collapsible extends HTMLElement {
  private selector: HTMLDivElement;
  private content: HTMLDivElement;
  private contentWrapper: HTMLDivElement;

  private expanded: boolean = false;

  constructor() {
    super();

    const label: string = this.getAttribute("label") || "";
    const content: string = this.innerHTML;

    this.selector = document.createElement("div");
    this.selector.innerText = label;
    this.selector.className = "collapsible-select";

    this.contentWrapper = document.createElement("div");
    this.contentWrapper.innerHTML = content;
    this.contentWrapper.className = "collapsible-content-wrapper";

    this.content = document.createElement("div");
    this.content.className = "collapsible-content";
    this.content.append(this.contentWrapper);

    this.innerHTML = "";

    this.selector.addEventListener("click", () => {
      this.toggle();
    });

    new ResizeObserver(() => {
      this.updateDisplay();
    }).observe(this.contentWrapper);

    this.append(this.selector, this.content);
  }

  public dropdown(): void {
    this.expanded = true;
    this.updateDisplay();
  }

  private toggle(): void {
    this.expanded = !this.expanded;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    if (this.expanded) {
      this.classList.add("expanded");
      this.content.style.height = this.contentWrapper.offsetHeight + 1 + "px";

    } else {
      this.classList.remove("expanded");
      this.content.style.height = "0";
    }
  }
}

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

    this.append(labelElement, this.displayElement);
  }
}
export class Collapsible extends HTMLElement {
  private selector: HTMLDivElement;
  private content: HTMLDivElement;
  private contentWrapper: HTMLDivElement;

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
    this.content.appendChild(this.contentWrapper);

    this.innerHTML = "";

    this.selector.addEventListener("click", () => {
      this.toggleCollapse();
    });

    const resizeObserver: ResizeObserver = new ResizeObserver(() => {
      this.updateHeight();
    });

    new MutationObserver((mutationList: MutationRecord[]) => {
      for (const mutation of mutationList) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node: Node) => {
            if (node.nodeType === Node.ELEMENT_NODE) resizeObserver.observe(node as Element);
          });
        }
      }

      this.updateHeight();

    }).observe(this.content, { childList: true, subtree: true, characterData: true });

    for (let i = 0; i < this.content.children.length; i++) {
      resizeObserver.observe(this.content.children[i]);
    }

    this.append(this.selector, this.content);
  }

  private updateHeight(): void {
    if (this.classList.contains("expanded")) this.content.style.height = this.contentWrapper.offsetHeight + 1 + "px";
    else this.content.style.height = "0";
  }

  private toggleCollapse(): void {
    this.classList.toggle("expanded");
    this.updateHeight();
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
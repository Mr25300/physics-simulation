export class Collapsible extends HTMLElement {
    private selector: HTMLDivElement;
    private content: HTMLDivElement;

    constructor() {
        super();

        const label: string = this.getAttribute("label") || "";
        const content: string = this.innerHTML;

        this.selector = document.createElement("div");
        this.selector.innerText = label;
        this.selector.className = "collapsible-select";

        const contentWrapper: HTMLDivElement = document.createElement("div");
        contentWrapper.innerHTML = content;
        contentWrapper.className = "collapsible-content-wrapper";

        this.content = document.createElement("div");
        this.content.className = "collapsible-content";
        this.content.appendChild(contentWrapper);
        
        this.innerHTML = "";

        this.appendChild(this.selector);
        this.appendChild(this.content);

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
    }

    private updateHeight(): void {
        if (this.classList.contains("expanded")) this.content.style.height = this.content.scrollHeight + "px";
        else this.content.style.height = "0";
    }

    private toggleCollapse(): void {
        this.classList.toggle("expanded");
        this.updateHeight();
    }
}
class Collapsible {
    private selector: HTMLDivElement;
    private content: HTMLDivElement;

    constructor(private element: HTMLDivElement) {
        this.selector = element.querySelector(".collapsible-select")!;
        this.content = element.querySelector(".collapsible-content")!;

        this.selector.addEventListener("click", () => {
            this.toggleCollapse();
        });

        const resizeObserver: ResizeObserver = new ResizeObserver(() => {
            this.updateHeight();
        });

        new MutationObserver((mutationList: MutationRecord[]) => {
            for (const mutation of mutationList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType == Node.ELEMENT_NODE) resizeObserver.observe(node as Element);
                    }
                }
            }
            
            this.updateHeight();

        }).observe(this.content, { childList: true, subtree: true, characterData: true });

        for (const child of this.content.children) {
            resizeObserver.observe(child);
        }
    }

    private updateHeight(): void {
        if (this.element.classList.contains("expanded")) this.content.style.height = this.content.scrollHeight + "px";
        else this.content.style.height = "0";
    }

    private toggleCollapse(): void {
        this.element.classList.toggle("expanded");
        this.updateHeight();
    }
}
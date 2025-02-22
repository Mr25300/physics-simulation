class Collapsible {
    private selector: HTMLDivElement;
    private content: HTMLDivElement;

    constructor(private element: HTMLDivElement) {
        this.selector = element.querySelector(".collapsible-select")!;
        this.content = element.querySelector(".collapsible-content")!;

        this.selector.addEventListener("click", () => {
            this.toggleCollapse();
        });

        new MutationObserver(() => {
            if (this.element.classList.contains("expanded")) this.content.style.maxHeight = this.content.scrollHeight + "px";

        }).observe(element, { childList: true, subtree: true, characterData: true });
    }

    private toggleCollapse(): void {
        if (this.element.classList.contains("expanded")) this.content.style.maxHeight = "0";
        else this.content.style.maxHeight = this.content.scrollHeight + "px";

        this.element.classList.toggle("expanded");
    }
}

document.querySelectorAll(".collapsible").forEach((element: Element) => {
    new Collapsible(element as HTMLDivElement);
});
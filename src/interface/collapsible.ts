class Collapsible {
    private selector: HTMLDivElement;
    private content: HTMLDivElement;

    constructor(private element: HTMLDivElement) {
        this.selector = element.querySelector(".collapsible-select")!;
        this.content = element.querySelector(".collapsible-content")!;

        this.toggleCollapse();

        this.selector.addEventListener("click", () => {
            this.toggleCollapse();
        });
    }

    private toggleCollapse(): void {
        // if (this.content.classList.contains("collapsed")) {
        //     this.content.classList
        // }

        if (this.element.classList.contains("collapsed")) this.content.style.maxHeight = this.content.scrollHeight + "px";
        else this.content.style.maxHeight = "0px";

        this.element.classList.toggle("collapsed");
    }
}

document.querySelectorAll(".collapsible").forEach((element: Element) => {
    new Collapsible(element as HTMLDivElement);
});
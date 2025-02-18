import { Projectile } from "../objects/projectile.js";
export class AccordionHelper {
  private accordionContainer: HTMLDivElement;
  constructor(divName: string, public projectileList: Projectile[]){
    this.accordionContainer = document.getElementById(divName) as HTMLDivElement;
  }
  public createAccordionItem(title: string, content: string) {
    const accordionItem = document.createElement('div');
    accordionItem.classList.add('accordion-item');

    const accordionHeader = document.createElement('div');
    accordionHeader.classList.add('accordion-header');
    accordionHeader.textContent = title;

    const accordionContent = document.createElement('div');
    accordionContent.classList.add('accordion-content');
    accordionContent.innerHTML = content;

    // Toggle content visibility on header click
    accordionItem.addEventListener('click', () => {
      accordionContent.classList.toggle('open');
    });

    // Append header and content to the item
    accordionItem.appendChild(accordionHeader);
    accordionItem.appendChild(accordionContent);

    return accordionItem;
  }
  public updateAccordion() {
    for (let i = 0; i < this.projectileList.length; i++) {
      const projectile = this.projectileList[i];
      const title = `Projectile (${projectile.position.x.toFixed(0)}, ${projectile.position.y.toFixed(0)})`;
      const content = `
<p>Position: (x: ${projectile.position.x.toFixed(2)}, y: ${projectile.position.y.toFixed(2)})</p>
<p>V<sub>x</sub>: ${projectile.velocity.x.toFixed(2)} m/s</p>
<p>V<sub>y</sub>: ${projectile.velocity.y.toFixed(2)} m/s</p>
<p>V<sub>Magnitude</sub>: ${projectile.velocity.magnitude.toFixed(2)} m/s</p>
<p>A<sub>x</sub>: ${projectile.acceleration.x.toFixed(2)} m/s<sup>2</sup></p>
<p>A<sub>y</sub>: ${projectile.acceleration.y.toFixed(2)} m/s<sup>2</sup></p>
<p>A<sub>Magnitude</sub>: ${projectile.acceleration.magnitude.toFixed(2)} m/s<sup>2</sup></p>
`;
      const newItem = this.createAccordionItem(title, content);
      this.accordionContainer.innerHTML = "";
      this.accordionContainer.appendChild(newItem);
    }
  }



}

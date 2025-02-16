import { Vector2 } from "../math/vector2.js";
import { Projectile } from "../objects/projectile.js";
import { Canvas } from "../rendering/canvas.js";
import { Loop } from "./loop.js";
import { Graph } from "../graphing/graph.js";
import { Obstacle } from "../objects/obstacle.js";
import { Constants } from "../physics/constants.js";
import { Rope } from "../objects/rope.js";

export class Simulation extends Loop {
    private canvas: Canvas;
    private oldIndex = 0;
    private oldLength = 0;

    public readonly ropes: Rope[] = [];
    public readonly projectiles: Projectile[] = [];
    public readonly obstacles: Obstacle[] = [];

    private static _instance: Simulation;

    public static get instance(): Simulation {
        if (!this._instance) this._instance = new Simulation();

        return this._instance;
    }

    private posGraph: Graph;
    private magGraph: Graph;
    private accGraph: Graph;

    public init(): void {
        const canvas: HTMLCanvasElement | null = document.querySelector("canvas");
        if (!canvas) throw new Error("Failed to get canvas.");

        this.canvas = new Canvas(canvas);

        this.projectiles.push(new Projectile(1, 1, 0.5, new Vector2(2, 0)));
        // this.ropes.push(new Rope(Vector2.zero, 4, this.projectiles[0]));
        this.obstacles.push(new Obstacle(0.5, [new Vector2(-6, -4), new Vector2(6, -4), new Vector2(6, -6), new Vector2(-6, -6)]));
        this.obstacles.push(new Obstacle(0.5, [new Vector2(4, -4), new Vector2(4, 4)]));
        this.obstacles.push(new Obstacle(0.5, [new Vector2(4, 4), new Vector2(-4, 4)]));
        this.obstacles.push(new Obstacle(0.5, [new Vector2(-4, 4), new Vector2(-4, -4)]));

        this.obstacles.push(new Obstacle(1, [
            new Vector2(-1, -3),
            new Vector2(1, -3),
            new Vector2(0, -1)
        ]));

        this.projectiles[0].applyForce(new Vector2(10, 0), true);

        this.start();

        // const graphCanvas = document.getElementById("posGraph") as HTMLCanvasElement;
        // this.posGraph = new Graph(graphCanvas, "t", "dy");

        // const magCanvas = document.getElementById("magGraph") as HTMLCanvasElement;
        // this.magGraph = new Graph(magCanvas, "t", "v");

        // const accCanvas = document.getElementById("accGraph") as HTMLCanvasElement;
        // this.accGraph = new Graph(accCanvas, "t", "a");

        // this.staticObstacles.push(new StaticObstacle([[10, 10], [10, 20], [20, 20], [20, 10]], 0.5));
    }

    public update(deltaTime: number): void {
        const tabContents: Record<string, string> = {
        };
        // for (const rope of this.ropes) {
        //     rope.applyForces(deltaTime);
        // }

        let i = 0; // :(
        for (const projectile of this.projectiles) {
            projectile.update(deltaTime);

            tabContents[`Projectile ${i}`] =
                `Position: (${projectile.position.x.toFixed(1)}, ${projectile.position.y.toFixed(1)}) <br> 
        V<sub>x</sub>: ${projectile.velocity.x.toFixed(2)} m/s <br>
        V<sub>y</sub>: ${projectile.velocity.y.toFixed(2)} m/s <br>
        V<sub>Magnitude</sub>: ${projectile.velocity.magnitude.toFixed(2)} m/s <br>
        A<sub>x</sub>: ${projectile.acceleration.x.toFixed(2)} m/s<sup>2</sup> <br>
        A<sub>y</sub>: ${projectile.acceleration.y.toFixed(2)} m/s<sup>2</sup> <br>
        A<sub>Magnitude</sub>: ${projectile.acceleration.magnitude.toFixed(2)} m/s<sup>2</sup> <br>
        `;
            i++

            // this.magGraph.addPoint(this.elapsedTime, projectile.velocity.magnitude);
            // this.posGraph.addPoint(this.elapsedTime, projectile.position.y);
            // this.accGraph.addPoint(this.elapsedTime, projectile.acceleration.magnitude);
        }

        for (const rope of this.ropes) {
            rope.update();
        }


        // #################################### READ ME #################################
        // Im sorry for this terrible code. It is required for the tabs to work, so do not 
        // remove it please. I will make it not ugly and class based later. I just want to 
        // work on something else

        // Select the container where tabs will be created and the content area
        const tabContainer = document.querySelector('.tabs')!;
        const tabText = document.getElementById('tabText')!;
        if (this.projectiles.length !== this.oldLength) {
            tabContainer.innerHTML = '';
            // Dynamically create a tab for each key in tabContents
            Object.entries(tabContents).forEach(([key, content], index) => {
                const tab = document.createElement('div');
                tab.classList.add('tab');
                // Set the data attribute to the key so we can reference it later
                tab.setAttribute('data-tab', key);
                // Display the key as the tab text (you can format this as needed)
                tab.innerHTML = key;

                if (index === this.oldIndex) {
                    tab.classList.add('active');
                    tabText.innerHTML = content;
                }



                tabContainer.appendChild(tab);
            });
        }

        // Now, select all tabs after they have been created
        const tabs = document.querySelectorAll('.div7 .tab');
        const tab = tabs[this.oldIndex];
        if (tab.classList.contains('active')) {
            const tabText = document.getElementById('tabText');
            if (tabText) {
                tabText.innerHTML = tabContents[`Projectile ${this.oldIndex}`];
            }
        }

        // Add click event listeners to each tab
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove 'active' class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Add 'active' class to the clicked tab
                tab.classList.add('active');

                // Retrieve the data attribute to determine which content to show
                const tabId = tab.getAttribute('data-tab');
                if (tabId) {
                    // Regex to get the number of the projectile (im not okay)
                    this.oldIndex = +tabId.match(/\d+/)![0];
                    tabText.textContent = tabContents[tabId] || '';
                }
            });
        });

        this.oldLength = this.projectiles.length;
        this.canvas.render();
    }
}

const sim: Simulation = Simulation.instance;
sim.init();

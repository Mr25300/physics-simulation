import { Graph } from "./graph.js";
import { Projectile } from "../objects/projectile.js";

export class GraphHandler {
  private _activatedProjectile: {Projectile: Projectile, graph: Graph, index: number};
  private graphDiv: HTMLDivElement = document.getElementById("graphDiv") as HTMLDivElement;
  private infoDiv: HTMLDivElement = document.getElementById("activeProjectileDiv") as HTMLDivElement;

  /**
   * @returns Every projectile and it's graph
   * We can uuse this to display the active pronectiles in the gui
  **/
  public get activeProjectiles(): {Projectile: Projectile, graph: Graph} {
    return this._activatedProjectile;
  }

  /**
   * Initializes the graphs in preperation for graphing
  **/
  public activateProjectile(projectile: Projectile, index: number): void {
    // Create the graph for it
    const canvas: HTMLCanvasElement = document.createElement("canvas") as HTMLCanvasElement;
    this.graphDiv.innerHTML = "";
    this.graphDiv.appendChild(canvas);
    let graph: Graph = new Graph(canvas, "t", "v Magnitude");
    this._activatedProjectile = {Projectile: projectile, graph: graph, index};
    // Initalize all the values in the property viewer
  }


  /**
   * Updates the graph with the relevant data
   * This should ideally be called every frame of a simulation
   * @requires `time`: The current time in the simulation. Not the same as deltaTime
  **/
  public updateGraph(time: number): void {
    // Based on the y axis, we add a certain value
    // AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    if (this._activatedProjectile.graph.yLabel === "v Magnitude") {
      this._activatedProjectile.graph.addPoint(time, +this._activatedProjectile.Projectile.velocity.magnitude.toFixed(2));
    } else if (this._activatedProjectile.graph.yLabel === "v x") {
      this._activatedProjectile.graph.addPoint(time, +this._activatedProjectile.Projectile.velocity.x.toFixed(2));
    } else if (this._activatedProjectile.graph.yLabel === "v y") {
      this._activatedProjectile.graph.addPoint(time, +this._activatedProjectile.Projectile.velocity.y.toFixed(2));
    } else if (this._activatedProjectile.graph.yLabel === "a Magnitude") {
      this._activatedProjectile.graph.addPoint(time, +this._activatedProjectile.Projectile.acceleration.magnitude.toFixed(2));
    } else if (this._activatedProjectile.graph.yLabel === "a x") {
      this._activatedProjectile.graph.addPoint(time, +this._activatedProjectile.Projectile.acceleration.x.toFixed(2));
    } else if (this._activatedProjectile.graph.yLabel === "a y") {
      this._activatedProjectile.graph.addPoint(time, +this._activatedProjectile.Projectile.acceleration.y.toFixed(2));
    } else if (this._activatedProjectile.graph.yLabel === "d x") {
      this._activatedProjectile.graph.addPoint(time, +this._activatedProjectile.Projectile.position.x.toFixed(2));
    } else if (this._activatedProjectile.graph.yLabel === "d y") {
      this._activatedProjectile.graph.addPoint(time, +this._activatedProjectile.Projectile.position.y.toFixed(2));
    } else if (this._activatedProjectile.graph.yLabel === "d Magnitude") {
      this._activatedProjectile.graph.addPoint(time, +this._activatedProjectile.Projectile.position.magnitude.toFixed(2));
    }
    this.updateInfo()
  }

  public updateInfo() {
    // nothing here yet
  }

}

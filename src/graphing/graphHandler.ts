import { Graph } from "../graphing/graph.js";
import { Projectile } from "../objects/projectile.js";

export class GraphHandler {
  private readonly GRAPH_COUNT: number = 3;
  private _activeProjectiles: {Projectile: Projectile, graph: Graph[]}[] = [];

  /** 
   * @returns Every projectile and it's graph
   * We can uuse this to display the active pronectiles in the gui
  **/
  public get activeProjectiles(): {Projectile: Projectile, graph: Graph[]}[] {
    return this._activeProjectiles;
  }

  /** 
   * Initializes the graphs and projectile in preperation for graphing
  **/
  public activateProjectile(projectile: Projectile): void {
    // Add the projectile
    this._activeProjectiles.push({Projectile: projectile, graph: []});
    // Create the divs  
    const graphDiv: HTMLDivElement = document.getElementById("graphingDiv") as HTMLDivElement;
    const vtCanvas: HTMLCanvasElement = document.createElement("canvas") as HTMLCanvasElement;
    const atCanvas: HTMLCanvasElement = document.createElement("canvas") as HTMLCanvasElement;
    const dtCanvas: HTMLCanvasElement = document.createElement("canvas") as HTMLCanvasElement;
    graphDiv.appendChild(vtCanvas);
    graphDiv.appendChild(atCanvas);
    graphDiv.appendChild(dtCanvas);
    // Create the graphs from the elements
    let graph: Graph = new Graph(vtCanvas, "t", "v");
    this._activeProjectiles[this._activeProjectiles.length - 1].graph.push(graph);
    graph = new Graph(atCanvas, "t", "a");
    this._activeProjectiles[this._activeProjectiles.length - 1].graph.push(graph);
    graph = new Graph(dtCanvas, "t", "dy");
    this._activeProjectiles[this._activeProjectiles.length - 1].graph.push(graph);
  }

  /** 
   * Renders all the graphs with accurate data
   * This should ideally be called every frame of a simulation
   * @requires `time`: The current time in the simulation. Not the same as deltaTime
  **/
  public updateAllGraphs(time: number): void {
    for (let i = 0; i < this._activeProjectiles.length; i++) {
      // Update all the graphs with new points
        this._activeProjectiles[i].graph[0].addPoint(time, this._activeProjectiles[i].Projectile.velocity.magnitude);
        this._activeProjectiles[i].graph[1].addPoint(time, this._activeProjectiles[i].Projectile.acceleration.magnitude);
        this._activeProjectiles[i].graph[2].addPoint(time, this._activeProjectiles[i].Projectile.position.y);
    }
  }

  /** 
   * Removes all graphs for the nth projectile
   * The projectiles should be differentiated in the gui
   * @requires `projectileIndex`: The nth projectile
  **/
  public deactivateProjectile(projectileIndex: number): void {
    // Go through each graph in the projectile and remove it from the dom, then delete the entry
    for(let i = 0; i < this.GRAPH_COUNT; i++) {
      this._activeProjectiles[projectileIndex].graph[i].canvas.remove();
    }
    this._activeProjectiles.splice(projectileIndex, 1);
  }
}

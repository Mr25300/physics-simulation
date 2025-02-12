import { Graph } from "../graphing/graph.js";
import { Projectile } from "../objects/projectile.js";

export class GraphHandler {
  private readonly GRAPH_COUNT: number = 3;
  private _activeProjectiles: [{Projectile: Projectile, graph: Graph[]}];

  /** 
   * @returns Every projectile and it's graph
   * We can uuse this to display the active pronectiles in the gui
  **/
  public get activeProjectiles(): [{Projectile: Projectile, graph: Graph[]}] {
    return this._activeProjectiles;
  }

  /** 
   * Initializes the graphs and projectile in preperation for graphing
  **/
  public activateProjectile(projectile: Projectile): void {
    // Create the html canvas elemments
    // Use those to create their graphs
    // Add all of it to the array
  }

  /** 
   * Renders all the graphs with accurate data
   * This should ideally be called every frame of a simulation
   * @requires `time`: The current time in the simulation. Not the same as deltaTime
  **/
  public updateAllGraphs(time: number): void {
    for (let i = 0; i < this._activeProjectiles.length; i++) {
      // Update all the graphs with new points
      for (let j = 0; j < this.GRAPH_COUNT; j++) {
        // Right now we have v t, a t, dy t; It is trivial to add more if the properties are exposed in projectiles. We could add G force or something
        this._activeProjectiles[i].graph[j].addPoint(time, this._activeProjectiles[i].Projectile.position.y);
        this._activeProjectiles[i].graph[j].addPoint(time, this._activeProjectiles[i].Projectile.velocity.magnitude);
        this._activeProjectiles[i].graph[j].addPoint(time, this._activeProjectiles[i].Projectile.acceleration.magnitude);
      }
    }
  }

  /** 
   * Removes all graphs for the nth projectile
   * The projectiles should be differentiated in the gui
   * @requires `projectileIndex`: The nth projectile
  **/
  public deactivateProjectile(projectileIndex: number): void {
    delete this._activeProjectiles[projectileIndex];
  }
}

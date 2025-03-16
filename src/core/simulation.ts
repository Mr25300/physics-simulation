import { Vector2 } from "../math/vector2.js";
import { ForceType, Projectile, ProjectileProperties } from "../objects/projectile.js";
import { Renderer } from "../rendering/canvas.js";
import { Loop } from "./loop.js";
import { Obstacle } from "../objects/obstacle.js";
import { Rope } from "../objects/constraint.js";
import { GraphHandler } from "../graphing/graphHandler.js";
import { Camera } from "../rendering/camera.js";
import { Controller } from "../interfacing/controller.js";

import { UIManager } from "../interfacing/uimanager.js";
import { PhysicsMaterial } from "../objects/physicsMaterial.js";
import { Field, FieldType } from "../objects/field.js";

export interface Constants {
  gravitationalConstant: number;
  coloumbConstant: number;
  airDensity: number;
}

export class Simulation extends Loop {
  public readonly materials: Set<PhysicsMaterial> = new Set();
  public readonly projectiles: Set<Projectile> = new Set();
  public readonly ropes: Set<Rope> = new Set();
  public readonly obstacles: Set<Obstacle> = new Set();

  public readonly fields: Set<Field> = new Set([
    new Field(new Vector2(0, -1).unit, false, FieldType.gravitational, 9.81)
  ]);

  public readonly constants: Constants = {
    gravitationalConstant: 1,
    coloumbConstant: 1,
    airDensity: 1.225
  };

  public renderer: Renderer;
  public camera: Camera = new Camera();
  public controller: Controller = new Controller();
  public uiManager: UIManager = new UIManager();
  private graphHandler: GraphHandler = new GraphHandler();

  private static _instance: Simulation;

  public static get instance(): Simulation {
    if (!this._instance) this._instance = new Simulation();

    return this._instance;
  }

  public init(): void {
    const canvas: HTMLCanvasElement | null = document.querySelector("#simulation-screen");
    if (!canvas) throw new Error("Failed to get canvas.");

    this.renderer = new Renderer(canvas);
    this.uiManager.init();

    const material: PhysicsMaterial = new PhysicsMaterial(0.8, 0, 0, 0.1, "grey");
    const ballMaterial: PhysicsMaterial = new PhysicsMaterial(1, 0, 0, 0.1, "grey");
    const projProperties: ProjectileProperties = new ProjectileProperties(0.5, 3, 0, ballMaterial);
    const properties2: ProjectileProperties = new ProjectileProperties(0.5, 2, 0, ballMaterial);

    const proj = new Projectile(projProperties, new Vector2(-8, 10));
    this.projectiles.add(proj);

    const proj2 = new Projectile(properties2, new Vector2(10, 8));
    this.projectiles.add(proj2);

    this.obstacles.add(new Obstacle([new Vector2(-10, 0), new Vector2(20, 0)], 1, false, material));
    this.obstacles.add(new Obstacle([new Vector2(-10, 10), new Vector2(-10, 0), new Vector2(0, 0)], 1, false, material));
    this.obstacles.add(new Obstacle([new Vector2(20, 0), new Vector2(20, 10)], 1, false, material));

    // this.camera.setFrameOfReference(proj);

    this.start();
    this.graphHandler.activateProjectile(proj, 0);
    this.graphHandler.activateProjectile(proj2, 0);


    // const graphCanvas = document.getElementById("posGraph") as HTMLCanvasElement;
    // this.posGraph = new Graph(graphCanvas, "t", "dy");

    // const magCanvas = document.getElementById("magGraph") as HTMLCanvasElement;
    // this.magGraph = new Graph(magCanvas, "t", "v");

    // const accCanvas = document.getElementById("accGraph") as HTMLCanvasElement;
    // this.accGraph = new Graph(accCanvas, "t", "a");
  }

  public update(deltaTime: number): void {
    for (const projectile of this.projectiles) {
      projectile.clearForces();

      for (const field of this.fields) {
        let force = field.getForce(projectile);
        let type: ForceType | undefined;

        if (field.type === FieldType.gravitational) type = ForceType.gravity;
        else if (field.type === FieldType.electric) type = ForceType.electrostatic;

        projectile.applyForce(force, false, type);
      }

      projectile.updateForces();
    }

    for (const rope of this.ropes) {
      rope.updateForces();
    }

    for (const projectile of this.projectiles) {
      projectile.updateKinematics(deltaTime);
    }

    for (const rope of this.ropes) {
      rope.updateKinematics();
    }

  }

  public render(): void {
    this.graphHandler.updateGraph(Simulation.instance.elapsedTime);
    this.camera.update();
    this.renderer.render();
    this.uiManager.update();
  }
}

const sim = Simulation.instance;
sim.init();

export const simulation = sim;

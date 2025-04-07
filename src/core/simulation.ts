import { Vector2 } from "../math/vector2.js";
import { ForceType, Projectile } from "../objects/projectile.js";
import { Canvas } from "../rendering/canvas.js";
import { Loop } from "./loop.js";
import { Obstacle } from "../objects/obstacle.js";
import { Rope as Constraint, Rope, Spring } from "../objects/contraints.js";
import { GraphHandler } from "../graphing/graphHandler.js";
import { Camera } from "../rendering/camera.js";
import { DisplayControl } from "../interfacing/controller.js";

import { UIManager } from "../interfacing/uimanager.js";
import { Material } from "../objects/material.js";
import { Field, FieldType } from "../objects/field.js";

export interface Constants {
  gravitationalConstant: number;
  coulombConstant: number;
  airDensity: number;
}

export class Simulation extends Loop {
  public readonly materials: Set<Material> = new Set();
  public readonly projectiles: Set<Projectile> = new Set();
  public readonly constraints: Set<Constraint> = new Set();
  public readonly obstacles: Set<Obstacle> = new Set();

  public readonly fields: Set<Field> = new Set([
    new Field("Earth's Gravity", new Vector2(0, -1).unit, false, FieldType.gravitational, 9.8),
    // new Field("Electric Field", new Vector2(1, 0), false, FieldType.electric, 5)
  ]);

  public readonly constants: Constants = {
    gravitationalConstant: 0,
    coulombConstant: 0,
    airDensity: 0//1.225
  };

  public canvas: Canvas;
  private graphHandler: GraphHandler;
  public camera: Camera = new Camera();
  public controller: DisplayControl;
  public uiManager: UIManager = new UIManager();

  private static _instance: Simulation;

  public static get instance(): Simulation {
    if (!this._instance) this._instance = new Simulation();
    
    return this._instance;
  }

  public init(): void {
    const canvas: HTMLCanvasElement | null = document.querySelector("#simulation-screen");
    if (!canvas) throw new Error("Failed to get canvas.");

    this.canvas = new Canvas(canvas);
    this.controller = new DisplayControl(canvas);
    this.uiManager.init();
    this.graphHandler = new GraphHandler();

    const material: Material = new Material("TEST", "grey", 0, 0.5, 0.5, 0, 200, 0.1);
    this.materials.add(material);

    const proj = new Projectile(0.5, 5, -1, material, new Vector2(1, 0), new Vector2(0, 10));
    this.projectiles.add(proj);

    // const rope = new Spring(Vector2.zero, proj, 10, material);
    // this.constraints.add(rope);

    // const proj2 = new Projectile(0.5, 8, 1, material, new Vector2(0, 1), new Vector2(4, 3));
    // this.projectiles.add(proj2);

    // this.obstacles.add(new Obstacle([new Vector2(-10, 0), new Vector2(10, 0)], 1, false, material));
    this.obstacles.add(new Obstacle([new Vector2(0, 0), new Vector2(0, -10), new Vector2(10, -10)], 0, false, material));
    // this.obstacles.add(new Obstacle([new Vector2(10, 0), new Vector2(10, 10)], 1, false, material));

    // this.obstacles.add(new Obstacle([new Vector2(10, 0), new Vector2(1000, 0)], 1, false, material));

    // this.camera.setFrameOfReference(proj);

    this.start();
    // this.graphHandler.activateProjectile(proj, 0);
    // this.graphHandler.activateProjectile(proj2, 0);
  }

  public update(deltaTime: number): void {
    const projectiles: Projectile[] = Array.from(this.projectiles);

    for (const projectile of projectiles) {
      projectile.clearForces();
    }

    for (let i = 0; i < projectiles.length; i++) {
      const projectile: Projectile = projectiles[i];

      for (const field of this.fields) {
        let force = field.getForce(projectile);
        let type: ForceType | undefined;

        if (field.type === FieldType.gravitational) type = ForceType.gravity;
        else if (field.type === FieldType.electric) type = ForceType.electrostatic;

        projectile.applyForce(force, false, type);
      }

      for (let j = i + 1; j < projectiles.length; j++) {
        const otherProj: Projectile = projectiles[j];

        const difference: Vector2 = otherProj.position.subtract(projectile.position);
        const gravMag: number = this.constants.gravitationalConstant * projectile.mass * otherProj.mass / difference.magnitude;
        const electricMag: number = -this.constants.coulombConstant * projectile.charge * otherProj.charge / difference.magnitude;

        projectile.applyForce(difference.unit.multiply(gravMag), false, ForceType.gravity);
        otherProj.applyForce(difference.unit.multiply(-gravMag), false, ForceType.gravity);

        projectile.applyForce(difference.unit.multiply(electricMag), false, ForceType.electrostatic);
        otherProj.applyForce(difference.unit.multiply(-electricMag), false, ForceType.electrostatic);
      }

      projectile.updateForces();

      // console.log(projectile.velocity.magnitude);
    }

    for (const constraint of this.constraints) {
      constraint.updateForces();
    }

    for (const projectile of this.projectiles) {
      projectile.updateKinematics(deltaTime);
    }

    for (const constraint of this.constraints) {
      constraint.updateKinematics();
    }
  }

  public render(): void {
    // this.graphHandler.updateGraph(Simulation.instance.elapsedTime);
    this.camera.update();
    this.canvas.render();
    this.uiManager.update();
  }
}

const sim = Simulation.instance;
sim.init();

export const simulation = sim;
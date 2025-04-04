import { Vector2 } from "../math/vector2.js";
import { ForceType, Projectile, ProjectileProperties } from "../objects/projectile.js";
import { Canvas } from "../rendering/canvas.js";
import { Loop } from "./loop.js";
import { Obstacle } from "../objects/obstacle.js";
import { Rope } from "../objects/constraint.js";
import { GraphHandler } from "../graphing/graphHandler.js";
import { Camera } from "../rendering/camera.js";
import { DisplayControl } from "../interfacing/controller.js";

import { UIManager } from "../interfacing/uimanager.js";
import { PhysicsMaterial } from "../objects/physicsMaterial.js";
import { Field, FieldType } from "../objects/field.js";

export interface Constants {
  gravitationalConstant: number;
  coulombConstant: number;
  airDensity: number;
}

export class Simulation extends Loop {
  public readonly materials: Set<PhysicsMaterial> = new Set();
  public readonly projectiles: Set<Projectile> = new Set();
  public readonly properties: Set<ProjectileProperties> = new Set();
  public readonly ropes: Set<Rope> = new Set();
  public readonly obstacles: Set<Obstacle> = new Set();

  public readonly fields: Set<Field> = new Set([
    new Field("Earth's Gravity", new Vector2(0, -1).unit, false, FieldType.gravitational, 9.81),
    // new Field("Electric Field", new Vector2(1, 0), false, FieldType.electric, 5)
  ]);

  public readonly constants: Constants = {
    gravitationalConstant: 0,
    coulombConstant: 0,
    airDensity: 1.225
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

    const material: PhysicsMaterial = new PhysicsMaterial("TEST", 1, 0, 0, 0.1, "grey");
    const ballMaterial: PhysicsMaterial = new PhysicsMaterial("TEST2", 1, 0, 0, 0.1, "red");
    const projProperties: ProjectileProperties = new ProjectileProperties("Proton", 0.5, 3, -1, ballMaterial);
    const properties2: ProjectileProperties = new ProjectileProperties("Electron", 0.5, 8, 1, ballMaterial);

    const proj = new Projectile(projProperties, new Vector2(-8, 10));
    this.projectiles.add(proj);

    const proj2 = new Projectile(properties2, new Vector2(6, 8));
    this.projectiles.add(proj2);

    this.obstacles.add(new Obstacle([new Vector2(-10, 0), new Vector2(10, 0)], 1, false, material));
    this.obstacles.add(new Obstacle([new Vector2(-10, 10), new Vector2(-10, 0), new Vector2(0, 0)], 1, false, material));
    this.obstacles.add(new Obstacle([new Vector2(10, 0), new Vector2(10, 10)], 1, false, material));

    this.obstacles.add(new Obstacle([new Vector2(-100, -100), new Vector2(100, -100), new Vector2(100, 100), new Vector2(-100, 100)], 0, true, material));

    // this.camera.setFrameOfReference(proj);

    this.start();
    // this.graphHandler.activateProjectile(proj, 0);
    // this.graphHandler.activateProjectile(proj2, 0);

    // // ################Where do I put this?????????################
    // // Its for the hamburger icon on mobile
    // document.addEventListener('DOMContentLoaded', () => {
    //   const toggle = document.createElement('button');
    //   toggle.className = 'sidebar-toggle';
    //   document.body.appendChild(toggle);

    //   const sidebar = document.querySelector('.content-container');

    //   toggle.addEventListener('click', () => {
    //     sidebar.classList.toggle('active');
    //     toggle.classList.toggle('active');
    //   });

    //   // Close sidebar when clicking outside
    //   document.addEventListener('click', (e) => {
    //     if (sidebar.classList.contains('active') &&
    //       !sidebar.contains(e.target) &&
    //       e.target !== toggle) {
    //       sidebar.classList.remove('active');
    //       toggle.classList.remove('active');
    //     }
    //   });
    // });
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
        const gravMag: number = this.constants.gravitationalConstant * projectile.properties.mass * otherProj.properties.mass / difference.magnitude;
        const electricMag: number = -this.constants.coulombConstant * projectile.properties.charge * otherProj.properties.charge / difference.magnitude;

        projectile.applyForce(difference.unit.multiply(gravMag), false, ForceType.gravity);
        otherProj.applyForce(difference.unit.multiply(-gravMag), false, ForceType.gravity);

        projectile.applyForce(difference.unit.multiply(electricMag), false, ForceType.electrostatic);
        otherProj.applyForce(difference.unit.multiply(-electricMag), false, ForceType.electrostatic);
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
    // this.graphHandler.updateGraph(Simulation.instance.elapsedTime);
    this.camera.update();
    this.canvas.render();
    this.uiManager.update();
  }
}

const sim = Simulation.instance;
sim.init();

export const simulation = sim;
// ChaseCamera.js: een camera die achter de moto aan vliegt. De camera staat een vast stuk
// achter en boven de moto en kijkt iets vooruit. Hij volgt zacht (niet vastgelast), en het
// beeld wordt breder bij hoge snelheid voor een gevoel van vaart.
import * as THREE from "three";
import { CONFIG } from "../config.js";

const LOOK_HEIGHT = 1; // meter: kijk naar de rijder, niet naar de grond

export class ChaseCamera {
  constructor(camera) {
    this.camera = camera;
    this.position = new THREE.Vector3(); // vloeiende camerapositie
    this.lookTarget = new THREE.Vector3(); // vloeiend kijkpunt
    this.wanted = new THREE.Vector3();
    this.wantedLook = new THREE.Vector3();
  }

  snapTo(bike) {
    this.computeTargets(bike);
    this.position.copy(this.wanted);
    this.lookTarget.copy(this.wantedLook);
    this.apply(bike, 1);
  }

  update(dt, bike) {
    this.computeTargets(bike);
    // 1 - exp(...) geeft bij elke beeldsnelheid hetzelfde volggedrag (minder haperen).
    const follow = 1 - Math.exp(-CONFIG.camera.followSharpness * dt);
    this.position.lerp(this.wanted, follow);
    this.lookTarget.lerp(this.wantedLook, follow);
    this.apply(bike, follow);
  }

  // Waar wil de camera zijn en waar wil hij naar kijken, volgens de moto op dit moment?
  computeTargets(bike) {
    const { distance, height, lookAhead } = CONFIG.camera;
    const fx = -Math.sin(bike.heading);
    const fz = -Math.cos(bike.heading);
    this.wanted.set(bike.position.x - fx * distance, height, bike.position.z - fz * distance);
    this.wantedLook.set(bike.position.x + fx * lookAhead, LOOK_HEIGHT, bike.position.z + fz * lookAhead);
  }

  apply(bike, follow) {
    this.camera.position.copy(this.position);
    this.camera.lookAt(this.lookTarget);
    const speedRatio = Math.min(1, Math.max(0, bike.speed / bike.type.topSpeed));
    const wantedFov = CONFIG.camera.fov + CONFIG.camera.speedFovBoost * speedRatio;
    const fov = this.camera.fov + (wantedFov - this.camera.fov) * follow;
    if (Math.abs(fov - this.camera.fov) > 1e-4) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }
}

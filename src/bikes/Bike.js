// Bike.js: de rijfysica van één moto. Arcade, geen echte natuurkunde: optrekken, remmen,
// sturen en overhellen, afhankelijk van de ondergrond. Het 3D-model leest alleen de velden
// position, heading, speed, lean en surface. Heading 0 = rijdt naar -Z (zie contract 02).
import * as THREE from "three";
import { CONFIG } from "../config.js";
import { headingFromTangent } from "../world/Track.js";

const OVERSPEED_EASE = 1.5;    // 1/s: hoe snel je terugzakt als je harder gaat dan toegestaan
const MIN_STEER_SPEED = 3;     // m/s: onder deze snelheid sturen we steeds minder (0 bij stilstand)
const LEAN_EASE = 8;           // 1/s: hoe snel het overhellen het doel volgt

export class Bike {
  constructor(type, track) {
    this.type = type;
    this.track = track;
    this.position = new THREE.Vector3();
    this.heading = 0;
    this.speed = 0;
    this.lean = 0;
    this.surface = "road";
  }

  resetTo({ position, heading }) {
    this.position.set(position.x, 0, position.z);
    this.heading = heading;
    this.speed = 0;
    this.lean = 0;
    this.surface = this.track.getSurfaceAt(this.position.x, this.position.z);
  }

  update(dt, controls) {
    if (controls.reset && Math.abs(this.speed) < CONFIG.resetBelowSpeed) {
      this.resetToCenterLine();
      return;
    }
    const ground = this.type.surface[this.surface];
    this.updateSpeed(dt, controls, ground);
    this.updateHeading(dt, controls, ground);
    this.updateLean(dt, controls);
    this.move(dt);
    // Ondergrond pas na het bewegen opvragen: dat is dan de input voor de volgende stap.
    this.surface = this.track.getSurfaceAt(this.position.x, this.position.z);
  }

  // Terug op het dichtste punt van de middenlijn, in de rijrichting.
  resetToCenterLine() {
    const near = this.track.getNearest(this.position.x, this.position.z);
    this.resetTo({ position: near.position, heading: headingFromTangent(near.tangent.x, near.tangent.z) });
  }

  updateSpeed(dt, controls, ground) {
    const maxForward = this.type.topSpeed * ground.speed;
    if (controls.throttle > 0) this.applyThrottle(dt, controls.throttle, maxForward, ground.grip);
    else if (controls.brake > 0) this.applyBrake(dt, controls.brake, ground);
    else this.coast(dt);

    // Harder dan de ondergrond toelaat (bijv. van asfalt het gras op)? Zakt zacht terug
    // richting het maximum, geen harde klap.
    if (this.speed > maxForward) {
      this.speed += (maxForward - this.speed) * Math.min(1, OVERSPEED_EASE * dt);
    }
  }

  applyThrottle(dt, throttle, maxForward, grip) {
    if (this.speed < 0) {
      // Eerst de achteruitgang afremmen, daarna pas vooruit.
      this.speed = Math.min(0, this.speed + this.type.braking * throttle * dt);
    } else if (this.speed < maxForward) {
      this.speed = Math.min(maxForward, this.speed + this.type.acceleration * throttle * grip * dt);
    }
  }

  // Rem tot stilstand; blijf je remmen dan ga je achteruit.
  applyBrake(dt, brake, ground) {
    if (this.speed > 0) {
      this.speed = Math.max(0, this.speed - this.type.braking * brake * dt);
    } else {
      const maxReverse = CONFIG.reverseSpeed * ground.speed;
      this.speed = Math.max(-maxReverse, this.speed - this.type.acceleration * brake * ground.grip * dt);
    }
  }

  coast(dt) {
    const loss = CONFIG.coastDecel * dt;
    if (Math.abs(this.speed) <= loss) this.speed = 0;
    else this.speed -= Math.sign(this.speed) * loss;
  }

  // Rechts sturen = heading kleiner. Achteruit is het omgekeerd, zoals bij een auto.
  updateHeading(dt, controls, ground) {
    this.heading -= controls.steer * this.turnRate(ground) * Math.sign(this.speed) * dt;
  }

  // Hoeveel rad/s je nu kunt draaien: hoog bij lage snelheid, lager bij hoge snelheid
  // (anders is de moto onbestuurbaar snel), en 0 bij stilstand.
  turnRate(ground) {
    const { turnRate, turnRateAtTop, topSpeed } = this.type;
    const speedRatio = Math.min(1, Math.abs(this.speed) / topSpeed);
    const rate = turnRate + (turnRateAtTop - turnRate) * speedRatio;
    const standstillFade = Math.min(1, Math.abs(this.speed) / MIN_STEER_SPEED);
    return rate * ground.grip * standstillFade;
  }

  // Doel van de helling = sturen x snelheid. Rechts = negatief. Zacht ingevlogen.
  updateLean(dt, controls) {
    const speedRatio = Math.min(1, Math.abs(this.speed) / this.type.topSpeed);
    const turnDirection = controls.steer * Math.sign(this.speed); // + = echt naar rechts
    const target = -turnDirection * speedRatio * this.type.maxLean;
    this.lean += (target - this.lean) * (1 - Math.exp(-LEAN_EASE * dt));
  }

  move(dt) {
    this.position.x += -Math.sin(this.heading) * this.speed * dt;
    this.position.z += -Math.cos(this.heading) * this.speed * dt;
  }
}

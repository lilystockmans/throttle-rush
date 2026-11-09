// Bike.js: de rijfysica van één moto. Arcade, geen echte natuurkunde: optrekken, remmen,
// sturen en overhellen, afhankelijk van de ondergrond. Het 3D-model leest alleen de velden
// position, heading, speed, lean en surface. Heading 0 = rijdt naar -Z (zie contract 02).
//
// Fase 5 voegt vier dingen toe die andere onderdelen kunnen gebruiken:
// - push(vx, vz): een zijwaartse duw (botsing of zijduw). Die komt BOVENOP het normale rijden
//   en dooft vanzelf uit, zodat sturen en gas gewoon blijven werken.
// - stun(s): even maximaal 30% gas en een lagere topsnelheid (het slachtoffer van een zijduw).
// - modifiers: de speciale knop (abilities.js) zet hier topsnelheid, optrekken en offroad-hulp.
// - velocity: de echte bewegingssnelheid (vooruit + duw), handig voor botsingen.
import * as THREE from "three";
import { CONFIG } from "../config.js";
import { headingFromTangent } from "../world/Track.js";

const OVERSPEED_EASE = 1.5;    // 1/s: hoe snel je terugzakt als je harder gaat dan toegestaan
const MIN_STEER_SPEED = 3;     // m/s: onder deze snelheid sturen we steeds minder (0 bij stilstand)
const LEAN_EASE = 8;           // 1/s: hoe snel het overhellen het doel volgt
const STUN_MAX_GAS = 0.3;      // tijdens een stun hooguit zoveel gas (contract 08-B)
const STUN_SPEED_CAP = 0.6;    // en de topsnelheid zakt naar dit deel, anders verlies je niets
const PUSH_STOP = 0.02;        // m/s: een kleinere duw maken we gewoon 0 (geen eindeloos staartje)

export class Bike {
  constructor(type, track) {
    this.type = type;
    this.track = track;
    this.position = new THREE.Vector3();
    this.heading = 0;
    this.speed = 0;
    this.lean = 0;
    this.surface = "road";
    this.mass = type.mass;
    this.modifiers = { topSpeed: 1, acceleration: 1, offroad: 0 };   // 1/1/0 = niets bijzonders
    this.velocity = new THREE.Vector3();        // alleen lezen: vooruit + duw, m/s
    this.pushVelocity = new THREE.Vector3();    // de duw alleen (m/s), dooft uit
    this.stunLeft = 0;                          // s dat de stun nog duurt
    this.groundBlend = { speed: 1, grip: 1 };   // hergebruikt, zodat we niet elke stap iets aanmaken
  }

  // Zijwaartse snelheid erbij (m/s, wereld-assen). Meerdere duwen tellen op.
  push(vx, vz) {
    this.pushVelocity.x += vx;
    this.pushVelocity.z += vz;
  }

  stun(seconds) {
    this.stunLeft = Math.max(this.stunLeft, seconds);
  }

  resetTo({ position, heading }) {
    this.position.set(position.x, 0, position.z);
    this.heading = heading;
    this.speed = 0;
    this.lean = 0;
    this.pushVelocity.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.stunLeft = 0;
    this.surface = this.track.getSurfaceAt(this.position.x, this.position.z);
  }

  update(dt, controls) {
    if (controls.reset && Math.abs(this.speed) < CONFIG.resetBelowSpeed) {
      this.resetToCenterLine();
      return;
    }
    this.stunLeft = Math.max(0, this.stunLeft - dt);
    const ground = this.effectiveGround();
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

  // De ondergrond waar de moto nu mee rekent. Met de offroad-boost schuiven speed en grip van
  // dirt/gras/berm richting die van asfalt: modifiers.offroad 0 = niets, 1 = alsof het asfalt is.
  effectiveGround() {
    const ground = this.type.surface[this.surface];
    const k = this.modifiers.offroad;
    if (k === 0 || this.surface === "road") return ground;
    const road = this.type.surface.road;
    this.groundBlend.speed = ground.speed + (road.speed - ground.speed) * k;
    this.groundBlend.grip = ground.grip + (road.grip - ground.grip) * k;
    return this.groundBlend;
  }

  updateSpeed(dt, controls, ground) {
    const stunned = this.stunLeft > 0;
    let maxForward = this.type.topSpeed * this.modifiers.topSpeed * ground.speed;
    if (stunned) maxForward *= STUN_SPEED_CAP;
    const throttle = stunned ? Math.min(controls.throttle, STUN_MAX_GAS) : controls.throttle;
    if (throttle > 0) this.applyThrottle(dt, throttle, maxForward, ground.grip);
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
      this.speed = Math.min(maxForward, this.speed + this.type.acceleration * this.modifiers.acceleration * throttle * grip * dt);
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

  // Eerst de gewone beweging, dan de duw erbovenop. De duw dooft exponentieel uit
  // (pushDecay per seconde), onafhankelijk van de stapgrootte.
  move(dt) {
    const push = this.pushVelocity;
    this.velocity.set(-Math.sin(this.heading) * this.speed + push.x, 0, -Math.cos(this.heading) * this.speed + push.z);
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    push.multiplyScalar(Math.exp(-CONFIG.collisions.pushDecay * dt));
    if (push.lengthSq() < PUSH_STOP * PUSH_STOP) push.set(0, 0, 0);
  }
}

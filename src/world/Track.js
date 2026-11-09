// Track.js: de wiskunde van het circuit. Maakt uit de punten in trackData een vloeiende
// gesloten lus en beantwoordt vragen als "waar ben ik op de baan?" en "op welke ondergrond?".
// Rechts = tangent x omhoog. Bij rijrichting -Z is rechts dus +X.
import * as THREE from "three";

const UP = new THREE.Vector3(0, 1, 0);
const SAMPLE_SPACING = 1;   // meter tussen twee voorbemonsterde punten
const COARSE_STEP = 8;      // in getNearest: grove zoekstap (in samples)
const ROW_DISTANCES = [8, 16]; // startrijen: meter vóór t = 0
const SLOT_OFFSETS = [-4, 0, 4]; // zijwaartse plek in de rij (meter, + = rechts)
const SLOTS_PER_ROW = 3;

// Richting (tx, tz) omzetten naar een heading volgens contract 02: vooruit = (-sin h, -cos h).
export function headingFromTangent(tx, tz) {
  return Math.atan2(-tx, -tz);
}

export class Track {
  constructor(data) {
    this.roadWidth = data.roadWidth;
    this.curbWidth = data.curbWidth;
    this.shortcutWidth = data.shortcut.width;

    // Centripetal voorkomt lussen en overshoot in scherpe bochten.
    this.curve = new THREE.CatmullRomCurve3(toVectors(data.points), true, "centripetal");
    this.curve.arcLengthDivisions = 2000; // nauwkeurige lengte -> gelijke afstanden
    this.length = this.curve.getLength();

    this.shortcutCurve = new THREE.CatmullRomCurve3(toVectors(data.shortcut.points), false, "centripetal");
    this.shortcutCurve.arcLengthDivisions = 500;

    this.buildLoopSamples();
    this.buildShortcutSamples();
  }

  // Zet de lus één keer om in platte lijsten (x, z, tangent) om snel in te kunnen zoeken.
  buildLoopSamples() {
    this.count = Math.round(this.length / SAMPLE_SPACING);
    this.sampleLength = this.length / this.count; // werkelijke afstand tussen samples
    const points = [];
    for (let i = 0; i < this.count; i++) points.push(this.curve.getPointAt(i / this.count));
    this.xs = Float64Array.from(points, (p) => p.x);
    this.zs = Float64Array.from(points, (p) => p.z);
    this.tx = new Float64Array(this.count);
    this.tz = new Float64Array(this.count);
    for (let i = 0; i < this.count; i++) {
      const next = (i + 1) % this.count;
      const prev = (i - 1 + this.count) % this.count;
      const dx = this.xs[next] - this.xs[prev];
      const dz = this.zs[next] - this.zs[prev];
      const len = Math.hypot(dx, dz);
      this.tx[i] = dx / len;
      this.tz[i] = dz / len;
    }
  }

  buildShortcutSamples() {
    const n = Math.max(2, Math.ceil(this.shortcutCurve.getLength() / SAMPLE_SPACING));
    this.shortcutXs = new Float64Array(n + 1);
    this.shortcutZs = new Float64Array(n + 1);
    for (let i = 0; i <= n; i++) {
      const p = this.shortcutCurve.getPointAt(i / n);
      this.shortcutXs[i] = p.x;
      this.shortcutZs[i] = p.z;
    }
  }

  sampleFrames(count) {
    return sampleCurveFrames(this.curve, count, count); // laatste punt != eerste
  }

  sampleShortcutFrames(count) {
    return sampleCurveFrames(this.shortcutCurve, count, count - 1); // wel begin en eind
  }

  // Snelle zoektocht zonder onthouden van vorige posities (geen state = geen verkeerde
  // sprongen na een reset). Eerst grof (elke 8e sample), dan fijn rond de beste, dan
  // projecteren op het lijnstuk voor een vloeiende t en lateral. Circa 150 + 17 checks.
  getNearest(x, z) {
    const n = this.count;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < n; i += COARSE_STEP) {
      const d = this.distSq(i, x, z);
      if (d < bestD) { bestD = d; best = i; }
    }
    const center = best;
    for (let k = -COARSE_STEP; k <= COARSE_STEP; k++) {
      const i = (center + k + n) % n;
      const d = this.distSq(i, x, z);
      if (d < bestD) { bestD = d; best = i; }
    }
    return this.projectNearSample(best, x, z);
  }

  distSq(i, x, z) {
    const dx = this.xs[i] - x;
    const dz = this.zs[i] - z;
    return dx * dx + dz * dz;
  }

  // Het echte dichtste punt ligt op het lijnstuk vóór of na sample i. Kies het beste.
  projectNearSample(i, x, z) {
    const n = this.count;
    const before = this.projectOnSegment((i - 1 + n) % n, i, x, z);
    const after = this.projectOnSegment(i, (i + 1) % n, x, z);
    const hit = before.distSq < after.distSq ? before : after;
    const tangentLen = Math.hypot(hit.tx, hit.tz);
    const tx = hit.tx / tangentLen;
    const tz = hit.tz / tangentLen;
    const lateral = (x - hit.x) * -tz + (z - hit.z) * tx; // dot met right = (-tz, tx)
    let t = (hit.index + hit.fraction) / n;
    if (t >= 1) t -= 1;
    return {
      t,
      lateral,
      position: new THREE.Vector3(hit.x, 0, hit.z),
      tangent: new THREE.Vector3(tx, 0, tz),
    };
  }

  projectOnSegment(a, b, x, z) {
    const ax = this.xs[a], az = this.zs[a];
    const sx = this.xs[b] - ax, sz = this.zs[b] - az;
    const fraction = Math.min(1, Math.max(0, ((x - ax) * sx + (z - az) * sz) / (sx * sx + sz * sz)));
    const px = ax + sx * fraction, pz = az + sz * fraction;
    return {
      x: px, z: pz, fraction, index: a,
      distSq: (x - px) ** 2 + (z - pz) ** 2,
      // tangent: meng van beide uiteinden zodat hij vloeiend verloopt
      tx: this.tx[a] * (1 - fraction) + this.tx[b] * fraction,
      tz: this.tz[a] * (1 - fraction) + this.tz[b] * fraction,
    };
  }

  // Asfalt en berm winnen van dirt, dus dirt controleren we pas als laatste.
  getSurfaceAt(x, z) {
    const lateral = Math.abs(this.getNearest(x, z).lateral);
    const halfRoad = this.roadWidth / 2;
    if (lateral <= halfRoad) return "road";
    if (lateral <= halfRoad + this.curbWidth) return "curb";
    if (this.isOnShortcut(x, z)) return "dirt";
    return "grass";
  }

  // Het pad is kort (enkele honderden samples): gewoon alles nalopen is hier snel genoeg.
  isOnShortcut(x, z) {
    const limit = (this.shortcutWidth / 2) ** 2;
    for (let i = 0; i < this.shortcutXs.length; i++) {
      const dx = this.shortcutXs[i] - x;
      const dz = this.shortcutZs[i] - z;
      if (dx * dx + dz * dz <= limit) return true;
    }
    return false;
  }

  // Slot 0-2 = voorste rij (8 m voor de streep), slot 3-5 = achterste rij (16 m).
  getStartTransform(slot) {
    const row = Math.floor(slot / SLOTS_PER_ROW);
    const side = SLOT_OFFSETS[slot % SLOTS_PER_ROW];
    const index = (this.count - Math.round(ROW_DISTANCES[row] / this.sampleLength)) % this.count;
    const tx = this.tx[index], tz = this.tz[index];
    const position = new THREE.Vector3(
      this.xs[index] + -tz * side,
      0,
      this.zs[index] + tx * side,
    );
    return { position, heading: headingFromTangent(tx, tz) };
  }
}

function toVectors(points) {
  return points.map(([x, z]) => new THREE.Vector3(x, 0, z));
}

// `divisions` = door hoeveel je u deelt: count voor een lus, count - 1 voor een open pad.
function sampleCurveFrames(curve, count, divisions) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    const u = i / divisions;
    const tangent = curve.getTangentAt(u).setY(0).normalize();
    frames.push({
      position: curve.getPointAt(u).setY(0),
      tangent,
      right: new THREE.Vector3().crossVectors(tangent, UP).normalize(),
    });
  }
  return frames;
}

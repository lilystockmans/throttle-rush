// AIDriver.js: de computer-bestuurder. Hij "drukt toetsen" voor één moto: elke fysica-stap geeft
// getControls() { throttle, brake, steer, action, reset }, net als het toetsenbord.
//
// Zo denkt hij, in vier stappen:
// 1. Vooruitkijken: hij loopt langs de voorbemonsterde baan tot 80 m vooruit. Het punt op
//    ongeveer 6 m + 0,45 s rijden vooruit is zijn stuurdoel (hoe sneller, hoe verder kijken).
// 2. Sturen: hoek tussen zijn neus en het stuurdoel = fout. Stuur = -gain x fout (rechts = -).
// 3. Snelheid: per stukje baan schat hij de bochtstraal en rekent uit hoe hard de moto daar nog
//    om kan (stuurkracht neemt af met snelheid, zoals in Bike.js). Hij remt eerder als de bocht
//    verder weg ligt (remafstand). skill maakt het trager; boost-modifiers tellen mee.
// 4. Speciale knop: createButtonPresser (abilities.js) beslist of het een goed moment is.
// Een cross-rijder (useShortcut) neemt het dirt-pad zodra hij vlak voor het begin is; de
// lookahead loopt dan vanzelf het pad in en erna weer de baan op.
import { CONFIG } from "../config.js";
import { createButtonPresser } from "../bikes/abilities.js";
import { headingFromTangent } from "../world/Track.js";

const FRAME_SPACING = 2;        // m tussen voorbemonsterde punten
const CURVE_SPAN = 2;           // frames links en rechts waarmee we de bochtstraal meten
const LOOK_BASE = 6;            // m: minimale kijkafstand voor het stuurdoel
const LOOK_TIME = 0.45;         // s: extra kijkafstand = snelheid x dit
const PLAN_DISTANCE = 80;       // m: zo ver kijken we vooruit voor bochten
const STEER_GAIN = 3;           // stuur per radiaal hoekfout (P-regelaar)
const CORNER_MARGIN = 0.85;     // slechts 85% van de theoretische bochtsnelheid: ruimte over
const BRAKE_USE = 0.7;          // rekenen met 70% van het remvermogen (marge voor reactie)
const BRAKE_TOLERANCE = 1.5;    // m/s boven het doel voordat we echt remmen
const ENTRY_DISTANCE = 25;      // m voor het begin van het pad: afslaan naar de shortcut
const WOBBLE_AMPLITUDE = 1;     // m schommeling van de lijn
const WOBBLE_SPEED = 0.35;      // rad/s: traag
const WOBBLE_PHASE_STEP = 2.4;  // elke rijder een andere fase
const STUCK_SPEED = 2;          // m/s: trager dan dit...
const STUCK_SECONDS = 2;        // ...langer dan dit = vastgereden
const OFF_TRACK_DISTANCE = 25;  // m naast de middenlijn = verdwaald
const PATH_START_FRAMES = 3;    // zo kort op het pad telt als "begin van de shortcut"
let nextPhase = 0;
const routeCache = new WeakMap();   // frames en bochten per circuit maar één keer uitrekenen

export class AIDriver {
  constructor({ track, bike, skill, line, useShortcut }) {
    Object.assign(this, { track, bike, skill, line, useShortcut });
    this.routes = getRoutes(track);
    this.phase = (nextPhase += WOBBLE_PHASE_STEP);   // per rijder een andere golf
    this.clock = 0;
    this.onPath = false;          // rijdt hij nu op het shortcut-pad?
    this.index = 0;               // waar hij is: frame-nummer op de baan of het pad
    this.cursor = { onPath: false, i: 0 };   // loopt vooruit tijdens het kijken
    this.stuckTime = 0;
    this.target = { x: 0, z: 0 };   // stuurdoel, wordt elke stap bijgewerkt
    this.situation = { curveAhead: 0, startingShortcut: false };   // wat de knop-logica moet weten
    this.pressButton = createButtonPresser(bike);
  }

  getControls(others = []) {
    this.clock += CONFIG.physicsStep;
    if (this.isLost(this.locate())) return this.resetControls();
    const speedLimit = this.scanAhead();
    this.situation.startingShortcut = this.onPath && this.index <= PATH_START_FRAMES;
    return {
      throttle: this.bike.speed < speedLimit ? 1 : 0,
      brake: this.bike.speed > speedLimit + BRAKE_TOLERANCE ? 1 : 0,
      steer: this.steerToTarget(),
      action: this.pressButton(this.clock, this.situation, others),
      reset: false,
    };
  }

  // Huidige zijwaartse lijn: voorkeur + trage golf, zodat rijders niet als een trein rijden.
  offset() {
    return this.line + WOBBLE_AMPLITUDE * Math.sin(this.clock * WOBBLE_SPEED + this.phase);
  }

  // ---------- Waar ben ik? ----------
  // Werkt this.index en this.onPath bij en geeft de afstand tot de middenlijn (+ = rechts).
  locate() {
    const { x, z } = this.bike.position;
    if (this.onPath) {
      this.followPathIndex(x, z);
      if (this.onPath) return 0;      // op het pad zijn we per definitie "op de route"
    }
    const near = this.track.getNearest(x, z);
    const { loop, entryIndex } = this.routes;
    this.index = Math.round(near.t * loop.count) % loop.count;
    const framesToEntry = (entryIndex - this.index + loop.count) % loop.count;
    if (this.useShortcut && framesToEntry <= ENTRY_DISTANCE / loop.spacing) { this.onPath = true; this.index = 0; }
    return near.lateral;
  }

  // Lokaal zoeken vanaf het vorige frame: de rijder gaat alleen vooruit.
  followPathIndex(x, z) {
    const { frames } = this.routes.path;
    let best = this.index;
    let bestD = Infinity;
    for (let i = this.index; i < Math.min(frames.length, this.index + 8); i++) {
      const d = (frames[i].position.x - x) ** 2 + (frames[i].position.z - z) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
    this.index = best;
    if (best >= frames.length - 2) this.onPath = false;   // einde: terug naar baanvolgen
  }

  // ---------- Verdwaald of vast? ----------
  isLost(lateral) {
    this.stuckTime = Math.abs(this.bike.speed) < STUCK_SPEED ? this.stuckTime + CONFIG.physicsStep : 0;
    return this.stuckTime > STUCK_SECONDS || (!this.onPath && Math.abs(lateral) > OFF_TRACK_DISTANCE);
  }

  // Bike negeert reset boven resetBelowSpeed. Daarom blijft de AI dan vol remmen tot het mag.
  resetControls() {
    this.stuckTime = 0;
    this.onPath = false;
    return { throttle: 0, brake: 1, steer: 0, action: false, reset: true };
  }

  // ---------- Vooruitkijken: stuurdoel en snelheidslimiet ----------
  // Loopt PLAN_DISTANCE vooruit. Bewaart het stuurdoel in this.target en geeft de
  // snelheid terug die nu hoogstens mag, zodat hij op elk punt verderop nog kan afremmen.
  scanAhead() {
    const { bike, cursor } = this;
    const lookDistance = LOOK_BASE + LOOK_TIME * Math.abs(bike.speed);
    Object.assign(cursor, { onPath: this.onPath, i: this.index });
    let allowed = Infinity;
    let sharpest = 0;      // scherpste kromming die we zien (voor de knop-logica)
    let targetSet = false;
    for (let s = 0; s <= PLAN_DISTANCE; s += this.stepForward()) {
      const route = cursor.onPath ? this.routes.path : this.routes.loop;
      allowed = Math.min(allowed, this.allowedSpeedAt(route, cursor.i, s));
      sharpest = Math.max(sharpest, Math.abs(route.curvature[cursor.i]));
      if (!targetSet && s >= lookDistance) { this.setTarget(route, cursor.i); targetSet = true; }
    }
    this.situation.curveAhead = sharpest;
    return this.skill * allowed;
  }

  // Zet de cursor één frame verder (het pad in, het pad uit, of rond de lus). Geeft de afstand.
  stepForward() {
    const { cursor, routes } = this;
    if (cursor.onPath) {
      cursor.i++;
      if (cursor.i >= routes.path.frames.length) { cursor.onPath = false; cursor.i = routes.exitIndex; }
      return routes.path.spacing;
    }
    cursor.i = (cursor.i + 1) % routes.loop.count;
    if (this.useShortcut && cursor.i === routes.entryIndex) { cursor.onPath = true; cursor.i = 0; }
    return routes.loop.spacing;
  }

  setTarget(route, i) {
    const frame = route.frames[i];
    const side = this.sideOffset(route);
    this.target.x = frame.position.x + frame.right.x * side;
    this.target.z = frame.position.z + frame.right.z * side;
  }

  // Hoe hard mag ik nú, om over s meter dit punt nog met de juiste snelheid te halen?
  allowedSpeedAt(route, i, s) {
    const { type, modifiers } = this.bike;
    const safeHere = Math.min(type.topSpeed * modifiers.topSpeed * this.groundFactor(route, "speed"),
      this.cornerSpeed(route, i, this.groundFactor(route, "grip")));
    const brakeRoom = 2 * this.bike.type.braking * BRAKE_USE * s;   // v^2 = v0^2 + 2 a s
    return Math.sqrt(safeHere * safeHere + brakeRoom);
  }

  // Speed- of grip-factor van de ondergrond op deze route. Op het pad rekenen we met dirt, maar
  // met de offroad-boost schuift dat richting asfalt (zelfde som als effectiveGround in Bike.js).
  groundFactor(route, key) {
    const { surface } = this.bike.type;
    if (route !== this.routes.path) return surface.road[key];
    return surface.dirt[key] + (surface.road[key] - surface.dirt[key]) * this.bike.modifiers.offroad;
  }

  // Hoogste snelheid waarop de stuurkracht nog genoeg is voor deze bocht.
  // Nodig: bochtkromming = draaisnelheid(v) / v, met draaisnelheid(v) = grip x (a + (b - a) v / top)
  // (zoals Bike.turnRate). Oplossen voor v geeft de formule hieronder.
  cornerSpeed(route, i, grip) {
    const { turnRate: a, turnRateAtTop: b, topSpeed } = this.bike.type;
    const curvature = this.curvatureOnMyLine(route, i);
    return (CORNER_MARGIN * grip * a) / (curvature + (grip * (a - b)) / topSpeed);
  }

  // Zit ik aan de buitenkant van een bocht, dan is mijn straal groter (kromming kleiner);
  // aan de binnenkant juist kleiner. Daarom corrigeren we de kromming van de middenlijn.
  curvatureOnMyLine(route, i) {
    const k = route.curvature[i];
    return Math.abs(k / Math.max(0.2, 1 + k * this.sideOffset(route)));
  }

  // Op de baan rijden we naast de middenlijn, op het pad gewoon in het midden.
  sideOffset(route) {
    return route === this.routes.loop ? this.offset() : 0;
  }

  steerToTarget() {
    const { bike, target } = this;
    const wanted = headingFromTangent(target.x - bike.position.x, target.z - bike.position.z);
    const error = wrapAngle(wanted - bike.heading);   // fout > 0: doel ligt links, dus stuur < 0
    return Math.max(-1, Math.min(1, -STEER_GAIN * error));
  }
}

// ---------- Voorbereiding: frames en kromming per route ----------
function getRoutes(track) {
  if (routeCache.has(track)) return routeCache.get(track);
  const loop = buildRoute(track.sampleFrames(Math.round(track.length / FRAME_SPACING)), true);
  const path = buildRoute(track.sampleShortcutFrames(pathFrameCount(track)), false);
  const [first, last] = [path.frames[0], path.frames[path.frames.length - 1]];
  const routes = { loop, path, entryIndex: loopIndexOf(track, loop, first), exitIndex: loopIndexOf(track, loop, last) };
  routeCache.set(track, routes);
  return routes;
}

// Het pad heeft geen lengte in de Track-API: schat die met een grove bemonstering.
function pathFrameCount(track) {
  const rough = track.sampleShortcutFrames(100);
  return Math.ceil(chordLength(rough, false) / FRAME_SPACING) + 1;
}

function loopIndexOf(track, loop, frame) {
  const t = track.getNearest(frame.position.x, frame.position.z).t;
  return Math.round(t * loop.count) % loop.count;
}

function chordLength(frames, closed) {
  let total = 0;
  for (let i = 0; i < (closed ? frames.length : frames.length - 1); i++) {
    total += frames[i].position.distanceTo(frames[(i + 1) % frames.length].position);
  }
  return total;
}

// Kromming per frame: richtingsverandering over een stukje baan gedeeld door de lengte ervan.
// + = linksom (heading groeit), - = rechtsom.
function buildRoute(frames, closed) {
  const count = frames.length;
  const spacing = chordLength(frames, closed) / (closed ? count : count - 1);
  const headings = frames.map((f) => headingFromTangent(f.tangent.x, f.tangent.z));
  const pick = (i) => (closed ? (i + count) % count : Math.min(count - 1, Math.max(0, i)));
  const curvature = frames.map((_, i) => {
    const from = pick(i - CURVE_SPAN);
    const to = pick(i + CURVE_SPAN);
    const steps = closed ? 2 * CURVE_SPAN : to - from;
    return wrapAngle(headings[to] - headings[from]) / (steps * spacing);
  });
  return { frames, count, spacing, curvature };
}

// Hoek terugbrengen naar [-PI, PI], zodat 359 graden "1 graad de andere kant op" wordt.
function wrapAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

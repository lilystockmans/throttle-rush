// abilities.js: de speciale knop (spatie) van een moto. Elk motortype heeft er één:
// - turbo (sport):    tijdelijk hogere topsnelheid en sneller optrekken.
// - offroad (cross):  tijdelijk (bijna) geen snelheidsverlies op gras en aarde.
// - shove (cruiser):  de dichtste rijder naast je wordt opzij gezwiept en vertraagt even.
//
// Hoe werkt het? De knop is een kleine toestandsmachine: klaar -> actief -> afkoelen -> klaar.
// Turbo en offroad zetten `bike.modifiers` zolang ze actief zijn (Bike.js past die elke stap
// toe) en zetten ze daarna terug. De zijduw is één klap en heeft dus geen actieve tijd.
// De afkoeltijd begint pas als de boost voorbij is, anders zou een lange boost gratis zijn.
//
// Onderaan staat ook `createButtonPresser`: de "hand" van een computer-rijder. Die weet wanneer
// de knop weer klaar is en of het een goed moment is. Zo staan alle regels van de knop bij elkaar.
import { CONFIG } from "../config.js";

const BESIDE_ALONG = 2.5;       // m: "naast je" = hooguit zoveel vóór of achter je neus
const STRAIGHT_CURVATURE = 1 / 120;   // 1/m: flauwer dan een bocht met 120 m straal = recht stuk

export function createAbility(bike) {
  return new Ability(bike);
}

class Ability {
  constructor(bike) {
    this.bike = bike;
    this.config = bike.type.ability;
    this.onUse = null;   // optioneel: (info) => {} met { kind, target }
    this.state = {
      kind: this.config.kind,
      ready: true,
      active: false,
      cooldownLeft: 0,
      cooldownTotal: this.config.cooldown,
      activeLeft: 0,
    };
    // Telt als "al ingedrukt" tot we een keer losgelaten zien: een spatie die nog vastzat
    // van het menu mag de knop niet meteen afvuren.
    this.wasHeld = true;
  }

  update(dt, actionHeld, others = []) {
    const { state } = this;
    this.tick(dt);
    const pressed = actionHeld && !this.wasHeld;   // alleen het moment van indrukken telt
    this.wasHeld = actionHeld;
    state.ready = !state.active && state.cooldownLeft <= 0;
    if (pressed && state.ready) this.use(others);
  }

  // Tijd laten verstrijken: eerst de actieve boost, daarna de afkoeling.
  tick(dt) {
    const { state } = this;
    if (state.active) {
      state.activeLeft -= dt;
      if (state.activeLeft <= 0) this.stopBoost();
    } else if (state.cooldownLeft > 0) {
      state.cooldownLeft = Math.max(0, state.cooldownLeft - dt);
    }
  }

  use(others) {
    const { state, config } = this;
    let target = null;
    if (config.kind === "shove") {
      target = nearestRider(this.bike, others, CONFIG.collisions.shoveRange);
      if (!target) return;   // niemand in bereik: knop niet verbruikt
      this.shove(target);
      state.cooldownLeft = config.cooldown;
    } else {
      this.startBoost();
    }
    state.ready = false;
    if (this.onUse) this.onUse({ kind: config.kind, target });
  }

  startBoost() {
    const { state, config, bike } = this;
    state.active = true;
    state.activeLeft = config.duration;
    state.cooldownLeft = config.cooldown;
    const m = bike.modifiers;
    if (config.kind === "turbo") {
      m.topSpeed = config.strength;
      m.acceleration = config.strength;
    } else {
      m.offroad = config.strength;
      m.acceleration = 1 + config.strength;   // zelfde factor als extra optrekken (contract 08-A)
    }
  }

  stopBoost() {
    const { state, bike } = this;
    state.active = false;
    state.activeLeft = 0;
    bike.modifiers.topSpeed = 1;
    bike.modifiers.acceleration = 1;
    bike.modifiers.offroad = 0;
  }

  // Duw het slachtoffer zijwaarts (t.o.v. ZIJN rijrichting) weg van ons, en laat hem even vertragen.
  shove(target) {
    const side = sideOf(target, this.bike);
    target.push(Math.cos(target.heading) * side * this.config.strength, -Math.sin(target.heading) * side * this.config.strength);
    target.stun(CONFIG.collisions.shoveStun);
  }
}

// Aan welke kant van het slachtoffer moet hij heen om van ons weg te gaan? +1 = zijn rechterkant,
// -1 = zijn linkerkant. We kijken waar hij ten opzichte van ons zit, gemeten langs zijn eigen "rechts".
function sideOf(target, from) {
  const rightX = Math.cos(target.heading);      // rechts van de rijrichting (heading 0 -> +X)
  const rightZ = -Math.sin(target.heading);
  const away = (target.position.x - from.position.x) * rightX + (target.position.z - from.position.z) * rightZ;
  return away >= 0 ? 1 : -1;
}

// De dichtste andere moto binnen `range` meter, of null.
function nearestRider(bike, others, range) {
  let best = null;
  let bestSq = range * range;
  for (const other of others) {
    if (other === bike) continue;
    const dx = other.position.x - bike.position.x;
    const dz = other.position.z - bike.position.z;
    const distSq = dx * dx + dz * dz;
    if (distSq <= bestSq) { bestSq = distSq; best = other; }
  }
  return best;
}

// Voor computer-rijders: geeft een functie press(clock, situation, others) -> bool die elke stap
// zegt of de knop NU ingedrukt moet zijn. Ze telt zelf de afkoeltijd (uit het motortype) en laat
// na een druk een stap los, want de knop reageert alleen op het moment van indrukken.
// `situation` komt van de AI: { curveAhead: scherpste kromming (1/m) vooruit, startingShortcut }.
export function createButtonPresser(bike) {
  const { kind, duration, cooldown } = bike.type.ability;
  const busy = kind === "shove" ? 0 : duration;   // de zijduw is één klap en duurt niet
  let readyAt = 0;
  let pressed = false;
  return (clock, situation, others) => {
    const ready = clock >= readyAt && !pressed;
    pressed = ready && wantsToUse(bike, situation, others);
    if (pressed) readyAt = clock + busy + cooldown;
    return pressed;
  };
}

// Heeft de knop nu zin?
function wantsToUse(bike, situation, others) {
  switch (bike.type.ability.kind) {
    case "turbo":   // op een recht stuk op asfalt, waar de extra snelheid echt iets oplevert
      return bike.surface === "road" && situation.curveAhead < STRAIGHT_CURVATURE;
    case "offroad": // bij het begin van de shortcut, of als we toch al naast de baan zitten
      return situation.startingShortcut || bike.surface === "grass" || bike.surface === "dirt";
    case "shove":   // iemand naast ons, binnen bereik
      return ridersBeside(bike, others);
    default:
      return false;
  }
}

function ridersBeside(bike, others) {
  const forwardX = -Math.sin(bike.heading);
  const forwardZ = -Math.cos(bike.heading);
  const range = CONFIG.collisions.shoveRange;
  for (const other of others) {
    if (other === bike) continue;
    const dx = other.position.x - bike.position.x;
    const dz = other.position.z - bike.position.z;
    const along = dx * forwardX + dz * forwardZ;
    if (Math.abs(along) <= BESIDE_ALONG && dx * dx + dz * dz <= range * range) return true;
  }
  return false;
}

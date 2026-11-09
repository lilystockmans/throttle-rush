// RaceManager.js: de scheidsrechter van de race. Telt af, houdt per rijder ronden, rondetijden
// en controlepunten bij, bepaalt de positie en stuurt gebeurtenissen naar de UI. Hij bestuurt
// niets: hij kijkt alleen waar elke moto is (via track.getNearest) en rekent daarmee.
//
// Hoe werkt een ronde? Op het circuit liggen "poorten": 4 controlepunten (buiten de shortcut,
// zodat de shortcut altijd mag) en de start/finish-lijn (t = 0). Een rijder passeert een poort
// als zijn t van net ervoor naar net erna gaat, vooruit. Een ronde telt pas als hij alle
// controlepunten in volgorde had en daarna de lijn passeert. Terugteleporteren of keren en
// opnieuw over de lijn rijden levert dus niets op.
//
// Startprobleem: de startplekken liggen 8 en 16 m VOOR de lijn, dus elke rijder begint in
// "ronde 1" met t vlak onder 1. Zijn eerste passage van de lijn is geen ronde maar de
// "inwijding" (armed): pas daarna tellen de controlepunten. De ronde-timer van ronde 1 start
// bij GO, zodat de rondetijden samen precies de totaaltijd zijn.
import { CONFIG } from "../config.js";

const GATE_WINDOW_METERS = 30;   // een poort telt alleen als je er binnen 30 m vandaan was (geen sprongen)
const HALF_LAP = 0.5;            // t boven de helft = "net voor de lijn" (zonder controlepunt)

// Verschil in t omzetten naar het bereik [-0.5, 0.5), zodat 0.99 -> 0.01 een stap van +0.02 is.
function wrapHalf(delta) {
  return delta - Math.floor(delta + HALF_LAP);
}

export class RaceManager {
  constructor(track) {
    this.track = track;
    this.riders = new Map();
    this.listeners = [];
    this.order = [];
    this.windowT = GATE_WINDOW_METERS / track.length;
    this.checkpoints = this.placeCheckpoints();
    this.reset();
  }

  // Controlepunten gelijk verdeeld over het deel van de ronde dat de shortcut NIET overslaat.
  placeCheckpoints() {
    const [begin, end] = this.track.sampleShortcutFrames(2);
    const tA = this.track.getNearest(begin.position.x, begin.position.z).t;
    const tB = this.track.getNearest(end.position.x, end.position.z).t;
    const restLength = 1 - wrapFull(tB - tA);   // deel van de ronde buiten tA..tB
    const count = CONFIG.race.checkpointCount;
    const points = [];
    for (let k = 0; k < count; k++) {
      points.push(wrapFull(tB + (restLength * (k + 0.5)) / count));
    }
    // Rondevolgorde = oplopende t vanaf de lijn (t = 0), ook als het stuk over de lijn heen loopt.
    return points.sort((a, b) => a - b);
  }

  addRider(id, bike) {
    const rider = { id, bike };
    this.riders.set(id, rider);
    this.resetRider(rider);
    this.updateOrder();
  }

  onEvent(listener) {
    this.listeners.push(listener);
  }
  emit(event) {
    for (const listener of this.listeners) listener(event);
  }

  reset() {
    this.state = "countdown";
    this.countdownLeft = CONFIG.race.countdownSeconds;
    this.lastAnnounced = CONFIG.race.countdownSeconds + 1;   // laatste gemelde tel, zodat elke tel maar één keer komt
    this.raceTime = 0;
    this.finishedCount = 0;
    for (const rider of this.riders.values()) this.resetRider(rider);
  }

  resetRider(rider) {
    Object.assign(rider, {
      lastT: this.currentT(rider),
      armed: false,           // al één keer over de lijn na GO?
      gates: 0,               // aantal geteld passeerde poorten (voor de positie)
      nextCheckpoint: 0,      // index van het volgende controlepunt in deze ronde
      lap: 1,
      lapStart: 0,
      lapTimes: [],
      finished: false,
      totalTime: null,
      finishPlace: null,
    });
  }

  start() {
    this.reset();
    this.announceCountdown();
    this.updateOrder();
  }

  canMove() {
    return this.state !== "countdown";
  }

  update(dt) {
    if (this.state === "countdown") this.updateCountdown(dt);
    else if (this.state === "racing") this.updateRacing(dt);
  }

  updateCountdown(dt) {
    this.countdownLeft -= dt;
    // start() kan voor het plaatsen zijn aangeroepen: t blijft actueel.
    for (const rider of this.riders.values()) rider.lastT = this.currentT(rider);
    if (this.countdownLeft > 0) {
      this.announceCountdown();
      return;
    }
    this.state = "racing";
    this.raceTime = -this.countdownLeft;   // tijd na GO die in deze stap al verstreken is
    this.countdownLeft = 0;
    this.emit({ type: "countdown", value: "GO" });
  }

  // Meldt de tel(len) die nog niet gemeld zijn. Ceil: 2.4 s over = "3 seconden aftellen" nog bezig.
  announceCountdown() {
    const shown = Math.ceil(this.countdownLeft);
    while (this.lastAnnounced > shown) {
      this.lastAnnounced--;
      this.emit({ type: "countdown", value: this.lastAnnounced });
    }
  }

  updateRacing(dt) {
    this.raceTime += dt;
    for (const rider of this.riders.values()) {
      if (!rider.finished) this.updateRider(rider);   // wie gefinisht is, telt niet meer mee
    }
    this.updateOrder();
    if (this.finishedCount === this.riders.size) this.endRace();
  }

  updateRider(rider) {
    const prevT = rider.lastT;
    const t = this.currentT(rider);
    rider.lastT = t;
    if (!rider.armed) {
      if (crossed(prevT, t, 0, this.windowT)) this.armRider(rider);
    } else if (rider.nextCheckpoint < this.checkpoints.length) {
      if (crossed(prevT, t, this.checkpoints[rider.nextCheckpoint], this.windowT)) this.passCheckpoint(rider);
    } else if (crossed(prevT, t, 0, this.windowT)) {
      this.completeLap(rider);
    }
  }

  currentT(rider) {
    return this.track.getNearest(rider.bike.position.x, rider.bike.position.z).t;
  }

  // ---------- Poorten en ronden ----------

  armRider(rider) {
    rider.armed = true;
    rider.gates++;
  }

  passCheckpoint(rider) {
    rider.nextCheckpoint++;
    rider.gates++;
  }

  completeLap(rider) {
    const lapTime = this.raceTime - rider.lapStart;
    rider.lapTimes.push(lapTime);
    rider.lapStart = this.raceTime;
    rider.nextCheckpoint = 0;
    rider.gates++;
    if (rider.lap >= CONFIG.race.laps) {
      this.finishRider(rider);
      return;
    }
    rider.lap++;
    this.emit({ type: "lap", id: rider.id, lap: rider.lap, lapTime });
    if (rider.lap === CONFIG.race.laps) this.emit({ type: "finalLap", id: rider.id });
  }

  finishRider(rider) {
    rider.finished = true;
    rider.totalTime = this.raceTime;
    rider.finishPlace = ++this.finishedCount;
    this.updateOrder();
    this.emit({ type: "finish", id: rider.id, position: rider.finishPlace, totalTime: rider.totalTime });
  }

  endRace() {
    this.state = "finished";
    this.emit({ type: "raceEnd" });
  }

  // ---------- Posities ----------

  // Gefinisht: op finishplaats. Anders: meer poorten = voor, bij gelijkstand de t in de ronde.
  updateOrder() {
    const riders = [...this.riders.values()];
    riders.sort((a, b) => this.compareRiders(a, b));
    this.order = riders.map((rider) => rider.id);
  }

  compareRiders(a, b) {
    if (a.finished || b.finished) {
      return (a.finished ? a.finishPlace : Infinity) - (b.finished ? b.finishPlace : Infinity);
    }
    if (a.gates !== b.gates) return b.gates - a.gates;
    return this.progressInLap(b) - this.progressInLap(a);
  }

  // Net voor de lijn (nog geen controlepunt gehad) telt t als negatief: 0.99 -> -0.01.
  progressInLap(rider) {
    return rider.nextCheckpoint === 0 && rider.lastT > HALF_LAP ? rider.lastT - 1 : rider.lastT;
  }

  getStandings() {
    return [...this.order];
  }

  getRider(id) {
    const rider = this.riders.get(id);
    const lapTimes = [...rider.lapTimes];
    return {
      lap: rider.lap,
      lapTimes,
      currentLapTime: rider.finished || this.state === "countdown" ? 0 : this.raceTime - rider.lapStart,
      bestLap: lapTimes.length ? Math.min(...lapTimes) : null,
      totalTime: rider.totalTime,
      finished: rider.finished,
      position: this.order.indexOf(id) + 1,
    };
  }
}

// t terugbrengen naar [0, 1).
function wrapFull(t) {
  return t - Math.floor(t);
}

// Ging de rijder net vooruit door poort gateT? wrapHalf maakt de oversteek 0.99 -> 0.01 gewoon
// een kleine stap. Het venster zorgt dat een teleport (grote sprong in t) nooit als passage telt.
function crossed(prevT, t, gateT, windowT) {
  const before = wrapHalf(prevT - gateT);
  const after = wrapHalf(t - gateT);
  return before < 0 && after >= 0 && before >= -windowT && after <= windowT;
}

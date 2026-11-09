// Eén race van begin tot eind: speler + 5 computer-rijders, aftellen, ronden, finish.
// main.js maakt een RaceSession bij elke start en gooit ze weg bij "terug naar menu".
// Hier zit alleen het samenspel; de echte logica zit in RaceManager, AIDriver en Bike.

import { CONFIG } from "../config.js";
import { BIKE_TYPES } from "../bikes/bikeTypes.js";
import { OPPONENTS } from "../race/opponents.js";
import { RaceManager } from "../race/RaceManager.js";
import { AIDriver } from "../race/AIDriver.js";
import { createAbility } from "../bikes/abilities.js";
import { resolveCollisions } from "../bikes/collisions.js";
import { Rider } from "./Rider.js";
import { headingFromTangent } from "../world/Track.js";

// Meter naast de middenlijn waarna je automatisch teruggezet wordt.
const MAX_OFF_TRACK = 45;

// Naam van de speciale knop zoals de speler hem ziet.
const ABILITY_NAMES = { turbo: "Turbo", offroad: "Offroad-boost", shove: "Zijduw" };

// Geen gas, geen sturen: tijdens het aftellen staat iedereen stil.
const NO_CONTROLS = { throttle: 0, brake: 0, steer: 0, action: false, reset: false };

// Startplekken: de speler start achteraan in het midden (plek 4), zoals in een arcade-racer.
// De tegenstanders vullen de andere plekken, de sterkste vooraan.
const PLAYER_SLOT = 4;
const AI_SLOTS = [0, 1, 2, 3, 5];

export class RaceSession {
  constructor({ track, scene, materials, gantry, raceUI, hud, minimap, effects, playerTypeKey }) {
    Object.assign(this, { track, scene, materials, gantry, raceUI, hud, minimap, effects });
    this.playerControls = NO_CONTROLS;
    this.race = new RaceManager(track);
    this.riders = []; // { id, name, rider, ai } - ai is null voor de speler

    this.addPlayer(playerTypeKey);
    this.addOpponents();

    // Lijst voor de minimap: wordt bij elk beeld hergebruikt, zodat er niets nieuws gemaakt wordt.
    this.mapRiders = this.riders.map((r) => ({ color: r.color, x: 0, z: 0, heading: 0, isPlayer: r.id === "player" }));

    this.race.onEvent((e) => this.onRaceEvent(e));
    this.standingsTimer = 0;
  }

  get player() {
    return this.riders[0].rider;
  }

  addPlayer(typeKey) {
    const type = BIKE_TYPES[typeKey];
    const rider = this.makeRider(typeKey, type.color, PLAYER_SLOT);
    this.register({ id: "player", name: "Jij", color: type.color, rider, ai: null });
  }

  // Voeg een rijder toe aan onze lijst én aan de race.
  register(entry) {
    // Elke rijder krijgt zijn eigen speciale knop (turbo, offroad-boost of zijduw).
    entry.ability = createAbility(entry.rider.bike);
    entry.ability.onUse = (info) => this.onAbilityUsed(entry, info);
    this.riders.push(entry);
    this.race.addRider(entry.id, entry.rider.bike);
  }

  // Wordt de speler opzij geduwd door een cruiser? Laat het hem weten.
  onAbilityUsed(entry, info) {
    const playerHit = info.target === this.player.bike;
    this.effects.onAbility({ byPlayer: entry.id === "player", kind: info.kind, playerHit });
    if (playerHit) this.hud.flashHit(`${entry.name}: zijduw!`);
    else if (entry.id === "player" && info.target) this.hud.flashHit("Raak!");
  }

  addOpponents() {
    // Sterkste rijder vooraan op de grid.
    const sorted = [...OPPONENTS].sort((a, b) => b.skill - a.skill);
    sorted.forEach((o, i) => {
      const rider = this.makeRider(o.typeKey, o.color, AI_SLOTS[i]);
      const ai = new AIDriver({
        track: this.track, bike: rider.bike, skill: o.skill, line: o.line, useShortcut: o.useShortcut,
      });
      this.register({ id: o.name, name: o.name, color: o.color, rider, ai });
    });
  }

  makeRider(typeKey, color, slot) {
    const rider = new Rider({
      typeKey, type: BIKE_TYPES[typeKey], color,
      track: this.track, materials: this.materials, scene: this.scene,
    });
    rider.placeAt(this.track.getStartTransform(slot));
    return rider;
  }

  start() {
    this.raceUI.hideFinish();
    this.raceUI.setVisible(true);
    this.hud.setVisible(true);
    this.minimap.setVisible(true);
    this.race.start();
  }

  // Elke fysica-stap, in deze volgorde:
  // 1. besturing kiezen, 2. speciale knop, 3. moto bewegen, 4. botsingen oplossen, 5. race tellen.
  update(dt, playerControls) {
    const canMove = this.race.canMove();
    this.playerControls = canMove ? playerControls : NO_CONTROLS; // voor het motorgeluid
    const bikes = this.riders.map((r) => r.rider.bike);
    for (const r of this.riders) {
      const bike = r.rider.bike;
      const others = bikes.filter((b) => b !== bike);
      const controls = canMove ? this.controlsFor(r, playerControls, others) : NO_CONTROLS;
      // Tijdens het aftellen slaan we de knop over. Anders lijkt een spatie die nog vastzit
      // van het menu "losgelaten" en vuurt hij bij GO meteen af.
      if (canMove) r.ability.update(dt, controls.action, others);
      bike.update(dt, controls);
    }
    if (canMove) resolveCollisions(bikes);
    this.keepNearTrack();
    this.race.update(dt);
  }

  // Wie te ver van de baan rijdt (en niet op de shortcut zit), komt automatisch terug.
  // Zo kan niemand de rand van de wereld bereiken of verdwalen in het gras.
  keepNearTrack() {
    for (const r of this.riders) {
      const bike = r.rider.bike;
      const near = this.track.getNearest(bike.position.x, bike.position.z);
      const onShortcut = bike.surface === "dirt";
      if (Math.abs(near.lateral) < MAX_OFF_TRACK || onShortcut) continue;
      bike.resetTo({ position: near.position.clone(), heading: headingFromTangent(near.tangent.x, near.tangent.z) });
      if (r.id === "player") this.raceUI.flash("Terug op de baan");
    }
  }

  // Wie stuurt deze moto? De computer, de speler, of (na de finish) de autopiloot.
  controlsFor(r, playerControls, others) {
    if (r.ai) return r.ai.getControls(others);
    if (!this.race.getRider(r.id).finished) return playerControls;
    return this.autopilot().getControls(others);
  }

  // Na de finish neemt een computer-bestuurder het stuur van de speler over.
  autopilot() {
    if (!this.playerAutopilot) {
      this.playerAutopilot = new AIDriver({
        track: this.track, bike: this.player.bike, skill: 0.8, line: 0, useShortcut: false,
      });
    }
    return this.playerAutopilot;
  }

  // Elk beeld: modellen volgen de fysica, interface bijwerken.
  render(dt) {
    for (const r of this.riders) {
      r.rider.syncModel(dt);
      r.rider.showFlame(r.ability.state.active && r.ability.state.kind === "turbo");
    }
    this.updateAbilityMeter();
    const me = this.race.getRider("player");
    const s = this.riders[0].ability.state;
    this.effects.frame({
      riders: this.riders.map((r) => r.rider.bike), playerBike: this.player.bike,
      playerControls: this.playerControls, boosting: s.active && s.kind === "turbo",
      playerFinished: me.finished,
    });
    this.updateMinimap();
    this.hud.setSpeed(this.player.bike.speed * 3.6); // m/s naar km/u
    this.hud.setSurface(this.player.bike.surface);
    this.raceUI.setLap(Math.min(me.lap, CONFIG.race.laps), CONFIG.race.laps);
    this.raceUI.setTimes(me.currentLapTime, me.bestLap);
    this.raceUI.setPosition(me.position, this.riders.length);
    // Startlampen gaan 2 seconden na GO weer uit.
    if (this.race.state !== "countdown" && this.race.raceTime > 2) this.gantry.userData.setLights(0);
    // Klassement op het finish-scherm 2 keer per seconde bijwerken (anderen komen nog binnen).
    if (me.finished && (this.standingsTimer -= dt) <= 0) {
      this.standingsTimer = 0.5;
      this.raceUI.updateStandings(this.buildStandings());
    }
  }

  // Zet de plek en richting van elke rijder in de hergebruikte minimap-lijst.
  updateMinimap() {
    for (let i = 0; i < this.riders.length; i++) {
      const bike = this.riders[i].rider.bike;
      const m = this.mapRiders[i];
      m.x = bike.position.x;
      m.z = bike.position.z;
      m.heading = bike.heading;
    }
    this.minimap.update(this.mapRiders);
  }

  // Meter van de speciale knop: hoeveel van de afkoeltijd is voorbij (0..1)?
  updateAbilityMeter() {
    const s = this.riders[0].ability.state;
    const fraction = s.cooldownTotal > 0 ? 1 - s.cooldownLeft / s.cooldownTotal : 1;
    this.hud.setAbility({ name: ABILITY_NAMES[s.kind], ready: s.ready, active: s.active, fraction });
  }

  // Lijst voor het finish-scherm, eerste plaats eerst.
  buildStandings() {
    return this.race.getStandings().map((id) => {
      const r = this.riders.find((x) => x.id === id);
      const state = this.race.getRider(id);
      return {
        name: r.name, bikeLabel: r.rider.bike.type.label, color: r.color,
        time: state.totalTime, isPlayer: id === "player",
      };
    });
  }

  onRaceEvent(e) {
    const ui = this.raceUI;
    if (e.type === "countdown") {
      ui.showCountdown(e.value);
      this.effects.onCountdown(e.value);
      // Startlampen: 3 = één rood, 2 = twee rood, 1 = drie rood, GO = alle groen.
      if (e.value === "GO") this.gantry.userData.setLights(3, 0x22ff55);
      else this.gantry.userData.setLights(4 - e.value, 0xff2222);
    }
    if (e.id !== "player") return;
    if (e.type === "finalLap") ui.flash("Laatste ronde!");
    else if (e.type === "lap" && e.lap < CONFIG.race.laps) ui.flash(`Ronde ${e.lap}`);
    else if (e.type === "finish") {
      const me = this.race.getRider("player");
      this.effects.onPlayerFinish(e.position);
      ui.showFinish({
        position: e.position, total: this.riders.length, totalTime: e.totalTime,
        lapTimes: me.lapTimes, bestLap: me.bestLap, bikeLabel: this.player.bike.type.label,
        standings: this.buildStandings(),
      });
    }
  }

  isPlayerFinished() {
    return this.race.getRider("player").finished;
  }

  dispose() {
    for (const r of this.riders) r.rider.remove();
    this.gantry.userData.setLights(0);
    this.effects.stop();
  }
}

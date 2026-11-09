// Eén race van begin tot eind: speler + 5 computer-rijders, aftellen, ronden, finish.
// main.js maakt een RaceSession bij elke start en gooit ze weg bij "terug naar menu".
// Hier zit alleen het samenspel; de echte logica zit in RaceManager, AIDriver en Bike.

import { CONFIG } from "../config.js";
import { BIKE_TYPES } from "../bikes/bikeTypes.js";
import { OPPONENTS } from "../race/opponents.js";
import { RaceManager } from "../race/RaceManager.js";
import { AIDriver } from "../race/AIDriver.js";
import { Rider } from "./Rider.js";

// Geen gas, geen sturen: tijdens het aftellen staat iedereen stil.
const NO_CONTROLS = { throttle: 0, brake: 0, steer: 0, action: false, reset: false };

// Startplekken: de speler start achteraan in het midden (plek 4), zoals in een arcade-racer.
// De tegenstanders vullen de andere plekken, de sterkste vooraan.
const PLAYER_SLOT = 4;
const AI_SLOTS = [0, 1, 2, 3, 5];

export class RaceSession {
  constructor({ track, scene, materials, gantry, raceUI, hud, playerTypeKey }) {
    Object.assign(this, { track, scene, materials, gantry, raceUI, hud });
    this.race = new RaceManager(track);
    this.riders = []; // { id, name, rider, ai } - ai is null voor de speler

    this.addPlayer(playerTypeKey);
    this.addOpponents();

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
    this.riders.push(entry);
    this.race.addRider(entry.id, entry.rider.bike);
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
    this.race.start();
  }

  // Elke fysica-stap: iedereen krijgt zijn besturing, daarna telt de race.
  update(dt, playerControls) {
    const canMove = this.race.canMove();
    for (const r of this.riders) {
      const done = this.race.getRider(r.id).finished;
      let controls = NO_CONTROLS;
      if (canMove && r.ai) controls = r.ai.getControls();
      else if (canMove && !done) controls = playerControls;
      else if (canMove && done) controls = this.autopilot().getControls(); // speler na de finish
      r.rider.bike.update(dt, controls);
    }
    this.race.update(dt);
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
    for (const r of this.riders) r.rider.syncModel(dt);
    const me = this.race.getRider("player");
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
      // Startlampen: 3 = één rood, 2 = twee rood, 1 = drie rood, GO = alle groen.
      if (e.value === "GO") this.gantry.userData.setLights(3, 0x22ff55);
      else this.gantry.userData.setLights(4 - e.value, 0xff2222);
    }
    if (e.id !== "player") return;
    if (e.type === "finalLap") ui.flash("Laatste ronde!");
    else if (e.type === "lap" && e.lap < CONFIG.race.laps) ui.flash(`Ronde ${e.lap}`);
    else if (e.type === "finish") {
      const me = this.race.getRider("player");
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
  }
}

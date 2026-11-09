// Startpunt van de game: hier komen alle onderdelen samen.
// Fase 3: keuzemenu, aftellen met startlampen, 3 ronden, finish-scherm, opnieuw.
// Elk onderdeel komt van een andere specialist en volgt de contracten in docs/contracts/.

import * as THREE from "three";
import { CONFIG } from "./config.js";
import { TRACK } from "./world/trackData.js";
import { BIKE_TYPES } from "./bikes/bikeTypes.js";
import { Track } from "./world/Track.js";
import { buildTrackMesh } from "./world/trackMesh.js";
import { createProps } from "./world/props.js";
import { createStartGantry } from "./world/startGantry.js";
import { createEnvironment } from "./world/Environment.js";
import { createMaterials } from "./render/materials.js";
import { setupLighting } from "./render/lighting.js";
import { createInput } from "./core/Input.js";
import { startGameLoop } from "./core/GameLoop.js";
import { createFpsMeter } from "./core/Debug.js";
import { ChaseCamera } from "./camera/ChaseCamera.js";
import { RaceManager } from "./race/RaceManager.js";
import { Rider } from "./game/Rider.js";
import { createHUD } from "./ui/HUD.js";
import { showControlsHint } from "./ui/controlsHint.js";
import { createBikeMenu } from "./ui/BikeMenu.js";
import { createRaceUI } from "./ui/RaceUI.js";

// --- Renderer, scène en wereld -----------------------------------------
// Pixel ratio begrenzen op 1.5: scherp genoeg, veel sneller op retina-schermen.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fov, window.innerWidth / window.innerHeight, 0.1, 400
);

const materials = createMaterials();
const lights = setupLighting(scene, renderer);
createEnvironment(scene, materials);

const track = new Track(TRACK);
scene.add(buildTrackMesh(track, materials));
scene.add(createProps(track, materials));
const gantry = createStartGantry(track, materials);
scene.add(gantry);

// --- Speler ------------------------------------------------------------
let player = null;
let race = null;

// Maak een nieuwe speler-moto van dit type op startplek 1 (midden voorste rij).
function spawnPlayer(typeKey) {
  if (player) player.remove();
  const type = BIKE_TYPES[typeKey];
  player = new Rider({ typeKey, type, color: type.color, track, materials, scene });
  player.placeAt(track.getStartTransform(1));
}

// --- Camera's ----------------------------------------------------------
const chase = new ChaseCamera(camera);

// In het menu draait de camera langzaam rond de gekozen moto.
let orbitAngle = 0;
function updateMenuCamera(dt) {
  orbitAngle += dt * 0.35;
  const p = player.model.position;
  camera.position.set(p.x + Math.sin(orbitAngle) * 5, 1.5, p.z + Math.cos(orbitAngle) * 5);
  // We kijken net ONDER de moto: zo staat ze hoger in beeld, boven de menukaarten.
  camera.lookAt(p.x, -0.2, p.z);
}

// --- Interface ---------------------------------------------------------
const input = createInput();
const hud = createHUD();
const fps = createFpsMeter();
const raceUI = createRaceUI({
  onRestart: () => startRace(player.typeKey),
  onMenu: () => openMenu(),
});
const menu = createBikeMenu({
  bikeTypes: BIKE_TYPES,
  onHover: (key) => spawnPlayer(key),   // laat de moto zien die je bekijkt
  onChoose: (key) => startRace(key),
});

function openMenu() {
  race = null;
  gantry.userData.setLights(0);
  spawnPlayer(player ? player.typeKey : "sport");
  hud.setVisible(false);
  raceUI.hideFinish();
  raceUI.setVisible(false);
  menu.show(player.typeKey);
}

// --- Race --------------------------------------------------------------
function startRace(typeKey) {
  spawnPlayer(typeKey);
  chase.snapTo(player.bike);
  race = new RaceManager(track);
  race.addRider("player", player.bike);
  race.onEvent(onRaceEvent);
  raceUI.hideFinish();
  raceUI.setVisible(true);
  raceUI.setPosition(1, 1);
  hud.setVisible(true);
  showControlsHint();
  race.start();
}

// Wat er gebeurt bij elke race-gebeurtenis (zie contract 06-B).
function onRaceEvent(e) {
  if (e.type === "countdown") {
    raceUI.showCountdown(e.value);
    // Startlampen: 3 = één rood, 2 = twee rood, 1 = drie rood, GO = alle groen.
    if (e.value === "GO") gantry.userData.setLights(3, 0x22ff55);
    else gantry.userData.setLights(4 - e.value, 0xff2222);
  } else if (e.type === "finalLap" && e.id === "player") {
    raceUI.flash("Laatste ronde!");
  } else if (e.type === "lap" && e.id === "player" && e.lap < CONFIG.race.laps) {
    raceUI.flash(`Ronde ${e.lap}`);
  } else if (e.type === "finish" && e.id === "player") {
    const r = race.getRider("player");
    raceUI.showFinish({
      position: e.position, total: race.getStandings().length, totalTime: e.totalTime,
      lapTimes: r.lapTimes, bestLap: r.bestLap, bikeLabel: player.bike.type.label,
    });
  }
}

// Lampen gaan 2 seconden na GO weer uit.
function updateGantry() {
  if (race && race.state !== "countdown" && race.raceTime > 2) gantry.userData.setLights(0);
}

// Esc tijdens het rijden = terug naar het menu (het finish-scherm regelt zijn eigen Esc).
window.addEventListener("keydown", (e) => {
  const finishOpen = race && race.getRider("player").finished;
  if (e.code === "Escape" && !menu.isOpen() && !finishOpen) openMenu();
});

openMenu();

// Alleen bij ?debug: maak de game bereikbaar vanuit de browserconsole (voor testen).
if (new URLSearchParams(location.search).has("debug")) {
  window.__game = { track, get bike() { return player.bike; }, get race() { return race; }, startRace };
}

// --- Hoofdlus ----------------------------------------------------------
// Tijdens het aftellen en na de finish negeert de moto de toetsen (geen gas, geen sturen).
const NO_CONTROLS = { throttle: 0, brake: 0, steer: 0, action: false, reset: false };

startGameLoop({
  // Vaste stap: 60 keer per seconde, los van de beeldsnelheid.
  update(dt) {
    if (!race) return; // menu open: alles staat stil
    const r = race.getRider("player");
    const controls = race.canMove() && !r.finished ? input.read() : NO_CONTROLS;
    player.bike.update(dt, controls);
    race.update(dt);
  },
  // Eén keer per getekend beeld.
  render(dt) {
    player.syncModel(dt);
    if (race) {
      chase.update(dt, player.bike);
      const r = race.getRider("player");
      hud.setSpeed(player.bike.speed * 3.6); // m/s naar km/u
      hud.setSurface(player.bike.surface);
      raceUI.setLap(Math.min(r.lap, CONFIG.race.laps), CONFIG.race.laps);
      raceUI.setTimes(r.currentLapTime, r.bestLap);
      updateGantry();
    } else {
      updateMenuCamera(dt);
    }
    lights.follow(player.bike.position);
    renderer.render(scene, camera);
    fps.tick();
  },
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

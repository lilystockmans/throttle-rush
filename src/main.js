// Startpunt van de game: hier komen alle onderdelen samen.
// Fase 2: keuzemenu met drie motortypes, daarna rijden. Esc = terug naar het menu.
// Elk onderdeel komt van een andere specialist en volgt de contracten in docs/contracts/.

import * as THREE from "three";
import { CONFIG } from "./config.js";
import { TRACK } from "./world/trackData.js";
import { BIKE_TYPES } from "./bikes/bikeTypes.js";
import { Track } from "./world/Track.js";
import { Bike } from "./bikes/Bike.js";
import { createBikeModel } from "./bikes/BikeModel.js";
import { buildTrackMesh } from "./world/trackMesh.js";
import { createProps } from "./world/props.js";
import { createEnvironment } from "./world/Environment.js";
import { createMaterials } from "./render/materials.js";
import { setupLighting } from "./render/lighting.js";
import { createInput } from "./core/Input.js";
import { startGameLoop } from "./core/GameLoop.js";
import { createFpsMeter } from "./core/Debug.js";
import { ChaseCamera } from "./camera/ChaseCamera.js";
import { createHUD } from "./ui/HUD.js";
import { showControlsHint } from "./ui/controlsHint.js";
import { createBikeMenu } from "./ui/BikeMenu.js";

// --- Renderer en scène -------------------------------------------------
// Pixel ratio begrenzen op 1.5: scherp genoeg, veel sneller op retina-schermen.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fov, window.innerWidth / window.innerHeight, 0.1, 400
);

// --- Wereld ------------------------------------------------------------
const materials = createMaterials();
const lights = setupLighting(scene, renderer);
createEnvironment(scene, materials);

const track = new Track(TRACK);
scene.add(buildTrackMesh(track, materials));
scene.add(createProps(track, materials));

// --- Speler ------------------------------------------------------------
// "player" bundelt de fysica-moto (Bike) en het 3D-model dat haar volgt.
let player = null;

// Maak een nieuwe speler-moto van dit type op startplek 1 (midden voorste rij).
function spawnPlayer(typeKey) {
  if (player) scene.remove(player.model);
  const type = BIKE_TYPES[typeKey];
  const bike = new Bike(type, track);
  bike.resetTo(track.getStartTransform(1));
  const model = createBikeModel({ type: typeKey, color: type.color, materials });
  scene.add(model);
  player = {
    typeKey, bike, model,
    leanPivot: model.getObjectByName("leanPivot"),
    wheelFront: model.getObjectByName("wheelFront"),
    wheelBack: model.getObjectByName("wheelBack"),
  };
  syncModel(0);
}

// Zet het 3D-model op de plek van de fysica-moto.
// De fysica (Bike) rekent, het model (BikeModel) volgt alleen.
function syncModel(dt) {
  const { bike, model } = player;
  model.position.copy(bike.position);
  model.rotation.y = bike.heading;
  player.leanPivot.rotation.z = bike.lean;
  // Wielen draaien: afgelegde afstand / straal = hoek. Negatief = vooruit rollen naar -Z.
  const spin = (bike.speed * dt) / model.userData.wheelRadius;
  player.wheelFront.rotation.x -= spin;
  player.wheelBack.rotation.x -= spin;
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

const menu = createBikeMenu({
  bikeTypes: BIKE_TYPES,
  onHover: (key) => spawnPlayer(key),   // laat de moto zien die je bekijkt
  onChoose: (key) => startRiding(key),
});

function openMenu() {
  spawnPlayer(player ? player.typeKey : "sport");
  hud.setVisible(false);
  menu.show(player.typeKey);
}

function startRiding(typeKey) {
  spawnPlayer(typeKey);
  chase.snapTo(player.bike);
  hud.setVisible(true);
  showControlsHint();
}

// Esc tijdens het rijden = terug naar het menu.
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape" && !menu.isOpen()) openMenu();
});

openMenu();

// Alleen bij ?debug: maak de game bereikbaar vanuit de browserconsole (voor testen).
if (new URLSearchParams(location.search).has("debug")) {
  window.__game = { track, get bike() { return player.bike; }, startRiding };
}

// --- Hoofdlus ----------------------------------------------------------
startGameLoop({
  // Vaste stap: 60 keer per seconde, los van de beeldsnelheid.
  // Zolang het menu open is, staat de moto stil en negeren we de toetsen.
  update(dt) {
    if (!menu.isOpen()) player.bike.update(dt, input.read());
  },
  // Eén keer per getekend beeld.
  render(dt) {
    syncModel(dt);
    if (menu.isOpen()) {
      updateMenuCamera(dt);
    } else {
      chase.update(dt, player.bike);
      hud.setSpeed(player.bike.speed * 3.6); // m/s naar km/u
      hud.setSurface(player.bike.surface);
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

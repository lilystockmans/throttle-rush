// Startpunt van de game: hier komen alle onderdelen samen.
// Fase 4: keuzemenu, daarna een race tegen 5 computer-rijders (zie game/RaceSession.js).
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
import { Rider } from "./game/Rider.js";
import { RaceSession } from "./game/RaceSession.js";
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

// --- Interface ---------------------------------------------------------
const input = createInput();
const hud = createHUD();
const fps = createFpsMeter();
const chase = new ChaseCamera(camera);
const raceUI = createRaceUI({
  onRestart: () => startRace(lastTypeKey),
  onMenu: () => openMenu(),
});
const menu = createBikeMenu({
  bikeTypes: BIKE_TYPES,
  onHover: (key) => showPreview(key),
  onChoose: (key) => startRace(key),
});

// --- Menu: één moto draait in beeld ------------------------------------
let session = null;      // de lopende race, of null in het menu
let preview = null;      // de moto die in het menu ronddraait
let lastTypeKey = "sport";
let orbitAngle = 0;

function showPreview(typeKey) {
  if (preview) preview.remove();
  const type = BIKE_TYPES[typeKey];
  preview = new Rider({ typeKey, type, color: type.color, track, materials, scene });
  preview.placeAt(track.getStartTransform(1));
}

function openMenu() {
  if (session) session.dispose();
  session = null;
  showPreview(lastTypeKey);
  hud.setVisible(false);
  raceUI.hideFinish();
  raceUI.setVisible(false);
  menu.show(lastTypeKey);
}

// In het menu draait de camera langzaam rond de moto.
function updateMenuCamera(dt) {
  orbitAngle += dt * 0.35;
  const p = preview.model.position;
  camera.position.set(p.x + Math.sin(orbitAngle) * 5, 1.5, p.z + Math.cos(orbitAngle) * 5);
  // We kijken net ONDER de moto: zo staat ze hoger in beeld, boven de menukaarten.
  camera.lookAt(p.x, -0.2, p.z);
}

// --- Race ----------------------------------------------------------------
function startRace(typeKey) {
  lastTypeKey = typeKey;
  if (menu.isOpen()) menu.hide();
  if (preview) preview.remove();
  preview = null;
  if (session) session.dispose();
  session = new RaceSession({ track, scene, materials, gantry, raceUI, hud, playerTypeKey: typeKey });
  chase.snapTo(session.player.bike);
  showControlsHint();
  session.start();
}

// Esc tijdens het rijden = terug naar het menu (het finish-scherm regelt zijn eigen Esc).
window.addEventListener("keydown", (e) => {
  if (e.code === "Escape" && session && !session.isPlayerFinished()) openMenu();
});

openMenu();

// Alleen bij ?debug: maak de game bereikbaar vanuit de browserconsole (voor testen).
if (new URLSearchParams(location.search).has("debug")) {
  window.__game = { track, get session() { return session; }, startRace };
}

// --- Hoofdlus ----------------------------------------------------------
startGameLoop({
  // Vaste stap: 60 keer per seconde, los van de beeldsnelheid.
  update(dt) {
    if (session) session.update(dt, input.read());
  },
  // Eén keer per getekend beeld.
  render(dt) {
    if (session) {
      session.render(dt);
      chase.update(dt, session.player.bike);
      lights.follow(session.player.bike.position);
    } else {
      preview.syncModel(dt);
      updateMenuCamera(dt);
      lights.follow(preview.bike.position);
    }
    renderer.render(scene, camera);
    fps.tick();
  },
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

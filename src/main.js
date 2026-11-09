// Startpunt van de game: hier komen alle onderdelen samen.
// Fase 1: één circuit, één sport-moto, chase-camera, snelheidsmeter.
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
const bikeType = BIKE_TYPES.sport;
const bike = new Bike(bikeType, track);
bike.resetTo(track.getStartTransform(0));

const model = createBikeModel({ type: "sport", color: bikeType.color, materials });
const leanPivot = model.getObjectByName("leanPivot");
const wheelFront = model.getObjectByName("wheelFront");
const wheelBack = model.getObjectByName("wheelBack");
scene.add(model);

const chase = new ChaseCamera(camera);
chase.snapTo(bike);

// --- Interface ---------------------------------------------------------
const input = createInput();
const hud = createHUD();
const fps = createFpsMeter();
showControlsHint();

// Alleen bij ?debug: maak de moto en het circuit bereikbaar vanuit de browserconsole (voor testen).
if (new URLSearchParams(location.search).has("debug")) window.__game = { bike, track };

// Zet het 3D-model op de plek van de fysica-moto.
// De fysica (Bike) rekent, het model (BikeModel) volgt alleen.
function syncModel(dt) {
  model.position.copy(bike.position);
  model.rotation.y = bike.heading;
  leanPivot.rotation.z = bike.lean;
  // Wielen draaien: afgelegde afstand / straal = hoek. Negatief = vooruit rollen naar -Z.
  const spin = (bike.speed * dt) / model.userData.wheelRadius;
  wheelFront.rotation.x -= spin;
  wheelBack.rotation.x -= spin;
}

// --- Hoofdlus ----------------------------------------------------------
startGameLoop({
  // Vaste stap: 60 keer per seconde, los van de beeldsnelheid.
  update(dt) {
    bike.update(dt, input.read());
  },
  // Eén keer per getekend beeld.
  render(dt) {
    syncModel(dt);
    chase.update(dt, bike);
    lights.follow(bike.position);
    hud.setSpeed(bike.speed * 3.6); // m/s naar km/u
    hud.setSurface(bike.surface);
    renderer.render(scene, camera);
    fps.tick();
  },
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

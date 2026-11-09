// Startportaal over het asfalt op de start/finish-lijn: twee poten naast de berm,
// een dwarsbalk met geblokt spandoek en drie ronde startlampen die naar de rijders kijken.
// createStartGantry(track, materials) geeft een Group; userData.setLights(count, color) schakelt de lampen.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const LEG_SIZE = 0.8;          // dikte van een poot
const LEG_GAP = 1.2;           // afstand van buitenrand berm tot hart van de poot
const BEAM_BOTTOM = 5.6;       // onderkant dwarsbalk (eis: minstens 5 m)
const BEAM_HEIGHT = 1.4;
const BEAM_DEPTH = 0.8;
const BAND_HEIGHT = 0.4;       // gekleurde band bovenop de balk
const CHECK_ROWS = 2;
const CHECK_COLS = 28;
const HOUSING_W = 4.4;
const HOUSING_H = 1.8;
const HOUSING_D = 1.0;
const LAMP_RADIUS = 0.5;
const LAMP_DEPTH = 0.2;
const LAMP_SPACING = 1.4;
const LAMP_SEGMENTS = 14;
const COLOR_BEAM = 0x2a62e8;
const COLOR_FRAME = 0xe8323c;
const COLOR_LAMP_OFF = 0x222222;
const EMISSIVE_OFF = 0x000000;

function box(w, h, d, x, y, z) {
  return new THREE.BoxGeometry(w, h, d).translate(x, y, z);
}

// Eén vlakje van het schaakbord; front=true kijkt naar de rijders (+Z lokaal), anders van ze weg.
function cell(w, h, x, y, z, front) {
  const g = new THREE.PlaneGeometry(w, h);
  if (!front) g.rotateY(Math.PI);
  return g.translate(x, y, z);
}

function addMesh(group, geometries, material, name) {
  if (geometries.length === 0) return;
  const mesh = new THREE.Mesh(mergeGeometries(geometries), material);
  mesh.name = name;
  mesh.castShadow = true;
  group.add(mesh);
}

function buildLamps(group, materials) {
  const lamps = [];
  const lampY = BEAM_BOTTOM + BEAM_HEIGHT + BAND_HEIGHT + HOUSING_H / 2;
  for (let i = 0; i < 3; i++) {
    // cilinder-as langs +Y, gedraaid zodat de bovenkant (voorvlak) naar +Z kijkt = naar de rijders
    const geo = new THREE.CylinderGeometry(LAMP_RADIUS, LAMP_RADIUS, LAMP_DEPTH, LAMP_SEGMENTS);
    geo.rotateX(Math.PI / 2);
    const mesh = new THREE.Mesh(geo, materials.tire.clone());
    mesh.name = "startLamp" + i;
    mesh.position.set((i - 1) * LAMP_SPACING, lampY, HOUSING_D / 2 + LAMP_DEPTH / 2);
    mesh.castShadow = true;
    group.add(mesh);
    lamps.push(mesh);
  }
  return lamps;
}

export function createStartGantry(track, materials) {
  const group = new THREE.Group();
  group.name = "startGantry";

  const frame = track.sampleFrames(4)[0];
  const tangent = frame.tangent;
  // lokaal -Z = rijrichting, lokaal +X = rechts van de rijrichting
  group.position.copy(frame.position);
  group.rotation.y = Math.atan2(-tangent.x, -tangent.z);

  const legX = track.roadWidth / 2 + track.curbWidth + LEG_GAP;
  const spanW = legX * 2 + LEG_SIZE;
  const beamTop = BEAM_BOTTOM + BEAM_HEIGHT;
  const beamMidY = BEAM_BOTTOM + BEAM_HEIGHT / 2;

  const blue = [box(spanW, BEAM_HEIGHT, BEAM_DEPTH, 0, beamMidY, 0)];
  const red = [box(spanW, BAND_HEIGHT, BEAM_DEPTH + 0.1, 0, beamTop + BAND_HEIGHT / 2, 0)];
  const dark = [box(HOUSING_W, HOUSING_H, HOUSING_D, 0, beamTop + BAND_HEIGHT + HOUSING_H / 2, 0)];
  for (const side of [-1, 1]) {
    red.push(box(LEG_SIZE, beamTop, LEG_SIZE, side * legX, beamTop / 2, 0));
    dark.push(box(LEG_SIZE * 2, 0.3, LEG_SIZE * 2, side * legX, 0.15, 0));
  }

  // schaakbord op voor- en achterkant van de balk
  const white = [];
  const cw = spanW / CHECK_COLS;
  const ch = BEAM_HEIGHT / CHECK_ROWS;
  const zOff = BEAM_DEPTH / 2 + 0.01;
  for (let c = 0; c < CHECK_COLS; c++) {
    for (let r = 0; r < CHECK_ROWS; r++) {
      const x = -spanW / 2 + cw * (c + 0.5);
      const y = BEAM_BOTTOM + ch * (r + 0.5);
      const list = (c + r) % 2 === 0 ? white : dark;
      list.push(cell(cw, ch, x, y, zOff, true), cell(cw, ch, x, y, -zOff, false));
    }
  }

  addMesh(group, blue, materials.paint(COLOR_BEAM), "gantryBeam");
  addMesh(group, red, materials.paint(COLOR_FRAME), "gantryFrame");
  addMesh(group, white, materials.roadLine, "gantryCheckWhite");
  addMesh(group, dark, materials.tire, "gantryDark");

  const lamps = buildLamps(group, materials);
  const setLights = (count, color) => {
    lamps.forEach((lamp, i) => {
      const m = lamp.material;
      if (i < count) {
        m.color.set(color);
        m.emissive.set(color);
        m.emissiveIntensity = 1;
      } else {
        m.color.set(COLOR_LAMP_OFF);
        m.emissive.set(EMISSIVE_OFF);
      }
    });
  };
  setLights(0);

  group.userData.setLights = setLights;
  group.userData.lamps = lamps;
  return group;
}

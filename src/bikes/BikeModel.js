// Bouwt het 3D-model van een moto met rijder (contract 02-G).
// De vormen staan in bikeShapes.js, de bouwstenen in bikeParts.js.
// Per type bouwen we de geometrie maar EEN keer (cache); elke nieuwe moto
// krijgt alleen nieuwe meshes met de gedeelde geometrie en eigen kleur.
import * as THREE from "three";
import { SHAPE_BUILDERS } from "./bikeShapes.js";
import { createBoostFlame } from "./boostFlame.js";
import { mergeParts, buildWheelGeometries } from "./bikeParts.js";

// Slot in de geometrie -> sleutel in het materials-object. "paint" kleurt per moto.
const MATERIAL_BY_SLOT = {
  metal: "metal", seat: "seat", tire: "tire", riderSuit: "riderSuit",
  helmetVisor: "helmetVisor", spokes: "metal",
};

const geometryCache = {}; // type -> { body, tire, spokes, spec }

// Bouwt (of haalt uit de cache) alle geometrie van een type.
function getShared(type) {
  if (geometryCache[type]) return geometryCache[type];
  const builder = SHAPE_BUILDERS[type];
  if (!builder) throw new Error(`Onbekend moto-type: ${type}`);
  const parts = [];
  const spec = builder(parts);
  const wheel = buildWheelGeometries({
    radius: spec.wheelRadius, width: spec.tireWidth, segments: spec.tireSegments,
  });
  geometryCache[type] = { body: mergeParts(parts), tire: wheel.tire, spokes: wheel.spokes, spec };
  return geometryCache[type];
}

// Maakt een schaduwgevende mesh.
function makeMesh(geometry, material) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
}

// Wiel = groepje (band + spaken) dat om de eigen X-as draait.
function makeWheel(name, shared, materials, z) {
  const wheel = new THREE.Group();
  wheel.name = name;
  wheel.position.set(0, shared.spec.wheelRadius, z);
  wheel.add(makeMesh(shared.tire, materials.tire));
  wheel.add(makeMesh(shared.spokes, materials.metal));
  return wheel;
}

export function createBikeModel({ type, color, materials }) {
  const shared = getShared(type);
  const model = new THREE.Group();
  model.name = `bike-${type}`;

  const leanPivot = new THREE.Group(); // draaipunt op de grond, hier helt alles over
  leanPivot.name = "leanPivot";
  model.add(leanPivot);

  // Carrosserie en rijder: een mesh per materiaal.
  for (const [slot, geometry] of Object.entries(shared.body)) {
    const material = slot === "paint" ? materials.paint(color) : materials[MATERIAL_BY_SLOT[slot]];
    leanPivot.add(makeMesh(geometry, material));
  }

  const halfBase = shared.spec.wheelbase / 2;
  leanPivot.add(makeWheel("wheelFront", shared, materials, -halfBase)); // voor = -Z
  leanPivot.add(makeWheel("wheelBack", shared, materials, halfBase));

  // Turbovlam bij de uitlaat: onder leanPivot (helt mee), standaard onzichtbaar.
  leanPivot.add(createBoostFlame(materials, shared.spec.exhaust));

  model.userData.wheelRadius = shared.spec.wheelRadius;
  return model;
}

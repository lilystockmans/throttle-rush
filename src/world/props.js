// Decor langs het circuit: bomen (stam + kroon) en verkeerskegels in bochten.
// Alles is een InstancedMesh: een paar draw calls voor honderden objecten.
// Plaatsing gebruikt een eigen random met vaste startwaarde, dus bij elke
// start staat alles op dezelfde plek.
import * as THREE from "three";

const TREE_COUNT = 300;
const CONE_COUNT = 60;
const SEED = 20240611;
const FIELD_HALF = 330;        // bomen komen binnen dit vierkant (grondvlak is 700 breed)
const CLEARANCE = 6;           // vrije ruimte naast asfalt/berm en dirt
const TREE_SPACING = 4;        // minimale afstand tussen twee bomen
const MAX_ATTEMPTS = 40000;
const CONE_GROUPS = 12;
const CONE_SPACING = 2.5;      // afstand tussen kegels in een groepje
const CONE_OFFSET = 1.2;       // afstand van de berm tot de kegels
const CURVE_LOOKAROUND = 2;    // frames links en rechts om de bocht te meten

// Eenvoudige random met vaste startwaarde (mulberry32): geeft getallen 0..1.
function makeRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Plaatsingsregels ----------

// Punten langs het dirt-pad, om afstand tot de shortcut te kunnen meten.
function dirtPoints(track) {
  return track.sampleShortcutFrames(120).map((f) => f.position);
}

function farFromDirt(x, z, dirt, minDistance) {
  const minSq = minDistance * minDistance;
  return dirt.every((p) => (p.x - x) ** 2 + (p.z - z) ** 2 > minSq);
}

// Mag hier een boom staan? Gras, ver genoeg van asfalt en dirt.
function treeAllowed(track, dirt, x, z) {
  if (track.getSurfaceAt(x, z) !== "grass") return false;
  const nearest = track.getNearest(x, z);
  const roadEdge = track.roadWidth / 2 + track.curbWidth;
  if (Math.abs(nearest.lateral) < roadEdge + CLEARANCE) return false;
  return farFromDirt(x, z, dirt, track.shortcutWidth / 2 + CLEARANCE);
}

function farFromOtherTrees(spots, x, z) {
  return spots.every((s) => (s.x - x) ** 2 + (s.z - z) ** 2 > TREE_SPACING ** 2);
}

function pickTreeSpots(track, random) {
  const dirt = dirtPoints(track);
  const spots = [];
  for (let tries = 0; tries < MAX_ATTEMPTS && spots.length < TREE_COUNT; tries++) {
    const x = (random() * 2 - 1) * FIELD_HALF;
    const z = (random() * 2 - 1) * FIELD_HALF;
    if (treeAllowed(track, dirt, x, z) && farFromOtherTrees(spots, x, z)) {
      spots.push({ x, z });
    }
  }
  return spots;
}

// Bocht-sterkte per frame: hoek tussen de rijrichting voor en achter dit punt.
// Positief getal = bocht naar links, negatief = naar rechts.
function curveAt(frames, i) {
  const n = frames.length;
  const before = frames[(i - CURVE_LOOKAROUND + n) % n].tangent;
  const after = frames[(i + CURVE_LOOKAROUND) % n].tangent;
  return Math.atan2(before.z * after.x - before.x * after.z, before.dot(after));
}

// De scherpste bochten, met minstens `minGap` frames ertussen.
function sharpestCurves(frames, groupCount, minGap) {
  const ranked = frames
    .map((_, i) => ({ i, turn: curveAt(frames, i) }))
    .sort((a, b) => Math.abs(b.turn) - Math.abs(a.turn));
  const chosen = [];
  for (const candidate of ranked) {
    const far = chosen.every((c) => {
      const gap = Math.abs(c.i - candidate.i);
      return Math.min(gap, frames.length - gap) >= minGap;
    });
    if (far) chosen.push(candidate);
    if (chosen.length === groupCount) break;
  }
  return chosen;
}

// Kegels in rijtjes aan de buitenkant van de scherpste bochten.
function pickConeSpots(track, random) {
  const frames = track.sampleFrames(240);
  const curves = sharpestCurves(frames, CONE_GROUPS, 12);
  const perGroup = Math.ceil(CONE_COUNT / curves.length);
  const distance = track.roadWidth / 2 + track.curbWidth + CONE_OFFSET;
  const spots = [];
  for (const { i, turn } of curves) {
    // Bocht naar links (turn > 0) -> buitenkant is rechts, en andersom.
    const side = turn > 0 ? 1 : -1;
    for (let k = 0; k < perGroup && spots.length < CONE_COUNT; k++) {
      const frame = frames[(i + k - Math.floor(perGroup / 2) + frames.length) % frames.length];
      const lateral = side * (distance + (random() - 0.5) * 0.4);
      const x = frame.position.x + frame.right.x * lateral;
      const z = frame.position.z + frame.right.z * lateral;
      if (track.getSurfaceAt(x, z) === "grass") spots.push({ x, z });
    }
  }
  return spots;
}

// ---------- Meshes ----------

// Gooit per plek de dobbelstenen: grootte, draaiing, uitrekking en tint.
// Stam en kroon van een boom gebruiken dezelfde looks, dus passen op elkaar.
function rollLooks(spots, random, [minSize, maxSize]) {
  return spots.map(() => ({
    size: minSize + random() * (maxSize - minSize),
    turn: random() * Math.PI * 2,
    stretch: 0.85 + random() * 0.3,
    shade: 0.75 + random() * 0.25,
  }));
}

function makeInstances(geometry, material, spots, looks, tint) {
  const mesh = new THREE.InstancedMesh(geometry, material, spots.length);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  spots.forEach((spot, index) => {
    const look = looks[index];
    dummy.position.set(spot.x, 0, spot.z);
    dummy.rotation.y = look.turn;
    dummy.scale.set(look.size, look.size * look.stretch, look.size);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    if (tint) mesh.setColorAt(index, color.setScalar(look.shade));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (tint && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = true;
  return mesh;
}

export function createProps(track, materials) {
  const random = makeRandom(SEED);
  const group = new THREE.Group();
  group.name = "props";

  // Stam en kroon: dezelfde plekken, elk een eigen InstancedMesh.
  const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 6).translate(0, 1, 0);
  const crownGeometry = new THREE.ConeGeometry(1.7, 4.2, 7).translate(0, 2 + 2.1 - 0.4, 0);
  const treeSpots = pickTreeSpots(track, random);
  const treeLooks = rollLooks(treeSpots, random, [0.7, 1.5]);
  group.add(makeInstances(trunkGeometry, materials.treeTrunk, treeSpots, treeLooks, false));
  group.add(makeInstances(crownGeometry, materials.treeLeaves, treeSpots, treeLooks, true));

  const coneGeometry = new THREE.CylinderGeometry(0.06, 0.22, 0.7, 8).translate(0, 0.35, 0);
  const coneSpots = pickConeSpots(track, random);
  const coneLooks = rollLooks(coneSpots, random, [0.9, 1.1]);
  group.add(makeInstances(coneGeometry, materials.cone, coneSpots, coneLooks, false));
  return group;
}

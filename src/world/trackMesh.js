// Bouwt het zichtbare circuit: asfalt, rood-witte bermen, witte lijnen,
// start/finish-lijn en de dirt-shortcut. Alles is een platte strook langs de
// middenlijn (track.sampleFrames) en wordt tot 6 meshes samengevoegd.
// Hoogtes (contract 03-D): dirt 0.01, asfalt 0.02, berm en lijnen 0.03.
import * as THREE from "three";

const SPACING = 2;            // meter tussen twee frames
const Y_DIRT = 0.01;
const Y_ROAD = 0.02;
const Y_TOP = 0.03;           // berm en lijnen
const LINE_WIDTH = 0.25;      // breedte van witte lijnen
const EDGE_INSET = 0.4;       // afstand van randlijn tot de rand van het asfalt
const CHECKER_COLUMNS = 16;   // vakjes over de breedte van de startlijn
const CHECKER_DEPTH = 0.5;    // diepte van een vakje in meter

// ---------- Een "vlak" is een verzameling vierhoeken ----------

function newSurface() {
  return { positions: [], indices: [] };
}

// Voegt een vierhoek toe met vier hoeken [x, y, z]: a/b = begin (links, rechts), c/d = einde.
function addQuad(surface, a, b, c, d) {
  const start = surface.positions.length / 3;
  surface.positions.push(...a, ...b, ...c, ...d);
  // Twee driehoeken met de voorkant naar boven.
  surface.indices.push(start, start + 1, start + 2, start + 1, start + 3, start + 2);
}

// Punt op afstand `lateral` rechts van de middenlijn (negatief = links).
function pointAt(frame, lateral, y) {
  return [
    frame.position.x + frame.right.x * lateral,
    y,
    frame.position.z + frame.right.z * lateral,
  ];
}

function makeMesh(surface, material, name) {
  const geometry = new THREE.BufferGeometry();
  const vertexCount = surface.positions.length / 3;
  const normals = new Float32Array(vertexCount * 3);
  for (let i = 0; i < vertexCount; i++) normals[i * 3 + 1] = 1; // alles wijst omhoog
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(surface.positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setIndex(surface.indices);
  geometry.computeBoundingSphere();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.receiveShadow = true;
  return mesh;
}

// ---------- Stroken langs de baan ----------

// Strook tussen twee afstanden (lateral) langs alle frames.
// `closed` = de lus sluit (laatste frame verbindt met het eerste).
// `useSegment(i)` bepaalt welke stukjes meedoen (voor blokken en streepjes).
function addStrip(surface, frames, closed, from, to, y, useSegment = () => true) {
  const segmentCount = closed ? frames.length : frames.length - 1;
  for (let i = 0; i < segmentCount; i++) {
    if (!useSegment(i)) continue;
    const now = frames[i];
    const next = frames[(i + 1) % frames.length];
    addQuad(surface,
      pointAt(now, from, y), pointAt(now, to, y),
      pointAt(next, from, y), pointAt(next, to, y));
  }
}

// ---------- Delen van het circuit ----------

function addCurbs(frames, track, red, white) {
  const inner = track.roadWidth / 2;
  const outer = inner + track.curbWidth;
  const isRed = (i) => i % 2 === 0;
  const isWhite = (i) => i % 2 === 1;
  for (const [from, to] of [[-outer, -inner], [inner, outer]]) {
    addStrip(red, frames, true, from, to, Y_TOP, isRed);
    addStrip(white, frames, true, from, to, Y_TOP, isWhite);
  }
}

// Doorlopende randlijnen + gestreepte middenstreep (niet bij de startlijn).
function addRoadLines(lines, frames, track) {
  const edge = track.roadWidth / 2 - EDGE_INSET;
  addStrip(lines, frames, true, -edge - LINE_WIDTH, -edge, Y_TOP);
  addStrip(lines, frames, true, edge, edge + LINE_WIDTH, Y_TOP);
  const last = frames.length - 1;
  const isDash = (i) => i % 2 === 0 && i !== 0 && i !== last;
  addStrip(lines, frames, true, -LINE_WIDTH / 2, LINE_WIDTH / 2, Y_TOP, isDash);
}

// Geblokte startlijn: twee rijen vakjes, om en om wit en zwart, rond het eerste frame.
function addStartLine(white, black, frame, track) {
  const width = track.roadWidth - 2 * (EDGE_INSET + LINE_WIDTH + 0.1); // binnen de randlijnen
  const cell = width / CHECKER_COLUMNS;
  for (let row = 0; row < 2; row++) {
    const alongStart = (row - 1) * CHECKER_DEPTH;
    const alongEnd = alongStart + CHECKER_DEPTH;
    for (let column = 0; column < CHECKER_COLUMNS; column++) {
      const from = -width / 2 + column * cell;
      const target = (row + column) % 2 === 0 ? white : black;
      const corner = (lateral, along) => {
        const p = pointAt(frame, lateral, Y_TOP);
        p[0] += frame.tangent.x * along;
        p[2] += frame.tangent.z * along;
        return p;
      };
      addQuad(target, corner(from, alongStart), corner(from + cell, alongStart),
        corner(from, alongEnd), corner(from + cell, alongEnd));
    }
  }
}

// Het aantal frames voor de shortcut volgt uit zijn lengte (grove meting eerst).
function shortcutFrames(track) {
  const rough = track.sampleShortcutFrames(64);
  let length = 0;
  for (let i = 1; i < rough.length; i++) {
    length += rough[i].position.distanceTo(rough[i - 1].position);
  }
  return track.sampleShortcutFrames(Math.max(3, Math.ceil(length / SPACING)));
}

// ---------- Hoofdfunctie ----------

export function buildTrackMesh(track, materials) {
  let count = Math.ceil(track.length / SPACING);
  if (count % 2 === 1) count++; // even aantal, zodat de rood-wit blokken netjes sluiten
  const frames = track.sampleFrames(count);

  const asphalt = newSurface();
  const red = newSurface(), white = newSurface();
  const lines = newSurface(), black = newSurface();
  const dirt = newSurface();

  const half = track.roadWidth / 2;
  addStrip(asphalt, frames, true, -half, half, Y_ROAD);
  addCurbs(frames, track, red, white);
  addRoadLines(lines, frames, track);
  addStartLine(lines, black, frames[0], track);
  const dirtFrames = shortcutFrames(track);
  addStrip(dirt, dirtFrames, false, -track.shortcutWidth / 2, track.shortcutWidth / 2, Y_DIRT);

  const group = new THREE.Group();
  group.name = "trackMesh";
  group.add(
    makeMesh(dirt, materials.dirt, "dirt"),
    makeMesh(asphalt, materials.road, "asphalt"),
    makeMesh(red, materials.curbRed, "curbRed"),
    makeMesh(white, materials.curbWhite, "curbWhite"),
    makeMesh(lines, materials.roadLine, "roadLines"),
    makeMesh(black, materials.tire, "startBlack"),
  );
  return group;
}

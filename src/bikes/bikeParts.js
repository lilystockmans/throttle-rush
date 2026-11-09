// Bouwstenen voor de moto-modellen (extra bestand naast BikeModel.js).
// Een "onderdeel" is een simpele vorm met een materiaal-slot en een plek.
// Alle onderdelen van hetzelfde slot worden later tot EEN geometrie samengevoegd,
// zodat een hele moto maar een paar draw calls kost.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const OMHOOG = new THREE.Vector3(0, 1, 0);

// Zet een onderdeel in de lijst. rot = [x, y, z] in radialen.
function voegToe(parts, geometry, slot, pos, rot = [0, 0, 0], scale = [1, 1, 1]) {
  const matrix = new THREE.Matrix4().compose(
    new THREE.Vector3(...pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
    new THREE.Vector3(...scale),
  );
  parts.push({ geometry, slot, matrix });
}

export function addBox(parts, slot, size, pos, rot) {
  voegToe(parts, new THREE.BoxGeometry(...size), slot, pos, rot);
}

export function addSphere(parts, slot, radius, pos, scale) {
  voegToe(parts, new THREE.SphereGeometry(radius, 8, 6), slot, pos, [0, 0, 0], scale);
}

// Cilinder die van punt a naar punt b loopt (voor poten, vork, uitlaat, armen).
// Met radiusEnd wordt het een kegel die bij b smaller of breder is.
export function addLimb(parts, slot, a, b, radius, segments = 6, radiusEnd = radius) {
  const from = new THREE.Vector3(...a);
  const to = new THREE.Vector3(...b);
  const length = from.distanceTo(to);
  const geometry = new THREE.CylinderGeometry(radiusEnd, radius, length, segments);
  const matrix = new THREE.Matrix4().compose(
    from.clone().add(to).multiplyScalar(0.5),
    new THREE.Quaternion().setFromUnitVectors(OMHOOG, to.clone().sub(from).normalize()),
    new THREE.Vector3(1, 1, 1),
  );
  parts.push({ geometry, slot, matrix });
}

// Afgeronde staaf van a naar b (voor de romp van de rijder).
export function addCapsuleBetween(parts, slot, a, b, radius) {
  const from = new THREE.Vector3(...a);
  const to = new THREE.Vector3(...b);
  const length = Math.max(0.01, from.distanceTo(to) - 2 * radius);
  const geometry = new THREE.CapsuleGeometry(radius, length, 2, 6);
  const matrix = new THREE.Matrix4().compose(
    from.clone().add(to).multiplyScalar(0.5),
    new THREE.Quaternion().setFromUnitVectors(OMHOOG, to.clone().sub(from).normalize()),
    new THREE.Vector3(1, 1, 1),
  );
  parts.push({ geometry, slot, matrix });
}

// Roept bouwFunctie(zijde) twee keer aan: zijde = +1 (rechts) en -1 (links).
export function spiegel(bouwFunctie) {
  bouwFunctie(1);
  bouwFunctie(-1);
}

// Voegt alle onderdelen per slot samen. Resultaat: { slotNaam: BufferGeometry }.
export function mergeParts(parts) {
  const perSlot = {};
  for (const part of parts) {
    const geometry = part.geometry.clone();
    geometry.applyMatrix4(part.matrix);
    (perSlot[part.slot] ??= []).push(geometry);
    part.geometry.dispose();
  }
  const result = {};
  for (const [slot, list] of Object.entries(perSlot)) {
    result[slot] = mergeGeometries(list);
    list.forEach((g) => g.dispose());
  }
  return result;
}

// Wiel: band + spaken (de spaken laten zien dat het wiel draait).
// Het wiel ligt met de as langs X en het midden op de oorsprong.
export function buildWheelGeometries({ radius, width, segments }) {
  const tire = new THREE.CylinderGeometry(radius, radius, width, segments);
  tire.rotateZ(Math.PI / 2);
  const parts = [];
  const spokeLength = radius * 1.7;
  addBox(parts, "spokes", [width * 0.5, spokeLength, 0.05], [0, 0, 0]);
  addBox(parts, "spokes", [width * 0.5, 0.05, spokeLength], [0, 0, 0]);
  addBox(parts, "spokes", [width * 0.9, 0.12, 0.12], [0, 0, 0]);
  return { tire, spokes: mergeParts(parts).spokes };
}

// Rijder: romp, hoofd met helm, armen en benen. Alle posities zijn voor de
// rechterkant (x > 0); de linkerkant wordt gespiegeld.
// pose = { hip, shoulder, head, elbow, hand, knee, foot } als [x, y, z].
export function addRider(parts, pose) {
  const links = (p, zijde) => [p[0] * zijde, p[1], p[2]];
  addCapsuleBetween(parts, "riderSuit", [0, pose.hip[1], pose.hip[2]],
    [0, pose.shoulder[1], pose.shoulder[2]], 0.13);

  spiegel((zijde) => {
    const schouder = [pose.shoulder[0] * zijde, pose.shoulder[1], pose.shoulder[2]];
    addLimb(parts, "riderSuit", schouder, links(pose.elbow, zijde), 0.05);
    addLimb(parts, "riderSuit", links(pose.elbow, zijde), links(pose.hand, zijde), 0.045);
    const heup = [pose.hip[0] * zijde, pose.hip[1], pose.hip[2]];
    addLimb(parts, "riderSuit", heup, links(pose.knee, zijde), 0.075);
    addLimb(parts, "riderSuit", links(pose.knee, zijde), links(pose.foot, zijde), 0.06);
    addBox(parts, "tire", [0.1, 0.08, 0.24],
      [pose.foot[0] * zijde, pose.foot[1] - 0.02, pose.foot[2] - 0.06]); // laars
  });

  const [hx, hy, hz] = pose.head;
  addSphere(parts, "paint", 0.15, [hx, hy, hz], [1, 1.05, 1.1]); // helm
  addBox(parts, "helmetVisor", [0.2, 0.08, 0.1], [hx, hy + 0.01, hz - 0.12]); // vizier
}

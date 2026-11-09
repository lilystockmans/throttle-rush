// De drie moto-silhouetten: sport, cross en cruiser (extra bestand naast BikeModel.js).
// Elke functie vult een lijst met onderdelen (zie bikeParts.js) en geeft de
// wiel-afmetingen terug. Coordinaten: x = links/rechts, y = omhoog,
// z = voor/achter. De VOORKANT is -Z, de grond is y = 0.
// Slots: paint (kuip/tank/spatbord), metal, seat, tire, riderSuit, helmetVisor.
import { addBox, addSphere, addLimb, addRider, spiegel } from "./bikeParts.js";

// SPORT: laag, volle kuip met spitse neus, rijder plat voorovergebogen.
function buildSport(parts) {
  const R = 0.32, wb = 1.4;
  addBox(parts, "metal", [0.22, 0.28, 0.5], [0, 0.42, 0.05]); // motorblok
  addLimb(parts, "paint", [0, 0.68, 0.1], [0, 0.68, -0.62], 0.25, 8, 0.07); // neus (kegel)
  addBox(parts, "paint", [0.4, 0.3, 0.45], [0, 0.6, -0.1]); // brede zijkuip
  addBox(parts, "helmetVisor", [0.3, 0.26, 0.03], [0, 0.92, -0.33], [0.7, 0, 0]); // windscherm
  addBox(parts, "paint", [0.28, 0.2, 0.4], [0, 0.74, 0.15]); // tank
  addBox(parts, "paint", [0.2, 0.14, 0.45], [0, 0.78, 0.62], [-0.2, 0, 0]); // staart
  addBox(parts, "seat", [0.24, 0.06, 0.34], [0, 0.85, 0.42], [-0.15, 0, 0]); // zadel
  addBox(parts, "metal", [0.07, 0.07, 0.7], [0, 0.4, 0.45], [0.05, 0, 0]); // achterbrug
  addLimb(parts, "metal", [0.15, 0.3, 0.2], [0.15, 0.4, 0.95], 0.045); // uitlaat
  spiegel((s) => addLimb(parts, "metal", [s * 0.09, 0.62, -0.55], [s * 0.09, R, -wb / 2], 0.03));
  addRider(parts, {
    hip: [0.12, 0.88, 0.4], shoulder: [0.17, 1.08, -0.12], head: [0, 1.13, -0.3],
    elbow: [0.27, 0.92, -0.12], hand: [0.2, 0.88, -0.38],
    knee: [0.21, 0.72, 0.02], foot: [0.2, 0.42, 0.25],
  });
  return { wheelRadius: R, wheelbase: wb, tireWidth: 0.16, tireSegments: 12 };
}

// CROSS: hoog, smal, lange vering, groot voorspatbord, rijder rechtop.
function buildCross(parts) {
  const R = 0.4, wb = 1.45;
  addBox(parts, "metal", [0.18, 0.3, 0.5], [0, 0.62, 0.05]); // motorblok
  addBox(parts, "paint", [0.24, 0.3, 0.45], [0, 0.88, -0.12]); // tank en kap
  addBox(parts, "seat", [0.2, 0.08, 0.7], [0, 1.02, 0.3], [-0.1, 0, 0]); // lang zadel
  addBox(parts, "paint", [0.2, 0.04, 0.5], [0, 1.1, 0.78], [-0.3, 0, 0]); // achterspatbord
  spiegel((s) => {
    addLimb(parts, "metal", [s * 0.1, 1.2, -0.5], [s * 0.1, 0.8, -0.65], 0.04); // bovenpoot vork
    addLimb(parts, "metal", [s * 0.1, 0.8, -0.65], [s * 0.1, R, -wb / 2], 0.03); // onderpoot vork
  });
  addBox(parts, "paint", [0.22, 0.04, 0.55], [0, 0.98, -0.82], [0.25, 0, 0]); // groot voorspatbord
  addBox(parts, "paint", [0.32, 0.3, 0.04], [0, 1.1, -0.6], [-0.3, 0, 0]); // nummerbord
  addLimb(parts, "metal", [-0.4, 1.25, -0.5], [0.4, 1.25, -0.5], 0.022); // breed stuur
  addLimb(parts, "metal", [0, 0.65, 0.4], [0, 0.98, 0.15], 0.04); // schokdemper
  addLimb(parts, "metal", [0, 0.55, 0.2], [0, R, wb / 2], 0.04); // achterbrug
  addLimb(parts, "metal", [0.14, 0.6, -0.1], [0.16, 0.98, 0.75], 0.04); // hoge uitlaat
  addRider(parts, {
    hip: [0.12, 1.1, 0.3], shoulder: [0.18, 1.62, 0.12], head: [0, 1.82, 0.05],
    elbow: [0.36, 1.45, -0.18], hand: [0.4, 1.25, -0.5],
    knee: [0.22, 0.95, -0.05], foot: [0.22, 0.5, 0.15],
  });
  addBox(parts, "paint", [0.2, 0.02, 0.16], [0, 1.89, -0.12]); // klep van de helm
  return { wheelRadius: R, wheelbase: wb, tireWidth: 0.13, tireSegments: 10 };
}

// CRUISER: lang en laag, brede stuur naar achter, rijder achterover met voeten vooruit.
function buildCruiser(parts) {
  const R = 0.36, wb = 1.6;
  addBox(parts, "metal", [0.34, 0.3, 0.4], [0, 0.4, -0.05]); // grote motor
  spiegel((s) => addBox(parts, "metal", [0.14, 0.3, 0.2], [s * 0.2, 0.52, -0.05], [0, 0, s * 0.5]));
  addSphere(parts, "paint", 0.2, [0, 0.82, -0.28], [1, 0.85, 1.7]); // druppeltank
  addBox(parts, "seat", [0.3, 0.08, 0.45], [0, 0.66, 0.32]); // laag zadel
  addBox(parts, "paint", [0.34, 0.05, 0.75], [0, 0.8, 0.72], [-0.05, 0, 0]); // breed achterspatbord
  spiegel((s) => {
    addLimb(parts, "metal", [s * 0.1, 0.98, -0.34], [s * 0.1, R, -wb / 2], 0.035); // schuine vork
    addLimb(parts, "metal", [s * 0.1, 0.98, -0.34], [s * 0.1, 1.1, -0.3], 0.03); // stuurpoot
    addLimb(parts, "metal", [s * 0.1, 1.1, -0.3], [s * 0.46, 1.12, -0.3], 0.022); // stuur breed
    addLimb(parts, "metal", [s * 0.46, 1.12, -0.3], [s * 0.4, 1.05, 0.0], 0.022); // stuur naar achter
    addLimb(parts, "metal", [s * 0.2, 0.34, -0.25], [s * 0.22, 0.3, 0.88], 0.05); // uitlaat
    addLimb(parts, "metal", [s * 0.2, 0.3, -0.05], [s * 0.3, 0.3, -0.5], 0.025); // voetsteun
  });
  addSphere(parts, "metal", 0.1, [0, 0.95, -0.52]); // koplamp
  addLimb(parts, "metal", [0, 0.5, 0.2], [0, R, wb / 2], 0.05); // achterbrug
  addRider(parts, {
    hip: [0.14, 0.76, 0.32], shoulder: [0.18, 1.26, 0.48], head: [0, 1.46, 0.52],
    elbow: [0.4, 1.12, 0.22], hand: [0.4, 1.05, 0.0],
    knee: [0.26, 0.7, -0.2], foot: [0.28, 0.38, -0.5],
  });
  return { wheelRadius: R, wheelbase: wb, tireWidth: 0.2, tireSegments: 12 };
}

export const SHAPE_BUILDERS = { sport: buildSport, cross: buildCross, cruiser: buildCruiser };

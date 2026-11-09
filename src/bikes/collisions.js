// collisions.js: botsingen tussen moto's. Van boven gezien is elke moto een cirkel. Overlappen
// twee cirkels, dan gebeurt er drie dingen:
// 1. Ze worden uit elkaar geschoven tot ze elkaar net raken. De lichte moto schuift verder dan
//    de zware: de zware wint.
// 2. Bewegen ze naar elkaar toe, dan kaatsen ze af: een duw (bike.push) langs de lijn tussen
//    de middelpunten, ook weer groter voor de lichte moto.
// 3. En ze verliezen een deel van hun snelheid (de lichte meer dan de zware).
// Er is geen echte natuurkunde: genoeg om het goed te laten voelen. Met 6 moto's zijn er maar
// 15 paren, dus elk paar nalopen is snel genoeg.
import { CONFIG } from "../config.js";

const MIN_APPROACH = 0.5;   // m/s: zo snel moeten ze naar elkaar toe gaan om te tellen als "aanrijding"
const TINY = 1e-6;          // zitten twee moto's precies op elkaar, dan is er geen richting

export function resolveCollisions(bikes) {
  for (let i = 0; i < bikes.length; i++) {
    for (let j = i + 1; j < bikes.length; j++) resolvePair(bikes[i], bikes[j]);
  }
}

function resolvePair(a, b) {
  const { radius } = CONFIG.collisions;
  const minDist = 2 * radius;
  let dx = b.position.x - a.position.x;
  let dz = b.position.z - a.position.z;
  const distSq = dx * dx + dz * dz;
  if (distSq >= minDist * minDist) return;   // geen overlap, snel klaar (de meeste paren)

  // Botsnormaal: van a naar b. Precies op elkaar? Kies dan een willekeurige richting.
  const dist = Math.sqrt(distSq);
  if (dist < TINY) { dx = 1; dz = 0; } else { dx /= dist; dz /= dist; }

  const totalMass = a.mass + b.mass;
  const shareA = b.mass / totalMass;   // a's deel van de verplaatsing = massa van de ANDER / totaal
  const shareB = a.mass / totalMass;

  separate(a, b, dx, dz, minDist - dist, shareA, shareB);
  bounce(a, b, dx, dz, shareA, shareB);
}

// Schuif ze langs de normaal uit elkaar, de lichte moto verder.
function separate(a, b, nx, nz, overlap, shareA, shareB) {
  a.position.x -= nx * overlap * shareA;
  a.position.z -= nz * overlap * shareA;
  b.position.x += nx * overlap * shareB;
  b.position.z += nz * overlap * shareB;
}

// Afkaatsen en snelheidsverlies, alleen als ze echt naar elkaar toe bewegen.
function bounce(a, b, nx, nz, shareA, shareB) {
  const { bounce: bounciness, speedLoss } = CONFIG.collisions;
  // Naderingssnelheid langs de normaal: positief = ze komen op elkaar af.
  const approach = (a.velocity.x - b.velocity.x) * nx + (a.velocity.z - b.velocity.z) * nz;
  if (approach < MIN_APPROACH) return;

  a.push(-nx * approach * bounciness * shareA, -nz * approach * bounciness * shareA);
  b.push(nx * approach * bounciness * shareB, nz * approach * bounciness * shareB);
  // Gemiddeld verliest iedereen `speedLoss`; de lichte moto meer, de zware minder (2 x share).
  a.speed *= 1 - speedLoss * 2 * shareA;
  b.speed *= 1 - speedLoss * 2 * shareB;
}

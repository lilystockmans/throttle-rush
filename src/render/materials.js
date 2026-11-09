// Alle materialen van het spel, op een plek. Hier staat ook het kleurenpalet.
// We gebruiken MeshToonMaterial met een gradientMap van 3 tinten: licht, midden, schaduw.
// Dat geeft de platte "cartoon-banden" in plaats van een zachte overgang, en is net zo snel als Lambert.
import * as THREE from "three";

// ---- Palet (hex) ----
// Ondergrond: donker blauwgrijs asfalt tegen felgroen gras en oranje dirt, zodat je het verschil in een oogopslag leest.
export const ASPHALT = 0x4a4f5c;
export const ROAD_LINE = 0xfafafa;
export const CURB_RED = 0xe63946;
export const CURB_WHITE = 0xf5f5f0;
export const DIRT = 0xd08a45;
export const GRASS = 0x5cc84a;
// Decor: bladeren iets donkerder dan gras zodat bomen eruit springen.
export const TREE_TRUNK = 0x8a5a2e;
export const TREE_LEAVES = 0x2f9a4d;
export const CONE_ORANGE = 0xff7a1a;
// Moto en rijder.
export const TIRE = 0x26262c;
export const METAL = 0xb4bdc8;
export const SEAT = 0x2e2a3a;
export const RIDER_SUIT = 0x2f6df0;
export const HELMET_VISOR = 0x22d3e6;
// Turbovlam: oranje-geel buitenkant, bijna witte kern. Felle, verzadigde kleuren
// zodat de vlam overdag opvalt tegen donker asfalt en blauwe lucht.
export const FLAME_OUTER = 0xff9a1f;
export const FLAME_CORE = 0xfff6c8;
// Doorzichtigheid van de vlam (kern iets dichter, zodat het midden wit blijft).
const FLAME_OPACITY = 0.85;
const FLAME_CORE_OPACITY = 0.95;

// De 3 lichttinten (0 = donker, 1 = helemaal verlicht).
// Laagste tint niet te donker: schaduw moet kleurrijk blijven, geen zwart.
const TONE_SHADOW = 0.6;
const TONE_MID = 0.85;
const TONE_LIT = 1.0;

// Maakt het gradient-kaartje: 3 pixels in 1 rij, zonder filtering (NearestFilter),
// anders zou de overgang tussen de tinten weer glad worden.
function makeGradientMap() {
  const tones = [TONE_SHADOW, TONE_MID, TONE_LIT];
  const data = new Uint8Array(tones.map((t) => Math.round(t * 255)));
  const map = new THREE.DataTexture(data, tones.length, 1, THREE.RedFormat);
  map.minFilter = THREE.NearestFilter;
  map.magFilter = THREE.NearestFilter;
  map.generateMipmaps = false;
  map.needsUpdate = true;
  return map;
}

export function createMaterials() {
  // Eén gedeeld kaartje voor alle materialen (scheelt geheugen).
  const gradientMap = makeGradientMap();
  const toon = (color) => new THREE.MeshToonMaterial({ color, gradientMap });

  // Cache voor paint(): zelfde kleur geeft hetzelfde object terug, zodat three.js
  // niet voor elke helm of tank een eigen shader hoeft te bouwen.
  const paintCache = new Map();
  function paint(color) {
    const key = new THREE.Color(color).getHex(); // 0xff0000, "red" en Color(red) worden dezelfde sleutel
    if (!paintCache.has(key)) paintCache.set(key, toon(key));
    return paintCache.get(key);
  }

  // Vlammen: MeshBasicMaterial reageert niet op licht of schaduw, dus ze gloeien altijd even fel.
  // Bewust NormalBlending en geen AdditiveBlending: additive telt kleur bij de achtergrond op,
  // en tegen lichte lucht of een lichte weg klipt dat naar wit, waardoor de vlam wegvalt.
  // Normale blending houdt het oranje overal zichtbaar. depthWrite uit: doorzichtig, geen sorteerfouten.
  // toneMapped uit: de kleuren blijven precies zoals in het palet.
  const glow = (color, opacity) =>
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      toneMapped: false,
    });

  return {
    road: toon(ASPHALT),
    roadLine: toon(ROAD_LINE),
    curbRed: toon(CURB_RED),
    curbWhite: toon(CURB_WHITE),
    dirt: toon(DIRT),
    grass: toon(GRASS),
    treeTrunk: toon(TREE_TRUNK),
    treeLeaves: toon(TREE_LEAVES),
    cone: toon(CONE_ORANGE),
    tire: toon(TIRE),
    metal: toon(METAL),
    seat: toon(SEAT),
    riderSuit: toon(RIDER_SUIT),
    helmetVisor: toon(HELMET_VISOR),
    flame: glow(FLAME_OUTER, FLAME_OPACITY),
    flameCore: glow(FLAME_CORE, FLAME_CORE_OPACITY),
    paint,
  };
}

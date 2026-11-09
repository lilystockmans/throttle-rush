// Stofwolkjes achter de moto (contract 09-B). Twee vaste pools van InstancedMesh
// (aarde en gras, samen max 200 wolkjes) die als ringbuffer worden hergebruikt.
// Tijdens het spelen worden er geen objecten aangemaakt: alleen getallen overschreven.
// Beperking per moto: geef bij emit een 4e parameter `key` mee (bv. de bike zelf).
// Elke key heeft een eigen teller; die loopt met de tijd en geeft max intensity * 20 wolkjes/s.
import * as THREE from "three";

const POOL_GROOTTE = 100; // per ondergrond, dus 200 in totaal
const WOLKJES_PER_SECONDE = 20; // bij intensity = 1, per key
const LEVENSDUUR = [0.7, 0.9]; // seconden (min, max)
const GROEI_DEEL = 0.3; // eerste 30% van het leven groeit het wolkje, daarna krimpt het
const GROOTTE = [0.35, 0.6]; // maximale diameter in meter
const STIJGSNELHEID = [0.5, 1.1]; // m/s omhoog
const SPREIDING_POS = 0.3; // m, willekeurige verschuiving bij geboorte
const SPREIDING_SNELHEID = 0.4; // m/s zijwaartse drift
const MAX_STAP = 0.1; // s, begrenst de tijd tussen twee emits (tabwissel e.d.)
const STANDAARD_KEY = "standaard";

const tussen = (bereik) => bereik[0] + Math.random() * (bereik[1] - bereik[0]);

// Eén pool: vaste typed arrays + één InstancedMesh + een ringbuffer-wijzer.
function maakPool(scene, geometry, material) {
  const mesh = new THREE.InstancedMesh(geometry, material, POOL_GROOTTE);
  mesh.name = "dust";
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false; // anders verdwijnt de pool door een kloppende bounding sphere
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const nul = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < POOL_GROOTTE; i++) mesh.setMatrixAt(i, nul);
  scene.add(mesh);
  return {
    mesh,
    pos: new Float32Array(POOL_GROOTTE * 3),
    vel: new Float32Array(POOL_GROOTTE * 3),
    leeftijd: new Float32Array(POOL_GROOTTE),
    levensduur: new Float32Array(POOL_GROOTTE), // 0 = vrij / dood
    grootte: new Float32Array(POOL_GROOTTE),
    volgende: 0,
  };
}

// Schaal-verloop 0..1..0: eerst groeien, dan krimpen naar 0.
function schaalVerloop(t) {
  return t < GROEI_DEEL ? t / GROEI_DEEL : 1 - (t - GROEI_DEEL) / (1 - GROEI_DEEL);
}

export function createDust(scene, materials) {
  const geometry = new THREE.IcosahedronGeometry(0.5, 0); // 20 driehoeken, diameter 1
  const pools = {
    dirt: maakPool(scene, geometry, materials.dustDirt),
    grass: maakPool(scene, geometry, materials.dustGrass),
  };
  const alle = [pools.dirt, pools.grass]; // vaste lijst: Object.values() zou elk beeld een array maken
  const tellers = new Map(); // key -> { rest, laatste } (wordt één keer per moto aangemaakt)
  let tijd = 0;

  // Herbruikbare hulpobjecten: nooit nieuwe aanmaken tijdens het spelen.
  const matrix = new THREE.Matrix4();
  const positie = new THREE.Vector3();
  const schaal = new THREE.Vector3();
  const draai = new THREE.Quaternion(); // blijft identiteit

  function geefTeller(key) {
    let teller = tellers.get(key);
    if (!teller) {
      teller = { rest: 0, laatste: tijd };
      tellers.set(key, teller);
    }
    return teller;
  }

  // Zet één wolkje in het volgende vrije (of oudste) slot van de pool.
  function spawn(pool, p) {
    const i = pool.volgende;
    pool.volgende = (i + 1) % POOL_GROOTTE; // ringbuffer: overschrijft het oudste
    const j = i * 3;
    pool.pos[j] = p.x + (Math.random() - 0.5) * 2 * SPREIDING_POS;
    pool.pos[j + 1] = p.y + Math.random() * 0.1;
    pool.pos[j + 2] = p.z + (Math.random() - 0.5) * 2 * SPREIDING_POS;
    pool.vel[j] = (Math.random() - 0.5) * 2 * SPREIDING_SNELHEID;
    pool.vel[j + 1] = tussen(STIJGSNELHEID);
    pool.vel[j + 2] = (Math.random() - 0.5) * 2 * SPREIDING_SNELHEID;
    pool.leeftijd[i] = 0;
    pool.levensduur[i] = tussen(LEVENSDUUR);
    pool.grootte[i] = tussen(GROOTTE);
  }

  return {
    // position: Vector3 achter de moto; surface: "dirt" | "grass" (rest = niets);
    // intensity 0..1; key: wie roept aan (bv. de bike), voor een eigen teller.
    emit(position, surface, intensity, key = STANDAARD_KEY) {
      const pool = pools[surface];
      const teller = geefTeller(key);
      const verstreken = Math.min(tijd - teller.laatste, MAX_STAP);
      teller.laatste = tijd;
      if (!pool || !(intensity > 0)) return; // wegen e.d.: niets, en de teller loopt niet door
      teller.rest += Math.min(intensity, 1) * WOLKJES_PER_SECONDE * verstreken;
      while (teller.rest >= 1) {
        teller.rest -= 1;
        spawn(pool, position);
      }
    },

    // Elk beeld: wolkjes laten stijgen, groeien en krimpen.
    update(dt) {
      tijd += dt;
      for (let i = 0; i < alle.length; i++) updatePool(alle[i], dt);
    },

    dispose() {
      for (const pool of alle) {
        scene.remove(pool.mesh);
        pool.mesh.dispose();
      }
      geometry.dispose();
    },
  };

  function updatePool(pool, dt) {
    let veranderd = false;
    for (let i = 0; i < POOL_GROOTTE; i++) {
      const duur = pool.levensduur[i];
      if (duur === 0) continue; // vrij slot
      const j = i * 3;
      pool.leeftijd[i] += dt;
      const t = pool.leeftijd[i] / duur;
      if (t >= 1) {
        pool.levensduur[i] = 0; // dood: schaal 0 zodat hij onzichtbaar wordt
        schaal.set(0, 0, 0);
        positie.set(pool.pos[j], pool.pos[j + 1], pool.pos[j + 2]);
      } else {
        pool.pos[j] += pool.vel[j] * dt;
        pool.pos[j + 1] += pool.vel[j + 1] * dt;
        pool.pos[j + 2] += pool.vel[j + 2] * dt;
        positie.set(pool.pos[j], pool.pos[j + 1], pool.pos[j + 2]);
        schaal.setScalar(pool.grootte[i] * schaalVerloop(t));
      }
      matrix.compose(positie, draai, schaal);
      pool.mesh.setMatrixAt(i, matrix);
      veranderd = true;
    }
    pool.mesh.instanceMatrix.needsUpdate = veranderd;
  }
}

// Turbovlam van de moto (contract 08-G): twee gestileerde kegels die naar +Z wijzen.
// De geometrie wordt gedeeld door alle modellen; elke moto krijgt alleen eigen meshes.
import * as THREE from "three";

const LENGTE = 0.8; // meter bij scale.z = 1
let gedeeld = null; // { buiten, binnen }: 2 x 16 = 32 driehoeken

// Kegel met de basis op z = 0 en de punt op z = lengte (open basis: die ziet niemand).
function maakKegel(straal, lengte) {
  const kegel = new THREE.ConeGeometry(straal, lengte, 8, 1, true);
  kegel.rotateX(Math.PI / 2); // punt van +Y naar +Z
  kegel.translate(0, 0, lengte / 2); // basis op de uitlaat
  return kegel;
}

function getGeometrie() {
  gedeeld ??= { buiten: maakKegel(0.09, LENGTE), binnen: maakKegel(0.05, LENGTE * 0.6) };
  return gedeeld;
}

// Bouwt de vlam. pos = uitlaatmond [x, y, z]. Zonder flameCore: alleen de buitenkegel.
export function createBoostFlame(materials, pos) {
  const vlam = new THREE.Group();
  vlam.name = "boostFlame";
  vlam.position.set(...pos);
  vlam.visible = false;
  const geo = getGeometrie();
  const buiten = new THREE.Mesh(geo.buiten, materials.flame);
  buiten.castShadow = false;
  vlam.add(buiten);
  if (materials.flameCore) {
    const binnen = new THREE.Mesh(geo.binnen, materials.flameCore);
    binnen.castShadow = false;
    vlam.add(binnen);
  }
  return vlam;
}

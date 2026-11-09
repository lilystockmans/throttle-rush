// Turbovlam van de moto (contract 08-G, vergroot door 09-C): twee gestileerde kegels die naar +Z wijzen.
// De geometrie wordt gedeeld door alle modellen; elke moto krijgt alleen eigen meshes.
import * as THREE from "three";

const LENGTE = 1.3; // meter bij scale.z = 1 (goed zichtbaar van 7.5 m afstand)
const STRAAL_BUITEN = 0.13; // iets breder dan voorheen (0.09)
const STRAAL_BINNEN = 0.075; // heldere kern (voorheen 0.05)
const KERN_DEEL = 0.6; // kern is 60% zo lang als de buitenkegel
let gedeeld = null; // { buiten, binnen }: 2 x 16 = 32 driehoeken

// Kegel met de basis op z = 0 en de punt op z = lengte (open basis: die ziet niemand).
function maakKegel(straal, lengte) {
  const kegel = new THREE.ConeGeometry(straal, lengte, 8, 1, true);
  kegel.rotateX(Math.PI / 2); // punt van +Y naar +Z
  kegel.translate(0, 0, lengte / 2); // basis op de uitlaat
  return kegel;
}

function getGeometrie() {
  gedeeld ??= { buiten: maakKegel(STRAAL_BUITEN, LENGTE), binnen: maakKegel(STRAAL_BINNEN, LENGTE * KERN_DEEL) };
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

// Licht van het spel: zacht omgevingslicht (hemisphere) plus een zon die schaduw werpt.
// De schaduwkaart is maar 1024 pixels, dus de zon dekt alleen 60 x 60 m rond de speler
// en schuift elk beeld mee via lights.follow(position). Zo blijven de schaduwen scherp.
import * as THREE from "three";

// Zonrichting: het verschil tussen de zon en wat hij beschijnt. Hoge zon (ca. 57 graden) = korte, vrolijke schaduwen.
const SUN_OFFSET = new THREE.Vector3(-25, 45, -15);
const SUN_COLOR = 0xfff1d6; // warm wit
const SUN_INTENSITY = 2.0;
// Hemel- en grondkleur van het omgevingslicht: blauwige lucht boven, groene weerkaatsing van het gras onder.
const SKY_LIGHT = 0xbfe3ff;
const GROUND_LIGHT = 0x7bbf6a;
const AMBIENT_INTENSITY = 1.4;

const SHADOW_MAP_SIZE = 1024;
const SHADOW_AREA = 60; // breedte en hoogte van de schaduwzone in meter
const SHADOW_NEAR = 1;
const SHADOW_FAR = 140; // ruim: zon staat ~54 m weg, bomen steken wat boven de zone uit
// Kleine bias tegen "schaduwacne" (strepen op vlakke grond). normalBias werkt beter dan alleen bias
// op grote vlakke vlakken, want het schuift het opzoekpunt langs de normaal in plaats van in de diepte.
const SHADOW_BIAS = -0.0005;
const SHADOW_NORMAL_BIAS = 0.05;

export function setupLighting(scene, renderer) {
  // Schaduwen aan. PCFShadowMap: goedkoop en iets zacht aan de randen
  // (PCFSoftShadowMap is in nieuwe three.js-versies toch gelijk aan PCFShadowMap).
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Kleurruimte: sRGB is de standaard; we zetten het expliciet zodat de hex-kleuren van het palet
  // er op het scherm precies zo uitzien. Bewust GEEN toneMapping: dat zou de platte cartoonkleuren
  // dof en grijzig maken.
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const ambient = new THREE.HemisphereLight(SKY_LIGHT, GROUND_LIGHT, AMBIENT_INTENSITY);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(SUN_COLOR, SUN_INTENSITY);
  sun.castShadow = true;
  sun.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
  const half = SHADOW_AREA / 2;
  const cam = sun.shadow.camera;
  cam.left = -half;
  cam.right = half;
  cam.top = half;
  cam.bottom = -half;
  cam.near = SHADOW_NEAR;
  cam.far = SHADOW_FAR;
  cam.updateProjectionMatrix();
  sun.shadow.bias = SHADOW_BIAS;
  sun.shadow.normalBias = SHADOW_NORMAL_BIAS;

  // De zon kijkt naar zijn target; die moet in de scene zitten, anders wordt zijn positie nooit bijgewerkt.
  scene.add(sun);
  scene.add(sun.target);

  // Assen van de schaduwcamera, om het midden op het pixelraster van de schaduwkaart te leggen.
  const lightZ = SUN_OFFSET.clone().normalize(); // van doel naar zon
  const lightX = new THREE.Vector3(0, 1, 0).cross(lightZ).normalize();
  const lightY = new THREE.Vector3().crossVectors(lightZ, lightX);
  const texel = SHADOW_AREA / SHADOW_MAP_SIZE; // meter per schaduwpixel
  const snap = (v) => Math.round(v / texel) * texel;
  const center = new THREE.Vector3();

  function follow(position) {
    // Waarom snappen: schuift de schaduwzone in stukjes kleiner dan een pixel, dan "zwemmen" de
    // schaduwranden tijdens het rijden. Dus verplaats het midden alleen in hele schaduwpixels
    // (dwars op de zonrichting); langs de zonrichting maakt het niet uit.
    center
      .copy(lightX).multiplyScalar(snap(position.dot(lightX)))
      .addScaledVector(lightY, snap(position.dot(lightY)))
      .addScaledVector(lightZ, position.dot(lightZ));
    sun.target.position.copy(center);
    sun.position.copy(center).add(SUN_OFFSET);
    sun.target.updateMatrixWorld(); // meteen bijwerken, niet pas bij het volgende renderen
    sun.updateMatrixWorld();
  }
  follow(new THREE.Vector3(0, 0, 0)); // beginstand

  return { sun, ambient, follow };
}

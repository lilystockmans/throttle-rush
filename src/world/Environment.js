// Lucht, mist en grond van het spel.
// De lucht is een grote omgekeerde bol met een verloop van horizonkleur naar hemelblauw.
// De mist heeft dezelfde kleur als de horizon, dus ver weg vloeit de wereld zacht in de lucht op.
import * as THREE from "three";

const SKY_TOP = 0x3d9bf5; // diepblauw boven
const SKY_HORIZON = 0xcdeeff; // lichtblauw-wit aan de horizon; ook de mistkleur
const SKY_RADIUS = 380; // kleiner dan de kijkafstand van de camera (400 m), anders wordt de koepel afgesneden
const SKY_SEGMENTS_W = 24;
const SKY_SEGMENTS_H = 12;
const SKY_BLEND_HEIGHT = 0.55; // op welke hoogte (0 = horizon, 1 = recht omhoog) de lucht helemaal blauw is

const FOG_NEAR = 140; // tot hier helder
const FOG_FAR = 390; // vanaf hier helemaal dicht, dus ruim voor de 400 m kijkafstand
const GROUND_SIZE = 700;

const skyVertex = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position); // de koepel beweegt alleen mee, draait niet, dus lokaal = wereldrichting
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const skyFragment = `
  uniform vec3 topColor;
  uniform vec3 horizonColor;
  uniform float blendHeight;
  varying vec3 vDir;
  void main() {
    float t = smoothstep(0.0, blendHeight, vDir.y); // onder de horizon blijft het horizonkleur
    gl_FragColor = vec4(mix(horizonColor, topColor, t), 1.0);
    #include <colorspace_fragment>
  }
`;

function createSky() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(SKY_TOP) },
      horizonColor: { value: new THREE.Color(SKY_HORIZON) },
      blendHeight: { value: SKY_BLEND_HEIGHT },
    },
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    side: THREE.BackSide, // we kijken van binnenuit naar de bol
    fog: false, // anders zou de mist de lucht zelf wegkleuren
    depthWrite: false, // ligt achter alles, mag niets afdekken
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(SKY_RADIUS, SKY_SEGMENTS_W, SKY_SEGMENTS_H), material);
  sky.renderOrder = -1; // eerst tekenen
  sky.castShadow = false;
  sky.receiveShadow = false;
  sky.frustumCulled = false; // de camera zit altijd binnenin
  // De koepel volgt de camera vlak voor het tekenen. Zo zit de camera altijd in het midden en blijft
  // elk stuk lucht binnen 380 m, ook als de speler ver van (0,0,0) rijdt. De matrix moet hier
  // handmatig bijgewerkt worden, want three.js heeft zijn matrices dan al uitgerekend.
  sky.onBeforeRender = (renderer, scene, camera) => {
    sky.position.copy(camera.position);
    sky.updateMatrixWorld();
  };
  return sky;
}

export function createEnvironment(scene, materials) {
  // Achtergrondkleur als vangnet, voor het geval de koepel ooit niet getekend wordt.
  scene.background = new THREE.Color(SKY_HORIZON);
  scene.fog = new THREE.Fog(SKY_HORIZON, FOG_NEAR, FOG_FAR);

  const sky = createSky();
  scene.add(sky);

  // Grondvlak: een plat vlak, gedraaid zodat het horizontaal ligt (een PlaneGeometry staat standaard rechtop).
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE), materials.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  return { sky, ground };
}

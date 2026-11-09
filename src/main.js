// Startpunt van de game.
// Fase 0: een lege wereld met grond, lucht en een draaiende kubus.
// Dit bewijst dat three.js werkt, lokaal en op de publieke URL.

import * as THREE from "three";
import { createFpsMeter } from "./core/Debug.js";

// Renderer: tekent de 3D-wereld op een canvas.
// Pixel ratio begrenzen we op 1.5: scherp genoeg, en veel sneller op retina-schermen.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Scène met lichtblauwe lucht en mist in dezelfde kleur.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

// Camera: 1 eenheid = 1 meter. Y is omhoog.
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 3, 6);
camera.lookAt(0, 0.5, 0);

// Licht: één zon + zacht omgevingslicht.
scene.add(new THREE.HemisphereLight(0xffffff, 0x557744, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.5);
sun.position.set(10, 20, 10);
scene.add(sun);

// Grond.
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshLambertMaterial({ color: 0x5a9e4b })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Draaiende kubus.
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshLambertMaterial({ color: 0xff5533 })
);
cube.position.y = 0.5;
scene.add(cube);

// Venstergrootte aanpassen als het browservenster verandert.
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Hoofdlus: elk beeld de kubus een beetje draaien en tekenen.
const fps = createFpsMeter();
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  cube.rotation.y += dt;
  cube.rotation.x += dt * 0.5;
  renderer.render(scene, camera);
  fps.tick();
});

# Contract 03: materialen, licht, omgeving en 3D-wereld

Lees eerst `00-conventies.md`.

## A. Materialen: `src/render/materials.js` (maakt: shading)

```js
const materials = createMaterials();
```
Geeft één object terug met precies deze sleutels (allemaal `THREE.Material`):

| Sleutel | Waarvoor |
|---|---|
| `road` | asfalt |
| `roadLine` | witte lijnen en start/finish |
| `curbRed`, `curbWhite` | berm, afwisselende blokken |
| `dirt` | dirt-shortcut |
| `grass` | grond en gras |
| `treeTrunk`, `treeLeaves` | bomen |
| `cone` | verkeerskegels |
| `tire` | banden |
| `metal` | uitlaat, vork, stuur |
| `seat` | zadel |
| `riderSuit` | pak van de rijder |
| `helmetVisor` | vizier |

Plus één functie: `materials.paint(color)` geeft een gedeeld materiaal voor die kleur terug (zelfde kleur = zelfde object, voor prestatie). Voor kuip, tank en helm.

Alleen `MeshLambertMaterial` of `MeshToonMaterial`. Geen textures uit bestanden. Kleurrijke cartoonstijl.

## B. Licht: `src/render/lighting.js` (maakt: shading)

```js
const lights = setupLighting(scene, renderer);
lights.follow(position);   // elk beeld: schaduw-zone volgt de speler
```
- Eén zon (`DirectionalLight`) met schaduw, schaduwkaart maximaal 1024 x 1024. Schaduw-zone ongeveer 60 x 60 meter rond `position`.
- Zet zelf `renderer.shadowMap.enabled` en het schaduwtype.
- Plus zacht omgevingslicht.

## C. Omgeving: `src/world/Environment.js` (maakt: shading)

```js
createEnvironment(scene, materials);
```
Lucht (achtergrondkleur of eenvoudige verloop-koepel), mist, en een grondvlak van 700 x 700 meter op y = 0 met `materials.grass`, `receiveShadow = true`. Kijkafstand van de camera is 400 meter: mist moet daarvoor dicht zijn.

## D. Wegmesh: `src/world/trackMesh.js` (maakt: 3D-modelleur)

```js
scene.add(buildTrackMesh(track, materials));
```
- Gebruikt alleen `track.sampleFrames`, `track.sampleShortcutFrames`, `track.roadWidth`, `track.curbWidth`, `track.shortcutWidth` uit contract 01.
- Asfalt-strook, berm aan beide kanten (rood-wit blokken), middenstreep of randlijnen, start/finish-lijn bij `t = 0` (het eerste frame), dirt-strook voor de shortcut.
- Alles plat, net boven de grond om flikkeren te vermijden: dirt op y = 0.01, asfalt op y = 0.02, berm en lijnen op y = 0.03.
- `receiveShadow = true`. Zo weinig mogelijk aparte meshes (samenvoegen waar kan).

## E. Decor: `src/world/props.js` (maakt: 3D-modelleur)

```js
scene.add(createProps(track, materials));
```
- Bomen en kegels via `THREE.InstancedMesh`. Ongeveer 300 bomen, 60 kegels.
- Plaats niets waar `track.getSurfaceAt(x, z)` iets anders dan `"grass"` geeft, en houd 6 meter vrij naast asfalt en dirt.
- Kegels in groepjes aan de buitenkant van bochten.
- Vaste willekeur (zelfde plaatsing bij elke start), bijvoorbeeld een eigen eenvoudige random-functie met vaste startwaarde.

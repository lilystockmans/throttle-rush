# Contract 02: moto, besturing en camera

Lees eerst `00-conventies.md`.

## Richting en overhellen (voor iedereen)
- `heading` in radialen. `heading = 0` betekent: rijdt naar -Z.
- Vooruit-vector: `(-sin(heading), 0, -cos(heading))`.
- Een 3D-object met `rotation.y = heading` staat dus goed gedraaid.
- Naar rechts sturen = `heading` wordt kleiner.
- `lean` in radialen. Het 3D-model zet `leanPivot.rotation.z = lean`. Naar rechts overhellen = negatieve `lean`.

## A. Motortypes: `src/bikes/bikeTypes.js` (maakt: game designer)

Alleen data. Alle drie de types nu al invullen, ook al rijdt fase 1 alleen met `sport`.

```js
export const BIKE_TYPES = {
  sport: {
    label: "string",          // naam in het menu
    color: 0xrrggbb,          // standaardkleur
    topSpeed: 0,              // m/s op asfalt
    acceleration: 0,          // m/s² bij vol gas
    braking: 0,               // m/s² bij vol remmen
    turnRate: 0,              // rad/s sturen bij lage snelheid
    turnRateAtTop: 0,         // rad/s sturen bij topsnelheid
    maxLean: 0,               // rad, maximaal overhellen
    mass: 0,                  // kg, telt bij botsingen (fase 5)
    // Per ondergrond: speed = factor op topSpeed, grip = factor op sturen en optrekken.
    surface: {
      road:  { speed: 1, grip: 1 },
      curb:  { speed: 0, grip: 0 },
      dirt:  { speed: 0, grip: 0 },
      grass: { speed: 0, grip: 0 },
    },
    ability: { kind: "turbo" | "shove" | "offroad", cooldown: 0, duration: 0, strength: 0 },
  },
  cross:   { ...zelfde velden },
  cruiser: { ...zelfde velden },
};
```

## B. Instelbare getallen: `src/config.js` (maakt: game designer)

```js
export const CONFIG = {
  physicsStep: 1 / 60,       // seconden per fysica-stap
  coastDecel: 0,             // m/s² vertraging zonder gas
  reverseSpeed: 0,           // m/s maximaal achteruit
  resetBelowSpeed: 0,        // m/s: onder deze snelheid mag "R" je terugzetten
  camera: {
    fov: 0,                  // graden
    distance: 0,             // meter achter de moto
    height: 0,               // meter boven de grond
    lookAhead: 0,            // meter vóór de moto waar de camera naar kijkt
    followSharpness: 0,      // hoe snel de camera volgt (hoger = strakker)
    speedFovBoost: 0,        // extra graden fov bij topsnelheid
  },
};
```

## C. Toetsenbord: `src/core/Input.js` (maakt: coder)

```js
const input = createInput();
const controls = input.read();
// { throttle: 0..1, brake: 0..1, steer: -1..1 (+1 = rechts), action: bool, reset: bool }
```
Toetsen: pijl omhoog of W = gas. Pijl omlaag of S = remmen, en achteruit bij stilstand. Pijl links of A, pijl rechts of D = sturen. Spatie = speciale knop. R = terug op de baan.

## D. Fysica: `src/bikes/Bike.js` (maakt: coder)

```js
const bike = new Bike(BIKE_TYPES.sport, track);
bike.resetTo(track.getStartTransform(0));
bike.update(dt, controls);   // dt = CONFIG.physicsStep
```
Leesbare toestand na elke `update`:

| Veld | Wat |
|---|---|
| `bike.position` | `THREE.Vector3`, y = 0 |
| `bike.heading` | rad, zie boven |
| `bike.speed` | m/s, negatief = achteruit |
| `bike.lean` | rad, zie boven |
| `bike.surface` | huidige ondergrond van `track.getSurfaceAt` |
| `bike.type` | het object uit `BIKE_TYPES` |

Arcade-gedrag, geen echte fysica-bibliotheek. Sturen werkt alleen als de moto beweegt. Topsnelheid en grip volgen de ondergrond. Met `reset` zet de moto zich op het dichtste punt van de middenlijn, in de rijrichting, snelheid 0.

## E. Vaste fysica-stap: `src/core/GameLoop.js` (maakt: coder)

```js
startGameLoop({ update(dt) {}, render(dt) {} });
```
`update` wordt een vast aantal keer per seconde aangeroepen (`CONFIG.physicsStep`), los van de beeldsnelheid. Maximaal 5 inhaalstappen per beeld. `render` één keer per beeld met de echte verstreken tijd.

## F. Camera: `src/camera/ChaseCamera.js` (maakt: coder)

```js
const chase = new ChaseCamera(camera);       // THREE.PerspectiveCamera
chase.snapTo(bike);                          // direct op de juiste plek
chase.update(dt, bike);                      // elk beeld: zacht volgen
```
Gebruikt `CONFIG.camera`. Leest `bike.position`, `bike.heading`, `bike.speed`, `bike.type.topSpeed`.

## G. 3D-model: `src/bikes/BikeModel.js` (maakt: 3D-modelleur)

```js
const model = createBikeModel({ type: "sport", color: 0xff3344, materials });
scene.add(model);
```
- Geeft een `THREE.Group` terug. Rijder zit erop.
- Oorsprong = op de grond, midden tussen de wielen. Voorkant naar -Z. Lengte ongeveer 2 meter.
- Kinderen met vaste namen (vind ze met `model.getObjectByName`):
  - `leanPivot`: alles wat overhelt (moto + rijder). Draaipunt op de grond.
  - `wheelFront`, `wheelBack`: wielen. Draaien rond hun lokale X-as.
- `model.userData.wheelRadius` = straal van de wielen in meter.
- Drie verschillende vormen voor `"sport"`, `"cross"`, `"cruiser"`. Je herkent ze van ver.
- Moto en rijder: `castShadow = true`.
- Maximaal ongeveer 1500 driehoeken per moto.

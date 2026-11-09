# Contract 06: race-logica, race-interface en startportaal (fase 3)

Lees eerst `00-conventies.md`. Track-API: zie `01-circuit.md` deel B.

## A. Race-instellingen: uitbreiding van `src/config.js` (maakt: game designer)

```js
CONFIG.race = {
  laps: 3,                 // aantal ronden
  countdownSeconds: 3,     // 3, 2, 1, dan GO
  checkpointCount: 4,      // controlepunten per ronde (buiten de shortcut)
};
```

## B. Race-logica: `src/race/RaceManager.js` (maakt: coder)

Werkt voor 1 tot 6 rijders. In fase 3 is er 1 rijder, in fase 4 komen er 5 computer-rijders bij.

```js
const race = new RaceManager(track);
race.addRider("player", bike);        // bike = object met .position (THREE.Vector3)
race.start();                         // zet alles op nul en start het aftellen
race.update(dt);                      // elke fysica-stap
race.onEvent((e) => {});              // luisteraar voor gebeurtenissen (zie onder)
```

Leesbare toestand:

| Naam | Wat |
|---|---|
| `race.state` | `"countdown"`, `"racing"` of `"finished"` (= alle rijders over de finish) |
| `race.countdownLeft` | seconden tot GO (alleen tijdens `"countdown"`) |
| `race.canMove()` | `false` tijdens het aftellen, anders `true` |
| `race.raceTime` | seconden sinds GO |
| `race.getRider(id)` | `{ lap, lapTimes, currentLapTime, bestLap, totalTime, finished, position }` |
| `race.getStandings()` | lijst van id's, eerste plaats eerst |

- `lap` begint op 1 bij GO. `lapTimes` = lijst van afgewerkte rondetijden in seconden. `bestLap` = kortste, of `null`. `totalTime` = tijd tot de finish, of `null`. `position` = 1 tot aantal rijders.
- De startplekken liggen net vóór de start/finish-lijn (`t = 0`). De eerste keer over de lijn na GO telt niet als ronde.

Gebeurtenissen (`onEvent`):

| `e.type` | Velden | Wanneer |
|---|---|---|
| `"countdown"` | `value`: 3, 2, 1 of `"GO"` | bij elke tel en bij GO |
| `"lap"` | `id`, `lap` (nieuwe ronde), `lapTime` | een rijder begint een nieuwe ronde |
| `"finalLap"` | `id` | een rijder begint de laatste ronde |
| `"finish"` | `id`, `position`, `totalTime` | een rijder is over de finish |
| `"raceEnd"` | - | alle rijders zijn over de finish |

Controlepunten (tegen valsspelen):
- Een ronde telt alleen als de rijder alle controlepunten van die ronde in volgorde passeerde.
- De shortcut MOET geldig zijn. Bereken het stuk dat de shortcut overslaat: `tA = track.getNearest(begin van shortcut).t` en `tB = track.getNearest(einde van shortcut).t` (gebruik `track.sampleShortcutFrames(2)` voor begin en einde). Leg alle controlepunten buiten het stuk van `tA` tot `tB`, gelijk verdeeld over de rest van de ronde.
- Een controlepunt is gepasseerd als de `t` van de rijder van net vóór het punt naar net erna gaat (vooruit), binnen een venster van 30 meter.
- Positie: wie meer ronden en controlepunten heeft, staat voor. Bij gelijkstand telt de `t` binnen de ronde. Wie gefinisht is, houdt zijn finishplaats.

## C. Race-interface: `src/ui/RaceUI.js` (maakt: UX/UI)

```js
const raceUI = createRaceUI({ onRestart() {}, onMenu() {} });
raceUI.setVisible(true | false);
raceUI.showCountdown(value);            // 3, 2, 1 of "GO": groot in het midden, verdwijnt vanzelf na ~0.8 s
raceUI.setLap(current, total);          // "Ronde 2/3"
raceUI.setTimes(currentLapSec, bestLapSec);   // bestLapSec mag null zijn
raceUI.setPosition(position, total);    // "1e / 6"; verbergen als total === 1
raceUI.flash(text);                     // korte melding in het midden, bv. "Laatste ronde!"
raceUI.showFinish({ position, total, totalTime, lapTimes, bestLap, bikeLabel });
raceUI.hideFinish();
```
- Tijdformaat overal: `m:ss.cc` (bijvoorbeeld `1:02.35`).
- Ronde, tijden en positie linksboven. De snelheidsmeter (rechtsonder) en de besturingsuitleg (linksonder) bestaan al: niet overlappen.
- `setTimes` wordt elk beeld aangeroepen: alleen de DOM aanpassen als de getoonde tekst verandert.
- Finish-scherm in het midden: plaats, totale tijd, elke rondetijd (beste ronde gemarkeerd), naam van de moto. Twee knoppen: "Opnieuw" (Enter of R) en "Andere moto" (Esc). Die roepen `onRestart` en `onMenu`. Toetsen alleen actief zolang het finish-scherm open is.
- Kleine schermen: zoals contract 05 (768 x 500 zonder overlap).

## D. Startportaal: `src/world/startGantry.js` (maakt: 3D-modelleur)

```js
const gantry = createStartGantry(track, materials);
scene.add(gantry);
gantry.userData.setLights(count, color);  // count = 0..3 lampen aan, color = getal (bv. 0xff2222)
```
- Een boog of brug over het asfalt op de start/finish-lijn (het eerste frame van `track.sampleFrames`), met een spandoek "THROTTLE RUSH" mag als eenvoudige vorm (geen tekst-textures nodig; kleurvlakken volstaan).
- Drie ronde lampen naast elkaar boven het midden, goed zichtbaar vanuit de camera achter de startrij (camera ongeveer 7.5 m achter en 3.2 m boven de moto).
- Lampen hebben elk een eigen materiaal (kloon van `materials.tire`) zodat `setLights` ze los kan aanzetten via `color` en `emissive`. Uit = donker.
- Poten naast de berm, niet op het asfalt. Hoogte onderkant boog minstens 5 meter.
- Maximaal ongeveer 800 driehoeken, `castShadow = true`.

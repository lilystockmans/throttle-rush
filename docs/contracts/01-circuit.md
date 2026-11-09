# Contract 01: het circuit

Lees eerst `00-conventies.md`.

## A. Circuit-data: `src/world/trackData.js` (maakt: game designer)

Alleen data, geen logica. Exporteert precies dit:

```js
export const TRACK = {
  name: "string",
  // Middenlijn van het circuit als gesloten lus. [x, z] in meter.
  // 12 tot 24 punten. Rijrichting = volgorde van de punten.
  // Alle punten tussen -250 en +250 op x en z.
  points: [[x, z], ...],
  roadWidth: 14,     // breedte asfalt in meter (totaal, links + rechts)
  curbWidth: 1.5,    // breedte berm aan elke kant, direct naast het asfalt
  // Dirt-shortcut: open pad door het binnenveld.
  // Eerste en laatste punt liggen OP de middenlijn van het circuit.
  shortcut: {
    points: [[x, z], ...],   // 3 tot 8 punten
    width: 7,
  },
};
```

Regels voor de vorm:
- Lengte van één ronde: 900 tot 1300 meter.
- Bochten niet scherper dan een straal van ongeveer 25 meter.
- Het circuit mag zichzelf niet kruisen. Twee delen van het asfalt liggen minstens 40 meter uit elkaar.
- De shortcut is 30 tot 40 procent korter dan het stuk asfalt dat hij overslaat.

## B. Track-logica: `src/world/Track.js` (maakt: coder)

```js
import { Track } from "./world/Track.js";
const track = new Track(TRACK);   // TRACK uit trackData.js
```

Een `Track` biedt:

| Naam | Wat |
|---|---|
| `track.length` | lengte van één ronde in meter |
| `track.roadWidth`, `track.curbWidth` | kopie uit de data |
| `track.shortcutWidth` | kopie van `shortcut.width` |
| `track.sampleFrames(count)` | lijst van `count` punten, gelijk verdeeld over de ronde. Elk punt: `{ position, tangent, right }`. `position` is een `THREE.Vector3` met y = 0. `tangent` is de rijrichting (lengte 1). `right` wijst naar rechts van de rijrichting (lengte 1, `tangent × omhoog`). Het laatste punt is niet gelijk aan het eerste. |
| `track.sampleShortcutFrames(count)` | zelfde vorm, maar voor het open shortcut-pad. Eerste en laatste punt zijn begin en einde van het pad. |
| `track.getNearest(x, z)` | `{ t, lateral, position, tangent }`. `t` = voortgang in de ronde, 0 tot 1. `lateral` = afstand tot de middenlijn in meter, positief = rechts. `position` en `tangent` van het dichtste punt op de middenlijn. |
| `track.getSurfaceAt(x, z)` | `"road"`, `"curb"`, `"dirt"` of `"grass"`. Asfalt als `abs(lateral) <= roadWidth/2`. Berm als daarbuiten maar binnen `curbWidth`. Dirt als binnen `width/2` van het shortcut-pad. Anders gras. Asfalt en berm winnen van dirt. |
| `track.getStartTransform(slot)` | `{ position, heading }` voor startplek 0 tot 5. Twee rijen van drie, net vóór t = 0, rijdend in de rijrichting. |

- `getNearest` en `getSurfaceAt` worden 6 keer per fysica-stap aangeroepen (60 keer per seconde). Ze moeten snel zijn: vooraf bemonsterde punten, geen zware zoektocht.
- `heading` volgt contract 02.

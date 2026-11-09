# Contract 07: computer-tegenstanders (fase 4)

Lees eerst `00-conventies.md`. Track-API: `01-circuit.md` deel B. Moto en besturing: `02-moto-en-besturing.md`.

## A. Tegenstanders: `src/race/opponents.js` (maakt: game designer)

Alleen data.

```js
export const OPPONENTS = [
  {
    name: "string",          // naam van de rijder, eigen verzinsel
    typeKey: "sport" | "cross" | "cruiser",
    color: 0xrrggbb,         // kleur van moto en helm, goed te onderscheiden van de speler
    skill: 0.9,              // 0.80 tot 1.00: hoe dicht de rijder bij de ideale snelheid rijdt
    line: 0,                 // meter, voorkeurslijn naast de middenlijn (-4 tot +4, + = rechts)
    useShortcut: false,      // neemt deze rijder de dirt-shortcut?
  },
  // ... precies 5 rijders
];
```
- Gemengde types: minstens 1 van elk type. Elke cross neemt de shortcut, sport en cruiser niet.
- De kleuren mogen niet lijken op de standaardkleur van het type dat de speler kiest (zie `color` in `bikeTypes.js`).
- Spreiding van `skill` zo dat een gemiddelde speler ergens in het midden eindigt en een goede speler kan winnen.

## B. Computer-bestuurder: `src/race/AIDriver.js` (maakt: coder)

```js
const ai = new AIDriver({ track, bike, skill, line, useShortcut });
const controls = ai.getControls();   // elke fysica-stap, zelfde vorm als input.read()
```
- `controls` = `{ throttle, brake, steer, action, reset }` (contract 02-C). `action` is altijd `false` in fase 4.
- Volgt de middenlijn met een zijwaartse verschuiving `line`. Die mag langzaam een beetje schommelen (±1 m) zodat rijders niet als een trein rijden.
- Remt vóór bochten: kijkt vooruit langs de baan en bepaalt een veilige bochtsnelheid uit de kromming en de stuurkracht van `bike.type` (zie contract 02-A). `skill` vermenigvuldigt die doelsnelheid en ook de topsnelheid op rechte stukken.
- `useShortcut: true`: rijdt het shortcut-pad (`track.sampleShortcutFrames`) als hij bij het begin ervan komt, en sluit daarna weer aan op de baan.
- Vastgereden of ver van de baan en traag: geeft `reset: true` (de moto zet zichzelf dan terug, zie contract 02-D).
- Gebruikt alleen de openbare velden van `bike` uit contract 02-D en de Track-API. Geen toegang tot andere rijders in fase 4 (botsingen komen in fase 5).
- Snel: 6 bestuurders samen, 60 keer per seconde.

## C. Finish-scherm met klassement: uitbreiding van `src/ui/RaceUI.js` (maakt: UX/UI)

```js
raceUI.showFinish({ position, total, totalTime, lapTimes, bestLap, bikeLabel, standings });
```
- `standings` (optioneel) = lijst in volgorde van plaats: `{ name, bikeLabel, color, time, isPlayer }`. `time` = totale tijd in seconden, of `null` als die rijder nog niet binnen is (toon dan "rijdt nog").
- Toon het klassement naast of onder de rondetijden. De speler is duidelijk gemarkeerd. Kleurbolletje in `color`.
- Nieuw: `raceUI.updateStandings(standings)`: werkt het klassement bij terwijl het finish-scherm open is (andere rijders komen nog binnen). Alleen DOM wijzigen als er iets veranderd is.
- Moet blijven passen op 768 x 500 (mag scrollen binnen de kaart).

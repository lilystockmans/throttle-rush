# Contract 10: minimap (fase 8)

Lees eerst `00-conventies.md`.

Doel: tijdens de race zie je de vorm van het circuit en waar jij en de 5 tegenstanders rijden.

## A. Minimap: `src/ui/Minimap.js` + `src/ui/minimap.css` (maakt: UX/UI)

```js
const minimap = createMinimap({ main, shortcut });   // 1 keer, bij het opstarten van de game
minimap.update(riders);                              // elk beeld, alleen als de race loopt
minimap.setVisible(true | false);                    // true bij race-start, false in het menu
```

### Invoer
- `main` = lijst punten van de hoofdbaan, `shortcut` = lijst punten van de aarden shortcut.
  Elk punt: `{ x, z }` in meter. De wereld ligt ongeveer tussen -250 en +250 m, maar reken zelf de grenzen uit
  (kleinste en grootste x en z van alle punten) en laat een rand vrij zodat de dikke lijn niet wordt afgesneden.
- `main` is een gesloten lus (het laatste punt sluit weer aan op het eerste). `shortcut` is een open lijn van begin tot eind.
- Het eerste punt van `main` ligt precies op de start/finish-lijn. Het tweede punt ligt in de rijrichting.
  Teken de lijn dwars op de baan, door het eerste punt, loodrecht op de richting van punt 1 naar punt 2.
- `riders` (voor `update`) = lijst, speler eerst: `{ color, x, z, heading, isPlayer }`.
  - `color` = getal zoals `0xd9269d` (rood-groen-blauw in een getal).
  - `x`, `z` = plek in meter.
  - `heading` = rijrichting in radialen. **Heading 0 = rijdt naar -Z.** Vooruit is dus de vector `(-sin(heading), -cos(heading))` in (x, z).
  - `isPlayer` = true voor precies één rijder.

### Wat je tekent
- Een vierkant `<canvas>` in `<div id="ui">`. Noord boven: +x naar rechts, +z naar beneden (zoals de bovenkant van de wereld, dus geen draaiende kaart).
- Eén keer (bij het maken, en opnieuw als de canvas-grootte verandert) teken je de baan naar een **offscreen canvas**:
  - paneel-achtergrond en rand in de stijl van de rest van de interface (`--ui-panel`, `--ui-accent`, `--ui-radius` uit `styles.css`),
  - de hoofdbaan als dikke lijn (ongeveer 7 % van de kaartbreedte) in lichte kleur met een donkere rand eromheen,
  - de shortcut als dunnere lijn in een andere kleur: aarde-oranje (`--surface-dirt`, `#d98c4a`) met stippellijn of effen, jouw keuze,
  - de start/finish-lijn: een korte witte lijn met zwarte blokjes (of effen wit met zwarte rand), dwars op de baan.
- Elk beeld: kopieer het offscreen canvas met één `drawImage` en teken daarna alleen de stippen:
  - tegenstanders: ronde stip, straal ongeveer 4 px, kleur van de rijder, dunne donkere rand,
  - speler: groter (ongeveer 7 px), witte rand en een pijl-punt in de rijrichting, zodat je jezelf meteen ziet. De speler wordt **als laatste** getekend (bovenop de rest).
- Per beeld mag je **geen** nieuwe objecten, canvassen of lijsten maken. Geen `getImageData`. Geen lange `for`-ketens over de baan.
- `update` mag veilig vaker aangeroepen worden, ook als `setVisible(false)` is gezet (dan doet het niets).
- Beginstand na het maken: onzichtbaar. `setVisible(false)` verbergt met de CSS-klasse `is-hidden` (zoals de HUD) en doet dan ook geen tekenwerk.

### Plek en grootte (geen overlap!)
Rechts, direct onder het geluidsknopje (rechtsboven). Pas deze regels toe in `minimap.css`:
- Groot scherm (breedte >= 1000 en hoogte >= 650): vierkant van **170 px**. Bovenkant op `calc(var(--ui-gap) + 44px + 10px)`. Rechts op `var(--ui-gap)`.
- Klein scherm (`@media (max-width: 999px), (max-height: 649px)`): vierkant van **120 px**. Bovenkant op `calc(var(--ui-gap) + 36px + 8px)`.
- De minimap moet vrij blijven van:
  - de snelheidsmeter (HUD) rechtsonder,
  - het race-paneel linksboven (begint op 44 px van boven, links),
  - het geluidsknopje rechtsboven (44 px, op kleine schermen 36 px),
  - de besturingsuitleg linksonder.
  Controleer dit op **1280 x 720** en **768 x 500**.
- `pointer-events: none` (de minimap vangt nooit een klik of toets af). Hij hoeft geen toetsen te kennen.
- Scherp op een scherm met hoge dichtheid: zet `canvas.width/height` op grootte x `devicePixelRatio` (maximaal 2) en schaal de tekening.
- Respecteer `prefers-reduced-motion` (er is geen animatie nodig, dus doe niets nieuws).

### Stijl
- Kleurrijke low-poly cartoonstijl, platte kleuren, zoals de rest. Gebruik de CSS-variabelen uit `styles.css`.
- Geen namen of looks uit bestaande games.

## B. Koppeling (maakt: architect, niet de specialist)
- `src/main.js` maakt de minimap 1 keer uit `track.sampleFrames(N)` en `track.sampleShortcutFrames(N)` en zet hem aan bij `startRace`, uit bij `openMenu`.
- `src/game/RaceSession.js` roept `minimap.update(...)` elk beeld aan in `render(dt)`, met een lijst die hergebruikt wordt (geen nieuwe lijst per beeld).
- `index.html` laadt `src/ui/minimap.css`.

## C. Klaar als
- Op 1280 x 720 en 768 x 500 overlapt de minimap niets.
- In het menu is hij niet te zien.
- Het bestand blijft onder ongeveer 250 regels, met Nederlands commentaar bovenaan.
- Eindverslag van de specialist: wat gemaakt, wat hij nodig had maar niet in dit contract stond.

# Contract 11: telefoon en aanraakbediening (fase 9)

Lees eerst `00-conventies.md`. Doel: de game is speelbaar op een telefoon (liggend scherm) met alleen aanraking.

## A. Aanraakknoppen: `src/ui/touchControls.js` + `src/ui/touch.css` (maakt: UX/UI)

```js
import { isTouchDevice, createTouchControls } from "./touchControls.js";

isTouchDevice();   // true als het scherm aanraking als hoofdinvoer heeft: matchMedia("(pointer: coarse)").matches
const touch = createTouchControls({
  onChange(state),   // state = { throttle, brake, steer, action, reset }, zelfde vorm als Input.read()
  onMenu(),          // knop "Menu" is getikt (zelfde als Esc)
});
touch.setVisible(true | false);   // true bij race-start, false in het menu
```

- `createTouchControls` doet niets (geeft een lege dummy terug met `setVisible`) als `isTouchDevice()` false is. Zet bij een aanraakscherm de klasse `is-touch` op `document.documentElement`.
- `state`: `throttle` 0 of 1, `brake` 0 of 1, `steer` -1 (links), 0 of 1 (rechts), `action` true zolang de knop vast is, `reset` true zolang de knop vast is.
- `onChange` wordt alleen aangeroepen als de stand echt verandert (niet elk beeld).

### Knoppen
Gebruik **Pointer Events** (`pointerdown`, `pointerup`, `pointercancel`, `pointerleave`) met `setPointerCapture`, zodat elke vinger zijn eigen knop onthoudt. Meerdere vingers tegelijk moet werken (sturen met links, gas met rechts).
- **Links onderin:** twee grote knoppen naast elkaar, pijl links en pijl rechts (`steer`).
- **Rechts onderin:** een grote **Gas**-knop (onderaan, rechts). Boven of links ervan een kleinere **Rem** en een ronde **Speciaal**-knop (`action`).
- **Midden bovenin:** twee kleine knopjes: "Terug op baan" (`reset`) en "Menu" (`onMenu`).
- Knoppen zijn halfdoorzichtig in de stijl van de rest (`--ui-panel`, `--ui-accent`), met een duidelijk "ingedrukt"-effect. Minimale tikdoel 56 px, gas minimaal 80 px.
- Maten schalen mee met de hoogte (`vh`/`clamp`), zodat ze op 375 px hoogte nog passen.
- Verwijder alle luisteraars en elementen netjes als de functie nog eens wordt aangeroepen.
- Als de pagina op de achtergrond gaat (`visibilitychange`, `blur`) of een `pointercancel` komt: alles loslaten en `onChange` met nullen.
- Knoppen tonen niets in het menu (`setVisible(false)`, klasse `is-hidden`).
- `touch-action: none`, `user-select: none`, `-webkit-touch-callout: none`, `-webkit-tap-highlight-color: transparent` op de knoppen.

### Draai-melding
- Bij `is-touch` en **staand** scherm (`orientation: portrait`): een scherm over alles heen met tekst "Draai je telefoon" en een draaiend-telefoon-icoon (CSS/Unicode). Het blokkeert aanraking (`pointer-events: auto`), zodat niemand per ongeluk tikt. Liggend: weg.
- Het element zit in `touchControls.js` (maakt het zelf aan, ook als het menu open is).

### Layout bij `is-touch` (alleen in `touch.css`, niet in andere CSS-bestanden)
Bestaande onderdelen verplaatsen zodat niets overlapt. De bestaande klassen zijn: `.hud` (snelheidsmeter, nu rechtsonder, 160 px breed op klein scherm), `.hint` (besturingsuitleg linksonder), `.minimap` (rechts, top 56 px, 120 px groot), `.race-panel` (linksboven, vanaf 44 px), `.sound-toggle` (rechtsboven, 36 px).
- `.hud` naar **onderin het midden** (`left: 50%; right: auto; transform: translateX(-50%)`). Mag `!important` gebruiken waar nodig om de standaard te overschrijven.
- `.hint` (toetsenuitleg) niet tonen: `display: none`.
- Niets mag overlappen, op **844 x 390** en **667 x 375** (liggend).

## B. Invoer: `src/core/Input.js` (maakt: coder)
Voeg toe aan het object dat `createInput` teruggeeft:
```js
input.setTouch({ throttle, brake, steer, action, reset });   // overschrijft niets, voegt toe aan het toetsenbord
```
- `read()` combineert toetsenbord en aanraking: `throttle`/`brake`/`action`/`reset` = toets **of** touch; `steer` = som van toets en touch, afgekapt op -1..1.
- Zonder `setTouch` gedraagt `read()` zich precies als nu. Het bestand blijft onder ~100 regels.
- Geen andere bestanden aanpassen.

## C. Koppeling (maakt: architect)
- `main.js`: maakt `createTouchControls` met `onChange: input.setTouch` en `onMenu` = `openMenu` (alleen als de race loopt en niet is afgelopen); zet touch aan bij `startRace`, uit bij `openMenu`. `audio.unlock()` ook bij `pointerdown`.
- `controlsHint.js` en menu-tekst ("Kies met ← →, start met Enter") worden op een aanraakscherm aangepast: "Tik op een moto om te starten".
- `index.html`: `viewport-fit=cover`, `user-scalable=no`, `touch-action: none` op de body, `touch.css` laden.
- Finish-scherm: knoppen blijven klikbaar (tik).

## D. Klaar als
- Op 844 x 390 en 667 x 375 liggend: alle knoppen bereikbaar, niets overlapt met HUD, race-paneel, minimap, geluidsknop.
- Toetsenbord op laptop werkt als voorheen en de touch-knoppen zijn daar onzichtbaar.
- Staand scherm toont "Draai je telefoon".
- Bestanden onder ~250 regels, Nederlands commentaar bovenaan, geen emoji of em dashes in de tekst.
- Eindverslag per specialist: wat gemaakt, wat ze nodig hadden maar niet in het contract stond.

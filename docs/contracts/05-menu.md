# Contract 05: keuzemenu en HUD-uitbreiding (fase 2)

Lees eerst `00-conventies.md` en `04-ui.md`.

## Gegevens die je krijgt
`bikeTypes` heeft deze vorm (uit `src/bikes/bikeTypes.js`, je krijgt het object als parameter, je importeert het niet zelf):

```js
{
  sport:   { label, color, topSpeed, acceleration, braking, turnRate, turnRateAtTop, maxLean, mass,
             surface: { road: {speed, grip}, curb: {...}, dirt: {...}, grass: {...} },
             ability: { kind: "turbo" | "shove" | "offroad", cooldown, duration, strength } },
  cross:   { ...zelfde velden },
  cruiser: { ...zelfde velden },
}
```
- `label` = naam in het menu. `color` = getal zoals `0xff3344`.
- Snelheden in m/s, `mass` in kg, `turnRateAtTop` in rad/s.

## Keuzemenu: `src/ui/BikeMenu.js` (maakt: UX/UI)

```js
const menu = createBikeMenu({
  bikeTypes,                 // object hierboven
  onHover(key) {},           // "sport" | "cross" | "cruiser": speler bekijkt deze moto
  onChoose(key) {},          // speler start met deze moto
});
menu.show("sport");          // toon menu, deze moto staat geselecteerd
menu.hide();
menu.isOpen();               // true of false
```

- Titel van de game ("Throttle Rush") bovenaan.
- Drie kaarten naast elkaar, in de volgorde sport, cross, cruiser. Per kaart:
  - `label` en een kleurband in `color`.
  - Een korte zin wat de moto goed kan (jij schrijft die tekst, per sleutel).
  - Vier balken, berekend uit de data. Elke balk = waarde gedeeld door de hoogste waarde van de drie types:
    - Snelheid: `topSpeed`.
    - Offroad: gemiddelde van `surface.dirt.speed` en `surface.grass.speed`.
    - Wendbaar: `turnRateAtTop`.
    - Gewicht: `mass`.
  - Speciale knop: `ability.kind` vertaald: turbo = "Turbo", offroad = "Offroad-boost", shove = "Zijduw".
- Bediening: pijl links/rechts of A/D wisselt de selectie, Enter of spatie start. Klikken op een kaart selecteert, klikken op de geselecteerde kaart (of een startknop) start.
- Bij elke wissel van selectie: `onHover(key)`. Bij start: `onChoose(key)`, daarna verbergt het menu zichzelf.
- De achtergrond van het menu is half doorzichtig: het 3D-beeld (de gekozen moto, draaiend in beeld) moet zichtbaar blijven, vooral in het midden boven de kaarten. Zet de kaarten onderaan het scherm.
- Toetsen die het menu gebruikt mogen niet doorlopen naar de game (`stopPropagation` is niet genoeg, want de game luistert op `window`: de game negeert zelf invoer zolang `menu.isOpen()` true is; jij hoeft daar niets voor te doen).

## HUD: uitbreiding van `src/ui/HUD.js` (maakt: UX/UI)

```js
hud.setVisible(true | false);   // verbergt of toont de snelheidsmeter
```

## Besturingsuitleg: uitbreiding van `src/ui/controlsHint.js` (maakt: UX/UI)
- Extra regel: Esc = terug naar het menu.
- `showControlsHint()` mag meerdere keren aangeroepen worden (na elke start). Een vorig paneel wordt eerst verwijderd.

## Kleine schermen
- In vensters smaller dan 1000 px of lager dan 650 px mogen HUD, besturingsuitleg en menu niet overlappen en niet buiten beeld vallen. Schaal ze kleiner (bijvoorbeeld met `clamp()` of een media query).
- Getest formaat: 768 x 500 en 1280 x 720.

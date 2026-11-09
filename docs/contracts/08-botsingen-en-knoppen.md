# Contract 08: botsingen en speciale knoppen (fase 5)

Lees eerst `00-conventies.md` en `02-moto-en-besturing.md`.

## Wat de speler moet voelen
- **Sport (turbo):** spatie = korte, krachtige snelheidsboost op asfalt.
- **Cross (offroad-boost):** spatie = een paar seconden geen snelheidsverlies op gras en aarde, plus iets meer optrekken. Ideaal voor de shortcut of om een bocht af te snijden.
- **Cruiser (zijduw):** spatie = de dichtste rijder naast je wordt opzij gezwiept en vertraagt kort. Bij gewone botsingen wint de zwaarste moto.

## A. Instellingen (maakt: game designer)

`src/bikes/bikeTypes.js`: het veld `ability` per type bestaat al (`kind`, `cooldown`, `duration`, `strength`). Controleer en stel bij. Betekenis van `strength`:
- turbo: factor op topsnelheid en optrekken tijdens de boost (bijv. 1.3).
- offroad: 0 tot 1, hoeveel van het snelheidsverlies op gras en aarde wegvalt (1 = alles), en dezelfde factor extra optrekken.
- shove: zijwaartse duwsnelheid in m/s die het slachtoffer krijgt.

`src/config.js`: nieuw blok

```js
CONFIG.collisions = {
  radius: 0.9,           // m, botsstraal van één moto (cirkel van boven gezien)
  bounce: 0.3,           // 0..1, hoe hard moto's van elkaar afketsen
  speedLoss: 0.15,       // deel van de snelheid dat je verliest bij een botsing
  pushDecay: 4,          // 1/s, hoe snel een zijwaartse duw uitdooft
  shoveRange: 5,         // m, maximale afstand voor de zijduw
  shoveStun: 0.8,        // s, hoe lang het slachtoffer van een zijduw minder gas kan geven
};
```

## B. Fysica-uitbreiding: `src/bikes/Bike.js` (maakt: coder)

Nieuw op elke `bike` (bestaande API blijft gelijk):

| Naam | Wat |
|---|---|
| `bike.mass` | kopie van `type.mass` |
| `bike.push(vx, vz)` | geeft een zijwaartse snelheid in m/s die vanzelf uitdooft (`CONFIG.collisions.pushDecay`) |
| `bike.stun(seconds)` | tijdens deze tijd max 30% gas |
| `bike.modifiers` | `{ topSpeed: 1, acceleration: 1, offroad: 0 }`: worden door de speciale knop gezet en elke stap toegepast |
| `bike.velocity` | `THREE.Vector3`: echte bewegingssnelheid (vooruit + duw), alleen lezen |

## C. Speciale knop: `src/bikes/abilities.js` (maakt: coder)

```js
const ability = createAbility(bike);
ability.update(dt, actionHeld, others);   // others = lijst met de andere bikes
ability.state;   // { kind, ready, active, cooldownLeft, cooldownTotal, activeLeft }
ability.onUse = (info) => {};             // optioneel: { kind, target } bij gebruik
```
- Activeert alleen op het **indrukken** (van niet-ingedrukt naar ingedrukt). Een spatie die al ingedrukt was toen het menu sloot, telt pas na loslaten en opnieuw indrukken.
- Zet `bike.modifiers` tijdens `active` en zet ze daarna terug.
- Shove: kiest de dichtste andere bike binnen `CONFIG.collisions.shoveRange`, duwt die weg van jou (zijwaarts ten opzichte van zijn rijrichting) met `strength` m/s en `stun(CONFIG.collisions.shoveStun)`. Geen doel in bereik = knop niet verbruikt.

## D. Botsingen: `src/bikes/collisions.js` (maakt: coder)

```js
resolveCollisions(bikes);   // elke fysica-stap, na alle bike.update's
```
- Cirkels van `CONFIG.collisions.radius`. Overlap = beide uit elkaar schuiven volgens massa (lichte moto schuift verder) en een duw via `bike.push` met `bounce`, plus `speedLoss`.
- Moet snel zijn voor 6 moto's (15 paren).

## E. Computer-rijders gebruiken hun knop: `src/race/AIDriver.js` (maakt: coder)
- `getControls(others)` krijgt nu ook de lijst met andere bikes en mag `action: true` geven.
- Sport: turbo op een recht stuk als de knop klaar is. Cross: bij het begin van de shortcut of naast de baan. Cruiser: als er een rijder binnen bereik naast hem rijdt.
- `getControls()` zonder argument blijft werken (dan geen zijduw).

## F. Speciale-knop-meter: uitbreiding van `src/ui/HUD.js` (maakt: UX/UI)

```js
hud.setAbility({ name, ready, active, fraction });  // fraction 0..1 = hoeveel van de afkoeltijd voorbij is
hud.flashHit(text);                                 // korte rode melding, bv. "Geduwd!"
```
- Bij de snelheidsmeter: naam van de knop (Turbo / Offroad-boost / Zijduw), een balk of ring die volloopt, "SPATIE" als hij klaar is, een duidelijke gloed als hij actief is.
- Alleen DOM wijzigen als de getoonde waarde merkbaar verandert (afronden op 2%).
- Blijft passen op 768 x 500.

## G. Turbovlam: uitbreiding van `src/bikes/BikeModel.js` (maakt: 3D-modelleur)
- Elk model krijgt een kind `boostFlame` (`getObjectByName`), achteraan bij de uitlaat, naar +Z gericht, standaard `visible = false`. Lengte ongeveer 0.8 m bij `scale.z = 1`.
- Gebruikt `materials.flame` en, als die er is, `materials.flameCore`.
- Max 60 driehoeken extra.

## H. Vlam-materialen: uitbreiding van `src/render/materials.js` (maakt: shading)
- Nieuwe sleutels `flame` (oranje-geel, gloeiend) en `flameCore` (bijna wit). Zichtbaar fel, ook in de schaduw (`emissive` of `MeshBasicMaterial`), half doorzichtig mag, `depthWrite: false` als doorzichtig.

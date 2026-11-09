# Contract 09: polish - geluid, stof en kleine verbeteringen (fase 6)

Lees eerst `00-conventies.md`.

## A. Geluid: `src/audio/AudioEngine.js` (maakt: geluidsontwerper, nieuwe specialist)

Alle geluid wordt **in code gemaakt met de Web Audio API** (oscillators, ruis, filters). Geen geluidsbestanden, geen bibliotheken.

```js
const audio = createAudio();
audio.unlock();                       // na de eerste toets of klik (browsers starten geluid pas na een actie)
audio.setMuted(true | false);
audio.isMuted();
audio.setEngine({ throttle, speedRatio, surface, boosting });  // elk beeld, voor de speler
audio.stopEngine();                   // menu of finish
audio.playCountdown(value);           // 3, 2, 1 = korte piep, "GO" = hogere langere piep
audio.playAbility(kind);              // "turbo" | "offroad" | "shove"
audio.playHit(strength);              // botsing of geduwd worden, strength 0..1
audio.playFinish(position);           // korte jingle; plaats 1 klinkt feestelijker
```
- `speedRatio` = snelheid / topsnelheid (0..1, kan iets boven 1 bij turbo). `throttle` 0..1. `surface` = "road" | "curb" | "dirt" | "grass".
- Motor: toonhoogte stijgt met `speedRatio`, voller bij gas, licht rommelend op gras en aarde, extra gebrul tijdens `boosting`. Mag niet vervelend schel zijn: zachte filters, niet te luid.
- Alle geluiden samen door één hoofdvolume (rond 0.5). `setMuted` dempt alles meteen.
- Goedkoop: geen nieuwe nodes per beeld. `setEngine` wijzigt alleen bestaande parameters (met `setTargetAtTime`).
- Werkt zonder fouten als de browser geen Web Audio heeft of als `unlock` nog niet gebeurd is (dan gewoon stil).

## B. Stofwolkjes: `src/world/dust.js` (maakt: 3D-modelleur)

```js
const dust = createDust(scene, materials);
dust.emit(position, surface, intensity);   // position = THREE.Vector3 achter de moto, intensity 0..1
dust.update(dt);                           // elk beeld
```
- Eén `THREE.InstancedMesh`-pool van maximaal 200 wolkjes (lage veelhoek, bv. icosaëder detail 0). Geen nieuwe objecten tijdens het spelen.
- `surface` "dirt" = `materials.dustDirt`, "grass" = `materials.dustGrass` (twee pools of instanceColor, jouw keuze). Andere ondergrond = niets.
- Een wolkje stijgt licht, groeit eerst en krimpt dan tot 0 in ~0.8 s. Geen schaduw.
- `emit` mag 60 keer per seconde per moto aangeroepen worden: beperk zelf hoeveel wolkjes je echt maakt (bv. op basis van `intensity` en een kleine teller).

## C. Grotere turbovlam (maakt: 3D-modelleur)
- `boostFlame` mag groter: ongeveer 1.3 m bij `scale.z = 1`, en iets breder, zodat hij van op 7.5 m achter de moto goed zichtbaar is.

## D. Stof-materialen: uitbreiding van `src/render/materials.js` (maakt: shading)
- Nieuwe sleutels `dustDirt` (lichtbruin, past bij `dirt`) en `dustGrass` (licht groengrijs). Licht doorzichtig mag (`depthWrite: false`), past in de cartoonstijl.

## E. Interface (maakt: UX/UI)
- `src/ui/HUD.js`: het knop-label (bv. "Offroad-boost") breekt nooit over twee regels. Kleiner lettertype of afkorting is oké.
- Nieuw `src/ui/soundToggle.js`: `createSoundToggle({ onToggle(muted) })` met `setMuted(bool)`. Klein knopje (luidspreker-icoon in CSS/Unicode) rechtsboven, klikbaar, en toets **M**. Werkt in menu én race.
- `src/ui/controlsHint.js`: extra regel "M = geluid aan/uit".
- Kleine vensters: besturingsuitleg (linksonder) en race-paneel (linksboven) overlappen nooit, ook niet bij 640 x 420. Verberg of verklein de besturingsuitleg als er te weinig hoogte is.

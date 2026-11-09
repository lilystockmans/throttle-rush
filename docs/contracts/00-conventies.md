# Contract 00: conventies voor alle specialisten

Dit document geldt voor iedereen. Lees het voor je begint.

## Eenheden en assen
- 1 eenheid = 1 meter.
- Y-as wijst omhoog. De grond ligt op y = 0.
- De voorkant van elk object (moto, camera-richting) wijst naar **-Z** in lokale ruimte.
- Hoeken in radialen.
- Snelheid in meter per seconde. De HUD rekent om naar km/u.

## Code-stijl
- Gewone JavaScript-modules (`import` / `export`). Geen TypeScript, geen frameworks.
- three.js importeren als: `import * as THREE from "three";`
- Elk bestand begint met 2-4 regels uitleg in het Nederlands: wat doet dit bestand.
- Elk bestand doet één ding en blijft onder ongeveer 250 regels.
- Geen magische getallen in logica. Instelbare getallen komen uit `src/config.js` of `src/bikes/bikeTypes.js`.

## Prestatie (doel: 60 fps op een gewone laptop)
- Geen gedownloade modellen of textures. Alles wordt in code gebouwd.
- Materialen: `MeshLambertMaterial` of `MeshToonMaterial`. Geen `MeshPhysicalMaterial`.
- Herhaalde objecten (bomen, kegels) via `THREE.InstancedMesh`.
- Eén schaduwgevend licht, schaduwkaart maximaal 1024 x 1024.
- Geen nabewerking (post-processing).

## Stijl
- Kleurrijke low-poly cartoonstijl. Platte kleuren, duidelijke vormen.
- Eigen game. Geen namen, personages, items of looks uit bestaande games.

## Grenzen tussen specialisten
- Je leest en schrijft alleen de bestanden in jouw opdracht en de contracten die je meekrijgt.
- Je leest geen code van andere specialisten.
- Heb je iets nodig dat niet in je contract staat? Schrijf het op in je eindverslag. Verzin geen eigen afspraak met een ander onderdeel.

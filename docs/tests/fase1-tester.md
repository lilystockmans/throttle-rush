# Fase 1 - spelerstest Throttle Rush (tester, zonder code)

Getest op http://localhost:5173/?debug, viewport 1280x720, met toetsen via KeyboardEvents.
Let op: toetsen komen niet van een echt toetsenbord, dus fijn timing-gevoel is beperkt beoordeeld.

## Wat werkt
- Eerste indruk goed: heldere lowpoly-baan, moto van achteren, bomen, kerbs. Besturingspaneel linksonder is leesbaar
  (pijltjes/WASD, Spatie, R) en verdwijnt bij de eerste toets. Snelheidsmeter rechtsonder (km/u + ondergrond) is duidelijk.
- Optrekken voelt vlot: ~87 km/u na 1,5 s, loopt door tot ruim 130 km/u. Remmen werkt, daarna achteruit (max ~12 km/u).
- Stilstaand sturen doet niets (logisch). De moto helt zichtbaar over in de bocht, camera volgt netjes.
- Gras: je merkt het meteen. Meter toont GRAS, snelheid zakt naar ~60 km/u en blijft daar. Kerb toont BERM (roze label).
- R op de baan terug: werkt, moto staat op asfalt en kijkt in rijrichting. Stilstaand is dat betrouwbaar.
- FPS-teller linksboven: stabiel 60 fps tijdens rijden (zie opmerking over lage waarden bij punt 3).

## Wat niet werkt / opvallend
1. Sturen is te nerveus bij snelheid (ernst: HOOG). Een tik van 100-150 ms bij 70+ km/u draait de moto zo ver dat je
   van de baan vliegt; een halve seconde vasthouden draait ~90 graden. Bochten zijn met toetsen bijna niet te volgen
   zonder constant te tikken. Eerste bocht en de bochten erna: zonder gas los te laten rij je er meestal naast.
2. Sturen kost veel snelheid (ernst: MIDDEL). Voorbeeld: 52 -> 25 km/u na een korte stuurtik met gas ingedrukt.
   Bocht nemen voelt als bijna stilvallen, niet als driften. Ook uitrollen remt hard (38 -> 24 km/u in 1 s).
3. Lage FPS-waarden (1-20 fps) zagen we alleen als het browservenster op de achtergrond stond. Dat is een
   testomgeving-effect, geen spelprobleem (ernst: laag, ter info). Op de voorgrond steeds 60 fps.
4. Achteruit toont gewoon een positief getal, geen R/achteruit-indicatie (ernst: laag).
5. R reageerde een keer niet direct (net na loslaten van de rem, ~0 km/u); tweede poging werkte meteen (ernst: laag,
   mogelijk timing van de test). Spawnplek na R verschilt per keer; niet altijd waar je zou verwachten.
6. Grassnelheid: inkomen op 136 km/u daalt maar traag (136 -> 83 in ~2 s), dus grasstraf voelt bij hoge snelheid zwak
   (ernst: laag-middel).
7. Visueel: bruin zandpad op de infield dat de baan raakt, ziet er als een gat/artefact uit (laag). Een boom vlak bij de
   camera vult soms een groot deel van het beeld (laag). Geen flikkering, geen overlappende tekst gezien.

## 3 verbetervoorstellen (spelersgevoel)
1. Stuursnelheid afhankelijk van snelheid maken en stuurinput zacht opbouwen (ramp-up ~0,15 s, afbouw bij loslaten),
   zodat een tik een kleine correctie is en vasthouden een gelijkmatige bocht geeft. Lagere maximale stuurhoek bij
   hoge snelheid.
2. Snelheidsverlies door sturen en uitrollen verkleinen, zodat een goed genomen bocht snelheid behoudt; straf hoort bij
   gras/kerb, niet bij gewoon sturen op asfalt.
3. Gras-straf sterker en directer (sneller afremmen naar ~60 km/u) en bij R een korte fade plus duidelijke tekst
   ("Terug op de baan"); achteruit een eigen indicatie in de meter geven.

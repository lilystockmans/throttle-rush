# Fase 1 ontwerp: Zandstorm Ring

## Circuit
- Naam: **Zandstorm Ring**. Lengte ca. 1198 m, past in een vak van 365 x 250 m.
- Rijrichting tegen de klok in. Start onderaan links op het lange rechte stuk (ca. 230 m).
- Daarna: snelle ruime bocht, een snelle S-bocht aan de oostkant, een tweede rechte stuk
  bovenaan, een brede bocht linksboven, een haarspeld in het midden (straal ca. 32 m)
  en een ruime U-bocht linksonder terug naar de start.
- Kleinste bochtstraal ca. 25,5 m. Delen van de baan liggen minstens 70 m uit elkaar.

## Shortcut
- Dirt-pad (7 m breed) dat van het onderste rechte stuk (x -26, z 128) diagonaal door het
  binnenveld naar het bovenste rechte stuk (x 41, z -122) loopt.
- Het slaat de hele oostkant over: 451 m asfalt tegen 287 m dirt (36% korter).
- Het pad blijft minstens 25 m van de rest van het asfalt en heeft zachte bochten (straal 48 m+).

## Balans
- Sport: 42 m/s op asfalt, maar op dirt maar 0,45 keer zo snel (19 m/s). Wint op asfalt.
- Cross: 36 m/s op asfalt, op dirt 0,92 keer (33 m/s). Wendbaarst, dus ook sneller door bochten.
- Cruiser: 38 m/s, zwaarst (320 kg), stuurt traag, dirt 0,7. Sterk in een duel, niet in tijd.
- De shortcut wint voor de cross precies genoeg om het snelheidsverlies op asfalt te
  compenseren. Voor de sport is hij een val. Wil je de shortcut minder sterk maken: verlaag
  `surface.dirt.speed` van de cross, of maak het pad langer in `trackData.js`.

## Controle (node-script met CatmullRomCurve3, gesloten, centripetal)
| Eis | Uitkomst |
|---|---|
| Rondelengte 900-1300 m | 1197,7 m |
| Min. afstand niet-naburige delen >= 40 m | 70,3 m |
| Kleinste bochtstraal ca. >= 25 m | 25,5 m |
| Shortcut-begin en -einde op middenlijn (< 1 m) | 0,03 m en 0,02 m |
| Shortcut 30-40% korter | 36,3% (287 m tegen 451 m) |
| Alle punten tussen -250 en 250 | grootste waarde 182 |

Ruwe rondetijd (rekenmodel met bochtlimiet, optrekken en remmen; de echte game kan afwijken):
- Sport zonder shortcut: 30,3 s
- Cross met shortcut: 29,5 s (2,9% sneller dan sport)
- Sport met shortcut: 35,5 s (17% trager: de shortcut loont niet)
- Ter vergelijking: cross zonder shortcut 33,3 s, cruiser zonder shortcut 35,2 s

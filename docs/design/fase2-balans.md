# Fase 2: herbalancering na meting met echte fysica

## Meting (autopiloot, 1 ronde)
| Type | Asfalt | Shortcut |
|---|---|---|
| Sport | 29,7 s | 34,7 s |
| Cross | 33,3 s | 30,2 s |
| Cruiser | 34,0 s | 34,6 s |

Probleem: cross met shortcut (30,2 s) was 0,5 s trager dan sport (29,7 s). Doel: 2 tot 3% sneller (ca. 29,0 s).
Cruiser was 14,5% trager dan sport; maximum is ca. 12%.

## Wijzigingen (alleen src/bikes/bikeTypes.js)
| Getal | Oud | Nieuw | Waarom |
|---|---|---|---|
| cross.topSpeed | 36 | 37,5 | Rondetijd hangt vooral van topsnelheid af; wint tijd op asfalt en bij het oprijden van de dirt |
| cross.acceleration | 18 | 20 | Sneller terug op snelheid na bochten en na de shortcut |
| cross.surface.dirt.speed | 0.92 | 0.95 | Dirt-plafond wordt 35,6 m/s, bijna geen terugval na de entree |
| cross.surface.dirt.grip | 0.92 | 0.95 | Beter optrekken op dirt |
| cruiser.topSpeed | 38 | 39,5 | Cruiser moet binnen ca. 12% van sport blijven |
| cruiser.acceleration | 12 | 14 | Idem, blijft toch de traagste op gang |
Sport is niet aangepast.

## Verwachting (schatting, niet gemeten)
- Cross met shortcut: ca. 29,0 s (asfalt-deel ca. 1 s sneller, dirt-deel ca. 0,2 s sneller).
- Cross op asfalt: ca. 32 s. Sport met shortcut: blijft ca. 34,7 s (duidelijk trager, sport is niet gewijzigd).
- Cruiser: ca. 32,8 s op asfalt (ca. +10% op sport); met shortcut ongeveer gelijk.
- Herkenbaarheid: sport 42 m/s > cruiser 39,5 > cross 37,5 op asfalt; cross blijft wendbaarst en dirt-koning, cruiser zwaarst (320 kg).
- Als cross met shortcut te snel wordt (onder 28,7 s): zet cross.topSpeed terug naar 37 of dirt.speed naar 0.93.

# Fase 7 eindtest - Throttle Rush (live: throttle-rush-dun.vercel.app)

Tester zonder code, alleen speler-zicht. Getest in het browserpaneel (viewport 768x500).

## Belangrijke beperking van deze test
Het browserpaneel draaide wisselend op 0,5 tot 2 fps (soms kortstondig 50 fps na herladen en tabs_select).
De game reageerde dan in slow motion en mijn toetsen (via scripts, discreet) waren te grof om echt te sturen.
Dit is waarschijnlijk een testomgeving-probleem, geen game-probleem, maar ik kan het niet uitsluiten.

## Wat werkt
- Menu: titel, drie kaarten met vier balkjes + "Speciale knop", hint "Kies met pijltjes of A D. Start met Enter, spatie of klik". Duidelijk.
- Wisselen tussen de moto's met pijltjes werkt, geselecteerde kaart licht op met kleurrand. Esc brengt terug naar menu.
- Aftellen: startlichten (1, 2, 3 rood) plus groot cijfer, daarna start de race. Duidelijk.
- HUD: ronde 1/3, tijd, beste, positie (5e/6, 6e/6 wisselt tijdens rijden), snelheid in km/u, ondergrond-label (ASFALT / GRAS / BERM).
- Speciale knop per moto zichtbaar en werkt: Turbo (laadt daarna op met %), Offroad-boost toont ACTIEF (snelheid 122 naar 135 km/u op gras), meter laadt daarna weer op.
- Modderrat is op gras duidelijk sneller (122 km/u) dan Vuurpijl en Zwaargewicht (60 tot 95 km/u): de identiteit van de moto's is voelbaar.
- Bij de eerste race verscheen een Besturing-paneel met "R terug op de baan" en "Esc terug naar het menu".

## Problemen
- HOOG: Wereldrand zichtbaar. Met de Modderrat het binnenveld uit gereden: grond verdwijnt, alleen een lichtblauwe leegte met de moto erin. Geen muur, geen waarschuwing.
- HOOG (onzeker): "R terug op de baan" had geen zichtbaar effect (bleef in de blauwe leegte, snelheid 0, ondergrond GRAS). Mogelijk door mijn gesimuleerde toets, handmatig nog eens controleren.
- HOOG: Van de baan af is er geen richting. Na de eerste bocht (rond 7 sec) rijd je rechtdoor het gras in; alleen gras en bomen, geen baan of pijl in beeld. Gras wordt een eindeloos veld.
- MIDDEL: Het Besturing-paneel overlapt het Ronde/Tijd/Beste-blok linksboven en dekt TIJD/BESTE af. Verscheen bij een race na het menu, niet bij alle races (onduidelijk wanneer).
- MIDDEL: Op 768x500 zijn kaartnamen afgekapt ("Zwaargewi...", "Modderrat" tegen de rand) en de Start-knop valt half buiten beeld.
- MIDDEL: De "R"-toets staat niet in het menu; de speler leert hem pas in het paneel tijdens de race.
- LAAG: Label "Offroad-boost" breekt over twee regels in de HUD en duwt de meter omlaag.
- LAAG: Start is traag (14 tot 25 km/u na 2 tot 3 sec bij Vuurpijl, 6e plaats); weinig "raceschot"-gevoel. Positie sprong 5e/6e door rivalen op de start.
- LAAG: Op gras zit snelheid vast op ~60 (Vuurpijl): voelt als een muur, weinig variatie.

## Niet getest (eerlijk)
- Volledige race en het finish-scherm met klassement en de knop Opnieuw: niet bereikt.
- Aarden shortcut: er is een bruin zandpad door het binnenveld gezien (op de horizon) maar ik heb het niet kunnen berijden.
- Botsingen met computer-rijders: alleen de startopstelling gezien (rivalen vlak naast je); geen impact geobserveerd.
- Flikkeren, camerabeweging in bochten, geluid: niet te beoordelen bij 1 fps.
- Alle drie de moto's zijn wel gestart en gereden (Vuurpijl, Modderrat, Zwaargewicht).

## Top 3 verbeteringen (spelersgevoel)
1. Houd de speler bij de baan: onzichtbare muur of zachte terugduw bij de wereldrand, en een duidelijke pijl "richting baan" of automatische respawn na enkele seconden buiten de baan.
2. Maak "R terug op de baan" zichtbaar in het menu en controleer dat hij altijd werkt (ook vanuit de leegte). Laat het hulppaneel niet over de HUD heen vallen.
3. Meer snelheidsgevoel bij de start en op gras (snellere optrekkers, camera-schudding, effecten), en het menu responsief maken voor lage schermen.

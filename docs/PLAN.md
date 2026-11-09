# Plan: moto-racegame in three.js (werktitel "Throttle Rush")

**Tools & skills voor deze taak:** superpowers:writing-plans (dit plan), superpowers:subagent-driven-development (bouwploeg per fase), superpowers:verification-before-completion (elke fase draaien voor "klaar"), build-review (review per fase), frontend-design (menu en HUD), Vercel MCP (project + deploy), ingebouwde browser (lokaal testen en FPS meten), git.

## Context

De folder `261109_kickAssGame` is leeg. Je wil een arcade-racegame in de stijl van een kart-racer, maar met moto's. Elk motortype heeft een eigen sterkte. De game moet op een publieke URL draaien (Vercel), 60 fps halen op een gewone laptop, en de code moet uitlegbaar zijn aan een klasgenoot.

Belangrijk: dit wordt een eigen game in het kart-racer genre. Geen namen, personages, items of looks van Mario Kart. Eigen naam, eigen items, eigen stijl.

## Rol en diepte

Ik werk als senior game-developer met 15 jaar ervaring in arcade-racers en web-3D.

Zes punten die tonen hoe diep ik ga:
1. Eigen eenvoudige arcade-fysica in plaats van een fysica-bibliotheek. Minder onderdelen, voorspelbaar, makkelijk uit te leggen.
2. Het circuit is één wiskundige lijn (spline). Weg, berm, offroad en checkpoints rekenen allemaal vanaf die lijn. Eén bron van waarheid.
3. Alle bike-cijfers (snelheid, grip per ondergrond, gewicht) staan in één bestand. Balanceren = getallen aanpassen, geen code.
4. Prestatie vanaf dag 1: low-poly modellen in code (geen downloads), één lichtbron, instancing voor bomen en kegels, pixel ratio begrensd, FPS-meter via `?debug`.
5. Vaste fysica-stap (60 keer per seconde), los van de beeldsnelheid. De game rijdt even snel op een trage en een snelle laptop.
6. Eerst een lege scène live op Vercel. Zo is de publicatie-route bewezen voor er één regel game bestaat.

## Succescriteria (hierop word ik beoordeeld)

1. De game opent op een publieke Vercel-URL in Chrome en Safari, zonder installatie.
2. Minstens 55-60 fps op een gewone laptop tijdens een race met 6 rijders (gemeten met de FPS-meter).
3. De drie motortypes voelen echt anders: cross wint via de offroad-shortcut, sport wint op de weg, cruiser kan anderen van de baan duwen.
4. Een volledige race werkt: kies moto, aftellen, 3 ronden, posities, finish-scherm, opnieuw spelen.
5. Elk bestand doet één ding, heeft uitleg-commentaar bovenaan, en is korter dan ongeveer 250 regels.

## Scope

**Wel:**
- 1 circuit met asfalt, berm, offroad-zone en een dirt-shortcut.
- 3 motortypes: cross, sport, cruiser. Elk met eigen stats en één speciale knop.
  - Cross: bijna geen snelheidsverlies offroad. De shortcut is alleen voor cross de moeite.
  - Sport: hoogste topsnelheid op asfalt, korte turbo (knop, met afkoeltijd). Traag offroad.
  - Cruiser: zwaar. Botsingen duwen anderen weg. Speciale knop "zijduw": de dichtste rijder naast je wordt opzij geduwd en vertraagt.
- 5 computer-tegenstanders (AI) met gemengde motortypes.
- Ronden, checkpoints, posities, aftellen, finish-scherm.
- HUD: snelheid, ronde, positie, afkoeltijd van je speciale knop.
- Besturing met toetsenbord (pijltjes of WASD, spatie = speciale knop).
- Chase-camera achter de moto, moto helt over in bochten.

**Niet (nu):**
- Online multiplayer of split-screen.
- Meerdere circuits.
- Gamepad of touch-besturing.
- Gedownloade 3D-modellen of textures.
- Items/power-up-dozen: optionele fase 6, alleen als fase 1-5 goed draaien.

## Beperkingen

- Gratis: three.js, Vite en Vercel Hobby kosten niets.
- Geen backend, geen API-sleutels, geen .env.
- Node 24 en git zijn aanwezig (gecontroleerd).
- Publieke URL betekent: iedereen met de link kan de game openen.

## Techniek

- **Vite** (lokale dev-server en bouwstap) + **three.js** via npm + gewone JavaScript (geen TypeScript, geen framework).
- Menu en HUD in gewone HTML/CSS boven het 3D-canvas.
- Vercel bouwt de map `dist` en publiceert die als statische site.

## Bestandsstructuur

```
261109_kickAssGame/
  .claude/
    settings.json           haken voor het prompt-logboek
    log-prompt.sh           script dat de haken uitvoeren
  docs/
    PLAN.md                 kopie van dit plan
    PIPELINE_STATE.json     status per fase (voor hervatten)
    PROMPT_LOG.md           prompts + duur, geen output
    contracts/              afspraken tussen specialisten
    design/                 werk van de game designer
    tests/                  bevindingen van de tester
  index.html                canvas + HTML voor menu en HUD
  package.json              lijst van onderdelen (three, vite)
  vite.config.js
  .gitignore
  src/
    main.js                 start de game, maakt alle objecten aan
    config.js               alle instelbare getallen op één plek
    core/
      GameLoop.js           vaste fysica-stap + tekenen per frame
      Input.js              leest toetsenbord
      Debug.js              FPS-meter bij ?debug
    world/
      Track.js              spline, wegmesh, ondergrond opvragen per positie
      Environment.js        lucht, licht, grond, bomen (instanced)
    bikes/
      bikeTypes.js          stats van cross, sport, cruiser (alleen data)
      Bike.js               fysica van één moto: gas, sturen, grip, overhellen
      BikeModel.js          low-poly 3D-model in code, kleur per rijder
      abilities.js          turbo, zijduw, offroad-gedrag
      collisions.js         botsingen tussen moto's (gewicht telt)
    race/
      RaceManager.js        aftellen, ronden, checkpoints, posities, finish
      AIRider.js            computer-rijder volgt de spline met eigen lijn
    camera/
      ChaseCamera.js        camera die zacht achter de speler hangt
    render/
      materials.js          alle materialen en kleuren
      lighting.js           licht en schaduw
    world/trackData.js      circuit-vorm als punten (designer)
    world/props.js          bomen, kegels, tribunes (3D)
    ui/
      Menu.js               moto kiezen, start, opnieuw
      HUD.js                snelheid, ronde, positie, afkoeltijd
      styles.css
```

## Werkwijze: architect en gespecialiseerde bouwploeg

Ik (Opus) ben architect en integrator. Ik ben de enige die alles ziet. Het bouwwerk gaat naar vijf vakspecialisten (Sonnet-subagents). Elke specialist krijgt alleen zijn eigen opdracht, zijn eigen bestanden en een **contract**.

**Contract** = een kort document in `docs/contracts/` dat zegt welke functies en gegevens een onderdeel aanbiedt en verwacht. Voorbeeld: "BikeModel geeft een `THREE.Group` terug, voorkant wijst naar -Z, wielen heten `wheelFront` en `wheelBack`." Zo past het werk in elkaar zonder dat specialisten elkaars code lezen.

| Specialist | Eigen bestanden | Ziet NIET |
|---|---|---|
| **Game designer** | `docs/design/`, `src/config.js`, `src/bikes/bikeTypes.js`, circuit-vorm als punten-lijst in `src/world/trackData.js` | alle code |
| **Coder (gameplay)** | `src/core/`, `src/bikes/Bike.js`, `abilities.js`, `collisions.js`, `src/race/`, `src/world/Track.js` (logica) | 3D-modellen, shaders, UI |
| **3D-modelleur** | `src/bikes/BikeModel.js`, `src/world/props.js` (bomen, kegels, tribunes), wegmesh-vorm | gameplay, UI |
| **Shading en licht** | `src/render/materials.js`, `src/render/lighting.js`, `src/world/Environment.js` (lucht, mist, kleurpalet) | gameplay, UI |
| **UX/UI** | `index.html`, `src/ui/`, `src/ui/styles.css`, besturingsuitleg | gameplay-code, 3D |

Extra rol zonder code-toegang:
- **Tester** speelt de game alleen in de browser, meet FPS, en schrijft een bevindingenlijst. Ziet geen code.

Hoe ik de afscherming afdwing:
- Elke specialist krijgt in zijn opdracht alleen zijn contract en zijn eigen bestandslijst, met de regel: lees en schrijf niets daarbuiten.
- Na elke opdracht controleer ik met `git diff` dat de specialist alleen zijn eigen bestanden aanraakte. Raakt hij iets anders aan, dan draai ik dat terug.

Eerlijke kanttekening: technisch kan een subagent de hele folder lezen. De afscherming werkt via de opdracht plus mijn controle achteraf, niet via een slot. Een harder slot (aparte git-kopie per specialist met alleen zijn bestanden) kan, maar maakt het samenvoegen trager. Ik stel de lichte versie voor.

Afweging: gescheiden specialisten geven zuiver vakwerk, maar het risico dat onderdelen niet passen stijgt. De contracten vangen dat op. Daarom schrijf ik de contracten zelf, vóór een specialist begint.

Volgorde per fase:
1. Ik schrijf of update de contracten voor die fase.
2. Specialisten zonder onderlinge afhankelijkheid werken tegelijk.
3. Ik voeg samen in `src/main.js`, draai de game, meet FPS.
4. De tester speelt en rapporteert.
5. Jij test en zegt "ok" of "aanpassen".
6. Na jouw ok: `git commit`, `docs/PIPELINE_STATE.json` bijwerken, Obsidian-wiki bijwerken.

## Prompt-logboek

Bestand: `docs/PROMPT_LOG.md`. Per regel: datum, starttijd, eindtijd, duur, wie (jij of welke specialist), de prompt-tekst. Geen output.

- **Jouw prompts:** automatisch gelogd via twee haken (hooks) in `.claude/settings.json` van dit project. Een haak is een klein script dat Claude Code zelf uitvoert. De eerste haak noteert je prompt en de starttijd. De tweede noteert de eindtijd als ik klaar ben en rekent de duur uit.
- **Opdrachten aan specialisten:** ik log die zelf, met start, einde en duur van elke subagent.
- Het logboek gaat mee in git, zodat je het kan tonen.

Voorbeeld:
```
| Datum | Start | Einde | Duur | Wie | Prompt |
| 2026-11-09 | 15:40 | 15:52 | 12m 04s | Lily | maak een plan voor ... |
| 2026-11-09 | 15:45 | 15:49 | 4m 10s | 3D-modelleur | Bouw BikeModel.js volgens contract ... |
```

## Fases

Elke fase eindigt met: draaien, jij test, commit.

**Fase 0. Opzet en publicatie-route**
- `git init`, Vite + three.js installeren, `.gitignore` (met `node_modules`, `dist`, `.env*`).
- Prompt-logboek en haken installeren. Eerste contracten schrijven.
- Lege scène: grond, lucht, een draaiende kubus, FPS-meter.
- Vercel-project koppelen en publiceren.
- Klaar als: kubus draait lokaal en op de publieke URL.

**Fase 1. Circuit en rijden**
- `Track.js`: gesloten spline, wegmesh, berm, offroad-zone, shortcut.
- Eén sport-moto met gas, rem, sturen, overhellen. Chase-camera.
- Klaar als: je een volledige ronde kan rijden aan 60 fps.

**Fase 2. Drie motortypes en ondergrond**
- `bikeTypes.js` met stats. Grip en topsnelheid hangen af van ondergrond.
- Menu om een moto te kiezen.
- Klaar als: cross duidelijk sneller is door de shortcut, sport sneller op asfalt.

**Fase 3. Race-logica en HUD**
- Aftellen, 3 ronden, checkpoints (geen valsspelen door het gras), rondetijden, finish-scherm, opnieuw.
- Klaar als: een volledige solo-race van begin tot finish werkt.

**Fase 4. Computer-tegenstanders**
- 5 AI-rijders, gemengde moto's. Elk rijdt een iets andere lijn en snelheid. Cross-AI neemt de shortcut.
- Positie-berekening in de HUD.
- Klaar als: een race met 6 rijders 55-60 fps haalt en de AI geen rondjes overslaat.

**Fase 5. Speciale knoppen en botsingen**
- Botsingen tussen moto's, gewicht telt (cruiser duwt, sport vliegt weg).
- Turbo (sport), zijduw (cruiser). AI gebruikt ze ook.
- Afkoeltijd zichtbaar in de HUD.
- Klaar als: elk type een eigen speelstijl heeft die je voelt.

**Fase 6. Polish (optioneel)**
- Geluid (motorgeluid dat meestijgt met toerental), stofwolkjes offroad, eventueel item-dozen met eigen items.

**Fase 7. Prestatie-check en eindpublicatie**
- FPS meten met 6 rijders, zwakke punten oplossen.
- Laatste publicatie naar Vercel, live URL openen en controleren dat de laatste versie draait.

## Verificatie

- Per fase: `npm run dev`, game openen in de ingebouwde browser, rondje rijden, FPS aflezen via `?debug`.
- `npm run build` moet zonder fouten lopen voor elke commit.
- Na elke publicatie: de live Vercel-URL openen en controleren dat de nieuwe versie zichtbaar is.

## Open vragen

1. **Publiceren via GitHub of rechtstreeks?** Mijn voorstel: een GitHub-repo (publiek of privé, jouw keuze) gekoppeld aan Vercel. Elke push publiceert dan automatisch. Alternatief: `npx vercel` vanaf je laptop, daarvoor moet je één keer inloggen in de terminal. Pushen en publiceren doe ik nooit zonder jouw ok.
2. **Naam van de game.** Werktitel "Throttle Rush". Andere naam?
3. **Stijl.** Voorstel: kleurrijke low-poly cartoonstijl (snel en vrolijk). Of liever realistischer en donkerder?
4. **Klasgenoot-uitleg.** Wil je naast commentaar in de code ook een kort `docs/HOE-HET-WERKT.md`?

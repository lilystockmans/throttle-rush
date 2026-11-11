# Plan fase 9: Throttle Rush werkt op een telefoon

Tools & skills for this task: superpowers:subagent-driven-development (specialisten per bestand), UX/UI-specialist (Sonnet), coder (Sonnet), built-in browser (iPhone-formaat testen), Vercel (live controleren).

## Probleem
Op een telefoon kun je niet spelen: de game leest alleen het toetsenbord. Je kunt dus niet sturen, gas geven, remmen of de speciale knop gebruiken. Geluid start pas na een toets, en de uitleg noemt alleen toetsen.

## Wat ik onderzocht heb
- `Input.js` kent alleen toetsen. `main.js` zet geluid alleen aan na een toets.
- Het menu start al met een klik/tik. De finish-knoppen zijn klikbaar.
- Er is al kleine-schermen-layout en automatische kwaliteit (pixelRatio max 1.5).
- Geen blokkade voor zoomen, scrollen of lang indrukken op een telefoon.

## Scope (dit bouw ik)
1. **Aanraakbediening** (alleen op touch-schermen): links twee grote knoppen sturen links/rechts, rechts gas (groot), rem en speciale knop. Meerdere vingers tegelijk. Knop "terug op de baan" (R) en "menu" (Esc) klein.
2. **Invoer-uitbreiding** in `Input.js`: touch-knoppen vullen dezelfde waarden als het toetsenbord. De rest van de game verandert niet.
3. **Telefoon-gedrag**: geen zoomen/scrollen/lang-indrukmenu, geluid start bij eerste tik, scherm blijft aan (waar de browser dat toestaat).
4. **Teksten**: op touch geen toetsenuitleg, wel "Tik om te starten" en korte uitleg van de knoppen.
5. **Layout**: liggend scherm (landscape) is het doel. In staand scherm een melding "Draai je telefoon".
6. **Prestatie**: telefoon start met lagere kwaliteit (pixelRatio 1, geen schaduw als het niet vlot loopt; bestaande AutoQuality blijft).
7. Minimap, HUD en race-paneel mogen de nieuwe knoppen niet overlappen.

## Niet in scope
Kantelbesturing (kan later), nieuwe geluiden, nieuwe levels, installeerbare app.

## Keuze die ik maak
Sturen met knoppen, niet kantelen. Kantelen werkt op iPhone alleen na een toestemmingsvraag en is lastiger te testen. Nadeel: twee duimen nodig, maar dat is gewoon arcade-gevoel.

## Succescriteria
1. Op 844x390 (liggend) is de hele race speelbaar met alleen aanraking: sturen, gas, rem, speciale knop, terug op de baan.
2. Meerdere vingers tegelijk werken (sturen + gas).
3. Geen overlap van knoppen met HUD, race-paneel, minimap, geluidsknop op 844x390 en 667x375.
4. Toetsenbord op laptop werkt nog precies als voorheen, en touch-knoppen zijn daar niet te zien.
5. Live op Vercel; ik test op telefoonformaat met touch-emulatie. Echte telefoon test Lily zelf.

## Fases (na elke fase vraag ik jou om akkoord)
- A. Contract 11 schrijven.
- B. UX/UI-specialist: `src/ui/touchControls.js` + `touch.css`, draai-melding. Coder: `Input.js` uitbreiden.
- C. Koppelen in `main.js`, teksten aanpassen, testen op telefoonformaat.
- D. Build, commit, push, live controleren, logboek bijwerken.

## Open vragen
- Alleen liggend spelen is goed genoeg? (Mijn voorstel: ja.)
- Eerst het plan goedkeuren, dan begin ik met A.

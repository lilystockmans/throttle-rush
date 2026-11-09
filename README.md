# Throttle Rush

Arcade-racegame met moto's, gebouwd in three.js. Kies je moto en race 3 ronden tegen 5 computer-rijders.

**Speel:** https://throttle-rush-dun.vercel.app

## Drie moto's, drie speelstijlen

| Moto | Type | Sterk in |
|---|---|---|
| Vuurpijl | sport | snelst op asfalt |
| Modderrat | cross | gras en aarde, de shortcut door het binnenveld |
| Zwaargewicht | cruiser | zwaar, duwt anderen van de baan |

## Besturing

| Toets | Actie |
|---|---|
| Pijltjes of WASD | rijden |
| Spatie | speciale knop |
| R | terug op de baan |
| Esc | terug naar het menu |

## Zelf draaien

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Voeg `?debug` toe voor een fps-teller.

## Hoe het gebouwd is

- **Vite + three.js + gewone JavaScript.** Geen frameworks, geen gedownloade modellen: alles wordt in code gebouwd.
- **Doel: 60 fps op een gewone laptop.** Eigen arcade-fysica met een vaste rekenstap, low-poly vormen, één schaduwlicht.
- **Architect en specialisten.** Eén AI-architect schreef het plan en de contracten. Gespecialiseerde AI-agents (designer, coder, 3D, shading, UX/UI, tester) bouwden elk hun eigen deel zonder elkaars code te zien.

| Map | Inhoud |
|---|---|
| `src/world/` | circuit, weg, decor, startportaal |
| `src/bikes/` | moto-fysica, 3D-modellen, stats per type |
| `src/race/` | rondes en posities, computer-bestuurders |
| `src/game/` | race-sessie, rijder (fysica + model) |
| `src/ui/` | menu, snelheidsmeter, race-scherm |
| `docs/` | plan, contracten, ontwerpnota's, prompt-logboek |

Elke fase is een eigen commit. Het plan staat in [docs/PLAN.md](docs/PLAN.md).

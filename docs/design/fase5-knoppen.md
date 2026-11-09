# Fase 5: speciale knoppen en botsingen (game designer)

Waarden in `src/bikes/bikeTypes.js` (ability) en `src/config.js` (CONFIG.collisions). Alles hieronder is schatting, niet gemeten.

| Type | Knop | Cooldown | Duur | Sterkte | Gebruik per ronde (~30 s) |
|---|---|---|---|---|---|
| Sport | turbo | 10 s (was 8) | 1,2 s (was 1,5) | x1,25 (42 -> 52,5 m/s) | ca. 3x |
| Cross | offroad | 11 s (was 10) | 4 s (was 3) | 1,0 (alles terug) | ca. 2x |
| Cruiser | zijduw | 8 s (was 6) | 0,4 s | 16 m/s (was 12) | ca. 3 tot 4x |

## Keuzes
- Turbo: korte piek, lange wachttijd. Winst ca. 0,3 tot 0,4 s per gebruik, dus ca. 1 s per ronde (3%) als hij goed valt. Genoeg om te voelen, te weinig om de sport onverslaanbaar te maken. De AI-sporten winnen ook ca. 3%: Baron wordt dichter bij de speler, Tante Turbo blijft middenmoot.
- Offroad: strength blijft 1,0 want cross verliest toch maar 5 tot 10% op dirt en gras. Duur 4 s dekt de hele shortcut. Winst klein (ca. 0,3 s per ronde), dus Mo blijft te kloppen.
- Zijduw: bij pushDecay 4 schuift het slachtoffer 16/4 = 4 m opzij, plus 1 s weinig gas. Dat is de troef van de cruiser: een rijder naast hem verliest een paar meter en een plek. Cooldown 8 s houdt het zeldzaam.
- Botsingen: radius 0,9, bounce 0,3 (zoals contract). speedLoss 0,12 in plaats van 0,15 omdat in een pak vaak meerdere botsingen vlak na elkaar komen.

## Cruiser sneller
topSpeed 39,5 -> 40,5 (146 km/u), acceleration 14 -> 15. Volgorde blijft herkenbaar: sport 42 > cruiser 40,5 > cross 37,5 op topsnelheid; optrekken cross 20 > sport 16 > cruiser 15. Zwaarste (320 kg) en traagste stuurder blijft hij.
Let op: dit lost het grote gat niet op (Opa 1:52 vs sport 1:32). Winst ca. 2 s per race. De oorzaak zit vermoedelijk in sturen (turnRateAtTop 0,75) of AI-gedrag, niet in topsnelheid.

## Bijstellen na testen
- Sport te sterk: turbo strength 1,2 of cooldown 12. Te zwak: duration 1,5.
- Cruiser duwt te vaak/te weinig: shoveRange 4 of 6.
- Aan de coder: speedLoss moet per botsing (met korte pauze) gelden, niet elke fysica-stap, anders verlies je snelheid in een pak.

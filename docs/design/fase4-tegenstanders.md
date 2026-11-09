# Fase 4: tegenstanders (game designer)

Data staat in `src/race/opponents.js`. Basis: perfecte ronde sport ~29,7 s, cross met shortcut ~28,8 s, cruiser ~32,8 s.
Verwachte rondetijd = perfecte tijd / skill (grove schatting, niet gemeten; de AI verliest ook tijd in bochten).

| Rijder | Type | Skill | Lijn | Shortcut | Kleur | Ronde | 3 ronden |
|---|---|---|---|---|---|---|---|
| Baron von Burnout | sport | 0,95 | -2 | nee | magenta | ~31,3 s | ~94 s |
| Modder Mo | cross | 0,90 | +1,5 | ja | limoengroen | ~32,0 s | ~96 s |
| Tante Turbo | sport | 0,88 | +3 | nee | paars | ~33,7 s | ~101 s |
| Opa Oliebol | cruiser | 0,94 | 0 | nee | koningsblauw | ~34,9 s | ~105 s |
| Slakke Sam | cross | 0,81 | -3,5 | ja | ivoorwit | ~35,6 s | ~107 s |

## Waarom deze spreiding
- Eén rivaal (Baron, 0,95): een speler die bijna perfect rijdt (sport ~30 s per ronde) moet echt scherp zijn om hem te kloppen.
- Middenmoot (Mo en Tante Turbo, 0,88 tot 0,90): zij zijn ongeveer even snel als een speler die af en toe de berm raakt (~32 tot 34 s). Een gemiddelde speler eindigt tussen hen en Opa.
- Makkelijker (Opa en Sam): Opa heeft hoge skill, maar een trage moto; Sam rijdt bewust slordig. Zo wint een beginner toch een paar plaatsen.
- Totaal 5 rijders binnen ~4,5 s per ronde: een groep die steeds weer dichtbij komt, geen trein.
- Skill 1.00 bestaat niet: ook de beste computer maakt fouten, dus een goede speler kan altijd winnen.

## Lijnen en types
- Lijnen verspreid van -3,5 tot +3 m, zodat de rijders niet achter elkaar op dezelfde lijn rijden.
- 2 sport, 2 cross, 1 cruiser. Beide cross nemen de shortcut, sport en cruiser niet (contract).
- Kleuren wijken af van rood (sport), turquoise (cross) en goudgeel (cruiser) van de speler.

## Bijstellen na testen
- Te makkelijk te winnen: Baron naar 0,97. Te moeilijk: Baron naar 0,93.
- Rijders die vaak vastrijden: skill 0,02 omlaag, vooral bij Opa (cruiser stuurt traag).

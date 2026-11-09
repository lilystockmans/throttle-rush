# Fase 3: race-instellingen (game designer)

Waarden staan in `CONFIG.race` in `src/config.js`.

## Aantal ronden: 3
- Een ronde duurt ~29-33 s (1198 m, gemiddeld ~39 m/s). 3 ronden = ~95 s plus 3 s aftellen.
- Lang genoeg voor een verhaal: ronde 1 leren, ronde 2 aanvallen, laatste ronde alles geven ("Laatste ronde!").
- Kort genoeg voor een arcadegame: na een fout of een nederlaag druk je direct op Opnieuw.
- 2 ronden voelt als een time trial; 5 ronden (~2,5 min) wordt saai zolang er maar 1 rijder is. In fase 4 met 5 computer-rijders kan 4 ronden getest worden, maar 3 blijft de standaard.

## Aftellen: 3 seconden
- Standaard 3, 2, 1, GO. Lang genoeg om de camera en het startportaal te zien, niet lang genoeg om te vervelen.

## Controlepunten: 5 per ronde
- De shortcut slaat ~450 m van de 1198 m over. Er blijft ~750 m over voor controlepunten.
- Gelijk verdeeld over die 750 m geeft 5 punten ongeveer 150 m uit elkaar.
- Bij ~39 m/s is dat elke ~4 s een punt. Een afsnijding over gras die meer dan ~150 m scheelt wordt dus altijd gepakt.
- Het venster van 30 m (contract) is ruim genoeg voor een brede baan en past ruim binnen de 150 m tussenruimte, dus geen overlap.
- Meer dan 5 punten geeft geen extra bescherming maar wel meer kans dat een punt net in een bocht gemist wordt.
- Het coderen van de grenzen (tA tot tB) blijft aan de coder: geen enkel punt mag binnen de shortcut liggen.

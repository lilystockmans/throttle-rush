// Dit bestand bevat de drie motortypes van Throttle Rush: alleen getallen, geen logica.
// Stel hier de balans bij: topSpeed = snelheid, turnRate = wendbaarheid, surface = grip per ondergrond.
// "speed" is een factor op topSpeed (1 = vol, 0.5 = de helft), "grip" is een factor op sturen en optrekken.

export const BIKE_TYPES = {
  // Asfalt-raket: het snelst op de weg, maar zwaar gestraft op gras en dirt.
  sport: {
    label: "Vuurpijl",
    color: 0xe8202a,           // felrood
    topSpeed: 42,              // m/s op asfalt (= 151 km/u)
    acceleration: 16,          // m/s2 bij vol gas
    braking: 30,               // m/s2 bij vol remmen
    turnRate: 2.3,             // rad/s sturen bij lage snelheid
    turnRateAtTop: 1.0,        // rad/s sturen bij topsnelheid (lager = ruimere bochten)
    maxLean: 0.6,              // rad, maximaal overhellen (ca. 34 graden)
    mass: 190,                 // kg, telt bij botsingen
    surface: {
      road:  { speed: 1.0,  grip: 1.0 },   // asfalt: alles op volle sterkte
      curb:  { speed: 0.9,  grip: 0.8 },   // berm: iets trager, iets glad
      dirt:  { speed: 0.45, grip: 0.5 },   // dirt: sport verliest hier veel
      grass: { speed: 0.4,  grip: 0.4 },   // gras: nog erger
    },
    ability: {
      kind: "turbo",
      cooldown: 8,             // s wachttijd na gebruik
      duration: 1.5,           // s dat de turbo aanstaat
      strength: 1.25,          // factor op topSpeed en optrekken tijdens de turbo
    },
  },

  // Terreinwonder: trager op asfalt, maar bijna geen verlies op dirt en gras. Wendbaarst.
  cross: {
    label: "Modderrat",
    color: 0x16c4d8,           // helder turquoise (contrasteert met rood en oranje)
    topSpeed: 36,              // m/s op asfalt (= 130 km/u)
    acceleration: 18,          // m/s2 bij vol gas (licht, dus pittig)
    braking: 28,               // m/s2 bij vol remmen
    turnRate: 2.9,             // rad/s sturen bij lage snelheid
    turnRateAtTop: 1.35,       // rad/s sturen bij topsnelheid
    maxLean: 0.75,             // rad, maximaal overhellen (ca. 43 graden)
    mass: 150,                 // kg, lichtste van de drie
    surface: {
      road:  { speed: 1.0,  grip: 1.0 },   // asfalt: normaal
      curb:  { speed: 0.97, grip: 0.95 },  // berm: nauwelijks last
      dirt:  { speed: 0.92, grip: 0.92 },  // dirt: thuiswedstrijd, nauwelijks verlies
      grass: { speed: 0.9,  grip: 0.85 },  // gras: ook prima (iets trager dan dirt)
    },
    ability: {
      kind: "offroad",
      cooldown: 10,            // s wachttijd na gebruik
      duration: 3,             // s dat de offroad-boost aanstaat
      strength: 1.0,           // 0 tot 1: hoeveel van het verlies op gras en dirt wordt weggehaald (1 = alles)
    },
  },

  // Zware bonk: tussen sport en cross in qua snelheid, trage stuurbeweging, duwt anderen weg.
  cruiser: {
    label: "Zwaargewicht",
    color: 0xffb400,           // goudgeel
    topSpeed: 38,              // m/s op asfalt (= 137 km/u)
    acceleration: 12,          // m/s2 bij vol gas (traag op gang)
    braking: 24,               // m/s2 bij vol remmen
    turnRate: 1.7,             // rad/s sturen bij lage snelheid
    turnRateAtTop: 0.75,       // rad/s sturen bij topsnelheid
    maxLean: 0.45,             // rad, maximaal overhellen (ca. 26 graden)
    mass: 320,                 // kg, veel zwaarder dan de rest
    surface: {
      road:  { speed: 1.0,  grip: 1.0 },   // asfalt: normaal
      curb:  { speed: 0.9,  grip: 0.8 },   // berm: iets trager
      dirt:  { speed: 0.7,  grip: 0.7 },   // dirt: middelmatig
      grass: { speed: 0.65, grip: 0.6 },   // gras: middelmatig
    },
    ability: {
      kind: "shove",
      cooldown: 6,             // s wachttijd na gebruik
      duration: 0.4,           // s dat de duw duurt
      strength: 12,            // m/s zijwaartse duwsnelheid die een tegenstander in de zij krijgt
    },
  },
};

// Algemene instelbare getallen voor Throttle Rush: fysica en camera.
// Pas hier aan hoe de game aanvoelt. Alle waarden hebben een eenheid in het commentaar.
// De camera zit achter en iets boven de moto en kijkt vooruit; bij hoge snelheid wordt het beeld wijder.

export const CONFIG = {
  physicsStep: 1 / 60,       // s per fysica-stap (60 stappen per seconde)
  coastDecel: 4,             // m/s2 vertraging zonder gas
  reverseSpeed: 8,           // m/s maximaal achteruit
  resetBelowSpeed: 3,        // m/s: onder deze snelheid mag "R" je terugzetten
  camera: {
    fov: 62,                 // graden, gezichtsveld in rust
    distance: 7.5,           // m achter de moto
    height: 3.2,             // m boven de grond
    lookAhead: 9,            // m vooruit waar de camera naar kijkt
    followSharpness: 6,      // hoe snel de camera volgt (hoger = strakker, lager = zweveriger)
    speedFovBoost: 14,       // extra graden fov bij topsnelheid (gevoel van snelheid)
  },
  race: {
    laps: 3,                 // aantal ronden (3 x ~31 s = ~95 s racen, kort genoeg om snel opnieuw te proberen)
    countdownSeconds: 3,     // s aftellen: 3, 2, 1, dan GO
    checkpointCount: 5,      // controlepunten per ronde, gelijk verdeeld buiten het stuk dat de shortcut overslaat (~150 m tussenruimte)
  },
  // Botsingen tussen moto's en de zijduw van de cruiser (zie docs/contracts/08-botsingen-en-knoppen.md).
  collisions: {
    radius: 0.9,             // m, botsstraal van één moto (een moto is ca. 2 m lang, dus past goed)
    bounce: 0.3,             // 0..1, hoe hard moto's van elkaar afketsen: voelt als een duw, niet als een pingpongbal
    speedLoss: 0.12,         // deel van de snelheid dat je verliest bij een botsing (laag gehouden: in een pak botst je vaak achter elkaar)
    pushDecay: 4,            // 1/s, hoe snel een zijwaartse duw uitdooft (duwsnelheid / 4 = afstand in m, dus 16 m/s = ca. 4 m)
    shoveRange: 5,           // m, maximale afstand voor de zijduw (ruim een moto-lengte naast je)
    shoveStun: 1.0,          // s, hoe lang het slachtoffer van een zijduw max 30% gas heeft: voelbaar, maar geen straf voor de hele ronde
  },
};

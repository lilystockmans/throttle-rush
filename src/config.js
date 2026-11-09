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
};

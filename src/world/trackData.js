// Circuitdata van "Zandstorm Ring": alleen getallen, geen logica. Alle posities zijn [x, z] in meter.
// De punten vormen de middenlijn van de baan (een gesloten lus, rijrichting = volgorde van de punten).
// Verschuif een punt een paar meter om een bocht te veranderen; houd bochten ruimer dan ca. 25 m straal.

export const TRACK = {
  name: "Zandstorm Ring",
  points: [
    // Start/finish en lange rechte stuk onderaan (rijdt naar rechts, +x)
    [-98, 126], [-20, 128], [45, 124],
    // Snelle ruime bocht naar rechtsboven en de snelle S-bocht aan de oostkant (rijdt naar boven, -z)
    [105, 100], [142, 50], [128, 0], [148, -55], [118, -105],
    // Tweede rechte stuk bovenaan (rijdt naar links, -x)
    [45, -122], [-20, -117], [-88, -122],
    // Brede bocht linksboven en daarna een korte rechte naar het midden (rijdt naar rechts, +x)
    [-146, -116], [-182, -82], [-170, -46], [-110, -34], [-58, -34],
    // Haarspeldbocht in het midden-links (draait 180 graden, straal ca. 32 m)
    [-33, -23], [-24, 0], [-33, 23],
    // Terug naar links, ruime U-bocht linksonder en weer naar de start
    [-58, 34], [-100, 42], [-134, 58], [-141, 86], [-131, 114],
  ],
  roadWidth: 14,     // m, breedte asfalt totaal (links + rechts)
  curbWidth: 1.5,    // m, breedte berm aan elke kant van het asfalt
  // Dirt-shortcut door het binnenveld: begint op het onderste rechte stuk, komt uit op het bovenste.
  // Hij slaat de hele oostkant over (ca. 451 m asfalt) met een pad van ca. 287 m (36% korter).
  // Eerste en laatste punt liggen op de middenlijn; verplaats je ze, dan moet dat exact op de lijn blijven.
  shortcut: {
    points: [[-26.4, 128.1], [5, 92], [45, 30], [70, -35], [66, -85], [41.3, -122.2]],
    width: 7,        // m, breedte van het dirt-pad
  },
};

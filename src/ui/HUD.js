// HUD.js: de snelheidsmeter rechtsonder in beeld (groot getal + "km/u") met de ondergrond eronder.
// createHUD() bouwt de HTML en zet die in <div id="ui">. De game roept elk beeld setSpeed() en
// setSurface() aan. Omdat dat 60x per seconde gebeurt, passen we de pagina alleen aan als er echt iets verandert.
// Achteruit rijden: we tonen het getal zonder minteken, in rood. Zo blijft het getal even breed en leest het sneller dan "-12".

// Nederlandse namen bij de ondergronden uit het contract
const SURFACE_NAMES = {
  road: "asfalt",
  curb: "berm",
  dirt: "aarde",
  grass: "gras",
};

// Kleine hulpfunctie: maak een element met een klasse en eventueel tekst
function maakElement(tag, klasse, tekst) {
  const el = document.createElement(tag);
  el.className = klasse;
  if (tekst !== undefined) el.textContent = tekst;
  return el;
}

export function createHUD() {
  // Bouw de onderdelen
  const root = maakElement("div", "hud");
  const speedRij = maakElement("div", "hud__speed");
  const waarde = maakElement("span", "hud__value", "0");
  const eenheid = maakElement("span", "hud__unit", "km/u");
  const ondergrond = maakElement("div", "hud__surface", SURFACE_NAMES.road);
  ondergrond.dataset.surface = "road";

  speedRij.append(waarde, eenheid);
  root.append(speedRij, ondergrond);

  // De HUD verandert 60x per seconde: een schermlezer zou hierdoor doorlopend praten.
  // Daarom verbergen we hem voor hulpsoftware.
  root.setAttribute("aria-hidden", "true");

  // Zet in #ui; als die ontbreekt, val terug op <body> zodat de HUD nooit verdwijnt
  const houder = document.getElementById("ui") || document.body;
  houder.appendChild(root);

  // Onthoud wat er nu getoond wordt, zodat we kunnen vergelijken
  let getoondeSnelheid = 0;
  let getoondAchteruit = false;
  let getoondeOndergrond = "road";

  return {
    // kmh: getal, mag negatief zijn (achteruit)
    setSpeed(kmh) {
      let afgerond = Math.round(kmh);
      if (!Number.isFinite(afgerond)) afgerond = 0; // beveiliging tegen NaN
      const achteruit = afgerond < 0;
      const getal = Math.abs(afgerond); // Math.abs maakt van -0 ook gewoon 0

      if (getal !== getoondeSnelheid) {
        getoondeSnelheid = getal;
        waarde.textContent = String(getal);
      }
      if (achteruit !== getoondAchteruit) {
        getoondAchteruit = achteruit;
        root.classList.toggle("is-reverse", achteruit);
      }
    },

    // surface: "road" | "curb" | "dirt" | "grass"
    setSurface(surface) {
      if (surface === getoondeOndergrond) return;
      getoondeOndergrond = surface;
      // Onbekende waarde? Toon dan de waarde zelf in plaats van een lege chip
      ondergrond.textContent = SURFACE_NAMES[surface] || String(surface);
      ondergrond.dataset.surface = surface;
    },
  };
}

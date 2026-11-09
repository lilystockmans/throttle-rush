// HUD.js: de snelheidsmeter rechtsonder in beeld (groot getal + "km/u") met de ondergrond eronder.
// createHUD() bouwt de HTML en zet die in <div id="ui">. De game roept elk beeld setSpeed() en
// setSurface() aan. Omdat dat 60x per seconde gebeurt, passen we de pagina alleen aan als er echt iets verandert.
// Speciale-knop-meter (contract 08-F): setAbility() toont naam, afkoelbalk en "SPATIE" als hij klaar is.
// flashHit() toont een korte rode melding (bv. "Geduwd!") bovenaan het midden. Stijl: src/ui/ability.css.
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

// De balk en het percentage bewegen in stappen van 2% (50 stappen): kleinere verschillen zijn onzichtbaar
const STAPPEN = 50;

// Tekst naast de naam, per toestand (bij afkoelen tonen we het percentage)
const LABEL_KLAAR = "SPATIE";
const LABEL_ACTIEF = "ACTIEF";

export function createHUD() {
  // Bouw de onderdelen
  const root = maakElement("div", "hud");
  const speedRij = maakElement("div", "hud__speed");
  const waarde = maakElement("span", "hud__value", "0");
  const eenheid = maakElement("span", "hud__unit", "km/u");
  const ondergrond = maakElement("div", "hud__surface", SURFACE_NAMES.road);
  ondergrond.dataset.surface = "road";

  // Speciale-knop-meter: kop (naam + label) en een balk. Blijft verborgen tot de eerste setAbility().
  const knop = maakElement("div", "ability is-hidden");
  const knopKop = maakElement("div", "ability__head");
  const knopNaam = maakElement("span", "ability__name", "");
  const knopLabel = maakElement("span", "ability__label", "");
  const knopBaan = maakElement("div", "ability__track");
  const knopVulling = maakElement("div", "ability__fill");
  knop.dataset.state = "cooling";
  knopKop.append(knopNaam, knopLabel);
  knopBaan.append(knopVulling);
  knop.append(knopKop, knopBaan);

  speedRij.append(waarde, eenheid);
  root.append(speedRij, ondergrond, knop);

  // Rode treffer-melding: los element in #ui, zodat hij los van het paneel rechtsonder staat
  const melding = maakElement("div", "hit-flash");

  // De HUD verandert 60x per seconde: een schermlezer zou hierdoor doorlopend praten.
  // Daarom verbergen we hem voor hulpsoftware.
  root.setAttribute("aria-hidden", "true");

  // Zet in #ui; als die ontbreekt, val terug op <body> zodat de HUD nooit verdwijnt
  const houder = document.getElementById("ui") || document.body;
  houder.append(root, melding);

  // Onthoud wat er nu getoond wordt, zodat we kunnen vergelijken
  let getoondeSnelheid = 0;
  let getoondAchteruit = false;
  let getoondeOndergrond = "road";
  // Wat de knop-meter nu toont (null = nog niets getoond, dus eerste aanroep schrijft alles)
  let knopNaamNu = null;
  let knopStaat = null;     // "cooling" | "ready" | "active"
  let knopStap = -1;        // vulling in stappen van 2% (0..50)

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

    // { name, ready, active, fraction }: fraction 0..1 = hoeveel van de afkoeltijd voorbij is.
    // Geef niets (of null) mee om de meter te verbergen.
    setAbility(info) {
      if (!info) {
        if (knopStaat !== null) {
          knopStaat = null;
          knopNaamNu = null;
          knop.classList.add("is-hidden");
        }
        return;
      }
      const naam = String(info.name ?? "");
      const staat = info.active ? "active" : info.ready ? "ready" : "cooling";
      let breuk = Number(info.fraction);
      if (!Number.isFinite(breuk)) breuk = 0; // beveiliging tegen NaN
      // Klaar of actief = balk vol; anders afronden op 2%
      const stap = staat === "cooling" ? Math.round(Math.min(1, Math.max(0, breuk)) * STAPPEN) : STAPPEN;

      if (knopStaat === null) knop.classList.remove("is-hidden");
      if (naam !== knopNaamNu) {
        knopNaamNu = naam;
        knopNaam.textContent = naam;
      }
      if (staat !== knopStaat) {
        knopStaat = staat;
        knop.dataset.state = staat;
        if (staat === "ready") knopLabel.textContent = LABEL_KLAAR;
        if (staat === "active") knopLabel.textContent = LABEL_ACTIEF;
        knopStap = -1; // label en balk voor deze toestand opnieuw bepalen
      }
      if (stap !== knopStap) {
        knopStap = stap;
        knopVulling.style.width = stap * (100 / STAPPEN) + "%";
        if (staat === "cooling") knopLabel.textContent = stap * (100 / STAPPEN) + "%";
      }
    },

    // Korte rode melding. Twee keer snel na elkaar = dezelfde melding opnieuw, geen opstapeling.
    flashHit(tekst) {
      melding.textContent = String(tekst ?? "");
      melding.classList.remove("is-show");
      void melding.offsetWidth; // dwingt de browser de animatie opnieuw te starten
      melding.classList.add("is-show");
    },

    // true = snelheidsmeter tonen, false = verbergen (bijvoorbeeld tijdens het keuzemenu)
    setVisible(zichtbaar) {
      root.classList.toggle("is-hidden", !zichtbaar);
      melding.classList.toggle("is-hidden", !zichtbaar);
    },
  };
}

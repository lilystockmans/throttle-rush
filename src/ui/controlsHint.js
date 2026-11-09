// controlsHint.js: klein paneel linksonder dat uitlegt welke toetsen je nodig hebt.
// showControlsHint() zet het paneel in <div id="ui"> en laat het weer verdwijnen na 8 seconden
// of zodra je een toets indrukt (met een zachte fade). Je mag de functie vaker aanroepen (na elke start):
// een vorig paneel wordt dan eerst weggehaald, met zijn timers en toetsenbord-luisteraar.

const ZICHTBAAR_MS = 8000; // hoe lang het paneel blijft staan als je niets indrukt
const FADE_MS = 600;       // moet gelijk zijn aan --ui-fade in styles.css

// Elke regel: lijst met toetsen (of "of" als tussentekst) en wat ze doen
const REGELS = [
  { toetsen: ["↑", "↓", "←", "→", "of", "W", "A", "S", "D"], label: "rijden" },
  { toetsen: ["Spatie"], label: "speciale knop" },
  { toetsen: ["R"], label: "terug op de baan" },
  { toetsen: ["Esc"], label: "terug naar het menu" },
];

// Het paneel dat nu in beeld is (of null). Hiermee ruimen we bij een nieuwe aanroep het oude op.
let huidig = null;

// Bouw één rij: toetsen als keycaps, daarna de uitleg
function maakRij(regel) {
  const rij = document.createElement("div");
  rij.className = "hint__row";

  for (const toets of regel.toetsen) {
    const el = document.createElement("span");
    // "of" is geen toets maar een verbindingswoord, dus geen keycap
    el.className = toets === "of" ? "hint__or" : "keycap";
    el.textContent = toets;
    rij.appendChild(el);
  }

  const label = document.createElement("span");
  label.className = "hint__label";
  label.textContent = regel.label;
  rij.appendChild(label);
  return rij;
}

export function showControlsHint() {
  // Eerst het vorige paneel helemaal opruimen
  if (huidig) huidig.ruimOp();

  // Bouw het paneel
  const paneel = document.createElement("div");
  paneel.className = "hint";
  // Anders dan de HUD wel leesbaar voor hulpsoftware: het is tekst die één keer verschijnt
  paneel.setAttribute("role", "note");
  paneel.setAttribute("aria-label", "Besturing");

  const titel = document.createElement("p");
  titel.className = "hint__title";
  titel.textContent = "Besturing";
  paneel.appendChild(titel);
  for (const regel of REGELS) paneel.appendChild(maakRij(regel));

  (document.getElementById("ui") || document.body).appendChild(paneel);

  let zichtTimer = null;   // timer voor "na 8 seconden"
  let weghaalTimer = null; // timer die het paneel na de fade uit de pagina haalt
  let isBezigMetVerdwijnen = false;

  // Alles opruimen: paneel, beide timers en de luisteraar. Mag vaker aangeroepen worden.
  function ruimOp() {
    clearTimeout(zichtTimer);
    clearTimeout(weghaalTimer);
    window.removeEventListener("keydown", opToets);
    paneel.remove();
    if (huidig === mijnHandle) huidig = null;
  }

  // Start de fade en ruim daarna op. Doet het maar één keer.
  function verberg() {
    if (isBezigMetVerdwijnen) return;
    isBezigMetVerdwijnen = true;

    clearTimeout(zichtTimer);
    window.removeEventListener("keydown", opToets);
    paneel.classList.add("is-hiding"); // CSS doet de fade
    weghaalTimer = setTimeout(ruimOp, FADE_MS + 50); // iets langer dan de fade, dan uit de DOM
  }

  // Elke eerste toets laat het paneel verdwijnen, behalve Enter en vasthouden (herhaling):
  // Enter is vaak de toets waarmee het menu net gestart is.
  function opToets(e) {
    if (e.repeat || e.key === "Enter") return;
    verberg();
  }

  const mijnHandle = { ruimOp };
  huidig = mijnHandle;

  window.addEventListener("keydown", opToets);
  zichtTimer = setTimeout(verberg, ZICHTBAAR_MS);
}

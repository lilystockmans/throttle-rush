// controlsHint.js: klein paneel linksonder dat uitlegt welke toetsen je nodig hebt.
// showControlsHint() zet het paneel in <div id="ui"> en laat het weer verdwijnen na 8 seconden
// of zodra je de eerste toets indrukt (met een zachte fade). Daarna halen we het paneel uit de
// pagina en ruimen we de toetsenbord-luisteraar en de timer op.

const ZICHTBAAR_MS = 8000; // hoe lang het paneel blijft staan als je niets indrukt
const FADE_MS = 600;       // moet gelijk zijn aan --ui-fade in styles.css

// Elke regel: lijst met toetsen (of "of" als tussentekst) en wat ze doen
const REGELS = [
  { toetsen: ["↑", "↓", "←", "→", "of", "W", "A", "S", "D"], label: "rijden" },
  { toetsen: ["Spatie"], label: "speciale knop" },
  { toetsen: ["R"], label: "terug op de baan" },
];

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

  let timer = null;
  let isBezigMetVerdwijnen = false;

  // Haalt het paneel definitief weg
  function verwijder() {
    paneel.remove();
  }

  // Start de fade en verwijder het paneel daarna. Mag vaker aangeroepen worden, doet het maar één keer.
  function verberg() {
    if (isBezigMetVerdwijnen) return;
    isBezigMetVerdwijnen = true;

    // Opruimen: geen timer en geen luisteraar meer nodig
    clearTimeout(timer);
    window.removeEventListener("keydown", verberg);

    paneel.classList.add("is-hiding"); // CSS doet de fade
    setTimeout(verwijder, FADE_MS + 50); // iets langer dan de fade, dan uit de DOM
  }

  window.addEventListener("keydown", verberg);
  timer = setTimeout(verberg, ZICHTBAAR_MS);
}

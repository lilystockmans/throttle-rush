// soundToggle.js: klein rond geluidsknopje rechtsboven (luidspreker, doorgestreept en gedimd als gedempt).
// createSoundToggle({ onToggle(muted) }) zet het knopje in <div id="ui">. Klik of toets M wisselt het geluid
// en roept onToggle(muted) aan. setMuted(bool) zet alleen de weergave (geen onToggle), voor als de game het
// geluid zelf aanpast. Stijl: src/ui/sound.css. Mag vaker aangeroepen worden: het oude knopje verdwijnt dan.

const TOETS = "m";
const ICOON = "\u{1F50A}"; // luidspreker met geluid; "gedempt" wordt met CSS (schuine streep + dimmen) getoond

// Het toggle dat nu in beeld is (of null), zodat een tweede aanroep het oude opruimt
let huidig = null;

export function createSoundToggle({ onToggle } = {}) {
  if (huidig) huidig.ruimOp();

  const knop = document.createElement("div");
  knop.className = "sound-toggle";
  knop.setAttribute("role", "button");
  knop.setAttribute("aria-label", "Geluid aan/uit");
  knop.setAttribute("title", "Geluid aan/uit (M)");
  // tabindex -1: klikbaar, maar nooit de focus-knop die Enter of spatie (start van de race) overneemt
  knop.setAttribute("tabindex", "-1");
  const icoon = document.createElement("span");
  icoon.className = "sound-toggle__icon";
  icoon.textContent = ICOON;
  icoon.setAttribute("aria-hidden", "true");
  knop.appendChild(icoon);

  let gedempt = false;
  function toon(waarde) {
    gedempt = !!waarde;
    knop.setAttribute("aria-pressed", gedempt ? "true" : "false");
    knop.classList.toggle("is-muted", gedempt);
  }
  toon(false);

  // Gebruiker wisselt: nieuwe stand tonen en de game laten weten
  function wissel() {
    toon(!gedempt);
    if (typeof onToggle === "function") onToggle(gedempt);
  }

  function opKlik(e) {
    if (e && e.preventDefault) e.preventDefault();
    wissel();
  }

  function opToets(e) {
    if (e.repeat) return;                              // vasthouden telt niet als steeds opnieuw wisselen
    if (e.ctrlKey || e.metaKey || e.altKey) return;    // Cmd+M (minimaliseren) en dergelijke met rust laten
    if (String(e.key).toLowerCase() !== TOETS) return;
    const tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return; // typen in een tekstveld
    wissel();
  }

  knop.addEventListener("click", opKlik);
  // mousedown niet laten focussen: het canvas en de toetsen van de game houden hun gedrag
  knop.addEventListener("mousedown", (e) => { if (e && e.preventDefault) e.preventDefault(); });
  window.addEventListener("keydown", opToets);

  (document.getElementById("ui") || document.body).appendChild(knop);

  const handle = {
    setMuted: toon,
    isMuted: () => gedempt,
    ruimOp() {
      window.removeEventListener("keydown", opToets);
      knop.remove();
      if (huidig === handle) huidig = null;
    },
  };
  huidig = handle;
  return handle;
}

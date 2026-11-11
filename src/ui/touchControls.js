// touchControls.js: aanraakknoppen voor op een telefoon (links/rechts, gas, rem, speciaal, terug op baan, menu)
// en de "Draai je telefoon"-melding bij een staand scherm. Elke vinger onthoudt zijn eigen knop (Pointer Events
// met setPointerCapture), dus sturen en gas geven tegelijk werkt. Op een laptop (geen aanraking) maakt dit niets aan.
// Stijl en layout: src/ui/touch.css. Koppeling gebeurt in main.js.

const TOUCH_QUERY = "(pointer: coarse)";
const TOUCH_CLASS = "is-touch";
const HIDDEN_CLASS = "is-hidden";
const PRESSED_CLASS = "is-pressed";

// Knoppen: sleutel -> tekst, klassenaam en aria-label. "kind" bepaalt wat het in de stand doet.
const BUTTONS = [
  { key: "left",   text: "←",         label: "Links sturen",  group: "steer"  },
  { key: "right",  text: "→",         label: "Rechts sturen", group: "steer"  },
  { key: "brake",  text: "Rem",            label: "Rem",           group: "drive"  },
  { key: "throttle", text: "Gas",          label: "Gas",           group: "drive"  },
  { key: "action", text: "Knop",          label: "Speciaal",      group: "drive"  },
  { key: "reset",  text: "Terug op baan",  label: "Terug op de baan", group: "top" },
  { key: "menu",   text: "Menu",           label: "Menu",          group: "top"    },
];

const ROTATE_TEXT = "Draai je telefoon";
const ROTATE_ICON = "\u{1F4F1}"; // telefoon-icoon, draait via CSS
const NEUTRAL = { throttle: 0, brake: 0, steer: 0, action: false, reset: false };

// Wat nu in beeld is, zodat een tweede aanroep het oude netjes opruimt
let huidig = null;

export function isTouchDevice() {
  // ?touch in de adresbalk forceert aanraakmodus (handig om op een laptop te testen)
  if (typeof location !== "undefined" && new URLSearchParams(location.search).has("touch")) return true;
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    && window.matchMedia(TOUCH_QUERY).matches;
}

export function createTouchControls({ onChange, onMenu } = {}) {
  if (huidig) { huidig.ruimOp(); huidig = null; }
  if (!isTouchDevice()) return { setVisible() {}, destroy() {} };

  document.documentElement.classList.add(TOUCH_CLASS);

  // Laag met de knoppen
  const laag = document.createElement("div");
  laag.className = "touch-controls is-hidden";
  const groepen = {};
  for (const naam of ["steer", "drive", "top"]) {
    const g = document.createElement("div");
    g.className = "touch-group touch-group--" + naam;
    laag.appendChild(g);
    groepen[naam] = g;
  }

  // Per knop: welke vingers (pointerId) hem nu vasthouden
  const vast = {};
  const elementen = {};
  for (const b of BUTTONS) {
    const el = document.createElement("div");
    el.className = "touch-btn touch-btn--" + b.key;
    el.textContent = b.text;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", b.label);
    groepen[b.group].appendChild(el);
    vast[b.key] = new Set();
    elementen[b.key] = el;
  }

  // Draai-melding over alles heen (CSS toont hem alleen bij een staand scherm)
  const draai = document.createElement("div");
  draai.className = "touch-rotate";
  draai.setAttribute("role", "alert");
  const draaiIcoon = document.createElement("div");
  draaiIcoon.className = "touch-rotate__icon";
  draaiIcoon.textContent = ROTATE_ICON;
  draaiIcoon.setAttribute("aria-hidden", "true");
  const draaiTekst = document.createElement("div");
  draaiTekst.className = "touch-rotate__text";
  draaiTekst.textContent = ROTATE_TEXT;
  draai.append(draaiIcoon, draaiTekst);

  // Huidige stand uit de ingedrukte knoppen; onChange alleen bij een echte verandering
  let laatste = { ...NEUTRAL };
  function stand() {
    const is = (k) => vast[k].size > 0;
    return {
      throttle: is("throttle") ? 1 : 0,
      brake: is("brake") ? 1 : 0,
      steer: (is("right") ? 1 : 0) - (is("left") ? 1 : 0),
      action: is("action"),
      reset: is("reset"),
    };
  }
  function meld() {
    const nu = stand();
    const gelijk = Object.keys(nu).every((k) => nu[k] === laatste[k]);
    if (gelijk) return;
    laatste = nu;
    if (typeof onChange === "function") onChange({ ...nu });
  }

  function toonIngedrukt(key) {
    elementen[key].classList.toggle(PRESSED_CLASS, vast[key].size > 0);
  }

  function los(key, pointerId) {
    if (!vast[key].delete(pointerId)) return;
    toonIngedrukt(key);
    meld();
  }

  function loslatenAlles() {
    for (const key of Object.keys(vast)) {
      vast[key].clear();
      toonIngedrukt(key);
    }
    meld();
  }

  // Luisteraars per knop; bewaard zodat ruimOp ze weer weghaalt
  const opgeslagen = [];
  function luister(doel, type, fn, opties) {
    doel.addEventListener(type, fn, opties);
    opgeslagen.push(() => doel.removeEventListener(type, fn, opties));
  }

  for (const b of BUTTONS) {
    const el = elementen[b.key];
    luister(el, "pointerdown", (e) => {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (_) { /* oude browser: dan geen capture */ }
      if (b.key === "menu") {
        if (typeof onMenu === "function") onMenu();
        el.classList.add(PRESSED_CLASS);
        return;
      }
      vast[b.key].add(e.pointerId);
      toonIngedrukt(b.key);
      meld();
    });
    const klaar = (e) => {
      if (b.key === "menu") { el.classList.remove(PRESSED_CLASS); return; }
      los(b.key, e.pointerId);
    };
    luister(el, "pointerup", klaar);
    luister(el, "pointercancel", loslatenAlles);   // het systeem pakt de aanraking af: alles los
    luister(el, "lostpointercapture", klaar);
    luister(el, "contextmenu", (e) => e.preventDefault());
  }

  // Pagina naar de achtergrond: niets mag blijven hangen
  luister(window, "blur", loslatenAlles);
  luister(document, "visibilitychange", () => { if (document.hidden) loslatenAlles(); });

  document.body.append(laag, draai);

  function setVisible(zichtbaar) {
    laag.classList.toggle(HIDDEN_CLASS, !zichtbaar);
    if (!zichtbaar) loslatenAlles();
  }

  function ruimOp() {
    loslatenAlles();
    opgeslagen.forEach((weg) => weg());
    laag.remove();
    draai.remove();
    document.documentElement.classList.remove(TOUCH_CLASS);
  }

  huidig = { ruimOp };
  return { setVisible, destroy: ruimOp };
}

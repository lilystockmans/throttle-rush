// RaceUI.js: de race-interface. Aftellen groot in het midden, een paneel linksboven (ronde, tijd, beste,
// positie), korte meldingen en het finish-scherm met twee knoppen. Alles staat in een eigen laag in <div id="ui">.
// setTimes() wordt elk beeld aangeroepen: we schrijven alleen naar de pagina als de tekst echt verandert.
// Het klassement (contract 07-C) staat in standings.js. De stijl staat in race.css. Knoppen zijn <div>'s (net als in het menu), zodat spatie nooit dubbel klikt.

import { createStandings } from "./standings.js";

const COUNTDOWN_MS = 800;       // hoe lang een cijfer in beeld blijft (gelijk aan de animatie in race.css)
const GEEN_TIJD = "-:--.--";    // tekst als er nog geen tijd is (bijvoorbeeld nog geen beste ronde)

// Tijd in seconden naar "m:ss.cc", bijvoorbeeld 62.351 wordt "1:02.35". Ongeldig getal geeft GEEN_TIJD.
export function formatTime(sec) {
  if (typeof sec !== "number" || !Number.isFinite(sec) || sec < 0) return GEEN_TIJD;
  const honderdsten = Math.round(sec * 100);             // eerst afronden, dan pas opdelen
  const min = Math.floor(honderdsten / 6000);
  const s = Math.floor((honderdsten % 6000) / 100);
  const cc = honderdsten % 100;
  return `${min}:${String(s).padStart(2, "0")}.${String(cc).padStart(2, "0")}`;
}

// Kleine hulpfunctie: maak een element met een klasse en eventueel tekst
function maak(tag, klasse, tekst) {
  const el = document.createElement(tag);
  el.className = klasse;
  if (tekst !== undefined) el.textContent = tekst;
  return el;
}

// Zet een tekst alleen als hij anders is dan de vorige. Geeft het getoonde element terug via een sluiting.
function maakTekstZetter(el) {
  let vorige = el.textContent;
  return (tekst) => {
    if (tekst === vorige) return;
    vorige = tekst;
    el.textContent = tekst;
  };
}

// Start een CSS-animatie opnieuw (klasse weg, even "meten", klasse terug)
function herstartAnimatie(el, klasse) {
  el.classList.remove(klasse);
  void el.offsetWidth;
  el.classList.add(klasse);
}

export function createRaceUI({ onRestart, onMenu } = {}) {
  const root = maak("div", "race");
  root.setAttribute("aria-live", "polite");

  // ---------- Paneel linksboven ----------
  const paneel = maak("div", "race-panel");
  const rondeEl = maak("div", "race-panel__lap", "Ronde 1/1");
  const tijdRij = maak("div", "race-panel__row");
  const tijdEl = maak("span", "race-panel__time", GEEN_TIJD);
  tijdRij.append(maak("span", "race-panel__label", "Tijd"), tijdEl);
  const besteRij = maak("div", "race-panel__row");
  const besteEl = maak("span", "race-panel__best", GEEN_TIJD);
  besteRij.append(maak("span", "race-panel__label", "Beste"), besteEl);
  const positieEl = maak("div", "race-panel__pos is-hidden", "");
  paneel.append(rondeEl, tijdRij, besteRij, positieEl);

  // ---------- Aftellen en melding ----------
  const aftelEl = maak("div", "race-countdown", "");
  const flashEl = maak("div", "race-flash", "");

  // ---------- Finish-scherm ----------
  const finishEl = maak("div", "race-finish");
  root.append(paneel, aftelEl, flashEl, finishEl);
  (document.getElementById("ui") || document.body).appendChild(root);

  const zetRonde = maakTekstZetter(rondeEl);
  const zetTijd = maakTekstZetter(tijdEl);
  const zetBeste = maakTekstZetter(besteEl);
  const zetPositie = maakTekstZetter(positieEl);
  let positieVerborgen = true;
  let aftelTimer = null;
  let finishOpen = false;
  let klassement = null; // het klassement van het open finish-scherm (null = er is geen)

  // ---------- Finish-toetsen: alleen actief zolang het scherm open is ----------
  function opToets(e) {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return; // vasthouden en sneltoetsen negeren
    const toets = e.key;
    if (toets === "Enter" || toets === "r" || toets === "R") {
      if (e.preventDefault) e.preventDefault();
      kies(onRestart);
    } else if (toets === "Escape") {
      if (e.preventDefault) e.preventDefault();
      kies(onMenu);
    }
  }

  // Sluit het scherm (zo kan een tweede toets of klik niets dubbel doen) en roep dan de functie aan
  function kies(actie) {
    if (!finishOpen) return;
    api.hideFinish();
    if (typeof actie === "function") actie();
  }

  function maakKnop(tekst, toetsTekst, klasse, actie) {
    const knop = maak("div", `race-btn ${klasse}`);
    knop.setAttribute("role", "button");
    knop.append(maak("span", "race-btn__text", tekst), maak("span", "race-btn__key", toetsTekst));
    knop.addEventListener("click", () => kies(actie));
    return knop;
  }

  const api = {
    setVisible(zichtbaar) {
      root.classList.toggle("is-hidden", !zichtbaar);
    },

    // value: 3, 2, 1 of "GO". Pop-animatie, verdwijnt na COUNTDOWN_MS vanzelf.
    showCountdown(value) {
      clearTimeout(aftelTimer);
      aftelEl.textContent = String(value);
      aftelEl.classList.toggle("is-go", value === "GO");
      aftelEl.classList.add("is-on");
      herstartAnimatie(aftelEl, "is-pop");
      aftelTimer = setTimeout(() => {
        aftelEl.classList.remove("is-on", "is-pop", "is-go");
        aftelEl.textContent = "";
      }, COUNTDOWN_MS);
    },

    setLap(current, total) {
      zetRonde(`Ronde ${current}/${total}`);
    },

    setTimes(currentLapSec, bestLapSec) {
      zetTijd(formatTime(currentLapSec));
      zetBeste(formatTime(bestLapSec));
    },

    // Bij 1 rijder is een positie zinloos: dan verbergen we het vak
    setPosition(position, total) {
      const verberg = !(total > 1);
      if (verberg !== positieVerborgen) {
        positieVerborgen = verberg;
        positieEl.classList.toggle("is-hidden", verberg);
      }
      if (!verberg) zetPositie(`${position}e / ${total}`);
    },

    // Korte melding onder het aftel-gebied; de fade zit in de CSS-animatie
    flash(text) {
      flashEl.textContent = String(text);
      herstartAnimatie(flashEl, "is-show");
    },

    showFinish({ position, total, totalTime, lapTimes = [], bestLap, bikeLabel = "", standings }) {
      api.hideFinish();
      finishEl.textContent = "";

      const kaart = maak("div", "race-card");
      kaart.append(
        maak("h2", "race-card__place", `${position}e plaats!`),
        maak("div", "race-card__sub", total > 1 ? `van ${total} rijders` : "Race uitgereden"),
        maak("div", "race-card__total", formatTime(totalTime)),
      );

      // Beste ronde: de opgegeven bestLap, anders de kortste uit de lijst. Alleen de eerste treffer.
      const beste = Number.isFinite(bestLap) ? bestLap : Math.min(...lapTimes);
      const bestIndex = lapTimes.findIndex((t) => Math.abs(t - beste) < 1e-6);
      const lijst = maak("div", "race-laps");
      lapTimes.forEach((t, i) => {
        const rij = maak("div", i === bestIndex ? "race-laps__row is-best" : "race-laps__row");
        rij.append(maak("span", "race-laps__n", `Ronde ${i + 1}`), maak("span", "race-laps__t", formatTime(t)));
        if (i === bestIndex) rij.append(maak("span", "race-laps__tag", "Beste"));
        lijst.appendChild(rij);
      });

      const knoppen = maak("div", "race-card__buttons");
      knoppen.append(
        maakKnop("Opnieuw", "Enter / R", "race-btn--go", onRestart),
        maakKnop("Andere moto", "Esc", "race-btn--alt", onMenu),
      );

      // Met klassement: rondetijden en klassement in twee vakken (naast elkaar of onder elkaar, zie race.css)
      klassement = null;
      if (Array.isArray(standings) && standings.length > 0) {
        klassement = createStandings(formatTime);
        klassement.update(standings);
        const kolommen = maak("div", "race-card__cols");
        kolommen.append(lijst, klassement.el);
        kaart.classList.add("race-card--standings");
        kaart.append(kolommen, maak("div", "race-card__bike", bikeLabel), knoppen);
      } else {
        kaart.append(lijst, maak("div", "race-card__bike", bikeLabel), knoppen);
      }
      finishEl.appendChild(kaart);
      finishEl.classList.add("is-open");
      finishOpen = true;
      window.addEventListener("keydown", opToets);
    },

    // Werk het klassement bij terwijl het finish-scherm open is (zonder klassement bij showFinish: niets doen)
    updateStandings(standings) {
      if (finishOpen && klassement) klassement.update(standings);
    },

    hideFinish() {
      klassement = null;
      window.removeEventListener("keydown", opToets);
      finishOpen = false;
      finishEl.classList.remove("is-open");
    },
  };
  return api;
}

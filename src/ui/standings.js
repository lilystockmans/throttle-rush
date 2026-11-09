// standings.js: het klassement op het finish-scherm (plaats, kleurbolletje, naam, moto, tijd of "rijdt nog").
// createStandings(formatTime) geeft een element en een update(lijst) terug. update() zet alleen tekst, klassen
// of kleur die echt veranderd zijn, zodat nieuwe binnenkomers goedkoop en zonder flikkeren verwerkt worden.
// De stijl staat in race.css. formatTime komt van buiten mee (RaceUI.js), zo hoeven we niet circulair te importeren.

const BEZIG_TEKST = "rijdt nog"; // tekst als een rijder nog niet binnen is (time === null)

function maak(tag, klasse) {
  const el = document.createElement(tag);
  el.className = klasse;
  return el;
}

export function createStandings(formatTime) {
  const el = maak("div", "race-stand");
  let rijen = []; // per rij: { rij, plaatsEl, bolEl, naamEl, bikeEl, tijdEl, vorige }

  // Bouw een lege rij. De 'vorige'-waarden zijn bewust ongeldig, zodat de eerste update alles zet.
  function bouwRij() {
    const rij = maak("div", "race-stand__row");
    const plaatsEl = maak("span", "race-stand__place");
    const bolEl = maak("span", "race-stand__dot");
    const wie = maak("span", "race-stand__who");
    const naamEl = maak("span", "race-stand__name");
    const bikeEl = maak("span", "race-stand__bike");
    const tijdEl = maak("span", "race-stand__time");
    wie.append(naamEl, bikeEl);
    rij.append(plaatsEl, bolEl, wie, tijdEl);
    el.appendChild(rij);
    return { rij, plaatsEl, bolEl, naamEl, bikeEl, tijdEl, vorige: {} };
  }

  // Zet een eigenschap alleen als ze anders is dan de vorige keer
  function zet(r, sleutel, waarde, schrijf) {
    if (r.vorige[sleutel] === waarde) return;
    r.vorige[sleutel] = waarde;
    schrijf(waarde);
  }

  function vulRij(r, s, index) {
    const bezig = !(typeof s.time === "number" && Number.isFinite(s.time));
    zet(r, "plaats", index + 1, (v) => { r.plaatsEl.textContent = String(v); });
    zet(r, "kleur", s.color, (v) => { r.bolEl.style.background = v || "transparent"; });
    zet(r, "naam", s.name || "", (v) => { r.naamEl.textContent = v; });
    zet(r, "bike", s.bikeLabel || "", (v) => { r.bikeEl.textContent = v; });
    zet(r, "tijd", bezig ? BEZIG_TEKST : formatTime(s.time), (v) => { r.tijdEl.textContent = v; });
    zet(r, "bezig", bezig, (v) => r.rij.classList.toggle("is-busy", v));
    zet(r, "speler", !!s.isPlayer, (v) => r.rij.classList.toggle("is-player", v));
  }

  return {
    el,
    // Vernieuw het klassement. Verandert het aantal rijders, dan bouwen we de rijen opnieuw op.
    update(lijst) {
      const standings = Array.isArray(lijst) ? lijst : [];
      if (standings.length !== rijen.length) {
        el.textContent = "";
        rijen = standings.map(bouwRij);
      }
      standings.forEach((s, i) => vulRij(rijen[i], s, i));
    },
  };
}

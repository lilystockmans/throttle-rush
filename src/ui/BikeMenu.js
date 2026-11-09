// BikeMenu.js: het keuzemenu waarin de speler een moto kiest (drie kaarten onderaan het scherm).
// createBikeMenu() bouwt de HTML een keer en zet die in <div id="ui">. show() opent het menu,
// hide() sluit het. De toetsenbord-luisteraar staat alleen aan zolang het menu open is.
// De balken worden niet ingetypt maar berekend uit de moto-gegevens (hoogste van de drie = 100%).

const VOLGORDE = ["sport", "cross", "cruiser"]; // volgorde van de kaarten, van links naar rechts

// Korte uitleg per moto (de sleutel komt uit bikeTypes)
const TIPS = {
  sport: "Snelst op asfalt. Pure topsnelheid voor wie de bochten durft.",
  cross: "Koning van gras en aarde. Neem gerust de shortcut!",
  cruiser: "Zwaar als een tank. Duwt anderen zo van de baan.",
};

// Speciale knop: de naam die de speler ziet
const ABILITY_NAMES = { turbo: "Turbo", offroad: "Offroad-boost", shove: "Zijduw" };

// De vier balken: naam + hoe je de waarde uit een moto haalt
const BALKEN = [
  { naam: "Snelheid", waarde: (t) => t.topSpeed },
  { naam: "Offroad", waarde: (t) => (t.surface.dirt.speed + t.surface.grass.speed) / 2 },
  { naam: "Wendbaar", waarde: (t) => t.turnRateAtTop },
  { naam: "Gewicht", waarde: (t) => t.mass },
];

// Toetsen: welke toets doet wat
const TOETS_LINKS = ["ArrowLeft", "a", "A"];
const TOETS_RECHTS = ["ArrowRight", "d", "D"];
const TOETS_START = ["Enter", " ", "Spacebar"];

// Getal (0xff3344) naar CSS-kleur ("#ff3344")
function kleurNaarCss(kleur) {
  return "#" + kleur.toString(16).padStart(6, "0");
}

// Kleine hulpfunctie: maak een element met een klasse en eventueel tekst
function maakElement(tag, klasse, tekst) {
  const el = document.createElement(tag);
  el.className = klasse;
  if (tekst !== undefined) el.textContent = tekst;
  return el;
}

// Per moto vier getallen tussen 0 en 1: waarde gedeeld door de hoogste waarde van alle motos.
// Resultaat: { sport: [0.9, 0.5, ...], cross: [...], ... }
export function berekenBalken(bikeTypes, sleutels) {
  const resultaat = {};
  for (const k of sleutels) resultaat[k] = [];
  BALKEN.forEach((balk, i) => {
    const waarden = sleutels.map((k) => balk.waarde(bikeTypes[k]));
    const hoogste = Math.max(...waarden);
    sleutels.forEach((k, j) => {
      resultaat[k][i] = hoogste > 0 ? waarden[j] / hoogste : 0; // beveiliging tegen delen door 0
    });
  });
  return resultaat;
}

// Bouw een kaart. Geeft het element en de lijst met balk-vullingen terug (die animeren we later).
function maakKaart(sleutel, moto, fracties) {
  const kaart = maakElement("div", "card");
  kaart.setAttribute("role", "radio");
  kaart.style.setProperty("--kleur", kleurNaarCss(moto.color));

  const body = maakElement("div", "card__body");
  body.append(maakElement("h2", "card__name", moto.label));
  body.append(maakElement("p", "card__tip", TIPS[sleutel] || ""));

  const vullingen = [];
  BALKEN.forEach((balk, i) => {
    const rij = maakElement("div", "bar");
    const spoor = maakElement("div", "bar__track");
    const vulling = maakElement("div", "bar__fill");
    vulling.style.width = Math.round(fracties[i] * 100) + "%";
    spoor.append(vulling);
    rij.append(maakElement("span", "bar__label", balk.naam), spoor);
    body.append(rij);
    vullingen.push({ el: vulling, breedte: vulling.style.width });
  });

  const naam = ABILITY_NAMES[moto.ability && moto.ability.kind] || "-";
  const knop = maakElement("p", "card__ability", "Speciale knop: ");
  knop.append(maakElement("strong", "", naam));
  body.append(knop);

  kaart.append(maakElement("div", "card__band"), body);
  return { el: kaart, vullingen };
}

export function createBikeMenu({ bikeTypes, onHover, onChoose }) {
  const sleutels = VOLGORDE.filter((k) => bikeTypes && bikeTypes[k]);
  const fracties = berekenBalken(bikeTypes, sleutels);

  // ----- HTML bouwen -----
  const root = maakElement("div", "menu");
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Kies je moto");

  const kop = maakElement("div", "menu__head");
  kop.append(maakElement("h1", "menu__title", "Throttle Rush"));
  kop.append(maakElement("p", "menu__subtitle", "Kies je moto"));

  const kaartenRij = maakElement("div", "menu__cards");
  kaartenRij.setAttribute("role", "radiogroup");
  const kaarten = {}; // sleutel -> { el, vullingen }
  for (const k of sleutels) {
    kaarten[k] = maakKaart(k, bikeTypes[k], fracties[k]);
    kaarten[k].el.addEventListener("click", () => klikOpKaart(k));
    kaartenRij.append(kaarten[k].el);
  }

  const startKnop = maakElement("div", "menu__start", "Start");
  startKnop.setAttribute("role", "button");
  startKnop.addEventListener("click", () => start());
  const uitleg = maakElement("p", "menu__keys", "Kies met ← → of A D. Start met Enter, spatie of klik.");

  const onder = maakElement("div", "menu__bottom");
  onder.append(kaartenRij, startKnop, uitleg);
  root.append(kop, onder);
  (document.getElementById("ui") || document.body).appendChild(root);

  // ----- Toestand -----
  let open = false;
  let gekozen = sleutels[0];

  // Laat de balken van een kaart even van 0 naar hun waarde groeien
  function animeerBalken(sleutel) {
    const kaart = kaarten[sleutel];
    if (!kaart) return;
    for (const v of kaart.vullingen) v.el.style.width = "0%";
    void root.offsetWidth; // dwingt de browser de 0% te tekenen, anders is er niets om vanaf te groeien
    for (const v of kaart.vullingen) v.el.style.width = v.breedte;
  }

  // Zet de "is-selected"-stijl op de gekozen kaart en haal hem bij de rest weg
  function toonSelectie() {
    for (const k of sleutels) {
      kaarten[k].el.classList.toggle("is-selected", k === gekozen);
      kaarten[k].el.setAttribute("aria-checked", String(k === gekozen));
    }
  }

  function kies(sleutel) {
    if (sleutel === gekozen || !kaarten[sleutel]) return;
    gekozen = sleutel;
    toonSelectie();
    animeerBalken(sleutel);
    if (onHover) onHover(sleutel);
  }

  // Een stap naar links (-1) of rechts (+1); aan het uiteinde spring je naar de andere kant
  function stap(richting) {
    const nu = sleutels.indexOf(gekozen);
    kies(sleutels[(nu + richting + sleutels.length) % sleutels.length]);
  }

  function start() {
    if (!open) return;
    try {
      if (onChoose) onChoose(gekozen);
    } finally {
      hide(); // ook als onChoose een fout geeft blijft het menu niet hangen
    }
  }

  function klikOpKaart(sleutel) {
    if (sleutel === gekozen) start();
    else kies(sleutel);
  }

  // ----- Toetsenbord (alleen aan zolang het menu open is) -----
  function opToets(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    let gebruikt = true;
    if (TOETS_LINKS.includes(e.key)) stap(-1);
    else if (TOETS_RECHTS.includes(e.key)) stap(1);
    else if (TOETS_START.includes(e.key)) start();
    else gebruikt = false;

    if (gebruikt) {
      e.preventDefault(); // spatie scrollt anders de pagina, Enter drukt anders een knop in
      // Stopt luisteraars die later op window zijn gezet (bijvoorbeeld de game), zodat Enter/spatie
      // die het menu sluit niet ook nog iets in de game aanzet.
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
  }

  function show(sleutel) {
    if (sleutel && kaarten[sleutel]) gekozen = sleutel;
    toonSelectie();
    if (!open) {
      open = true;
      window.addEventListener("keydown", opToets);
    }
    root.classList.add("is-open");
    for (const k of sleutels) animeerBalken(k); // korte intro-animatie
  }

  function hide() {
    window.removeEventListener("keydown", opToets);
    open = false;
    root.classList.remove("is-open");
  }

  toonSelectie();

  return {
    show,
    hide,
    isOpen: () => open,
  };
}

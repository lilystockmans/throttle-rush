// Minimap.js: kleine kaart van het circuit met stippen voor jezelf en de tegenstanders (noord boven).
// De baan wordt 1 keer op een offscreen canvas getekend; elk beeld kopieert update() dat plaatje
// en tekent alleen de stippen. Plek en grootte staan in src/ui/minimap.css.
// Gebruik: const m = createMinimap({ main, shortcut }); m.setVisible(true); m.update(riders);

// Verhoudingen van de kaart (t.o.v. de kaartbreedte)
const RAND = 0.13;            // vrije rand rondom, zodat de dikke lijn niet wordt afgesneden
const BAAN_BREEDTE = 0.07;    // hoofdbaan: ongeveer 7 % van de kaartbreedte
const BAAN_RAND = 0.025;      // donkere rand rondom de baan, per kant
const SHORTCUT_BREEDTE = 0.04;
const FINISH_LENGTE = 1.7;    // lengte start/finish-lijn, in baanbreedtes
const FINISH_BLOKJES = 4;     // aantal zwarte blokjes op de start/finish-lijn
const MAX_DPR = 2;

// Stippen in pixels
const STIP_TEGENSTANDER = 4;
const STIP_SPELER = 7;
const PIJL_VOORUIT = 1.9;     // punt van de pijl, in speler-stipstralen
const PIJL_ACHTER = 1.0;      // hoek achter de pijl, in speler-stipstralen
const PIJL_HOEK = 2.5;        // hoek (rad) tussen "vooruit" en de achterpunten van de pijl
const RAND_DUN = 1.5;
const RAND_DIK = 2.5;

// Terugvalkleuren als de CSS-variabelen ontbreken
const KLEUR_PANEEL = "rgba(27, 34, 80, 0.78)";
const KLEUR_ACCENT = "#ffd23f";
const KLEUR_INKT = "#1b2250";
const KLEUR_AARDE = "#d98c4a";
const KLEUR_BAAN = "#d6dcf5";
const KLEUR_RAND = "#1b2250";
const KLEUR_RIJDERRAND = "rgba(27, 34, 80, 0.9)";
const KLEUR_WIT = "#ffffff";
const KLEUR_ZWART = "#111111";
const PANEEL_RADIUS = 18;

export function createMinimap({ main = [], shortcut = [] } = {}) {
  const canvas = document.createElement("canvas");
  canvas.className = "minimap is-hidden";
  canvas.setAttribute("aria-hidden", "true");
  (document.getElementById("ui") || document.body).appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const offscreen = document.createElement("canvas");
  const octx = offscreen.getContext("2d");

  let zichtbaar = false;
  let maat = 0;                          // kaartbreedte in CSS-pixels
  let schaal = 1, offX = 0, offY = 0;    // wereld (m) naar kaart (px): px = off + wereld * schaal
  const kleurTekst = new Map();          // getal 0xd9269d -> "#d9269d", 1 keer per kleur gemaakt

  const css = (naam, terugval) =>
    getComputedStyle(document.documentElement).getPropertyValue(naam).trim() || terugval;

  function kleurVan(getal) {
    let t = kleurTekst.get(getal);
    if (!t) { t = "#" + (getal & 0xffffff).toString(16).padStart(6, "0"); kleurTekst.set(getal, t); }
    return t;
  }

  // Grenzen van alle punten bepalen en schaal + verschuiving uitrekenen (vierkant, gecentreerd)
  function berekenSchaal() {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    const lijsten = [main, shortcut];
    for (const lijst of lijsten) {
      for (const p of lijst) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
      }
    }
    if (!isFinite(minX)) { minX = -1; maxX = 1; minZ = -1; maxZ = 1; }
    const spanwijdte = Math.max(maxX - minX, maxZ - minZ, 1e-6);
    schaal = (maat * (1 - 2 * RAND)) / spanwijdte;
    offX = maat / 2 - ((minX + maxX) / 2) * schaal;
    offY = maat / 2 - ((minZ + maxZ) / 2) * schaal;
  }

  function lijnPad(c, lijst, sluit) {
    c.beginPath();
    for (let i = 0; i < lijst.length; i++) {
      const px = offX + lijst[i].x * schaal, py = offY + lijst[i].z * schaal;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    if (sluit) c.closePath();
  }

  function tekenLijn(c, lijst, sluit, breedte, kleur) {
    if (lijst.length < 2) return;
    lijnPad(c, lijst, sluit);
    c.lineWidth = breedte;
    c.strokeStyle = kleur;
    c.stroke();
  }

  // Start/finish: korte lijn door het eerste punt, loodrecht op de richting punt 1 naar punt 2
  function tekenFinish(c, baanPx) {
    if (main.length < 2) return;
    const dx = main[1].x - main[0].x, dz = main[1].z - main[0].z;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len, ny = dx / len;                // loodrecht (kaart: x = wereld x, y = wereld z)
    const cx = offX + main[0].x * schaal, cy = offY + main[0].z * schaal;
    const half = (baanPx * FINISH_LENGTE) / 2;
    const ax = cx - nx * half, ay = cy - ny * half, bx = cx + nx * half, by = cy + ny * half;
    c.lineCap = "butt";
    c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by);
    c.lineWidth = baanPx * 0.5 + 2 * RAND_DUN; c.strokeStyle = KLEUR_ZWART; c.stroke();
    c.lineWidth = baanPx * 0.5; c.strokeStyle = KLEUR_WIT; c.stroke();
    // Zwarte blokjes als stippellijn over de witte lijn (om en om)
    const blok = (half * 2) / FINISH_BLOKJES;
    c.setLineDash([blok / 2, blok / 2]);
    c.lineWidth = baanPx * 0.25; c.strokeStyle = KLEUR_ZWART; c.stroke();
    c.setLineDash([]);
  }

  // Het offscreen plaatje met paneel, baan, shortcut en finish (alleen bij maken en bij formaatwijziging)
  function tekenBaan(dpr) {
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.clearRect(0, 0, maat, maat);

    // Paneel in de stijl van de interface
    const rand = 3;
    octx.beginPath();
    octx.roundRect(rand / 2, rand / 2, maat - rand, maat - rand, PANEEL_RADIUS * (maat / 170));
    octx.fillStyle = css("--ui-panel", KLEUR_PANEEL);
    octx.fill();
    octx.lineWidth = rand;
    octx.strokeStyle = css("--ui-accent", KLEUR_ACCENT);
    octx.stroke();

    const baanPx = maat * BAAN_BREEDTE;
    octx.lineJoin = "round";
    octx.lineCap = "round";
    // Shortcut onder de hoofdbaan: dunner, aarde-oranje, effen met donkere rand
    const aarde = css("--surface-dirt", KLEUR_AARDE);
    const scPx = maat * SHORTCUT_BREEDTE;
    tekenLijn(octx, shortcut, false, scPx + 2 * RAND_DIK, css("--ui-ink", KLEUR_INKT));
    tekenLijn(octx, shortcut, false, scPx, aarde);
    // Hoofdbaan: donkere rand eronder, lichte lijn erboven
    tekenLijn(octx, main, true, baanPx + 2 * maat * BAAN_RAND, KLEUR_RAND);
    tekenLijn(octx, main, true, baanPx, KLEUR_BAAN);
    tekenFinish(octx, baanPx);
  }

  // Past de canvas aan op de grootte die de CSS geeft (170 of 120 px) en tekent de baan opnieuw als dat nodig is
  function pasFormaatAan() {
    const nieuw = canvas.clientWidth;
    if (!nieuw) return;                              // verborgen: later opnieuw proberen
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const pixels = Math.round(nieuw * dpr);
    if (nieuw === maat && canvas.width === pixels) return;
    maat = nieuw;
    canvas.width = pixels;
    canvas.height = pixels;
    berekenSchaal();
    tekenBaan(dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function tekenRijder(r) {
    const px = offX + r.x * schaal, py = offY + r.z * schaal;
    if (r.isPlayer) return;
    ctx.beginPath();
    ctx.arc(px, py, STIP_TEGENSTANDER, 0, Math.PI * 2);
    ctx.fillStyle = kleurVan(r.color);
    ctx.fill();
    ctx.lineWidth = RAND_DUN;
    ctx.strokeStyle = KLEUR_RIJDERRAND;
    ctx.stroke();
  }

  // Speler: gekleurde stip met witte rand en een pijlpunt in de rijrichting (vooruit = (-sin, -cos))
  function tekenSpeler(r) {
    const px = offX + r.x * schaal, py = offY + r.z * schaal;
    const fx = -Math.sin(r.heading), fy = -Math.cos(r.heading);
    const a = STIP_SPELER;
    const tipX = px + fx * a * PIJL_VOORUIT, tipY = py + fy * a * PIJL_VOORUIT;
    const hoekL = Math.atan2(fy, fx) + PIJL_HOEK, hoekR = Math.atan2(fy, fx) - PIJL_HOEK;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(px + Math.cos(hoekL) * a * PIJL_ACHTER, py + Math.sin(hoekL) * a * PIJL_ACHTER);
    ctx.lineTo(px + Math.cos(hoekR) * a * PIJL_ACHTER, py + Math.sin(hoekR) * a * PIJL_ACHTER);
    ctx.closePath();
    ctx.fillStyle = KLEUR_WIT;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py, a, 0, Math.PI * 2);
    ctx.fillStyle = kleurVan(r.color);
    ctx.fill();
    ctx.lineWidth = RAND_DIK;
    ctx.strokeStyle = KLEUR_WIT;
    ctx.stroke();
  }

  function update(riders) {
    if (!zichtbaar || !riders) return;
    if (canvas.clientWidth !== maat) pasFormaatAan();     // schermgrootte veranderd
    if (!maat) return;
    ctx.drawImage(offscreen, 0, 0, maat, maat);
    let speler = null;
    for (let i = 0; i < riders.length; i++) {
      if (riders[i].isPlayer) speler = riders[i]; else tekenRijder(riders[i]);
    }
    if (speler) tekenSpeler(speler);                      // als laatste: bovenop de rest
  }

  function setVisible(waarde) {
    zichtbaar = !!waarde;
    canvas.classList.toggle("is-hidden", !zichtbaar);
    if (zichtbaar) pasFormaatAan();
  }

  window.addEventListener("resize", () => { if (zichtbaar) pasFormaatAan(); });

  return { update, setVisible };
}

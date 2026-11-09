// Alle geluid van Throttle Rush, gemaakt in code met de Web Audio API (geen bestanden).
// Twee soorten geluid: de MOTOR draait continu op vaste nodes die we alleen bijstellen,
// de EFFECTEN (piepjes, botsing, jingle) maken kleine wegwerp-nodes die zichzelf opruimen.
// Browsers starten geluid pas na een klik of toets: tot unlock() is alles stil en veilig.

// Alle instelbare getallen bij elkaar, zodat je ze op een plek kunt tweaken.
const MASTER_VOLUME = 0.5;       // hoofdvolume; mute zet dit op 0
const GLIDE = 0.08;              // tijdconstante (s) voor zachte overgangen van de motor
const IDLE_HZ = 55;              // motortoon stationair
const TOP_HZ = 220;              // motortoon bij topsnelheid (speedRatio 1)
const MAX_RATIO = 1.3;           // turbo mag iets boven topsnelheid, maar niet eindeloos
const GEARS = 4;                 // aantal "versnellingen" voor het schakel-effect
const SHIFT_HZ = 10;             // hoeveel de toon terugvalt vlak voor een schakelmoment
const DETUNE_CENTS = 9;          // tweede oscillator licht ontstemd: voller, minder kil
const ENGINE_BASE = 0.10;        // motorvolume zonder gas
const ENGINE_THROTTLE = 0.12;    // extra volume bij vol gas
const BOOST_VOLUME = 1.3;        // volumefactor tijdens boost
const FILTER_BASE = 350;         // lowpass dicht: zacht en dof (Hz)
const FILTER_SPEED = 700;        // filter gaat verder open met snelheid
const FILTER_THROTTLE = 500;     // en met gas
const BOOST_OPEN = 2.2;          // boost: filter vlak voor het gebrul
const NOISE_SECONDS = 2;         // lengte van de ruislus
// Gerommel per ondergrond: [volume, bandpass-frequentie in Hz]
const SURFACE_NOISE = {
  road: [0.0, 500], curb: [0.07, 300], dirt: [0.16, 700], grass: [0.11, 450],
};

export function createAudio() {
  let ctx = null;        // AudioContext, pas na unlock()
  let ready = false;     // true na unlock(): vanaf nu mogen we geluid maken
  let muted = false;
  let master = null;     // hoofdvolume
  let noiseBuffer = null; // witte ruis, hergebruikt door motor en effecten
  const eng = {};        // vaste motor-nodes: osc1, osc2, filter, gain, noiseGain, noiseBand

  // Zachte overgang naar een nieuwe waarde (voorkomt tikjes en knallen).
  const glide = (param, value, tc = GLIDE) => param.setTargetAtTime(value, ctx.currentTime, tc);

  function makeNoiseBuffer() {
    const len = Math.floor(ctx.sampleRate * NOISE_SECONDS);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Bouwt de motor EEN keer: nooit nieuwe nodes per beeld.
  function buildEngine() {
    eng.filter = ctx.createBiquadFilter();
    eng.filter.type = "lowpass";
    eng.filter.frequency.value = FILTER_BASE;
    eng.gain = ctx.createGain();
    eng.gain.gain.value = 0;                 // stil tot setEngine() iets zegt
    eng.filter.connect(eng.gain).connect(master);

    eng.osc1 = ctx.createOscillator();       // zaagtand: de "ruwe" body
    eng.osc1.type = "sawtooth";
    eng.osc2 = ctx.createOscillator();       // blok: iets hol, licht ontstemd
    eng.osc2.type = "square";
    eng.osc2.detune.value = DETUNE_CENTS;
    const g2 = ctx.createGain();
    g2.gain.value = 0.5;                     // blok zachter dan zaagtand
    eng.osc1.connect(eng.filter);
    eng.osc2.connect(g2).connect(eng.filter);
    eng.osc1.frequency.value = IDLE_HZ;
    eng.osc2.frequency.value = IDLE_HZ;
    eng.osc1.start();
    eng.osc2.start();

    // Gerommel op gras en aarde: lus van ruis door een bandpass.
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    eng.noiseBand = ctx.createBiquadFilter();
    eng.noiseBand.type = "bandpass";
    eng.noiseBand.frequency.value = 500;
    eng.noiseGain = ctx.createGain();
    eng.noiseGain.gain.value = 0;
    src.connect(eng.noiseBand).connect(eng.noiseGain).connect(master);
    src.start();
  }

  function applyMute() {
    if (!ready) return;
    const p = master.gain;
    p.cancelScheduledValues(ctx.currentTime);
    p.setValueAtTime(muted ? 0 : MASTER_VOLUME, ctx.currentTime); // meteen, geen fade
  }

  function unlock() {
    const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctor) return;                       // geen Web Audio: gewoon stil blijven
    if (!ctx) {
      ctx = new Ctor();
      master = ctx.createGain();
      master.connect(ctx.destination);
      noiseBuffer = makeNoiseBuffer();
      buildEngine();
      ready = true;
      applyMute();                           // setMuted kan al eerder zijn aangeroepen
    }
    // Opnieuw aanroepen is prima: dan zetten we alleen een gepauzeerde context weer aan.
    if (ctx.state === "suspended") {
      const p = ctx.resume();
      if (p && p.catch) p.catch(() => {});
    }
  }

  function setMuted(value) { muted = !!value; applyMute(); }
  function isMuted() { return muted; }

  // Elk beeld voor de speler: alleen bestaande parameters bijsturen.
  function setEngine({ throttle = 0, speedRatio = 0, surface = "road", boosting = false } = {}) {
    if (!ready) return;
    const r = Math.min(Math.max(speedRatio, 0), MAX_RATIO);
    const t = Math.min(Math.max(throttle, 0), 1);
    // Schakel-effect: de toon stijgt per "versnelling" en valt even terug bij de volgende.
    const hz = IDLE_HZ + (TOP_HZ - IDLE_HZ) * r - ((r * GEARS) % 1) * SHIFT_HZ * t;
    glide(eng.osc1.frequency, hz);
    glide(eng.osc2.frequency, hz);

    let cutoff = FILTER_BASE + FILTER_SPEED * r + FILTER_THROTTLE * t;
    let volume = ENGINE_BASE + ENGINE_THROTTLE * t;
    if (boosting) { cutoff *= BOOST_OPEN; volume *= BOOST_VOLUME; } // open en brullend
    glide(eng.filter.frequency, cutoff);
    glide(eng.gain.gain, volume);

    const [level, band] = SURFACE_NOISE[surface] || SURFACE_NOISE.road;
    glide(eng.noiseGain.gain, level * Math.min(r, 1)); // stilstaan = geen gerommel
    glide(eng.noiseBand.frequency, band);
  }

  function stopEngine() {
    if (!ready) return;
    glide(eng.gain.gain, 0, 0.05);
    glide(eng.noiseGain.gain, 0, 0.05);
  }

  // ---- Effecten: wegwerp-nodes, ze stoppen zichzelf en worden dan opgeruimd ----

  // Een toon met envelope: korte aanzet (geen tik), daarna zacht uitsterven.
  // `slideTo` laat de toonhoogte glijden (voor zoevende of vallende geluiden).
  function tone({ hz, slideTo, at = 0, dur = 0.15, vol = 0.25, type = "triangle" }) {
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(master);
    osc.onended = () => g.disconnect();
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // Een stootje ruis door een bandpass: basis voor zoeven, botsen en grind.
  function noise({ hz, at = 0, dur = 0.2, vol = 0.2, q = 1 }) {
    const t0 = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    const band = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = noiseBuffer;
    band.type = "bandpass";
    band.frequency.value = hz;
    band.Q.value = q;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(band).connect(g).connect(master);
    src.onended = () => g.disconnect();
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  function playCountdown(value) {
    if (!ready || muted) return;
    if (String(value).toUpperCase() === "GO") {
      tone({ hz: 880, dur: 0.55, vol: 0.28, type: "square" }); // hoger en langer
      tone({ hz: 1320, dur: 0.55, vol: 0.12 });                // kwint erboven: feestelijk
    } else {
      tone({ hz: 440, dur: 0.15, vol: 0.28 });                 // korte piep
    }
  }

  function playAbility(kind) {
    if (!ready || muted) return;
    if (kind === "turbo") {                    // zoevende sprint omhoog
      tone({ hz: 200, slideTo: 900, dur: 0.5, vol: 0.18, type: "sawtooth" });
      noise({ hz: 2500, dur: 0.5, vol: 0.12 });
    } else if (kind === "offroad") {           // twee stuiterende noten + grind
      tone({ hz: 262, dur: 0.12, vol: 0.22, type: "square" });
      tone({ hz: 392, at: 0.1, dur: 0.18, vol: 0.22, type: "square" });
      noise({ hz: 600, dur: 0.35, vol: 0.18, q: 0.7 });
    } else if (kind === "shove") {             // stevige "oemf" met een klap ruis
      tone({ hz: 180, slideTo: 60, dur: 0.22, vol: 0.4, type: "sine" });
      noise({ hz: 900, dur: 0.12, vol: 0.2 });
    }
  }

  function playHit(strength = 0.5) {
    if (!ready || muted) return;
    const s = Math.min(Math.max(strength, 0), 1);
    tone({ hz: 140, slideTo: 45, dur: 0.18 + 0.15 * s, vol: 0.2 + 0.3 * s, type: "sine" }); // bons
    noise({ hz: 1200, dur: 0.1 + 0.15 * s, vol: 0.1 + 0.3 * s });                           // krak
  }

  // Jingle: plaats 1 is een vijfnotige C-majeur-run, de rest korter en bescheidener.
  function playFinish(position = 1) {
    if (!ready || muted) return;
    const notes = position === 1 ? [523, 659, 784, 1047, 1319]
      : position <= 3 ? [392, 523, 659]
      : [330, 262];
    notes.forEach((hz, i) => {
      const last = i === notes.length - 1;
      tone({ hz, at: i * 0.12, dur: last ? 0.6 : 0.16, vol: 0.25, type: "triangle" });
      if (position === 1) tone({ hz: hz * 2, at: i * 0.12, dur: last ? 0.6 : 0.16, vol: 0.06 }); // glans
    });
  }

  return {
    unlock, setMuted, isMuted, setEngine, stopEngine,
    playCountdown, playAbility, playHit, playFinish,
  };
}

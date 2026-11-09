// Automatische kwaliteit: houdt de game vlot op tragere laptops.
// Meet elke 2 seconden de beeldsnelheid. Zakt die onder 48 fps, dan gaat de kwaliteit één stap omlaag:
// eerst minder pixels (scherpte), op het einde geen schaduwen meer. We gaan nooit terug omhoog,
// zodat het beeld niet heen en weer springt.

const TARGET_FPS = 48;     // onder deze beeldsnelheid verlagen we de kwaliteit
const WINDOW = 2;          // seconden per meting
const START_DELAY = 3;     // seconden na laden niet meten (de eerste beelden zijn altijd traag)
const MAX_FRAME_DT = 0.25; // langer dan dit = tabblad stond op pauze: die meting telt niet

export function createAutoQuality(renderer, sun) {
  const best = Math.min(window.devicePixelRatio, 1.5);
  // Kwaliteitsstappen, van mooi naar snel.
  const levels = [
    { pixelRatio: best, shadows: true },
    { pixelRatio: Math.min(best, 1), shadows: true },
    { pixelRatio: 0.75, shadows: true },
    { pixelRatio: 0.75, shadows: false },
  ];
  let level = 0;
  let waited = 0;
  let frames = 0;
  let time = 0;
  let paused = false;

  function apply() {
    const l = levels[level];
    renderer.setPixelRatio(l.pixelRatio);
    sun.castShadow = l.shadows;
    if (new URLSearchParams(location.search).has("debug")) {
      console.info(`[kwaliteit] stap ${level}: pixelRatio ${l.pixelRatio}, schaduw ${l.shadows ? "aan" : "uit"}`);
    }
  }

  apply();

  return {
    // Roep dit elk getekend beeld aan met de echte verstreken tijd.
    tick(dt) {
      if (waited < START_DELAY) { waited += dt; return; }
      if (dt > MAX_FRAME_DT) paused = true;
      frames++;
      time += dt;
      if (time < WINDOW) return;
      const fps = frames / time;
      if (!paused && fps < TARGET_FPS && level < levels.length - 1) {
        level++;
        apply();
      }
      frames = 0;
      time = 0;
      paused = false;
    },
    get level() { return level; },
  };
}

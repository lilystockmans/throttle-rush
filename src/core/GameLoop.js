// GameLoop.js: de hartslag van de game. De fysica loopt in vaste stappen (CONFIG.physicsStep),
// los van de beeldsnelheid, zodat de moto op elke computer hetzelfde rijdt.
// Tekenen gebeurt één keer per beeld.
import { CONFIG } from "../config.js";

const MAX_CATCH_UP_STEPS = 5; // meer stappen per beeld = spiraal van vertraging; liever even trager
const MAX_FRAME_TIME = 0.25;  // seconden; na een tab-wissel niet eindeloos willen inhalen

export function startGameLoop({ update, render }) {
  const step = CONFIG.physicsStep;
  let accumulator = 0; // tijd die nog "verwerkt" moet worden door fysica-stappen
  let lastTime = null;
  let frameId = 0;

  function frame(now) {
    frameId = requestAnimationFrame(frame);
    const seconds = now / 1000;
    const elapsed = lastTime === null ? 0 : Math.min(seconds - lastTime, MAX_FRAME_TIME);
    lastTime = seconds;

    accumulator += elapsed;
    let steps = 0;
    while (accumulator >= step && steps < MAX_CATCH_UP_STEPS) {
      update(step);
      accumulator -= step;
      steps++;
    }
    // Lukte inhalen niet binnen het maximum? Gooi de rest weg in plaats van het te bewaren.
    if (accumulator >= step) accumulator = 0;

    render(elapsed);
  }

  frameId = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(frameId); // stopfunctie, handig voor tests
}

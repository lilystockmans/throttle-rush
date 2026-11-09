// FPS-meter. Alleen zichtbaar als de URL "?debug" bevat.
// Telt hoeveel beelden per seconde getekend worden en toont dat linksboven.

export function createFpsMeter() {
  const enabled = new URLSearchParams(location.search).has("debug");
  if (!enabled) return { tick() {} };

  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;top:8px;left:8px;padding:4px 8px;font:12px monospace;" +
    "background:rgba(0,0,0,.6);color:#0f0;z-index:1000;border-radius:4px";
  document.body.appendChild(el);

  let frames = 0;
  let last = performance.now();

  return {
    // Roep dit één keer per getekend beeld aan.
    tick() {
      frames++;
      const now = performance.now();
      if (now - last >= 500) {
        const fps = Math.round((frames * 1000) / (now - last));
        el.textContent = `${fps} fps`;
        el.style.color = fps >= 55 ? "#0f0" : fps >= 30 ? "#ff0" : "#f44";
        frames = 0;
        last = now;
      }
    },
  };
}

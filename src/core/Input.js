// Input.js: leest het toetsenbord en vertaalt het naar gas, rem, sturen, actie en reset.
// We onthouden alleen welke toetsen nu ingedrukt zijn; read() maakt er elk moment een
// overzicht van. Zo hoeft de rest van de game niets van toetsen te weten.

const KEYS = {
  throttle: ["ArrowUp", "KeyW"],
  brake: ["ArrowDown", "KeyS"],
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  action: ["Space"],
  reset: ["KeyR"],
};

// Deze toetsen mogen de pagina niet laten scrollen.
const BLOCKED_BY_PAGE = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);

export function createInput(target = window) {
  const down = new Set();
  // Laatste aanraakstand van de schermknoppen. Leeg = alles uit.
  let touch = { throttle: 0, brake: 0, steer: 0, action: false, reset: false };

  const isDown = (names) => names.some((code) => down.has(code));

  target.addEventListener("keydown", (event) => {
    if (BLOCKED_BY_PAGE.has(event.code)) event.preventDefault();
    down.add(event.code);
  });
  target.addEventListener("keyup", (event) => down.delete(event.code));
  // Verlies je het venster terwijl je een toets vasthoudt, dan komt er nooit een keyup.
  // Zonder dit zou de moto vol gas blijven rijden.
  target.addEventListener("blur", () => down.clear());

  // Aanraakknoppen vullen dit in; ontbrekende velden tellen als uit.
  function setTouch(t = {}) {
    touch = {
      throttle: t.throttle || 0,
      brake: t.brake || 0,
      steer: t.steer || 0,
      action: !!t.action,
      reset: !!t.reset,
    };
  }

  // Toets of aanraking telt; sturen wordt opgeteld en afgekapt op -1..1.
  function read() {
    const steer = (isDown(KEYS.right) ? 1 : 0) - (isDown(KEYS.left) ? 1 : 0) + touch.steer;
    return {
      throttle: Math.max(isDown(KEYS.throttle) ? 1 : 0, touch.throttle),
      brake: Math.max(isDown(KEYS.brake) ? 1 : 0, touch.brake),
      steer: Math.max(-1, Math.min(1, steer)),
      action: isDown(KEYS.action) || touch.action,
      reset: isDown(KEYS.reset) || touch.reset,
    };
  }

  return { read, setTouch };
}

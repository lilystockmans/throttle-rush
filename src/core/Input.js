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

  const isDown = (names) => names.some((code) => down.has(code));

  target.addEventListener("keydown", (event) => {
    if (BLOCKED_BY_PAGE.has(event.code)) event.preventDefault();
    down.add(event.code);
  });
  target.addEventListener("keyup", (event) => down.delete(event.code));
  // Verlies je het venster terwijl je een toets vasthoudt, dan komt er nooit een keyup.
  // Zonder dit zou de moto vol gas blijven rijden.
  target.addEventListener("blur", () => down.clear());

  function read() {
    return {
      throttle: isDown(KEYS.throttle) ? 1 : 0,
      brake: isDown(KEYS.brake) ? 1 : 0,
      steer: (isDown(KEYS.right) ? 1 : 0) - (isDown(KEYS.left) ? 1 : 0),
      action: isDown(KEYS.action),
      reset: isDown(KEYS.reset),
    };
  }

  return { read };
}

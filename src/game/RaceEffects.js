// Geluid en stof tijdens de race. Puur "aankleding": de race werkt ook zonder.
// RaceSession roept deze functies op het juiste moment aan; hier staat alleen
// wat je hoort (AudioEngine) en ziet stuiven (dust).

import * as THREE from "three";

const DUST_MIN_SPEED = 6;   // m/s: trager dan dit stuift er niets
const DUST_BEHIND = 0.9;    // m achter het midden van de moto (bij het achterwiel)
const behind = new THREE.Vector3(); // hergebruikt: geen nieuw object per beeld

export class RaceEffects {
  constructor({ audio, dust }) {
    this.audio = audio;
    this.dust = dust;
  }

  onCountdown(value) {
    this.audio.playCountdown(value);
  }

  // Een speciale knop is gebruikt. De speler hoort zijn eigen knop en een klap als hij geraakt wordt.
  onAbility({ byPlayer, kind, playerHit }) {
    if (byPlayer) this.audio.playAbility(kind);
    if (playerHit) this.audio.playHit(0.8);
  }

  onPlayerFinish(position) {
    this.audio.stopEngine();
    this.audio.playFinish(position);
  }

  // Elk beeld: motorgeluid van de speler en stof achter elke moto op gras of aarde.
  frame({ riders, playerBike, playerControls, boosting, playerFinished }) {
    if (!playerFinished) {
      this.audio.setEngine({
        throttle: playerControls.throttle,
        speedRatio: Math.max(0, playerBike.speed) / playerBike.type.topSpeed,
        surface: playerBike.surface,
        boosting,
      });
    }
    for (const bike of riders) this.emitDust(bike);
  }

  emitDust(bike) {
    if (bike.speed < DUST_MIN_SPEED) return;
    if (bike.surface !== "dirt" && bike.surface !== "grass") return;
    // Achter de moto = tegen de rijrichting in (vooruit is -sin, -cos; zie contract 02).
    behind.set(
      bike.position.x + Math.sin(bike.heading) * DUST_BEHIND,
      0.1,
      bike.position.z + Math.cos(bike.heading) * DUST_BEHIND,
    );
    const intensity = Math.min(1, bike.speed / bike.type.topSpeed);
    this.dust.emit(behind, bike.surface, intensity, bike); // de bike zelf is de sleutel per moto
  }

  stop() {
    this.audio.stopEngine();
  }
}

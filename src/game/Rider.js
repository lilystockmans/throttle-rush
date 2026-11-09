// Een rijder = de fysica-moto (Bike) + het 3D-model dat haar volgt (BikeModel).
// Zo hoeft main.js niet te weten hoe een model overhelt of hoe wielen draaien.
// In fase 4 gebruiken de computer-rijders dezelfde klasse.

import { Bike } from "../bikes/Bike.js";
import { createBikeModel } from "../bikes/BikeModel.js";

export class Rider {
  constructor({ typeKey, type, color, track, materials, scene }) {
    this.typeKey = typeKey;
    this.bike = new Bike(type, track);
    this.model = createBikeModel({ type: typeKey, color, materials });
    this.leanPivot = this.model.getObjectByName("leanPivot");
    this.wheelFront = this.model.getObjectByName("wheelFront");
    this.wheelBack = this.model.getObjectByName("wheelBack");
    this.flame = this.model.getObjectByName("boostFlame");
    this.scene = scene;
    scene.add(this.model);
  }

  // Zet de moto op een startplek en het model meteen mee.
  placeAt(transform) {
    this.bike.resetTo(transform);
    this.syncModel(0);
  }

  // Zet het 3D-model op de plek van de fysica-moto.
  syncModel(dt) {
    const { bike, model } = this;
    model.position.copy(bike.position);
    model.rotation.y = bike.heading;
    this.leanPivot.rotation.z = bike.lean;
    // Wielen draaien: afgelegde afstand / straal = hoek. Negatief = vooruit rollen naar -Z.
    const spin = (bike.speed * dt) / model.userData.wheelRadius;
    this.wheelFront.rotation.x -= spin;
    this.wheelBack.rotation.x -= spin;
  }

  // Turbovlam aan of uit. Een beetje flakkeren in lengte maakt hem levendig.
  showFlame(on) {
    this.flame.visible = on;
    if (on) this.flame.scale.z = 0.8 + Math.random() * 0.5;
  }

  remove() {
    this.scene.remove(this.model);
  }
}

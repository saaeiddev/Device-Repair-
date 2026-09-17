import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Lightweight, isolated enhancement for the repair-room only.
// It intentionally does not touch device inspection, labels, navigation, or language logic.
const originalAdd = THREE.Object3D.prototype.add;
let roomEnhanced = false;

THREE.Object3D.prototype.add = function (...objects) {
  const result = originalAdd.apply(this, objects);

  if (!roomEnhanced && this?.isGroup) {
    const roomFloor = objects.find((object) => {
      const geometry = object?.geometry;
      const p = geometry?.parameters;
      return object?.isMesh && geometry?.type === 'PlaneGeometry' && p?.width === 26 && p?.height === 22;
    });

    if (roomFloor) {
      roomEnhanced = true;
      const room = this;
      queueMicrotask(() => enhanceRepairRoom(room));
    }
  }

  return result;
};

function mat(color, roughness = 0.65, metalness = 0.05, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}

const M = {
  darkMetal: () => mat(0x24272b, 0.34, 0.72),
  blackMetal: () => mat(0x14171a, 0.30, 0.82),
  brass: () => mat(0xb47a33, 0.28, 0.76),
  copper: () => mat(0xb66a38, 0.34, 0.68),
  wood: () => mat(0x5a3826, 0.72, 0.03),
  woodDark: () => mat(0x37231b, 0.78, 0.02),
  leather: () => mat(0x604335, 0.74, 0.02),
  ceramic: () => mat(0xe5ddd2, 0.42, 0.03),
  glass: () => mat(0xd7eef4, 0.12, 0.08, { transparent: true, opacity: 0.28 }),
  screen: () => mat(0x09131a, 0.22, 0.35, { emissive: 0x0b3451, emissiveIntensity: 0.55 }),
};

function shadow(mesh, cast = true, receive = true) {
  if (mesh?.isMesh) {
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
  }
  return mesh;
}

function rounded(w, h, d, radius, material, position = [0, 0, 0]) {
  const g = new RoundedBoxGeometry(w, h, d, 4, Math.min(radius, Math.min(w, h, d) * 0.45));
  const mesh = shadow(new THREE.Mesh(g, material));
  mesh.position.set(...position);
  return mesh;
}

function box(w, h, d, material, position = [0, 0, 0]) {
  const mesh = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material));
  mesh.position.set(...position);
  return mesh;
}

function cyl(radius, height, material, position = [0, 0, 0], rotation = [0, 0, 0], segments = 24) {
  const mesh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material));
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  return mesh;
}

function enhanceRepairRoom(room) {
  if (!room || room.getObjectByName('room-environment-upgrade')) return;

  const upgrade = new THREE.Group();
  upgrade.name = 'room-environment-upgrade';
  upgrade.userData.decorativeOnly = true;

  upgrade.add(makeWorkshopChair());
  upgrade.add(makeGramophoneCorner());
  upgrade.add(makeEspressoCorner());
  upgrade.add(makeTelevision());
  upgrade.add(makeFloorLamp());
  upgrade.add(makeAmbientDetails());

  room.add(upgrade);
}

function makeWorkshopChair() {
  const g = new THREE.Group();
  g.name = 'cozy-workshop-chair';
  g.position.set(-5.35, 0.02, 2.25);
  g.rotation.y = -0.18;

  const leather = M.leather();
  const metal = M.blackMetal();

  g.add(rounded(1.25, 0.22, 1.12, 0.12, leather, [0, 1.18, 0]));
  const back = rounded(1.25, 1.25, 0.22, 0.14, leather, [0, 1.92, 0.47]);
  back.rotation.x = -0.12;
  g.add(back);

  g.add(cyl(0.09, 0.78, metal, [0, 0.72, 0]));
  g.add(cyl(0.22, 0.13, metal, [0, 0.34, 0]));

  for (let i = 0; i < 5; i++) {
    const arm = box(0.07, 0.07, 0.70, metal, [0, 0.30, -0.30]);
    arm.rotation.y = (i / 5) * Math.PI * 2;
    arm.position.x = Math.sin(arm.rotation.y) * 0.25;
    arm.position.z = Math.cos(arm.rotation.y) * 0.25;
    g.add(arm);

    const caster = cyl(0.09, 0.07, metal, [Math.sin(arm.rotation.y) * 0.56, 0.24, Math.cos(arm.rotation.y) * 0.56], [Math.PI / 2, 0, 0], 16);
    g.add(caster);
  }

  for (const x of [-0.72, 0.72]) {
    g.add(cyl(0.045, 0.68, metal, [x, 1.55, 0.04]));
    const armPad = rounded(0.24, 0.10, 0.68, 0.05, leather, [x, 1.85, -0.08]);
    g.add(armPad);
  }

  return g;
}

function makeGramophoneCorner() {
  const g = new THREE.Group();
  g.name = 'gramophone-corner';
  g.position.set(-6.72, 0, -4.72);

  const cabinet = rounded(2.05, 1.85, 1.25, 0.10, M.woodDark(), [0, 0.94, 0]);
  g.add(cabinet);
  g.add(rounded(2.12, 0.14, 1.32, 0.06, M.wood(), [0, 1.91, 0]));
  g.add(rounded(0.62, 0.54, 0.03, 0.02, M.brass(), [0, 1.10, 0.64]));

  const base = rounded(1.18, 0.28, 0.88, 0.08, M.wood(), [0, 2.12, 0]);
  g.add(base);
  const record = cyl(0.39, 0.035, mat(0x111111, 0.34, 0.16), [-0.18, 2.29, 0], [0, 0, 0], 40);
  g.add(record);
  g.add(cyl(0.055, 0.44, M.brass(), [0.33, 2.48, -0.05], [0, 0, 0], 18));

  const neck = new THREE.Mesh(new THREE.TorusGeometry(0.40, 0.055, 12, 32, Math.PI * 0.70), M.brass());
  neck.rotation.set(Math.PI / 2, 0.15, Math.PI * 0.12);
  neck.position.set(0.28, 2.66, -0.06);
  shadow(neck);
  g.add(neck);

  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.73, 1.08, 38, 1, true), M.brass());
  horn.position.set(0.48, 3.18, 0.03);
  horn.rotation.z = -0.42;
  horn.rotation.x = -Math.PI / 2;
  shadow(horn);
  g.add(horn);

  return g;
}

function makeEspressoCorner() {
  const g = new THREE.Group();
  g.name = 'espresso-corner';
  g.position.set(6.45, 0, -4.62);

  g.add(rounded(2.25, 1.78, 1.25, 0.10, M.woodDark(), [0, 0.90, 0]));
  g.add(rounded(2.34, 0.14, 1.34, 0.06, M.wood(), [0, 1.83, 0]));

  const machine = new THREE.Group();
  machine.position.set(0.10, 1.93, 0);
  machine.add(rounded(1.15, 1.05, 0.82, 0.13, M.darkMetal(), [0, 0.53, 0]));
  machine.add(rounded(0.74, 0.28, 0.03, 0.04, M.screen(), [0, 0.72, 0.425]));
  machine.add(cyl(0.16, 0.10, M.brass(), [-0.28, 0.45, 0.46], [Math.PI / 2, 0, 0], 20));
  machine.add(cyl(0.16, 0.10, M.brass(), [0.28, 0.45, 0.46], [Math.PI / 2, 0, 0], 20));
  machine.add(cyl(0.035, 0.40, M.copper(), [-0.28, 0.19, 0.49]));
  machine.add(cyl(0.035, 0.40, M.copper(), [0.28, 0.19, 0.49]));
  machine.add(rounded(0.92, 0.08, 0.48, 0.04, M.blackMetal(), [0, 0.08, 0.30]));
  g.add(machine);

  const cup = makeCup();
  cup.position.set(-0.32, 2.03, 0.38);
  g.add(cup);
  const cup2 = makeCup();
  cup2.scale.setScalar(0.82);
  cup2.position.set(0.38, 2.00, 0.40);
  g.add(cup2);

  const beans = rounded(0.34, 0.48, 0.28, 0.08, M.glass(), [-0.78, 2.16, -0.22]);
  g.add(beans);
  g.add(cyl(0.19, 0.05, M.blackMetal(), [-0.78, 2.43, -0.22]));

  return g;
}

function makeCup() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.22, 24, 1, true), M.ceramic());
  shadow(body);
  g.add(body);
  g.add(cyl(0.13, 0.035, mat(0x5a2d1c, 0.55, 0), [0, 0.105, 0], [0, 0, 0], 24));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 10, 22, Math.PI * 1.45), M.ceramic());
  handle.position.set(0.15, 0.015, 0);
  handle.rotation.y = Math.PI / 2;
  shadow(handle);
  g.add(handle);
  return g;
}

function makeTelevision() {
  const g = new THREE.Group();
  g.name = 'wall-television';
  g.position.set(6.05, 4.62, -5.48);

  const frame = rounded(3.25, 1.86, 0.18, 0.10, M.blackMetal(), [0, 0, 0]);
  g.add(frame);
  const screen = rounded(3.02, 1.63, 0.035, 0.07, M.screen(), [0, 0, 0.105]);
  g.add(screen);

  // Subtle static tech display: no distracting animation and no render-loop work.
  const cyan = new THREE.MeshBasicMaterial({ color: 0x67c8ff, transparent: true, opacity: 0.32 });
  const blue = new THREE.MeshBasicMaterial({ color: 0x2c6f9b, transparent: true, opacity: 0.24 });
  for (let i = 0; i < 5; i++) {
    const line = box(0.08 + i * 0.12, 0.018, 0.01, i % 2 ? blue : cyan, [-0.95 + i * 0.46, -0.18 + (i % 2) * 0.18, 0.135]);
    line.castShadow = false;
    line.receiveShadow = false;
    g.add(line);
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.40, 40), cyan);
  ring.position.set(0.72, 0.22, 0.137);
  ring.castShadow = false;
  g.add(ring);

  g.add(rounded(0.68, 0.05, 0.28, 0.03, M.blackMetal(), [0, -1.04, -0.03]));
  g.add(cyl(0.05, 0.36, M.blackMetal(), [0, -0.90, -0.03]));
  return g;
}

function makeFloorLamp() {
  const g = new THREE.Group();
  g.name = 'warm-floor-lamp';
  g.position.set(6.85, 0, 2.55);

  const metal = M.blackMetal();
  g.add(cyl(0.43, 0.10, metal, [0, 0.08, 0], [0, 0, 0], 28));
  g.add(cyl(0.055, 2.88, metal, [0, 1.52, 0], [0, 0, 0], 18));
  g.add(cyl(0.04, 1.05, metal, [-0.25, 2.88, 0], [0, 0, Math.PI / 2.8], 16));

  const shadeMat = mat(0xd4a66e, 0.70, 0.02, { side: THREE.DoubleSide });
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.58, 0.68, 32, 1, true), shadeMat);
  shade.position.set(-0.63, 3.22, 0);
  shade.rotation.z = 0.46;
  shadow(shade);
  g.add(shade);

  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd39c }));
  glow.position.set(-0.60, 3.00, 0.02);
  g.add(glow);

  const warm = new THREE.PointLight(0xffb66f, 10, 7.5, 2);
  warm.position.set(-0.60, 2.96, 0.08);
  warm.castShadow = false;
  g.add(warm);

  return g;
}

function makeAmbientDetails() {
  const g = new THREE.Group();
  g.name = 'ambient-workshop-details';

  // Soft woven rug anchors the work area without competing with devices.
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(7.8, 4.0),
    mat(0x493329, 0.96, 0.0)
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.2, 0.012, 2.20);
  rug.receiveShadow = true;
  rug.castShadow = false;
  g.add(rug);

  // Warm practical wall sconces reinforce the cozy cinematic workshop mood.
  for (const x of [-7.2, 7.25]) {
    const bracket = box(0.08, 0.62, 0.18, M.blackMetal(), [x, 4.55, -5.56]);
    g.add(bracket);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffc184 }));
    orb.position.set(x, 4.32, -5.38);
    g.add(orb);
  }

  const accent = new THREE.PointLight(0xff9f58, 5.5, 10, 2);
  accent.position.set(0, 5.1, -4.65);
  accent.castShadow = false;
  g.add(accent);

  // A few controlled workshop props on the rear shelves.
  const colors = [0x7d4b36, 0x35566e, 0x8b6f3f];
  for (let i = 0; i < 3; i++) {
    const tin = rounded(0.32, 0.46 + i * 0.08, 0.28, 0.05, mat(colors[i], 0.58, 0.22), [-0.40 + i * 0.48, 4.38, -5.04]);
    g.add(tin);
  }

  return g;
}

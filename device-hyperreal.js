import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Isolated visual upgrade for DEVICE REPAIR.
// It decorates only room devices and registered hardware parts.
// Existing navigation, explode behavior, labels and bilingual logic stay untouched.
const originalAdd = THREE.Object3D.prototype.add;
const upgradedDevices = new WeakSet();
const upgradedParts = new WeakSet();
const textureCache = new Map();

THREE.Object3D.prototype.add = function (...objects) {
  const result = originalAdd.apply(this, objects);

  for (const object of objects) {
    if (!object) continue;

    if (object.userData?.deviceType && !upgradedDevices.has(object)) {
      upgradedDevices.add(object);
      queueMicrotask(() => upgradeRoomDevice(object, object.userData.deviceType));
    }

    if (object.userData?.partKey && !upgradedParts.has(object)) {
      upgradedParts.add(object);
      queueMicrotask(() => upgradeHardwarePart(object, object.userData.partKey));
    }
  }

  return result;
};

function standard(color, roughness = 0.4, metalness = 0.2, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
}

function physical(color, roughness = 0.2, metalness = 0.4, extra = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness,
    clearcoat: 0.55,
    clearcoatRoughness: 0.12,
    ...extra,
  });
}

const M = {
  aluminum: () => physical(0xb9c0c6, 0.20, 0.94, { clearcoat: 0.28 }),
  graphite: () => physical(0x25282c, 0.24, 0.82, { clearcoat: 0.38 }),
  blackMetal: () => physical(0x111316, 0.24, 0.88, { clearcoat: 0.28 }),
  satinBlack: () => standard(0x101214, 0.43, 0.32),
  rubber: () => standard(0x151719, 0.88, 0.02),
  gold: () => physical(0xd9b456, 0.20, 0.92, { clearcoat: 0.16 }),
  copper: () => physical(0xb96b3b, 0.24, 0.92, { clearcoat: 0.18 }),
  pcb: () => standard(0x17392d, 0.50, 0.14),
  chip: () => physical(0x0c0e10, 0.22, 0.38, { clearcoat: 0.42 }),
  lens: () => physical(0x07131d, 0.05, 0.10, {
    transmission: 0.18,
    transparent: true,
    opacity: 0.94,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    iridescence: 0.22,
    iridescenceIOR: 1.35,
  }),
  glass: () => physical(0x111a21, 0.045, 0.08, {
    transmission: 0.16,
    transparent: true,
    opacity: 0.93,
    clearcoat: 1,
    clearcoatRoughness: 0.025,
  }),
  darkGlass: () => physical(0x071016, 0.055, 0.10, {
    transmission: 0.12,
    transparent: true,
    opacity: 0.90,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
  }),
  emissiveBlue: () => standard(0x0b1720, 0.22, 0.32, { emissive: 0x176aa0, emissiveIntensity: 0.72 }),
};

function shadow(mesh, cast = true, receive = true) {
  if (mesh?.isMesh) {
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
  }
  return mesh;
}

function rounded(w, h, d, radius, material, position = [0, 0, 0]) {
  const geometry = new RoundedBoxGeometry(
    w,
    h,
    d,
    4,
    Math.min(radius, Math.min(w, h, d) * 0.45),
  );
  const mesh = shadow(new THREE.Mesh(geometry, material));
  mesh.position.set(...position);
  return mesh;
}

function box(w, h, d, material, position = [0, 0, 0]) {
  const mesh = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material));
  mesh.position.set(...position);
  return mesh;
}

function cyl(radius, height, material, position = [0, 0, 0], rotation = [0, 0, 0], segments = 28) {
  const mesh = shadow(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material));
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  return mesh;
}

function torus(major, tubeRadius, material, position = [0, 0, 0], rotation = [0, 0, 0], segments = 32) {
  const mesh = shadow(new THREE.Mesh(new THREE.TorusGeometry(major, tubeRadius, 10, segments), material));
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  return mesh;
}

function detailGroup(name) {
  const g = new THREE.Group();
  g.name = name;
  g.userData.decorativeOnly = true;
  return g;
}

function makeScreenTexture(kind = 'phone') {
  if (textureCache.has(kind)) return textureCache.get(kind);

  const canvas = document.createElement('canvas');
  const portrait = kind !== 'laptop';
  canvas.width = portrait ? 512 : 960;
  canvas.height = portrait ? 960 : 560;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#07151f');
  gradient.addColorStop(0.5, '#0d2638');
  gradient.addColorStop(1, '#13202f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const glow = ctx.createRadialGradient(canvas.width * 0.74, canvas.height * 0.23, 10, canvas.width * 0.74, canvas.height * 0.23, canvas.width * 0.72);
  glow.addColorStop(0, 'rgba(83,190,255,.70)');
  glow.addColorStop(0.38, 'rgba(47,117,197,.22)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,.08)';
  const pad = portrait ? 54 : 72;
  const cardW = portrait ? canvas.width - pad * 2 : canvas.width * 0.34;
  const cardH = portrait ? 92 : 118;
  for (let i = 0; i < (portrait ? 5 : 3); i++) {
    const x = portrait ? pad : pad + i * (cardW + 28);
    const y = portrait ? 150 + i * 126 : 145;
    roundRect(ctx, x, y, cardW, cardH, 24);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(104,210,255,.72)';
  ctx.beginPath();
  ctx.arc(portrait ? canvas.width * 0.5 : 110, portrait ? 86 : 82, portrait ? 30 : 24, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  textureCache.set(kind, texture);
  return texture;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function screenMaterial(kind) {
  const texture = makeScreenTexture(kind);
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: texture,
    emissiveMap: texture,
    emissive: 0x18364c,
    emissiveIntensity: kind === 'laptop' ? 0.68 : 0.76,
    roughness: 0.08,
    metalness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.025,
  });
}

function upgradeRoomDevice(root, type) {
  if (!root || root.getObjectByName('hyperreal-room-device')) return;
  const g = detailGroup('hyperreal-room-device');

  if (type === 'smartphone') decorateRoomPhone(g);
  else if (type === 'tablet') decorateRoomTablet(g);
  else if (type === 'laptop') decorateRoomLaptop(g);
  else if (type === 'desktop') decorateRoomDesktop(g);

  root.add(g);
}

function decorateRoomPhone(g) {
  // Polished metal perimeter and true glass face.
  g.add(rounded(1.095, 0.048, 2.015, 0.15, M.graphite(), [0, 0.008, 0]));
  g.add(rounded(0.955, 0.017, 1.845, 0.115, screenMaterial('phone'), [0, 0.068, 0]));

  // Earpiece, front camera and sensor cluster.
  g.add(rounded(0.24, 0.010, 0.028, 0.012, M.satinBlack(), [0, 0.081, -0.765]));
  g.add(cyl(0.032, 0.010, M.lens(), [0.30, 0.084, -0.765]));
  g.add(cyl(0.015, 0.009, M.lens(), [0.23, 0.084, -0.765]));

  // Tactile side controls.
  g.add(rounded(0.026, 0.055, 0.34, 0.01, M.blackMetal(), [0.555, 0.006, -0.22]));
  g.add(rounded(0.026, 0.055, 0.18, 0.01, M.blackMetal(), [-0.555, 0.006, -0.35]));
  g.add(rounded(0.026, 0.055, 0.25, 0.01, M.blackMetal(), [-0.555, 0.006, 0.02]));

  // Bottom port and machined speaker/microphone holes.
  g.add(rounded(0.28, 0.028, 0.028, 0.012, M.satinBlack(), [0, 0.004, 1.008]));
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    g.add(cyl(0.014, 0.012, M.satinBlack(), [i * 0.075, 0.060, 0.93]));
  }
}

function decorateRoomTablet(g) {
  g.add(rounded(1.675, 0.050, 2.275, 0.17, M.aluminum(), [0, 0.006, 0]));
  g.add(rounded(1.525, 0.017, 2.090, 0.12, screenMaterial('tablet'), [0, 0.069, 0]));
  g.add(cyl(0.032, 0.010, M.lens(), [0, 0.085, -0.93]));
  g.add(rounded(0.028, 0.055, 0.38, 0.01, M.blackMetal(), [0.838, 0.005, -0.32]));
  g.add(rounded(0.30, 0.028, 0.028, 0.012, M.satinBlack(), [0, 0.003, 1.145]));

  for (const x of [-0.58, -0.46, 0.46, 0.58]) {
    g.add(cyl(0.013, 0.011, M.satinBlack(), [x, 0.060, 1.04]));
  }
}

function decorateRoomLaptop(g) {
  // Keyboard deck inset.
  g.add(rounded(2.42, 0.018, 1.28, 0.075, standard(0x26292d, 0.43, 0.50), [0, 0.075, -0.02]));

  const keyMat = physical(0x17191c, 0.32, 0.22, { clearcoat: 0.28 });
  const rows = 5;
  const cols = 12;
  const keyW = 0.155;
  const keyD = 0.135;
  const startX = -((cols - 1) * 0.185) / 2;
  const startZ = -0.48;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const width = r === rows - 1 && c > 3 && c < 8 ? keyW * 1.28 : keyW;
      g.add(rounded(width, 0.026, keyD, 0.018, keyMat, [startX + c * 0.185, 0.094, startZ + r * 0.165]));
    }
  }

  // Trackpad with a subtle glass lip.
  g.add(rounded(0.88, 0.020, 0.48, 0.05, physical(0xaeb3b7, 0.26, 0.72, { clearcoat: 0.35 }), [0, 0.091, 0.53]));
  g.add(rounded(0.79, 0.006, 0.40, 0.04, physical(0xc2c6c9, 0.20, 0.55, { clearcoat: 0.46 }), [0, 0.104, 0.53]));

  // Hinge barrels and ventilation.
  for (const x of [-0.92, 0.92]) g.add(cyl(0.055, 0.42, M.blackMetal(), [x, 0.12, -0.76], [0, 0, Math.PI / 2], 24));
  for (let i = -7; i <= 7; i++) g.add(rounded(0.045, 0.010, 0.22, 0.008, M.satinBlack(), [i * 0.12, 0.091, -0.69]));

  // Tiny status LED.
  g.add(cyl(0.012, 0.008, standard(0x70d6ff, 0.18, 0.10, { emissive: 0x2ca7ef, emissiveIntensity: 2 }), [1.07, 0.10, 0.72]));
}

function decorateRoomDesktop(g) {
  // Tempered-glass border and machined front frame.
  g.add(rounded(1.305, 2.475, 1.475, 0.105, physical(0x1d2024, 0.26, 0.82, { clearcoat: 0.42 }), [0, 0, 0]));
  g.add(rounded(1.205, 2.28, 0.020, 0.045, physical(0x0f1b23, 0.05, 0.06, { transparent: true, opacity: 0.26, transmission: 0.22, clearcoat: 1 }), [0, 0, 0.745]));

  // Front intake with concentric fan rings.
  for (const y of [-0.70, 0, 0.70]) {
    g.add(torus(0.29, 0.025, M.blackMetal(), [0, y, -0.742], [0, 0, 0], 36));
    g.add(torus(0.245, 0.012, standard(0x16384b, 0.20, 0.30, { emissive: 0x1d85ba, emissiveIntensity: 0.80 }), [0, y, -0.747], [0, 0, 0], 36));
    g.add(cyl(0.070, 0.035, M.graphite(), [0, y, -0.755], [Math.PI / 2, 0, 0], 24));
  }

  // Fine mesh / ventilation marks.
  for (let i = -8; i <= 8; i++) {
    g.add(box(0.95, 0.012, 0.008, M.satinBlack(), [0, i * 0.12, -0.752]));
  }

  // Top I/O.
  g.add(rounded(0.30, 0.055, 0.065, 0.016, M.satinBlack(), [-0.22, 1.18, 0.35]));
  g.add(rounded(0.18, 0.050, 0.065, 0.016, M.satinBlack(), [0.10, 1.18, 0.35]));
  g.add(cyl(0.045, 0.030, M.blackMetal(), [0.35, 1.19, 0.35]));

  // Corner screws on the glass panel.
  for (const [x, y] of [[-0.52, -1.05], [0.52, -1.05], [-0.52, 1.05], [0.52, 1.05]]) {
    g.add(cyl(0.025, 0.012, M.blackMetal(), [x, y, 0.765], [Math.PI / 2, 0, 0], 18));
  }
}

function localBounds(root) {
  try {
    root.updateWorldMatrix(true, true);
    const invRoot = root.matrixWorld.clone().invert();
    const boxResult = new THREE.Box3();
    const rel = new THREE.Matrix4();
    let found = false;

    root.traverse((object) => {
      if (!object.isMesh || !object.geometry) return;
      object.geometry.computeBoundingBox();
      if (!object.geometry.boundingBox) return;
      rel.multiplyMatrices(invRoot, object.matrixWorld);
      const localBox = object.geometry.boundingBox.clone().applyMatrix4(rel);
      boxResult.union(localBox);
      found = true;
    });

    if (!found || boxResult.isEmpty()) return null;
    return {
      box: boxResult,
      size: boxResult.getSize(new THREE.Vector3()),
      center: boxResult.getCenter(new THREE.Vector3()),
    };
  } catch {
    return null;
  }
}

function upgradeHardwarePart(root, key) {
  if (!root || root.getObjectByName('hyperreal-part-details')) return;

  refineExistingMaterials(root);
  const bounds = localBounds(root);
  if (!bounds) return;

  const g = detailGroup('hyperreal-part-details');
  const { size, center, box: boundsBox } = bounds;
  const top = boundsBox.max.y + Math.max(0.008, size.y * 0.03);
  const minDim = Math.max(0.04, Math.min(size.x, size.z));

  if (key === 'motherboard') decorateMotherboard(g, size, center, top, boundsBox);
  else if (key === 'display') decorateDisplayPart(g, size, center, top);
  else if (key === 'camera') decorateCameraPart(g, size, center, top);
  else if (key === 'battery') decorateBatteryPart(g, size, center, top);
  else if (key === 'cpu') decorateChipPart(g, size, center, top, true);
  else if (key === 'gpu') decorateGpuPart(g, size, center, top);
  else if (key === 'ram') decorateRamPart(g, size, center, top);
  else if (key === 'storage') decorateStoragePart(g, size, center, top);
  else if (key === 'wifi') decorateWifiPart(g, size, center, top);
  else if (key === 'fan') decorateFanPart(g, size, center, top, minDim);
  else if (key === 'heatsink' || key === 'cooling') decorateCoolingPart(g, size, center, top);
  else if (key === 'speaker') decorateSpeakerPart(g, size, center, top);
  else if (key === 'psu') decoratePsuPart(g, size, center, top);
  else if (key === 'port') decoratePortPart(g, size, center, top);

  if (g.children.length) root.add(g);
}

function refineExistingMaterials(root) {
  root.traverse((object) => {
    const material = object?.material;
    if (!object.isMesh || !material || Array.isArray(material)) return;

    if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
      material.envMapIntensity = Math.max(material.envMapIntensity || 1, 1.20);
      if (material.metalness > 0.6) material.roughness = Math.max(0.16, material.roughness * 0.88);
      if (material.isMeshPhysicalMaterial) {
        material.clearcoat = Math.max(material.clearcoat || 0, 0.35);
        material.clearcoatRoughness = Math.min(material.clearcoatRoughness ?? 0.18, 0.15);
      }
      material.needsUpdate = true;
    }
  });
}

function decorateMotherboard(g, size, center, top, boundsBox) {
  // Precision screws / standoffs around the board or chassis.
  const sx = Math.max(0.05, size.x * 0.42);
  const sz = Math.max(0.05, size.z * 0.42);
  for (const x of [-sx, sx]) {
    for (const z of [-sz, sz]) {
      const screw = cyl(Math.min(0.045, Math.max(0.018, Math.min(size.x, size.z) * 0.018)), 0.018, M.blackMetal(), [center.x + x, top, center.z + z]);
      g.add(screw);
    }
  }

  // Only add PCB micro-detail when the object is reasonably flat.
  if (size.y <= Math.max(size.x, size.z) * 0.30) {
    const chipW = Math.max(0.055, size.x * 0.055);
    const chipD = Math.max(0.045, size.z * 0.055);
    for (let i = 0; i < 12; i++) {
      const fx = ((i * 37) % 101) / 100 - 0.5;
      const fz = ((i * 61 + 13) % 101) / 100 - 0.5;
      const x = center.x + fx * size.x * 0.65;
      const z = center.z + fz * size.z * 0.62;
      const part = rounded(chipW * (i % 3 === 0 ? 1.45 : 1), 0.025, chipD, 0.008, i % 4 === 0 ? M.aluminum() : M.chip(), [x, top + 0.014, z]);
      g.add(part);
    }

    // A few copper/gold trace-like bars.
    for (let i = 0; i < 5; i++) {
      const width = size.x * (0.18 + i * 0.025);
      const trace = box(width, 0.006, Math.max(0.008, size.z * 0.008), i % 2 ? M.copper() : M.gold(), [center.x - size.x * 0.10 + i * size.x * 0.035, top + 0.006, center.z + (i - 2) * size.z * 0.09]);
      g.add(trace);
    }
  }

  // Tiny board edge / EMI seam.
  if (size.x > 0.8 && size.z > 0.8) {
    g.add(rounded(size.x * 0.32, 0.034, size.z * 0.20, 0.018, physical(0xbfc4c8, 0.24, 0.88, { clearcoat: 0.15 }), [center.x + size.x * 0.22, top + 0.020, center.z - size.z * 0.20]));
  }
}

function decorateDisplayPart(g, size, center, top) {
  const w = Math.max(0.18, size.x * 0.90);
  const d = Math.max(0.18, size.z * 0.90);
  g.add(rounded(w, 0.012, d, Math.min(0.08, Math.min(w, d) * 0.06), M.glass(), [center.x, top + 0.007, center.z]));
  const camR = Math.min(0.035, Math.max(0.012, Math.min(w, d) * 0.012));
  g.add(cyl(camR, 0.009, M.lens(), [center.x, top + 0.016, center.z - d * 0.40]));
}

function decorateCameraPart(g, size, center, top) {
  const r = Math.min(Math.max(0.055, Math.min(size.x, size.z) * 0.15), 0.16);
  const count = Math.max(1, Math.min(3, Math.round(Math.max(size.x, size.z) / (r * 2.1))));
  const spacing = r * 2.05;
  for (let i = 0; i < count; i++) {
    const x = center.x + (i - (count - 1) / 2) * spacing;
    g.add(cyl(r * 1.05, 0.018, M.blackMetal(), [x, top + 0.012, center.z]));
    g.add(cyl(r * 0.78, 0.023, M.lens(), [x, top + 0.025, center.z]));
    g.add(cyl(r * 0.34, 0.026, physical(0x183c55, 0.04, 0.05, { clearcoat: 1 }), [x, top + 0.038, center.z]));
  }
}

function decorateBatteryPart(g, size, center, top) {
  const labelW = Math.max(0.18, size.x * 0.62);
  const labelD = Math.max(0.14, size.z * 0.34);
  g.add(rounded(labelW, 0.008, labelD, 0.018, standard(0xb8b7ad, 0.74, 0.03), [center.x, top + 0.005, center.z]));
  for (let i = -2; i <= 2; i++) {
    g.add(box(labelW * 0.72, 0.003, 0.008, standard(0x55534e, 0.65, 0.02), [center.x, top + 0.011, center.z + i * labelD * 0.12]));
  }
  g.add(rounded(Math.max(0.08, size.x * 0.14), 0.018, Math.max(0.07, size.z * 0.08), 0.012, M.gold(), [center.x + size.x * 0.34, top + 0.010, center.z - size.z * 0.30]));
}

function decorateChipPart(g, size, center, top, addContacts = false) {
  const w = Math.max(0.10, size.x * 0.78);
  const d = Math.max(0.10, size.z * 0.78);
  g.add(rounded(w, 0.020, d, Math.min(0.025, Math.min(w, d) * 0.08), physical(0x9da4a9, 0.22, 0.82, { clearcoat: 0.24 }), [center.x, top + 0.012, center.z]));
  g.add(rounded(w * 0.72, 0.007, d * 0.72, 0.018, M.chip(), [center.x, top + 0.026, center.z]));

  if (addContacts) {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1) - 0.5) * w * 0.78;
      g.add(box(0.012, 0.005, d * 0.05, M.gold(), [center.x + t, top + 0.032, center.z + d * 0.32]));
      g.add(box(0.012, 0.005, d * 0.05, M.gold(), [center.x + t, top + 0.032, center.z - d * 0.32]));
    }
  }
}

function decorateGpuPart(g, size, center, top) {
  if (Math.max(size.x, size.z) < 1.0) {
    decorateChipPart(g, size, center, top, false);
    return;
  }

  // Discrete GPU: shroud, dual fan lips and visible copper accent.
  const longX = size.x >= size.z;
  const major = Math.min(0.34, Math.min(size.x, size.z) * 0.20);
  const offset = (longX ? size.x : size.z) * 0.22;
  for (const s of [-1, 1]) {
    const x = center.x + (longX ? s * offset : 0);
    const z = center.z + (longX ? 0 : s * offset);
    g.add(torus(major, Math.max(0.014, major * 0.07), M.blackMetal(), [x, top + 0.015, z], [Math.PI / 2, 0, 0], 36));
    g.add(cyl(major * 0.20, 0.025, M.graphite(), [x, top + 0.018, z]));
  }
  g.add(box(size.x * 0.55, 0.012, Math.max(0.025, size.z * 0.035), M.copper(), [center.x, top + 0.010, center.z - size.z * 0.36]));
}

function decorateRamPart(g, size, center, top) {
  const longX = size.x >= size.z;
  const length = longX ? size.x : size.z;
  const chips = 6;
  for (let i = 0; i < chips; i++) {
    const t = (i / (chips - 1) - 0.5) * length * 0.70;
    const pos = longX ? [center.x + t, top + 0.012, center.z] : [center.x, top + 0.012, center.z + t];
    g.add(rounded(longX ? length * 0.09 : size.x * 0.55, 0.022, longX ? size.z * 0.48 : length * 0.09, 0.008, M.chip(), pos));
  }

  const contacts = 14;
  for (let i = 0; i < contacts; i++) {
    const t = (i / (contacts - 1) - 0.5) * length * 0.86;
    const pos = longX
      ? [center.x + t, top + 0.005, center.z + size.z * 0.45]
      : [center.x + size.x * 0.45, top + 0.005, center.z + t];
    g.add(box(longX ? length * 0.025 : Math.max(0.007, size.x * 0.06), 0.006, longX ? Math.max(0.007, size.z * 0.08) : length * 0.025, M.gold(), pos));
  }
}

function decorateStoragePart(g, size, center, top) {
  const labelW = Math.max(0.12, size.x * 0.52);
  const labelD = Math.max(0.08, size.z * 0.50);
  g.add(rounded(labelW, 0.006, labelD, 0.014, standard(0xe1e2de, 0.64, 0.04), [center.x, top + 0.006, center.z]));
  for (let i = 0; i < 3; i++) {
    g.add(rounded(Math.max(0.05, size.x * 0.15), 0.022, Math.max(0.04, size.z * 0.22), 0.008, M.chip(), [center.x - size.x * 0.24 + i * size.x * 0.24, top + 0.012, center.z - size.z * 0.26]));
  }
  g.add(box(Math.max(0.08, size.x * 0.16), 0.008, Math.max(0.02, size.z * 0.09), M.gold(), [center.x + size.x * 0.42, top + 0.006, center.z]));
}

function decorateWifiPart(g, size, center, top) {
  g.add(rounded(Math.max(0.10, size.x * 0.58), 0.024, Math.max(0.08, size.z * 0.48), 0.010, physical(0xbcc1c5, 0.24, 0.86, { clearcoat: 0.16 }), [center.x, top + 0.013, center.z]));
  for (const s of [-1, 1]) {
    g.add(torus(Math.max(0.020, Math.min(size.x, size.z) * 0.055), 0.006, M.gold(), [center.x + s * size.x * 0.28, top + 0.015, center.z], [Math.PI / 2, 0, 0], 18));
  }
}

function decorateFanPart(g, size, center, top, minDim) {
  const r = Math.max(0.07, Math.min(size.x, size.z) * 0.40);
  g.add(torus(r, Math.max(0.010, r * 0.06), M.blackMetal(), [center.x, top + 0.010, center.z], [Math.PI / 2, 0, 0], 36));
  g.add(cyl(Math.max(0.025, r * 0.16), 0.026, M.graphite(), [center.x, top + 0.015, center.z]));
  g.add(torus(r * 0.74, Math.max(0.004, minDim * 0.010), standard(0x23465b, 0.20, 0.24, { emissive: 0x1d73a0, emissiveIntensity: 0.52 }), [center.x, top + 0.018, center.z], [Math.PI / 2, 0, 0], 36));
}

function decorateCoolingPart(g, size, center, top) {
  const runs = 3;
  for (let i = 0; i < runs; i++) {
    g.add(rounded(size.x * (0.62 - i * 0.07), 0.018, Math.max(0.025, size.z * 0.045), 0.008, M.copper(), [center.x, top + 0.010 + i * 0.006, center.z + (i - 1) * size.z * 0.12]));
  }
  // Dense fin-stack hint.
  for (let i = -5; i <= 5; i++) {
    g.add(box(Math.max(0.08, size.x * 0.20), 0.018, Math.max(0.006, size.z * 0.012), M.aluminum(), [center.x + size.x * 0.34, top + 0.012, center.z + i * size.z * 0.035]));
  }
}

function decorateSpeakerPart(g, size, center, top) {
  const cols = 7;
  const rows = 3;
  const dx = size.x * 0.10;
  const dz = size.z * 0.16;
  const radius = Math.min(0.018, Math.max(0.006, Math.min(size.x, size.z) * 0.025));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      g.add(cyl(radius, 0.007, M.satinBlack(), [center.x + (c - 3) * dx, top + 0.005, center.z + (r - 1) * dz]));
    }
  }
}

function decoratePsuPart(g, size, center, top) {
  const r = Math.min(size.x, size.z) * 0.28;
  g.add(torus(r, Math.max(0.012, r * 0.06), M.blackMetal(), [center.x, top + 0.012, center.z], [Math.PI / 2, 0, 0], 40));
  for (let i = -4; i <= 4; i++) {
    g.add(box(r * 1.65, 0.008, Math.max(0.006, size.z * 0.015), M.satinBlack(), [center.x, top + 0.010, center.z + i * r * 0.18]));
  }
}

function decoratePortPart(g, size, center, top) {
  const w = Math.max(0.08, size.x * 0.92);
  const d = Math.max(0.05, size.z * 0.88);
  g.add(rounded(w, 0.012, d, Math.min(0.018, Math.min(w, d) * 0.18), physical(0xb7bdc2, 0.20, 0.92, { clearcoat: 0.16 }), [center.x, top + 0.006, center.z]));
  g.add(rounded(w * 0.72, 0.008, d * 0.50, Math.min(0.012, Math.min(w, d) * 0.12), M.satinBlack(), [center.x, top + 0.013, center.z]));
}

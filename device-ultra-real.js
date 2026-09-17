import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Ultra-realistic DEVICE shell upgrade.
// This module intentionally touches only objects tagged with userData.deviceType.
// Existing inspection logic, labels, explode animations, navigation and bilingual UI stay untouched.
const previousAdd = THREE.Object3D.prototype.add;
const upgraded = new WeakSet();
const textures = new Map();

THREE.Object3D.prototype.add = function (...objects) {
  const result = previousAdd.apply(this, objects);
  for (const object of objects) {
    if (!object?.userData?.deviceType || upgraded.has(object)) continue;
    upgraded.add(object);
    // Run after the existing hyper-real decorator has had a chance to attach its shell details.
    queueMicrotask(() => queueMicrotask(() => upgradeDevice(object, object.userData.deviceType)));
  }
  return result;
};

const mat = {
  polishedGraphite: () => physical(0x25282d, .16, .92, { clearcoat: .72, clearcoatRoughness: .055 }),
  steel: () => physical(0xb8bec4, .19, .94, { clearcoat: .35, clearcoatRoughness: .09 }),
  blackSteel: () => physical(0x111418, .21, .91, { clearcoat: .32, clearcoatRoughness: .10 }),
  satinBlack: () => standard(0x101215, .56, .32),
  rubber: () => standard(0x141619, .88, .03),
  glass: () => physical(0x0b1218, .045, .07, {
    transparent: true, opacity: .92, transmission: .12, ior: 1.50,
    clearcoat: 1, clearcoatRoughness: .018,
  }),
  lens: () => physical(0x07131e, .025, .10, {
    transparent: true, opacity: .96, transmission: .16, ior: 1.52,
    clearcoat: 1, clearcoatRoughness: .012,
    iridescence: .24, iridescenceIOR: 1.34,
  }),
  copper: () => physical(0xb56d42, .21, .94, { clearcoat: .18 }),
};

function physical(color, roughness = .25, metalness = .5, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness, metalness, envMapIntensity: 1.45, ...extra });
}

function standard(color, roughness = .45, metalness = .2, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 1.35, ...extra });
}

function rounded(w, h, d, radius, material, position = [0, 0, 0]) {
  const geometry = new RoundedBoxGeometry(w, h, d, 5, Math.min(radius, Math.min(w, h, d) * .45));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.ultraRealDetail = true;
  return mesh;
}

function box(w, h, d, material, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.ultraRealDetail = true;
  return mesh;
}

function cyl(r, h, material, position = [0, 0, 0], rotation = [0, 0, 0], segments = 36) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.ultraRealDetail = true;
  return mesh;
}

function torus(r, tube, material, position = [0, 0, 0], rotation = [0, 0, 0], radial = 12, tubular = 48) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, tube, radial, tubular), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.ultraRealDetail = true;
  return mesh;
}

function group(name) {
  const g = new THREE.Group();
  g.name = name;
  g.userData.decorativeOnly = true;
  return g;
}

function upgradeDevice(root, type) {
  if (!root || root.getObjectByName('ultra-real-device-details')) return;

  refineDeviceMaterials(root);
  const details = group('ultra-real-device-details');

  if (type === 'smartphone') addPhoneDetails(details);
  else if (type === 'tablet') addTabletDetails(details);
  else if (type === 'laptop') addLaptopDetails(details);
  else if (type === 'desktop') addDesktopDetails(details);

  root.add(details);

  // Keep the new decorative geometry fully clickable as part of the same device.
  details.traverse((o) => {
    if (!o.isMesh) return;
    o.userData.deviceRoot = root;
    o.castShadow = true;
    o.receiveShadow = true;
  });
}

function refineDeviceMaterials(root) {
  root.traverse((object) => {
    if (!object.isMesh || !object.material) return;
    const source = Array.isArray(object.material) ? object.material : [object.material];
    const tuned = source.map((material) => {
      if (!(material?.isMeshStandardMaterial || material?.isMeshPhysicalMaterial)) return material;
      const m = material.clone();
      m.envMapIntensity = Math.max(m.envMapIntensity || 1, 1.35);
      if (m.metalness > .45) {
        m.metalness = Math.max(.72, m.metalness);
        m.roughness = Math.max(.14, Math.min(.34, m.roughness * .82));
        m.roughnessMap = brushedMetalTexture();
      } else if (m.transparent || m.transmission > 0) {
        m.roughness = Math.min(.11, m.roughness);
        if (m.isMeshPhysicalMaterial) {
          m.clearcoat = Math.max(.75, m.clearcoat || 0);
          m.clearcoatRoughness = Math.min(.055, m.clearcoatRoughness ?? .055);
          m.ior = 1.50;
        }
      }
      m.needsUpdate = true;
      return m;
    });
    object.material = Array.isArray(object.material) ? tuned : tuned[0];
  });
}

function makeNoiseTexture(key, kind = 'roughness') {
  if (textures.has(key)) return textures.get(key);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(canvas.width, canvas.height);

  let seed = 0x9e3779b9;
  const rnd = () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return ((seed >>> 0) % 10000) / 10000;
  };

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      let value;
      if (kind === 'brushed') {
        const line = Math.sin(y * .58) * 5 + Math.sin(y * .11) * 7;
        value = 122 + line + (rnd() - .5) * 28;
      } else {
        value = 116 + (rnd() - .5) * 34;
      }
      image.data[i] = image.data[i + 1] = image.data[i + 2] = Math.max(0, Math.min(255, value));
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  if (kind === 'glass') {
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 26; i++) {
      const x = rnd() * 512, y = rnd() * 512;
      const r = 18 + rnd() * 70;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(230,230,230,.18)');
      grad.addColorStop(.55, 'rgba(210,210,210,.05)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 22; i++) {
      ctx.beginPath();
      const y = rnd() * 512;
      ctx.moveTo(rnd() * 80, y);
      ctx.lineTo(430 + rnd() * 80, y + (rnd() - .5) * 16);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  textures.set(key, tex);
  return tex;
}

function brushedMetalTexture() {
  const t = makeNoiseTexture('brushed-metal', 'brushed');
  t.repeat.set(1.6, 5.0);
  return t;
}

function glassImperfectionTexture() {
  const t = makeNoiseTexture('glass-imperfections', 'glass');
  t.repeat.set(1.0, 1.0);
  return t;
}

function glassOverlay(w, d, y, radius = .08) {
  const m = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: .075,
    roughness: .13,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: .025,
    roughnessMap: glassImperfectionTexture(),
    envMapIntensity: 1.6,
    depthWrite: false,
  });
  const overlay = rounded(w, .005, d, radius, m, [0, y, 0]);
  overlay.renderOrder = 4;
  return overlay;
}

function addPhoneDetails(g) {
  // Front cover-glass imperfections — subtle enough to read as real glass rather than a flat render.
  g.add(glassOverlay(.946, 1.835, .082, .105));

  // Polished edge highlight strips + antenna breaks.
  const edge = physical(0xa8adb2, .14, .96, { clearcoat: .6, clearcoatRoughness: .045 });
  g.add(box(.016, .043, 1.56, edge, [.545, .010, 0]));
  g.add(box(.016, .043, 1.56, edge, [-.545, .010, 0]));
  for (const z of [-.68, .68]) {
    g.add(box(.030, .047, .040, mat.rubber(), [.549, .009, z]));
    g.add(box(.030, .047, .040, mat.rubber(), [-.549, .009, z]));
  }

  // Machined power / volume controls with a tiny separation shadow.
  g.add(rounded(.031, .060, .355, .010, mat.blackSteel(), [.559, .006, -.18]));
  g.add(rounded(.031, .060, .190, .010, mat.blackSteel(), [-.559, .006, -.40]));
  g.add(rounded(.031, .060, .260, .010, mat.blackSteel(), [-.559, .006, -.08]));

  // USB-C port cavity and stainless internal tongue.
  g.add(rounded(.285, .030, .030, .012, mat.satinBlack(), [0, -.002, 1.010]));
  g.add(rounded(.155, .010, .012, .005, mat.steel(), [0, -.003, 1.013]));

  // Precision speaker / mic perforations.
  for (let i = -4; i <= 4; i++) {
    if (Math.abs(i) < 2) continue;
    g.add(cyl(.0105, .011, mat.satinBlack(), [i * .058, .058, .943], [0, 0, 0], 18));
  }

  // Very small proximity sensor and front-camera lens reflections.
  g.add(cyl(.019, .008, mat.lens(), [.265, .085, -.765], [0, 0, 0], 24));
  g.add(cyl(.009, .009, physical(0x78a7c7, .035, .08, { clearcoat: 1 }), [.265, .090, -.765], [0, 0, 0], 20));

  // Back-glass panel + realistic triple camera island, visible when the device is inspected from a low angle.
  const back = rounded(.985, .014, 1.880, .118, physical(0x1d2227, .19, .36, { clearcoat: .94, clearcoatRoughness: .05 }), [0, -.059, 0]);
  g.add(back);
  const island = group('phone-camera-island');
  island.position.set(-.285, -.080, -.610);
  island.rotation.z = Math.PI;
  island.add(rounded(.410, .030, .490, .085, physical(0x262c31, .14, .52, { clearcoat: .85 }), [0, 0, 0]));
  for (const [x, z] of [[-.105, -.125], [.105, -.125], [-.105, .130]]) {
    island.add(cyl(.105, .045, mat.blackSteel(), [x, -.020, z]));
    island.add(cyl(.078, .052, mat.lens(), [x, -.046, z]));
    island.add(cyl(.028, .055, physical(0x17425d, .02, .05, { clearcoat: 1 }), [x, -.051, z]));
  }
  island.add(cyl(.037, .020, standard(0xf8efd2, .34, .02, { emissive: 0xffdf98, emissiveIntensity: .18 }), [.11, -.026, .135]));
  g.add(island);
}

function addTabletDetails(g) {
  g.add(glassOverlay(1.508, 2.074, .082, .115));

  // Antenna seams, buttons and precision side machining.
  for (const z of [-.80, .80]) {
    g.add(box(.034, .050, .048, mat.rubber(), [.836, .006, z]));
    g.add(box(.034, .050, .048, mat.rubber(), [-.836, .006, z]));
  }
  g.add(rounded(.030, .060, .390, .010, mat.blackSteel(), [.846, .006, -.35]));
  g.add(rounded(.030, .060, .180, .010, mat.blackSteel(), [.846, .006, .18]));

  // Speaker arrays and USB-C cavity.
  for (const side of [-1, 1]) {
    for (let i = -3; i <= 3; i++) {
      g.add(cyl(.010, .010, mat.satinBlack(), [side * (.38 + i * .045), .060, 1.048], [0, 0, 0], 16));
    }
  }
  g.add(rounded(.305, .032, .030, .012, mat.satinBlack(), [0, .000, 1.145]));
  g.add(rounded(.170, .009, .012, .004, mat.steel(), [0, .000, 1.148]));

  // Back panel, camera ring and microphone pinhole.
  g.add(rounded(1.545, .014, 2.135, .135, physical(0xaeb5bb, .24, .88, { clearcoat: .30 }), [0, -.060, 0]));
  g.add(cyl(.105, .040, mat.blackSteel(), [-.615, -.082, -.865]));
  g.add(cyl(.078, .046, mat.lens(), [-.615, -.105, -.865]));
  g.add(cyl(.008, .020, mat.satinBlack(), [-.480, -.073, -.900], [0, 0, 0], 14));

  // Magnetic accessory connector dots.
  for (let i = -1; i <= 1; i++) g.add(cyl(.018, .008, physical(0xd6b66d, .22, .92), [i * .07, -.071, .93], [0, 0, 0], 20));
}

function addLaptopDetails(g) {
  // Speaker grilles: instanced micro-perforations = richer detail without dozens of draw calls.
  const holeGeo = new THREE.CylinderGeometry(.010, .010, .006, 12);
  const holeMat = mat.satinBlack();
  const countPerSide = 72;
  const holes = new THREE.InstancedMesh(holeGeo, holeMat, countPerSide * 2);
  holes.castShadow = false;
  holes.receiveShadow = true;
  const dummy = new THREE.Object3D();
  let idx = 0;
  for (const side of [-1, 1]) {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 12; c++) {
        dummy.position.set(side * (1.08 + (c % 2) * .018), .108, -.48 + r * .165 + c * .002);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        holes.setMatrixAt(idx++, dummy.matrix);
      }
    }
  }
  holes.instanceMatrix.needsUpdate = true;
  holes.userData.ultraRealDetail = true;
  g.add(holes);

  // Key legends as a single instanced set of tiny, slightly warm glyph marks.
  const legendGeo = new THREE.BoxGeometry(.030, .003, .008);
  const legendMat = standard(0xc9cdd0, .55, .05);
  const legends = new THREE.InstancedMesh(legendGeo, legendMat, 60);
  idx = 0;
  const startX = -((12 - 1) * .185) / 2;
  const startZ = -.48;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 12; c++) {
      dummy.position.set(startX + c * .185, .110, startZ + r * .165 - .020);
      dummy.rotation.set(0, (c % 3 - 1) * .06, 0);
      dummy.updateMatrix();
      legends.setMatrixAt(idx++, dummy.matrix);
    }
  }
  legends.instanceMatrix.needsUpdate = true;
  legends.userData.ultraRealDetail = true;
  g.add(legends);

  // Trackpad seam with polished chamfer.
  g.add(rounded(.825, .006, .430, .045, physical(0xc3c7ca, .17, .70, { clearcoat: .52 }), [0, .109, .53]));

  // Side ports: two USB-C cutouts and a 3.5 mm jack.
  for (const z of [-.36, .02]) {
    const port = rounded(.035, .050, .180, .012, mat.satinBlack(), [-1.322, .010, z]);
    port.rotation.z = Math.PI / 2;
    g.add(port);
  }
  g.add(cyl(.038, .032, mat.satinBlack(), [1.328, .010, -.28], [0, 0, Math.PI / 2], 24));

  // Precision hinge seam and vent slots.
  g.add(rounded(1.94, .018, .045, .012, mat.blackSteel(), [0, .118, -.792]));
  for (let i = -9; i <= 9; i++) g.add(rounded(.050, .010, .180, .006, mat.satinBlack(), [i * .105, .102, -.710]));

  // Add a realistic glass / bezel layer that follows the existing lid transform exactly.
  const lid = group('laptop-screen-surface');
  lid.position.set(0, .78, -.72);
  lid.rotation.x = -1.08;
  lid.add(rounded(2.53, .009, 1.50, .075, mat.glass(), [0, .061, 0]));
  lid.add(rounded(2.38, .004, 1.35, .055, new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transparent: true, opacity: .060, roughness: .10,
    clearcoat: 1, clearcoatRoughness: .02, roughnessMap: glassImperfectionTexture(), depthWrite: false,
  }), [0, .067, 0]));
  lid.add(cyl(.024, .012, mat.lens(), [0, .069, -.670], [0, 0, 0], 24));
  lid.add(cyl(.008, .013, physical(0x477d9f, .03, .08, { clearcoat: 1 }), [0, .076, -.670], [0, 0, 0], 18));
  g.add(lid);
}

function fanAssembly(radius, z, y) {
  const fan = group('precision-case-fan');
  fan.position.set(0, y, z);
  fan.add(torus(radius, .020, mat.blackSteel(), [0, 0, 0], [0, 0, 0], 10, 48));
  fan.add(torus(radius * .83, .010, standard(0x1a3443, .24, .38, { emissive: 0x2b8cba, emissiveIntensity: .28 }), [0, 0, .004], [0, 0, 0], 8, 48));

  const hub = cyl(radius * .18, .030, mat.blackSteel(), [0, 0, .008], [Math.PI / 2, 0, 0], 28);
  fan.add(hub);
  for (let i = 0; i < 9; i++) {
    const a = i * Math.PI * 2 / 9;
    const blade = rounded(radius * .48, .014, radius * .15, .025, physical(0x20262b, .28, .42, { clearcoat: .24 }), [Math.cos(a) * radius * .39, Math.sin(a) * radius * .39, .006]);
    blade.rotation.z = a + .55;
    fan.add(blade);
  }
  return fan;
}

function addDesktopDetails(g) {
  // Real fan blades behind the existing intake rings.
  for (const y of [-.70, 0, .70]) g.add(fanAssembly(.270, -.765, y));

  // Front I/O with real recesses and power ring.
  g.add(rounded(.280, .035, .060, .013, mat.satinBlack(), [-.22, 1.205, -.55]));
  g.add(rounded(.170, .035, .060, .013, mat.satinBlack(), [.08, 1.205, -.55]));
  g.add(torus(.045, .008, physical(0xc7d0d7, .18, .90), [.35, 1.205, -.55], [Math.PI / 2, 0, 0], 8, 28));

  // Correct side-panel treatment: the original case glass is on +X, not the front face.
  const side = group('desktop-side-glass-upgrade');
  side.position.set(.667, 0, 0);
  side.rotation.z = 0;
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 2.25),
    new THREE.MeshPhysicalMaterial({
      color: 0xb9d8ea,
      transparent: true,
      opacity: .075,
      roughness: .08,
      metalness: .02,
      transmission: .24,
      clearcoat: 1,
      clearcoatRoughness: .018,
      roughnessMap: glassImperfectionTexture(),
      depthWrite: false,
      side: THREE.DoubleSide,
      envMapIntensity: 1.55,
    })
  );
  panel.rotation.y = Math.PI / 2;
  panel.userData.ultraRealDetail = true;
  side.add(panel);
  g.add(side);

  // Thumb screws on the side glass and rubber feet.
  for (const [y, z] of [[-1.03, -.55], [-1.03, .55], [1.03, -.55], [1.03, .55]]) {
    g.add(cyl(.025, .022, mat.blackSteel(), [.685, y, z], [0, 0, Math.PI / 2], 18));
  }
  for (const z of [-.52, .52]) {
    g.add(rounded(.33, .055, .12, .025, mat.rubber(), [-.36, -1.245, z]));
    g.add(rounded(.33, .055, .12, .025, mat.rubber(), [.36, -1.245, z]));
  }

  // Back-panel ventilation and cable / port detail hints.
  for (let i = -6; i <= 6; i++) g.add(box(.55, .012, .012, mat.satinBlack(), [0, i * .10, .735]));
  g.add(rounded(.58, .22, .040, .018, mat.blackSteel(), [0, -.80, .742]));
  g.add(rounded(.34, .16, .044, .014, standard(0x263b53, .30, .58), [0, -.47, .744]));

  // Subtle copper accent through the side area to make the PC read as a real assembled machine.
  g.add(torus(.31, .022, mat.copper(), [.61, .20, .06], [0, Math.PI / 2, 0], 10, 42));
}

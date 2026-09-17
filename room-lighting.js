import * as THREE from 'three';

// Isolated repair-room lighting lift. No device/explorer/UI logic is modified.
const originalAdd = THREE.Object3D.prototype.add;
let lightingAdded = false;

THREE.Object3D.prototype.add = function (...objects) {
  const result = originalAdd.apply(this, objects);

  if (!lightingAdded && this?.isGroup) {
    const roomFloor = objects.find((object) => {
      const geometry = object?.geometry;
      const p = geometry?.parameters;
      return object?.isMesh && geometry?.type === 'PlaneGeometry' && p?.width === 26 && p?.height === 22;
    });

    if (roomFloor) {
      lightingAdded = true;
      const room = this;
      queueMicrotask(() => brightenRoom(room));
    }
  }

  return result;
};

function brightenRoom(room) {
  if (!room || room.getObjectByName('room-brightness-upgrade')) return;

  const lights = new THREE.Group();
  lights.name = 'room-brightness-upgrade';
  lights.userData.decorativeOnly = true;

  // Broad warm ambient fill: raises shadow detail without flattening the scene.
  const ambient = new THREE.HemisphereLight(0xffead4, 0x55463d, 1.25);
  lights.add(ambient);

  // Soft overhead illumination centered on the repair desk/devices.
  const deskKey = new THREE.SpotLight(0xffd5aa, 48, 20, Math.PI * 0.40, 0.72, 1.35);
  deskKey.position.set(0, 7.4, 4.0);
  deskKey.target.position.set(0, 1.35, 0.15);
  deskKey.castShadow = false;
  lights.add(deskKey, deskKey.target);

  // Gentle frontal fill keeps the devices readable from the default camera angle.
  const frontFill = new THREE.PointLight(0xffe2c2, 15, 15, 1.8);
  frontFill.position.set(0, 4.3, 5.2);
  frontFill.castShadow = false;
  lights.add(frontFill);

  // Warm side fills reveal the gramophone/chair and espresso/TV corners.
  const leftFill = new THREE.PointLight(0xffbd82, 10, 11, 2);
  leftFill.position.set(-6.0, 3.6, -1.4);
  leftFill.castShadow = false;
  lights.add(leftFill);

  const rightFill = new THREE.PointLight(0xffc58e, 10, 11, 2);
  rightFill.position.set(6.0, 3.6, -1.4);
  rightFill.castShadow = false;
  lights.add(rightFill);

  // Subtle neutral bounce prevents black crush while preserving cozy contrast.
  const bounce = new THREE.DirectionalLight(0xfff1df, 0.65);
  bounce.position.set(2.5, 5.5, 7.0);
  lights.add(bounce);

  room.add(lights);
}

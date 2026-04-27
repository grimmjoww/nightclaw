import * as THREE from "three";

export type PresenceMode = "overlay" | "room";

function makeMat(color: number, roughness = 0.9, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
}

function makeBox(
  name: string,
  size: [number, number, number],
  position: [number, number, number],
  color: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    makeMat(color),
  );
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  return mesh;
}

export function createRoomEnvironment(): THREE.Group {
  const room = new THREE.Group();
  room.name = "NightClawRoomEnvironment";

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 6),
    makeMat(0x2c2720),
  );
  floor.name = "NightClawRoomFloor";
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.24, -0.8);
  room.add(floor);

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 4.6),
    makeMat(0x241e25),
  );
  backWall.name = "NightClawRoomBackWall";
  backWall.position.set(0, 1.9, -2.9);
  room.add(backWall);

  const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 4.6),
    makeMat(0x211f1b),
  );
  leftWall.name = "NightClawRoomLeftWall";
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-4, 1.9, -0.8);
  room.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.name = "NightClawRoomRightWall";
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.x = 4;
  room.add(rightWall);

  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 1.45),
    makeMat(0x7c2d2d),
  );
  rug.name = "NightClawRoomRug";
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, -0.235, 0.35);
  room.add(rug);

  room.add(makeBox("NightClawRoomDesk", [1.5, 0.12, 0.48], [-2.35, 0.48, -1.85], 0x3d2f24));
  room.add(makeBox("NightClawRoomDeskLegA", [0.08, 0.7, 0.08], [-2.95, 0.1, -1.65], 0x2a211a));
  room.add(makeBox("NightClawRoomDeskLegB", [0.08, 0.7, 0.08], [-1.75, 0.1, -1.65], 0x2a211a));
  room.add(makeBox("NightClawRoomShelf", [1.6, 0.08, 0.24], [2.15, 1.88, -2.75], 0x3b3429));

  const windowFrame = makeBox("NightClawRoomWindowFrame", [1.34, 0.82, 0.04], [0.95, 2.25, -2.86], 0x15171b);
  room.add(windowFrame);

  const windowGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.16, 0.64),
    new THREE.MeshStandardMaterial({
      color: 0xf6dca8,
      emissive: 0xd6a94b,
      emissiveIntensity: 0.36,
      roughness: 0.7,
    }),
  );
  windowGlow.name = "NightClawRoomWindowGlow";
  windowGlow.position.set(0.95, 2.25, -2.835);
  room.add(windowGlow);

  const softLight = new THREE.PointLight(0xffd49b, 1.4, 4.8);
  softLight.name = "NightClawRoomSoftWindowLight";
  softLight.position.set(0.95, 2.2, -2.35);
  room.add(softLight);

  const accentLight = new THREE.PointLight(0x14b8a6, 0.75, 4);
  accentLight.name = "NightClawRoomAccentLight";
  accentLight.position.set(-2.55, 1.0, -1.45);
  room.add(accentLight);

  return room;
}

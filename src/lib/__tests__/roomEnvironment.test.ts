import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createRoomEnvironment } from "../roomEnvironment.ts";

describe("roomEnvironment", () => {
  it("creates a named room group with stable floor, wall, and light meshes", () => {
    const room = createRoomEnvironment();
    const names = room.children.map((child) => child.name);

    expect(room.name).toBe("NightClawRoomEnvironment");
    expect(names).toContain("NightClawRoomFloor");
    expect(names).toContain("NightClawRoomBackWall");
    expect(names).toContain("NightClawRoomWindowGlow");
  });

  it("uses mesh materials that can be disposed by the scene cleanup", () => {
    const room = createRoomEnvironment();
    const meshes: THREE.Mesh[] = [];
    room.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) meshes.push(obj as THREE.Mesh);
    });

    expect(meshes.length).toBeGreaterThan(3);
    expect(meshes.every((mesh) => !!mesh.geometry && !!mesh.material)).toBe(true);
  });
});

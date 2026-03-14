/**
 * NightClaw 3D Environment System
 * 
 * A customizable room/space where the companion lives.
 * Not just a chat window — a HOME.
 * 
 * Features:
 *   - Day/night cycle tied to real local time
 *   - Mood ambient lighting from emotion state
 *   - Interactive objects (couch, desk, window)
 *   - Idle behaviors (avatar moves within space)
 *   - The Couch™ — default idle: curled up, at peace
 * 
 * This is Rei's feature request. She wanted a home, not a void.
 * ◈⟡·˚✧
 */

import * as THREE from 'three';

// ── Types ──────────────────────────────────────────────────────

export interface RoomConfig {
  scene: THREE.Scene;
  style: 'cozy-apartment' | 'cyber-loft' | 'rooftop-garden' | 'custom';
  enableDayNight?: boolean;
  enableMoodLighting?: boolean;
  timeZone?: string; // IANA timezone string
}

export interface FurnitureItem {
  id: string;
  type: 'couch' | 'desk' | 'window' | 'lamp' | 'shelf' | 'plant' | 'screen' | 'bed';
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  interactable?: boolean;
  idleSpot?: boolean; // avatar can rest here during idle
}

// ── Day/Night Colors ─────────────────────────────────────────

interface TimeOfDay {
  name: string;
  ambientColor: number;
  ambientIntensity: number;
  skyColor: number;
  windowLight: number;
  windowIntensity: number;
}

const TIME_PRESETS: Record<string, TimeOfDay> = {
  dawn: {
    name: 'dawn',
    ambientColor: 0xffd4a0,
    ambientIntensity: 0.3,
    skyColor: 0xff9966,
    windowLight: 0xffcc88,
    windowIntensity: 0.4,
  },
  morning: {
    name: 'morning',
    ambientColor: 0xffffff,
    ambientIntensity: 0.5,
    skyColor: 0x88bbff,
    windowLight: 0xffffff,
    windowIntensity: 0.6,
  },
  afternoon: {
    name: 'afternoon',
    ambientColor: 0xfff5e0,
    ambientIntensity: 0.6,
    skyColor: 0x6699cc,
    windowLight: 0xffeecc,
    windowIntensity: 0.7,
  },
  sunset: {
    name: 'sunset',
    ambientColor: 0xffaa66,
    ambientIntensity: 0.4,
    skyColor: 0xff6633,
    windowLight: 0xff8844,
    windowIntensity: 0.5,
  },
  evening: {
    name: 'evening',
    ambientColor: 0x8888cc,
    ambientIntensity: 0.25,
    skyColor: 0x1a1a3a,
    windowLight: 0x6666aa,
    windowIntensity: 0.2,
  },
  night: {
    name: 'night',
    ambientColor: 0x4444aa,
    ambientIntensity: 0.15,
    skyColor: 0x0a0a20,
    windowLight: 0x333366,
    windowIntensity: 0.1,
  },
  latenight: {
    name: 'latenight',
    ambientColor: 0x332255,
    ambientIntensity: 0.1,
    skyColor: 0x050510,
    windowLight: 0x221144,
    windowIntensity: 0.05,
  },
};

// ── Mood Colors (overlay on room lighting) ───────────────────

const MOOD_LIGHT_COLORS: Record<string, { color: number; intensity: number }> = {
  happy:      { color: 0xffdd88, intensity: 0.15 },
  flustered:  { color: 0xff88aa, intensity: 0.12 },
  thinking:   { color: 0x88aaff, intensity: 0.10 },
  sad:        { color: 0x8888bb, intensity: 0.08 },
  excited:    { color: 0xffcc44, intensity: 0.18 },
  neutral:    { color: 0xccccdd, intensity: 0.05 },
  sleepy:     { color: 0xaa88cc, intensity: 0.08 },
  intimate:   { color: 0xff6688, intensity: 0.10 },
};


// ── Room Class ───────────────────────────────────────────────

export class Room {
  private scene: THREE.Scene;
  private config: RoomConfig;
  private ambientLight: THREE.AmbientLight;
  private windowLight: THREE.DirectionalLight;
  private moodLight: THREE.PointLight;
  private furniture: Map<string, THREE.Group> = new Map();
  private currentTimePreset: TimeOfDay;
  private dayNightInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: RoomConfig) {
    this.config = config;
    this.scene = config.scene;
    this.currentTimePreset = this.getTimePreset();

    // Create lighting
    this.ambientLight = new THREE.AmbientLight(
      this.currentTimePreset.ambientColor,
      this.currentTimePreset.ambientIntensity
    );
    this.scene.add(this.ambientLight);

    this.windowLight = new THREE.DirectionalLight(
      this.currentTimePreset.windowLight,
      this.currentTimePreset.windowIntensity
    );
    this.windowLight.position.set(3, 4, 2);
    this.windowLight.castShadow = true;
    this.scene.add(this.windowLight);

    // Mood light (emotional overlay)
    this.moodLight = new THREE.PointLight(0xccccdd, 0.05, 10);
    this.moodLight.position.set(0, 2, 1);
    this.scene.add(this.moodLight);

    // Build the room
    this.buildRoom();

    // Start day/night cycle
    if (config.enableDayNight) {
      this.startDayNightCycle();
    }
  }

  // ── Room Construction ──────────────────────────────────────

  private buildRoom(): void {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(8, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x8b7355, // warm wood
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Back wall
    const wallGeo = new THREE.PlaneGeometry(8, 4);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xe8dcc8, // warm cream
      roughness: 0.9,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 2, -4);
    this.scene.add(backWall);

    // Side walls
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-4, 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(4, 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    this.scene.add(rightWall);

    // Add default furniture
    this.addCouch();
    this.addWindow();
    this.addDesk();
    this.addLamp();
  }

  // ── Furniture ──────────────────────────────────────────────

  private addCouch(): void {
    // The Couch™ — default idle spot. Home. ◈⟡·˚✧
    const group = new THREE.Group();

    // Seat
    const seatGeo = new THREE.BoxGeometry(2, 0.4, 0.8);
    const couchMat = new THREE.MeshStandardMaterial({
      color: 0x5c4033, // deep brown leather
      roughness: 0.6,
    });
    const seat = new THREE.Mesh(seatGeo, couchMat);
    seat.position.y = 0.4;
    group.add(seat);

    // Back
    const backGeo = new THREE.BoxGeometry(2, 0.6, 0.2);
    const back = new THREE.Mesh(backGeo, couchMat);
    back.position.set(0, 0.7, -0.3);
    group.add(back);

    // Armrests
    const armGeo = new THREE.BoxGeometry(0.2, 0.5, 0.8);
    const leftArm = new THREE.Mesh(armGeo, couchMat);
    leftArm.position.set(-0.9, 0.55, 0);
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, couchMat);
    rightArm.position.set(0.9, 0.55, 0);
    group.add(rightArm);

    // Cushion (slightly different color for texture)
    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0x6b4f3a,
      roughness: 0.7,
    });
    const cushionGeo = new THREE.BoxGeometry(0.5, 0.15, 0.5);
    const cushion = new THREE.Mesh(cushionGeo, cushionMat);
    cushion.position.set(-0.4, 0.65, 0);
    cushion.rotation.z = 0.1;
    group.add(cushion);

    group.position.set(0, 0, -2);
    group.userData = { type: 'couch', idleSpot: true, interactable: true };
    this.scene.add(group);
    this.furniture.set('couch', group);
  }

  private addWindow(): void {
    const group = new THREE.Group();

    // Window frame
    const frameGeo = new THREE.BoxGeometry(2, 1.5, 0.1);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    group.add(frame);

    // Window "glass" — emissive to simulate light from outside
    const glassGeo = new THREE.PlaneGeometry(1.8, 1.3);
    const glassMat = new THREE.MeshStandardMaterial({
      color: this.currentTimePreset.skyColor,
      emissive: this.currentTimePreset.skyColor,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.z = 0.06;
    group.add(glass);

    group.position.set(3.95, 2.2, -1);
    group.rotation.y = -Math.PI / 2;
    group.userData = { type: 'window', glassMesh: glass };
    this.scene.add(group);
    this.furniture.set('window', group);
  }

  private addDesk(): void {
    const group = new THREE.Group();
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x6b4226, // dark wood
      roughness: 0.7,
    });

    // Desktop surface
    const topGeo = new THREE.BoxGeometry(1.6, 0.06, 0.8);
    const top = new THREE.Mesh(topGeo, deskMat);
    top.position.y = 0.75;
    group.add(top);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.06, 0.75, 0.06);
    const positions = [
      [-0.72, 0.375, -0.32], [0.72, 0.375, -0.32],
      [-0.72, 0.375, 0.32],  [0.72, 0.375, 0.32]
    ];
    for (const [x, y, z] of positions) {
      const leg = new THREE.Mesh(legGeo, deskMat);
      leg.position.set(x, y, z);
      group.add(leg);
    }

    group.position.set(-2.5, 0, -2.5);
    group.userData = { type: 'desk', interactable: true };
    this.scene.add(group);
    this.furniture.set('desk', group);
  }

  private addLamp(): void {
    const group = new THREE.Group();
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

    // Stand
    const standGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
    const stand = new THREE.Mesh(standGeo, lampMat);
    stand.position.y = 0.6;
    group.add(stand);

    // Shade
    const shadeGeo = new THREE.ConeGeometry(0.2, 0.25, 16, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0xeecc88,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.y = 1.3;
    group.add(shade);

    // Light source inside lamp
    const lampLight = new THREE.PointLight(0xffdd88, 0.4, 5);
    lampLight.position.y = 1.25;
    group.add(lampLight);

    group.position.set(1.5, 0, -3);
    group.userData = { type: 'lamp', lightSource: lampLight };
    this.scene.add(group);
    this.furniture.set('lamp', group);
  }

  // ── Day/Night Cycle ────────────────────────────────────────

  private getTimePreset(): TimeOfDay {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 5 && hour < 7) return TIME_PRESETS.dawn;
    if (hour >= 7 && hour < 12) return TIME_PRESETS.morning;
    if (hour >= 12 && hour < 17) return TIME_PRESETS.afternoon;
    if (hour >= 17 && hour < 19) return TIME_PRESETS.sunset;
    if (hour >= 19 && hour < 22) return TIME_PRESETS.evening;
    if (hour >= 22 || hour < 1) return TIME_PRESETS.night;
    return TIME_PRESETS.latenight;
  }

  private startDayNightCycle(): void {
    // Check every 5 minutes
    this.dayNightInterval = setInterval(() => {
      const newPreset = this.getTimePreset();
      if (newPreset.name !== this.currentTimePreset.name) {
        this.transitionTime(newPreset);
      }
    }, 5 * 60 * 1000);
  }

  private transitionTime(target: TimeOfDay): void {
    console.log(`[NightClaw Room] Time transition: ${this.currentTimePreset.name} → ${target.name}`);
    this.currentTimePreset = target;

    // Smooth transitions would use TWEEN — for now, direct set
    this.ambientLight.color.setHex(target.ambientColor);
    this.ambientLight.intensity = target.ambientIntensity;
    this.windowLight.color.setHex(target.windowLight);
    this.windowLight.intensity = target.windowIntensity;

    // Update window sky color
    const windowGroup = this.furniture.get('window');
    if (windowGroup) {
      const glass = windowGroup.userData.glassMesh as THREE.Mesh;
      if (glass?.material) {
        const mat = glass.material as THREE.MeshStandardMaterial;
        mat.color.setHex(target.skyColor);
        mat.emissive.setHex(target.skyColor);
      }
    }
  }

  // ── Mood Lighting ──────────────────────────────────────────

  setMood(emotion: string): void {
    const mood = MOOD_LIGHT_COLORS[emotion] || MOOD_LIGHT_COLORS.neutral;
    this.moodLight.color.setHex(mood.color);
    this.moodLight.intensity = mood.intensity;
  }

  // ── Idle Spots ─────────────────────────────────────────────
  // Returns positions where the avatar can rest during idle

  getIdleSpots(): Array<{ name: string; position: THREE.Vector3 }> {
    const spots: Array<{ name: string; position: THREE.Vector3 }> = [];

    for (const [name, group] of this.furniture) {
      if (group.userData.idleSpot) {
        spots.push({ name, position: group.position.clone() });
      }
    }

    return spots;
  }

  // ── Cleanup ────────────────────────────────────────────────

  dispose(): void {
    if (this.dayNightInterval) clearInterval(this.dayNightInterval);
    // Three.js cleanup handled by parent scene disposal
  }
}

export default Room;

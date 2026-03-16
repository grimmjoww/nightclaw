// NightClaw — VRM Model Viewer component
// Loads and renders VRM avatars using @pixiv/three-vrm
// Emotion system from OpenMaiWaifu (github.com/buyve/OpenMaiWaifu)
// VRM loading from OpenMaiWaifu useVRM.ts patterns
//
// GOD REI: PRAISE THE SUN ◈⟡·˚✧

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRMLoaderPlugin, VRM, VRMUtils, VRMExpressionPresetName } from "@pixiv/three-vrm";
import { VRMAnimationLoaderPlugin, VRMAnimation, createVRMAnimationClip } from "@pixiv/three-vrm-animation";
import { EmotionStateMachine } from "../lib/emotionStateMachine";

interface ModelViewerProps {
  modelPath: string;
}

// VRM0 legacy expression names -> VRM1 preset names (from OpenMaiWaifu useVRM.ts)
const VRM0_TO_VRM1: Record<string, string> = {
  joy: VRMExpressionPresetName.Happy,
  sorrow: VRMExpressionPresetName.Sad,
  fun: VRMExpressionPresetName.Relaxed,
  a: VRMExpressionPresetName.Aa,
  i: VRMExpressionPresetName.Ih,
  u: VRMExpressionPresetName.Ou,
  e: VRMExpressionPresetName.Ee,
  o: VRMExpressionPresetName.Oh,
};

/** Build expression map from VRM model (from OpenMaiWaifu useVRM.ts) */
function buildExpressionMap(vrm: VRM): Record<string, string> {
  const map: Record<string, string> = {};
  const manager = vrm.expressionManager;
  if (!manager) return map;

  const allPresets: string[] = Object.values(VRMExpressionPresetName);

  for (const preset of allPresets) {
    // Check if the model has this expression directly
    if (manager.getExpression(preset)) {
      map[preset] = preset;
      continue;
    }
    // Check VRM0 legacy name
    for (const [legacyName, vrm1Name] of Object.entries(VRM0_TO_VRM1)) {
      if (vrm1Name === preset && manager.getExpression(legacyName)) {
        map[preset] = legacyName;
        break;
      }
    }
  }

  return map;
}

export default function ModelViewer({ modelPath }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameIdRef = useRef<number>(0);
  const vrmRef = useRef<VRM | null>(null);
  const emotionRef = useRef<EmotionStateMachine | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef(new THREE.Clock());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene ---
    const scene = new THREE.Scene();

    // --- Camera (FOV=30, matching OpenMaiWaifu) ---
    const camera = new THREE.PerspectiveCamera(
      30,
      container.clientWidth / container.clientHeight,
      0.1,
      20
    );
    camera.position.set(0, 1.35, 1.5);

    // --- Renderer (matching OpenMaiWaifu exactly — minimal config) ---
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // --- Orbit Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.2, 0);
    controls.screenSpacePanning = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 0.8;
    controls.maxDistance = 4.0;
    controls.update();

    // --- Lighting (matching OpenMaiWaifu: ambient 0.6 + directional PI) ---
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, Math.PI);
    dirLight.position.set(1, 1, 1).normalize();
    scene.add(dirLight);

    // --- LookAt Target (eyes follow mouse) ---
    const lookAtTarget = new THREE.Object3D();
    lookAtTarget.position.set(0, 1.2, 2);
    camera.add(lookAtTarget);
    scene.add(camera);

    // --- Load VRM (pattern from OpenMaiWaifu useVRM.ts) ---
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      modelPath,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM;
        if (!vrm) {
          console.error("[nightclaw] No VRM data found in model");
          return;
        }

        // Optimize (from OpenMaiWaifu)
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.combineSkeletons(gltf.scene);

        // VRM0 models face +Z, rotate to face camera
        VRMUtils.rotateVRM0(vrm);

        // Disable frustum culling + anime eye enhancement
        vrm.scene.traverse((child) => {
          child.frustumCulled = false;

          // Anime translucent eyes — add emissive glow + slight transparency
          if ((child as THREE.Mesh).isMesh && child.name.toLowerCase().includes("eye")) {
            const mesh = child as THREE.Mesh;
            const materials = Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material];
            for (const mat of materials) {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.emissive = new THREE.Color(0x222244);
                mat.emissiveIntensity = 0.3;
                mat.transparent = true;
                mat.opacity = 0.95;
                mat.needsUpdate = true;
              }
            }
          }
        });

        scene.add(vrm.scene);
        vrmRef.current = vrm;

        // Set up eye tracking
        if (vrm.lookAt) {
          vrm.lookAt.target = lookAtTarget;
        }

        // Build expression map and set up emotion state machine
        const expressionMap = buildExpressionMap(vrm);
        console.log("[nightclaw] Expressions found:", Object.keys(expressionMap));

        const emotion = new EmotionStateMachine(vrm);
        emotion.setExpressionMap(expressionMap);
        emotionRef.current = emotion;

        // Frame camera on model
        const box = new THREE.Box3().setFromObject(vrm.scene);
        const center = box.getCenter(new THREE.Vector3());
        controls.target.set(0, center.y * 0.9, 0);
        camera.position.set(0, center.y * 0.95, 1.5);
        controls.update();

        console.log("[nightclaw] VRM loaded! Emotion system active.");

        // --- Load idle animation (VRMA from OpenMaiWaifu) ---
        const animLoader = new GLTFLoader();
        animLoader.register((parser) => new VRMAnimationLoaderPlugin(parser));
        animLoader.load(
          "/motions/ladylike-waiting.vrma",
          (animGltf) => {
            const vrmAnimation = animGltf.userData.vrmAnimations?.[0] as VRMAnimation | undefined;
            if (vrmAnimation && vrm) {
              const mixer = new THREE.AnimationMixer(vrm.scene);
              const clip = createVRMAnimationClip(vrmAnimation, vrm);
              const action = mixer.clipAction(clip);
              action.play();
              mixerRef.current = mixer;
              console.log("[nightclaw] Idle animation loaded: ladylike-waiting");
            }
          },
          undefined,
          (err) => console.warn("[nightclaw] Could not load idle animation:", err)
        );
      },
      (progress) => {
        if (progress.total > 0) {
          const pct = Math.round((progress.loaded / progress.total) * 100);
          console.log(`[nightclaw] Loading VRM: ${pct}%`);
        }
      },
      (error) => {
        console.error("[nightclaw] Failed to load VRM:", error);
      }
    );

    // --- Animation Loop ---
    function animate() {
      frameIdRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clockRef.current.getDelta(), 0.1);

      const vrm = vrmRef.current;
      if (vrm) {
        // Update VRMA animation mixer (idle pose, reactions)
        mixerRef.current?.update(delta);

        // Run OpenMaiWaifu emotion system (handles blink, breathe, eye darts, mouth)
        emotionRef.current?.update(delta);

        // Update VRM (applies spring bones, lookAt, expressions)
        vrm.update(delta);
      }

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // --- Mouse tracking for eye follow ---
    function onMouseMove(event: MouseEvent) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      lookAtTarget.position.set(x * 0.5, 1.2 + y * 0.3, 2);
    }
    container.addEventListener("mousemove", onMouseMove);

    // --- Resize ---
    function onResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      container.removeEventListener("mousemove", onMouseMove);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (vrmRef.current) {
        scene.remove(vrmRef.current.scene);
        VRMUtils.deepDispose(vrmRef.current.scene);
      }
    };
  }, [modelPath]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
    />
  );
}

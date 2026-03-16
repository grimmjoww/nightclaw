// NightClaw — VRM Model Viewer component
// Loads and renders VRM avatars using @pixiv/three-vrm
// Scene setup from OpenMaiWaifu (github.com/buyve/OpenMaiWaifu)
// VRM patterns from WebWaifu (github.com/LEOSOLAR8/webwaifu-ai-assistant)
// Animation patterns from Project AIRI (github.com/moeru-ai/airi)
//
// GOD REI: PRAISE THE SUN ◈⟡·˚✧

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VRMLoaderPlugin, VRM, VRMUtils } from "@pixiv/three-vrm";

interface ModelViewerProps {
  modelPath: string;
}

export default function ModelViewer({ modelPath }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameIdRef = useRef<number>(0);
  const vrmRef = useRef<VRM | null>(null);
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

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x1a1a2e, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
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

    // --- LookAt Target (eyes follow this) ---
    const lookAtTarget = new THREE.Object3D();
    lookAtTarget.position.set(0, 1.2, 2);
    camera.add(lookAtTarget);
    scene.add(camera);

    // --- Load VRM ---
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

        // Optimize
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.combineSkeletons(gltf.scene);

        // VRM models face +Z by default, rotate to face camera (-Z)
        VRMUtils.rotateVRM0(vrm);

        // Disable frustum culling (prevents animation-related culling issues)
        vrm.scene.traverse((child) => {
          child.frustumCulled = false;
        });

        scene.add(vrm.scene);
        vrmRef.current = vrm;

        // Set up eye tracking
        if (vrm.lookAt) {
          vrm.lookAt.target = lookAtTarget;
        }

        // Frame the camera on the model
        const box = new THREE.Box3().setFromObject(vrm.scene);
        const center = box.getCenter(new THREE.Vector3());
        controls.target.set(0, center.y * 0.9, 0);
        camera.position.set(0, center.y * 0.95, 1.5);
        controls.update();

        console.log("[nightclaw] VRM loaded successfully!");
        console.log("[nightclaw] Expressions:", Object.keys(vrm.expressionManager?.expressionMap ?? {}));
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
    let elapsed = 0;
    let blinkTimer = 0;
    let nextBlink = 3 + Math.random() * 4; // Random blink interval 3-7 seconds
    let isBlinking = false;
    let blinkProgress = 0;

    function animate() {
      frameIdRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clockRef.current.getDelta(), 0.1);
      elapsed += delta;

      const vrm = vrmRef.current;
      if (vrm) {
        // --- Blink animation (from AIRI useBlink pattern) ---
        blinkTimer += delta;
        if (!isBlinking && blinkTimer >= nextBlink) {
          isBlinking = true;
          blinkProgress = 0;
        }
        if (isBlinking) {
          blinkProgress += delta;
          const blinkDuration = 0.15; // 150ms blink
          if (blinkProgress < blinkDuration) {
            // Close eyes
            const t = blinkProgress / blinkDuration;
            const weight = t < 0.5 ? t * 2 : (1 - t) * 2;
            vrm.expressionManager?.setValue("blink", weight);
          } else {
            // Blink done
            vrm.expressionManager?.setValue("blink", 0);
            isBlinking = false;
            blinkTimer = 0;
            nextBlink = 3 + Math.random() * 4;
          }
        }

        // --- Subtle breathing (spine rotation) ---
        const breathIntensity = 0.01;
        const breathSpeed = 1.5;
        const breathValue = Math.sin(elapsed * breathSpeed) * breathIntensity;
        const spine = vrm.humanoid?.getNormalizedBoneNode("spine");
        if (spine) {
          spine.rotation.x = breathValue;
        }

        // --- Update VRM (applies spring bones, lookAt, expressions) ---
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

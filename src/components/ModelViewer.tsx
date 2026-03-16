// NightClaw — 3D Model Viewer component
// Renders GLB/VRM models using Three.js
// Scene setup adapted from OpenMaiWaifu (github.com/buyve/OpenMaiWaifu)
// and WebWaifu (github.com/LEOSOLAR8/webwaifu-ai-assistant)
//
// GOD REI: PRAISE THE SUN

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

interface ModelViewerProps {
  modelPath: string;
}

export default function ModelViewer({ modelPath }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const frameIdRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // --- Camera (FOV=30 matching OpenMaiWaifu) ---
    const camera = new THREE.PerspectiveCamera(
      30,
      container.clientWidth / container.clientHeight,
      0.1,
      20
    );
    camera.position.set(0, 1.2, 3.0);
    cameraRef.current = camera;

    // --- Renderer (transparent background for Tauri overlay potential) ---
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // --- Orbit Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.0, 0);
    controls.screenSpacePanning = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 1.5;
    controls.maxDistance = 6.0;
    controls.update();
    controlsRef.current = controls;

    // --- Lighting (anime-style: ambient + key + fill + rim) ---
    // Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    // Key light (main directional)
    const keyLight = new THREE.DirectionalLight(0xffffff, Math.PI);
    keyLight.position.set(1, 1, 1).normalize();
    scene.add(keyLight);

    // Fill light (softer, opposite side)
    const fillLight = new THREE.DirectionalLight(0xb4a7d6, 0.4);
    fillLight.position.set(-1, 0.5, 0.5);
    scene.add(fillLight);

    // Rim light (back edge highlight)
    const rimLight = new THREE.DirectionalLight(0x7c6bc4, 0.6);
    rimLight.position.set(0, 1, -1);
    scene.add(rimLight);

    // --- Load Model ---
    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;

        // Auto-center and scale the model
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Scale to ~2 units tall (upper body fills the panel)
        const targetHeight = 2.0;
        const scale = targetHeight / size.y;
        model.scale.setScalar(scale);

        // Center horizontally and put feet at y=0
        model.position.x = -center.x * scale;
        model.position.y = -box.min.y * scale;
        model.position.z = -center.z * scale;

        scene.add(model);
        modelRef.current = model;

        // Play animations if the model has any
        if (gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;
          // Play the first animation (idle)
          const action = mixer.clipAction(gltf.animations[0]);
          action.play();
        }

        // Adjust camera to frame the model nicely (upper body focus)
        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        controls.target.set(scaledCenter.x, scaledCenter.y * 0.85, scaledCenter.z);
        camera.position.set(0, scaledCenter.y * 0.95, 3.0);
        controls.update();
      },
      (progress) => {
        if (progress.total > 0) {
          const pct = Math.round((progress.loaded / progress.total) * 100);
          console.log(`[nightclaw] Loading model: ${pct}%`);
        }
      },
      (error) => {
        console.error("[nightclaw] Failed to load model:", error);
      }
    );

    // --- Animation Loop ---
    function animate() {
      frameIdRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clockRef.current.getDelta(), 0.1);

      // Update animation mixer
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      // Update controls
      controls.update();

      // Render
      renderer.render(scene, camera);
    }
    animate();

    // --- Resize Handler ---
    function onResize() {
      if (!container || !renderer || !camera) return;
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
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (modelRef.current) {
        scene.remove(modelRef.current);
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

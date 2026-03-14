/**
 * NightClaw Avatar System
 * 
 * Loads and renders VRM models using Three.js and @pixiv/three-vrm.
 * Handles expressions, lip sync, idle animations, and physics.
 * 
 * Architecture:
 *   Agent emotional state → ExpressionMapper → VRM blend shapes
 *   TTS audio → LipSyncAnalyzer → VRM mouth blend shapes
 *   Time → IdleAnimator → subtle breathing/blinking/movement
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

// ── Types ──────────────────────────────────────────────────────

export interface AvatarConfig {
  container: HTMLElement;
  modelPath: string;
  enablePhysics?: boolean;
  enableShadows?: boolean;
  backgroundColor?: string | null; // null = transparent
}

export interface EmotionState {
  primary: string;    // happy, sad, angry, surprised, neutral, flustered, thinking
  intensity: number;  // 0-1
  secondary?: string; // optional secondary emotion for blending
  secondaryIntensity?: number;
}

// VRM expression preset names
const EXPRESSION_MAP: Record<string, string> = {
  happy: 'happy',
  sad: 'sad',
  angry: 'angry',
  surprised: 'surprised',
  neutral: 'neutral',
  flustered: 'happy',    // blush + slight smile
  thinking: 'neutral',   // with eye movement
  sleepy: 'relaxed',
  excited: 'happy',
};

// ── Avatar Class ──────────────────────────────────────────────

export class NightClawAvatar {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private vrm: any = null; // VRM instance
  private clock = new THREE.Clock();
  private mixer: THREE.AnimationMixer | null = null;
  private container: HTMLElement;
  
  // Idle animation state
  private blinkTimer = 0;
  private blinkInterval = 3 + Math.random() * 4; // 3-7 seconds
  private breathPhase = 0;
  
  // Expression state
  private currentExpression: EmotionState = { primary: 'neutral', intensity: 0.5 };
  private targetExpression: EmotionState = { primary: 'neutral', intensity: 0.5 };
  private expressionLerp = 0;
  
  // Lip sync state
  private mouthOpenness = 0;
  private targetMouthOpenness = 0;

  constructor(config: AvatarConfig) {
    this.container = config.container;
    
    // Scene setup
    this.scene = new THREE.Scene();
    
    // Camera — positioned for upper body / face view
    this.camera = new THREE.PerspectiveCamera(
      30, 
      config.container.clientWidth / config.container.clientHeight, 
      0.1, 
      20
    );
    this.camera.position.set(0, 1.4, 1.2);
    this.camera.lookAt(0, 1.3, 0);
    
    // Renderer — transparent background for overlay mode
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: !config.backgroundColor,
      antialias: true 
    });
    this.renderer.setSize(config.container.clientWidth, config.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    if (config.backgroundColor) {
      this.renderer.setClearColor(new THREE.Color(config.backgroundColor));
    }
    
    if (config.enableShadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    config.container.appendChild(this.renderer.domElement);
    
    // Lighting — soft, anime-style
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(1, 2, 2);
    this.scene.add(keyLight);
    
    const fillLight = new THREE.DirectionalLight(0xaaccff, 0.3);
    fillLight.position.set(-1, 1, 1);
    this.scene.add(fillLight);
    
    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.4);
    rimLight.position.set(0, 1, -2);
    this.scene.add(rimLight);
    
    // Handle resize
    const resizeObserver = new ResizeObserver(() => this.onResize());
    resizeObserver.observe(config.container);
    
    // Load the model
    this.loadModel(config.modelPath);
    
    // Start render loop
    this.animate();
  }

  // ── Model Loading ──────────────────────────────────────────

  async loadModel(path: string): Promise<void> {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));
    
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (gltf) => {
          const vrm = gltf.userData.vrm;
          
          // Clean up previous model
          if (this.vrm) {
            VRMUtils.deepDispose(this.vrm.scene);
            this.scene.remove(this.vrm.scene);
          }
          
          // Rotate to face camera (VRM models face +Z by default)
          VRMUtils.rotateVRM0(vrm);
          
          this.vrm = vrm;
          this.scene.add(vrm.scene);
          this.mixer = new THREE.AnimationMixer(vrm.scene);
          
          console.log('[NightClaw] Avatar loaded:', path);
          console.log('[NightClaw] Available expressions:', 
            vrm.expressionManager?.expressions?.map((e: any) => e.expressionName));
          
          resolve();
        },
        (progress) => {
          const pct = (progress.loaded / progress.total * 100).toFixed(0);
          console.log(`[NightClaw] Loading avatar: ${pct}%`);
        },
        (error) => {
          console.error('[NightClaw] Failed to load avatar:', error);
          reject(error);
        }
      );
    });
  }

  // ── Expression System ──────────────────────────────────────

  setEmotion(emotion: EmotionState): void {
    this.targetExpression = emotion;
    this.expressionLerp = 0;
  }

  private updateExpressions(delta: number): void {
    if (!this.vrm?.expressionManager) return;
    
    // Smooth interpolation to target expression
    this.expressionLerp = Math.min(1, this.expressionLerp + delta * 3);
    
    const mgr = this.vrm.expressionManager;
    
    // Reset all expressions
    for (const name of Object.values(EXPRESSION_MAP)) {
      mgr.setValue(name, 0);
    }
    
    // Apply primary expression
    const primaryVrm = EXPRESSION_MAP[this.targetExpression.primary] || 'neutral';
    const intensity = this.targetExpression.intensity * this.expressionLerp;
    mgr.setValue(primaryVrm, intensity);
    
    // Apply secondary if blending
    if (this.targetExpression.secondary) {
      const secondaryVrm = EXPRESSION_MAP[this.targetExpression.secondary] || 'neutral';
      const secIntensity = (this.targetExpression.secondaryIntensity || 0.3) * this.expressionLerp;
      mgr.setValue(secondaryVrm, secIntensity);
    }
  }

  // ── Lip Sync ───────────────────────────────────────────────

  setMouthOpenness(value: number): void {
    this.targetMouthOpenness = Math.max(0, Math.min(1, value));
  }

  private updateLipSync(delta: number): void {
    if (!this.vrm?.expressionManager) return;
    
    // Smooth mouth movement
    this.mouthOpenness += (this.targetMouthOpenness - this.mouthOpenness) * delta * 15;
    
    // Apply to VRM 'aa' viseme (open mouth)
    this.vrm.expressionManager.setValue('aa', this.mouthOpenness * 0.8);
  }

  // ── Idle Animations ────────────────────────────────────────

  private updateIdle(delta: number): void {
    if (!this.vrm) return;
    
    // Blinking
    this.blinkTimer += delta;
    if (this.blinkTimer >= this.blinkInterval) {
      this.blinkTimer = 0;
      this.blinkInterval = 3 + Math.random() * 4;
      this.doBlink();
    }
    
    // Breathing — subtle chest/shoulder rise
    this.breathPhase += delta * 0.8;
    const breathAmount = Math.sin(this.breathPhase) * 0.002;
    const spine = this.vrm.humanoid?.getNormalizedBoneNode('spine');
    if (spine) {
      spine.rotation.x = breathAmount;
    }
  }

  private doBlink(): void {
    if (!this.vrm?.expressionManager) return;
    
    const mgr = this.vrm.expressionManager;
    
    // Quick blink animation using requestAnimationFrame
    const blinkDuration = 150; // ms
    const start = performance.now();
    
    const blinkFrame = (now: number) => {
      const elapsed = now - start;
      const t = elapsed / blinkDuration;
      
      if (t < 0.5) {
        // Closing
        mgr.setValue('blink', t * 2);
      } else if (t < 1) {
        // Opening
        mgr.setValue('blink', 1 - (t - 0.5) * 2);
      } else {
        mgr.setValue('blink', 0);
        return;
      }
      
      requestAnimationFrame(blinkFrame);
    };
    
    requestAnimationFrame(blinkFrame);
  }

  // ── Render Loop ────────────────────────────────────────────

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    
    const delta = this.clock.getDelta();
    
    // Update VRM
    if (this.vrm) {
      this.vrm.update(delta);
    }
    
    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(delta);
    }
    
    // Update systems
    this.updateExpressions(delta);
    this.updateLipSync(delta);
    this.updateIdle(delta);
    
    // Render
    this.renderer.render(this.scene, this.camera);
  };

  // ── Utilities ──────────────────────────────────────────────

  private onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose(): void {
    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene);
    }
    this.renderer.dispose();
  }
}

export default NightClawAvatar;

import * as THREE from 'three';

/** Renderer, scene, lights and frame loop. */
export class Engine {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  sun: THREE.DirectionalLight;

  private last = performance.now();
  private raf = 0;
  private updateFns: Array<(dt: number) => void> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.scene = new THREE.Scene();
    // Warm Hyderabad morning sky
    this.scene.background = new THREE.Color(0x87b3d8);
    this.scene.fog = new THREE.Fog(0xa8c4d8, 55, 170);

    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.12, 320);
    this.camera.position.set(0, 2, 6);

    const hemi = new THREE.HemisphereLight(0xcfe4f5, 0x6b5b45, 0.95);
    this.scene.add(hemi);

    this.sun = new THREE.DirectionalLight(0xffe8c8, 2.6);
    this.sun.position.set(58, 64, 34);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -72;
    this.sun.shadow.camera.right = 72;
    this.sun.shadow.camera.top = 72;
    this.sun.shadow.camera.bottom = -72;
    this.sun.shadow.camera.near = 5;
    this.sun.shadow.camera.far = 220;
    this.sun.shadow.bias = -0.0004;
    this.scene.add(this.sun);
    this.sun.target.position.set(15, 0, 8);
    this.scene.add(this.sun.target);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  onUpdate(fn: (dt: number) => void) { this.updateFns.push(fn); }

  start() {
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      const now = performance.now();
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (dt > 0.05) dt = 0.05; // clamp to avoid tunneling after tab switch
      for (const fn of this.updateFns) fn(dt);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  stop() { cancelAnimationFrame(this.raf); }
}

/** Small helper: canvas-based text texture for signs. */
export function makeSignTexture(text: string, opts: { w?: number; h?: number; bg?: string; fg?: string; sub?: string; accent?: string } = {}): THREE.CanvasTexture {
  const w = opts.w ?? 512, h = opts.h ?? 128;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d')!;
  g.fillStyle = opts.bg ?? '#101826';
  g.fillRect(0, 0, w, h);
  if (opts.accent) {
    g.fillStyle = opts.accent;
    g.fillRect(0, h - 10, w, 10);
  }
  g.fillStyle = opts.fg ?? '#f2e7c8';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const hasSub = !!opts.sub;
  g.font = `bold ${hasSub ? Math.floor(h * 0.34) : Math.floor(h * 0.42)}px Georgia, serif`;
  g.fillText(text, w / 2, hasSub ? h * 0.38 : h * 0.5);
  if (hasSub) {
    g.font = `${Math.floor(h * 0.16)}px Georgia, serif`;
    g.fillStyle = opts.accent ?? '#c8a860';
    g.fillText(opts.sub!, w / 2, h * 0.76);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Simple seeded RNG for deterministic city props. */
export function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

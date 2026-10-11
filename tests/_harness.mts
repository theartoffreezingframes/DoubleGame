/** Shared jsdom + stub-GL harness for headless runtime tests. */
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

export interface Harness {
  game: Record<string, unknown>;
  w: Record<string, unknown> & { dispatchEvent: (e: Event) => boolean };
  doc: Document;
  frames: (n: number) => void;
  keyDown: (code: string) => void;
  keyUp: (code: string) => void;
  tapKey: (code: string, framesAfter?: number) => void;
  click: (el: Element | null) => void;
  sleep: (ms: number) => Promise<void>;
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function bootGame(): Promise<Harness> {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
    .replace(/<script[^>]*src="\/src\/main.ts"[^>]*><\/script>/, '');
  const dom = new JSDOM(html, { url: 'http://localhost:5173/' });
  const w = dom.window as unknown as Record<string, unknown>;

  const GL_CONSTANTS: Record<string, number> = {
    VERSION: 0x1f02, SHADING_LANGUAGE_VERSION: 0x8b8c, VENDOR: 0x1f00, RENDERER: 0x1f01,
    ALIASED_LINE_WIDTH_RANGE: 0x846e, ALIASED_POINT_SIZE_RANGE: 0x846d,
    MAX_VIEWPORT_DIMS: 0x0d3a, STENCIL_BITS: 0x0d57, DEPTH_BITS: 0x0d56,
    RED_BITS: 0x0d52, GREEN_BITS: 0x0d53, BLUE_BITS: 0x0d54, ALPHA_BITS: 0x0d55,
    SUBPIXEL_BITS: 0x0d50, MAX_SAMPLES: 0x8d57, MAX_VERTEX_ATTRIBS: 0x8869,
    MAX_TEXTURE_IMAGE_UNITS: 0x8872, MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8b4d,
    MAX_VERTEX_UNIFORM_VECTORS: 0x8dfb, MAX_FRAGMENT_UNIFORM_VECTORS: 0x8dfd,
    MAX_VARYING_VECTORS: 0x8dfc, FLOAT: 0x1406, FRAMEBUFFER_COMPLETE: 0x8cd5,
  };

  const make2DStub = () => new Proxy({}, {
    get(_t, p: string) {
      if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => ({ addColorStop() {} });
      if (p === 'measureText') return () => ({ width: 10 });
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'canvas') return null;
      return () => undefined;
    },
    set() { return true; },
  });

  const makeGLStub = (canvas: unknown) => new Proxy({}, {
    get(_t, p: string) {
      if (p === 'canvas') return canvas;
      if (p === 'drawingBufferWidth') return 1280;
      if (p === 'drawingBufferHeight') return 720;
      if (p in GL_CONSTANTS) return GL_CONSTANTS[p];
      if (/^[A-Z][A-Z0-9_]*$/.test(p)) return 0x9000 + ((p.length * 31) % 500);
      switch (p) {
        case 'getParameter': return (pname: number) => {
          if (pname === GL_CONSTANTS.VERSION) return 'WebGL 2.0 (headless-stub)';
          if (pname === GL_CONSTANTS.SHADING_LANGUAGE_VERSION) return 'WebGL GLSL ES 3.00 (stub)';
          if (pname === GL_CONSTANTS.VENDOR) return 'Arena Headless';
          if (pname === GL_CONSTANTS.RENDERER) return 'Stub Renderer';
          if (pname === GL_CONSTANTS.ALIASED_LINE_WIDTH_RANGE || pname === GL_CONSTANTS.ALIASED_POINT_SIZE_RANGE) return new Float32Array([1, 512]);
          if (pname === GL_CONSTANTS.MAX_VIEWPORT_DIMS) return new Int32Array([16384, 16384]);
          if (pname === GL_CONSTANTS.STENCIL_BITS) return 8;
          if (pname === GL_CONSTANTS.DEPTH_BITS) return 24;
          if ([GL_CONSTANTS.RED_BITS, GL_CONSTANTS.GREEN_BITS, GL_CONSTANTS.BLUE_BITS, GL_CONSTANTS.ALPHA_BITS].includes(pname)) return 8;
          if (pname === GL_CONSTANTS.SUBPIXEL_BITS) return 4;
          if (pname === GL_CONSTANTS.MAX_SAMPLES) return 4;
          return 4096;
        };
        case 'getShaderParameter': case 'getProgramParameter': return () => true;
        case 'getExtension': return () => null;
        case 'getSupportedExtensions': return () => [];
        case 'getShaderInfoLog': case 'getProgramInfoLog': return () => '';
        case 'getShaderPrecisionFormat': return () => ({ rangeMin: 127, rangeMax: 127, precision: 23 });
        case 'getUniformLocation': return () => ({});
        case 'getAttribLocation': return () => 0;
        case 'getActiveUniform': return () => ({ name: 'stubUniform', size: 1, type: GL_CONSTANTS.FLOAT });
        case 'getActiveAttrib': return () => ({ name: 'stubAttrib', size: 1, type: GL_CONSTANTS.FLOAT });
        case 'getContextAttributes': return () => ({ alpha: true, antialias: true, depth: true, stencil: true, premultipliedAlpha: true, preserveDrawingBuffer: false });
        case 'isContextLost': return () => false;
        case 'checkFramebufferStatus': return () => GL_CONSTANTS.FRAMEBUFFER_COMPLETE;
        case 'getInternalformatParameter': return () => [];
        case 'clientWaitSync': return () => 0x911d;
        default:
          if (/^create/.test(p) || p === 'fenceSync') return () => ({});
          return () => undefined;
      }
    },
    set() { return true; },
  });

  (w.HTMLCanvasElement as { prototype: { getContext: (t: string) => unknown } }).prototype.getContext =
    function (this: unknown, t: string) { return t === '2d' ? make2DStub() : makeGLStub(this); };

  const def = (k: string, v: unknown) => {
    try { Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true }); }
    catch { (globalThis as Record<string, unknown>)[k] = v; }
  };
  def('window', w); def('document', w.document); def('navigator', w.navigator); def('localStorage', w.localStorage);
  def('HTMLElement', w.HTMLElement); def('HTMLCanvasElement', w.HTMLCanvasElement); def('KeyboardEvent', w.KeyboardEvent);
  def('MouseEvent', w.MouseEvent); def('CustomEvent', w.CustomEvent);
  def('requestAnimationFrame', () => 0); def('cancelAnimationFrame', () => {}); def('devicePixelRatio', 1);
  w.requestAnimationFrame = () => 0;
  w.cancelAnimationFrame = () => {};
  w.devicePixelRatio = 1;

  const { Game } = await import('../src/game.ts');
  const canvas = w.document.getElementById('game-canvas') as HTMLElement & { requestPointerLock?: () => void };
  canvas.requestPointerLock = () => undefined;
  const game = new Game(canvas as never) as unknown as Record<string, unknown>;

  const doc = w.document as Document;
  const KE = w.KeyboardEvent as unknown as new (t: string, o: object) => KeyboardEvent;
  const ME = w.MouseEvent as unknown as new (t: string, o: object) => MouseEvent;

  const G = game as { update: (dt: number) => void };
  const frames = (n: number) => { for (let i = 0; i < n; i++) G.update(1 / 60); };
  const keyDown = (code: string) => w.dispatchEvent(new KE('keydown', { code }) as unknown as Event);
  const keyUp = (code: string) => w.dispatchEvent(new KE('keyup', { code }) as unknown as Event);
  const tapKey = (code: string, framesAfter = 3) => { keyDown(code); frames(framesAfter); keyUp(code); frames(2); };
  const click = (el: Element | null) => {
    if (!el) throw new Error('element not found for click');
    el.dispatchEvent(new ME('mousedown', { bubbles: true }) as unknown as Event);
    el.dispatchEvent(new ME('click', { bubbles: true }) as unknown as Event);
  };

  return { game, w: w as Harness['w'], doc, frames, keyDown, keyUp, tapKey, click, sleep };
}

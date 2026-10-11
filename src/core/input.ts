/** Keyboard + mouse input manager with pointer-lock support. */

export class Input {
  keys = new Set<string>();
  pressed = new Set<string>(); // keys pressed this frame (consumed per frame)
  mouseDX = 0;
  mouseDY = 0;
  clickedThisFrame = false;
  pointerLocked = false;
  /** When true, gameplay keys are ignored (dialogue/UI in control). */
  muted = false;

  private canvas: HTMLCanvasElement;
  private onLockChange?: (locked: boolean) => void;
  private onAnyKey?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  setLockListener(cb: (locked: boolean) => void) { this.onLockChange = cb; }
  setAnyKeyListener(cb: () => void) { this.onAnyKey = cb; }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Tab' || e.code === 'Space') e.preventDefault();
    if (this.keys.has(e.code)) return; // ignore auto-repeat for pressed set
    this.keys.add(e.code);
    this.pressed.add(e.code);
    this.onAnyKey?.();
  };

  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.code); };
  private onBlur = () => { this.keys.clear(); };

  private dragging = false;
  private dragMoved = false;
  private lastX = 0;
  private lastY = 0;
  private downX = 0;
  private downY = 0;

  private onMouseMove = (e: MouseEvent) => {
    if (this.pointerLocked) {
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
      return;
    }
    // Fallback: drag-to-look when pointer lock is unavailable (e.g. iframes)
    if (this.dragging) {
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      if (Math.abs(e.clientX - this.downX) + Math.abs(e.clientY - this.downY) > 6) this.dragMoved = true;
      if (this.dragMoved) {
        this.mouseDX += dx;
        this.mouseDY += dy;
      }
    }
  };

  private onMouseDown = (e: MouseEvent) => {
    this.onAnyKey?.();
    if (this.pointerLocked) {
      this.clickedThisFrame = true;
      return;
    }
    this.dragging = true;
    this.dragMoved = false;
    this.downX = this.lastX = e.clientX;
    this.downY = this.lastY = e.clientY;
  };

  private onMouseUp = (_e: MouseEvent) => {
    if (this.dragging) {
      this.dragging = false;
      // A press without movement counts as a click (dialogue advance, etc.)
      if (!this.dragMoved) this.clickedThisFrame = true;
    }
  };

  private onPointerLockChange = () => {
    this.pointerLocked = document.pointerLockElement === this.canvas;
    this.onLockChange?.(this.pointerLocked);
  };

  requestLock() {
    if (!this.pointerLocked) {
      try { this.canvas.requestPointerLock(); } catch { /* ignore */ }
    }
  }
  releaseLock() {
    if (this.pointerLocked) document.exitPointerLock();
  }

  down(code: string) { return !this.muted && this.keys.has(code); }
  /** Consumable single press. */
  hit(code: string) {
    if (!this.pressed.has(code)) return false;
    this.pressed.delete(code);
    return true;
  }
  consumeClick() {
    const c = this.clickedThisFrame;
    this.clickedThisFrame = false;
    return c;
  }

  endFrame() {
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.clickedThisFrame = false;
    this.pressed.clear();
  }
}

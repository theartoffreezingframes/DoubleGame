/** Third-person Akshay controller: movement, collision, camera orbit, animation. */
import * as THREE from 'three';
import { CollisionWorld } from '../core/collision.ts';
import { Input } from '../core/input.ts';
import { AudioBus } from '../core/audio.ts';
import { animateHumanoid, createHumanoid, type Humanoid, turnToward, yawOf } from './humanoid.ts';

export class Player {
  readonly pos = new THREE.Vector3();
  yaw = 0; // facing
  camYaw = 0;
  camPitch = 0.32;
  vel = new THREE.Vector3();
  grounded = true;

  humanoid: Humanoid;
  /** Set false during dialogues/cinematics. */
  controlEnabled = true;

  private radius = 0.34;
  private height = 1.72;
  private stepTimer = 0;
  private idleTime = 0;

  constructor(
    private world: CollisionWorld,
    private input: Input,
    private audio: AudioBus,
    scene: THREE.Scene,
    spawn: { x: number; y: number; z: number; yaw: number },
  ) {
    this.humanoid = createHumanoid({
      skin: 0xb9895f,
      shirt: 0x345c8f, // crisp bank-blue shirt
      pants: 0x2a2d36,
      hair: 0x1a1512,
      accent: 0xe8b93c, // tie
    });
    scene.add(this.humanoid.group);
    this.pos.set(spawn.x, spawn.y, spawn.z);
    this.yaw = spawn.yaw;
    this.humanoid.facing = spawn.yaw;
    this.camYaw = spawn.yaw + Math.PI; // camera behind, looking toward the street
    this.syncMesh();
  }

  setControl(on: boolean) { this.controlEnabled = on; }

  teleport(x: number, y: number, z: number, yaw?: number) {
    this.pos.set(x, y, z);
    if (yaw !== undefined) {
      this.yaw = yaw;
      this.humanoid.facing = yaw;
      this.camYaw = yaw + Math.PI;
    }
    this.vel.set(0, 0, 0);
    this.syncMesh();
  }

  update(dt: number) {
    const i = this.input;
    let moveX = 0, moveZ = 0;
    const sprint = i.down('ShiftLeft') || i.down('ShiftRight');

    if (this.controlEnabled) {
      // Camera
      this.camYaw -= i.mouseDX * 0.0026;
      this.camPitch += i.mouseDY * 0.0022;
      this.camPitch = Math.max(-0.12, Math.min(0.95, this.camPitch));

      if (i.down('KeyW')) moveZ += 1;
      if (i.down('KeyS')) moveZ -= 1;
      if (i.down('KeyA')) moveX -= 1;
      if (i.down('KeyD')) moveX += 1;

      if (this.grounded && i.hit('Space')) {
        this.vel.y = 6.1;
        this.grounded = false;
      }
    }

    const len = Math.hypot(moveX, moveZ);
    const speed = sprint ? 5.7 : 3.3;
    if (len > 0) {
      moveX /= len; moveZ /= len;
      // Rotate by camera yaw: forward = -Z rotated by camYaw
      const sin = Math.sin(this.camYaw), cos = Math.cos(this.camYaw);
      const wx = moveX * cos - moveZ * sin;
      const wz = -moveX * sin - moveZ * cos;
      const target = new THREE.Vector3(wx, 0, wz).multiplyScalar(speed);
      const accel = this.grounded ? 14 : 4;
      this.vel.x += (target.x - this.vel.x) * Math.min(1, dt * accel);
      this.vel.z += (target.z - this.vel.z) * Math.min(1, dt * accel);
      this.idleTime = 0;
    } else {
      const damp = Math.min(1, dt * (this.grounded ? 12 : 2));
      this.vel.x -= this.vel.x * damp;
      this.vel.z -= this.vel.z * damp;
      this.idleTime += dt;
    }

    // Gravity
    this.vel.y -= 21 * dt;
    if (this.vel.y < -30) this.vel.y = -30;

    // Integrate + collide
    const p = { x: this.pos.x + this.vel.x * dt, y: this.pos.y + this.vel.y * dt, z: this.pos.z + this.vel.z * dt };
    const wasFalling = this.vel.y < -0.1;
    this.grounded = this.world.moveAndSlide(p, this.radius, this.height);
    // Horizontal block feedback
    if (this.grounded && wasFalling) this.vel.y = 0;
    else if (p.y !== this.pos.y + this.vel.y * dt && this.vel.y < 0) this.vel.y = 0;
    if (Math.abs(p.x - (this.pos.x + this.vel.x * dt)) > 0.001) this.vel.x = 0;
    if (Math.abs(p.z - (this.pos.z + this.vel.z * dt)) > 0.001) this.vel.z = 0;
    this.pos.set(p.x, p.y, p.z);

    // Keep inside playable bounds
    this.pos.x = Math.max(-115, Math.min(115, this.pos.x));
    this.pos.z = Math.max(-9.6, Math.min(24.5, this.pos.z));

    // Footsteps
    const hSpeed = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded && hSpeed > 0.6) {
      this.stepTimer -= dt * hSpeed;
      if (this.stepTimer <= 0) {
        this.audio.footstep(hSpeed > 4.5);
        this.stepTimer = 1.9;
      }
    }

    // Facing
    if (hSpeed > 0.4) {
      turnToward(this.humanoid, yawOf(this.vel.x, this.vel.z), dt);
    } else if (this.idleTime > 0.6) {
      // Face camera direction while idle (cinematic default)
      turnToward(this.humanoid, this.camYaw + Math.PI, dt, 4);
    }
    animateHumanoid(this.humanoid, dt, Math.min(1, hSpeed / 5.5), hSpeed > 0.4);
    this.syncMesh();
    this.updateCamera();
  }

  private syncMesh() {
    this.humanoid.group.position.copy(this.pos);
  }

  private computeCameraTargets(): { pos: THREE.Vector3; look: THREE.Vector3 } {
    const target = new THREE.Vector3(this.pos.x, this.pos.y + 1.5, this.pos.z);
    const dist = 3.4;
    const dir = new THREE.Vector3(
      Math.sin(this.camYaw) * Math.cos(this.camPitch),
      Math.sin(this.camPitch),
      Math.cos(this.camYaw) * Math.cos(this.camPitch),
    );
    // Camera collision against world geometry
    const maxDist = this.world.raycast(target, dir, dist);
    const d = Math.max(0.6, maxDist - 0.22);
    const pos = target.clone().add(dir.clone().multiplyScalar(d));
    return { pos, look: target };
  }

  private updateCamera() {
    const { pos, look } = this.computeCameraTargets();
    if (!this._camInited) {
      this._camTarget.copy(pos);
      this._camInited = true;
    }
    this._camTarget.copy(pos);
    this._lookTarget.copy(look);
  }

  private _camTarget = new THREE.Vector3();
  private _lookTarget = new THREE.Vector3();
  private _camInited = false;

  /** Apply smoothed camera to the real camera. Called by Game with the engine camera. */
  applyCamera(camera: THREE.PerspectiveCamera, dt: number) {
    const k = 1 - Math.exp(-16 * dt);
    camera.position.lerp(this._camTarget, k);
    camera.lookAt(this._lookTarget);
  }

  /** Snap camera instantly (used after teleport / save-load). */
  snapCamera(camera: THREE.PerspectiveCamera) {
    const { pos, look } = this.computeCameraTargets();
    this._camTarget.copy(pos);
    this._lookTarget.copy(look);
    this._camInited = true;
    camera.position.copy(pos);
    camera.lookAt(look);
  }
}

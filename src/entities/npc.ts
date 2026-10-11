/** NPCs: standing characters, ambient pedestrians, walk-along companions. */
import * as THREE from 'three';
import { animateHumanoid, createHumanoid, type Humanoid, turnToward, yawOf } from './humanoid.ts';

export type NpcBehavior = 'stand' | 'wander';

export class Npc {
  humanoid: Humanoid;
  pos: THREE.Vector3;
  behavior: NpcBehavior;
  speed = 1.5;
  enabled = true;

  // wander state
  private wanderMin = 0;
  private wanderMax = 0;
  private wanderDir = 1;
  private wanderPause = 0;
  private faceYaw: number | null = null;
  private lookAtPoint: THREE.Vector3 | null = null;

  constructor(
    scene: THREE.Scene,
    cfg: { skin: number; shirt: number; pants: number; hair: number; accent?: number },
    x: number, y: number, z: number,
    behavior: NpcBehavior = 'stand',
    facing = 0,
  ) {
    this.humanoid = createHumanoid(cfg);
    this.pos = new THREE.Vector3(x, y, z);
    this.behavior = behavior;
    this.humanoid.facing = facing;
    this.humanoid.group.rotation.y = facing;
    this.humanoid.group.position.copy(this.pos);
    scene.add(this.humanoid.group);
  }

  setWanderRange(minX: number, maxX: number, z: number) {
    this.wanderMin = minX;
    this.wanderMax = maxX;
    this.pos.z = z;
    this.wanderDir = Math.random() < 0.5 ? 1 : -1;
  }

  /** Force-look at a world point (dialogue). Null clears. */
  lookAt(p: THREE.Vector3 | null) {
    this.lookAtPoint = p ? p.clone() : null;
  }

  /** Walk toward a point; returns true when within arriveDist. */
  walkToward(target: THREE.Vector3, dt: number, arriveDist = 0.35): boolean {
    const dx = target.x - this.pos.x;
    const dz = target.z - this.pos.z;
    const d = Math.hypot(dx, dz);
    if (d < arriveDist) return true;
    const s = Math.min(this.speed, d / dt) * dt;
    this.pos.x += (dx / d) * s;
    this.pos.z += (dz / d) * s;
    turnToward(this.humanoid, yawOf(dx, dz), dt);
    animateHumanoid(this.humanoid, dt, 0.45, true);
    this.humanoid.group.position.copy(this.pos);
    return false;
  }

  /** Sit her on a stool (Keerthy at the café). */
  sit() {
    this.humanoid.group.position.set(this.pos.x, this.pos.y - 0.38, this.pos.z);
    const P = this.humanoid.parts;
    P.lLeg.rotation.x = -1.35;
    P.rLeg.rotation.x = -1.35;
    P.lArm.rotation.x = -0.55;
    P.rArm.rotation.x = -0.6;
    P.torso.rotation.x = 0.06;
    // Keep sketching hand motion going
    (this as unknown as { seated: boolean }).seated = true;
  }

  stand() {
    (this as unknown as { seated: boolean }).seated = false;
    this.humanoid.group.position.set(this.pos.x, this.pos.y, this.pos.z);
  }

  update(dt: number) {
    if (!this.enabled) return;
    const seated = (this as unknown as { seated?: boolean }).seated;

    if (seated) {
      // Idle sketching motion
      const P = this.humanoid.parts;
      P.rArm.rotation.x = -0.6 + Math.sin(performance.now() / 320) * 0.08;
      P.head.rotation.y = Math.sin(performance.now() / 1400) * 0.1;
      this.humanoid.group.rotation.y = this.humanoid.facing;
      return;
    }

    if (this.behavior === 'wander') {
      if (this.wanderPause > 0) {
        this.wanderPause -= dt;
        animateHumanoid(this.humanoid, dt, 0, false);
        this.humanoid.group.position.copy(this.pos);
        return;
      }
      this.pos.x += this.wanderDir * this.speed * dt;
      if (this.pos.x > this.wanderMax) { this.pos.x = this.wanderMax; this.wanderDir = -1; this.wanderPause = 1 + Math.random() * 3; }
      if (this.pos.x < this.wanderMin) { this.pos.x = this.wanderMin; this.wanderDir = 1; this.wanderPause = 1 + Math.random() * 3; }
      turnToward(this.humanoid, this.wanderDir > 0 ? Math.PI / 2 : -Math.PI / 2, dt);
      animateHumanoid(this.humanoid, dt, 0.4, true);
      this.humanoid.group.position.copy(this.pos);
      return;
    }

    // Standing
    if (this.lookAtPoint) {
      const dx = this.lookAtPoint.x - this.pos.x;
      const dz = this.lookAtPoint.z - this.pos.z;
      if (Math.hypot(dx, dz) > 0.01) turnToward(this.humanoid, yawOf(dx, dz), dt, 7);
    } else if (this.faceYaw !== null) {
      turnToward(this.humanoid, this.faceYaw, dt, 7);
    }
    animateHumanoid(this.humanoid, dt, 0, false);
    this.humanoid.group.position.copy(this.pos);
  }

  setStandingYaw(yaw: number) {
    this.faceYaw = yaw;
  }
}

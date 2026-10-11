/** Stylized low-poly humans built from primitives, with procedural animation. */
import * as THREE from 'three';

export interface HumanoidConfig {
  skin: number;
  shirt: number;
  pants: number;
  hair: number;
  accent?: number; // scarf/dupatta/tie
}

export interface Humanoid {
  group: THREE.Group;
  parts: {
    torso: THREE.Mesh;
    head: THREE.Group;
    lArm: THREE.Mesh;
    rArm: THREE.Mesh;
    lLeg: THREE.Mesh;
    rLeg: THREE.Mesh;
  };
  /** Walk-cycle phase accumulator. */
  phase: number;
  /** Smoothed orientation (radians around Y). 0 = facing +Z. */
  facing: number;
}

const HIPS = 0.86;

export function createHumanoid(cfg: HumanoidConfig): Humanoid {
  const group = new THREE.Group();
  const mat = (c: number) => new THREE.MeshLambertMaterial({ color: c });
  const skin = mat(cfg.skin);
  const shirt = mat(cfg.shirt);
  const pants = mat(cfg.pants);
  const hair = mat(cfg.hair);

  const mesh = (geo: THREE.BufferGeometry, m: THREE.Material) => {
    const mm = new THREE.Mesh(geo, m);
    mm.castShadow = true;
    return mm;
  };

  // Torso (pivots at hips)
  const torso = mesh(new THREE.BoxGeometry(0.4, 0.56, 0.22), shirt);
  torso.position.set(0, HIPS + 0.28, 0);
  group.add(torso);

  // Accent band (tie/scarf)
  if (cfg.accent !== undefined) {
    const band = mesh(new THREE.BoxGeometry(0.42, 0.09, 0.24), mat(cfg.accent));
    band.position.set(0, HIPS + 0.5, 0);
    group.add(band);
  }

  // Head group (neck pivot)
  const headG = new THREE.Group();
  headG.position.set(0, HIPS + 0.62, 0);
  const skull = mesh(new THREE.BoxGeometry(0.24, 0.26, 0.24), skin);
  skull.position.y = 0.16;
  const hairM = mesh(new THREE.BoxGeometry(0.26, 0.09, 0.26), hair);
  hairM.position.y = 0.305;
  headG.add(skull, hairM);
  group.add(headG);

  // Arms (pivot at shoulder)
  const mkArm = (side: number) => {
    const arm = mesh(new THREE.BoxGeometry(0.11, 0.6, 0.12), shirt);
    arm.geometry.translate(0, -0.3, 0);
    arm.position.set(side * 0.265, HIPS + 0.54, 0);
    group.add(arm);
    return arm;
  };
  const lArm = mkArm(-1);
  const rArm = mkArm(1);

  // Legs (pivot at hip)
  const mkLeg = (side: number) => {
    const leg = mesh(new THREE.BoxGeometry(0.14, HIPS, 0.15), pants);
    leg.geometry.translate(0, -HIPS / 2, 0);
    leg.position.set(side * 0.1, HIPS, 0);
    group.add(leg);
    return leg;
  };
  const lLeg = mkLeg(-1);
  const rLeg = mkLeg(1);

  return { group, parts: { torso, head: headG, lArm, rArm, lLeg, rLeg }, phase: 0, facing: 0 };
}

/**
 * Advance animation. `speed01` in [0,1] (0 idle, 1 sprint).
 * `dt` seconds; `walking` false → ease to idle pose.
 */
export function animateHumanoid(h: Humanoid, dt: number, speed01: number, walking: boolean) {
  if (walking && speed01 > 0.01) {
    h.phase += dt * (4.2 + 6.5 * speed01);
  }
  const swing = walking ? Math.sin(h.phase) * (0.28 + 0.42 * speed01) : 0;
  const damp = Math.min(1, dt * 12);
  const P = h.parts;

  P.lLeg.rotation.x += (swing - P.lLeg.rotation.x) * damp;
  P.rLeg.rotation.x += (-swing - P.rLeg.rotation.x) * damp;
  P.lArm.rotation.x += (-swing * 0.85 - P.lArm.rotation.x) * damp;
  P.rArm.rotation.x += (swing * 0.85 - P.rArm.rotation.x) * damp;

  // Subtle torso bob + head sway while moving; breathing at idle.
  const bob = walking ? Math.abs(Math.cos(h.phase)) * 0.035 * speed01 : Math.sin(performance.now() / 900) * 0.008;
  P.torso.position.y = HIPS + 0.28 + bob;
  P.head.rotation.y = walking ? Math.sin(h.phase * 0.5) * 0.06 : Math.sin(performance.now() / 1600) * 0.05;
}

/** Rotate smoothly toward a target yaw. */
export function turnToward(h: Humanoid, targetYaw: number, dt: number, rate = 10) {
  let d = targetYaw - h.facing;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  h.facing += d * Math.min(1, dt * rate);
  h.group.rotation.y = h.facing;
}

export function yawOf(dx: number, dz: number): number {
  return Math.atan2(dx, dz);
}

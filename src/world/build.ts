/**
 * Milestone 1 world: Street One (compact fictionalized Hyderabad),
 * Janapriya Bank interior, Charminar Chai Co., the plaza mural,
 * Akshay's apartment block and dressing props.
 */
import * as THREE from 'three';
import { CollisionWorld } from '../core/collision.ts';
import { makeSignTexture, seededRand } from '../core/engine.ts';

export interface WorldRefs {
  spawn: { x: number; y: number; z: number; yaw: number };
  keerthySeat: { x: number; z: number; facing: number };
  walkWaypoints: Array<{ x: number; z: number }>;
  muralPos: { x: number; z: number };
  sedan: THREE.Group;
  loopCars: Array<{ group: THREE.Group; dir: number; speed: number; minX: number; maxX: number }>;
  pedestrianPaths: Array<{ minX: number; maxX: number; z: number }>;
}

export interface InteractableDef {
  id: string;
  x: number;
  z: number;
  radius: number;
  label: string;
}

export interface BuildResult {
  refs: WorldRefs;
  interactables: InteractableDef[];
  colliders: CollisionWorld;
}

function lambert(color: number, opts: { emissive?: number; emissiveIntensity?: number } = {}) {
  return new THREE.MeshLambertMaterial({
    color,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
  });
}

export function buildWorld(scene: THREE.Scene, cw: CollisionWorld): BuildResult {
  const rand = seededRand(20261011);

  /* ---------- helpers ---------- */
  const box = (
    w: number, h: number, d: number,
    x: number, yBase: number, z: number,
    color: number,
    opts: { collide?: boolean; rough?: never; emissive?: number; shadow?: boolean; opacity?: number } = {},
  ) => {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      opts.opacity !== undefined
        ? new THREE.MeshLambertMaterial({ color, transparent: true, opacity: opts.opacity })
        : lambert(color, { emissive: opts.emissive }),
    );
    m.position.set(x, yBase + h / 2, z);
    m.castShadow = opts.shadow !== false;
    m.receiveShadow = true;
    scene.add(m);
    if (opts.collide !== false) {
      cw.addBox(x - w / 2, yBase, z - d / 2, x + w / 2, yBase + h, z + d / 2);
    }
    return m;
  };

  const facadeTex = (base: string, rows: number, cols: number) => {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 512;
    const g = cv.getContext('2d')!;
    g.fillStyle = base;
    g.fillRect(0, 0, 512, 512);
    const rnd = seededRand(rows * 100 + cols);
    const cw2 = 512 / cols, ch = 512 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = rnd() < 0.28;
        g.fillStyle = lit ? '#f7d98c' : '#22303f';
        g.fillRect(c * cw2 + cw2 * 0.22, r * ch + ch * 0.18, cw2 * 0.56, ch * 0.5);
        g.strokeStyle = 'rgba(0,0,0,0.35)';
        g.strokeRect(c * cw2 + cw2 * 0.22, r * ch + ch * 0.18, cw2 * 0.56, ch * 0.5);
      }
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };

  const block = (x1: number, x2: number, z1: number, z2: number, h: number, color: number, rows: number, cols: number) => {
    const w = x2 - x1, d = z2 - z1;
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      [
        lambert(color), lambert(color),
        lambert(color), lambert(color),
        new THREE.MeshLambertMaterial({ map: facadeTex('#' + color.toString(16).padStart(6, '0'), rows, cols) }),
        lambert(color),
      ],
    );
    m.position.set((x1 + x2) / 2, h / 2, (z1 + z2) / 2);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    cw.addBox(x1, 0, z1, x2, h, z2);
  };

  /* ---------- ground & road ---------- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, 220), lambert(0x9a8f7a));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  // Road
  box(240, 0.06, 12, 0, 0, 0, 0x3d4045, { collide: false, shadow: false });
  // Lane dashes
  for (let x = -116; x < 118; x += 6) {
    box(2.4, 0.02, 0.28, x, 0.06, 0, 0xd8d2c0, { collide: false, shadow: false });
  }
  // Sidewalks (collidable, 0.15 high)
  box(240, 0.15, 4, 0, 0, 8, 0xb3a893);
  box(240, 0.15, 4, 0, 0, -8, 0xb3a893);
  // Curbs visual trim
  box(240, 0.16, 0.25, 0, 0, 6.05, 0xcfc6b2, { collide: false });
  box(240, 0.16, 0.25, 0, 0, -6.05, 0xcfc6b2, { collide: false });

  /* ---------- Akshay's apartment (west) ---------- */
  block(-58, -44, 10.5, 21, 9.5, 0x8f6f52, 4, 5);
  box(3, 4.2, 0.5, -48, 0, 10.4, 0x5a4634); // door frame
  box(1.6, 2.6, 0.2, -48, 0, 10.25, 0x2f2418); // door
  const aptSign = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 1.1),
    new THREE.MeshBasicMaterial({ map: makeSignTexture('NILAYA NIVAS', { bg: '#3a2e22', fg: '#e8d9b8', sub: 'apartments', accent: '#c8a860' }) }),
  );
  aptSign.position.set(-48, 5.2, 10.55);
  aptSign.rotation.y = Math.PI;
  scene.add(aptSign);

  /* ---------- shops between apartment and bank ---------- */
  block(-42, -30, 10.5, 19, 7.5, 0x7d8a93, 3, 4);
  block(-28.5, -15, 10.5, 19, 8.5, 0xa58d6f, 3, 4);
  const shopSign1 = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 1.6),
    new THREE.MeshBasicMaterial({ map: makeSignTexture('RAMESH GENERAL STORE', { bg: '#1d3a2f', fg: '#f2e7c8', accent: '#e8b93c' }) }),
  );
  shopSign1.position.set(-36, 4.6, 10.52);
  shopSign1.rotation.y = Math.PI;
  scene.add(shopSign1);
  const shopSign2 = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 1.6),
    new THREE.MeshBasicMaterial({ map: makeSignTexture('SRI LAXMI JEWELLERS', { bg: '#401f28', fg: '#f4d98a', accent: '#e8b93c' }) }),
  );
  shopSign2.position.set(-21.5, 4.9, 10.52);
  shopSign2.rotation.y = Math.PI;
  scene.add(shopSign2);

  /* ---------- JANAPRIYA BANK ---------- */
  const bankFloor = box(26, 0.15, 16, 0, 0, 18, 0xcfc3ad);
  bankFloor.receiveShadow = true;
  // Facade (door gap x -1.6..1.6)
  box(11.4, 4.6, 0.5, -7.3, 0, 10.2, 0xd8cfc0);
  box(11.4, 4.6, 0.5, 7.3, 0, 10.2, 0xd8cfc0);
  box(3.2, 1.1, 0.5, 0, 3.5, 10.2, 0xd8cfc0); // lintel
  // Side walls
  box(0.5, 4.6, 16, -12.75, 0, 18, 0xcfc5b2);
  box(0.5, 4.6, 16, 12.75, 0, 18, 0xcfc5b2);
  // Back wall
  box(26, 4.6, 0.5, 0, 0, 25.8, 0xcfc5b2);
  // Roof slab
  box(26, 0.3, 16, 0, 4.6, 18, 0xb9ac97);
  // Sign above door
  const bankSign = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 2),
    new THREE.MeshBasicMaterial({ map: makeSignTexture('JANAPRIYA BANK', { bg: '#0f2233', fg: '#f4d98a', sub: 'est. 1962 — trust, counted daily', accent: '#e8b93c' }) }),
  );
  bankSign.position.set(0, 4.05, 9.9);
  bankSign.rotation.y = Math.PI;
  scene.add(bankSign);
  // Awning over door
  box(5, 0.12, 1.8, 0, 3.3, 9.4, 0x23544a, { collide: false });

  // Interior: teller counter
  box(7, 1.1, 0.9, -6.5, 0.15, 14.2, 0x6e4a2f);
  box(7, 0.08, 1.1, -6.5, 1.25, 14.2, 0x8a6a45, { collide: false });
  // Tiller back shelves
  box(7, 2.6, 0.35, -6.5, 0.15, 16.4, 0x54381f);
  // Queue stanchions
  for (const sx of [-9, -7, -5, -3]) {
    box(0.12, 0.95, 0.12, sx, 0.15, 12.2, 0xb8a24c, { collide: false, shadow: false });
  }
  // Akshay's desk + monitor
  box(1.6, 0.78, 1.05, 3.5, 0.15, 14.9, 0x7a5636);
  box(0.62, 0.42, 0.06, 3.5, 1.05, 14.7, 0x101820, { collide: false, emissive: 0x1d3a5f, shadow: false });
  box(0.14, 0.12, 0.14, 3.5, 0.93, 14.75, 0x333333, { collide: false, shadow: false });
  // Nameplate
  const namePlate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.16),
    new THREE.MeshBasicMaterial({ map: makeSignTexture('AKSHAY', { w: 256, h: 64, bg: '#2a2318', fg: '#e8d9b8' }) }),
  );
  namePlate.position.set(3.5, 0.98, 15.46);
  scene.add(namePlate);
  // Chair
  box(0.5, 0.5, 0.5, 3.5, 0.15, 16.1, 0x33415a, { collide: false });

  // Printer table + tray
  box(1.1, 0.75, 0.7, -1.5, 0.15, 13.5, 0x7a5636);
  box(0.5, 0.3, 0.4, -1.5, 0.9, 13.5, 0xd8d8d8, { collide: false, shadow: false });
  // The discarded slip — tiny bright paper
  const slipMesh = box(0.16, 0.02, 0.24, -1.38, 1.21, 13.62, 0xfff6dc, { collide: false, shadow: false, emissive: 0x8a7a40 });

  // Manager cabin (glass)
  const glass = 0x9fc4d8;
  box(0.12, 3.1, 4.4, 8.06, 0.15, 22.2, glass, { opacity: 0.32 });
  box(0.12, 3.1, 4.4, 12.34, 0.15, 22.2, glass, { opacity: 0.32 });
  box(4.4, 3.1, 0.12, 10.2, 0.15, 24.34, glass, { opacity: 0.32 });
  // front wall with door gap x 9.6..10.8
  box(1.54, 3.1, 0.12, 8.83, 0.15, 20.06, glass, { opacity: 0.32 });
  box(1.54, 3.1, 0.12, 11.57, 0.15, 20.06, glass, { opacity: 0.32 });
  box(4.4, 0.5, 0.12, 10.2, 2.75, 20.06, glass, { opacity: 0.32 });
  // Rao's desk
  box(1.9, 0.76, 0.9, 10.2, 0.15, 23.2, 0x5a3d22);
  box(0.5, 0.5, 0.5, 10.2, 0.15, 24.0, 0x33415a, { collide: false });

  // Server rack + IT corner
  box(1.5, 2.1, 0.9, -11.5, 0.15, 22.4, 0x23283a);
  box(1.3, 0.16, 0.06, -11.5, 1.6, 21.93, 0x3ee08a, { collide: false, emissive: 0x3ee08a, shadow: false });
  box(1.3, 0.16, 0.06, -11.5, 1.2, 21.93, 0xe0b23e, { collide: false, emissive: 0xe0b23e, shadow: false });
  box(1.3, 0.16, 0.06, -11.5, 0.8, 21.93, 0x3ee08a, { collide: false, emissive: 0x3ee08a, shadow: false });
  // Naveen's stool + toolbox
  box(0.45, 0.45, 0.45, -9.9, 0.15, 21.6, 0x33415a, { collide: false });

  // Plants
  for (const [px, pz] of [[-12, 12], [12, 12], [6, 24.5], [-12, 24.5]] as const) {
    box(0.5, 0.4, 0.5, px, 0.15, pz, 0x6e4a2f, { collide: false });
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 7), lambert(0x3f7f46));
    leaves.position.set(px, 1.25, pz);
    leaves.castShadow = true;
    scene.add(leaves);
  }
  // Bank interior light
  const bankLight = new THREE.PointLight(0xffe6c0, 26, 24, 1.8);
  bankLight.position.set(0, 3.9, 17.5);
  scene.add(bankLight);

  /* ---------- CAFÉ ---------- */
  const cafeFloor = box(14, 0.15, 9, 31, 0, 14.5, 0xb9a184);
  cafeFloor.receiveShadow = true;
  box(6, 3.8, 0.4, 27, 0, 10.2, 0x8a5a3b);
  box(6, 3.8, 0.4, 35, 0, 10.2, 0x8a5a3b);
  box(2, 0.9, 0.4, 31, 2.9, 10.2, 0x8a5a3b);
  box(0.4, 3.8, 9, 24.2, 0, 14.5, 0x8a5a3b);
  box(0.4, 3.8, 9, 37.8, 0, 14.5, 0x8a5a3b);
  box(14, 3.8, 0.4, 31, 0, 18.8, 0x8a5a3b);
  box(14, 0.25, 9, 31, 3.8, 14.5, 0x6e4530);
  // Counter
  box(3.4, 1.05, 1.2, 26.5, 0.15, 16.6, 0x54381f);
  box(0.5, 0.55, 0.4, 26.2, 1.2, 16.6, 0xc8c0b0, { collide: false, shadow: false }); // espresso machine
  const cafeSign = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 2.1),
    new THREE.MeshBasicMaterial({ map: makeSignTexture('CHARMINAR CHAI CO.', { bg: '#2a1a10', fg: '#f4d98a', sub: 'honest filter coffee since forever', accent: '#d98b2b' }) }),
  );
  cafeSign.position.set(31, 3.35, 9.95);
  cafeSign.rotation.y = Math.PI;
  scene.add(cafeSign);
  // Awning
  box(13.5, 0.1, 2.2, 31, 3.0, 9.2, 0xb04a2f, { collide: false });
  const cafeLight = new THREE.PointLight(0xffd9a0, 18, 18, 1.8);
  cafeLight.position.set(31, 3.2, 14.5);
  scene.add(cafeLight);

  // Outdoor tables on the sidewalk (Keerthy's is the east one)
  for (const [tx, tz] of [[27.5, 8.2], [33, 8.2]] as const) {
    box(1.15, 0.72, 1.15, tx, 0.15, tz, 0x6e4a2f);
    box(1.3, 0.05, 1.3, tx, 0.9, tz, 0x8a6a45, { collide: false });
    // stools
    box(0.35, 0.45, 0.35, tx - 0.85, 0.15, tz, 0x33415a, { collide: false });
    box(0.35, 0.45, 0.35, tx + 0.85, 0.15, tz, 0x33415a, { collide: false });
  }
  // Keerthy's sketchbook (visible on her table)
  box(0.3, 0.03, 0.42, 33.1, 0.95, 8.1, 0xf0e6cf, { collide: false, shadow: false });

  /* ---------- PLAZA & MURAL ---------- */
  box(24, 0.12, 22, 58, 0, 9, 0xc2b091);
  // Fountain
  const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.7, 0.55, 24), lambert(0x9a8f7f));
  fountainBase.position.set(58, 0.4, 9);
  fountainBase.castShadow = true;
  scene.add(fountainBase);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.3, 24), lambert(0x3f9fb8, { emissive: 0x1d5a6e }));
  water.position.set(58, 0.62, 9);
  scene.add(water);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 1.6, 12), lambert(0x9a8f7f));
  spire.position.set(58, 1.3, 9);
  scene.add(spire);
  cw.addBox(55.4, 0, 6.4, 60.6, 0.9, 11.6);
  // Benches
  box(2, 0.45, 0.6, 52, 0.12, 3.2, 0x6e4a2f, { collide: false });
  box(2, 0.45, 0.6, 64, 0.12, 3.2, 0x6e4a2f, { collide: false });

  // Mural wall
  const muralCv = document.createElement('canvas');
  muralCv.width = 1024; muralCv.height = 256;
  {
    const g = muralCv.getContext('2d')!;
    g.fillStyle = '#1d2a44';
    g.fillRect(0, 0, 1024, 256);
    // money side
    for (let i = 0; i < 12; i++) {
      g.fillStyle = i % 2 ? '#e8b93c' : '#c8922c';
      g.beginPath();
      g.arc(60 + i * 34, 90 + Math.sin(i) * 26, 15, 0, Math.PI * 2);
      g.fill();
    }
    // gold seam
    g.fillStyle = '#e8b93c';
    g.fillRect(508, 0, 8, 256);
    // people side
    for (let i = 0; i < 14; i++) {
      g.fillStyle = ['#d84f4f', '#2f8f83', '#e8e2cf', '#d98b2b'][i % 4];
      g.beginPath();
      g.arc(545 + i * 33, 108, 9, 0, Math.PI * 2);
      g.fill();
      g.fillRect(538 + i * 33, 117, 14, 44);
    }
    g.fillStyle = '#f2e7c8';
    g.font = 'bold 30px Georgia';
    g.textAlign = 'center';
    g.fillText('T W O   L E D G E R S', 512, 218);
    g.font = '16px Georgia';
    g.fillStyle = '#c8a860';
    g.fillText('— Kalpa Designs —', 512, 244);
  }
  const muralTex = new THREE.CanvasTexture(muralCv);
  muralTex.colorSpace = THREE.SRGBColorSpace;
  box(0.8, 4.4, 14.5, 66.9, 0, 9, 0x8a8272);
  const muralPlane = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), new THREE.MeshBasicMaterial({ map: muralTex }));
  muralPlane.position.set(66.45, 2.2, 9);
  muralPlane.rotation.y = -Math.PI / 2;
  scene.add(muralPlane);

  /* ---------- East blocks & north side dressing ---------- */
  block(40, 46, 10.5, 19, 7, 0x7d8a93, 3, 3);
  block(70, 96, 10.5, 21, 10, 0x937d6a, 4, 7);
  block(-120, -62, 10.5, 21, 8, 0x8a7d93, 3, 12);
  // North row
  block(-110, -80, -22, -11, 9, 0x87939d, 4, 8);
  block(-76, -46, -22, -11, 7.5, 0xa58d6f, 3, 8);
  block(-42, -10, -22, -11, 11, 0x7d8a93, 5, 8);
  block(-6, 30, -22, -11, 8.5, 0x8f6f52, 3, 10);
  block(34, 70, -22, -11, 10, 0x937d6a, 4, 9);
  block(74, 118, -22, -11, 7, 0x87939d, 3, 10);

  /* ---------- trees, lamps, bikes ---------- */
  const tree = (x: number, z: number) => {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.6, 7), lambert(0x6e4a2f));
    trunk.position.set(x, 0.95, z);
    trunk.castShadow = true;
    scene.add(trunk);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(1.15, 10, 8), lambert(0x4a7f3f));
    crown.position.set(x, 2.35, z);
    crown.castShadow = true;
    scene.add(crown);
    cw.addBox(x - 0.25, 0, z - 0.25, x + 0.25, 1.2, z + 0.25);
  };
  for (const [tx, tz] of [[-36, 9.4], [-22, 9.4], [20, 9.4], [42, 9.4], [-30, -9.4], [-4, -9.4], [26, -9.4], [54, -9.4], [80, 9.4]] as const) {
    tree(tx, tz);
  }

  const lamp = (x: number, z: number) => {
    box(0.14, 3.6, 0.14, x, 0.15, z, 0x3a4048, { collide: false });
    box(0.5, 0.18, 0.24, x, 3.7, z, 0xf7d98c, { collide: false, emissive: 0xf7d98c, shadow: false });
  };
  lamp(-38, 9.5); lamp(-14, 9.5); lamp(16, 9.5); lamp(44, 9.5);
  lamp(-26, -9.5); lamp(2, -9.5); lamp(34, -9.5); lamp(66, -9.5);

  const bike = (x: number, z: number, rot: number) => {
    const g = new THREE.Group();
    const w1 = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 8, 16), lambert(0x22252b));
    w1.position.set(-0.5, 0.34, 0);
    const w2 = w1.clone();
    w2.position.x = 0.5;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.08), lambert(0xd84f4f));
    frame.position.set(0, 0.62, 0);
    frame.rotation.z = -0.12;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.4), lambert(0x22252b));
    bar.position.set(0.44, 0.86, 0);
    g.add(w1, w2, frame, bar);
    g.position.set(x, 0.15, z);
    g.rotation.y = rot;
    g.traverse((o) => { o.castShadow = true; });
    scene.add(g);
    cw.addBox(x - 0.55, 0, z - 0.25, x + 0.55, 0.9, z + 0.25);
  };
  bike(-31, 9.3, 0.35);
  bike(18.5, 9.35, -0.5);

  /* ---------- parked cars ---------- */
  const makeCar = (color: number): THREE.Group => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.75, 1.7), lambert(color));
    body.position.y = 0.62;
    body.castShadow = true;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.62, 1.5), lambert(0x1d2430));
    cabin.position.set(-0.15, 1.28, 0);
    cabin.castShadow = true;
    g.add(body, cabin);
    for (const [wx, wz] of [[-1.25, 0.8], [1.25, 0.8], [-1.25, -0.8], [1.25, -0.8]] as const) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 12), lambert(0x16181d));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.33, wz);
      g.add(wheel);
    }
    return g;
  };
  const parkedColors = [0xd84f4f, 0xe8e2cf, 0x2f8f83, 0xd98b2b];
  parkedColors.forEach((c, i) => {
    const car = makeCar(c);
    car.position.set(-52 + i * 34, 0.02, -7.1);
    scene.add(car);
    cw.addBox(car.position.x - 2, 0, -8.05, car.position.x + 2, 1.2, -6.15);
  });

  /* ---------- looping traffic (decorative) ---------- */
  const loopCars: WorldRefs['loopCars'] = [];
  const car1 = makeCar(0x8a8f9c);
  car1.position.set(-40, 0.02, -3);
  scene.add(car1);
  loopCars.push({ group: car1, dir: 1, speed: 7.5, minX: -110, maxX: 110 });
  const car2 = makeCar(0xc8a860);
  car2.position.set(60, 0.02, 3);
  car2.rotation.y = Math.PI;
  scene.add(car2);
  loopCars.push({ group: car2, dir: -1, speed: 6.5, minX: -110, maxX: 110 });

  // The black sedan (hook cinematic)
  const sedan = makeCar(0x14161c);
  sedan.visible = false;
  sedan.position.set(95, 0.02, 3);
  sedan.rotation.y = Math.PI;
  scene.add(sedan);

  /* ---------- interactables & triggers ---------- */
  const interactables: InteractableDef[] = [
    { id: 'rao', x: 10.2, z: 21.0, radius: 2.6, label: 'Talk to Mr. Rao' },
    { id: 'meera', x: -6.5, z: 12.9, radius: 2.3, label: 'Talk to Meera' },
    { id: 'naveen', x: -10.4, z: 21.2, radius: 2.4, label: 'Talk to Naveen' },
    { id: 'terminal', x: 3.5, z: 16.0, radius: 1.9, label: 'Open reconciliation queue (JPC-07)' },
    { id: 'slip', x: -1.5, z: 14.6, radius: 1.7, label: 'Inspect the discarded remittance slip' },
    { id: 'keerthy', x: 33, z: 9.1, radius: 2.5, label: 'Talk to Keerthy' },
    { id: 'sketchbook', x: 33.1, z: 7.6, radius: 1.9, label: 'Look through the sketchbook' },
    { id: 'mural', x: 64.6, z: 9, radius: 2.8, label: 'Look at “Two Ledgers”' },
    { id: 'fountain', x: 58, z: 9, radius: 3.6, label: 'The plaza fountain' },
    { id: 'apartment', x: -48, z: 9.3, radius: 2.4, label: 'Your apartment' },
    { id: 'cafecounter', x: 26.5, z: 15.4, radius: 2.0, label: 'Order filter coffee' },
  ];

  cw.addTrigger('bank-entry', 0, 12.5, 2.8, () => undefined, true); // behavior attached in game
  cw.addTrigger('cafe-arrival', 31, 8.6, 4.5, () => undefined, false); // re-checkable; handler gates by phase
  cw.addTrigger('hook', 0, 12.8, 3.6, () => undefined, false); // re-checkable; handler gates by phase/flags

  // Pedestrian lanes
  const pedestrianPaths = [
    { minX: -70, maxX: 60, z: -8.6 },
    { minX: -40, maxX: 90, z: -9.2 },
    { minX: -90, maxX: 20, z: 6.5 }, // occasional south-side walker, clear of the café tables
  ];

  void slipMesh;

  return {
    refs: {
      spawn: { x: -46, y: 0.16, z: 7.8, yaw: Math.PI / 2 },
      keerthySeat: { x: 33.85, z: 8.2, facing: -Math.PI / 2 },
      walkWaypoints: [
        { x: 35.5, z: 9.2 },
        { x: 41, z: 8.6 },
        { x: 46.5, z: 9.2 },
        { x: 51, z: 13.2 },
        { x: 56, z: 13.8 },
        { x: 61, z: 12.6 },
        { x: 63.8, z: 10.6 },
      ],
      muralPos: { x: 64.6, z: 9 },
      sedan,
      loopCars,
      pedestrianPaths,
    },
    interactables,
    colliders: cw,
  };
}

/**
 * Lightweight collision world: static axis-aligned boxes + trigger zones.
 * Player is resolved as a vertical capsule approximated by a circle radius in XZ.
 * Deliberately simple and deterministic — reliability over flash.
 */

export interface AABB {
  minX: number; minY: number; minZ: number;
  maxX: number; maxY: number; maxZ: number;
  /** Pure decoration — no collision (e.g. thin trim). */
  ghost?: boolean;
}

export interface TriggerZone {
  id: string;
  x: number; z: number;
  radius: number;
  enabled: boolean;
  once: boolean;
  fired: boolean;
  onEnter: () => void;
}

export interface Vec3Like { x: number; y: number; z: number; }

export class CollisionWorld {
  boxes: AABB[] = [];
  triggers: TriggerZone[] = [];

  addBox(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number, ghost = false): AABB {
    const b = { minX, minY, minZ, maxX, maxY, maxZ, ghost };
    this.boxes.push(b);
    return b;
  }

  addTrigger(id: string, x: number, z: number, radius: number, onEnter: () => void, once = true): TriggerZone {
    const t: TriggerZone = { id, x, z, radius, enabled: true, once, fired: false, onEnter };
    this.triggers.push(t);
    return t;
  }

  getTrigger(id: string) { return this.triggers.find((t) => t.id === id); }

  /**
   * Move an entity with feet position `pos` (mutated), radius r, height h and vertical velocity vy.
   * Returns grounded flag. Handles auto-step up to `stepH`.
   */
  moveAndSlide(pos: Vec3Like, r: number, h: number, stepH = 0.36): boolean {
    let grounded = false;

    // --- X axis ---
    for (const b of this.boxes) {
      if (b.ghost) continue;
      if (!this.yOverlaps(b, pos.y + stepH, h)) continue;
      if (pos.z + r > b.minZ && pos.z - r < b.maxZ && pos.x > b.minX - r && pos.x < b.maxX + r) {
        // resolve along x by nearest face
        if (pos.x < (b.minX + b.maxX) / 2) pos.x = b.minX - r - 0.001;
        else pos.x = b.maxX + r + 0.001;
      }
    }
    // --- Z axis ---
    for (const b of this.boxes) {
      if (b.ghost) continue;
      if (!this.yOverlaps(b, pos.y + stepH, h)) continue;
      if (pos.x + r > b.minX && pos.x - r < b.maxX && pos.z > b.minZ - r && pos.z < b.maxZ + r) {
        if (pos.z < (b.minZ + b.maxZ) / 2) pos.z = b.minZ - r - 0.001;
        else pos.z = b.maxZ + r + 0.001;
      }
    }

    // --- Ground: find highest walkable surface under the player ---
    let floorY = 0;
    for (const b of this.boxes) {
      if (b.ghost) continue;
      if (pos.x + r * 0.6 > b.minX && pos.x - r * 0.6 < b.maxX && pos.z + r * 0.6 > b.minZ && pos.z - r * 0.6 < b.maxZ) {
        if (b.maxY <= pos.y + 0.5 && b.maxY > floorY) floorY = b.maxY;
      }
    }
    if (pos.y <= floorY + 0.001) {
      pos.y = floorY;
      grounded = true;
    } else {
      // keep the player from falling through thin floors when crossing the threshold
      if (pos.y < floorY) { pos.y = floorY; grounded = true; }
    }
    return grounded;
  }

  /** Returns closest collision distance along a ray from `from` toward `dir` (normalized), capped at maxDist. */
  raycast(from: Vec3Like, dir: Vec3Like, maxDist: number): number {
    let best = maxDist;
    for (const b of this.boxes) {
      if (b.ghost) continue;
      const t = this.rayBox(from, dir, b);
      if (t !== null && t < best && t > 0.001) best = t;
    }
    return best;
  }

  private rayBox(o: Vec3Like, d: Vec3Like, b: AABB): number | null {
    let tmin = -Infinity, tmax = Infinity;
    const axes: Array<[number, number, number]> = [
      [o.x, d.x, 0], [o.y, d.y, 1], [o.z, d.z, 2],
    ];
    for (const [ov, dv, i] of axes) {
      const mn = i === 0 ? b.minX : i === 1 ? b.minY : b.minZ;
      const mx = i === 0 ? b.maxX : i === 1 ? b.maxY : b.maxZ;
      if (Math.abs(dv) < 1e-8) {
        if (ov < mn || ov > mx) return null;
      } else {
        let t1 = (mn - ov) / dv;
        let t2 = (mx - ov) / dv;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return null;
      }
    }
    return tmin > 0 ? tmin : tmax > 0 ? 0 : null;
  }

  private yOverlaps(b: AABB, feetY: number, h: number): boolean {
    return b.maxY > feetY + 0.02 && b.minY < feetY + h;
  }

  distanceXZ(ax: number, az: number, bx: number, bz: number) {
    const dx = ax - bx, dz = az - bz;
    return Math.sqrt(dx * dx + dz * dz);
  }
}

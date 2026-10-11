/** Versioned local save/resume. localStorage-based for Milestone 1. */

export interface RelationshipSave {
  trust: number;
  closeness: number;
  suspicion: number;
  promises: Array<{ id: string; text: string; status: 'pending' | 'kept' | 'broken' }>;
  memories: string[];
  revelations: string[];
  keerthyBelieves: string[];
}

export interface InvestigationSave {
  found: string[];
  deduced: string[];
  attempts: number;
}

export interface SaveGame {
  v: number;
  savedAt: string;
  phase: string;
  walkIndex: number;
  clockMinutes: number;
  player: { x: number; y: number; z: number; yaw: number };
  keerthy: { x: number; z: number; facing: number; seated: boolean };
  flags: Record<string, boolean | string | number>;
  rel: RelationshipSave;
  inv: InvestigationSave;
  dialogueSeen: string[];
  missionComplete: boolean;
}

const KEY = 'doublegame.save';
export const SAVE_VERSION = 1;

export function writeSave(save: SaveGame): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function readSave(): SaveGame | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveGame;
    if (!parsed || parsed.v !== SAVE_VERSION) return null;
    if (typeof parsed.phase !== 'string' || !parsed.rel || !parsed.inv) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function hasSave(): boolean {
  return readSave() !== null;
}

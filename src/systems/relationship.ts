/**
 * Relationship state with Keerthy — pure logic, no rendering dependencies.
 * Not a single love meter: trust, closeness, suspicion, promises,
 * shared memories, revelations and Keerthy's current understanding are
 * tracked separately and drive dialogue selection and outcomes.
 */

export type PromiseStatus = 'pending' | 'kept' | 'broken';

export interface PromiseItem {
  id: string;
  text: string;
  status: PromiseStatus;
}

export interface RelationshipState {
  /** -100 .. 100. How much Keerthy believes Akshay's words. */
  trust: number;
  /** 0 .. 100. Emotional closeness built through shared time. */
  closeness: number;
  /** 0 .. 100. How suspicious she is about Akshay's behaviour/secrets. */
  suspicion: number;
  promises: PromiseItem[];
  memories: string[];
  /** Things Keerthy has learned about Akshay or the case. */
  revelations: string[];
  /** Keerthy's current understanding of Akshay's actions (grounded beliefs). */
  keerthyBelieves: string[];
}

export const REL_MIN = -100;
export const REL_MAX = 100;

export function clampRel(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function newRelationship(): RelationshipState {
  return {
    trust: 0,
    closeness: 5,
    suspicion: 0,
    promises: [],
    memories: [],
    revelations: [],
    keerthyBelieves: [],
  };
}

export interface RelDelta {
  trust?: number;
  closeness?: number;
  suspicion?: number;
}

/** Apply a delta. Returns human-readable change notes (for subtle UI toasts). */
export function applyDelta(r: RelationshipState, d: RelDelta): string[] {
  const notes: string[] = [];
  if (d.trust) {
    r.trust = clampRel(r.trust + d.trust, REL_MIN, REL_MAX);
    notes.push(`${d.trust > 0 ? '+' : ''}${d.trust} Trust`);
  }
  if (d.closeness) {
    r.closeness = clampRel(r.closeness + d.closeness, 0, REL_MAX);
    notes.push(`${d.closeness > 0 ? '+' : ''}${d.closeness} Closeness`);
  }
  if (d.suspicion) {
    r.suspicion = clampRel(r.suspicion + d.suspicion, 0, REL_MAX);
    notes.push(`${d.suspicion > 0 ? '+' : ''}${d.suspicion} Suspicion`);
  }
  return notes;
}

export function addMemory(r: RelationshipState, text: string) {
  if (!r.memories.includes(text)) r.memories.push(text);
}

export function addRevelation(r: RelationshipState, text: string) {
  if (!r.revelations.includes(text)) r.revelations.push(text);
}

export function keerthyBelieves(r: RelationshipState, text: string) {
  if (!r.keerthyBelieves.includes(text)) r.keerthyBelieves.push(text);
}

export function addPromise(r: RelationshipState, id: string, text: string) {
  if (!r.promises.some((p) => p.id === id)) r.promises.push({ id, text, status: 'pending' });
}

export function setPromiseStatus(r: RelationshipState, id: string, status: PromiseStatus): boolean {
  const p = r.promises.find((x) => x.id === id);
  if (!p) return false;
  p.status = status;
  return true;
}

export function trustLabel(t: number): string {
  if (t <= -40) return 'Wary';
  if (t <= -10) return 'Guarded';
  if (t < 15) return 'Curious';
  if (t < 45) return 'Open';
  if (t < 75) return 'Trusting';
  return 'Confiding';
}

export function closenessLabel(c: number): string {
  if (c < 15) return 'Strangers';
  if (c < 35) return 'Acquaintances';
  if (c < 60) return 'Drawn to each other';
  if (c < 85) return 'Close';
  return 'Inseparable';
}

export function suspicionLabel(s: number): string {
  if (s < 10) return 'At ease';
  if (s < 35) return 'Notices things';
  if (s < 65) return 'Keeping score';
  return 'Almost certain';
}

export function serializeRelationship(r: RelationshipState): RelationshipState {
  return JSON.parse(JSON.stringify(r)) as RelationshipState;
}

export function deserializeRelationship(data: RelationshipState | null | undefined): RelationshipState {
  const base = newRelationship();
  if (!data) return base;
  const num = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    trust: clampRel(num(data.trust, base.trust), REL_MIN, REL_MAX),
    closeness: clampRel(num(data.closeness, base.closeness), 0, REL_MAX),
    suspicion: clampRel(num(data.suspicion, base.suspicion), 0, REL_MAX),
    promises: Array.isArray(data.promises) ? data.promises : [],
    memories: Array.isArray(data.memories) ? data.memories : [],
    revelations: Array.isArray(data.revelations) ? data.revelations : [],
    keerthyBelieves: Array.isArray(data.keerthyBelieves) ? data.keerthyBelieves : [],
  };
}

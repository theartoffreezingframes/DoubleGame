/**
 * Investigation system — pure logic.
 * Evidence is discovered through play; deductions require the player to
 * explicitly connect two known items. Evidence types distinguish
 * confirmed records, testimony (unverified claims) and physical items.
 */

export type EvidenceKind = 'record' | 'testimony' | 'physical' | 'document';

export interface EvidenceDef {
  id: string;
  title: string;
  body: string;
  kind: EvidenceKind;
  source: string;
}

export interface DeductionDef {
  id: string;
  title: string;
  body: string;
  /** Ids of evidence/deductions that must be connected (exactly 2 for M1). */
  requires: [string, string];
}

export interface InvestigationState {
  found: string[];
  deduced: string[];
  attempts: number;
}

export function newInvestigation(): InvestigationState {
  return { found: [], deduced: [], attempts: 0 };
}

export function hasEvidence(s: InvestigationState, id: string): boolean {
  return s.found.includes(id) || s.deduced.includes(id);
}

/** Returns true if newly discovered, false if already known. */
export function discover(s: InvestigationState, id: string): boolean {
  if (s.found.includes(id) || s.deduced.includes(id)) return false;
  s.found.push(id);
  return true;
}

export interface CombineResult {
  ok: boolean;
  id?: string;
  message: string;
}

/**
 * Attempt to connect two known items. Recipes come from the provided
 * deduction definitions. Wrong pairs are rejected with a gentle quip
 * hook (caller displays it).
 */
export function combine(
  s: InvestigationState,
  a: string,
  b: string,
  recipes: DeductionDef[],
  onQuip?: (badPair: [string, string]) => string,
): CombineResult {
  if (a === b) return { ok: false, message: 'Connecting a clue to itself gets you nowhere.' };
  if (!hasEvidence(s, a) || !hasEvidence(s, b)) {
    return { ok: false, message: 'You need both clues before you can connect them.' };
  }
  const recipe = recipes.find(
    (r) => (r.requires[0] === a && r.requires[1] === b) || (r.requires[0] === b && r.requires[1] === a),
  );
  if (recipe && !s.deduced.includes(recipe.id)) {
    s.deduced.push(recipe.id);
    return { ok: true, id: recipe.id, message: recipe.title };
  }
  if (recipe && s.deduced.includes(recipe.id)) {
    return { ok: false, message: 'You already made that connection.' };
  }
  s.attempts += 1;
  const quip = onQuip ? onQuip([a, b]) : 'Those two threads don’t tie together — yet.';
  return { ok: false, message: quip };
}

export function serializeInvestigation(s: InvestigationState): InvestigationState {
  return { found: [...s.found], deduced: [...s.deduced], attempts: s.attempts };
}

export function deserializeInvestigation(data: InvestigationState | null | undefined): InvestigationState {
  if (!data) return newInvestigation();
  return {
    found: Array.isArray(data.found) ? [...data.found] : [],
    deduced: Array.isArray(data.deduced) ? [...data.deduced] : [],
    attempts: Number(data.attempts) || 0,
  };
}

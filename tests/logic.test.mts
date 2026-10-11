/**
 * Headless logic tests for the pure game systems (no DOM/three).
 * Run: npm test  (uses node --experimental-transform-types)
 */
declare const process: { exit(code?: number): void };
import {
  newRelationship, applyDelta, addMemory, addPromise, setPromiseStatus,
  trustLabel, closenessLabel, suspicionLabel, deserializeRelationship, REL_MAX, REL_MIN,
} from '../src/systems/relationship.ts';
import {
  newInvestigation, discover, combine, hasEvidence, serializeInvestigation, deserializeInvestigation,
} from '../src/systems/investigation.ts';
import { EVIDENCE, DEDUCTIONS, ALL_CLUE_IDS } from '../src/data/content.ts';
import {
  RAO_GRAPH, MEERA_GRAPH, NAVEEN_GRAPH, KEERTHY_GRAPH, MURAL_GRAPH, CAFE_SKETCH_GRAPH, OBJECTIVES, PHONES,
} from '../src/data/mission1.ts';
import type { DialogueGraph } from '../src/systems/dialogue-types.ts';

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    console.log(`  ✔ ${name}`);
  } else {
    failures++;
    console.error(`  ✘ ${name} ${detail}`);
  }
}

console.log('— relationship system —');
{
  const r = newRelationship();
  const notes = applyDelta(r, { trust: 8, closeness: 4 });
  check('trust delta applies', r.trust === 8, `got ${r.trust}`);
  check('closeness delta applies', r.closeness === 9, `got ${r.closeness}`); // starts at 5
  check('change notes produced', notes.length === 2);
  applyDelta(r, { trust: -1000 });
  check('trust clamps to min', r.trust === REL_MIN);
  applyDelta(r, { trust: 9999, closeness: 9999, suspicion: 9999 });
  check('values clamp to max', r.trust === REL_MAX && r.closeness === REL_MAX && r.suspicion === REL_MAX);
  addMemory(r, 'Walked to the mural');
  addMemory(r, 'Walked to the mural');
  check('memories dedupe', r.memories.length === 1);
  addPromise(r, 'exhibition', 'Attend on Friday');
  check('promise pending', r.promises[0].status === 'pending');
  setPromiseStatus(r, 'exhibition', 'kept');
  check('promise kept', r.promises[0].status === 'kept');
  check('trust label sane', trustLabel(60) === 'Trusting');
  check('closeness label sane', closenessLabel(2) === 'Strangers');
  check('suspicion label sane', suspicionLabel(0) === 'At ease');
  const round = deserializeRelationship(JSON.parse(JSON.stringify(r)));
  check('serialize round-trip', round.trust === r.trust && round.memories.length === 1);
  const bad = deserializeRelationship({ trust: 'x' as unknown as number } as never);
  check('bad save falls back to defaults', bad.trust === 0 && bad.closeness === 5);
}

console.log('— investigation system —');
{
  const inv = newInvestigation();
  check('discover new', discover(inv, 'E1') === true);
  check('discover duplicate blocked', discover(inv, 'E1') === false);
  discover(inv, 'E3');
  check('has evidence', hasEvidence(inv, 'E3'));

  const wrong = combine(inv, 'E1', 'E2_not_found', DEDUCTIONS);
  check('cannot combine unknown', wrong.ok === false);

  discover(inv, 'E2');
  const badPair = combine(inv, 'E1', 'E2', DEDUCTIONS);
  check('wrong pair rejected', badPair.ok === false);
  check('attempt counted', inv.attempts === 1);

  const good = combine(inv, 'E1', 'E3', DEDUCTIONS);
  check('E1+E3 → Blind Window', good.ok === true && good.id === 'D1');
  const dup = combine(inv, 'E3', 'E1', DEDUCTIONS);
  check('deduction not repeatable', dup.ok === false);

  discover(inv, 'E4');
  const d2 = combine(inv, 'D1', 'E4', DEDUCTIONS);
  check('D1+E4 → Kaveri Thread', d2.ok === true && d2.id === 'D2');

  const round = deserializeInvestigation(JSON.parse(JSON.stringify(serializeInvestigation(inv))));
  check('inv round-trip', round.deduced.includes('D1') && round.deduced.includes('D2'));
}

console.log('— content integrity —');
{
  for (const id of ['E1', 'E1B', 'E2', 'E3', 'E4', 'E5', 'E6']) {
    check(`evidence ${id} defined`, !!EVIDENCE[id] && EVIDENCE[id].body.length > 20);
  }
  for (const d of DEDUCTIONS) {
    check(`deduction ${d.id} requires known ids`, d.requires.every((req) => !!EVIDENCE[req] || DEDUCTIONS.some((x) => x.id === req)));
  }
  check('ALL_CLUE_IDS covers everything', ALL_CLUE_IDS.length === Object.keys(EVIDENCE).length + DEDUCTIONS.length);

  const validateGraph = (name: string, g: DialogueGraph) => {
    for (const node of Object.values(g)) {
      if (node.next && !g[node.next]) {
        // cross-graph nexts (sketch→mural) are allowed when merged; flag others
        check(`${name}:${node.id} next resolves`, false, `missing ${node.next}`);
        return;
      }
      for (const c of node.choices ?? []) {
        if (c.next && !g[c.next]) {
          check(`${name}:${node.id} choice next resolves`, false, `missing ${c.next}`);
          return;
        }
      }
    }
    check(`${name}: internal links resolve`, true);
  };
  validateGraph('RAO', RAO_GRAPH);
  validateGraph('MEERA', MEERA_GRAPH);
  validateGraph('NAVEEN', NAVEEN_GRAPH);
  validateGraph('KEERTHY', KEERTHY_GRAPH);
  validateGraph('MURAL', MURAL_GRAPH);
  // Sketch graph intentionally links into MURAL graph (merged at runtime)
  const merged = { ...CAFE_SKETCH_GRAPH, ...MURAL_GRAPH };
  validateGraph('SKETCH+MURAL merged', merged);

  for (const phase of ['commute', 'checkin', 'desk', 'meera', 'naveen', 'lunch', 'keerthy', 'walk', 'cafe', 'return', 'done']) {
    check(`objective exists for ${phase}`, !!OBJECTIVES[phase]);
  }
  for (const key of ['kaveri-cancel', 'naveen-warning', 'compliance-email', 'keerthy-honest', 'keerthy-deflect', 'keerthy-lie']) {
    check(`phone script ${key}`, !!PHONES[key] && PHONES[key].messages.length > 0);
  }
}

if (failures > 0) {
  console.error(`\n${failures} test(s) FAILED`);
  process.exit(1);
}
console.log('\nAll logic tests passed ✓');

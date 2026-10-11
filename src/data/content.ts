/** Evidence and deduction definitions for Milestone 1 — pure data. */
import type { EvidenceDef, DeductionDef } from '../systems/investigation.ts';

export const EVIDENCE: Record<string, EvidenceDef> = {
  E1: {
    id: 'E1',
    title: 'The Three ₹49,900s',
    kind: 'record',
    source: 'Terminal JPC-07 — reconciliation queue',
    body: 'Three transfers of exactly ₹49,900 on Sunday, 02:11, 02:24 and 02:38 — each one rupee-class below the ₹50,000 AML reporting threshold. Same beneficiary on all three: SRI KAVERI INFRA SOLN.',
  },
  E1B: {
    id: 'E1B',
    title: 'Discarded Remittance Slip',
    kind: 'physical',
    source: 'Printer tray, teller counter',
    body: 'A printed remittance slip for ₹49,900 — reference KA-1127, beneficiary SRI KAVERI INFRA SOLN, stamped SUN 02:38. It was thrown in the tray instead of the filing box. Someone left in a hurry.',
  },
  E2: {
    id: 'E2',
    title: 'The Sunday Blackout',
    kind: 'testimony',
    source: 'Meera — teller counter',
    body: '“The Great Sunday Blackout”: core banking was down for two hours Sunday night for unannounced ‘maintenance’. Customers couldn’t pay; staff were never told why. (Unverified — Meera saw the outage notice, not the cause.)',
  },
  E3: {
    id: 'E3',
    title: 'The Missing Logs',
    kind: 'testimony',
    source: 'Naveen — IT',
    body: 'Audit logs for Sunday 02:00–04:00 don’t exist at all — not empty, absent. No maintenance was scheduled with facilities or the vendor. (Unverified — Naveen’s access shows the gap, not who made it.)',
  },
  E4: {
    id: 'E4',
    title: 'The Matching Amount',
    kind: 'record',
    source: 'Keerthy’s email — witnessed at the plaza',
    body: 'Kalpa Designs’ advance from SRI KAVERI INFRA SOLN — exactly ₹49,900 — was cancelled Sunday night, citing “system failure”. Same amount. Same night. Same company as the bank’s three transfers.',
  },
  E5: {
    id: 'E5',
    title: 'Compliance Hold',
    kind: 'record',
    source: 'Terminal JPC-07 — reconciliation queue',
    body: 'Deeper rows in the queue are hidden behind a “P. AUTH” override. Someone with elevated privileges is curating what the reconciliation desk is allowed to see.',
  },
  E6: {
    id: 'E6',
    title: 'Payment Order KA-1127',
    kind: 'document',
    source: 'Keerthy — sent after the walk',
    body: 'Kalpa Designs’ cancelled payment order: reference KA-1127, ₹49,900, payer SRI KAVERI INFRA SOLN, cancelled SUN 02:38. The same reference number as the discarded remittance slip at the bank.',
  },
};

export const DEDUCTIONS: DeductionDef[] = [
  {
    id: 'D1',
    title: 'The Blind Window',
    requires: ['E1', 'E3'],
    body: 'Three transfers structured just under the reporting threshold cleared during the only window where audit logs simply don’t exist. The Sunday blackout wasn’t maintenance — it was cover.',
  },
  {
    id: 'D2',
    title: 'The Kaveri Thread',
    requires: ['D1', 'E4'],
    body: 'The same shell that received the bank’s money cancelled a small design studio’s advance the same night — for the identical amount. The conspiracy reaches into Keerthy’s world. And someone with “P.” authority can blind a terminal.',
  },
];

export const BAD_PAIR_QUIPS = [
  'Those two threads don’t tie together — yet.',
  'Naveen would be proud of that theory. It is still wrong.',
  'Interesting. Unsupported, but interesting.',
  'The notebook politely declines this combination.',
];

/** All discoverable ids, for progress counting. */
export const ALL_CLUE_IDS = ['E1', 'E1B', 'E2', 'E3', 'E4', 'E5', 'E6', 'D1', 'D2'];

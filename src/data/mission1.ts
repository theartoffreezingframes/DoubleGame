/** MISSION 1 — MONDAY MORNING: authored dialogue, objectives and phone scripts. */
import type { DialogueGraph } from '../systems/dialogue-types.ts';

/* ------------------------------------------------------------------ */
/* Mr. Rao — check-in                                                  */
/* ------------------------------------------------------------------ */
export const RAO_GRAPH: DialogueGraph = {
  rao1: {
    id: 'rao1',
    speaker: 'Mr. Rao',
    text: 'Akshay. Nine-oh-seven. The clock worries about you more than I do.',
    choices: [
      { label: '“Traffic on Street One. A goat had strong opinions about my lane.”', tone: 'playful', next: 'rao2a' },
      { label: '“Good morning, sir. It won’t happen again.”', tone: 'composed', next: 'rao2b' },
    ],
  },
  rao2a: {
    id: 'rao2a',
    speaker: 'Mr. Rao',
    text: 'The goat, I’m told, arrived on time. Save the wildlife report — retail is already queuing.',
    next: 'rao3',
  },
  rao2b: {
    id: 'rao2b',
    speaker: 'Mr. Rao',
    text: 'Hm. Punctuality is the only apology I accept. Good.',
    next: 'rao3',
  },
  rao3: {
    id: 'rao3',
    speaker: 'Mr. Rao',
    text: 'The reconciliation queue has been sitting untouched since Friday. It’s yours today. Every entry verified, every mismatch logged.',
    next: 'rao4',
  },
  rao4: {
    id: 'rao4',
    speaker: 'Mr. Rao',
    text: 'And Akshay — compliance sent a memo this morning. Anything unusual in the ledger goes through process. No heroics, no hallway theories. Clear?',
    effects: [
      { type: 'flag', key: 'metRao', value: true },
      { type: 'phase', id: 'desk' },
    ],
    next: 'rao5',
  },
  rao5: {
    id: 'rao5',
    speaker: 'Akshay',
    text: 'Clear, sir. Process first.',
    effects: [{ type: 'toast', text: 'Objective updated — your desk is waiting.', tone: 'teal' }],
    end: true,
  },
};

/* ------------------------------------------------------------------ */
/* Meera — the Sunday blackout                                         */
/* ------------------------------------------------------------------ */
export const MEERA_GRAPH: DialogueGraph = {
  meera1: {
    id: 'meera1',
    speaker: 'Meera',
    text: 'Look who finally graced us with his presence! There’s coffee in the back if you’re running on fumes and ambition.',
    choices: [
      { label: '“You’re a lifesaver. But first — quick question about Sunday night.”', tone: 'focused', next: 'meera2' },
      { label: '“Coffee first, questions never.”', tone: 'playful', next: 'meera1b' },
    ],
  },
  meera1b: {
    id: 'meera1b',
    speaker: 'Meera',
    text: 'That’s the first honest thing anyone’s said today. Go on, take the cup. Now — what’s the look for? You have your “I’m about to ask a favour” face on.',
    next: 'meera2',
  },
  meera2: {
    id: 'meera2',
    speaker: 'Akshay',
    text: 'Sunday night. The core system went down. Do you remember anything about it?',
    next: 'meera3',
  },
  meera3: {
    id: 'meera3',
    speaker: 'Meera',
    text: 'Oh, the Great Sunday Blackout! Apps died for two hours. My mother couldn’t pay her electricity bill and called me personally. Twice. As if I personally unplugged the server.',
    next: 'meera4',
  },
  meera4: {
    id: 'meera4',
    speaker: 'Meera',
    text: 'The weird part? Nobody told us why. One notice: “scheduled maintenance”. On a Sunday. At 2 a.m. Since when do we schedule anything, Akshay? We can’t even schedule the tea boy.',
    effects: [{ type: 'evidence', id: 'E2' }],
    next: 'meera5',
  },
  meera5: {
    id: 'meera5',
    speaker: 'Meera',
    text: 'Why do you ask? Did your precious reconciliation queue grow teeth?',
    choices: [
      { label: '“Just chasing a rounding error. Probably nothing.”', tone: 'guarded', next: 'meera6a', effects: [{ type: 'flag', key: 'meeraTold', value: 'nothing' }] },
      { label: '“Something looks off and I can’t prove it yet. Say nothing, please.”', tone: 'trusting', next: 'meera6b', effects: [{ type: 'flag', key: 'meeraTold', value: 'hint' }] },
    ],
  },
  meera6a: {
    id: 'meera6a',
    speaker: 'Meera',
    text: 'A rounding error. Sure. And I’m the Reserve Bank governor. Go chase your error, detective.',
    effects: [{ type: 'flag', key: 'metMeera', value: true }, { type: 'phase', id: 'naveen' }],
    end: true,
  },
  meera6b: {
    id: 'meera6b',
    speaker: 'Meera',
    text: '…Okay. Now you have my attention. I didn’t hear anything, I saw nothing, and I am extremely available for gossip later. Be careful, Akshay.',
    effects: [{ type: 'flag', key: 'metMeera', value: true }, { type: 'phase', id: 'naveen' }, { type: 'toast', text: 'Meera will keep your secret. Probably.', tone: 'teal' }],
    end: true,
  },
};

/* ------------------------------------------------------------------ */
/* Naveen — the missing logs                                           */
/* ------------------------------------------------------------------ */
export const NAVEEN_GRAPH: DialogueGraph = {
  nav1: {
    id: 'nav1',
    speaker: 'Naveen',
    text: 'Akshay! My favourite person who isn’t a server. You have the look. What broke — your heart or my ticket queue?',
    next: 'nav2',
  },
  nav2: {
    id: 'nav2',
    speaker: 'Akshay',
    text: 'Sunday night, two to four a.m. I need the audit logs for the core system.',
    next: 'nav3',
  },
  nav3: {
    id: 'nav3',
    speaker: 'Naveen',
    text: 'Ha! Funny story. There aren’t any.',
    next: 'nav4',
  },
  nav4: {
    id: 'nav4',
    speaker: 'Naveen',
    text: 'And I don’t mean “the logs say nothing happened”. I mean the logs. Don’t. Exist. It’s like someone vacuumed the floor, burned the vacuum, and denied ever owning a house.',
    effects: [{ type: 'evidence', id: 'E3' }],
    next: 'nav5',
  },
  nav5: {
    id: 'nav5',
    speaker: 'Naveen',
    text: 'I checked facilities — no maintenance scheduled. I called the vendor — the vendor asked me what a Sunday is. I’m telling you, this is a ghost. A polite, well-dressed ghost with root access.',
    choices: [
      { label: '“Ghosts don’t move money, Naveen.”', tone: 'dry', next: 'nav6a' },
      { label: '“Keep digging. Quietly. Tell no one.”', tone: 'serious', next: 'nav6b' },
    ],
  },
  nav6a: {
    id: 'nav6a',
    speaker: 'Naveen',
    text: 'Not with that attitude. Fine — no ghosts. Just a person, with hands, who deleted a two-hour hole in our audit trail. Much scarier. Thank you for that.',
    effects: [{ type: 'flag', key: 'metNaveen', value: true }, { type: 'phase', id: 'lunch' }],
    next: 'nav7',
  },
  nav6b: {
    id: 'nav6b',
    speaker: 'Naveen',
    text: 'Quietly. My two worst skills: quietly, and eyes open. But for you, I’ll attempt both. I’ll dig here — you go eat before you start interrogating the printer.',
    effects: [{ type: 'flag', key: 'metNaveen', value: true }, { type: 'phase', id: 'lunch' }],
    next: 'nav7',
  },
  nav7: {
    id: 'nav7',
    speaker: 'Naveen',
    text: 'Seriously though — lunch. Charminar Chai Co. has samosas that restore faith in institutions. Our institutions have failed us, so.',
    effects: [{ type: 'toast', text: 'Objective updated — maybe Naveen is right about the samosas.', tone: 'teal' }],
    end: true,
  },
};

/* ------------------------------------------------------------------ */
/* Keerthy — the meeting                                               */
/* ------------------------------------------------------------------ */
export const KEERTHY_GRAPH: DialogueGraph = {
  k1: {
    id: 'k1',
    speaker: 'narrator',
    text: 'A woman at the corner table looks up from a sketchbook, charcoal pencil paused mid-line. The seat opposite her is free — and somehow it feels like an interview.',
    choices: [
      { label: '“Is this seat reserved, or is it guarded by the city’s best architect?”', tone: 'playful', next: 'k2a' },
      { label: '“Hi. Akshay, from the bank next door. Mind if I sit?”', tone: 'sincere', next: 'k2b' },
      { label: '“I was going to order chai first, but introductions have a better success rate.”', tone: 'charming', next: 'k2c' },
    ],
  },
  k2a: {
    id: 'k2a',
    speaker: 'Keerthy',
    text: 'Confident. Wrong, but confident. The seat is free — the architect is only guarding the last samosa.',
    effects: [{ type: 'rel', trust: 2, closeness: 4 }, { type: 'flag', key: 'opener', value: 'playful' }],
    next: 'k3',
  },
  k2b: {
    id: 'k2b',
    speaker: 'Keerthy',
    text: 'The bank next door. So you’re the reason the queue moves slowly — you seem like the type that double-checks everything.',
    effects: [{ type: 'rel', trust: 3, closeness: 2 }, { type: 'flag', key: 'opener', value: 'sincere' }],
    next: 'k3',
  },
  k2c: {
    id: 'k2c',
    speaker: 'Keerthy',
    text: 'Success rate so far: fifty percent. You have my attention, not the chai. Sit.',
    effects: [{ type: 'rel', trust: 2, closeness: 3 }, { type: 'flag', key: 'opener', value: 'charming' }],
    next: 'k3',
  },
  k3: {
    id: 'k3',
    speaker: 'Keerthy',
    text: 'Keerthy. Kalpa Designs — that’s my studio, one lane away. I’m here twice a week because this place has the only honest filter coffee in the district.',
    next: 'k3b',
  },
  k3b: {
    id: 'k3b',
    speaker: 'Akshay',
    text: 'Akshay. Janapriya Bank. I double-check everything, apparently — the reputation travels fast.',
    effects: [{ type: 'memory', text: 'Met Keerthy at Charminar Chai Co. over the last samosa.' }],
    next: 'k4',
  },
  k4: {
    id: 'k4',
    speaker: 'Keerthy',
    text: 'Mm. You double-check everything except your own face. You have a look — like a spreadsheet just insulted your mother.',
    choices: [
      { label: '“That obvious? Something’s off in our ledgers and I can’t talk about it. But thank you for noticing.”', tone: 'honest', next: 'k5h', effects: [{ type: 'rel', trust: 8 }, { type: 'flag', key: 'honesty', value: 'honest' }, { type: 'reveal', text: 'You admitted to Keerthy that something is wrong at the bank.' }] },
      { label: '“Just Monday. The queue was brutal today.”', tone: 'deflect', next: 'k5d', effects: [{ type: 'rel', closeness: 2, suspicion: 6 }, { type: 'flag', key: 'honesty', value: 'deflect' }] },
      { label: '“No, no — everything’s fine. Totally fine. I love ledgers.”', tone: 'lie', next: 'k5l', effects: [{ type: 'rel', trust: -4, suspicion: 10 }, { type: 'flag', key: 'honesty', value: 'lie' }] },
    ],
  },
  k5h: {
    id: 'k5h',
    speaker: 'Keerthy',
    text: 'I sketch people when they’re not paying attention — professional research. And for the record: “can’t talk about it” is a terrible secret… but an honest one. I’ll take it.',
    effects: [{ type: 'rel', closeness: 4 }, { type: 'believes', text: 'Keerthy believes something is wrong in the bank’s ledgers.' }],
    next: 'k6',
  },
  k5d: {
    id: 'k5d',
    speaker: 'Keerthy',
    text: 'Mm. Mondays. Right. Well — the queue was very brutal, I’m sure.',
    effects: [{ type: 'believes', text: 'Keerthy doesn’t believe the queue story, but lets it go. For now.' }],
    next: 'k6',
  },
  k5l: {
    id: 'k5l',
    speaker: 'Keerthy',
    text: '“Totally fine.” You said that like a man holding a leaking pipe and calling it rain.',
    effects: [{ type: 'believes', text: 'Keerthy is certain Akshay is hiding something.' }],
    next: 'k6',
  },
  k6: {
    id: 'k6',
    speaker: 'Keerthy',
    text: 'Anyway — since you’re here. Kalpa has its first exhibition on Friday. A mural we finished in the plaza. There will be terrible snacks, and I will be extremely proud. You should come.',
    choices: [
      { label: '“I’ll be there. Friday.”', tone: 'promise', next: 'k6a' },
      { label: '“Friday’s tricky — but I’ll try.”', tone: 'hedge', next: 'k6b' },
      { label: '“Exhibitions aren’t really my thing.”', tone: 'blunt', next: 'k6c' },
    ],
  },
  k6a: {
    id: 'k6a',
    speaker: 'Keerthy',
    text: 'Good answer. Say it again later when it’s inconvenient — that’s the version that counts.',
    effects: [
      { type: 'rel', trust: 4, closeness: 6 },
      { type: 'promise', id: 'exhibition', text: 'Attend Kalpa Designs’ exhibition on Friday.' },
      { type: 'flag', key: 'exhibition', value: 'promise' },
      { type: 'memory', text: 'Promised to come to Kalpa’s exhibition on Friday.' },
    ],
    next: 'k7',
  },
  k6b: {
    id: 'k6b',
    speaker: 'Keerthy',
    text: '“Try” is the cousin of “no”, but I’ll allow it. I keep a list of people who try.',
    effects: [{ type: 'rel', closeness: 2 }, { type: 'flag', key: 'exhibition', value: 'maybe' }],
    next: 'k7',
  },
  k6c: {
    id: 'k6c',
    speaker: 'Keerthy',
    text: 'Noted. The bank probably has a lovely queue you can attend instead. It moves slowly, you can double-check everything.',
    effects: [{ type: 'rel', closeness: -4, trust: -2 }, { type: 'flag', key: 'exhibition', value: 'declined' }],
    next: 'k7',
  },
  k7: {
    id: 'k7',
    speaker: 'Keerthy',
    text: 'You look like you need air more than coffee. Come — I’ll show you the mural. Ten minutes. The chai will wait for us; it’s very patient.',
    choices: [
      { label: '“Lead the way.”', tone: 'eager', next: 'k8walk', effects: [{ type: 'flag', key: 'activity', value: 'walk' }] },
      { label: '“Can we stay? I want to hear about the sketches first.”', tone: 'curious', next: 'k8cafe', effects: [{ type: 'flag', key: 'activity', value: 'cafe' }] },
    ],
  },
  k8walk: {
    id: 'k8walk',
    speaker: 'Keerthy',
    text: 'Excellent decision. Keep up — I walk like I sketch: fast, and with commitment.',
    effects: [
      { type: 'flag', key: 'metKeerthy', value: true },
      { type: 'phase', id: 'walk' },
      { type: 'memory', text: 'Walked with Keerthy to the plaza mural.' },
    ],
    end: true,
  },
  k8cafe: {
    id: 'k8cafe',
    speaker: 'Keerthy',
    text: 'Fine. But the mural is better in person. It has better posture than you.',
    effects: [
      { type: 'flag', key: 'metKeerthy', value: true },
      { type: 'phase', id: 'cafe' },
      { type: 'memory', text: 'Stayed at the café with Keerthy and her sketchbook.' },
    ],
    end: true,
  },
};

/* ------------------------------------------------------------------ */
/* Walk beats — small lines delivered when the player catches up       */
/* ------------------------------------------------------------------ */
export const WALK_BEATS: Array<{ speaker: string; text: string }> = [
  { speaker: 'Keerthy', text: 'Two lanes over. The city gave us the wall after we won the bid — apparently we were the only studio that showed up.' },
  { speaker: 'Keerthy', text: 'Careful on this stretch. The pavement was designed by someone who hated feet personally.' },
  { speaker: 'Keerthy', text: 'And this is why I drag bankers away from their desks.' },
];

/* ------------------------------------------------------------------ */
/* The mural / reveal conversation                                     */
/* ------------------------------------------------------------------ */
export const MURAL_GRAPH: DialogueGraph = {
  m1: {
    id: 'm1',
    speaker: 'Keerthy',
    text: 'It’s called “Two Ledgers”. One side is the city counting its money. The other is the city counting its people. Guess which side took longer to paint.',
    choices: [
      { label: '“The people side. People are complicated.”', tone: 'thoughtful', next: 'm2a' },
      { label: '“The money side — obviously.”', tone: 'banker', next: 'm2b' },
      { label: '“You’re about to tell me.”', tone: 'playful', next: 'm2c' },
    ],
  },
  m2a: {
    id: 'm2a',
    speaker: 'Keerthy',
    text: 'Correct. Money is easy — it always knows where it’s going. People take longer, because someone has to decide whether they count.',
    effects: [{ type: 'rel', closeness: 3, trust: 2 }],
    next: 'm3',
  },
  m2b: {
    id: 'm2b',
    speaker: 'Keerthy',
    text: 'Wrong, but a very banker answer. The money side painted itself. The people side… someone kept deciding they didn’t fit.',
    effects: [{ type: 'rel', closeness: 2 }],
    next: 'm3',
  },
  m2c: {
    id: 'm2c',
    speaker: 'Keerthy',
    text: 'I was, yes. The people side. Money always knows where it’s going — people need someone to count them.',
    effects: [{ type: 'rel', closeness: 3 }],
    next: 'm3',
  },
  m3: {
    id: 'm3',
    speaker: 'narrator',
    text: 'Her phone buzzes. Keerthy glances at it — and goes very still.',
    next: 'm3p',
  },
  m3p: {
    id: 'm3p',
    speaker: 'narrator',
    text: 'An email. From Kalpa Accounts.',
    effects: [{ type: 'phone', id: 'kaveri-cancel' }],
    next: 'm4',
  },
  m4: {
    id: 'm4',
    speaker: 'Keerthy',
    text: 'Well. That’s irritating. Our biggest advance just evaporated. Cancelled Sunday night — “system failure”. Forty-nine thousand nine hundred rupees, gone in one line of email.',
    next: 'm5',
  },
  m5: {
    id: 'm5',
    speaker: 'narrator',
    text: 'Forty-nine thousand nine hundred. The same amount. The same night. The mural’s painted eyes seem to be watching now.',
    effects: [{ type: 'evidence', id: 'E4' }],
    choices: [
      { label: '“Keerthy… the same amount moved through our bank that night. Three times. Just under the reporting threshold.”', tone: 'share it', next: 'm6a', effects: [{ type: 'rel', trust: 10, closeness: 4 }, { type: 'flag', key: 'toldKeerthy', value: true }, { type: 'believes', text: 'Keerthy knows about the three structured transfers.' }, { type: 'memory', text: 'Shared the ₹49,900 pattern with Keerthy.' }] },
      { label: '“That’s a weirdly specific amount.”', tone: 'hold back', next: 'm6b', effects: [{ type: 'rel', closeness: 1 }, { type: 'flag', key: 'toldKeerthy', value: false }] },
    ],
  },
  m6a: {
    id: 'm6a',
    speaker: 'Keerthy',
    text: '…Say that again slowly. Our firm — Sri Kaveri Infra Solutions — hired us for signage, paid one advance, and now cancels it at midnight? And the same number walks through your bank in the dark? That’s not a coincidence, that’s a system.',
    next: 'm7',
  },
  m6b: {
    id: 'm6b',
    speaker: 'Keerthy',
    text: '“Specific” is banker for “suspicious”. You’re doing the face again, Akshay. Fine — keep your secrets. But someone at Sri Kaveri Infra likes odd amounts and midnight cancellations, and I intend to find out why.',
    next: 'm7',
  },
  m7: {
    id: 'm7',
    speaker: 'Keerthy',
    text: 'Sri Kaveri Infra Solutions. They found us, not the other way around. Paid fast, asked no questions — and now this. Ask around your end, banker. Quietly. I’ll ask around mine.',
    effects: [
      { type: 'flag', key: 'revealDone', value: true },
      { type: 'phase', id: 'return' },
      { type: 'reveal', text: 'The Kaveri cancellation is tied to the Sunday transfers.' },
    ],
    next: 'm8',
  },
  m8: {
    id: 'm8',
    speaker: 'Akshay',
    text: '(I should get back before the afternoon reconciliation starts without me.)',
    effects: [{ type: 'toast', text: 'Objective updated — back to the bank.', tone: 'teal' }],
    end: true,
  },
};

/* ------------------------------------------------------------------ */
/* Café stay variant — sketchbook, then the same reveal                */
/* ------------------------------------------------------------------ */
export const CAFE_SKETCH_GRAPH: DialogueGraph = {
  s1: {
    id: 's1',
    speaker: 'Keerthy',
    text: 'Careful, those are load-bearing. This one’s the plaza wall — “Two Ledgers”. The city counting its money, and the city counting its people.',
    next: 's2',
  },
  s2: {
    id: 's2',
    speaker: 'Akshay',
    text: 'These are good. Really good. The people side has… weight.',
    effects: [{ type: 'rel', closeness: 3, trust: 2 }],
    next: 's3',
  },
  s3: {
    id: 's3',
    speaker: 'Keerthy',
    text: 'Flattery noted, filed, and appreciated. The money side painted itself — the people side fought me for every—',
    next: 'm3',
  },
};
// Sketchbook scene continues directly into MURAL_GRAPH from m3.

/* ------------------------------------------------------------------ */
/* Small talk (post-slice, keeps the world alive)                      */
/* ------------------------------------------------------------------ */
export const KEERTHY_SMALLTALK: string[] = [
  'Keerthy looks up from her sketchbook. “The mural misses you. I, however, am available on Friday.”',
  '“Still counting other people’s money, banker? Ask around quietly — I’m asking around loudly.”',
  '“I made a list of suspicious things about Sri Kaveri Infra. It’s longer than your reconciliation queue.”',
];

export const RAO_SMALLTALK = 'Mr. Rao is on a call, gesturing at a spreadsheet like it owes him money.';
export const MEERA_SMALLTALK = 'Meera mouths “any news?” over the counter and immediately pretends to count cash.';
export const NAVEEN_SMALLTALK = 'Naveen, without looking up: “The ghost has no comment. Neither do I, officially.”';

/* ------------------------------------------------------------------ */
/* Phone scripts                                                        */
/* ------------------------------------------------------------------ */
export interface PhoneScript { from: string; time: string; messages: Array<{ text: string; sys?: boolean }>; }

export const PHONES: Record<string, PhoneScript> = {
  'kaveri-cancel': {
    from: 'Kalpa Accounts — noreply',
    time: '13:41',
    messages: [
      { sys: true, text: 'INCOMING MAIL' },
      { text: 'Subject: Payment Order KA-1127 — CANCELLED' },
      { text: 'Dear Kalpa Designs,\nYour advance of ₹49,900 (ref KA-1127), payable by SRI KAVERI INFRA SOLN, stands cancelled effective SUN 02:38 due to a system failure at the remitting bank.' },
      { text: 'No further action is required on your part.' },
    ],
  },
  'naveen-warning': {
    from: 'Naveen',
    time: '14:02',
    messages: [
      { text: 'Bro. Someone from “Compliance” just asked me for your terminal session logs. In person. Nice shoes. Too nice for compliance.' },
      { text: 'What did you touch today?? Deny everything. Or tell me everything. Ideally both.' },
    ],
  },
  'compliance-email': {
    from: 'Compliance — Janapriya Bank',
    time: '14:05',
    messages: [
      { sys: true, text: 'INCOMING MAIL — INTERNAL' },
      { text: 'Subject: Access Review — Terminal JPC-07' },
      { text: 'Dear Mr. Akshay,\nAs part of a routine review, access logs for terminal JPC-07 are being examined. Please remain available to the compliance desk and refrain from further reconciliation work until notified.' },
      { text: 'This is an automated message. Do not reply.' },
    ],
  },
  'keerthy-honest': {
    from: 'Keerthy',
    time: '14:12',
    messages: [
      { text: 'Made it back to your haunted spreadsheet?' },
      { text: 'I attached the payment order from Kaveri — ref KA-1127. Use it however it helps. That’s what partners are for, even reluctant ones. — K' },
    ],
  },
  'keerthy-deflect': {
    from: 'Keerthy',
    time: '14:12',
    messages: [
      { text: 'Hope the queue survived without you.' },
      { text: 'Friday. Don’t make me sketch you looking guilty. — K' },
    ],
  },
  'keerthy-lie': {
    from: 'Keerthy',
    time: '14:12',
    messages: [
      { text: 'You’re a terrible liar, Akshay. 🙂' },
      { text: 'When you’re ready to say it properly, I’m at the café. — K' },
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Objectives                                                          */
/* ------------------------------------------------------------------ */
export const OBJECTIVES: Record<string, { text: string; sub?: string; beacon?: [number, number] }> = {
  commute: { text: 'Get to Janapriya Bank for the morning stand-up', sub: 'Follow the gold beacon east along Street One.', beacon: [0, 10.5] },
  checkin: { text: 'Check in with Mr. Rao', sub: 'He’s in the glass cabin at the back of the banking hall.', beacon: [10, 22] },
  desk: { text: 'Open the reconciliation queue at your desk', sub: 'Terminal JPC-07 — Friday’s entries are waiting.', beacon: [3.5, 15] },
  meera: { text: 'Ask Meera about Sunday night', sub: 'She’s at the teller counter.', beacon: [-6.5, 15] },
  naveen: { text: 'Ask Naveen in IT about the logs', sub: 'He lives near the server rack. It’s warm there.', beacon: [-10.5, 22] },
  lunch: { text: 'Lunch break — head to Charminar Chai Co.', sub: 'Naveen swears by the samosas. Keerthy swears by the coffee.', beacon: [31, 8.4] },
  keerthy: { text: 'Talk to the woman with the sketchbook', sub: 'Corner table, outside the café. The seat opposite her is free.', beacon: [33, 8.2] },
  walk: { text: 'Walk with Keerthy to the plaza mural', sub: 'She’s ahead of you — she stops if you fall behind.', beacon: [63, 9] },
  cafe: { text: 'Look through Keerthy’s sketchbook', sub: '“Careful — those are load-bearing.”', beacon: [33, 8.2] },
  return: { text: 'Head back to Janapriya Bank', sub: 'The afternoon reconciliation won’t wait.', beacon: [0, 10.5] },
  done: { text: 'Free time — the city is yours', sub: 'Mission 2 will pick up the missing amount.', beacon: undefined },
};

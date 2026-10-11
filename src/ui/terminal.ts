/** Janapriya CORE banking terminal — the reconciliation queue mini-interface. */

const $ = (id: string) => document.getElementById(id)!;

export interface TermRow {
  id: string;
  date: string;
  time: string;
  ref: string;
  account: string;
  desc: string;
  amount: string;
  suspicious: boolean;
  locked?: boolean;
  detail: string;
}

export const TERM_ROWS: TermRow[] = [
  { id: 'r1', date: 'SUN 09-10', time: '00:41', ref: 'SAL-88231', account: 'CORP-PAYROLL', desc: 'Salary batch — retail ops', amount: '₹4,12,600', suspicious: false, detail: 'Standard monthly salary batch, 41 beneficiaries. Verified against HR list. Nothing unusual — except that someone gets paid for filing work on Sundays.' },
  { id: 'r2', date: 'SUN 09-10', time: '01:07', ref: 'VEN-55107', account: 'VND-ATLAS', desc: 'Vendor settlement — ATM cash logistics', amount: '₹1,85,000', suspicious: false, detail: 'Quarterly vendor settlement, matched against contract AT-114. Boring. Beautifully boring.' },
  { id: 'r3', date: 'SUN 09-10', time: '02:11', ref: 'KA-1125', account: 'SRI KAVERI INFRA SOLN', desc: 'Infra services — advance 1 of 3', amount: '₹49,900', suspicious: true, detail: '₹49,900 — one hundred rupees short of the ₹50,000 reporting threshold. Beneficiary incorporated 6 weeks ago. Address: a P.O. box in a market lane. “Infra services” unspecified.' },
  { id: 'r4', date: 'SUN 09-10', time: '02:24', ref: 'KA-1126', account: 'SRI KAVERI INFRA SOLN', desc: 'Infra services — advance 2 of 3', amount: '₹49,900', suspicious: true, detail: 'Same amount. Same beneficiary. Thirteen minutes later. Two “advances” for an unspecified service, in the middle of the night, under the reporting threshold. Interesting definition of infrastructure.' },
  { id: 'r5', date: 'SUN 09-10', time: '02:38', ref: 'KA-1127', account: 'SRI KAVERI INFRA SOLN', desc: 'Infra services — advance 3 of 3', amount: '₹49,900', suspicious: true, detail: 'The third one. Three identical transfers in 27 minutes — ₹1,49,700 total, each slice invisible to the reporting system. Ref KA-1127 was also printed. The slip is not in the filing box.' },
  { id: 'r6', date: 'SUN 09-10', time: '06:15', ref: 'UTL-20114', account: 'TSEB-COLLECT', desc: 'Utility collections sweep', amount: '₹9,64,210', suspicious: false, detail: 'Overnight utility collection sweep, reconciled to the paisa. Even the paisa is where it should be.' },
  { id: 'r7', date: 'MON 10-10', time: '08:02', ref: 'DEP-77840', account: 'RETAIL-DEP', desc: 'Branch deposits — consolidated', amount: '₹22,40,775', suspicious: false, detail: 'Friday-to-Monday retail deposits consolidated. Counts match the teller tallies. Meera’s handwriting on three of the tallies, as usual.' },
  { id: 'r8', date: 'MON 10-10', time: '08:31', ref: 'P.AU-████', account: '██████████', desc: '███ — P. AUTH REQUIRED', amount: '₹██,██,███', suspicious: false, locked: true, detail: 'ACCESS RESTRICTED. This row — and several beneath it — sit behind a Compliance hold labelled “P. AUTH”. Someone with elevated privileges decided the reconciliation desk doesn’t need to see them. You don’t have that authority. Yet.' },
];

export interface TerminalCallbacks {
  onInspect: (row: TermRow) => void;
  onReport: () => void;
  onClose: () => void;
}

export class TerminalUI {
  open = false;
  private inspected = new Set<string>();
  private reported = false;

  constructor(private cb: TerminalCallbacks) {}

  markReported() { this.reported = true; }
  markInspected(id: string) { if (id) this.inspected.add(id); }
  reset() { this.inspected.clear(); this.reported = false; }

  openUp() {
    this.open = true;
    this.render();
    $('terminal').classList.remove('hidden');
  }

  closeDown() {
    this.open = false;
    $('terminal').classList.add('hidden');
  }

  private render() {
    const wrap = $('terminal');
    wrap.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'overlay-panel terminal-panel';
    const suspCount = ['r3', 'r4', 'r5'].filter((id) => this.inspected.has(id)).length;
    panel.innerHTML = `
      <div class="term-titlebar"><span>JANAPRIYA CORE v4.2 — RECONCILIATION QUEUE</span><span>JPC-07 · A. KSHAY</span></div>
      <div class="term-screen">
        <div class="term-userbar">SESSION MON 09:4${Math.floor(Math.random() * 9)} · QUEUE: FRIDAY CLOSE → MONDAY · ${TERM_ROWS.length} ENTRIES</div>
        <table class="term-table">
          <thead><tr><th>DATE</th><th>TIME</th><th>REF</th><th>ACCOUNT</th><th>DESCRIPTION</th><th style="text-align:right">AMOUNT</th></tr></thead>
          <tbody id="term-rows"></tbody>
        </table>
        <div id="term-detail" class="term-detail" style="display:none"></div>
        <div class="term-actions">
          <button id="term-report" class="term-btn primary" disabled>FILE ANOMALY REPORT (inspect flagged rows)</button>
          <button id="term-close" class="term-btn">CLOSE TERMINAL</button>
        </div>
      </div>`;
    wrap.appendChild(panel);

    const tbody = panel.querySelector('#term-rows')!;
    for (const row of TERM_ROWS) {
      const tr = document.createElement('tr');
      tr.className = 'term-row' + (this.inspected.has(row.id) ? ' inspected' : '') + (row.locked ? ' locked' : '');
      tr.innerHTML = `<td>${row.date}</td><td>${row.time}</td><td>${row.ref}</td><td>${row.account}</td><td>${row.desc}</td><td class="term-amt">${row.amount}</td>`;
      tr.addEventListener('click', () => {
        this.inspected.add(row.id);
        tr.classList.add('inspected');
        const detail = panel.querySelector('#term-detail') as HTMLElement;
        detail.style.display = 'block';
        detail.innerHTML = `<b style="color:#7fa8ff">${row.ref} · ${row.account}</b><br>${row.detail}`;
        this.cb.onInspect(row);
        const susDone = ['r3', 'r4', 'r5'].every((id) => this.inspected.has(id));
        const btn = panel.querySelector('#term-report') as HTMLButtonElement;
        if (susDone && !this.reported) {
          btn.disabled = false;
          btn.textContent = 'FILE ANOMALY REPORT — 3 STRUCTURED TRANSFERS';
        }
      });
      tbody.appendChild(tr);
    }
    void suspCount;

    panel.querySelector('#term-report')!.addEventListener('click', () => {
      if (this.reported) return;
      this.reported = true;
      this.cb.onReport();
    });
    panel.querySelector('#term-close')!.addEventListener('click', () => {
      this.closeDown();
      this.cb.onClose();
    });
  }
}

    // ── STATE ──────────────────────────────────────
    const state = {
      families: 0,
      demand: 0,
      mode: 'standby',
      log: [],
      doorTimer: null,
      doorCount: 0,
      actionsTriggered: [],
    };

    // Standard door-open time at every stop, shown for reference only.
    // Family priority adds the tiered hold ON TOP of this baseline.
    const DEFAULT_DOOR_HOLD = 45;

    // ── INLINE SVG ICONS (replace emoji) ───────────
    const ICONS = {
      check: '<svg class="ico" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      radio: '<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M4.93 19.07a10 10 0 0 1 0-14.14"/><path d="M7.76 16.24a6 6 0 0 1 0-8.48"/><path d="M16.24 7.76a6 6 0 0 1 0 8.48"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
      loader: '<svg class="ico" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>',
      bolt: '<svg class="ico" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" stroke="none"/></svg>',
      users: '<svg class="ico" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      siren: '<svg class="ico" viewBox="0 0 24 24"><path d="M7 18v-6a5 5 0 0 1 10 0v6"/><path d="M5 21a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z"/><path d="M21 12h1M18.5 4.5 18 5M2 12h1M12 2v1M4.929 4.929l.707.707"/></svg>',
      stroller: '<svg class="ico" viewBox="0 0 24 24"><path d="M3 3h2l1.5 4"/><path d="M6.5 7H20a7 7 0 0 1-7 7H9.5"/><path d="M6.5 7 9 14"/><circle cx="9" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/></svg>',
      cart: '<svg class="ico" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
      user: '<svg class="ico" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    };

    const MODES = {
      standby: {
        label: 'STANDBY',
        title: 'Awaiting Check-Ins',
        desc: 'No families detected. Standard boarding procedures apply.',
        color: '#38b6ff',
        bg: 'low',
        coach: 0,
        coachText: '',
        door: 0,
        seats: 0, bays: 0, fold: 'folded in',
        instruction: 'Please proceed normally. No family priority active.',
        alert: null,
        car: 'Any',
        section: 'General seating',
      },
      low: {
        label: 'LOW DEMAND',
        title: 'Small Section Active',
        desc: '1–2 families on platform. Small family section reserved (~25% of coach). No extra door hold needed, the standard 45s door time plus pre-positioning is enough.',
        color: '#38b6ff',
        bg: 'low',
        coach: 25,
        coachText: 'Family',
        door: 0,
        seats: 4, bays: 1, fold: '2 deployed',
        instruction: 'Families: proceed to Car 3, Door A. Priority seats reserved. Stroller bay open.',
        alert: null,
        car: 'Car 3 · Door A',
        section: 'Rows 1–4 (family section)',
      },
      medium: {
        label: 'MEDIUM DEMAND',
        title: 'Half Coach Priority',
        desc: '3–5 families on platform. Half the coach reconfigured for family priority. Door hold rises moderately, still far below the old flat value.',
        color: '#f0a500',
        bg: 'medium',
        coach: 50,
        coachText: 'Family Priority',
        door: 8,
        seats: 8, bays: 2, fold: '4 deployed',
        instruction: 'Families: proceed to Car 3. Half coach reserved. Foldable seats deployed for strollers.',
        alert: 'MEDIUM DEMAND: Half coach family priority active. Staff please proceed to Car 3.',
        car: 'Car 3',
        section: 'Rows 1–8 (half coach)',
      },
      high: {
        label: 'HIGH DEMAND',
        title: 'Full Family-Priority Coach',
        desc: '6+ families on platform. Entire coach is family-priority zone. Door hold reaches its capped maximum, never higher, regardless of how many families check in.',
        color: '#19c95a',
        bg: 'high',
        coach: 100,
        coachText: 'FULL FAMILY PRIORITY',
        door: 15,
        seats: 16, bays: 4, fold: 'all deployed',
        instruction: 'HIGH DEMAND: ALL families board Car 3. Full priority coach. Staff on standby. +15s door hold (capped).',
        alert: 'HIGH DEMAND: Full family-priority coach activated. All families proceed to Car 3.',
        car: 'Car 3 (Full Coach)',
        section: 'Entire Car 3, family zone',
      }
    };

    // ── ADAPTIVE SCHEDULE RECOVERY ─────────────────
    // Upcoming stops on the line. `base` = that stop's typical boarding demand,
    // `pad` = seconds of recovery slack already built into its timetable dwell.
    const UPCOMING_STOPS = [
      { name: 'Bank Negara', base: 52, pad: 6 },
      { name: 'Putra', base: 30, pad: 6 },
      { name: 'Sentul', base: 18, pad: 7 },
      { name: 'Titiwangsa', base: 58, pad: 5 },
      { name: 'Kampung Batu', base: 16, pad: 8 },
      { name: 'Taman Wahyu', base: 22, pad: 7 },
    ];

    // Stable per-state jitter so a given demand level always yields the same forecast
    // (no flicker), but different demand levels look different (feels live).
    function recoveryJitter(i) {
      const x = Math.sin((i + 1) * 12.9898 + state.families * 78.233) * 43758.5453;
      return (x - Math.floor(x)) * 16 - 8; // −8 … +8
    }

    // Distribute `debt` borrowed seconds across the next stops, preferring quiet ones.
    function buildRecoveryPlan(debt) {
      const stops = [];
      let remaining = debt;
      for (let i = 0; i < UPCOMING_STOPS.length && remaining > 0; i++) {
        const s = UPCOMING_STOPS[i];
        // Predicted demand = the stop's own baseline blended with the current demand
        // wave (decaying with distance) plus live jitter.
        const load = Math.max(0, Math.min(95, Math.round(
          s.base * 0.5 + state.demand * 0.5 * Math.pow(0.82, i) + recoveryJitter(i)
        )));
        const quiet = load < 38;
        // Quiet stops can give back their full slack (plus a little); busy stops
        // need most of their dwell, so they return only a small share.
        const capacity = quiet ? s.pad + 4 : Math.max(2, Math.round(s.pad * 0.5));
        const take = Math.min(remaining, capacity);
        stops.push({ name: s.name, load, quiet, sec: take });
        remaining -= take;
      }
      return { stops, recovered: debt - remaining, shortfall: Math.max(0, remaining) };
    }

    // === SHARED STATE / SYNC ============================================
    // All screens share one source of truth. If firebase-config.js set
    // window.SB_REF, state lives in the Firebase Realtime Database and every
    // device stays in sync live. Otherwise we fall back to a single-page
    // in-memory store so index.html still works offline.

    function modeForFamilies(n) {
      return n >= 6 ? 'high' : n >= 3 ? 'medium' : n >= 1 ? 'low' : 'standby';
    }

    function emptyState() {
      return { families: 0, demand: 0, mode: 'standby', log: [] };
    }

    function sharedNow() {
      return { families: state.families, demand: state.demand, mode: state.mode, log: state.log || [] };
    }

    function computeCheckIn(cur, entry) {
      cur = cur || emptyState();
      const families = Math.min(8, (cur.families || 0) + 1);
      entry.mode = modeForFamilies(families);
      const log = (cur.log || []).slice();
      log.unshift(entry);
      if (log.length > 50) log.length = 50;
      return { families, demand: Math.min(100, families * 14), mode: modeForFamilies(families), log };
    }

    function computeSim(cur, level) {
      const fam = { low: 2, medium: 4, high: 7 };
      const dem = { low: 28, medium: 55, high: 95 };
      const entry = {
        id: 'SIM-' + Math.random().toString(36).slice(-4).toUpperCase(),
        people: fam[level], equipment: 'stroller', dest: 'KL Sentral',
        ts: new Date().toLocaleTimeString(), mode: level
      };
      const log = ((cur && cur.log) || []).slice();
      log.unshift(entry);
      if (log.length > 50) log.length = 50;
      return { families: fam[level], demand: dem[level], mode: level, log };
    }

    const Store = {
      ref: null,
      init() {
        this.ref = (typeof window !== 'undefined' && window.SB_REF) ? window.SB_REF : null;
        if (this.ref) {
          this.ref.on('value', snap => applyRemote(snap.val()));
        } else {
          applyRemote(sharedNow());
        }
      },
      checkIn(entry, cb) {
        if (this.ref) {
          this.ref.transaction(cur => computeCheckIn(cur, entry), (err, committed, snap) => {
            const v = (snap && snap.val()) ? snap.val() : computeCheckIn(emptyState(), entry);
            if (cb) cb(v);
          });
        } else {
          const ns = computeCheckIn(sharedNow(), entry);
          applyRemote(ns);
          if (cb) cb(ns);
        }
      },
      sim(level) {
        if (this.ref) { this.ref.transaction(cur => computeSim(cur, level)); }
        else { applyRemote(computeSim(sharedNow(), level)); }
      },
      reset() {
        if (this.ref) { this.ref.set(emptyState()); }
        else { applyRemote(emptyState()); }
      },
    };

    function applyRemote(v) {
      v = v || emptyState();
      state.families = v.families || 0;
      state.demand = v.demand || 0;
      state.mode = v.mode || 'standby';
      state.log = v.log || [];
      renderOperator();
    }

    function renderOperator() {
      if (!document.getElementById('kpiFamilies')) return;
      updateDashboard(state.mode);
      renderLog();
      updateBoard();
      document.querySelectorAll('.sim-btn').forEach(b => b.classList.remove('sel'));
      const map = { low: 'low', medium: 'med', high: 'high' };
      if (map[state.mode]) {
        const sb = document.querySelector('.sim-btn.sb-' + map[state.mode]);
        if (sb) sb.classList.add('sel');
      }
    }

    function renderLog() {
      const list = document.getElementById('logList');
      if (!list) return;
      if (!state.log || state.log.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-dim);font-size:0.80rem;">No check-ins yet.</div>';
        return;
      }
      const colors = { low: 'blue', medium: 'amber', high: 'green' };
      const eq = { stroller: ICONS.stroller + ' Stroller', wagon: ICONS.cart + ' Wagon', both: ICONS.stroller + ICONS.cart + ' Both', none: ICONS.user + ' None' };
      list.innerHTML = state.log.slice(0, 30).map(entry => {
        const color = colors[entry.mode] || 'blue';
        return '<div class="log-item">'
          + '<div class="log-dot ' + color + '"></div>'
          + '<div class="log-info">'
          + '<div class="log-name">' + entry.id + ' · ' + entry.people + ' ' + (entry.people > 1 ? 'people' : 'person') + '</div>'
          + '<div class="log-meta">' + (eq[entry.equipment] || entry.equipment) + ' · → ' + entry.dest + '</div>'
          + '</div>'
          + '<div class="log-time">' + entry.ts + '</div>'
          + '</div>';
      }).join('');
    }

    // ── NAVIGATION ─────────────────────────────────
    function showView(id) {
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      const view = document.getElementById('view-' + id);
      if (view) view.classList.add('active');
      const tab = document.querySelector('.tab[data-view="' + id + '"]');
      if (tab) tab.classList.add('active');
      if (id === 'board') updateBoard();
    }

    // ── QR CHECK-IN LOGIC ──────────────────────────
    let scanning = false;
    let checkInDone = false;

    function triggerScan() {
      if (scanning || checkInDone) return;
      const frame = document.getElementById('qrFrame');
      frame.classList.add('scanning');
      scanning = true;
      document.getElementById('scanBtn').disabled = true;
      showStatus('info', 'Scanning QR code… activating family detection system…', ICONS.radio);
      setTimeout(() => {
        frame.classList.remove('scanning');
        scanning = false;
        document.getElementById('scanBtn').disabled = false;
        showStatus('ok', 'QR code detected! Complete the form and tap Check In to activate boarding mode.', ICONS.check);
      }, 2200);
    }

    function doCheckIn() {
      if (scanning) return;
      const btn = document.getElementById('scanBtn');
      btn.disabled = true;
      btn.innerHTML = ICONS.loader + ' Processing…';

      const frame = document.getElementById('qrFrame');
      frame.classList.add('scanning');

      setTimeout(() => {
        frame.classList.remove('scanning');
        frame.classList.add('success');
        document.getElementById('qrContent').innerHTML = '<div class="qr-success-icon"><svg class="ico" style="width:1em;height:1em;color:var(--green)" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>';

        const people = parseInt(document.getElementById('numPeople').value);
        const equipment = document.getElementById('equipment').value;
        const dest = document.getElementById('destination').value;
        const id = 'SB-' + Date.now().toString(36).toUpperCase().slice(-6);
        const ts = new Date().toLocaleTimeString();

        Store.checkIn({ id, people, equipment, dest, ts }, (ns) => {
          const m = MODES[ns.mode];
          document.getElementById('ticketId').textContent = id;
          document.getElementById('ticketMode').textContent = m.label;
          document.getElementById('ticketSection').textContent = m.section;
          document.getElementById('ticketDoor').textContent = '+' + m.door + 's extended';
          document.getElementById('ticketCar').textContent = m.car;
          document.getElementById('ticketStrip').classList.add('show');
          document.getElementById('scanForm').style.display = 'none';
          showStatus('ok', `Check-in confirmed! ${m.label} activated. Proceed to ${m.car}. Door hold: +${m.door}s (on top of 45s default, most prep happens before arrival).`, ICONS.check);
          btn.innerHTML = ICONS.check + ' Checked In · Scan Another';
          btn.disabled = false;
          btn.onclick = resetScan;
          startPrepositioning();
          checkInDone = true;
        });
      }, 1800);
    }

    // ── PRE-POSITIONING TIMELINE (v2 addition) ─────
    function startPrepositioning() {
      const panel = document.getElementById('preposPanel');
      if (!panel) return;
      panel.classList.add('show');
      document.querySelectorAll('.prepos-step').forEach(s => s.classList.remove('active'));
      const delays = [0, 1200, 2600, 4200];
      delays.forEach((d, i) => {
        setTimeout(() => {
          const step = document.querySelector(`.prepos-step[data-step="${i}"]`);
          if (step) step.classList.add('active');
        }, d);
      });
    }

    function resetScan() {
      checkInDone = false;
      const frame = document.getElementById('qrFrame');
      frame.classList.remove('success');
      document.getElementById('qrContent').innerHTML = `
    <svg class="qr-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="30" height="30" fill="none" stroke="#19c95a" stroke-width="3" rx="3"/>
      <rect x="16" y="16" width="18" height="18" fill="#19c95a" rx="2"/>
      <rect x="60" y="10" width="30" height="30" fill="none" stroke="#19c95a" stroke-width="3" rx="3"/>
      <rect x="66" y="16" width="18" height="18" fill="#19c95a" rx="2"/>
      <rect x="10" y="60" width="30" height="30" fill="none" stroke="#19c95a" stroke-width="3" rx="3"/>
      <rect x="16" y="66" width="18" height="18" fill="#19c95a" rx="2"/>
      <rect x="46" y="10" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="46" y="22" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="10" y="46" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="22" y="46" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="46" y="46" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="58" y="46" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="70" y="46" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="82" y="46" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="46" y="58" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="58" y="58" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="70" y="58" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="46" y="70" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="70" y="70" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="58" y="82" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="82" y="82" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="82" y="58" width="8" height="8" fill="#19c95a" rx="1"/>
      <rect x="34" y="46" width="8" height="8" fill="#19c95a" rx="1"/>
    </svg>`;
      document.getElementById('scanForm').style.display = 'flex';
      document.getElementById('ticketStrip').classList.remove('show');
      const prepos = document.getElementById('preposPanel');
      if (prepos) prepos.classList.remove('show');
      document.getElementById('statusMsg').classList.remove('show');
      const btn = document.getElementById('scanBtn');
      btn.innerHTML = ICONS.bolt + ' Check In · Activate Family Boarding';
      btn.onclick = doCheckIn;
    }

    function showStatus(type, msg, icon) {
      const el = document.getElementById('statusMsg');
      el.className = 'status-msg show ' + type;
      el.innerHTML = (icon ? icon + ' ' : '') + msg;
    }

    // ── DASHBOARD ──────────────────────────────────
    function updateDashboard(mode) {
      const m = MODES[mode];

      // KPIs
      document.getElementById('kpiFamilies').textContent = state.families;
      document.getElementById('kpiDemand').textContent = state.demand + '%';
      document.getElementById('kpiDoor').textContent = '+' + m.door + 's';
      document.getElementById('kpiMode').textContent = m.label;
      const ddn = document.getElementById('defaultDoorNum');
      if (ddn) ddn.textContent = DEFAULT_DOOR_HOLD + 's';

      // Demand fill
      document.getElementById('demandFill').style.width = state.demand + '%';
      document.getElementById('meterPct').textContent = state.demand + '%';

      // Mode card
      const card = document.getElementById('modeCard');
      card.className = 'mode-card ' + m.bg;
      document.getElementById('modeBadge').textContent = m.label;
      document.getElementById('modeTitle').textContent = m.title;
      document.getElementById('modeDesc').textContent = m.desc;

      // Coach capacity indicator — coach-shaped fill, scales with how many families register.
      (function () {
        const FAMILIES_PER_COACH = 6;
        const pct = state.families === 0
          ? 0
          : Math.min(100, Math.round(state.families / FAMILIES_PER_COACH * 100));
        const color = m.color || '#38b6ff';

        const svg = document.getElementById('coachSvg');
        svg.style.color = color;

        document.getElementById('coachFillRect').style.transform = 'scaleX(' + (pct / 100) + ')';

        const div = document.getElementById('coachDivider');
        div.style.transform = 'translateX(' + (382 * pct / 100) + 'px)';
        div.style.opacity = (pct === 0 || pct >= 100) ? '0' : '1';

        const pctEl = document.getElementById('coachPct');
        pctEl.textContent = pct + '%';
        pctEl.style.color = color;

        const sub = document.getElementById('coachSub');
        if (pct === 0) {
          sub.textContent = 'No families checked in — entire Car 3 open to all passengers.';
        } else if (pct >= 100) {
          sub.innerHTML = '<b>' + state.families + ' families</b> · full Car 3 is a family-priority zone — '
            + 'extra room for strollers, wagons and luggage.';
        } else {
          sub.innerHTML = '<b>' + state.families + ' families</b> · ~' + pct
            + '% of Car 3 reserved · the rest stays open to all passengers.';
        }
      })();

      // Door timer: counts the FULL door-open time (45s default first, then the family extension)
      if (mode !== 'standby') {
        startDoorTimer(DEFAULT_DOOR_HOLD + m.door, m.door);
      }

      // Schedule recovery — ADAPTIVE: predicts demand at upcoming stops and spreads the
      // borrowed door-hold seconds across the quietest ones, using their timetable slack.
      (function () {
        const debt = m.door;
        const valEl = document.getElementById('recoveryVal');
        const descEl = document.getElementById('recoveryDesc');
        const planEl = document.getElementById('recoveryPlan');
        if (!valEl) return;

        if (debt <= 0) {
          valEl.textContent = '0s';
          descEl.textContent = 'No extra door hold in this mode — nothing to recover.';
          planEl.innerHTML = '';
          return;
        }

        const plan = buildRecoveryPlan(debt);
        const used = plan.stops.filter(s => s.sec > 0);
        const n = used.length;
        valEl.textContent = '+' + debt + 's → ' + n + ' stop' + (n === 1 ? '' : 's');

        descEl.textContent = 'Predicted demand at the next stops below. The borrowed ' + debt
          + 's is repaid into spare timetable slack at the quietest ones, so net line delay stays near zero.';

        planEl.innerHTML = used.map(s =>
          '<div class="recovery-stop">'
          + '<span class="rs-name">' + s.name
          + ' <span class="rs-tag ' + (s.quiet ? 'quiet' : 'busy') + '">'
          + (s.quiet ? 'quiet · ' : 'busy · ') + s.load + '%</span></span>'
          + '<span class="rs-sec">−' + s.sec + 's</span>'
          + '</div>'
        ).join('') + (plan.shortfall > 0
          ? '<div class="recovery-shortfall">+' + plan.shortfall + 's carried over to later stops.</div>'
          : '');
      })();

      // Actions: stagger
      const actionOrder = ['qr', 'ai', 'door', 'display', 'space', 'staff'];
      const needed = mode === 'high' ? actionOrder
        : mode === 'medium' ? actionOrder.slice(0, 5)
          : mode === 'low' ? actionOrder.slice(0, 4)
            : [];
      document.querySelectorAll('.action-item').forEach(el => el.classList.remove('triggered'));
      needed.forEach((a, i) => {
        setTimeout(() => {
          const el = document.querySelector(`[data-action="${a}"]`);
          if (el) el.classList.add('triggered');
        }, i * 250);
      });

      // NOTE: log rendering is handled by the callers that actually create a
      // check-in (doCheckIn / simDemand), not here — otherwise every dashboard
      // refresh (including Reset) would re-add the most recent entry.
    }

    function startDoorTimer(total, extra) {
      if (state.doorTimer) clearInterval(state.doorTimer);
      state.doorCount = total;
      const timer = document.getElementById('doorTimer');
      const count = document.getElementById('doorCount');
      const label = document.getElementById('doorTimerLabel');
      // The door-timer UI is optional (it can be commented out in the markup);
      // if it isn't on the page, skip it instead of throwing.
      if (!timer || !count || !label) return;
      timer.classList.add('show');

      const render = () => {
        count.textContent = state.doorCount;
        // The default 45s runs first; the final `extra` seconds are the family-priority extension.
        if (extra > 0 && state.doorCount <= extra) {
          label.textContent = `family-priority hold · +${extra}s extension active`;
        } else {
          label.textContent = extra > 0
            ? `standard 45s door hold · +${extra}s family extension to follow`
            : 'standard 45s door hold';
        }
      };
      render();

      state.doorTimer = setInterval(() => {
        state.doorCount--;
        if (state.doorCount <= 0) {
          clearInterval(state.doorTimer);
          timer.classList.remove('show');
          return;
        }
        render();
      }, 1000);
    }

    // (addLogEntry removed — the log is rendered from shared state by renderLog())

    function clearLog() { Store.reset(); }

    function simDemand(level) {
      if (level === 'reset') { Store.reset(); return; }
      Store.sim(level);
    }

    // ── BOARD ──────────────────────────────────────
    function updateBoard() {
      const m = MODES[state.mode];
      const isDark = document.getElementById('view-board').classList.contains('active') || true;

      document.getElementById('boardDemandNum').textContent = state.families;
      document.getElementById('boardDemandNum').style.color = m.color;
      document.getElementById('boardDemandLabel').textContent = `families on platform · ${state.demand}% demand`;

      document.getElementById('boardMode').style.background =
        state.mode === 'high' ? 'rgba(25,201,90,0.1)' :
          state.mode === 'medium' ? 'rgba(240,165,0,0.1)' : 'rgba(56,182,255,0.07)';
      document.getElementById('boardMode').style.border =
        `1px solid ${state.mode === 'high' ? 'rgba(25,201,90,0.35)' : state.mode === 'medium' ? 'rgba(240,165,0,0.35)' : 'rgba(56,182,255,0.3)'}`;
      document.getElementById('boardModeTitle').textContent = m.label + (m.label === 'STANDBY' ? '' : ' MODE');
      document.getElementById('boardModeTitle').style.color = m.color;
      document.getElementById('boardModeDesc').textContent = m.desc;

      document.getElementById('boardDemandFill').style.width = state.demand + '%';

      const instrIcon = state.mode === 'high' ? ICONS.siren
        : (state.mode === 'low' || state.mode === 'medium') ? ICONS.users : '';
      document.getElementById('boardInstruction').innerHTML = (instrIcon ? instrIcon + ' ' : '') + m.instruction;
      document.getElementById('boardDoorHold').textContent = m.door > 0 ? '+' + m.door + 's' : '0s';
      document.getElementById('boardDoorDesc').textContent =
        m.door > 0 ? `Capped hold active. Doors stay open +${m.door}s on top of the 45s default, pre-positioning already did most of the work.`
          : 'No extra hold active. Standard 45s door timing.';

      // Coach
      const cf = document.getElementById('boardCoachFill');
      cf.style.width = m.coach + '%';
      cf.textContent = m.coachText;
      cf.style.background = state.mode === 'high' ? 'rgba(25,201,90,0.4)' :
        state.mode === 'medium' ? 'rgba(240,165,0,0.4)' :
          state.mode === 'low' ? 'rgba(56,182,255,0.4)' : 'transparent';
      cf.style.color = m.color;
      cf.style.borderRadius = m.coach === 100 ? '100px' : '100px 0 0 100px';
      document.getElementById('boardCoachPct').textContent = m.coach + '% family zone';
      document.getElementById('bdPrioritySeats').textContent = m.seats + ' reserved';
      document.getElementById('bdStrollerBays').textContent = m.bays + (m.bays === 1 ? ' bay' : ' bays') + ' open';
      document.getElementById('bdFoldSeats').textContent = m.fold;

      // Alert
      const alertEl = document.getElementById('alertStrip');
      if (m.alert) {
        alertEl.classList.add('show');
        document.getElementById('alertText').textContent = m.alert;
      } else {
        alertEl.classList.remove('show');
      }

      // Queue
      const queue = document.getElementById('boardQueue');
      if (state.log.length === 0) {
        queue.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.25);font-size:0.80rem;">Queue empty</div>';
      } else {
        const eq = { stroller: ICONS.stroller, wagon: ICONS.cart, both: ICONS.stroller + ICONS.cart, none: ICONS.user };
        queue.innerHTML = state.log.slice(0, 6).map(e => `
      <div class="board-queue-row">
        <span class="board-queue-id">${e.id}</span>
        <span class="board-queue-type">${eq[e.equipment] || ICONS.user} ${e.people} ${e.people > 1 ? 'people' : 'person'} · ${e.dest}</span>
        <span class="board-queue-time">${e.ts}</span>
      </div>`).join('');
      }
    }

    function dismissAlert() {
      document.getElementById('alertStrip').classList.remove('show');
    }

    // ── CLOCK ──────────────────────────────────────
    function updateClock() {
      const el = document.getElementById('boardClock');
      if (!el) return;
      el.textContent = new Date().toLocaleTimeString('en-MY', { hour12: false });
    }
    if (document.getElementById('boardClock')) {
      setInterval(updateClock, 1000);
      updateClock();
    }

    // Connect to shared state: Firebase if firebase-config.js set window.SB_REF,
    // otherwise an in-memory single-page store (index.html offline mode).
    Store.init();
  

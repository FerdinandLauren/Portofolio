/**
 * Decision rules for the gym attendance and locker system, used by The Decision Lab.
 *
 * These rules are a small re-implementation of what the GYM-QR PRD specifies and what the
 * Laravel services implement:
 *   - geofence + accuracy tolerance: app/Services/CheckInService.php (PRD FR-MEM-03, D6)
 *   - one open session per member:   PRD FR-MEM-04, D4
 *   - rescan guard window:           PRD §3.3, settings.rescan_guard_seconds
 *   - atomic locker assignment:      app/Services/LockerService.php (PRD FR-CAS-02, D5)
 *   - error codes:                   PRD §7.3
 *
 * The Laravel implementation remains the source of truth. This module exists so the same
 * rules can be exercised in the browser and checked by a test.
 */

/** @typedef {{status:number, code:string|null, session:'none'|'open'|'closed', locker:'none'|'pending'|'occupied'}} ScanResult */

export const SETTINGS = {
  geofenceRadiusM: 30,
  geofenceAccuracyMaxM: 150,
  rescanGuardSeconds: 300,
};

/**
 * Decide the outcome of a member's QR scan.
 * @param {{
 *   membership: 'active'|'expired'|'inactive',
 *   distanceM: number,
 *   accuracyM: number,
 *   session: 'none'|'open'|'closed',
 *   closedSecondsAgo?: number|null,
 *   wantsLocker?: boolean,
 *   qrValid?: boolean,
 *   settings?: {geofenceRadiusM:number, geofenceAccuracyMaxM:number, rescanGuardSeconds:number}
 * }} input
 * @returns {ScanResult & {reason:string}}
 */
export function decideScan(input) {
  const s = input.settings ?? SETTINGS;
  const qrValid = input.qrValid ?? true;

  if (!qrValid) {
    return { status: 400, code: 'INVALID_QR', session: input.session, locker: 'none', reason: 'QR payload does not match gym_settings.qr_payload.' };
  }
  if (input.session === 'open') {
    return { status: 409, code: 'SESSION_ACTIVE', session: 'open', locker: input.wantsLocker ? 'pending' : 'none', reason: 'One open session per member is enforced.' };
  }
  if (typeof input.closedSecondsAgo === 'number' && input.closedSecondsAgo < s.rescanGuardSeconds) {
    return { status: 429, code: 'RESCAN_GUARD', session: 'closed', locker: 'none', reason: `Rescan guard is ${s.rescanGuardSeconds} seconds.` };
  }
  if (input.accuracyM > s.geofenceAccuracyMaxM) {
    return { status: 422, code: 'GPS_ACCURACY_LOW', session: input.session, locker: 'none', reason: `Accuracy above ${s.geofenceAccuracyMaxM} m cannot be trusted for geofence.` };
  }
  if (input.distanceM > s.geofenceRadiusM + input.accuracyM) {
    return { status: 403, code: 'GEO_OUT_OF_RANGE', session: input.session, locker: 'none', reason: `Rejected when distance > radius (${s.geofenceRadiusM} m) + reported accuracy.` };
  }
  if (input.membership === 'expired') {
    return { status: 403, code: 'MEMBERSHIP_EXPIRED', session: input.session, locker: 'none', reason: 'Membership effective_status is not active.' };
  }
  if (input.membership === 'inactive') {
    return { status: 403, code: 'MEMBERSHIP_INACTIVE', session: input.session, locker: 'none', reason: 'Membership is suspended or cancelled.' };
  }
  return {
    status: 200,
    code: null,
    session: 'open',
    locker: input.wantsLocker ? 'pending' : 'none',
    reason: 'Attendance row created with checkout_time NULL.',
  };
}

/**
 * Assign a locker to an open session. Mirrors the row lock in LockerService::assign:
 * the second request for the same locker loses and receives LOCKER_TAKEN.
 * @param {{lockers: Record<string, 'available'|'occupied'>, lockerId: string, staff: string}} input
 */
export function assignLocker(input) {
  const state = input.lockers[input.lockerId];
  if (state === undefined) {
    return { ok: false, status: 404, code: 'NOT_FOUND', owner: null, reason: 'Locker id does not exist.' };
  }
  if (state === 'occupied') {
    return { ok: false, status: 409, code: 'LOCKER_TAKEN', owner: null, reason: 'Row lock held by the winning transaction; this request sees occupied.' };
  }
  input.lockers[input.lockerId] = 'occupied';
  return { ok: true, status: 200, code: null, owner: input.staff, reason: 'Transaction committed with lockForUpdate on the locker row.' };
}

/** Return a key: occupied locker becomes available again. */
export function returnLocker(input) {
  if (input.lockers[input.lockerId] !== 'occupied') {
    return { ok: false, status: 409, code: 'VALIDATION_ERROR', reason: 'Locker is not occupied.' };
  }
  input.lockers[input.lockerId] = 'available';
  return { ok: true, status: 200, code: null, reason: 'checkout_time filled, locker back to available.' };
}

/**
 * The four cases shown in The Decision Lab. Each step is one request against the rules above.
 * `evidence` says how far the claim goes: verified in code + automated test, or documented only.
 */
export const SCENARIOS = [
  {
    id: 'active',
    title: 'Active member checks in',
    question: 'What does the system do when everything is in order?',
    preconditions: ['Membership effective_status = active', 'Session closed, no recent scan', 'Scanning at the front desk, 4 m away, accuracy 12 m'],
    rules: ['FR-MEM-03 geofence with accuracy tolerance', 'FR-MEM-04 one open session per member', 'D4 rescan guard'],
    steps: [
      { label: 'Scan QR', input: { membership: 'active', distanceM: 4, accuracyM: 12, session: 'none', wantsLocker: false } },
      { label: 'Scan again while inside', input: { membership: 'active', distanceM: 4, accuracyM: 12, session: 'open', wantsLocker: false } },
    ],
    requirement: 'FR-MEM-02, FR-MEM-04',
    test: 'tests/Feature/CheckInScanTest.php',
    uat: 'AT-01, AT-06',
    edges: [
      'A second scan while the session is open is refused with 409 SESSION_ACTIVE (AT-06).',
      'Two requests carrying the same Idempotency-Key create one row, not two (AT-07).',
    ],
    evidence: 'verified',
  },
  {
    id: 'expired',
    title: 'Expired membership tries to check in',
    question: 'Is a lapsed member stopped by the server, or waved through by the desk?',
    preconditions: ['Membership ended yesterday', 'Member is standing at the desk, QR valid'],
    rules: ['D2 expired members are rejected by the server', 'FR-CAS-11 renewal alert for the cashier'],
    steps: [{ label: 'Scan QR', input: { membership: 'expired', distanceM: 3, accuracyM: 10, session: 'none' } }],
    requirement: 'FR-MEM-05, FR-CAS-11',
    test: 'tests/Feature/CheckInScanTest.php',
    uat: 'AT-10, AT-12',
    edges: [
      'No attendance row is written for a rejected scan, and an audit entry is created (AT-10).',
      'A day pass works on its first day and returns MEMBERSHIP_EXPIRED on the next (AT-12).',
    ],
    evidence: 'verified',
  },
  {
    id: 'distance',
    title: 'Scan from 500 metres away',
    question: 'Does the geofence hold when someone tries to check in from outside?',
    preconditions: ['Member active', 'Reported accuracy 15 m', 'Distance 500 m'],
    rules: ['FR-MEM-03 distance > radius + accuracy is rejected', 'D6 radius is configurable, default 30 m'],
    steps: [
      { label: 'Scan at 500 m', input: { membership: 'active', distanceM: 500, accuracyM: 15, session: 'none' } },
      { label: 'Scan with weak GPS, 300 m accuracy', input: { membership: 'active', distanceM: 5, accuracyM: 300, session: 'none' } },
    ],
    requirement: 'FR-MEM-03',
    test: 'tests/Feature/CheckInScanTest.php',
    uat: 'AT-03, AT-04',
    edges: [
      'Reported accuracy above the configured maximum returns 422 GPS_ACCURACY_LOW before distance is judged (AT-04).',
      'A payload that does not match the gym QR returns 400 INVALID_QR before location is judged (AT-05).',
    ],
    evidence: 'verified',
  },
  {
    id: 'locker',
    title: 'Two cashiers claim locker #05 at once',
    question: 'What stops two people from holding the same key?',
    preconditions: ['Locker #05 available', 'Two open sessions waiting for a locker', 'Both requests arrive together'],
    rules: ['D5 assignment is atomic: transaction + row lock', 'FR-CAS-02 assign locker'],
    steps: [{ label: 'Both cashiers assign #05', kind: 'locker', input: { lockerId: '05', staff: ['Cashier A', 'Cashier B'] } }],
    requirement: 'FR-CAS-02',
    test: 'tests/Feature/LockerAssignConcurrencyTest.php',
    uat: 'AT-08',
    edges: [
      'Returning the key sets the locker back to available and fills checkout_time (AT-09).',
      'A third request while the locker stays occupied also receives 409 LOCKER_TAKEN.',
    ],
    evidence: 'verified',
  },
];

/**
 * Run one scenario and return the frames to display: request, decision, resulting state.
 * @param {string} id
 */
export function runScenario(id) {
  const scenario = SCENARIOS.find((s) => s.id === id);
  if (!scenario) throw new Error(`Unknown scenario: ${id}`);

  const frames = [];
  for (const step of scenario.steps) {
    if (step.kind === 'locker') {
      const lockers = { '05': /** @type {'available'} */ ('available') };
      const [a, b] = step.input.staff;
      const first = assignLocker({ lockers, lockerId: step.input.lockerId, staff: a });
      const second = assignLocker({ lockers, lockerId: step.input.lockerId, staff: b });
      frames.push({
        label: step.label,
        requests: [
          { who: a, status: first.status, code: first.code, note: first.reason },
          { who: b, status: second.status, code: second.code, note: second.reason },
        ],
        state: { session: 'open', locker: 'occupied', owner: first.owner },
      });
      continue;
    }
    const result = decideScan(step.input);
    frames.push({
      label: step.label,
      requests: [{ who: 'Member', status: result.status, code: result.code, note: result.reason }],
      state: { session: result.session, locker: result.locker },
    });
  }
  return frames;
}

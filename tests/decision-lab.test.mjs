import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideScan, assignLocker, returnLocker, runScenario, SETTINGS } from '../src/lib/decision-lab.mjs';

// These assertions mirror docs/UAT.md in the GYM-QR repository. If the rules in the lab
// ever drift from the UAT plan, this test fails.

test('AT-01 active member inside the geofence opens one session', () => {
  const r = decideScan({ membership: 'active', distanceM: 4, accuracyM: 12, session: 'none' });
  assert.equal(r.status, 200);
  assert.equal(r.session, 'open');
  assert.equal(r.locker, 'none');
});

test('AT-06 second scan while a session is open is rejected', () => {
  const r = decideScan({ membership: 'active', distanceM: 4, accuracyM: 12, session: 'open' });
  assert.equal(r.status, 409);
  assert.equal(r.code, 'SESSION_ACTIVE');
});

test('AT-03 scan from 500 m is outside radius + accuracy', () => {
  const r = decideScan({ membership: 'active', distanceM: 500, accuracyM: 15, session: 'none' });
  assert.equal(r.status, 403);
  assert.equal(r.code, 'GEO_OUT_OF_RANGE');
});

test('AT-04 accuracy above the configured maximum asks for manual check-in', () => {
  const r = decideScan({ membership: 'active', distanceM: 5, accuracyM: 300, session: 'none' });
  assert.equal(r.status, 422);
  assert.equal(r.code, 'GPS_ACCURACY_LOW');
});

test('AT-10 expired member is rejected by the server', () => {
  const r = decideScan({ membership: 'expired', distanceM: 3, accuracyM: 10, session: 'none' });
  assert.equal(r.status, 403);
  assert.equal(r.code, 'MEMBERSHIP_EXPIRED');
  assert.equal(r.session, 'none');
});

test('AT-05 unknown QR payload is rejected before anything else', () => {
  const r = decideScan({ membership: 'active', distanceM: 1, accuracyM: 5, session: 'none', qrValid: false });
  assert.equal(r.status, 400);
  assert.equal(r.code, 'INVALID_QR');
});

test('rescan inside the guard window returns 429', () => {
  const r = decideScan({ membership: 'active', distanceM: 4, accuracyM: 12, session: 'closed', closedSecondsAgo: 60 });
  assert.equal(r.status, 429);
  assert.equal(r.code, 'RESCAN_GUARD');
});

test('rescan after the guard window is allowed', () => {
  const r = decideScan({ membership: 'active', distanceM: 4, accuracyM: 12, session: 'closed', closedSecondsAgo: SETTINGS.rescanGuardSeconds + 1 });
  assert.equal(r.status, 200);
});

test('AT-08 two cashiers, one locker: second request gets LOCKER_TAKEN', () => {
  const frames = runScenario('locker');
  const [first, second] = frames[0].requests;
  assert.equal(first.status, 200);
  assert.equal(second.status, 409);
  assert.equal(second.code, 'LOCKER_TAKEN');
  assert.equal(frames[0].state.owner, 'Cashier A');
});

test('AT-09 returning the key frees the locker', () => {
  const lockers = { '05': 'available' };
  assignLocker({ lockers, lockerId: '05', staff: 'Cashier A' });
  assert.equal(lockers['05'], 'occupied');
  const back = returnLocker({ lockers, lockerId: '05' });
  assert.equal(back.status, 200);
  assert.equal(lockers['05'], 'available');
});

test('every scenario in the lab runs and produces at least one frame', () => {
  for (const id of ['active', 'expired', 'distance', 'locker']) {
    const frames = runScenario(id);
    assert.ok(frames.length > 0, `${id} produced no frames`);
    for (const frame of frames) {
      assert.ok(frame.requests.every((r) => Number.isInteger(r.status)));
    }
  }
});

import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';

import { createHeartbeatRouter } from '../src/routes-heartbeat.js';

import {
  databaseFor,
  apiFor,
  addBulb,
  snapshot
} from './helpers.js';

function setup(t: TestContext) {
  const db = databaseFor(t);
  let now = 10_000;

  const api = apiFor(createHeartbeatRouter(db, () => now));

  return {
    db,

    setTime: (value: number) => {
      now = value;
    },

    heartbeat: (id: number | string) =>
      api.post('/bulbs/' + id + '/heartbeat')
  };
}

test('heartbeat rejects invalid IDs, missing bulbs, and uninstalled bulbs', async t => {
  const s = setup(t);
  addBulb(s.db);

  for (const id of ['0', '-1', '1.5', 'abc', '9007199254740992']) {
    await s.heartbeat(id).expect(400);
  }

  await s.heartbeat(999).expect(404);
  await s.heartbeat(1).expect(409);

  assert.deepEqual(snapshot(s.db).sessions, []);
});

test('heartbeat uses server time and installed position, ignoring client-supplied values', async t => {
  const s = setup(t);
  addBulb(s.db, 1, 'bedroom');

  const response = await s.heartbeat(1)
    .send({
      bulb_id: 999,
      position: 'bathroom',
      started_at: 1,
      last_seen_at: 2
    })
    .expect(201);

  assert.deepEqual(response.body, {
    created: true,
    session: {
      id: 1,
      bulb_id: 1,
      position: 'bedroom',
      started_at: 10_000,
      last_seen_at: 10_000
    }
  });

  assert.deepEqual(snapshot(s.db).sessions, [response.body.session]);
});

test('heartbeat gaps of 0 and 1000 ms continue; a 1001 ms gap starts a new session', async t => {
  const s = setup(t);
  addBulb(s.db, 1, 'bedroom');

  const first = await s.heartbeat(1).expect(201);

  // Two requests can share one millisecond.
  await s.heartbeat(1).expect(200);

  s.setTime(11_000);
  const continued = await s.heartbeat(1).expect(200);

  assert.deepEqual(continued.body, {
    created: false,
    session: {
      ...first.body.session,
      last_seen_at: 11_000
    }
  });

  // The next gap is measured from the latest heartbeat.
  s.setTime(12_001);
  const next = await s.heartbeat(1).expect(201);

  assert.equal(next.body.created, true);
  assert.notEqual(next.body.session.id, first.body.session.id);
  assert.equal(next.body.session.started_at, 12_001);
  assert.equal(next.body.session.last_seen_at, 12_001);

  assert.deepEqual(snapshot(s.db).sessions, [
    continued.body.session,
    next.body.session
  ]);
});

test('a backward clock is rejected without changing records or blocking later requests', async t => {
  const s = setup(t);
  addBulb(s.db, 1, 'bedroom');

  await s.heartbeat(1).expect(201);
  const before = snapshot(s.db);

  s.setTime(9_999);
  await s.heartbeat(1).expect(409);

  assert.deepEqual(snapshot(s.db), before);

  s.setTime(10_200);
  await s.heartbeat(1).expect(200);
});

test('heartbeats from different bulbs do not update each other’s sessions', async t => {
  const s = setup(t);

  addBulb(s.db, 1, 'bedroom');
  addBulb(s.db, 2, 'bathroom');

  await s.heartbeat(1).expect(201);

  s.setTime(10_200);
  await s.heartbeat(2).expect(201);

  s.setTime(10_400);
  await s.heartbeat(1).expect(200);

  const rows = snapshot(s.db).sessions;

  assert.equal(rows.length, 2);
  assert.equal(rows[0].last_seen_at, 10_400);
  assert.equal(rows[1].last_seen_at, 10_200);
});
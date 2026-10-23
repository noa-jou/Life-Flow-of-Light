import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLightSessionRouter } from '../src/routes-light-session.js';

import {
  databaseFor,
  apiFor,
  addBulb,
  addSession,
  addManySessions,
  snapshot
} from './helpers.js';

test('timeline includes overlaps and the start boundary, excludes the end boundary, and sorts results', async t => {
  const db = databaseFor(t);
  const api = apiFor(createLightSessionRouter(db));
  addBulb(db);

  // Fixtures deliberately arrive out of time order.
  for (const [start, last] of [
    [200, 200], // Starts at the excluded upper boundary.
    [150, 160],
    [50, 250], // Covers the entire requested range.
    [100, 100], // One heartbeat at the included lower boundary.
    [20, 99] // Ends before the range.
  ]) {
    addSession(db, 1, 'bedroom', start, last);
  }

  addSession(db, 1, 'bathroom', 120, 130);
  addSession(db, 1, 'bedroom', 30, 100);

  // Equal start times should use ID as the tie-breaker.
  addSession(db, 1, 'bedroom', 150, 170);

  const before = snapshot(db);

  for (let repeat = 0; repeat < 2; repeat++) {
    const r = await api.get('/light-sessions')
      .query({
        position: 'bedroom',
        start_time: 100,
        end_time: 200
      })
      .expect(200);

    assert.equal(r.headers['cache-control'], 'no-store');

    assert.deepEqual(r.body, {
      position: 'bedroom',
      start_time: 100,
      end_time: 200,
      sessions: [7, 3, 4, 2, 8].map(
        id => before.sessions.find(row => row.id === id)
      )
    });
  }

  // Exact row comparison also checks original timestamps and bulb_id.
  assert.deepEqual(snapshot(db), before);
});

test('empty searches succeed; invalid query parameters return 400', async t => {
  const db = databaseFor(t);
  const api = apiFor(createLightSessionRouter(db));

  const valid = {
    position: 'bedroom',
    start_time: 0,
    end_time: 200
  };

  const r = await api.get('/light-sessions')
    .query(valid)
    .expect(200);

  assert.deepEqual(r.body, {
    ...valid,
    sessions: []
  });

  for (const query of [
    {},
    { ...valid, position: 'kitchen' },
    { ...valid, start_time: -1 },
    { ...valid, start_time: '1.5' },
    { ...valid, start_time: 'abc' },
    { ...valid, start_time: 200 },
    { ...valid, start_time: 201 },
    { ...valid, end_time: '8640000000000001' },
    { ...valid, start_time: ['0', '1'] }
  ]) {
    await api.get('/light-sessions')
      .query(query)
      .expect(400);
  }
});

test('timeline returns 50000 rows but rejects 50001 rather than truncating', async t => {
  const db = databaseFor(t);
  const api = apiFor(createLightSessionRouter(db));

  addBulb(db);
  addManySessions(db, 50_000);

  const query = {
    position: 'bedroom',
    start_time: 0,
    end_time: 1_000_000
  };

  const r = await api.get('/light-sessions')
    .query(query)
    .expect(200);

  assert.equal(r.body.sessions.length, 50_000);

  addSession(db, 1, 'bedroom', 500_000, 500_000);

  const rejected = await api.get('/light-sessions')
    .query(query)
    .expect(422);

  assert.equal(typeof rejected.body.error, 'string');
  assert.equal('sessions' in rejected.body, false);

  assert.equal(
    db.prepare('SELECT COUNT(*) AS n FROM light_sessions').get()?.n,
    50_001
  );
});
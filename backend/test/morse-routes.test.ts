import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';

import { createMorseRouter } from '../src/routes-morse.js';

import {
  databaseFor,
  apiFor,
  addBulb,
  addSession,
  addMorse,
  addManySessions,
  snapshot,
  START,
  NOW
} from './helpers.js';

function setup(t: TestContext) {
  const db = databaseFor(t);

  // The real foreign key requires this bulb to exist.
  addBulb(db);

  let now = NOW;
  const api = apiFor(createMorseRouter(db, () => now));

  return {
    db,

    setTime: (value: number) => {
      now = value;
    },

    check: (body: object) =>
      api.post('/morse/check').send(body)
  };
}

const range = {
  position: 'bedroom',
  start_time: 0,
  end_time: NOW
};

test('Morse API finds HELP with exact timestamps using the real schema', async t => {
  const s = setup(t);
  const end = addMorse(s.db, '.... . .-.. .--.');

  assert.equal(end, START + 74_000);

  const before = snapshot(s.db);

  for (let repeat = 0; repeat < 2; repeat++) {
    const r = await s.check({
      ...range,
      start_time: START,
      end_time: end
    }).expect(200);

    assert.equal(r.headers['cache-control'], 'no-store');

    assert.deepEqual(r.body, {
      result: [{
        start_time: START,
        end_time: end,
        message: 'HELP',
        bulb_id: 1,
        position: 'bedroom',
      }]
    });
  }

  // Checking a message must not change bulbs or lighting records.
  assert.deepEqual(snapshot(s.db), before);
});

test('Morse API returns an empty result for no records, another position, or ordinary lighting', async t => {
  const s = setup(t);

  assert.deepEqual(
    (await s.check(range).expect(200)).body,
    { result: [] }
  );

  addMorse(s.db, '.... . .-.. .--.');

  assert.deepEqual(
    (await s.check({
      ...range,
      position: 'living_room'
    }).expect(200)).body,
    { result: [] }
  );

  addSession(s.db, 1, 'bathroom', START, START + 60_000 - 200);

  assert.deepEqual(
    (await s.check({
      ...range,
      position: 'bathroom'
    }).expect(200)).body,
    { result: [] }
  );
});

test('Morse API excludes messages outside or cut by either query boundary', async t => {
  const s = setup(t);
  const end = addMorse(s.db, '.... . .-.. .--.');

  for (const [start, finish] of [
    [0, START],
    [START + 1, end],
    [START, end - 1],
    [START + 20_000, end],
    [end, NOW]
  ]) {
    const r = await s.check({
      ...range,
      start_time: start,
      end_time: finish
    }).expect(200);

    assert.deepEqual(r.body, { result: [] });
  }
});

test('Morse API preserves word spaces and orders separate messages', async t => {
  const s = setup(t);

  const end = addMorse(s.db, '.... . .-.. .--. / -- .');
  const nextStart = end + 20_000;
  const nextEnd = addMorse(s.db, '.', nextStart);

  const r = await s.check(range).expect(200);

  assert.deepEqual(r.body, {
    result: [
      {
        start_time: START,
        end_time: end,
        message: 'HELP ME',
        bulb_id: 1,
        position: 'bedroom',
      },
      {
        start_time: nextStart,
        end_time: nextEnd,
        message: 'E',
        bulb_id: 1,
        position: 'bedroom',
      }
    ]
  });
});

test('Morse API waits at 17500 ms of final silence and returns the full message at 17501 ms', async t => {
  const s = setup(t);
  const end = addMorse(s.db, '.... . .-.. .--.');

  s.setTime(end + 17_500);

  assert.deepEqual(
    (await s.check(range).expect(200)).body,
    { result: [] }
  );

  s.setTime(end + 17_501);

  assert.deepEqual(
    (await s.check(range).expect(200)).body,
    {
      result: [{
        start_time: START,
        end_time: end,
        message: 'HELP',
        bulb_id: 1,
        position: 'bedroom',
      }]
    }
  );
});

test('Morse API rejects invalid JSON field values with 400', async t => {
  const s = setup(t);

  for (const body of [
    {},
    { ...range, position: 'kitchen' },
    { ...range, position: null },
    { ...range, start_time: '0' },
    { ...range, start_time: -1 },
    { ...range, start_time: 1.5 },
    { ...range, end_time: null },
    { ...range, end_time: 0 },
    { ...range, start_time: NOW + 1 },
    { ...range, end_time: 8_640_000_000_000_001 }
  ]) {
    const r = await s.check(body).expect(400);
    assert.equal(typeof r.body.error, 'string');
  }
});

test('Morse API accepts 50000 scanned sessions and rejects 50001', async t => {
  const s = setup(t);
  addManySessions(s.db, 50_000);

  // Short single-heartbeat records are not valid Morse pulses.
  assert.deepEqual(
    (await s.check(range).expect(200)).body,
    { result: [] }
  );

  addSession(s.db, 1, 'bedroom', 500_000, 500_000);

  const r = await s.check(range).expect(422);

  assert.equal(typeof r.body.error, 'string');
  assert.equal('result' in r.body, false);
});

test('Morse API ignores future records', async t => {
  const s = setup(t);
  addMorse(s.db, '.', NOW + 20_000);

  assert.deepEqual(
    (await s.check({
      ...range,
      end_time: NOW + 100_000
    }).expect(200)).body,
    { result: [] }
  );
});
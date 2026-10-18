import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';
import request from 'supertest';

import { createMorseRouter } from '../src/morse-routes.js';

// Fixed timestamps make tests repeatable.
// The results do not depend on today's date.
const START = Date.parse('2026-10-14T21:58:46+08:00');
const NOW = START + 10 * 60 * 1000;

// Give each test its own database and Express application.
function setup(
  t: { after: (fn: () => void) => void },
  now = NOW
) {
  // ':memory:' stores the database in memory.
  // No SQLite file is created or modified on your computer.
  const db = new DatabaseSync(':memory:');

  // Close the connection after the test, even if it fails.
  t.after(() => db.close());

  // Minimal test schema containing the columns used by this API.
  // These tests check the API, not the full production schema.
  db.exec(`
    CREATE TABLE light_sessions (
      id INTEGER PRIMARY KEY,
      lamp_id INTEGER NOT NULL,
      position TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL
    );
  `);

  const app = express();
  app.use(express.json());

  // Supply a fixed clock instead of the real current time.
  app.use(createMorseRouter(db, () => now));

  // Create lighting records from explicit Morse patterns.
  //
  // A space separates letters.
  // ' / ' separates words.
  //
  // Example:
  // '.... . .-.. .--. / -- .' means HELP ME.
  function seed(
    code: string,
    start = START,
    position = 'bedroom'
  ) {
    const insert = db.prepare(`
      INSERT INTO light_sessions
        (lamp_id, position, started_at, last_seen_at)
      VALUES (1, ?, ?, ?)
    `);

    let cursor = start;
    const words = code.split(' / ');

    for (const [wordIndex, word] of words.entries()) {
      const letters = word.split(' ');

      for (const [letterIndex, letter] of letters.entries()) {
        for (const [markIndex, mark] of [...letter].entries()) {
          // A dot lasts 2 seconds; a dash lasts 6 seconds.
          const duration = mark === '.' ? 2000 : 6000;

          // The final heartbeat arrives 200 ms before switch-off.
          insert.run(
            position,
            cursor,
            cursor + duration - 200
          );

          cursor += duration;

          // Darkness between pulses within one letter.
          if (markIndex < letter.length - 1) {
            cursor += 2000;
          }
        }

        // Darkness between letters within one word.
        if (letterIndex < letters.length - 1) {
          cursor += 6000;
        }
      }

      // Darkness between words.
      if (wordIndex < words.length - 1) {
        cursor += 14000;
      }
    }

    // Return the estimated switch-off time of the final pulse.
    return cursor;
  }

  // Send a request to the test application.
  // Supertest handles the test server; server.ts is not started.
  function check(body: object) {
    return request(app)
      .post('/morse/check')
      .send(body);
  }

  return { db, seed, check };
}

// Test 1: The known HELP pattern should produce the correct message
// and the exact expected timestamp range.
test('finds HELP with the correct start and end times', async (t) => {
  const { seed, check } = setup(t);
  const end = seed('.... . .-.. .--.');

  assert.equal(end, START + 74000);

  const response = await check({
    position: 'bedroom',
    start_time: START,
    end_time: end
  }).expect(200);

  assert.deepEqual(response.body, {
    result: [
      {
        start_time: START,
        end_time: end,
        message: 'HELP'
      }
    ]
  });
});

// Test 2: An empty database is a valid search with no matches.
test('returns an empty array when there are no records', async (t) => {
  const { check } = setup(t);

  const response = await check({
    position: 'bedroom',
    start_time: 0,
    end_time: NOW
  }).expect(200);

  assert.deepEqual(response.body, { result: [] });
});

// Test 3: Bedroom records must not appear in a living-room search.
test('does not return a message from another position', async (t) => {
  const { seed, check } = setup(t);
  seed('.... . .-.. .--.');

  const response = await check({
    position: 'living_room',
    start_time: 0,
    end_time: NOW
  }).expect(200);

  assert.deepEqual(response.body, { result: [] });
});

// Test 4: Return only complete messages inside the requested range.
test('excludes messages outside or cut by the requested range', async (t) => {
  const { seed, check } = setup(t);
  const end = seed('.... . .-.. .--.');

  const ranges = [
    [0, START],             // HELP starts at the excluded upper boundary.
    [START + 1, end],       // The beginning of H is cut off.
    [START, end - 1],       // The final pulse of P is cut off.
    [START + 20000, end],   // Earlier letters are outside the range.
    [end, NOW]             // The entire message is before the range.
  ];

  for (const [start, finish] of ranges) {
    const response = await check({
      position: 'bedroom',
      start_time: start,
      end_time: finish
    }).expect(200);

    assert.deepEqual(response.body, { result: [] });
  }
});

// Test 5: Word gaps should become spaces in the returned text.
test('preserves spaces between words: HELP ME', async (t) => {
  const { seed, check } = setup(t);
  const end = seed('.... . .-.. .--. / -- .');

  const response = await check({
    position: 'bedroom',
    start_time: START,
    end_time: end
  }).expect(200);

  assert.deepEqual(response.body, {
    result: [
      {
        start_time: START,
        end_time: end,
        message: 'HELP ME'
      }
    ]
  });
});

// Test 6: A long pause separates messages.
// A single letter is also a valid result.
test('returns separate messages in time order after a long pause', async (t) => {
  const { seed, check } = setup(t);

  const firstEnd = seed('.... . .-.. .--.');
  const secondStart = firstEnd + 20000;
  const secondEnd = seed('.', secondStart);

  const response = await check({
    position: 'bedroom',
    start_time: START,
    end_time: NOW
  }).expect(200);

  assert.deepEqual(response.body, {
    result: [
      {
        start_time: START,
        end_time: firstEnd,
        message: 'HELP'
      },
      {
        start_time: secondStart,
        end_time: secondEnd,
        message: 'E'
      }
    ]
  });
});

// Test 7: A normal one-minute lighting session is neither a dot
// nor a dash under our supported timing.
test('normal long lighting is not a Morse letter', async (t) => {
  const { db, check } = setup(t);

  db.prepare(`
    INSERT INTO light_sessions
    VALUES (1, 1, 'bedroom', ?, ?)
  `).run(
    START,
    START + 60000 - 200
  );

  const response = await check({
    position: 'bedroom',
    start_time: 0,
    end_time: NOW
  }).expect(200);

  assert.deepEqual(response.body, { result: [] });
});

// Test 8: Invalid requests are different from valid searches
// that simply have no results.
test('rejects invalid inputs with 400 rather than an empty success', async (t) => {
  const { check } = setup(t);

  const valid = {
    position: 'bedroom',
    start_time: START,
    end_time: NOW
  };

  // Copy the valid request, then change one field for each case.
  const invalid = [
    {},
    { ...valid, position: 'kitchen' },
    { ...valid, start_time: String(START) },
    { ...valid, start_time: -1 },
    { ...valid, start_time: 1.5 },
    { ...valid, end_time: null },
    { ...valid, end_time: START },
    { ...valid, end_time: START - 1 }
  ];

  for (const body of invalid) {
    const response = await check(body).expect(400);

    assert.equal(
      typeof response.body.error,
      'string'
    );
  }
});

// Test 9: Wait for the required silence before treating
// the last sentence as finished.
test('waits for the final silence instead of returning an unfinished sentence', async (t) => {
  // HELP lasts 74 seconds.
  // The test clock allows only 10 seconds of silence afterward,
  // which is shorter than the required 17.5 seconds.
  const { seed, check } = setup(
    t,
    START + 74000 + 10000
  );

  seed('.... . .-.. .--.');

  const response = await check({
    position: 'bedroom',
    start_time: START,
    end_time: NOW
  }).expect(200);

  assert.deepEqual(response.body, { result: [] });
});

// Test 10: Checking for messages must not modify stored sessions.
test('repeated checks leave every stored session unchanged', async (t) => {
  const { db, seed, check } = setup(t);
  seed('.... . .-.. .--.');

  const before = db.prepare(`
    SELECT * FROM light_sessions ORDER BY id
  `).all();

  const body = {
    position: 'bedroom',
    start_time: 0,
    end_time: NOW
  };

  await check(body).expect(200);
  await check(body).expect(200);

  const after = db.prepare(`
    SELECT * FROM light_sessions ORDER BY id
  `).all();

  assert.deepEqual(after, before);
});
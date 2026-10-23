import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { TestContext } from 'node:test';
import express, { type Router } from 'express';
import request from 'supertest';

export type Position = 'bedroom' | 'bathroom' | 'living_room';

// Read the real schema. Never import src/database.ts in these tests:
// that module opens the application's saved database.
const schema = readFileSync(
  new URL('../schema.sql', import.meta.url),
  'utf8'
);

export function databaseFor(t: TestContext) {
  const db = new DatabaseSync(':memory:');

  // Close the connection even when a test fails.
  t.after(() => db.close());

  db.exec(schema);
  return db;
}

// Each test chooses the router it wants to exercise.
export function apiFor(router: Router) {
  const app = express();
  app.use(express.json());
  app.use(router);

  return request(app);
}

export function addBulb(
  db: DatabaseSync,
  id = 1,
  position: Position | null = null
) {
  db.prepare(`
    INSERT INTO bulbs (id, serial_number, name, position)
    VALUES (?, ?, ?, ?)
  `).run(id, `serial-${id}`, `Bulb ${id}`, position);
}

// Direct inserts prepare fixtures; they do not test POST /bulbs.
export function addSession(
  db: DatabaseSync,
  bulbId: number,
  position: Position,
  start: number,
  last: number
) {
  db.prepare(`
    INSERT INTO light_sessions (
      bulb_id, position, started_at, last_seen_at
    )
    VALUES (?, ?, ?, ?)
  `).run(bulbId, position, start, last);
}

export function snapshot(db: DatabaseSync) {
  // Plain objects make database snapshots easy to compare.
  return {
    bulbs: db.prepare('SELECT * FROM bulbs ORDER BY id')
      .all()
      .map(row => ({ ...row })),

    sessions: db.prepare('SELECT * FROM light_sessions ORDER BY id')
      .all()
      .map(row => ({ ...row }))
  };
}

// Fixed times make tests independent of today's date.
export const START = 1_000_000;
export const NOW = START + 3_600_000;

// A space separates letters; " / " separates words.
// Example: ".... . .-.. .--. / -- ." means HELP ME.
export function addMorse(
  db: DatabaseSync,
  code: string,
  start = START,
  bulbId = 1,
  position: Position = 'bedroom'
) {
  let cursor = start;
  const words = code.split(' / ');

  for (const [wordIndex, word] of words.entries()) {
    const letters = word.split(' ');

    for (const [letterIndex, letter] of letters.entries()) {
      for (const [markIndex, mark] of [...letter].entries()) {
        const duration = mark === '.' ? 2_000 : 6_000;

        // The final simulated heartbeat is 200 ms before switch-off.
        addSession(
          db,
          bulbId,
          position,
          cursor,
          cursor + duration - 200
        );

        cursor += duration;

        if (markIndex < letter.length - 1) cursor += 2_000;
      }

      if (letterIndex < letters.length - 1) cursor += 6_000;
    }

    if (wordIndex < words.length - 1) cursor += 14_000;
  }

  return cursor;
}

// Insert many rows in one transaction to test the API's result limit.
export function addManySessions(db: DatabaseSync, count: number) {
  const insert = db.prepare(`
    INSERT INTO light_sessions (
      bulb_id, position, started_at, last_seen_at
    )
    VALUES (1, 'bedroom', ?, ?)
  `);

  db.exec('BEGIN');

  try {
    for (let i = 0; i < count; i++) {
      insert.run(i * 10, i * 10);
    }

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
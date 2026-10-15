import { randomUUID } from 'node:crypto';
import { database } from './database.js';

// Find today's calendar date in UTC+08:00,
// regardless of the computer's local timezone.
const offsetMs = 8 * 60 * 60 * 1000;
const localNow = new Date(Date.now() + offsetMs);

const today = Date.UTC(
  localNow.getUTCFullYear(),
  localNow.getUTCMonth(),
  localNow.getUTCDate()
);

// Generate the previous three complete calendar days, oldest first.
// Today is excluded because it may not have finished yet.
const dayMs = 24 * 60 * 60 * 1000;
const days = [3, 2, 1].map((daysAgo) =>
  new Date(today - daysAgo * dayMs).toISOString().slice(0, 10)
);
const heartbeatMs = 200;
const unitMs = 2_000;
const help = ['....', '.', '.-..', '.--.']; // H E L P
type Position = 'living_room' | 'bedroom' | 'bathroom';

function at(day: string, time: string): number {
  return Date.parse(`${day}T${time}+08:00`);
}

let transactionOpen = false;

try {
  // Lock before checking emptiness, so another writer cannot race this seed.
  database.exec('BEGIN IMMEDIATE');
  transactionOpen = true;

  const counts = database.prepare(`
    SELECT (SELECT COUNT(*) FROM lamps) AS lamps,
           (SELECT COUNT(*) FROM light_sessions) AS sessions
  `).get() as { lamps: number; sessions: number };

  // Never delete or silently modify existing demo or user records.
  if (counts.lamps !== 0 || counts.sessions !== 0) {
    throw new Error('Seed cancelled: the database must be empty. Existing data was preserved.');
  }

  const insertLamp = database.prepare(
    'INSERT INTO lamps (serial_number, name, position) VALUES (?, ?, ?)'
  );
  const insertSession = database.prepare(`
    INSERT INTO light_sessions (lamp_id, position, started_at, last_seen_at)
    VALUES (?, ?, ?, ?)
  `);

  function register(name: string, position: Position) {
    const serialNumber = randomUUID();
    const result = insertLamp.run(serialNumber, name, position);
    return { id: Number(result.lastInsertRowid), position, name };
  }

  const a = register('A', 'living_room');
  const b = register('B', 'bedroom');
  const c = register('C', 'bathroom');
  let sessionCount = 0;

  function record(lamp: typeof a, start: number, off: number) {
    if (off <= start || (off - start) % heartbeatMs !== 0) {
      throw new Error('Invalid simulated lighting interval.');
    }
    // Simulate heartbeats at start, start+200ms, ..., off-200ms.
    // Store the resulting session, not a separate row for every heartbeat.
    // The switch-off instant itself does not send a heartbeat.
    insertSession.run(lamp.id, lamp.position, start, off - heartbeatMs);
    sessionCount += 1;
  }

  // Standard Morse timing: dot=1 unit, dash=3, symbol gap=1,
  // letter gap=3. A 2-second unit keeps every gap above the 1-second timeout.
  const helpUnits = help.reduce((total, letter) => {
    const onUnits = [...letter].reduce((sum, mark) => sum + (mark === '.' ? 1 : 3), 0);
    return total + onUnits + letter.length - 1;
  }, 0) + (help.length - 1) * 3;
  const helpEnd = at(days[2], '22:00:00');
  const helpStart = helpEnd - helpUnits * unitMs;

  for (const [index, day] of days.entries()) {
    for (const lamp of [a, b, c]) {
      record(lamp, at(day, '07:00:00'), at(day, '08:30:00'));
    }
    for (const lamp of [a, c]) {
      record(lamp, at(day, '18:00:00'), at(day, '21:00:00'));
    }

    // On day 3, replace the final part of B's normal evening session
    // with a 6-second dark gap followed by HELP, ending exactly at 22:00.
    const eveningOff = index === 2 ? helpStart - 3 * unitMs : at(day, '22:00:00');
    record(b, at(day, '21:00:00'), eveningOff);
  }

  let cursor = helpStart;
  for (const [letterIndex, letter] of help.entries()) {
    for (const [markIndex, mark] of [...letter].entries()) {
      const off = cursor + (mark === '.' ? 1 : 3) * unitMs;
      record(b, cursor, off);
      cursor = off;
      if (markIndex < letter.length - 1) cursor += unitMs;
    }
    if (letterIndex < help.length - 1) cursor += 3 * unitMs;
  }

  if (cursor !== helpEnd || sessionCount !== 31) {
    throw new Error('Unexpected demo schedule. All inserted records will be rolled back.');
  }

  database.exec('COMMIT');
  transactionOpen = false;
  console.log(`Created 3 lamps and ${sessionCount} lighting sessions.`);
  console.log(`Demo dates: ${days.join(', ')} (three complete days, UTC+08:00).`);
  console.log('Day 3: B turns off at 21:58:40; HELP runs 21:58:46–22:00:00.');
  console.log('Dark periods have no session rows. No live heartbeat sender was started.');
} catch (error) {
  if (transactionOpen) database.exec('ROLLBACK');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  database.close();
}

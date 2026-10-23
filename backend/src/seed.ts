import { randomUUID } from 'node:crypto';
import { database } from './database.js';

type Position = 'living_room' | 'bedroom' | 'bathroom';

type DemoBulb = {
  id: number;
  position: Position;
  name: string;
};

// Read the current time once, so every calculation uses the same date.
const now = new Date();

// Use the local timezone of the computer running this script.
// There is no fixed UTC offset in this seed.
const timezone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'system local timezone';

// Generate the previous three complete calendar days, oldest first.
// Today is excluded because it may not have finished yet.
//
// The Date constructor uses local calendar values.
// It also handles month and year boundaries automatically.
//
// Use calendar dates rather than subtracting 24-hour blocks:
// a local day can be shorter or longer during daylight-saving changes.
//
// Noon is only a convenient reference point for each date.
// The actual lighting times are created separately by at().
const days = [3, 2, 1].map(
  (daysAgo) =>
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - daysAgo,
      12
    )
);

const heartbeatMs = 200;
const unitMs = 2_000;
const help = ['....', '.', '.-..', '.--.']; // H E L P

// Convert a local calendar date and clock time into Unix milliseconds.
//
// For example, at(day, 7) means 07:00 on that local date.
// JavaScript applies the timezone offset for that date automatically.
function at(
  day: Date,
  hour: number,
  minute = 0,
  second = 0
): number {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hour,
    minute,
    second,
    0
  ).getTime();
}

// Format a local date for the terminal output.
//
// Do not use toISOString() here: it formats in UTC and could display
// a different calendar date from the one used by this local schedule.
function formatDay(day: Date): string {
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, '0');
  const date = String(day.getDate()).padStart(2, '0');

  return `${year}-${month}-${date}`;
}

let transactionOpen = false;

try {
  // Start a write transaction before checking whether the database is empty.
  // This prevents another writer from inserting records between our check
  // and the demo inserts.
  database.exec('BEGIN IMMEDIATE');
  transactionOpen = true;

  const counts = database.prepare(`
    SELECT
      (SELECT COUNT(*) FROM bulbs) AS bulbs,
      (SELECT COUNT(*) FROM light_sessions) AS sessions
  `).get() as { bulbs: number; sessions: number };

  // Never delete or silently replace existing demo or user records.
  if (counts.bulbs !== 0 || counts.sessions !== 0) {
    throw new Error(
      'Seed cancelled: the database must be empty. Existing data was preserved.'
    );
  }

  // Prepare reusable INSERT statements.
  // The question marks are placeholders for values supplied by .run().
  const insertBulb = database.prepare(`
    INSERT INTO bulbs (serial_number, name, position)
    VALUES (?, ?, ?)
  `);

  const insertSession = database.prepare(`
    INSERT INTO light_sessions (
      bulb_id,
      position,
      started_at,
      last_seen_at
    )
    VALUES (?, ?, ?, ?)
  `);

  function register(name: string, position: Position): DemoBulb {
    // Each demo bulb gets its own permanent, random serial number.
    // A, B, and C are display names, not serial numbers.
    const serialNumber = randomUUID();

    const result = insertBulb.run(serialNumber, name, position);

    return {
      id: Number(result.lastInsertRowid),
      position,
      name
    };
  }

  const a = register('A', 'living_room');
  const b = register('B', 'bedroom');
  const c = register('C', 'bathroom');

  let sessionCount = 0;

  function record(
    bulb: DemoBulb,
    start: number,
    off: number
  ): void {
    // Check that the interval is valid and fits our heartbeat schedule.
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(off) ||
      start < 0 ||
      off <= start ||
      (off - start) % heartbeatMs !== 0
    ) {
      throw new Error('Invalid simulated lighting interval.');
    }

    // Simulate heartbeats at:
    // start, start + 200 ms, ..., off - 200 ms.
    //
    // The switch-off instant itself does not send a heartbeat.
    // Store one session row, not a separate row for every heartbeat.
    insertSession.run(
      bulb.id,
      bulb.position,
      start,
      off - heartbeatMs
    );

    sessionCount += 1;
  }

  // Morse timing:
  // dot = 1 unit, dash = 3 units,
  // gap within a letter = 1 unit, gap between letters = 3 units.
  //
  // A 2-second unit keeps every dark gap longer than the
  // backend's planned 1-second heartbeat timeout.
  const helpUnits = help.reduce((total, letter) => {
    const onUnits = [...letter].reduce(
      (sum, mark) => sum + (mark === '.' ? 1 : 3),
      0
    );

    const withinLetterGapUnits = letter.length - 1;

    return total + onUnits + withinLetterGapUnits;
  }, 0) + (help.length - 1) * 3;

  // HELP finishes at 22:00 on the third demo day, in local time.
  // Its 37 units take 74 seconds, so it starts at 21:58:46.
  const helpEnd = at(days[2], 22);
  const helpStart = helpEnd - helpUnits * unitMs;

  for (const [index, day] of days.entries()) {
    // Every morning: all three bulbs are on from 07:00 to 08:30.
    for (const bulb of [a, b, c]) {
      record(bulb, at(day, 7), at(day, 8, 30));
    }

    // Every evening: A and C are on from 18:00 to 21:00.
    for (const bulb of [a, c]) {
      record(bulb, at(day, 18), at(day, 21));
    }

    // B is normally on from 21:00 to 22:00.
    //
    // On day 3, stop the normal session at 21:58:40.
    // Leave a 6-second dark gap before the HELP message.
    const eveningOff =
      index === 2
        ? helpStart - 3 * unitMs
        : at(day, 22);

    record(b, at(day, 21), eveningOff);
  }

  // Insert the individual flashes of HELP for bulb B.
  let cursor = helpStart;

  for (const [letterIndex, letter] of help.entries()) {
    for (const [markIndex, mark] of [...letter].entries()) {
      const duration = (mark === '.' ? 1 : 3) * unitMs;
      const off = cursor + duration;

      record(b, cursor, off);
      cursor = off;

      // Add a dark gap between signals within the same letter.
      if (markIndex < letter.length - 1) {
        cursor += unitMs;
      }
    }

    // Add a dark gap between letters, but not after the final letter.
    if (letterIndex < help.length - 1) {
      cursor += 3 * unitMs;
    }
  }

  // Expect 18 ordinary sessions and 13 Morse flashes.
  // Any mismatch cancels the transaction instead of saving partial data.
  if (cursor !== helpEnd || sessionCount !== 31) {
    throw new Error(
      'Unexpected demo schedule. All inserted records will be rolled back.'
    );
  }

  // Save all three bulbs and all sessions together.
  database.exec('COMMIT');
  transactionOpen = false;

  console.log(`Created 3 bulbs and ${sessionCount} lighting sessions.`);
  console.log(`Schedule timezone: ${timezone}.`);
  console.log(
    `Demo dates: ${days.map(formatDay).join(', ')} ` +
    '(previous three complete local calendar days).'
  );
  console.log(
    'Day 3, local time: B turns off at 21:58:40; ' +
    'HELP runs 21:58:46–22:00:00.'
  );
  console.log('Database timestamps are Unix milliseconds.');
  console.log(
    'Dark periods have no session rows. No live heartbeat sender was started.'
  );
} catch (error) {
  // Undo all demo inserts if anything fails before COMMIT.
  if (transactionOpen) {
    database.exec('ROLLBACK');
  }

  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  // Release the database connection whether the seed succeeds or fails.
  database.close();
}
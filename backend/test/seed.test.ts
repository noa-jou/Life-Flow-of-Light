import assert from 'node:assert/strict';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';

import {
  detectMorse,
  type LightSession
} from '../src/morse.js';

import { snapshot } from './helpers.js';
import { projectFor } from './project-helper.js';

// Set the child process clock before importing seed.ts.
// Production code is copied unchanged.
function seedScript(iso: string) {
  return `
    const RealDate = Date;
    const fixed = RealDate.parse(${JSON.stringify(iso)});

    globalThis.Date = class extends RealDate {
      constructor(...args) {
        super(...(args.length ? args : [fixed]));
      }

      static now() {
        return fixed;
      }
    };

    await import('./src/seed.ts');
  `;
}

for (const example of [
  {
    timezone: 'Asia/Hong_Kong',
    now: '2026-01-02T12:00:00+08:00',
    dates: ['2025-12-30', '2025-12-31', '2026-01-01'],
    offsets: ['+08:00', '+08:00', '+08:00']
  },
  {
    timezone: 'America/New_York',
    now: '2026-03-10T12:00:00-04:00',
    dates: ['2026-03-07', '2026-03-08', '2026-03-09'],
    offsets: ['-05:00', '-04:00', '-04:00']
  }
]) {
  test(
    'seed creates the previous three local days in ' + example.timezone,
    t => {
      const project = projectFor(t);
      const script = seedScript(example.now);

      const result = project.run(script, example.timezone);

      assert.equal(
        result.status,
        0,
        result.stderr || String(result.error)
      );

      assert.match(
        result.stdout,
        /Created 3 bulbs and 31 lighting sessions/
      );

      // Inspect only the temporary database created by this test.
      const db = new DatabaseSync(
        join(project.directory, 'data/life-flow-of-light.sqlite'),
        { readOnly: true }
      );

      t.after(() => db.close());

      const before = snapshot(db);

      assert.deepEqual(
        before.bulbs.map(row => [row.name, row.position]),
        [
          ['A', 'living_room'],
          ['B', 'bedroom'],
          ['C', 'bathroom']
        ]
      );

      assert.equal(before.sessions.length, 31);

      // Expected offsets are explicit, independent of the seed's date logic.
      const at = (day: number, time: string) =>
        Date.parse(
          example.dates[day] + 'T' + time + example.offsets[day]
        );

      // Check every ordinary interval, including the shortened third evening.
      for (let day = 0; day < 3; day++) {
        for (const bulb of before.bulbs) {
          const morning = before.sessions.find(row =>
            row.bulb_id === bulb.id &&
            row.started_at === at(day, '07:00:00')
          );

          assert.equal(
            morning?.last_seen_at,
            at(day, '08:30:00') - 200
          );

          const bedroom = bulb.position === 'bedroom';
          const start = bedroom ? '21:00:00' : '18:00:00';

          const off = bedroom
            ? (day === 2 ? '21:58:40' : '22:00:00')
            : '21:00:00';

          const evening = before.sessions.find(row =>
            row.bulb_id === bulb.id &&
            row.started_at === at(day, start)
          );

          assert.equal(
            evening?.last_seen_at,
            at(day, off) - 200
          );
        }
      }

      const bedroom = before.sessions.filter(
        row => row.position === 'bedroom'
      );

      assert.deepEqual(
        detectMorse(
          bedroom as unknown as LightSession[],
          0,
          Date.parse(example.now),
          Date.parse(example.now)
        ),
        [{
          start_time: at(2, '21:58:46'),
          end_time: at(2, '22:00:00'),
          message: 'HELP'
        }]
      );

      // A second run must refuse to overwrite data, even on a different day.
      const repeated = project.run(
        seedScript('2026-04-01T12:00:00Z'),
        example.timezone
      );

      assert.equal(repeated.status, 1);
      assert.match(repeated.stderr, /database must be empty/);
      assert.deepEqual(snapshot(db), before);
    }
  );
}
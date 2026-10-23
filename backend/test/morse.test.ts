import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  detectMorse,
  type LightSession
} from '../src/morse.js';

// These tests call the decoder directly:
// no HTTP server or database is needed.
//
// Keep expected patterns independent of the production lookup table.
const letters = [
  ['A', '.-'],
  ['B', '-...'],
  ['C', '-.-.'],
  ['D', '-..'],
  ['E', '.'],
  ['F', '..-.'],
  ['G', '--.'],
  ['H', '....'],
  ['I', '..'],
  ['J', '.---'],
  ['K', '-.-'],
  ['L', '.-..'],
  ['M', '--'],
  ['N', '-.'],
  ['O', '---'],
  ['P', '.--.'],
  ['Q', '--.-'],
  ['R', '.-.'],
  ['S', '...'],
  ['T', '-'],
  ['U', '..-'],
  ['V', '...-'],
  ['W', '.--'],
  ['X', '-..-'],
  ['Y', '-.--'],
  ['Z', '--..']
];

function pulse(
  id: number,
  start: number,
  duration: number,
  bulbId = 1
): LightSession {
  return {
    id,
    bulb_id: bulbId,
    position: 'bedroom',
    started_at: start,
    last_seen_at: start + duration - 200
  };
}

test('decoder recognizes all 26 English letters', () => {
  for (const [letter, code] of letters) {
    let cursor = 10_000;

    const rows = [...code].map((mark, index) => {
      const duration = mark === '.' ? 2_000 : 6_000;
      const row = pulse(index + 1, cursor, duration);

      cursor += duration + 2_000;
      return row;
    });

    assert.deepEqual(
      detectMorse(rows, 0, 1_000_000, 1_000_000),
      [{
        start_time: 10_000,
        end_time: cursor - 2_000,
        message: letter
      }],
      letter
    );
  }
});

test('decoder accepts dot/dash tolerance boundaries and rejects durations just outside them', () => {
  for (const [duration, message] of [
    [1_500, 'E'],
    [2_500, 'E'],
    [4_500, 'T'],
    [7_500, 'T']
  ] as const) {
    const result = detectMorse(
      [pulse(1, 10_000, duration)],
      0,
      100_000,
      100_000
    );

    assert.equal(result[0]?.message, message);
  }

  for (const duration of [1_499, 2_501, 4_499, 7_501]) {
    assert.deepEqual(
      detectMorse(
        [pulse(1, 10_000, duration)],
        0,
        100_000,
        100_000
      ),
      []
    );
  }
});

test('decoder distinguishes symbol, letter, and word gaps at their tolerance boundaries', () => {
  for (const [gap, messages] of [
    [1_500, ['I']],
    [2_500, ['I']],
    [4_500, ['EE']],
    [7_500, ['EE']],
    [10_500, ['E E']],
    [17_500, ['E E']],
    [17_501, ['E', 'E']]
  ] as const) {
    const rows = [
      pulse(1, 10_000, 2_000),
      pulse(2, 12_000 + gap, 2_000)
    ];

    assert.deepEqual(
      detectMorse(rows, 0, 100_000, 100_000)
        .map(r => r.message),
      [...messages],
      'gap = ' + gap
    );
  }
});

test('decoder never combines different bulbs into one letter or message', () => {
  // Six seconds would join two E letters from the same bulb.
  const rows = [
    pulse(1, 10_000, 2_000, 1),
    pulse(2, 18_000, 2_000, 2)
  ];

  assert.deepEqual(
    detectMorse(rows, 0, 100_000, 100_000),
    [
      {
        start_time: 10_000,
        end_time: 12_000,
        message: 'E'
      },
      {
        start_time: 18_000,
        end_time: 20_000,
        message: 'E'
      }
    ]
  );
});

test('decoder rejects unknown patterns, overlapping pulses, and inconsistent timestamps', () => {
  // Six dots are not one of the supported English letters.
  const unknown = Array.from(
    { length: 6 },
    (_, i) => pulse(i + 1, 10_000 + i * 4_000, 2_000)
  );

  assert.deepEqual(
    detectMorse(unknown, 0, 100_000, 100_000),
    []
  );

  assert.deepEqual(
    detectMorse(
      [
        pulse(1, 10_000, 2_000),
        pulse(2, 11_000, 2_000)
      ],
      0,
      100_000,
      100_000
    ),
    []
  );

  const broken = {
    ...pulse(1, 10_000, 2_000),
    last_seen_at: 9_999
  };

  assert.deepEqual(
    detectMorse([broken], 0, 100_000, 100_000),
    []
  );

  assert.deepEqual(
    detectMorse(
      [pulse(1, 100_000, 2_000)],
      0,
      200_000,
      100_000
    ),
    []
  );
});

test('invalid long lighting separates messages rather than joining them', () => {
  const rows = [
    pulse(1, 10_000, 2_000),
    pulse(2, 18_000, 60_000),
    pulse(3, 84_000, 2_000)
  ];

  assert.deepEqual(
    detectMorse(rows, 0, 200_000, 200_000)
      .map(r => r.message),
    ['E', 'E']
  );
});

test('decoder sorts a copy and does not modify the caller’s records', () => {
  const rows = [
    pulse(2, 18_000, 2_000),
    pulse(1, 10_000, 2_000)
  ];

  const before = structuredClone(rows);

  assert.deepEqual(
    detectMorse(rows, 0, 100_000, 100_000),
    [{
      start_time: 10_000,
      end_time: 20_000,
      message: 'EE'
    }]
  );

  assert.deepEqual(rows, before);
});
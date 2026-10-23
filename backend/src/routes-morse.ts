import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';

import {
  detectMorse,
  MESSAGE_GAP_MS,
  type LightSession
} from './morse.js';

// Only these three positions are supported.
const POSITIONS = [
  'bedroom',
  'bathroom',
  'living_room'
];

// The maximum timestamp supported by JavaScript Date.
const MAX_TIMESTAMP = 8_640_000_000_000_000;

// Prevent a single request from loading too many records.
const MAX_SESSIONS = 50_000;

// Accept a JSON number representing Unix milliseconds.
//
// Reject strings, negative numbers, decimals, and values
// outside the supported timestamp range.
function isTimestamp(value: unknown): value is number {
  return (
    typeof value === 'number'
    && Number.isSafeInteger(value)
    && value >= 0
    && value <= MAX_TIMESTAMP
  );
}

// Receive the database connection from server.ts.
// Tests can pass a separate database and a fixed clock.
export function createMorseRouter(
  database: DatabaseSync,
  clock = Date.now
) {
  const router = Router();

  // POST allows the frontend to send search conditions as JSON.
  // This endpoint only reads data; it does not modify records.
  router.post('/morse/check', (request, response) => {
    // Treat incoming values as unknown until validated.
    const position: unknown = request.body?.position;
    const startTime: unknown = request.body?.start_time;
    const endTime: unknown = request.body?.end_time;

    if (
      typeof position !== 'string'
      || !POSITIONS.includes(position)
    ) {
      response.status(400).json({
        error: 'Invalid position.'
      });
      return;
    }

    if (
      !isTimestamp(startTime)
      || !isTimestamp(endTime)
    ) {
      response.status(400).json({
        error:
          'start_time and end_time must be non-negative Unix millisecond integers.'
      });
      return;
    }

    if (startTime >= endTime) {
      response.status(400).json({
        error: 'start_time must be earlier than end_time.'
      });
      return;
    }

    const now = clock();

    // Read nearby context outside the requested time range.
    //
    // Without context, a query beginning halfway through HELP
    // might incorrectly return only LP as a complete message.
    //
    // The detector still returns only messages fully contained
    // in the user's requested range.
    const scanStart = Math.max(
      0,
      startTime - MESSAGE_GAP_MS - 200
    );

    const scanEnd = Math.min(
      MAX_TIMESTAMP,
      endTime + MESSAGE_GAP_MS
    );

    try {
      // Search the position saved in each historical session.
      // A bulb's current position may have changed since then.
      //
      // Keep complete session times. Do not cut the durations
      // to fit the requested range.
      //
      // The ? placeholders receive values from .all() below.
      const rows = database.prepare(`
        SELECT
          id,
          bulb_id,
          position,
          started_at,
          last_seen_at
        FROM light_sessions
        WHERE position = ?
          AND started_at <= ?
          AND started_at <= ?
          AND last_seen_at >= ?
        ORDER BY started_at, id
        LIMIT ?
      `).all(
        position,
        scanEnd,
        now,
        scanStart,
        MAX_SESSIONS + 1
      ) as unknown as LightSession[];

      // Read one extra row to detect whether the limit was exceeded.
      // Never silently return results from an incomplete scan.
      if (rows.length > MAX_SESSIONS) {
        response.status(422).json({
          error:
            'Too many sessions. Please choose a shorter time range.'
        });
        return;
      }

      const result = detectMorse(
        rows,
        startTime,
        endTime,
        now
      );

      // Ask clients not to reuse an old cached response.
      response.set('Cache-Control', 'no-store');

      // An empty result is a successful search, not an error.
      response.status(200).json({ result });
    } catch (error) {
      console.error('Failed to check Morse patterns:', error);

      response.status(500).json({
        error: 'Unable to check for Morse patterns.'
      });
    }
  });

  return router;
}
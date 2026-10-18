import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';

type Position = 'bedroom' | 'bathroom' | 'living_room';

type LightSession = {
  id: number;
  lamp_id: number;
  position: Position;
  started_at: number;
  last_seen_at: number;
};

// Keep timestamps within JavaScript's supported Date range.
const maxTimestamp = 8_640_000_000_000_000;

// Do not silently return only part of a timeline.
// If too many rows match, ask the caller to choose a shorter range.
const maxSessions = 50_000;

function isPosition(value: unknown): value is Position {
  return (
    value === 'bedroom' ||
    value === 'bathroom' ||
    value === 'living_room'
  );
}

// URL query parameters arrive as strings, not JSON numbers.
//
// Reject missing values, arrays, objects, negative numbers,
// fractions, and other non-numeric input.
function parseTimestamp(value: unknown): number | undefined {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return undefined;
  }

  const timestamp = Number(value);

  if (
    !Number.isSafeInteger(timestamp) ||
    timestamp < 0 ||
    timestamp > maxTimestamp
  ) {
    return undefined;
  }

  return timestamp;
}

export function createLightSessionRouter(database: DatabaseSync) {
  const router = Router();

  router.get('/light-sessions', (request, response) => {
    const position: unknown = request.query.position;
    const startTime = parseTimestamp(request.query.start_time);
    const endTime = parseTimestamp(request.query.end_time);

    if (!isPosition(position)) {
      response.status(400).json({
        error: 'Position must be bedroom, bathroom, or living_room.'
      });
      return;
    }

    if (startTime === undefined || endTime === undefined) {
      response.status(400).json({
        error:
          'start_time and end_time must be non-negative integer Unix timestamps in milliseconds within the supported date range.'
      });
      return;
    }

    if (startTime >= endTime) {
      response.status(400).json({
        error: 'start_time must be earlier than end_time.'
      });
      return;
    }

    try {
      // Return sessions whose recorded activity overlaps the range.
      //
      // started_at < endTime:
      //   The session must begin before the requested end.
      //
      // last_seen_at >= startTime:
      //   The final recorded heartbeat must reach the requested start.
      //
      // This includes sessions that started before the requested range.
      // It also includes a session containing only one heartbeat.
      //
      // Use the historical position stored in light_sessions.
      // Moving or uninstalling a lamp must not change past results.
      const sessions = database.prepare(`
        SELECT
          id,
          lamp_id,
          position,
          started_at,
          last_seen_at
        FROM light_sessions
        WHERE position = ?
          AND started_at < ?
          AND last_seen_at >= ?
        ORDER BY started_at ASC, id ASC
        LIMIT ?
      `).all(
        position,
        endTime,
        startTime,
        maxSessions + 1
      ) as LightSession[];

      // Fetch one extra row so we can detect an oversized result.
      // Never make a truncated result look like a complete timeline.
      if (sessions.length > maxSessions) {
        response.status(422).json({
          error:
            'Too many lighting sessions. Please choose a shorter time range.'
        });
        return;
      }

      // Heartbeats may update these records between requests.
      // Ask clients and intermediaries not to reuse a cached response.
      response.set('Cache-Control', 'no-store');

      // An empty array is a successful query with no matching records.
      // Return original timestamps without modifying or clipping them.
      response.json({
        position,
        start_time: startTime,
        end_time: endTime,
        sessions
      });
    } catch (error) {
      console.error(error);

      response.status(500).json({
        error: 'Failed to query lighting sessions.'
      });
    }
  });

  return router;
}
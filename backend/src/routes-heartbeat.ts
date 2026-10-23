import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';

type Position = 'bedroom' | 'bathroom' | 'living_room';

type Bulb = {
  id: number;
  position: Position | null;
};

type LightSession = {
  id: number;
  bulb_id: number;
  position: Position;
  started_at: number;
  last_seen_at: number;
};

const timeoutMs = 1_000;

// The clock normally returns the server's current time.
// Tests can supply a controlled clock instead of waiting in real time.
export function createHeartbeatRouter(
  database: DatabaseSync,
  clock: () => number = Date.now
) {
  const router = Router();

  router.post('/bulbs/:id/heartbeat', (request, response) => {
    const rawId = request.params.id;

    // Only accept positive integer bulb IDs.
    if (!/^[1-9]\d*$/.test(rawId)) {
      response.status(400).json({
        error: 'Bulb ID must be a positive integer.'
      });
      return;
    }

    const bulbId = Number(rawId);

    if (!Number.isSafeInteger(bulbId)) {
      response.status(400).json({
        error: 'Bulb ID must be a positive integer.'
      });
      return;
    }

    let transactionOpen = false;

    try {
      // Keep the bulb lookup, session lookup, and write together.
      // Another writer cannot change the installation during this operation.
      database.exec('BEGIN IMMEDIATE');
      transactionOpen = true;

      const now = clock();

      if (!Number.isSafeInteger(now) || now < 0) {
        throw new Error('Invalid server timestamp.');
      }

      const bulb = database.prepare(`
        SELECT id, position
        FROM bulbs
        WHERE id = ?
      `).get(bulbId) as Bulb | undefined;

      if (!bulb) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(404).json({
          error: 'Bulb not found.'
        });
        return;
      }

      // An uninstalled bulb must not create lighting records.
      if (bulb.position === null) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(409).json({
          error: 'Bulb must be installed before sending heartbeats.'
        });
        return;
      }

      // Find this bulb's latest session.
      // Historical position comes from the session, not from the current bulb.
      const previous = database.prepare(`
        SELECT id, bulb_id, position, started_at, last_seen_at
        FROM light_sessions
        WHERE bulb_id = ?
        ORDER BY started_at DESC, id DESC
        LIMIT 1
      `).get(bulbId) as LightSession | undefined;

      // Do not move a stored timestamp backwards if the server clock changes.
      if (previous && now < previous.last_seen_at) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(409).json({
          error: 'Server time is earlier than the last recorded heartbeat.'
        });
        return;
      }

      let session: LightSession;
      let created: boolean;

      if (
        previous &&
        previous.position === bulb.position &&
        now - previous.last_seen_at <= timeoutMs
      ) {
        // The light is still in the same continuous lighting session.
        // Keep started_at and the historical position unchanged.
        database.prepare(`
          UPDATE light_sessions
          SET last_seen_at = ?
          WHERE id = ?
        `).run(now, previous.id);

        session = {
          ...previous,
          last_seen_at: now
        };

        created = false;
      } else {
        // This is the first signal, a signal after a timeout,
        // or a signal from a different installation position.
        //
        // Copy the current position into the new historical record.
        const result = database.prepare(`
          INSERT INTO light_sessions (
            bulb_id,
            position,
            started_at,
            last_seen_at
          )
          VALUES (?, ?, ?, ?)
        `).run(bulb.id, bulb.position, now, now);

        session = {
          id: Number(result.lastInsertRowid),
          bulb_id: bulb.id,
          position: bulb.position,
          started_at: now,
          last_seen_at: now
        };

        created = true;
      }

      database.exec('COMMIT');
      transactionOpen = false;

      // 201 means a new session was created.
      // 200 means the existing session was updated.
      response.status(created ? 201 : 200).json({
        session,
        created
      });
    } catch (error) {
      if (transactionOpen) {
        database.exec('ROLLBACK');
      }

      console.error(error);

      response.status(500).json({
        error: 'Failed to record heartbeat.'
      });
    }
  });

  return router;
}
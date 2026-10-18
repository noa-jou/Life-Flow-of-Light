import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';

type Position = 'bedroom' | 'bathroom' | 'living_room';

type Lamp = {
  id: number;
  position: Position | null;
};

type LightSession = {
  id: number;
  lamp_id: number;
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

  router.post('/lamps/:id/heartbeat', (request, response) => {
    const rawId = request.params.id;

    // Only accept positive integer lamp IDs.
    if (!/^[1-9]\d*$/.test(rawId)) {
      response.status(400).json({
        error: 'Lamp ID must be a positive integer.'
      });
      return;
    }

    const lampId = Number(rawId);

    if (!Number.isSafeInteger(lampId)) {
      response.status(400).json({
        error: 'Lamp ID must be a positive integer.'
      });
      return;
    }

    let transactionOpen = false;

    try {
      // Keep the lamp lookup, session lookup, and write together.
      // Another writer cannot change the installation during this operation.
      database.exec('BEGIN IMMEDIATE');
      transactionOpen = true;

      const now = clock();

      if (!Number.isSafeInteger(now) || now < 0) {
        throw new Error('Invalid server timestamp.');
      }

      const lamp = database.prepare(`
        SELECT id, position
        FROM lamps
        WHERE id = ?
      `).get(lampId) as Lamp | undefined;

      if (!lamp) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(404).json({
          error: 'Lamp not found.'
        });
        return;
      }

      // An uninstalled lamp must not create lighting records.
      if (lamp.position === null) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(409).json({
          error: 'Lamp must be installed before sending heartbeats.'
        });
        return;
      }

      // Find this lamp's latest session.
      // Historical position comes from the session, not from the current lamp.
      const previous = database.prepare(`
        SELECT id, lamp_id, position, started_at, last_seen_at
        FROM light_sessions
        WHERE lamp_id = ?
        ORDER BY started_at DESC, id DESC
        LIMIT 1
      `).get(lampId) as LightSession | undefined;

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
        previous.position === lamp.position &&
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
            lamp_id,
            position,
            started_at,
            last_seen_at
          )
          VALUES (?, ?, ?, ?)
        `).run(lamp.id, lamp.position, now, now);

        session = {
          id: Number(result.lastInsertRowid),
          lamp_id: lamp.id,
          position: lamp.position,
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
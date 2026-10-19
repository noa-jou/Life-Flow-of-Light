import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';

type Position = 'bedroom' | 'bathroom' | 'living_room';

type Lamp = {
  id: number;
  serial_number: string;
  name: string;
  position: Position | null;
};

// Check an incoming value before treating it as a valid position.
function isPosition(value: unknown): value is Position {
  return (
    value === 'bedroom' ||
    value === 'bathroom' ||
    value === 'living_room'
  );
}

// Receive the database connection from server.ts.
// Tests can later provide their own separate database.
// Use the real clock normally.
// Tests can supply a controlled clock to check exact timeout boundaries.
export function createLampPositionRouter(
  database: DatabaseSync,
  clock: () => number = Date.now
) {
  const router = Router();

  // Example:
  // PUT /lamps/4/position
  // Body: { "position": "living_room" }
  router.put('/lamps/:id/position', (request, response) => {
    const rawId = request.params.id;

    // Accept positive integer IDs such as "1" or "42".
    // Reject values such as "abc", "1.5", and "-1".
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

    const position: unknown = request.body?.position;

    if (!isPosition(position)) {
      response.status(400).json({
        error: 'Position must be bedroom, bathroom, or living_room.'
      });
      return;
    }

    let transactionOpen = false;

    try {
      // Lock the write transaction before checking the current positions.
      // Another writer cannot take the empty position between our
      // checks and the UPDATE.
      database.exec('BEGIN IMMEDIATE');
      transactionOpen = true;

      const lamp = database.prepare(`
        SELECT id, serial_number, name, position
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

      // Repeating the same installation is safe.
      // No database change is needed.
      if (lamp.position === position) {
        database.exec('COMMIT');
        transactionOpen = false;

        response.json(lamp);
        return;
      }

      // Do not silently move an installed lamp to another position.
      if (lamp.position !== null) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(409).json({
          error: 'Lamp is already installed at another position.'
        });
        return;
      }


      const occupant = database.prepare(`
        SELECT id
        FROM lamps
        WHERE position = ?
      `).get(position) as { id: number } | undefined;

      // Installing and replacing are separate actions.
      // This endpoint must not remove the current occupant.
      if (occupant) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(409).json({
          error: 'Position is already occupied.'
        });
        return;
      }

      // Change only the lamp's current position.
      // Its identity, name, and historical sessions remain unchanged.
      database.prepare(`
        UPDATE lamps
        SET position = ?
        WHERE id = ?
      `).run(position, lampId);

      database.exec('COMMIT');
      transactionOpen = false;

      response.json({
        ...lamp,
        position
      });
    } catch (error) {
      // Cancel unfinished changes if an unexpected database error occurs.
      if (transactionOpen) {
        database.exec('ROLLBACK');
      }

      console.error(error);

      response.status(500).json({
        error: 'Failed to install lamp.'
      });
    }
  });


  // Remove an installation only after the lamp has stopped sending signals.
  // The lamp itself and its historical sessions remain in the database.
  router.delete('/lamps/:id/position', (request, response) => {
    const rawId = request.params.id;

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
      // Keep the activity check and removal in one transaction.
      // Another writer cannot record a heartbeat between these steps.
      database.exec('BEGIN IMMEDIATE');
      transactionOpen = true;

      const lamp = database.prepare(`
        SELECT id, serial_number, name, position
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

      // Repeating an uninstall is safe.
      if (lamp.position === null) {
        database.exec('COMMIT');
        transactionOpen = false;

        response.json(lamp);
        return;
      }

      const recentSession = database.prepare(`
        SELECT last_seen_at
        FROM light_sessions
        WHERE lamp_id = ?
        ORDER BY started_at DESC, id DESC
        LIMIT 1
      `).get(lampId) as { last_seen_at: number } | undefined;

      // A lamp is considered off only when the last heartbeat
      // was more than 1,000 milliseconds ago.
      //
      // If it has never sent a heartbeat, there is no activity
      // preventing its removal.
      if (
        recentSession &&
        clock() - recentSession.last_seen_at <= 1_000
      ) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(409).json({
          error:
            'Turn off this lamp and wait more than one second before uninstalling it.'
        });
        return;
      }

      // Clear only the current position.
      // Do not delete the lamp or change any light_sessions.
      database.prepare(`
        UPDATE lamps
        SET position = NULL
        WHERE id = ?
      `).run(lampId);

      database.exec('COMMIT');
      transactionOpen = false;

      response.json({
        ...lamp,
        position: null
      });
    } catch (error) {
      if (transactionOpen) {
        database.exec('ROLLBACK');
      }

      console.error(error);

      response.status(500).json({
        error: 'Failed to uninstall lamp.'
      });
    }
  });

  return router;
}
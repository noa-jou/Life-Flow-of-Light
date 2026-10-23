import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

type Position = 'bedroom' | 'bathroom' | 'living_room';

type Bulb = {
  id: number;
  serial_number: string;
  name: string;
  position: Position | null;
};

// These are the fields we need when checking whether deletion is allowed.
type BulbToDelete = {
  id: number;
  position: string | null;
};

// Check an incoming value before treating it as a valid position.
function isPosition(value: unknown): value is Position {
  return (
    value === 'bedroom' ||
    value === 'bathroom' ||
    value === 'living_room'
  );
}

// Create a router containing the bulb management endpoints.
// Tests can provide a separate database and a controlled clock.
export function createBulbRouter(
  database: DatabaseSync,
  clock: () => number = Date.now
) {
  const router = Router();

  // Example:
  // PUT /bulbs/4/position
  // Body: { "position": "living_room" }
  router.put('/bulbs/:id/position', (request, response) => {
    const rawId = request.params.id;

    // Accept positive integer IDs such as "1" or "42".
    // Reject values such as "abc", "1.5", and "-1".
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

      const bulb = database.prepare(`
        SELECT id, serial_number, name, position
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

      // Repeating the same installation is safe.
      // No database change is needed.
      if (bulb.position === position) {
        database.exec('COMMIT');
        transactionOpen = false;

        response.json(bulb);
        return;
      }

      // Do not silently move an installed bulb to another position.
      if (bulb.position !== null) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(409).json({
          error: 'Bulb is already installed at another position.'
        });
        return;
      }


      const occupant = database.prepare(`
        SELECT id
        FROM bulbs
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

      // Change only the bulb's current position.
      // Its identity, name, and historical sessions remain unchanged.
      database.prepare(`
        UPDATE bulbs
        SET position = ?
        WHERE id = ?
      `).run(position, bulbId);

      database.exec('COMMIT');
      transactionOpen = false;

      response.json({
        ...bulb,
        position
      });
    } catch (error) {
      // Cancel unfinished changes if an unexpected database error occurs.
      if (transactionOpen) {
        database.exec('ROLLBACK');
      }

      console.error(error);

      response.status(500).json({
        error: 'Failed to install bulb.'
      });
    }
  });


  // Remove an installation only after the bulb has stopped sending signals.
  // The bulb itself and its historical sessions remain in the database.
  router.delete('/bulbs/:id/position', (request, response) => {
    const rawId = request.params.id;

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
      // Keep the activity check and removal in one transaction.
      // Another writer cannot record a heartbeat between these steps.
      database.exec('BEGIN IMMEDIATE');
      transactionOpen = true;

      const bulb = database.prepare(`
        SELECT id, serial_number, name, position
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

      // Repeating an uninstall is safe.
      if (bulb.position === null) {
        database.exec('COMMIT');
        transactionOpen = false;

        response.json(bulb);
        return;
      }

      const recentSession = database.prepare(`
        SELECT last_seen_at
        FROM light_sessions
        WHERE bulb_id = ?
        ORDER BY started_at DESC, id DESC
        LIMIT 1
      `).get(bulbId) as { last_seen_at: number } | undefined;

      // A bulb is considered off only when the last heartbeat
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
            'Turn off this bulb and wait more than one second before uninstalling it.'
        });
        return;
      }

      // Clear only the current position.
      // Do not delete the bulb or change any light_sessions.
      database.prepare(`
        UPDATE bulbs
        SET position = NULL
        WHERE id = ?
      `).run(bulbId);

      database.exec('COMMIT');
      transactionOpen = false;

      response.json({
        ...bulb,
        position: null
      });
    } catch (error) {
      if (transactionOpen) {
        database.exec('ROLLBACK');
      }

      console.error(error);

      response.status(500).json({
        error: 'Failed to uninstall bulb.'
      });
    }
  });

  router.delete('/bulbs/:id', (request, response) => {
    const rawId = request.params.id;

    // Accept positive whole-number IDs only.
    // Reject values such as "abc", "1.5", "0", and "-1".
    if (!/^[1-9]\d*$/.test(rawId)) {
      response.status(400).json({
        error: 'Bulb ID must be a positive integer.'
      });
      return;
    }

    const bulbId = Number(rawId);

    // JavaScript cannot represent extremely large integers precisely.
    if (!Number.isSafeInteger(bulbId)) {
      response.status(400).json({
        error: 'Bulb ID must be a positive integer.'
      });
      return;
    }

    let transactionOpen = false;

    try {
      // Keep the checks and deletion in one transaction.
      // Another database writer cannot install this bulb or add a
      // session between our checks and the DELETE statement.
      database.exec('BEGIN IMMEDIATE');
      transactionOpen = true;

      const bulb = database.prepare(`
        SELECT id, position
        FROM bulbs
        WHERE id = ?
      `).get(bulbId) as BulbToDelete | undefined;

      if (!bulb) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(404).json({
          error: 'Bulb not found.'
        });
        return;
      }

      // Deleting a bulb and uninstalling it are different operations.
      // An installed bulb must be uninstalled first.
      if (bulb.position !== null) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(409).json({
          error: 'Uninstall this bulb before deleting it.'
        });
        return;
      }

      // One matching row is enough to know that history exists.
      // Do not delete or modify any lighting sessions.
      const existingSession = database.prepare(`
        SELECT id
        FROM light_sessions
        WHERE bulb_id = ?
        LIMIT 1
      `).get(bulbId);

      if (existingSession) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(409).json({
          error: 'Bulbs with lighting history cannot be deleted.'
        });
        return;
      }

      // The bulb is uninstalled and has no lighting history.
      // The foreign key constraint provides an additional safeguard.
      database.prepare(`
        DELETE FROM bulbs
        WHERE id = ?
      `).run(bulbId);

      database.exec('COMMIT');
      transactionOpen = false;

      response.status(200).json({
        deleted: true,
        id: bulbId
      });
    } catch (error) {
      // Undo any unfinished database changes if something fails.
      if (transactionOpen) {
        database.exec('ROLLBACK');
      }

      // Log technical details on the server, not in the API response.
      console.error('Failed to delete bulb:', error);

      response.status(500).json({
        error: 'Failed to delete bulb.'
      });
    }

  });


  // List all registered bulbs, including uninstalled ones.
  router.get('/bulbs', (_request, response) => {
    try {
      const bulbs = database.prepare(`
      SELECT id, serial_number, name, position
      FROM bulbs
      ORDER BY id ASC
    `).all();

      response.json(bulbs);
    } catch (error) {
      console.error('Failed to list bulbs:', error);
      response.status(500).json({ error: 'Unable to retrieve bulbs.' });
    }
  });

  // Register a bulb using its UUID as the default name.
  router.post('/bulbs', (_request, response) => {
    // The generated default name may exceed 20 characters.
    // The 20-character limit applies only to user-chosen names.
    const serialNumber = randomUUID();

    try {
      const result = database.prepare(`
      INSERT INTO bulbs (serial_number, name, position)
      VALUES (?, ?, NULL)
    `).run(serialNumber, serialNumber);

      response.status(201).json({
        id: Number(result.lastInsertRowid),
        serial_number: serialNumber,
        name: serialNumber,
        position: null
      });
    } catch (error) {
      console.error('Failed to register bulb:', error);

      response.status(500).json({
        error: 'Unable to register the bulb.'
      });
    }
  });

  // Rename an existing bulb.
  router.patch('/bulbs/:id', (request, response) => {
    const idText = request.params.id;

    // Accept only positive integer IDs.
    if (!/^[1-9]\d*$/.test(idText)) {
      response.status(400).json({
        error: 'Bulb ID must be a positive integer.'
      });
      return;
    }

    const id = Number(idText);

    if (!Number.isSafeInteger(id)) {
      response.status(400).json({
        error: 'Bulb ID is too large.'
      });
      return;
    }

    const name: unknown = request.body?.name;

    if (typeof name !== 'string' || name.trim().length === 0) {
      response.status(400).json({
        error: 'Name must be a non-empty string.'
      });
      return;
    }

    const trimmedName = name.trim();

    // Count Unicode code points rather than UTF-16 code units.
    if ([...trimmedName].length > 20) {
      response.status(400).json({
        error: 'Name must not exceed 20 characters.'
      });
      return;
    }

    try {
      // Change only the name and return the updated bulb.
      const bulb = database.prepare(`
      UPDATE bulbs
      SET name = ?
      WHERE id = ?
      RETURNING id, serial_number, name, position
    `).get(trimmedName, id);

      if (!bulb) {
        response.status(404).json({
          error: 'Bulb not found.'
        });
        return;
      }

      response.json(bulb);
    } catch (error) {
      console.error('Failed to rename bulb:', error);

      response.status(500).json({
        error: 'Unable to rename the bulb.'
      });
    }
  });


  return router;
}


import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';

// These are the fields we need when checking whether deletion is allowed.
type LampToDelete = {
  id: number;
  position: string | null;
};

export function createLampDeleteRouter(database: DatabaseSync) {
  const router = Router();

  router.delete('/lamps/:id', (request, response) => {
    const rawId = request.params.id;

    // Accept positive whole-number IDs only.
    // Reject values such as "abc", "1.5", "0", and "-1".
    if (!/^[1-9]\d*$/.test(rawId)) {
      response.status(400).json({
        error: 'Lamp ID must be a positive integer.'
      });
      return;
    }

    const lampId = Number(rawId);

    // JavaScript cannot represent extremely large integers precisely.
    if (!Number.isSafeInteger(lampId)) {
      response.status(400).json({
        error: 'Lamp ID must be a positive integer.'
      });
      return;
    }

    let transactionOpen = false;

    try {
      // Keep the checks and deletion in one transaction.
      // Another database writer cannot install this lamp or add a
      // session between our checks and the DELETE statement.
      database.exec('BEGIN IMMEDIATE');
      transactionOpen = true;

      const lamp = database.prepare(`
        SELECT id, position
        FROM lamps
        WHERE id = ?
      `).get(lampId) as LampToDelete | undefined;

      if (!lamp) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(404).json({
          error: 'Lamp not found.'
        });
        return;
      }

      // Deleting a lamp and uninstalling it are different operations.
      // An installed lamp must be uninstalled first.
      if (lamp.position !== null) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(409).json({
          error: 'Uninstall this lamp before deleting it.'
        });
        return;
      }

      // One matching row is enough to know that history exists.
      // Do not delete or modify any lighting sessions.
      const existingSession = database.prepare(`
        SELECT id
        FROM light_sessions
        WHERE lamp_id = ?
        LIMIT 1
      `).get(lampId);

      if (existingSession) {
        database.exec('ROLLBACK');
        transactionOpen = false;

        response.status(409).json({
          error: 'Lamps with lighting history cannot be deleted.'
        });
        return;
      }

      // The lamp is uninstalled and has no lighting history.
      // The foreign key constraint provides an additional safeguard.
      database.prepare(`
        DELETE FROM lamps
        WHERE id = ?
      `).run(lampId);

      database.exec('COMMIT');
      transactionOpen = false;

      response.status(200).json({
        deleted: true,
        id: lampId
      });
    } catch (error) {
      // Undo any unfinished database changes if something fails.
      if (transactionOpen) {
        database.exec('ROLLBACK');
      }

      // Log technical details on the server, not in the API response.
      console.error('Failed to delete lamp:', error);

      response.status(500).json({
        error: 'Failed to delete lamp.'
      });
    }
  });

  return router;
}
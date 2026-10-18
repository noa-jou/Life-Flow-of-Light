import express from 'express';
import { database } from './database.js';
import { randomUUID } from 'node:crypto';
import { createMorseRouter } from './morse-routes.js';
import { createLampPositionRouter } from './lamp-position-routes.js';
import { createHeartbeatRouter } from './heartbeat-routes.js';
import { createLightSessionRouter } from './light-session-routes.js';

const app = express();
const port = 3000;

// Parse incoming JSON request bodies.
app.use(express.json());

// URL Routers
app.use(createHeartbeatRouter(database));
app.use(createLampPositionRouter(database));
app.use(createMorseRouter(database));
app.use(createLightSessionRouter(database));


// Check that the server can query the database.
app.get('/health', (_request, response) => {
  database.prepare('SELECT 1').get();

  response.json({
    status: 'ok',
    database: 'connected'
  });
});

// Basic functions of the backend:

// List all registered lamps, including uninstalled ones.
app.get('/lamps', (_request, response) => {
  try {
    const lamps = database.prepare(`
      SELECT id, serial_number, name, position
      FROM lamps
      ORDER BY id ASC
    `).all();

    response.json(lamps);
  } catch (error) {
    console.error('Failed to list lamps:', error);
    response.status(500).json({ error: 'Unable to retrieve lamps.' });
  }
});

// Register a lamp using its UUID as the default name.
app.post('/lamps', (_request, response) => {
  // The generated default name may exceed 20 characters.
  // The 20-character limit applies only to user-chosen names.
  const serialNumber = randomUUID();

  try {
    const result = database.prepare(`
      INSERT INTO lamps (serial_number, name, position)
      VALUES (?, ?, NULL)
    `).run(serialNumber, serialNumber);

    response.status(201).json({
      id: Number(result.lastInsertRowid),
      serial_number: serialNumber,
      name: serialNumber,
      position: null
    });
  } catch (error) {
    console.error('Failed to register lamp:', error);

    response.status(500).json({
      error: 'Unable to register the lamp.'
    });
  }
});

// Rename an existing lamp.
app.patch('/lamps/:id', (request, response) => {
  const idText = request.params.id;

  // Accept only positive integer IDs.
  if (!/^[1-9]\d*$/.test(idText)) {
    response.status(400).json({
      error: 'Lamp ID must be a positive integer.'
    });
    return;
  }

  const id = Number(idText);

  if (!Number.isSafeInteger(id)) {
    response.status(400).json({
      error: 'Lamp ID is too large.'
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
    // Change only the name and return the updated lamp.
    const lamp = database.prepare(`
      UPDATE lamps
      SET name = ?
      WHERE id = ?
      RETURNING id, serial_number, name, position
    `).get(trimmedName, id);

    if (!lamp) {
      response.status(404).json({
        error: 'Lamp not found.'
      });
      return;
    }

    response.json(lamp);
  } catch (error) {
    console.error('Failed to rename lamp:', error);

    response.status(500).json({
      error: 'Unable to rename the lamp.'
    });
  }
});

// Listen on this computer for local development.
app.listen(port, '127.0.0.1', () => {
  console.log(`Backend running at http://127.0.0.1:${port}`);
});
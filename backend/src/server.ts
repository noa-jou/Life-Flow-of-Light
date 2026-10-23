import express from 'express';
import { database } from './database.js';
import { createMorseRouter } from './routes-morse.js';
import { createBulbRouter } from './routes-bulb.js';
import { createHeartbeatRouter } from './routes-heartbeat.js';
import { createLightSessionRouter } from './routes-light-session.js';

const app = express();
const port = 3000;

// Parse JSON request bodies before passing requests to the routers.
app.use(express.json());

// Each router registers a related group of API endpoints.
app.use(createBulbRouter(database));
app.use(createHeartbeatRouter(database));
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

// Listen on this computer for local development.
app.listen(port, '127.0.0.1', () => {
  console.log(`Backend running at http://127.0.0.1:${port}`);
});
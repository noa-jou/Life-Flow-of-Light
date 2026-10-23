import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import request from 'supertest';

import { createBulbRouter } from '../src/routes-bulb.js';
import { createHeartbeatRouter } from '../src/routes-heartbeat.js';
import { createLightSessionRouter } from '../src/routes-light-session.js';

import { databaseFor, snapshot } from './helpers.js';

test('uninstalling and reinstalling at the same or another position creates separate history', async t => {
  const db = databaseFor(t);

  let now = 10_000;
  const clock = () => now;

  const app = express();
  app.use(express.json());
  app.use(createBulbRouter(db, clock));
  app.use(createHeartbeatRouter(db, clock));
  app.use(createLightSessionRouter(db));

  const api = request(app);

  // Exercise a complete workflow through HTTP, not fixture inserts.
  const bulb = (await api.post('/bulbs').expect(201)).body;
  const url = '/bulbs/' + bulb.id;

  await api.put(url + '/position')
    .send({ position: 'bedroom' })
    .expect(200);

  await api.post(url + '/heartbeat').expect(201);

  // Switch off, uninstall, and reinstall at the same position.
  now = 11_001;

  await api.delete(url + '/position').expect(200);
  await api.post(url + '/heartbeat').expect(409);

  await api.put(url + '/position')
    .send({ position: 'bedroom' })
    .expect(200);

  await api.post(url + '/heartbeat').expect(201);

  // Repeat, but install at another position.
  now = 12_002;

  await api.delete(url + '/position').expect(200);

  await api.put(url + '/position')
    .send({ position: 'bathroom' })
    .expect(200);

  await api.post(url + '/heartbeat').expect(201);

  const before = snapshot(db);

  assert.deepEqual(
    before.sessions.map(row => row.position),
    ['bedroom', 'bedroom', 'bathroom']
  );

  assert.deepEqual(
    before.sessions.map(row => row.started_at),
    [10_000, 11_001, 12_002]
  );

  // Bedroom history remains searchable after the bulb moves.
  const r = await api.get('/light-sessions')
    .query({
      position: 'bedroom',
      start_time: 0,
      end_time: 20_000
    })
    .expect(200);

  assert.deepEqual(r.body.sessions, before.sessions.slice(0, 2));
  assert.deepEqual(snapshot(db), before);
});
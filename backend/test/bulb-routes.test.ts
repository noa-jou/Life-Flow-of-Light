import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';

import { createBulbRouter } from '../src/routes-bulb.js';

import {
  databaseFor,
  apiFor,
  addBulb,
  addSession,
  snapshot
} from './helpers.js';

function setup(t: TestContext) {
  const db = databaseFor(t);

  // Change this value to simulate time passing without real delays.
  let now = 10_000;

  const api = apiFor(createBulbRouter(db, () => now));

  return {
    db,
    api,
    setTime: (value: number) => {
      now = value;
    }
  };
}

test('POST /bulbs generates UUID identities, default names, and uninstalled records', async t => {
  const { db, api } = setup(t);

  const a = await api.post('/bulbs').expect(201);

  // Client-supplied identity and installation must not override registration.
  const b = await api.post('/bulbs')
    .send({
      id: 999,
      serial_number: 'chosen',
      name: 'chosen',
      position: 'bedroom'
    })
    .expect(201);

  for (const response of [a, b]) {
    assert.match(
      response.body.serial_number,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    assert.equal(response.body.name, response.body.serial_number);
    assert.equal(response.body.position, null);
  }

  assert.notEqual(a.body.serial_number, b.body.serial_number);
  assert.notEqual(b.body.id, 999);

  // A correct HTTP response is not enough: the rows must also be saved.
  assert.deepEqual(snapshot(db).bulbs, [a.body, b.body]);
});

test('GET /bulbs returns an empty list or all bulbs in ID order without changing data', async t => {
  const { db, api } = setup(t);

  assert.deepEqual(
    (await api.get('/bulbs').expect(200)).body,
    []
  );

  // Insert out of order, with both installed and uninstalled bulbs.
  addBulb(db, 3);
  addBulb(db, 1, 'bedroom');

  const before = snapshot(db);

  assert.deepEqual(
    (await api.get('/bulbs').expect(200)).body,
    before.bulbs
  );

  assert.deepEqual(snapshot(db), before);
});

test('PATCH /bulbs/:id trims names and changes no identity, installation, or history', async t => {
  const { db, api } = setup(t);

  addBulb(db, 1, 'bedroom');
  addSession(db, 1, 'bedroom', 100, 200);

  const before = snapshot(db);

  const response = await api.patch('/bulbs/1')
    .send({
      name: '  Desk bulb  ',
      serial_number: 'changed',
      position: 'bathroom'
    })
    .expect(200);

  assert.deepEqual(response.body, {
    ...before.bulbs[0],
    name: 'Desk bulb'
  });

  assert.deepEqual(snapshot(db), {
    bulbs: [{ ...before.bulbs[0], name: 'Desk bulb' }],
    sessions: before.sessions
  });
});

test('PATCH accepts 20 code points and rejects 21, blank, missing, and non-string names', async t => {
  const { db, api } = setup(t);
  addBulb(db);

  // These emoji each contain one code point, even though JS length counts two.
  for (const name of [
    'a'.repeat(20),
    '燈'.repeat(20),
    '💡'.repeat(20)
  ]) {
    const response = await api.patch('/bulbs/1')
      .send({ name })
      .expect(200);

    assert.equal(response.body.name, name);
  }

  const before = snapshot(db);

  for (const name of [
    '',
    '   ',
    null,
    42,
    [],
    {},
    'a'.repeat(21),
    '💡'.repeat(21)
  ]) {
    await api.patch('/bulbs/1').send({ name }).expect(400);
    assert.deepEqual(snapshot(db), before);
  }

  await api.patch('/bulbs/1').send({}).expect(400);
  await api.patch('/bulbs/1').expect(400);

  assert.deepEqual(snapshot(db), before);
});

test('bulb management routes reject invalid IDs, missing bulbs, and invalid positions', async t => {
  const { db, api } = setup(t);
  addBulb(db);

  for (const [id, status] of [
    ['0', 400],
    ['-1', 400],
    ['1.5', 400],
    ['abc', 400],
    ['9007199254740992', 400],
    ['999', 404]
  ] as const) {
    await api.patch('/bulbs/' + id)
      .send({ name: 'Desk' })
      .expect(status);

    await api.delete('/bulbs/' + id).expect(status);

    await api.put('/bulbs/' + id + '/position')
      .send({ position: 'bedroom' })
      .expect(status);

    await api.delete('/bulbs/' + id + '/position')
      .expect(status);
  }

  const before = snapshot(db);

  for (const position of [null, 'kitchen', 1, [], {}]) {
    await api.put('/bulbs/1/position')
      .send({ position })
      .expect(400);
  }

  await api.put('/bulbs/1/position').send({}).expect(400);

  assert.deepEqual(snapshot(db), before);
});

test('installation is repeatable and rejects occupied positions or silent moves', async t => {
  const { db, api } = setup(t);

  addBulb(db, 1);
  addBulb(db, 2);

  await api.put('/bulbs/1/position')
    .send({ position: 'bedroom' })
    .expect(200);

  await api.put('/bulbs/1/position')
    .send({ position: 'bedroom' })
    .expect(200);

  const before = snapshot(db);

  await api.put('/bulbs/2/position')
    .send({ position: 'bedroom' })
    .expect(409);

  await api.put('/bulbs/1/position')
    .send({ position: 'bathroom' })
    .expect(409);

  assert.deepEqual(snapshot(db), before);

  // A successful write afterward proves no transaction was left open.
  await api.put('/bulbs/2/position')
    .send({ position: 'bathroom' })
    .expect(200);
});

test('a bulb with no history can be uninstalled repeatedly without deleting it', async t => {
  const { db, api } = setup(t);
  addBulb(db, 1, 'bedroom');

  const first = await api.delete('/bulbs/1/position').expect(200);
  const second = await api.delete('/bulbs/1/position').expect(200);

  assert.equal(first.body.position, null);
  assert.deepEqual(second.body, first.body);
  assert.equal(snapshot(db).bulbs.length, 1);
});

test('uninstall is blocked at 1000 ms and allowed at 1001 ms without changing history', async t => {
  const { db, api, setTime } = setup(t);

  addBulb(db, 1, 'bedroom');
  addSession(db, 1, 'bedroom', 10_000, 10_000);

  const before = snapshot(db);

  setTime(11_000);
  await api.delete('/bulbs/1/position').expect(409);
  assert.deepEqual(snapshot(db), before);

  setTime(11_001);
  await api.delete('/bulbs/1/position').expect(200);

  assert.equal(snapshot(db).bulbs[0].position, null);
  assert.deepEqual(snapshot(db).sessions, before.sessions);
});

test('DELETE removes only an uninstalled bulb without history; repeated deletion returns 404', async t => {
  const { db, api } = setup(t);

  addBulb(db, 1);
  addBulb(db, 2, 'bedroom');
  addSession(db, 2, 'bedroom', 100, 200);

  const before = snapshot(db);

  const response = await api.delete('/bulbs/1').expect(200);

  assert.deepEqual(response.body, {
    deleted: true,
    id: 1
  });

  // The other bulb and its history must remain unchanged.
  assert.deepEqual(snapshot(db), {
    bulbs: before.bulbs.filter(row => row.id !== 1),
    sessions: before.sessions
  });

  await api.delete('/bulbs/1').expect(404);
});

test('DELETE rejects installed bulbs and uninstalled bulbs with history, preserving all data', async t => {
  const { db, api } = setup(t);

  addBulb(db, 1, 'bedroom');
  addBulb(db, 2);
  addSession(db, 2, 'bathroom', 100, 200);

  const before = snapshot(db);

  for (const id of [1, 2]) {
    const response = await api.delete('/bulbs/' + id).expect(409);

    assert.equal(typeof response.body.error, 'string');
    assert.deepEqual(snapshot(db), before);
  }

  // Verify that rejected deletions do not break later writes.
  await api.post('/bulbs').expect(201);
});
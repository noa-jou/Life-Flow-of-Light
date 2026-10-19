import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { test, type TestContext } from 'node:test';
import express from 'express';
import request from 'supertest';

import { createLampPositionRouter } from '../src/lamp-position-routes.js';
import { createHeartbeatRouter } from '../src/heartbeat-routes.js';
import { createLightSessionRouter } from '../src/light-session-routes.js';

// Read the real schema, but never import database.ts or open the saved DB.
const schema = readFileSync(
  new URL('../schema.sql', import.meta.url),
  'utf8'
);

type Position = 'bedroom' | 'bathroom' | 'living_room';

function setup(t: TestContext) {
  // Every test gets a fresh database that disappears when closed.
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());

  db.exec(schema);

  // Both routers share the same controllable clock.
  // Tests change this number instead of waiting in real time.
  let now = 10_000;
  const clock = () => now;

  const app = express();
  app.use(express.json());
  app.use(createLampPositionRouter(db, clock));
  app.use(createHeartbeatRouter(db, clock));
  app.use(createLightSessionRouter(db));

  // Create a lamp directly as test setup.
  // This does not test the separate lamp-registration endpoint.
  function lamp(id: number, position: Position | null = null) {
    db.prepare(`
      INSERT INTO lamps (id, serial_number, name, position)
      VALUES (?, ?, ?, ?)
    `).run(id, `serial-${id}`, `Lamp ${id}`, position);
  }

  // Insert known historical records for query tests.
  function session(
    id: number,
    lampId: number,
    position: Position,
    start: number,
    last: number
  ) {
    db.prepare(`
      INSERT INTO light_sessions (
        id, lamp_id, position, started_at, last_seen_at
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(id, lampId, position, start, last);
  }

  // Convert SQLite row objects into ordinary objects for comparison.
  // The table name is restricted to these two internal choices.
  function rows(table: 'lamps' | 'light_sessions') {
    return db.prepare(`SELECT * FROM ${table} ORDER BY id`)
      .all()
      .map((row) => ({ ...row }));
  }

  // Supertest calls this test application.
  // The normal development server does not need to be running.
  const api = request(app);

  return {
    db,
    lamp,
    session,
    rows,

    setTime: (value: number) => {
      now = value;
    },

    install: (id: number | string, position: unknown) =>
      api.put(`/lamps/${id}/position`).send({ position }),

    uninstall: (id: number | string) =>
      api.delete(`/lamps/${id}/position`),

    heartbeat: (id: number | string) =>
      api.post(`/lamps/${id}/heartbeat`),

    query: (query: Record<string, unknown>) =>
      api.get('/light-sessions').query(query)
  };
}

test(
  'schema allows uninstalled lamps but rejects duplicate positions and serials',
  (t) => {
    const s = setup(t);

    // Multiple lamps can have a NULL position.
    s.lamp(1);
    s.lamp(2);
    s.lamp(3, 'bedroom');

    assert.throws(() => s.lamp(4, 'bedroom'), /UNIQUE/);

    assert.throws(
      () => s.db.prepare(`
        INSERT INTO lamps (serial_number, name)
        VALUES (?, ?)
      `).run('serial-1', 'Duplicate'),
      /UNIQUE/
    );

    assert.equal(s.rows('lamps').length, 3);
  }
);

test(
  'schema protects serial numbers, positions, foreign keys, and session times',
  (t) => {
    const s = setup(t);
    s.lamp(1, 'bedroom');

    assert.throws(
      () => s.db.exec(`
        UPDATE lamps SET serial_number = 'changed' WHERE id = 1
      `),
      /cannot be changed/
    );

    assert.throws(
      () => s.db.exec(`
        UPDATE lamps SET position = 'kitchen' WHERE id = 1
      `),
      /CHECK/
    );

    // A session must refer to an existing lamp.
    assert.throws(
      () => s.session(1, 999, 'bedroom', 100, 200),
      /FOREIGN KEY/
    );

    assert.throws(
      () => s.session(1, 1, 'bedroom', -1, 200),
      /CHECK/
    );

    assert.throws(
      () => s.session(1, 1, 'bedroom', 200, 100),
      /CHECK/
    );

    s.session(1, 1, 'bedroom', 100, 200);

    // A lamp with historical records cannot be deleted.
    assert.throws(
      () => s.db.exec('DELETE FROM lamps WHERE id = 1'),
      /FOREIGN KEY/
    );
  }
);

test(
  'installation is repeatable and protects occupied positions',
  async (t) => {
    const s = setup(t);
    s.lamp(1);
    s.lamp(2);

    await s.install(1, 'bedroom').expect(200);
    await s.install(1, 'bedroom').expect(200);

    const before = s.rows('lamps');

    await s.install(2, 'bedroom').expect(409);
    await s.install(1, 'bathroom').expect(409);

    assert.deepEqual(s.rows('lamps'), before);

    // A successful write after rejection also checks transaction cleanup.
    await s.install(2, 'bathroom').expect(200);
  }
);

test(
  'lamp routes reject invalid IDs, missing lamps, and invalid positions',
  async (t) => {
    const s = setup(t);
    s.lamp(1);

    for (const id of ['0', '-1', '1.5', 'abc', '9007199254740992']) {
      await s.install(id, 'bedroom').expect(400);
      await s.uninstall(id).expect(400);
      await s.heartbeat(id).expect(400);
    }

    await s.install(999, 'bedroom').expect(404);
    await s.uninstall(999).expect(404);
    await s.heartbeat(999).expect(404);

    for (const position of [null, 'kitchen', 1]) {
      await s.install(1, position).expect(400);
    }

    await s.install(1, 'bedroom').expect(200);
  }
);

test(
  'a lamp with no activity can be uninstalled repeatedly',
  async (t) => {
    const s = setup(t);
    s.lamp(1, 'bedroom');

    const first = await s.uninstall(1).expect(200);
    const second = await s.uninstall(1).expect(200);

    assert.equal(first.body.position, null);
    assert.deepEqual(second.body, first.body);

    // Uninstalling must not delete the lamp.
    assert.equal(s.rows('lamps').length, 1);
  }
);

test(
  'uninstall is blocked at 1000 ms and allowed at 1001 ms without changing history',
  async (t) => {
    const s = setup(t);
    s.lamp(1, 'bedroom');

    await s.heartbeat(1).expect(201);
    const before = s.rows('light_sessions');

    // Exactly one second is still within the active interval.
    s.setTime(11_000);
    await s.uninstall(1).expect(409);
    assert.equal(s.rows('lamps')[0].position, 'bedroom');

    // One millisecond later, uninstalling becomes allowed.
    s.setTime(11_001);
    await s.uninstall(1).expect(200);
    assert.equal(s.rows('lamps')[0].position, null);

    assert.deepEqual(s.rows('light_sessions'), before);
  }
);

test(
  'heartbeats continue at a 1000 ms gap and start again at a 1001 ms gap',
  async (t) => {
    const s = setup(t);
    s.lamp(1, 'bedroom');

    const first = await s.heartbeat(1).expect(201);

    s.setTime(11_000);
    const continued = await s.heartbeat(1).expect(200);

    assert.equal(continued.body.created, false);
    assert.equal(continued.body.session.id, first.body.session.id);
    assert.equal(continued.body.session.started_at, 10_000);
    assert.equal(continued.body.session.last_seen_at, 11_000);

    // Measure the next gap from the latest heartbeat, now at 11,000.
    s.setTime(12_001);
    const next = await s.heartbeat(1).expect(201);

    assert.equal(next.body.created, true);
    assert.notEqual(next.body.session.id, first.body.session.id);
    assert.equal(next.body.session.started_at, 12_001);
    assert.equal(next.body.session.last_seen_at, 12_001);
    assert.equal(s.rows('light_sessions').length, 2);
  }
);

test(
  'uninstalled lamps cannot create sessions and client timestamps are ignored',
  async (t) => {
    const s = setup(t);
    s.lamp(1);

    await s.heartbeat(1).expect(409);
    assert.deepEqual(s.rows('light_sessions'), []);

    await s.install(1, 'bedroom').expect(200);

    // The client cannot choose a different recorded position or start time.
    const result = await s.heartbeat(1)
      .send({ position: 'bathroom', started_at: 1 })
      .expect(201);

    assert.equal(result.body.session.position, 'bedroom');
    assert.equal(result.body.session.started_at, 10_000);
  }
);

test(
  'backward clock changes are rejected without changing existing sessions',
  async (t) => {
    const s = setup(t);
    s.lamp(1, 'bedroom');

    await s.heartbeat(1).expect(201);
    const before = s.rows('light_sessions');

    s.setTime(9_999);
    await s.heartbeat(1).expect(409);
    assert.deepEqual(s.rows('light_sessions'), before);

    // A later valid heartbeat should still work.
    s.setTime(10_200);
    await s.heartbeat(1).expect(200);
  }
);

test(
  'reinstalling at the same or another position starts new sessions and preserves history',
  async (t) => {
    const s = setup(t);
    s.lamp(1, 'bedroom');

    await s.heartbeat(1).expect(201);

    s.setTime(11_001);
    await s.uninstall(1).expect(200);
    await s.install(1, 'bedroom').expect(200);
    await s.heartbeat(1).expect(201);

    s.setTime(12_002);
    await s.uninstall(1).expect(200);
    await s.install(1, 'bathroom').expect(200);
    await s.heartbeat(1).expect(201);

    assert.deepEqual(
      s.rows('light_sessions').map((row) => row.position),
      ['bedroom', 'bedroom', 'bathroom']
    );

    // Old bedroom records remain searchable after the lamp moves.
    const old = await s.query({
      position: 'bedroom',
      start_time: 0,
      end_time: 20_000
    }).expect(200);

    assert.equal(old.body.sessions.length, 2);
  }
);

test(
  'timeline queries include overlap and start boundary, exclude end boundary, and are read-only',
  async (t) => {
    const s = setup(t);
    s.lamp(1);

    // Insert out of chronological order to verify the query's sorting.
    s.session(1, 1, 'bedroom', 200, 200); // At range end: exclude.
    s.session(2, 1, 'bedroom', 150, 160);
    s.session(3, 1, 'bedroom', 50, 250);  // Spans the whole range.
    s.session(4, 1, 'bedroom', 100, 100); // One signal at start: include.
    s.session(5, 1, 'bedroom', 20, 99);   // Before range: exclude.
    s.session(6, 1, 'bathroom', 120, 130); // Other position: exclude.
    s.session(7, 1, 'bedroom', 30, 100);  // Last signal at start: include.

    const before = s.rows('light_sessions');

    for (let repeat = 0; repeat < 2; repeat += 1) {
      const result = await s.query({
        position: 'bedroom',
        start_time: 100,
        end_time: 200
      }).expect(200);

      assert.equal(result.headers['cache-control'], 'no-store');

      assert.deepEqual(
        result.body.sessions.map((row: { id: number }) => row.id),
        [7, 3, 4, 2]
      );

      // Return original timestamps, not values clipped to the query range.
      assert.equal(result.body.sessions[1].started_at, 50);
      assert.equal(result.body.sessions[1].last_seen_at, 250);
    }

    assert.deepEqual(s.rows('light_sessions'), before);
  }
);

test(
  'empty timeline queries succeed and invalid queries return 400',
  async (t) => {
    const s = setup(t);

    const valid = {
      position: 'bedroom',
      start_time: 0,
      end_time: 200
    };

    const empty = await s.query(valid).expect(200);
    assert.deepEqual(empty.body.sessions, []);

    for (const query of [
      {},
      { ...valid, position: 'kitchen' },
      { ...valid, start_time: -1 },
      { ...valid, start_time: '1.5' },
      { ...valid, start_time: 'abc' },
      { ...valid, start_time: 200 },
      { ...valid, start_time: 201 },
      { ...valid, end_time: '8640000000000001' },
      { ...valid, start_time: ['0', '1'] }
    ]) {
      await s.query(query).expect(400);
    }
  }
);
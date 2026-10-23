import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  databaseFor,
  addBulb,
  addSession,
  snapshot
} from './helpers.js';

test('schema allows several uninstalled bulbs but enforces unique positions and serials', t => {
  const db = databaseFor(t);

  addBulb(db, 1);
  addBulb(db, 2);
  addBulb(db, 3, 'bedroom');

  assert.throws(
    () => addBulb(db, 4, 'bedroom'),
    /UNIQUE/
  );

  assert.throws(
    () => db.exec(`
      INSERT INTO bulbs (serial_number, name)
      VALUES ('serial-1', 'Duplicate')
    `),
    /UNIQUE/
  );

  assert.equal(snapshot(db).bulbs.length, 3);
});

test('schema protects serial numbers while allowing names and positions to change', t => {
  const db = databaseFor(t);
  addBulb(db);

  assert.throws(
    () => db.exec(`
      UPDATE bulbs SET serial_number = 'changed' WHERE id = 1
    `),
    /cannot be changed/
  );

  // Reassigning the existing serial is harmless.
  db.exec(`
    UPDATE bulbs
    SET serial_number = 'serial-1',
        name = 'Desk',
        position = 'bedroom'
  `);

  assert.equal(snapshot(db).bulbs[0].serial_number, 'serial-1');
  assert.equal(snapshot(db).bulbs[0].name, 'Desk');
});

test('schema rejects invalid positions, missing required values, and invalid times', t => {
  const db = databaseFor(t);
  addBulb(db);

  assert.throws(
    () => db.exec("UPDATE bulbs SET position = 'kitchen'"),
    /CHECK/
  );

  assert.throws(
    () => db.exec("INSERT INTO bulbs (name) VALUES ('No serial')"),
    /NOT NULL/
  );

  assert.throws(
    () => db.exec(`
      INSERT INTO bulbs (serial_number) VALUES ('No name')
    `),
    /NOT NULL/
  );

  assert.throws(
    () => db.exec(`
      INSERT INTO light_sessions (
        bulb_id, position, started_at, last_seen_at
      )
      VALUES (1, 'kitchen', 100, 200)
    `),
    /CHECK/
  );

  assert.throws(
    () => addSession(db, 1, 'bedroom', -1, 200),
    /CHECK/
  );

  assert.throws(
    () => addSession(db, 1, 'bedroom', 200, 100),
    /CHECK/
  );

  // One heartbeat is a valid session.
  addSession(db, 1, 'bedroom', 0, 0);
});

test('foreign keys reject missing bulbs and protect bulbs with history', t => {
  const db = databaseFor(t);

  assert.throws(
    () => addSession(db, 999, 'bedroom', 100, 200),
    /FOREIGN KEY/
  );

  addBulb(db);
  addSession(db, 1, 'bedroom', 100, 200);

  const before = snapshot(db);

  assert.throws(
    () => db.exec('DELETE FROM bulbs WHERE id = 1'),
    /FOREIGN KEY/
  );

  assert.deepEqual(snapshot(db), before);
});
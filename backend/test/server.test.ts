import assert from 'node:assert/strict';
import { test } from 'node:test';

import { projectFor } from './project-helper.js';

test('the real server registers health and every API group', t => {
  const project = projectFor(t);

  const result = project.run(`
    import assert from 'node:assert/strict';
    import express from 'express';
    import request from 'supertest';
    import { once } from 'node:events';

    // Redirect only the listening port to a free temporary port.
    // Import the actual server.ts so missing app.use calls are detected.
    const originalListen = express.application.listen;
    let server;

    express.application.listen = function () {
      server = originalListen.call(this, 0, '127.0.0.1');
      return server;
    };

    try {
      await import('./src/server.ts');

      assert.ok(server, 'server.ts must start listening');

      // Wait until the server is ready before sending requests.
      if (!server.listening) {
        await once(server, 'listening');
      }

      const api = request(server);

      const health = await api.get('/health').expect(200);

      assert.deepEqual(health.body, {
        status: 'ok',
        database: 'connected'
      });

      assert.deepEqual(
        (await api.get('/bulbs').expect(200)).body,
        []
      );

      const bulb = (await api.post('/bulbs').expect(201)).body;
      const url = '/bulbs/' + bulb.id;

      await api.patch(url)
        .send({ name: 'Desk' })
        .expect(200);

      await api.put(url + '/position')
        .send({ position: 'bedroom' })
        .expect(200);

      await api.delete(url + '/position').expect(200);

      await api.put(url + '/position')
        .send({ position: 'bedroom' })
        .expect(200);

      await api.post(url + '/heartbeat').expect(201);

      const timeline = await api.get('/light-sessions')
        .query({
          position: 'bedroom',
          start_time: 0,
          end_time: Date.now() + 1
        })
        .expect(200);

      assert.equal(
        timeline.body.sessions[0].bulb_id,
        bulb.id
      );

      await api.post('/morse/check')
        .send({
          position: 'bedroom',
          start_time: 0,
          end_time: Date.now() + 1
        })
        .expect(200);

      const unused = (await api.post('/bulbs').expect(201)).body;
      await api.delete('/bulbs/' + unused.id).expect(200);
    } finally {
      // Restore the method and release the temporary server and database.
      express.application.listen = originalListen;

      if (server?.listening) {
        await new Promise((resolve, reject) =>
          server.close(error => error ? reject(error) : resolve())
        );
      }

      const { database } = await import('./src/database.ts');
      database.close();
    }
  `);

  assert.equal(
    result.status,
    0,
    result.stderr || String(result.error)
  );
});
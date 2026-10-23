import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';

import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import type { TestContext } from 'node:test';

// Seed and server import database.ts, which normally opens a saved file.
// Run them in a disposable copy so they cannot touch backend/data.
export function projectFor(t: TestContext) {
  const root = fileURLToPath(new URL('../', import.meta.url));

  const directory = mkdtempSync(
    join(tmpdir(), 'life-flow-test-')
  );

  // Remove the temporary copy after the test.
  t.after(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  cpSync(
    join(root, 'src'),
    join(directory, 'src'),
    { recursive: true }
  );

  cpSync(
    join(root, 'schema.sql'),
    join(directory, 'schema.sql')
  );

  writeFileSync(
    join(directory, 'package.json'),
    '{"type":"module"}'
  );

  // Reuse installed packages. Do not copy or install node_modules.
  symlinkSync(
    join(root, 'node_modules'),
    join(directory, 'node_modules'),
    'dir'
  );

  const tsx = import.meta.resolve('tsx');

  return {
    directory,

    schema: readFileSync(
      join(directory, 'schema.sql'),
      'utf8'
    ),

    run(script: string, timezone = 'Asia/Hong_Kong') {
      return spawnSync(
        process.execPath,
        [
          '--import',
          tsx,
          '--input-type=module',
          '-e',
          script
        ],
        {
          cwd: directory,
          env: {
            ...process.env,
            TZ: timezone
          },
          encoding: 'utf8',
          timeout: 20_000
        }
      );
    }
  };
}
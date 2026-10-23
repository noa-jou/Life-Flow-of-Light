# Life Flow of Light — Backend Learning Notes

[Project overview](../README.md) · [User Guide](./UserGuide.md) · [Morse Guide](./MorseGuide.md)

**Started:** 15 October 2026  
**Updated through:** 23 October 2026
**Checkpoint:** The backend is ready for local PoC use and frontend integration. All 22 automated tests passed, the TypeScript build succeeded, and the compiled server started and answered its health check.

## About these notes

I am building Life Flow of Light as a learning project. I proposed the product concept and requirements, and I am using ChatGPT to help explain technical choices, suggest commands, and develop the implementation step by step.

These notes explain what we built, why each part exists, how I ran it, and what we checked.

Successfully running code does not mean I have already mastered the technology. Some code and explanations were prepared with ChatGPT's assistance. I am keeping this record so I can understand the project more deeply when I return to it.

This document focuses on the backend. The frontend has not yet been implemented at this checkpoint.

The [User Guide](./UserGuide.md) is intended for someone installing and running the existing project. These learning notes also explain the steps used to build it.

### How to read the commands

Unless another location is stated, run backend commands from:

```bash
cd ~/Life-Flow-of-Light/backend
```

The repository root is the directory one level above `backend/`.

Do not copy the terminal prompt, such as `noa@penguin:...$`. Copy only the command that follows it.

Some commands below record the original project setup. They are not commands to repeat every time the application starts.

In particular:

- `npm init` creates the initial package configuration.
- `npm pkg set` edits that configuration.
- `npm ci` installs dependencies from an existing project.
- `npm run dev` starts the development server.
- `npm run seed` inserts optional demonstration records into an empty database.

Code fragments explain specific parts of the implementation. They are not complete replacement files unless explicitly described as such.

The linked source files in the repository are the implementation to use.

## 1. Checking the starting point

I began by examining the repository:

```bash
ls -al
```

`ls` lists files. `-a` includes hidden names such as `.git`, and `-l` displays details.

The repository initially contained Git metadata and two README files:

- `README.md`
- `README.zh-TW.md`

Their product descriptions were kept separate from the backend implementation.

I checked the operating system and existing tools:

```bash
cat /etc/os-release
node -v
npm -v
```

- `cat` prints a file's contents.
- `/etc/os-release` identifies the Linux distribution.
- `node -v` prints the installed Node.js version.
- `npm -v` prints the installed npm version.

My environment was Debian GNU/Linux 12, named bookworm, running on a Chromebook.

The original Node.js version was 18.20.4, with npm 9.2.0. The project was subsequently configured to use Node.js 24.

### Different tools have different jobs

| Tool | Purpose |
| --- | --- |
| `apt` | Install Debian system packages. |
| `nvm` | Install and select Node.js versions for my account. |
| Node.js | Run backend JavaScript and provide the SQLite module. |
| `npm` | Install project packages and run configured commands. |
| Git | Track source-file changes. |
| `curl` | Download content or send HTTP requests. |

Debian uses `apt`, not Alpine Linux's `apk`.

## 2. Keeping backend files together

From the repository root, I created the backend directory:

```bash
cd ~/Life-Flow-of-Light
mkdir -p backend
cd backend
```

`~` means my home directory. `cd` changes the working directory.

`mkdir -p` creates the directory if necessary and does not fail merely because it already exists.

The backend has its own source files, dependencies, configuration, and tests.

At this checkpoint, the main locations are:

| Location | Purpose |
| --- | --- |
| `README.md` and `README.zh-TW.md` | Product overview at the repository root. |
| `.gitignore` | Rules for excluding generated and local files from Git. |
| `docs/` | Learning notes and guides. |
| `backend/src/` | Backend TypeScript source. |
| `backend/test/` | Automated tests. |
| `backend/schema.sql` | Database structure. |
| `backend/data/` | Local database files. |
| `backend/dist/` | Generated JavaScript after compilation. |
| `backend/node_modules/` | Installed npm packages. |

A future frontend can have its own directory. No frontend was added during this backend stage.

## 3. Preparing .gitignore

I placed `.gitignore` at the repository root so its rules could also cover backend subdirectories.

The rules were intended to exclude:

- Installed dependencies such as `node_modules/`.
- Generated output such as `dist/` and `build/`.
- Local SQLite databases and their companion files.
- Local environment files containing machine-specific settings or secrets.
- Logs, coverage output, and tool caches.

These files can still exist on my computer. Ignoring a file does not delete it or hide it from the editor.

Git ignore rules primarily affect untracked files. Adding a rule does not automatically stop tracking a file already committed.

Files that belong in the repository include:

- TypeScript source.
- Automated tests.
- `schema.sql`.
- `.nvmrc`.
- `tsconfig.json`.
- `package.json`.
- `package-lock.json`.
- Documentation.

The difference matters: another person can regenerate dependencies and compiled output from the project, but cannot regenerate my personal activity records unless I provide a database backup.

A safe `.env.example` can be committed if environment settings are introduced later.

## 4. Creating package.json

Inside `backend/`, I ran:

```bash
npm init -y

npm pkg set name="life-flow-of-light-backend"
npm pkg set type="module"
npm pkg set license="UNLICENSED"
npm pkg set private=true --json
npm pkg set 'engines.node=24.x'
```

`npm init -y` creates an initial `package.json` using default values.

`npm pkg set` edits named settings in that file.

| Setting | Meaning |
| --- | --- |
| `name` | Identifies the backend package. |
| `type: "module"` | Uses ES-module behavior for this package's `.js` files. |
| `license: "UNLICENSED"` | Records that the package is not offered under an open-source license. |
| `private: true` | Prevents accidental publication to npm. |
| `engines.node: "24.x"` | Declares the intended Node.js major version. |

`private` does not determine whether the GitHub repository is public or private. Those are separate settings.

`engines.node` does not install or switch Node.js. nvm handles that separately.

`--json` stores `true` as a boolean rather than the text `"true"`.

I checked the resulting file with:

```bash
cat package.json
```

Later commands added dependencies and scripts to the same file.

## 5. Installing nvm and Node.js 24

We selected Node.js 24 for the project, including its built-in `node:sqlite` module.

This means the backend does not need a separate SQLite npm driver.

First, I ensured that download tools were available:

```bash
sudo apt update
sudo apt install -y curl ca-certificates
```

- `sudo` runs these system-management commands with administrator privileges.
- `apt update` refreshes package information.
- `apt install` installs the named packages.
- `-y` accepts the package installation confirmation.
- `ca-certificates` supplies certificates used to verify HTTPS connections.

Then I installed nvm:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh | bash

source ~/.bashrc
nvm --version
```

The curl flags make HTTP errors fail, reduce normal output, show errors, and follow redirects.

The pipe, `|`, passes the downloaded installer to Bash. This executes code from the official nvm repository.

The installer added nvm-loading commands to my shell configuration. `source ~/.bashrc` loaded that configuration into the current terminal.

In my installation, nvm was placed in `~/.config/nvm`, and its reported version was 0.40.8.

From `backend/`, I created the version file:

```bash
echo "24" > .nvmrc
```

`>` creates or replaces the file's contents.

I then ran:

```bash
nvm install
nvm use

node -v
npm -v
```

With no version argument, nvm reads `.nvmrc`.

- `nvm install` installs a matching Node.js version.
- `nvm use` selects it in the current shell.

Node.js includes npm, so a separate npm installation was unnecessary.

My terminal reported:

```text
Node.js: v24.22.0
npm: 11.19.1
```

These are recorded results from my setup. `.nvmrc` specifies the major version only, so another installation may select a different 24.x patch release.

When returning in a new terminal, I can enter `backend/` and run `nvm use` again.

These instructions record the environment used for this checkpoint. Years later, available downloads and supported runtime versions may differ.

## 6. Installing backend dependencies

From `backend/`, I ran:

```bash
npm install express@5

npm install -D typescript tsx @types/node@24 @types/express@5 supertest @types/supertest
```

The first command adds Express as a runtime dependency.

`-D` adds development and testing tools to `devDependencies`.

| Package | Purpose | Version reported during setup |
| --- | --- | --- |
| `express` | Define HTTP endpoints and send responses. | 5.3.0 |
| `typescript` | Check types and compile TypeScript into JavaScript. | 7.0.2 |
| `tsx` | Execute TypeScript during development and testing. | 4.23.15 |
| `@types/node` | Provide Node.js type definitions. | 24.19.2 |
| `@types/express` | Provide Express type definitions. | 5.0.6 |
| `supertest` | Make HTTP requests to an application in tests. | 7.3.1 |
| `@types/supertest` | Provide Supertest type definitions. | 7.2.1 |

Type definitions describe APIs to TypeScript. They do not perform the application's runtime work.

Installation produced or updated three important things:

| Item | What it contains |
| --- | --- |
| `package.json` | Declared dependencies and commands. |
| `package-lock.json` | Exact dependency resolutions recorded by npm. |
| `node_modules/` | Downloaded package files used locally. |

I checked the installation and repository state:

```bash
npm ls --depth=0
git status --short
```

`npm ls --depth=0` lists directly installed dependencies.

In Git's short status output:

- `M` means modified.
- `??` means untracked.

These commands inspect state. They do not commit or upload files.

## 7. Checking that TypeScript can run

I tested the project's local tsx executable:

```bash
./node_modules/.bin/tsx -e "const message: string = 'TypeScript is ready'; console.log(message)"
```

- `./node_modules/.bin/tsx` selects the executable installed in this project.
- `-e` executes the supplied text instead of a source file.
- `: string` is a TypeScript type annotation.
- `console.log` prints a value.

The output was:

```text
TypeScript is ready
```

This confirmed that a small TypeScript example could execute.

It did not verify the database or HTTP endpoints.

It also did not replace type checking: tsx can execute TypeScript without checking every type relationship the TypeScript compiler would check.

## 8. Creating source and test directories

From `backend/`:

```bash
mkdir -p src test
```

`src/` contains the application code.

`test/` contains code that checks application behavior.

Creating a directory or using `touch` to create a file does not write the implementation. The provided code still has to be saved in the appropriate file.

The main source files at this checkpoint are:

| File | Responsibility |
| --- | --- |
| [database.ts](../backend/src/database.ts) | Open SQLite and initialize the schema. |
| [server.ts](../backend/src/server.ts) | Create Express, connect routes, and listen for requests. |
| [seed.ts](../backend/src/seed.ts) | Generate optional demonstration records. |
| [morse.ts](../backend/src/morse.ts) | Interpret lighting patterns as possible Morse messages. |
| [morse-routes.ts](../backend/src/morse-routes.ts) | Validate and handle Morse-check requests. |
| [lamp-position-routes.ts](../backend/src/lamp-position-routes.ts) | Install and uninstall lamps. |
| [heartbeat-routes.ts](../backend/src/heartbeat-routes.ts) | Receive signals and maintain lighting sessions. |
| [light-session-routes.ts](../backend/src/light-session-routes.ts) | Query activity for a timeline. |

The registration, listing, and renaming routes remain in `server.ts` at this checkpoint.

## 9. Configuring TypeScript

I created `backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

| Option | Purpose |
| --- | --- |
| `target` | Choose ES2023 as the JavaScript output target. |
| `module` and `moduleResolution` | Follow Node.js module and import-resolution rules. |
| `rootDir` | Identify `src/` as the source directory for emitted files. |
| `outDir` | Put compiled JavaScript in `dist/`. |
| `strict` | Enable stricter type checking. |
| `esModuleInterop` | Help TypeScript work with CommonJS-style imports. |
| `forceConsistentCasingInFileNames` | Help catch inconsistent filename capitalization. |
| `skipLibCheck` | Skip checking declaration-file internals. |
| `types` | Include Node.js ambient type definitions. |
| `include` | Select TypeScript source files under `src/`. |
| `exclude` | Exclude dependencies and generated output from initial file selection. |

For example, compiling `src/server.ts` produces `dist/server.js`.

The configuration selects `src/`, not `test/`. Consequently:

- `npm run typecheck` checks application source.
- `npm run build` compiles application source.
- `npm test` executes test files through tsx.

Executing the tests does not mean their TypeScript types have been checked by this configuration.

Also, TypeScript types do not validate incoming network data at runtime. The routes must still check IDs, names, positions, and timestamps themselves.

## 10. Adding development commands

I added these scripts from `backend/`:

```bash
npm pkg set 'scripts.dev=tsx watch src/server.ts'
npm pkg set 'scripts.build=tsc'
npm pkg set 'scripts.typecheck=tsc --noEmit'
npm pkg set 'scripts.start=node dist/server.js'

npm pkg delete main
```

These commands edit `package.json`; they do not run the scripts immediately.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run TypeScript directly and restart when watched source files change. |
| `npm run typecheck` | Check source types without generating output. |
| `npm run build` | Compile source into `dist/`. |
| `npm start` | Run the compiled JavaScript. |

npm makes locally installed executables, such as `tsc` and `tsx`, available to package scripts.

`npm pkg delete main` removes the default `index.js` package entry. This application is launched through scripts rather than consumed as a library package.

The default test placeholder was replaced later with the real test command described in section 28.

`npm start` does not build first. After changing source code, I need to rebuild before running the updated compiled version.

## 11. Preparing schema.sql

With ChatGPT's guidance, I created [backend/schema.sql](../backend/schema.sql).

This file describes the database structure. Writing it does not create the database by itself.

The database module later reads and executes it.

I inspected it with:

```bash
cat schema.sql
```

`cat` displays SQL; it does not execute SQL.

### The two application tables

| Table | Fields | Purpose |
| --- | --- | --- |
| `lamps` | `id`, `serial_number`, `name`, `position` | Registered lamps and current installations. |
| `light_sessions` | `id`, `lamp_id`, `position`, `started_at`, `last_seen_at` | Continuous periods of lighting activity. |

The allowed positions are:

- `bedroom`
- `bathroom`
- `living_room`

A lamp with `position = NULL` is registered but uninstalled.

### Current position and historical position

`lamps.position` answers:

> Where is this lamp installed now?

`light_sessions.position` answers:

> Where was this activity recorded?

For example, moving A from the living room to the bedroom must not move A's old living-room activity on the timeline.

That is why both tables contain a position field.

### Database constraints

| SQL rule | Purpose |
| --- | --- |
| `PRIMARY KEY` | Identify a row. |
| `NOT NULL` | Require a value. |
| `UNIQUE` | Reject duplicate values where uniqueness is required. |
| `CHECK` | Restrict allowed positions and timestamp relationships. |
| `FOREIGN KEY` | Require a session to refer to an existing lamp. |
| `ON DELETE RESTRICT` | Prevent deleting a lamp that has session records. |

`lamps.position` is unique. SQLite permits multiple NULL values in this constraint, so several lamps can remain uninstalled.

The serial number is both required and unique.

A trigger rejects attempts to change a registered lamp's serial number. Its name and position can still change.

For sessions:

- `started_at` must not be negative.
- `last_seen_at` must not be earlier than `started_at`.

### Rules enforced by the backend

The schema does not enforce every application rule.

For example:

- `NOT NULL` does not reject an empty name.
- The schema does not impose the custom-name length limit.
- A session's allowed position is checked, but SQLite does not automatically compare it with the lamp's current position.
- Historical positions remain unchanged because the backend does not update them.

The routes implement those additional rules.

### Enabling foreign keys

```sql
PRAGMA foreign_keys = ON;
```

Foreign-key checking must be enabled for each database connection.

A connection opened by a test must enable it too. Executing our schema does so.

### The position index

```sql
CREATE INDEX IF NOT EXISTS idx_light_sessions_position_time
    ON light_sessions (position, started_at DESC);
```

This supports the project's position-based activity queries.

An index is an internal lookup structure. It does not add another application table.

The schema has no separate lamp-and-time index. UNIQUE constraints may still create internal indexes.

Queries still need `ORDER BY` to request a defined output order.

### Transactions and existing databases

`BEGIN TRANSACTION` and `COMMIT` group schema initialization into a transaction.

`IF NOT EXISTS` leaves an existing named object in place. It does not rewrite an old table to match a newly edited schema.

Future structural changes will need explicit migration steps.

There is no ended_at column or replacement-history table.

## 12. Creating and checking the SQLite database

I created [backend/src/database.ts](../backend/src/database.ts).

From `backend/`, the file could be created with:

```bash
touch src/database.ts
```

`touch` creates an empty file if needed. If the file already exists, it updates its timestamp without clearing the contents.

After saving the implementation, the module:

1. Resolves paths relative to `import.meta.url`.
2. Creates `backend/data/` if necessary.
3. Opens or creates `data/life-flow-of-light.sqlite`.
4. Enables foreign-key checking.
5. Reads and executes `schema.sql`.
6. Exports the database connection.
7. Closes the connection if initialization fails.

SQLite stores the database in a local file. No separate database server is required.

The project also does not require the separate `sqlite3` terminal program for initialization.

### Why paths are relative to the source file

A terminal command may be launched from different working directories.

Paths based on `import.meta.url` are relative to the module itself.

Both `src/database.ts` and compiled `dist/database.js` are one directory below `backend/`, so they can find the same schema and data directory.

### Checking types

```bash
npm run typecheck
```

This passed.

Type checking does not execute database initialization or create the database.

### Executing the database module

I ran:

```bash
./node_modules/.bin/tsx -e "
import { database } from './src/database.ts';

try {
  const tables = database
    .prepare(\"SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name\")
    .all();

  console.log(tables);
} finally {
  database.close();
}
"
```

Importing the module executes its initialization code.

`sqlite_schema` is SQLite's built-in schema catalog.

The output was:

```text
[
  [Object: null prototype] { name: 'lamps' },
  [Object: null prototype] { name: 'light_sessions' }
]
```

The “null prototype” label describes how Node.js represents the row objects. It is not an error.

This confirmed that the database opened and the two tables existed.

### Common database methods

| Method | Meaning |
| --- | --- |
| `database.exec(sql)` | Execute SQL text, such as schema statements or transaction commands. |
| `database.prepare(sql)` | Prepare a statement for execution with supplied values. |
| `.get(...)` | Execute and retrieve the first result row, if one exists. |
| `.all(...)` | Execute and retrieve all result rows. |
| `.run(...)` | Execute a statement and return information such as the inserted row ID. |

Statements use `?` placeholders for values:

```sql
UPDATE lamps SET position = ? WHERE id = ?;
```

The values are supplied separately through `.run(...)` or another execution method. They are not assembled into SQL text from user input.

`finally` runs cleanup whether the preceding operation succeeds or throws an error.

## 13. Starting the first Express API

I created [backend/src/server.ts](../backend/src/server.ts).

It creates an Express application, imports the database, enables JSON request-body parsing, defines routes, and starts listening.

### Imports and the .js extension

The source uses:

```typescript
import { database } from './database.js';
```

Although the source file is `database.ts`, this import is suitable for the `.js` files produced by compilation.

With our NodeNext configuration, TypeScript resolves the source counterpart. tsx also supports this development workflow.

### Parsing JSON

```typescript
app.use(express.json());
```

This middleware parses incoming JSON request bodies before the route handlers use them.

It needs to be registered before routes that expect JSON bodies.

### The health endpoint

```text
GET /health
```

The handler runs `SELECT 1` against SQLite and returns:

```json
{"status":"ok","database":"connected"}
```

`SELECT 1` is a small connectivity check. It does not validate every database rule.

### Starting and checking the server

From `backend/`:

```bash
npm run typecheck
npm run dev
```

The server printed:

```text
Backend running at http://127.0.0.1:3000
```

In another terminal:

```bash
curl http://127.0.0.1:3000/health
```

The expected JSON was returned.

`127.0.0.1` refers to the local computer. Port `3000` identifies the listening service.

The server terminal stays occupied while the process runs. `Ctrl+C` stops it.

Stopping the server does not delete the database.

### Understanding an HTTP endpoint

An endpoint combines a method and a path, such as `GET /lamps` or `POST /lamps`.

Express selects a handler from that combination.

Common response statuses in this project are:

| Status | Meaning here |
| --- | --- |
| `200` | Request succeeded. |
| `201` | A lamp or session was created. |
| `400` | Input is invalid. |
| `404` | Requested lamp does not exist. |
| `409` | The requested action conflicts with the current state. |
| `422` | The requested scan is too large. |
| `500` | An unexpected server operation failed. |

## 14. Preparing three days of demo data

Before implementing live heartbeat handling, I wanted records that could demonstrate a daily routine.

The seed creates:

| Lamp | Position |
| --- | --- |
| A | `living_room` |
| B | `bedroom` |
| C | `bathroom` |

The local daily schedule is:

| Local time | Lamps on |
| --- | --- |
| 00:00–07:00 | None |
| 07:00–08:30 | A, B, C |
| 08:30–18:00 | None |
| 18:00–21:00 | A, C |
| 21:00–22:00 | B, with the HELP exception on day 3 |
| 22:00–24:00 | None |

### Calculating the previous three days

The seed generates the previous three complete local calendar days, excluding today.

It uses the timezone of the computer running the script. It does not fix the schedule to UTC+08:00.

For example, running it on local 17 October generates 14–16 October.

The code captures the current date once. It creates the three dates using local year, month, and day values.

Subtracting calendar dates is preferable to subtracting fixed 24-hour blocks, because daylight-saving changes can make a local day shorter or longer.

Each scheduled clock time is converted into Unix milliseconds for storage.

The script's date labels use local date components. Using `toISOString()` for these labels would format them in UTC and could show a different calendar date.

### HELP on the third evening

On day 3:

- B's regular session ends at 21:58:40.
- Six seconds of darkness follow.
- HELP runs from 21:58:46 to 22:00:00.

The pattern is:

```text
H: ....
E: .
L: .-..
P: .--.
```

Dots last two seconds and dashes six seconds.

Gaps within a letter last two seconds. Gaps between letters last six seconds.

The complete message lasts 74 seconds and contains 13 flashes.

These gaps exceed the one-second heartbeat timeout, allowing each flash to appear as a separate session.

### How the simulation becomes records

The seed inserts completed sessions directly. It does not send HTTP heartbeats or wait three days.

It models heartbeats every 200 milliseconds while the lamp is on:

```text
last_seen_at = simulated switch-off time - 200 milliseconds
```

There are 18 ordinary sessions and 13 Morse flashes, giving 31 session rows.

No rows are needed for dark periods.

The seed creates the pattern as data. Decoding that pattern is the responsibility of the Morse feature.

## 15. Placing and running seed.ts

The source file is [backend/src/seed.ts](../backend/src/seed.ts).

It belongs beside `database.ts`, not inside the data directory.

From `backend/`:

```bash
npm pkg set 'scripts.seed=tsx src/seed.ts'
npm run typecheck
npm run seed
```

The seed:

1. Opens the database through `database.ts`.
2. Starts a write transaction.
3. Checks that both application tables are empty.
4. Registers the three lamps.
5. Inserts the lighting sessions.
6. Checks the expected count and HELP ending time.
7. Commits the inserts or rolls them back on failure.
8. Closes the database connection.

### Protecting existing data

The seed uses `BEGIN IMMEDIATE` before checking emptiness.

This acquires the write transaction before the check, preventing another writer from inserting between the check and the seed's inserts.

If either table already contains records, the script stops without deleting them.

`COMMIT` saves the transaction. `ROLLBACK` cancels its unfinished changes.

### Successful output

On 17 October 2026, with my computer using Asia/Hong_Kong:

```text
Created 3 lamps and 31 lighting sessions.
Schedule timezone: Asia/Hong_Kong.
Demo dates: 2026-10-14, 2026-10-15, 2026-10-16 (previous three complete local calendar days).
Day 3, local time: B turns off at 21:58:40; HELP runs 21:58:46–22:00:00.
Database timestamps are Unix milliseconds.
Dark periods have no session rows. No live heartbeat sender was started.
```

The dates and timezone reflect this run. They are not fixed values in the script.

The seed is optional and normally runs once on a fresh database. It does not refresh the records each morning.

## 16. What future readers install

Someone who already has a copy of the project and nvm can enter `backend/` and run:

```bash
nvm install
nvm use
npm ci
```

They do not need to repeat `npm init` or install every package individually.

`npm ci` installs the dependencies recorded in the lockfile. It requires `package.json` and `package-lock.json` to agree.

It replaces an existing `node_modules/` directory rather than updating the lockfile to resolve a mismatch.

Installing dependencies does not create the application source or run this seed.

Database initialization happens when the database module executes, such as during startup or seeding.

At this checkpoint, the normal checks are:

```bash
npm run typecheck
npm test
npm run build
```

A reader can optionally seed an empty database and start the application using either the development or compiled workflow.

The complete fresh-machine walkthrough in the User Guide has not yet been tested from beginning to end on another machine.

For long-term reconstruction, keep the repository revision, lockfile, runtime-version information, and separate database backups.

A lockfile records package resolutions; it is not an archive of the downloaded packages.

## 17. Registering, listing, and renaming lamps

These routes are defined in `server.ts`:

| Method and path | Purpose |
| --- | --- |
| `POST /lamps` | Register a new lamp. |
| `GET /lamps` | List registered lamps. |
| `PATCH /lamps/:id` | Change a display name. |

### Registration

```bash
curl -i -X POST http://127.0.0.1:3000/lamps
```

The backend generates a UUID using Node.js's `randomUUID()`.

The current registration design assigns the same UUID to:

- The permanent `serial_number`.
- The initial display `name`.

A new lamp has `position: null`.

The response uses HTTP 201.

| Field | Purpose |
| --- | --- |
| `id` | Internal database row identifier. |
| `serial_number` | Permanent identity generated at registration. |
| `name` | Editable display label. |
| `position` | Current installation or null. |

The short seed names A, B, and C are assigned directly by the demo script.

### Listing lamps

```bash
curl http://127.0.0.1:3000/lamps
```

This returns a JSON array and does not change records.

The frontend can use this list for installation controls and displayed lamp names.

### Renaming

Use a real ID from the list. This example assumes ID 4 exists:

```bash
curl -i -X PATCH http://127.0.0.1:3000/lamps/4 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Desk lamp"}'
```

- `-i` includes response headers.
- `-X` selects an HTTP method.
- `-H` sets a header.
- `-d` supplies the request body.
- A backslash at the end of a line continues the command.

The backend trims surrounding whitespace and requires a non-empty custom name of at most 20 Unicode code points.

The code-point count uses the string's individual Unicode code points rather than treating every JavaScript UTF-16 unit as a character. Some combined emoji can still count as multiple code points.

The generated UUID name is a deliberate exception to the 20-character custom-name limit.

An oversized custom name returns HTTP 400:

```json
{"error":"Name must not exceed 20 characters."}
```

Renaming never changes the serial number.

Registration, listing, and renaming were manually checked. They are not covered by the new backend test file described in section 27.

## 18. Adding Morse-code detection

The feature uses:

- [morse.ts](../backend/src/morse.ts) for interpreting patterns.
- [morse-routes.ts](../backend/src/morse-routes.ts) for HTTP validation and database reads.

Keeping the detector separate allows tests to supply known records and a controlled current time.

The router receives a database connection instead of opening the saved database itself.

### Connecting the router

At the top of `server.ts`:

```typescript
import { createMorseRouter } from './morse-routes.js';
```

After JSON parsing is enabled and before listening:

```typescript
app.use(createMorseRouter(database));
```

Each router should be registered only once.

### Request format

```text
POST /morse/check
```

Example for the demo regenerated on 17 October:

```json
{
  "position": "bedroom",
  "start_time": 1792159126000,
  "end_time": 1792159200000
}
```

All timestamps are Unix milliseconds.

The backend does not interpret a user's local calendar selection. The future frontend will convert that selection into timestamps.

### Response format

```json
{
  "result": [
    {
      "start_time": 1792159126000,
      "end_time": 1792159200000,
      "message": "HELP"
    }
  ]
}
```

A valid request with no match returns HTTP 200:

```json
{"result":[]}
```

Invalid input returns HTTP 400.

The detector recognizes A–Z and spaces between words. It does not check dictionary meanings or sentence grammar.

### Timing model

| Component | Expected duration |
| --- | --- |
| Dot | 2 seconds |
| Dash | 6 seconds |
| Gap within a letter | 2 seconds |
| Gap between letters | 6 seconds |
| Gap between words | 14 seconds |

The detector accepts a 25% timing tolerance.

It estimates a pulse's end using:

```text
estimated end = last_seen_at + 200 milliseconds
```

This matches the seed's heartbeat simulation. It is not an exact measurement of a real switch-off.

A trailing message waits for more than 17.5 seconds of silence after its estimated end before being finalized. This allows time for a word gap and another word.

The user-facing guide suggests leaving at least 18 seconds after the final flash.

### Range and message boundaries

Only complete detected messages within the requested range are returned.

The route reads nearby context around the range so a selected fragment is not casually treated as a separate complete message.

Signals from different lamps are not combined into one message.

The API is read-only and uses `Cache-Control: no-store`.

An oversized scan returns HTTP 422 instead of silently truncating its records. The limit is 50,000 candidate sessions, including context.

See the [Morse Guide](./MorseGuide.md) for the beginner-friendly explanation and alphabet.

## 19. Checking Morse detection manually

With the server running:

```bash
NOW_MS=$(node -p 'Date.now()')

curl -s -X POST http://127.0.0.1:3000/morse/check \
  -H 'Content-Type: application/json' \
  -d "{\"position\":\"bedroom\",\"start_time\":0,\"end_time\":$NOW_MS}"
```

`node -p` evaluates an expression and prints its result.

`Date.now()` returns the current Unix timestamp in milliseconds.

`$(...)` captures a command's output. The shell stores it in `NOW_MS`.

The double-quoted JSON allows the shell to insert that number. The backslashes protect the JSON's internal quotation marks.

The broad range from zero to now is convenient for this small demo. Larger datasets should use narrower ranges.

Observed checks included:

| Request | Result |
| --- | --- |
| Bedroom across the seeded records | HELP |
| Living room across its ordinary seed schedule | Empty result |
| Range ending exactly when HELP begins | Empty result |

This checked client-visible behavior, not just the detector function.

## 20. Adding automated Morse tests

I saved the tests in [backend/test/morse.test.ts](../backend/test/morse.test.ts).

From `backend/`:

```bash
npm pkg set 'scripts.test:morse=node --import tsx --test test/morse.test.ts'
npm run test:morse
```

The command uses:

- Node.js to run the process.
- `--import tsx` to support TypeScript execution.
- `--test` to run Node.js's test runner.

Supertest sends requests to a test Express application. The normal development server does not need to be running.

Each test uses a separate in-memory database. It does not modify the saved database in `backend/data/`.

The test clock can be controlled, so tests do not need to wait for real seconds.

### The ten cases

1. HELP has the correct start and end times.
2. No records produces an empty array.
3. Another position's records are excluded.
4. Messages outside or cut by the range are excluded.
5. Word spaces are preserved in HELP ME.
6. A long pause separates messages in time order.
7. Ordinary long lighting is not a Morse letter.
8. Invalid input returns HTTP 400.
9. An unfinished sentence waits for final silence.
10. Repeated checks leave stored sessions unchanged.

All ten tests passed.

This suite uses a simplified session table. It does not test the production schema's constraints; those checks were added in the backend suite later.

## 21. Regenerating and checking the demo

To test the local-time seed on a fresh database, I first stopped the server with `Ctrl+C` and ensured no other process was using the database.

From `backend/`:

```bash
BACKUP_DIR="$HOME/Life-Flow-of-Light-backups/$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
mv data "$BACKUP_DIR/"

echo "Database backup saved to: $BACKUP_DIR/data"
```

`BACKUP_DIR` is a shell variable containing the backup destination.

The date command produces a label such as `20261017-152000`.

Moving the complete directory preserves the database and any companion files together. The backup is outside the repository.

This is a way to start fresh while retaining the old records, rather than deleting them.

I then ran:

```bash
npm run typecheck
npm run seed
npm run dev
```

Initialization recreated the data directory and database. The seed inserted the demo records.

`GET /lamps` returned A, B, and C in their expected positions.

The Morse API returned:

```json
{
  "result": [
    {
      "start_time": 1792159126000,
      "end_time": 1792159200000,
      "message": "HELP"
    }
  ]
}
```

These times represent 16 October 2026, 21:58:46–22:00:00 in Asia/Hong_Kong.

This verified the path from generating local-time records to detecting the message through the API.

Changing the seed source later does not rewrite an existing database. The script's new behavior applies when it is next run against empty tables.

## 22. Installing and uninstalling lamps

I added [backend/src/lamp-position-routes.ts](../backend/src/lamp-position-routes.ts).

The server connects it using:

```typescript
import { createLampPositionRouter } from './lamp-position-routes.js';
```

```typescript
app.use(createLampPositionRouter(database));
```

### Installing

```text
PUT /lamps/:id/position
```

Example:

```bash
curl -i -X PUT http://127.0.0.1:3000/lamps/4/position \
  -H 'Content-Type: application/json' \
  -d '{"position":"living_room"}'
```

The handler checks the ID, position, lamp existence, current installation, and destination availability.

| Situation | Result |
| --- | --- |
| Uninstalled lamp and empty destination | Install, HTTP 200. |
| Lamp already at the requested position | Return success without moving it. |
| Lamp already at another position | HTTP 409. |
| Destination occupied by another lamp | HTTP 409. |
| Lamp missing | HTTP 404. |
| Invalid ID or position | HTTP 400. |

Repeating the same successful installation has the same final effect. This makes retries safe for that operation.

### Uninstalling

```text
DELETE /lamps/:id/position
```

Example:

```bash
curl -i -X DELETE http://127.0.0.1:3000/lamps/1/position
```

The handler clears the current position:

```sql
UPDATE lamps
SET position = NULL
WHERE id = ?;
```

It does not delete the lamp or update its historical sessions.

If the lamp is already uninstalled, the request succeeds again.

If the lamp has activity, more than 1,000 milliseconds must have elapsed since its last heartbeat.

Exactly 1,000 milliseconds is still inside the active interval.

A lamp with no recorded activity can be uninstalled immediately.

### Why the transaction matters

Both installation and uninstallation involve reading state before writing.

`BEGIN IMMEDIATE` protects that sequence from another writer changing it between the check and the update.

For example, another writer must not record a new heartbeat after the activity check but before removal.

Expected rejections roll back the transaction. Successful operations commit.

### Replacement without another endpoint

Replacement is a sequence:

1. Stop the old lamp's heartbeats.
2. Wait until more than one second has passed since the final signal.
3. Uninstall it.
4. Install the selected lamp.

The two HTTP requests are not one atomic replacement operation. If installation fails, the position remains empty and the user can retry.

That behavior is acceptable for this PoC, so no separate replacement API was added.

### Manual verification

I confirmed:

- Reinstalling A at its existing position returned 200.
- Trying to install lamp 4 where A was installed returned 409.
- Uninstalling A returned 200.
- Repeating the uninstall returned 200.
- Installing lamp 4 in the empty living room returned 200.

B and C kept their positions.

## 23. Recording heartbeats

I added [backend/src/heartbeat-routes.ts](../backend/src/heartbeat-routes.ts).

The server connects it with:

```typescript
import { createHeartbeatRouter } from './heartbeat-routes.js';
```

```typescript
app.use(createHeartbeatRouter(database));
```

The endpoint is:

```text
POST /lamps/:id/heartbeat
```

Example:

```bash
curl -i -X POST http://127.0.0.1:3000/lamps/4/heartbeat
```

No request body is required.

The server uses its own current time and looks up the lamp's installed position. Client-supplied times or positions do not control the recorded values.

### Continuing or creating a session

| Condition | Action |
| --- | --- |
| Lamp missing | HTTP 404. |
| Lamp uninstalled | HTTP 409. |
| No previous session | Create a session. |
| Same position and gap no greater than 1,000 ms | Update the latest session. |
| Gap greater than 1,000 ms or different position | Create a session. |

The gap is measured from the most recent heartbeat, not from the session's starting time.

A new session has equal started_at and last_seen_at values.

An existing session keeps its started_at and position. Only last_seen_at advances.

New sessions return HTTP 201. Continued sessions return HTTP 200.

The JSON contains:

- `session`: the recorded session.
- `created`: whether a new session was inserted.

The activity lookup and write use one transaction.

A backwards server clock is rejected with HTTP 409 when its value precedes the latest recorded heartbeat. The handler does not move last_seen_at backwards.

### Switching off

The sender simply stops sending heartbeats.

There is no extra switch-off request, ended_at column, or background job marking the row closed.

After more than one second without a signal, activity is considered stopped. A later heartbeat creates a new session.

If the sender stops and resumes within one second, the records may remain in one session. This is a consequence of the chosen timeout.

The system observes signals, not the exact physical position of a real light switch.

### Live verification

A script sent five heartbeats with approximately 200-millisecond pauses, waited 1.2 seconds, and sent another.

The observed session IDs were:

| Step | Result |
| --- | --- |
| Earlier manual signal | Session 32 created. |
| First signal in the script | Session 33 created. |
| Next four signals | Session 33 updated. |
| Signal after the pause | Session 34 created. |

The script waited after each response, so actual spacing was slightly longer than 200 milliseconds.

A second live script checked that:

1. Immediate uninstall after a heartbeat was rejected.
2. The position remained unchanged.
3. Uninstall succeeded after a 1.2-second pause.
4. An uninstalled lamp's heartbeat was rejected.
5. Reinstallation succeeded.

All five checks passed.

These scripts used the running application and its saved database. They therefore created real local demo records.

Automated in-memory tests were added separately.

## 24. Defining the frontend's responsibilities

The planned frontend will keep virtual on/off switches in page memory.

When a new page opens, all switches start off. Names and installation positions are loaded through `GET /lamps`.

| Interaction | Planned frontend behavior |
| --- | --- |
| Switch on | Send immediately, then approximately every 200 ms. |
| Switch off | Stop sending heartbeats. |
| Leave or reload the page | Stop the old page's sender. |
| Open a fresh page | Initialize switches as off. |
| Hover over a position | Display its installed lamp's name. |
| Rename a lamp | Send PATCH, then update the displayed data. |
| Replace a lamp | Stop signals, wait, uninstall, then install. |

The backend does not need a separate on/off status query for this interaction.

Saved installation and temporary switch state are different:

- The lamp remains installed after the page closes.
- The next page starts its switch as off.

Closing a page does not need a reliable final network request. The heartbeat timeout handles the absence of further signals.

Switching tabs is not the same as leaving the page. Hidden-page behavior still needs to be decided and implemented in the frontend.

### Multiple tabs

One page cannot assume another page has stopped sending.

The planned warning is:

> Please use only one tab to control the lamps. Another open tab may continue sending heartbeats, even when a lamp appears off here.

This is guidance, not a backend restriction.

The frontend has not yet been implemented or tested.

## 25. Querying activity for the timeline

I added [backend/src/light-session-routes.ts](../backend/src/light-session-routes.ts).

The server connects it with:

```typescript
import { createLightSessionRouter } from './light-session-routes.js';
```

```typescript
app.use(createLightSessionRouter(database));
```

The endpoint is:

```text
GET /light-sessions?position=bedroom&start_time=...&end_time=...
```

It requires one valid position and a start/end range.

### URL values and validation

URL query values arrive as strings.

The route rejects missing or unsuitable values, then converts valid digit strings into numbers.

Timestamps must be nonnegative safe integers within JavaScript's supported Date range, up to 8,640,000,000,000,000 milliseconds.

The start must be earlier than the end.

### Finding overlap

A session beginning at 18:00 and continuing to 21:00 must appear in a query for 19:00–20:00.

The selection is:

```sql
WHERE position = ?
  AND started_at < ?
  AND last_seen_at >= ?
ORDER BY started_at ASC, id ASC
```

Values are supplied in this order:

1. Position.
2. Requested end.
3. Requested start.

The query includes a session when its recorded heartbeat interval overlaps the requested range.

- A session beginning exactly at the requested end is excluded.
- A heartbeat exactly at the requested start is included.
- A session with only one heartbeat can still be included.

This differs from Morse detection, which returns complete messages within the range.

### Original records remain original

The API returns the stored timestamps without clipping them.

The frontend can draw only the portion visible within its selected range.

The query uses the session's historical position, not the lamp's current installation.

It does not estimate a switch-off time or add a current on/off flag.

### Example request

```bash
NOW_MS=$(node -p 'Date.now()')

curl -sG http://127.0.0.1:3000/light-sessions \
  --data-urlencode 'position=bedroom' \
  --data-urlencode 'start_time=0' \
  --data-urlencode "end_time=$NOW_MS"
```

`-G` puts parameters in the URL for a GET request. `--data-urlencode` encodes parameter values.

The JSON response contains:

- `position`
- `start_time`
- `end_time`
- `sessions`

The outer timestamps repeat the requested range. Each session retains its own original timestamps.

An empty result is successful:

```json
{
  "position": "bedroom",
  "start_time": 0,
  "end_time": 1,
  "sessions": []
}
```

### Output size and freshness

The route allows 50,000 matching sessions.

It fetches one extra row to detect overflow. If too many match, it returns HTTP 422 and asks for a shorter range.

It does not silently return a partial timeline.

Successful responses use `Cache-Control: no-store`, because heartbeats can update records between requests.

### Manual verification

| Query | Result |
| --- | --- |
| Bedroom from zero to now | 19 records: six ordinary sessions and 13 HELP flashes. |
| Living room on 16 October, 19:00–20:00 in Asia/Hong_Kong | A's session beginning at 18:00 appeared. |
| Bedroom from timestamp 0 to 1 | Empty sessions array. |

A's old living-room activity remained searchable after A was uninstalled.

## 26. Making time controllable in tests

A real timer is unsuitable for checking the difference between exactly 1,000 and 1,001 milliseconds.

Execution and network delays could make the result inconsistent.

The heartbeat router already accepted a clock function. I updated the position router to do the same:

```typescript
export function createLampPositionRouter(
  database: DatabaseSync,
  clock: () => number = Date.now
) {
```

In the uninstall check:

```typescript
clock() - recentSession.last_seen_at <= 1_000
```

replaces a direct call to Date.now.

Normal server registration remains:

```typescript
app.use(createLampPositionRouter(database));
```

Because no second argument is provided, normal execution still uses the real clock.

A test can instead supply:

```typescript
let now = 10_000;
const clock = () => now;
```

Both test routers receive this same function.

Changing `now` changes their perceived current time without waiting.

This is a small example of dependency injection: the caller provides something the code depends on, making it easier to test.

The database connection is supplied in the same way.

## 27. Testing the backend with the real schema

I added [backend/test/backend.test.ts](../backend/test/backend.test.ts).

From `backend/`:

```bash
npm pkg set 'scripts.test:backend=node --import tsx --test test/backend.test.ts'

npm run test:backend
```

### Test setup

Each test:

1. Creates `new DatabaseSync(':memory:')`.
2. Executes the actual `schema.sql`.
3. Creates an Express application with JSON parsing.
4. Registers the position, heartbeat, and session-query routers.
5. Gives the time-dependent routers the same controlled clock.
6. Uses Supertest to make requests.
7. Closes the database through `t.after(...)`.

The tests do not import `database.ts`, because doing so would open the normal saved database.

They also do not import `server.ts` or start the normal server on port 3000.

The helper creates lamps and sessions directly as test fixtures. That setup is not a test of the lamp-registration endpoint.

### Assertions

An assertion checks that actual behavior matches the expected behavior.

Examples include:

- `assert.equal(...)` for individual values.
- `assert.deepEqual(...)` for arrays or objects.
- `assert.throws(...)` when a database operation should fail.
- Supertest's `.expect(409)` for an HTTP status.

If an assertion fails, the test reports a failure.

SQLite returns row objects with a null prototype. The helper copies them into ordinary objects before comparing them with ordinary JavaScript objects.

### The twelve cases

1. Multiple uninstalled lamps are allowed, but duplicate positions and serial numbers are rejected.
2. The schema protects serial numbers, valid positions, foreign keys, and session timestamp relationships.
3. Installation is repeatable and cannot overwrite another lamp's position.
4. Invalid IDs, missing lamps, and invalid positions are rejected.
5. A lamp with no activity can be uninstalled repeatedly.
6. Uninstall is blocked at 1,000 ms and allowed at 1,001 ms without changing history.
7. Heartbeats continue at a 1,000 ms gap and start a new session at a 1,001 ms gap.
8. Uninstalled lamps cannot create sessions, and client-supplied time/position values do not control recorded activity.
9. A backwards clock is rejected without modifying sessions.
10. Reinstallation creates new sessions while preserving historical positions.
11. Timeline queries handle overlap and boundaries, sort records, and leave data unchanged.
12. Empty queries succeed and invalid query inputs return HTTP 400.

All twelve tests passed on my machine.

### Why the boundary tests matter

Starting at 10,000 ms:

- A heartbeat at 11,000 ms is exactly one second later, so it continues the session.
- After that update, a heartbeat at 12,001 ms is 1,001 ms after the latest signal, so it starts another session.

For uninstall:

- Last heartbeat at 10,000 ms and current time 11,000 ms: reject.
- Current time 11,001 ms: allow.

The tests encode the requirement “more than one second,” rather than accidentally treating “one second or more” as equivalent.

### What these tests do not prove

The suite checks selected behavior, not every possible case.

For example, it does not provide automated coverage of registration, listing, and renaming. Those were manually exercised.

It does not simulate multiple processes writing concurrently or test every unexpected disk failure.

The 50,000-row scan limits are implemented but are not exercised by these twelve tests.

This keeps the result precise: these tests passed; it does not mean every possible behavior is proven correct.

## 28. Running all tests together

I replaced npm's original test placeholder:

```bash
npm pkg set 'scripts.test=node --import tsx --test test/*.test.ts'
```

Then:

```bash
npm test
```

The pattern `test/*.test.ts` selects the matching test files in the test directory.

At this checkpoint:

| File | Tests |
| --- | --- |
| `test/morse.test.ts` | 10 |
| `test/backend.test.ts` | 12 |
| Total | 22 |

The observed summary was:

```text
tests 22
suites 0
pass 22
fail 0
cancelled 0
skipped 0
todo 0
```

`suites 0` is not an error. These tests are declared directly rather than grouped into named suite blocks.

The focused commands still work:

```bash
npm run test:morse
npm run test:backend
```

`npm test` does not require a development server or a seeded database.

It also does not replace `npm run typecheck`.

## 29. Building and starting the compiled backend

I ran:

```bash
npm run build
```

The command executed `tsc` and completed without errors.

Compilation generated JavaScript under `backend/dist/`.

I stopped the development server with `Ctrl+C`, then ran:

```bash
npm start
```

The terminal showed:

```text
> node dist/server.js

Backend running at http://127.0.0.1:3000
```

In another terminal:

```bash
curl http://127.0.0.1:3000/health
```

The response was:

```json
{"status":"ok","database":"connected"}
```

This confirmed compiled startup and a successful database query.

It also exercised the initialization path that locates the schema and database from the compiled module's location.

### Development versus compiled execution

| Workflow | What runs | After editing source |
| --- | --- | --- |
| `npm run dev` | TypeScript through tsx watch. | Watched changes trigger a restart. |
| `npm run build`, then `npm start` | Generated JavaScript through Node.js. | Rebuild and restart to run the changes. |

Do not start both servers on the same port at the same time.

`schema.sql` remains in `backend/`; TypeScript does not copy it into `dist/`.

Compiled startup still needs that schema file and access to the data directory.

The health request is a smoke check. It does not rerun all HTTP behavior tests against the compiled server.

## 30. Understanding the complete backend flow

The backend now supports the following path:

1. Register a lamp.
2. Optionally give it a short display name.
3. Install it at an available position.
4. Receive heartbeats while the virtual lamp is on.
5. Store a session's start and latest signal time.
6. Query historical activity by position and time range.
7. Optionally scan those records for Morse patterns.

When signals stop, the timestamp stops advancing. The one-second rule determines whether a later signal continues the old session or starts a new one.

### Endpoint reference

| Method and path | Main input | Successful response |
| --- | --- | --- |
| `GET /health` | None | Health JSON. |
| `POST /lamps` | No body required | New lamp, HTTP 201. |
| `GET /lamps` | None | Lamp array. |
| `PATCH /lamps/:id` | JSON `name` | Updated lamp. |
| `PUT /lamps/:id/position` | JSON `position` | Installed lamp. |
| `DELETE /lamps/:id/position` | None | Lamp with position null. |
| `POST /lamps/:id/heartbeat` | No body required | `session` and `created`. |
| `GET /light-sessions` | URL position and time range | Range information and `sessions`. |
| `POST /morse/check` | JSON position and time range | `result` array. |

A no-match query is normal success, not an error.

### What is saved and what is calculated

| Item | Saved? |
| --- | --- |
| Lamp identity, name, and current position | Yes, in lamps. |
| Session start, latest heartbeat, and original position | Yes, in light_sessions. |
| Every individual heartbeat as its own row | No. |
| An ended_at field | No. |
| Replacement history | No. |
| Frontend switch state | Not in the backend database. |
| Detected Morse messages | Calculated when requested. |
| Estimated Morse ending time | Calculated when requested. |

The backend remains small enough to understand as a local PoC.


## 31. Manual API testing reference

This section collects the terminal commands used to check the running backend.

Unlike the automated tests, these requests use the application's real local database. Creating lamps, installing them, and sending heartbeats will change that database.

Read-only requests, such as listing lamps or checking Morse messages, do not change the records.

### 31.1 Start the server in terminal A

From the repository's backend directory:

```bash
cd ~/Life-Flow-of-Light/backend
nvm use
npm run dev
```

Expected startup message:

```text
Backend running at http://127.0.0.1:3000
```

Leave this terminal running.

Open a second terminal for the requests below. Do not start another server on the same port.

In terminal B:

```bash
cd ~/Life-Flow-of-Light/backend
nvm use
```

The curl commands themselves do not depend on this directory, but selecting the project's Node.js version matters for the Node.js examples.

To stop the server later, press `Ctrl+C` in terminal A.

### 31.2 Understanding curl commands

A typical request looks like this:

```bash
curl -i -X PATCH http://127.0.0.1:3000/lamps/4 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Desk lamp"}'
```

| Part | Meaning |
| --- | --- |
| `curl` | Send an HTTP request from the terminal. |
| `-i` | Show response headers as well as the body. |
| `-X PATCH` | Use the PATCH method. |
| `http://127.0.0.1:3000` | Contact the backend on this computer. |
| `/lamps/4` | Address lamp ID 4. |
| `-H` | Add a request header. |
| `Content-Type: application/json` | Tell the server that the body contains JSON. |
| `-d` | Supply the request body. |

The single quotes around the JSON protect its double quotes from the shell.

The backslash at the end of a line continues the command onto the next line. Do not put spaces after that backslash.

For read-only requests, the default method is GET:

```bash
curl http://127.0.0.1:3000/lamps
```

For cleaner output, `-sS` hides the progress meter while retaining curl's error messages.

An HTTP error such as 409 can be an expected test result. Read both the status and the JSON body.

### 31.3 Check connectivity

```bash
curl -i http://127.0.0.1:3000/health
```

Expected status:

```text
HTTP/1.1 200 OK
```

Expected body:

```json
{"status":"ok","database":"connected"}
```

This confirms that the running server can query SQLite.

### 31.4 List and register lamps

List the current lamps:

```bash
curl -i http://127.0.0.1:3000/lamps
```

The response is a JSON array.

Register a new lamp:

```bash
curl -i -X POST http://127.0.0.1:3000/lamps
```

Expected status: `201 Created`.

The new lamp should have:

- An integer ID.
- A random UUID serial number.
- A default name equal to that UUID.
- A null position.

Every successful POST creates another lamp. Do not repeat it merely to refresh the list.

For the remaining examples, record the ID returned by registration.

If the new ID is 4, set:

```bash
LAMP_ID=4
```

Replace `4` with your actual ID.

This shell variable exists only in the current terminal session.

### 31.5 Rename a lamp

```bash
curl -i -X PATCH "http://127.0.0.1:3000/lamps/$LAMP_ID" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Desk lamp"}'
```

Expected result:

- HTTP 200.
- Name becomes `Desk lamp`.
- Serial number remains unchanged.

Try a name containing only spaces:

```bash
curl -i -X PATCH "http://127.0.0.1:3000/lamps/$LAMP_ID" \
  -H 'Content-Type: application/json' \
  -d '{"name":"   "}'
```

Expected result: HTTP 400.

Try a 21-character name:

```bash
curl -i -X PATCH "http://127.0.0.1:3000/lamps/$LAMP_ID" \
  -H 'Content-Type: application/json' \
  -d '{"name":"123456789012345678901"}'
```

Expected body:

```json
{"error":"Name must not exceed 20 characters."}
```

List the lamps again to confirm that rejected names did not replace the valid name:

```bash
curl http://127.0.0.1:3000/lamps
```

### 31.6 Check installation conflicts

The examples in this subsection assume:

- The seed has created A with ID 1 in living_room.
- The new lamp identified by LAMP_ID is uninstalled.

First, repeat A's existing installation:

```bash
curl -i -X PUT http://127.0.0.1:3000/lamps/1/position \
  -H 'Content-Type: application/json' \
  -d '{"position":"living_room"}'
```

Expected result: HTTP 200, with A still in living_room.

Now try installing the new lamp in that occupied position:

```bash
curl -i -X PUT "http://127.0.0.1:3000/lamps/$LAMP_ID/position" \
  -H 'Content-Type: application/json' \
  -d '{"position":"living_room"}'
```

Expected result: HTTP 409.

```json
{"error":"Position is already occupied."}
```

Neither lamp should move.

If the database has a different installation arrangement, use GET /lamps to identify an occupied position and an uninstalled lamp before repeating this test.

### 31.7 Uninstall the old lamp and install the new one

Stop any heartbeat sender for A before this step. Its last heartbeat must be more than one second old.

Remove A's installation:

```bash
curl -i -X DELETE http://127.0.0.1:3000/lamps/1/position
```

Expected result: HTTP 200, with A's position set to null.

Repeat the same request:

```bash
curl -i -X DELETE http://127.0.0.1:3000/lamps/1/position
```

Expected result: HTTP 200 again.

A is still registered. Its historical lighting sessions have not been deleted.

Install the selected lamp in the empty living room:

```bash
curl -i -X PUT "http://127.0.0.1:3000/lamps/$LAMP_ID/position" \
  -H 'Content-Type: application/json' \
  -d '{"position":"living_room"}'
```

Expected result: HTTP 200, with position living_room.

Check the final arrangement:

```bash
curl http://127.0.0.1:3000/lamps
```

A should be uninstalled, and the selected lamp should occupy living_room.

### 31.8 Send one heartbeat

For an installed lamp:

```bash
curl -i -X POST "http://127.0.0.1:3000/lamps/$LAMP_ID/heartbeat"
```

If there is no recent session, expect HTTP 201 and:

```json
{
  "session": {
    "id": 32,
    "lamp_id": 4,
    "position": "living_room",
    "started_at": 1792336215364,
    "last_seen_at": 1792336215364
  },
  "created": true
}
```

The IDs and timestamps above are an example from an earlier run. Your values may differ.

If the previous signal arrived no more than one second ago at the same position, expect HTTP 200 and `created: false`.

Sending this request once does not keep the lamp active indefinitely. A continuous sender is needed for ongoing activity.

### 31.9 Simulate continuous heartbeats and a pause

Typing curl repeatedly is not accurate enough to produce signals every 200 milliseconds.

The following script sends five signals, pauses for 1.2 seconds, and sends one more.

It assumes lamp 4 is installed in living_room. Change the ID if necessary.

```bash
node --input-type=module <<'JS'
const lampId = 4;
const url = `http://127.0.0.1:3000/lamps/${lampId}/heartbeat`;

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function heartbeat() {
  const response = await fetch(url, { method: 'POST' });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(body));
  }

  console.log({
    status: response.status,
    session_id: body.session.id,
    created: body.created,
    started_at: body.session.started_at,
    last_seen_at: body.session.last_seen_at
  });
}

// Let any earlier signal time out.
await wait(1_200);

// Send five signals with approximate 200 ms spacing.
for (let index = 0; index < 5; index += 1) {
  await heartbeat();

  if (index < 4) {
    await wait(200);
  }
}

console.log('Light off: waiting 1.2 seconds.');
await wait(1_200);

// This should create a new session.
await heartbeat();
JS
```

`<<'JS'` starts a block of text passed to Node.js through standard input. The final `JS` must appear alone on its line.

Quoting the opening delimiter prevents the shell from expanding JavaScript expressions inside the block.

`--input-type=module` allows this input to use module syntax and top-level await.

The script uses:

- `fetch` to make HTTP requests.
- `await` to wait for each request or pause.
- `setTimeout` to schedule a pause.
- `response.ok` to check whether the response status indicates success.

Expected behavior:

1. The first signal creates a session.
2. The next four signals use the same session ID.
3. started_at remains unchanged.
4. last_seen_at advances.
5. The signal after the pause creates a different session.

Because the script waits after each response, the actual spacing is a little longer than 200 milliseconds.

This is a useful live check. The automated tests are more suitable for exact timing boundaries.

### 31.10 Check that an active lamp cannot be uninstalled

This script changes the real installation temporarily and restores it if all checks succeed.

It assumes lamp 4 is installed in living_room and no other page or script is sending heartbeats for it.

```bash
node --input-type=module <<'JS'
import assert from 'node:assert/strict';

const base = 'http://127.0.0.1:3000';
const lampId = 4;

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, method, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body === undefined
      ? {}
      : { 'Content-Type': 'application/json' },
    body: body === undefined
      ? undefined
      : JSON.stringify(body)
  });

  return {
    status: response.status,
    body: await response.json()
  };
}

// Record activity and immediately request removal.
const heartbeat = await request(
  `/lamps/${lampId}/heartbeat`,
  'POST'
);

assert.ok(
  heartbeat.status === 200 || heartbeat.status === 201,
  JSON.stringify(heartbeat)
);

const blocked = await request(
  `/lamps/${lampId}/position`,
  'DELETE'
);

assert.equal(blocked.status, 409, JSON.stringify(blocked));
console.log('PASS: a recently active lamp cannot be uninstalled.');

// A rejected removal must leave the position unchanged.
const lamps = await request('/lamps', 'GET');

assert.equal(lamps.status, 200);
assert.equal(
  lamps.body.find((lamp) => lamp.id === lampId)?.position,
  'living_room'
);

console.log('PASS: the lamp is still installed in the living room.');

// Send no signals during this pause.
await wait(1_200);

const removed = await request(
  `/lamps/${lampId}/position`,
  'DELETE'
);

assert.equal(removed.status, 200, JSON.stringify(removed));
assert.equal(removed.body.position, null);
console.log('PASS: the lamp can be uninstalled after the timeout.');

// An uninstalled lamp cannot record new activity.
const rejected = await request(
  `/lamps/${lampId}/heartbeat`,
  'POST'
);

assert.equal(rejected.status, 409, JSON.stringify(rejected));
console.log('PASS: an uninstalled lamp cannot send accepted heartbeats.');

// Restore the installation.
const installed = await request(
  `/lamps/${lampId}/position`,
  'PUT',
  { position: 'living_room' }
);

assert.equal(installed.status, 200, JSON.stringify(installed));
assert.equal(installed.body.position, 'living_room');
console.log('PASS: lamp 4 is installed in the living room again.');
JS
```

`assert` stops the script if a result differs from the expectation.

A successful run prints five PASS messages.

If it stops midway, inspect GET /lamps before continuing. Restoration at the end only happens if execution reaches that step.

A very long delay between the first two requests could allow the timeout to expire. The controlled-clock automated test is the definitive check of the exact boundary.

### 31.11 Query the bedroom timeline

```bash
NOW_MS=$(node -p 'Date.now()')

curl -sS -G http://127.0.0.1:3000/light-sessions \
  --data-urlencode 'position=bedroom' \
  --data-urlencode 'start_time=0' \
  --data-urlencode "end_time=$NOW_MS"
```

`-G` places the supplied parameters in the URL and makes a GET request.

`--data-urlencode` handles encoding for each parameter.

`NOW_MS` receives the current Unix timestamp in milliseconds.

Double quotes around `"end_time=$NOW_MS"` allow the shell to substitute the variable's value.

With the original seed and no additional bedroom activity, expect 19 sessions:

- Six ordinary sessions.
- Thirteen HELP flashes.

The result is ordered by starting time.

This broad query is convenient for a small demo. Use a narrower range when the database grows.

### 31.12 Check a session crossing the requested range

In the seed generated on 17 October 2026, A was on in the living room from 18:00 to 21:00 on 16 October.

Request only 19:00–20:00:

```bash
START_MS=$(node -p 'Date.parse("2026-10-16T19:00:00+08:00")')
END_MS=$(node -p 'Date.parse("2026-10-16T20:00:00+08:00")')

curl -sS -G http://127.0.0.1:3000/light-sessions \
  --data-urlencode 'position=living_room' \
  --data-urlencode "start_time=$START_MS" \
  --data-urlencode "end_time=$END_MS"
```

Expected result: A's session is included even though it started before the requested range.

Its original timestamps remain unchanged:

- started_at corresponds to 18:00.
- last_seen_at corresponds to 20:59:59.800.

The `+08:00` offset belongs to this particular test fixture. The endpoint itself accepts timestamps and does not have a fixed timezone.

If the seed was generated on different dates or in another timezone, adjust these example times to match that dataset.

### 31.13 Check an empty timeline result

```bash
curl -i -G http://127.0.0.1:3000/light-sessions \
  --data-urlencode 'position=bedroom' \
  --data-urlencode 'start_time=0' \
  --data-urlencode 'end_time=1'
```

For our demo database, expect HTTP 200:

```json
{
  "position": "bedroom",
  "start_time": 0,
  "end_time": 1,
  "sessions": []
}
```

No matching records is not an error.

### 31.14 Check invalid timeline input

Use an invalid position:

```bash
curl -i -G http://127.0.0.1:3000/light-sessions \
  --data-urlencode 'position=kitchen' \
  --data-urlencode 'start_time=0' \
  --data-urlencode 'end_time=1000'
```

Expected result: HTTP 400.

Use equal start and end values:

```bash
curl -i -G http://127.0.0.1:3000/light-sessions \
  --data-urlencode 'position=bedroom' \
  --data-urlencode 'start_time=1000' \
  --data-urlencode 'end_time=1000'
```

Expected result: HTTP 400.

```json
{"error":"start_time must be earlier than end_time."}
```

These requests check input validation rather than searching for real activity.

### 31.15 Find HELP through the Morse API

```bash
NOW_MS=$(node -p 'Date.now()')

curl -sS -X POST http://127.0.0.1:3000/morse/check \
  -H 'Content-Type: application/json' \
  -d "{\"position\":\"bedroom\",\"start_time\":0,\"end_time\":$NOW_MS}"
```

The request body must contain numeric timestamps.

The double quotes around the shell argument allow `$NOW_MS` to expand. The backslashes protect the quotation marks required by JSON.

For the seed generated on 17 October 2026 in Asia/Hong_Kong, the observed result was:

```json
{
  "result": [
    {
      "start_time": 1792159126000,
      "end_time": 1792159200000,
      "message": "HELP"
    }
  ]
}
```

A seed generated at another time will use different timestamps.

### 31.16 Check a position without a demo message

```bash
NOW_MS=$(node -p 'Date.now()')

curl -sS -X POST http://127.0.0.1:3000/morse/check \
  -H 'Content-Type: application/json' \
  -d "{\"position\":\"living_room\",\"start_time\":0,\"end_time\":$NOW_MS}"
```

For the original seed schedule, expect:

```json
{"result":[]}
```

Later manual activity may introduce other patterns. This expectation applies to the seed's ordinary living-room records, not every possible future database state.

### 31.17 Check the Morse range boundary

Using the HELP start timestamp from the example above:

```bash
HELP_START_MS=1792159126000

curl -i -X POST http://127.0.0.1:3000/morse/check \
  -H 'Content-Type: application/json' \
  -d "{\"position\":\"bedroom\",\"start_time\":0,\"end_time\":$HELP_START_MS}"
```

The range ends exactly when HELP begins, so it does not contain HELP.

For the demo dataset, expect HTTP 200:

```json
{"result":[]}
```

Use the actual HELP start timestamp from your own result if the demo was regenerated on another date.

### 31.18 Make JSON easier to read

If Python 3 is available, pipe a JSON response through its formatter:

```bash
curl -sS http://127.0.0.1:3000/lamps \
  | python3 -m json.tool
```

The pipe passes curl's response body to Python.

`python3 -m json.tool` formats JSON with indentation. It is only a display helper; it is not part of the backend.

Do not use curl's `-i` option in this pipeline. HTTP headers are not JSON and would prevent the formatter from reading the input.

### 31.19 Repeat the health check after compilation

In terminal A, stop the development server with `Ctrl+C`.

Then:

```bash
npm run build
npm start
```

Expected startup command:

```text
node dist/server.js
```

In terminal B:

```bash
curl -i http://127.0.0.1:3000/health
```

Expected result: HTTP 200 with the normal health JSON.

This distinguishes checking the compiled server from checking the development server.

The compiled server uses the same local database. Do not rerun the seed just because the execution mode changed.

### 31.20 What manual testing adds

Manual requests let me see the application as an HTTP client sees it:

- Which URL and method to use.
- What JSON to send.
- What status and body come back.
- How one successful operation changes the next operation.

Automated tests make those expectations repeatable, especially for exact timing and database boundaries.

Both are useful, but they use different environments:

| Test style | Server | Database |
| --- | --- | --- |
| curl and live Node.js scripts | Running local backend | Saved local database |
| npm test | Test applications created by the tests | Independent in-memory databases |

Before repeating a manual sequence, inspect the existing lamps and installations. Example IDs and dates are fixtures from particular runs, not permanent values built into the application.


## 32. Current checkpoint — 19 October 2026

| Item | Status |
| --- | --- |
| SQLite initialization | Verified. |
| Database constraints and serial-number trigger | Selected cases verified by automated tests using the real schema. |
| Health endpoint | Manually verified. |
| Local-time three-day seed | Generated and checked through the API. |
| Registration, listing, and renaming | Manually verified. |
| Installation and uninstallation | Manually and automatically checked. |
| Active-lamp uninstall restriction | Verified, including exact timeout boundaries. |
| Heartbeat session handling | Manually and automatically checked. |
| Historical activity queries | Manually and automatically checked. |
| Morse detection | Ten automated tests passed. |
| Combined automated tests | 22 passed, zero failed. |
| TypeScript build | Succeeded. |
| Compiled startup | Succeeded. |
| Health check from compiled startup | Succeeded. |
| Frontend | Not yet implemented. |
| Fresh-machine User Guide walkthrough | Drafted; not yet tested end to end. |

The backend is ready for the agreed local PoC workflow and frontend integration.

A separate replacement endpoint and a current on/off status endpoint are intentionally outside this design. Existing installation operations and frontend switch state cover the planned interaction.

This checkpoint is not a claim that public deployment preparation or exhaustive testing is complete.

Future frontend work can use these APIs without rebuilding the backend concept.

### Commands to remember

From `backend/`:

```bash
# Select the project's Node.js version.
nvm use

# Check application source types.
npm run typecheck

# Run both automated test files.
npm test

# Compile application source.
npm run build

# Start the compiled backend.
npm start
```

For active development, use `npm run dev` instead of `npm start`.

Run `npm ci` when setting up the project or reinstalling locked dependencies, not before every start.

Run `npm run seed` only when deliberately generating the demo on empty tables.

### Keeping the explanation and code together

These notes explain the implementation, but the repository contains the executable source.

When preserving this checkpoint, keep the source, schema, tests, package files, and documentation together in the same project revision.

Keep database backups separately, because ignored local data is not preserved by Git.

I can now return to a working backend, rerun its checks, and use these notes to understand the choices behind it without assuming that I remember every step.

---

## 33. Using “bulb” consistently — 23 October 2026

We now use **bulb** to mean the individual light bulb in this project.

Earlier sections use the word **lamp**. Those sections describe the earlier version. When following their commands with the current backend, use the new names below.

| Earlier name | Current name |
| --- | --- |
| `lamps` database table | `bulbs` |
| `lamp_id` session column | `bulb_id` |
| `/lamps` API path | `/bulbs` |
| `Lamp` TypeScript type | `Bulb` |

For example:

```bash
curl http://127.0.0.1:3000/bulbs
```

The change also applies to longer API paths:

```text
PUT /bulbs/:id/position
DELETE /bulbs/:id/position
POST /bulbs/:id/heartbeat
```

The names `light_sessions` and `/light-sessions` stay the same. They describe periods of lighting activity.

Changing a word in TypeScript does not rename an existing database table. The SQL schema and the database must agree with the code.

For this development reset, I chose not to keep the old records. I deleted the old database and used the updated schema to create a new one through the seed command.

This was a fresh start, not a migration of old records.

## 34. Keeping bulb management APIs together

The bulb management endpoints now live together in:

```text
backend/src/routes-bulb.ts
```

This file contains six endpoints:

| Method and path | Purpose |
| --- | --- |
| `POST /bulbs` | Register a bulb. |
| `GET /bulbs` | List registered bulbs. |
| `PATCH /bulbs/:id` | Change a bulb’s name. |
| `PUT /bulbs/:id/position` | Install a bulb. |
| `DELETE /bulbs/:id/position` | Uninstall a bulb. |
| `DELETE /bulbs/:id` | Delete an unused bulb. |

A **router** is a group of request handlers.

Each handler answers one kind of request. For example, the handler for `GET /bulbs` reads the database and returns the bulb list.

The file exports this function:

```ts
export function createBulbRouter(
  database: DatabaseSync,
  clock: () => number = Date.now
) {
  const router = Router();

  // Register the bulb endpoints here.

  return router;
}
```

Calling the function creates the router. It receives the database connection it should use.

`server.ts` connects that router to the application:

```ts
import { createBulbRouter } from './routes-bulb.js';

app.use(createBulbRouter(database));
```

The exported name and the imported name must match exactly.

One `app.use` is enough here because all six handlers belong to the returned router.

The UUID generator is now imported in `routes-bulb.ts`, where registration happens:

```ts
import { randomUUID } from 'node:crypto';
```

It is no longer needed in `server.ts`.

The main jobs of `server.ts` are now easier to see:

1. Create the Express application.
2. Enable JSON request parsing.
3. Register the routers.
4. Provide the health endpoint.
5. Start listening for requests.

Heartbeat, timeline, and Morse endpoints remain in their own files.

## 35. Deleting an unused bulb

Deleting a bulb and uninstalling a bulb are different actions.

**Uninstalling** sets its current position to `NULL`. The bulb still exists and can be installed again.

**Deleting** removes its row from the `bulbs` table.

The delete endpoint is:

```text
DELETE /bulbs/:id
```

Its rules are:

| Situation | Result |
| --- | --- |
| Uninstalled, with no lighting history | Delete it and return `200`. |
| Still installed | Return `409`. |
| Uninstalled, but has lighting history | Return `409`. |
| Bulb does not exist | Return `404`. |
| Invalid ID | Return `400`. |

A successful response looks like this:

```json
{
  "deleted": true,
  "id": 4
}
```

The endpoint does not delete historical sessions.

A session contains a `bulb_id` that refers to a bulb. Keeping that bulb preserves the connection between the identity and its history.

The database foreign key also protects this connection:

```sql
FOREIGN KEY (bulb_id) REFERENCES bulbs(id)
    ON DELETE RESTRICT
```

The API checks the rules first so it can return a clear response. The database constraint provides another layer of protection.

The checks and deletion happen inside one transaction. Another database writer cannot install the bulb between the check and the deletion.

## 36. Rebuilding and checking the demo

After removing the old database, I ran these commands from `backend/`:

```bash
npm run typecheck
npm run seed
npm run dev
```

The seed imports `database.ts`. That module opens a database file and applies `schema.sql`, so a separate manual database-creation command is not needed.

The seed creates:

- Three bulbs: A, B, and C.
- Thirty-one lighting sessions.
- Three complete local calendar days before the execution date.
- A HELP pattern in the bedroom on the third evening.

The seed uses the timezone of the computer running it. It does not force every user to use my timezone.

The database still stores **Unix timestamps in milliseconds**.

In another terminal, I checked the bulbs:

```bash
curl -sS http://127.0.0.1:3000/bulbs \
  | python3 -m json.tool
```

The response showed:

| Bulb | Position |
| --- | --- |
| A | `living_room` |
| B | `bedroom` |
| C | `bathroom` |

I also checked the Morse endpoint:

```bash
NOW_MS=$(node -p 'Date.now()')

curl -sS -X POST http://127.0.0.1:3000/morse/check \
  -H 'Content-Type: application/json' \
  -d "{\"position\":\"bedroom\",\"start_time\":0,\"end_time\":$NOW_MS}" \
  | python3 -m json.tool
```

It returned a message containing:

```json
"message": "HELP"
```

These manual checks confirmed that the new database, bulb listing, seed, and Morse query worked together on my computer.

Moving routes between source files does not require another database reset.

## 37. Organizing tests by responsibility

The previous test folder had two main files:

```text
backend.test.ts
morse.test.ts
```

As the backend grew, the first file covered several different areas. It became harder to tell where a new test belonged.

We replaced that arrangement with smaller files.

| File in `backend/test/` | What it checks |
| --- | --- |
| `schema.test.ts` | Database rules. |
| `bulb-routes.test.ts` | The six bulb management endpoints. |
| `heartbeat-routes.test.ts` | Heartbeat requests and session timing. |
| `light-session-routes.test.ts` | Timeline queries. |
| `morse-routes.test.ts` | The Morse HTTP endpoint. |
| `morse.test.ts` | The Morse decoder itself. |
| `integration.test.ts` | A workflow using several routers together. |
| `seed.test.ts` | Demo generation and protection against overwriting data. |
| `server.test.ts` | API registration in the real server. |

There are also three support files:

| File | Purpose |
| --- | --- |
| `helpers.ts` | Shared tools for preparing tests. |
| `project-helper.ts` | A temporary project for seed and server tests. |
| `tsconfig.json` | Type-checking settings for test code. |

The old `backend.test.ts` is removed. Its useful checks are carried into the new files.

The new `morse.test.ts` replaces the old version. HTTP-related Morse checks now belong in `morse-routes.test.ts`.

The command still runs everything together:

```bash
npm test
```

Splitting files changes how we organize the tests. It does not mean we must run every file by hand.

## 38. Understanding the helper files

A **helper** is a small function that does a repeated task for other code.

For example, many tests need an empty database. Instead of copying the database setup into every file, they call:

```ts
const db = databaseFor(t);
```

### `helpers.ts`: preparing small test environments

This file provides the following tools:

| Helper | Simple explanation |
| --- | --- |
| `databaseFor(t)` | Create an empty database using the real schema. |
| `apiFor(router)` | Create a small Express app for testing one router. |
| `addBulb(...)` | Insert a bulb needed by a test. |
| `addSession(...)` | Insert a known lighting record. |
| `snapshot(db)` | Read both tables so a test can compare before and after. |
| `addMorse(...)` | Insert pulses for a known Morse pattern. |
| `addManySessions(...)` | Insert enough records to check query limits. |

Most tests use:

```ts
new DatabaseSync(':memory:')
```

This database exists in memory. It is not the database in `backend/data`.

Each test gets its own database, so one test does not depend on records left by another test.

The helper also arranges for the connection to close after the test.

### Test data is not a test result

A **fixture** is data prepared for a test.

For example:

```ts
addBulb(db, 1, 'bedroom');
```

This prepares a bulb for a heartbeat test. It does not prove that `POST /bulbs` works, because it inserts directly into SQLite.

To test registration, we must send an actual request:

```ts
await api.post('/bulbs').expect(201);
```

This distinction helps us understand what each test proves.

### Comparing before and after

A snapshot lets us check that a rejected request changed nothing:

```ts
const before = snapshot(db);

// Send a request that should be rejected.

assert.deepEqual(snapshot(db), before);
```

Checking the status code alone would not catch a bug where the API returns `409` but has already changed the database.

### `project-helper.ts`: testing code that opens database files

`seed.ts` and `server.ts` import `database.ts`.

If a test imported them directly from the normal project, they could open the saved development database.

The project helper avoids this by creating a temporary copy containing:

- The source files.
- The SQL schema.
- A small package configuration.
- A link to the already installed packages.

It starts a separate Node.js process in that temporary directory.

That process creates its own database. The helper removes the temporary project after the test.

It does not download packages again or copy the development database.

## 39. Understanding the different kinds of tests

A test usually has three steps:

1. Prepare a known situation.
2. Perform an action.
3. Check the result.

An **assertion** is the check in step three.

For example:

```ts
assert.equal(response.body.position, null);
```

This means: “The returned position must be `null`.”

If the result is different, the test fails.

### Database tests

`schema.test.ts` sends SQL directly to SQLite.

It checks rules such as:

- Two installed bulbs cannot occupy the same position.
- Serial numbers must be unique.
- A serial number cannot change.
- A session must refer to an existing bulb.
- A bulb with history cannot be deleted.
- A session cannot end its recorded activity before it starts.

These checks test the database’s protection, even without Express.

### Router tests

Files ending in `-routes.test.ts` send HTTP requests through Supertest.

Supertest helps us call an Express app from a test. We do not need to start `npm run dev` first.

For example:

```ts
await api.delete('/bulbs/1').expect(409);
```

This checks that the request receives HTTP `409`.

The test can also inspect the response body and database records.

### Decoder tests

`morse.test.ts` calls `detectMorse()` directly.

There is no database or HTTP request in these tests.

This makes it easier to check small details:

- All letters from A to Z.
- Dot and dash duration limits.
- Gaps between signals, letters, and words.
- Unknown patterns.
- Overlapping records.
- Different bulb identities.
- Whether the decoder leaves its input unchanged.

Separating these tests helps locate a problem.

For example, if the decoder tests pass but the Morse API tests fail, the problem may be in input validation, SQL queries, or how the API calls the decoder.

### Integration tests

An integration test checks several parts working together.

Our `integration.test.ts` follows this workflow:

1. Register a bulb.
2. Install it in the bedroom.
3. Send a heartbeat.
4. Move time forward until it is off.
5. Uninstall and reinstall it.
6. Send another heartbeat.
7. Move it to the bathroom.
8. Check that the old bedroom records still exist.

This checks the connections between features.

### Seed tests

The seed tests use a fixed date inside a separate test process.

One case crosses a year boundary. Another crosses a daylight-saving change in New York.

They check that the seed produces the previous three local dates, with the expected lighting times and HELP message.

They also run the seed again and confirm that existing records are preserved.

The fixed test dates do not change the real seed. Normal use still follows the actual execution date.

### Server registration tests

Router tests can pass even if `server.ts` forgets to register a router.

`server.test.ts` imports the real server in the temporary project and calls every API group.

For this test only, it uses a free port chosen by the operating system. It does not take over port 3000.

This test checks source startup and route registration. We still run `npm run build` to check compilation separately.

## 40. Adding checks that were missing

The expanded tests cover more than the earlier suite.

### Bulb management

We now check:

- Registration creates a UUID and uses it as the default name.
- New bulbs are uninstalled.
- Listing includes installed and uninstalled bulbs.
- Renaming trims surrounding spaces.
- Twenty code points are accepted; twenty-one are rejected.
- Renaming changes no serial number, position, or history.
- Deletion removes only an uninstalled bulb without history.
- A rejected deletion preserves all records.

The name tests include English, Chinese, and simple emoji.

The current rule counts Unicode **code points**. A complex emoji can contain more than one code point, even if it looks like one symbol on screen.

### Timing boundaries

We check values exactly at the boundary and just beyond it.

For heartbeat handling:

| Gap since the last heartbeat | Expected behavior |
| --- | --- |
| 1,000 ms | Continue the session. |
| 1,001 ms | Create a new session. |

For the final silence after a Morse message:

| Silence after estimated switch-off | Expected behavior |
| --- | --- |
| 17,500 ms | Keep waiting. |
| 17,501 ms | Return the completed message. |

Tests control the clock directly. They do not spend real time waiting for these intervals.

### Query limits

The timeline and Morse APIs have a limit of 50,000 matching or scanned sessions.

We check both sides:

- 50,000 records: the query is allowed.
- 50,001 records: return `422`.

This protects against a response that silently leaves out part of the requested data.

### Morse tests use the real schema

The Morse API tests now create the real tables from `schema.sql`.

They register a fixture bulb before inserting its sessions, so the foreign key is active during the tests.

The separate decoder tests can still supply unusual or invalid records directly to check how the decoder handles them.

## 41. Checking test code and running the suite

TypeScript checks and automated tests answer different questions.

**TypeScript checking** can find problems such as an unknown function name or a wrong argument type.

**Running tests** checks behavior, such as whether a request returns `409` and leaves the data unchanged.

We need both.

### Type-checking the tests

The main TypeScript configuration originally focused on `src`.

We added:

```text
backend/test/tsconfig.json
```

It includes both application source and test files.

Its `noEmit` setting means:

> Check the code, but do not create JavaScript output files.

This helps catch mistakes inside tests before running them.

### Updating npm scripts

From `backend/`:

```bash
npm pkg set 'scripts.typecheck:tests=tsc --project test/tsconfig.json'

npm pkg set 'scripts.test=npm run typecheck:tests && node --import tsx --test test/*.test.ts'

npm pkg delete scripts.test:backend

npm pkg set 'scripts.test:bulbs=node --import tsx --test test/bulb-routes.test.ts'

npm pkg set 'scripts.test:heartbeat=node --import tsx --test test/heartbeat-routes.test.ts'

npm pkg set 'scripts.test:timeline=node --import tsx --test test/light-session-routes.test.ts'

npm pkg set 'scripts.test:morse=node --import tsx --test test/morse.test.ts test/morse-routes.test.ts'
```

These commands update `package.json`. They do not install new packages.

The old `test:backend` shortcut is removed because `backend.test.ts` no longer exists.

### Running everything

```bash
npm test
```

The command first checks the TypeScript code.

The `&&` means the tests run only if that check succeeds.

Then:

```text
node --import tsx --test test/*.test.ts
```

means:

- `node`: run Node.js.
- `--import tsx`: enable running the TypeScript files.
- `--test`: use Node’s test runner.
- `test/*.test.ts`: select all files in `test` whose names end with `.test.ts`.

The helper files do not match that filename pattern. They are loaded when a test imports them.

### Running one area

```bash
npm run test:bulbs
npm run test:heartbeat
npm run test:timeline
npm run test:morse
```

These shortcuts run their selected tests. They do not run the separate type-checking step.

To check all test types:

```bash
npm run typecheck:tests
```

To run a file without a shortcut:

```bash
node --import tsx --test test/seed.test.ts
```

### Understanding the result

The replacement suite contains 41 top-level tests.

Some tests check several examples, such as all 26 letters or several invalid IDs. Therefore, 41 is not the total number of individual assertions.

The expected summary is:

```text
ℹ tests 41
ℹ pass 41
ℹ fail 0
```

A passing suite means the checked examples behaved as expected. It does not prove that every possible input or future change is safe.

## 42. Checkpoint — 23 October 2026

The backend now uses `bulb` consistently in its current source, database schema, and bulb API paths.

Bulb management endpoints are grouped in `routes-bulb.ts`. The server registers them through `createBulbRouter`.

I manually confirmed that:

- `GET /bulbs` returns A, B, and C at the expected positions.
- The Morse endpoint finds HELP in the regenerated bedroom records.

The replacement test suite was prepared and checked by the AI assistant against the supplied backend source:

- Test TypeScript checking passed.
- All 41 tests passed.

At the time of this note, I had not yet recorded my own terminal result for the complete replacement suite.

After creating the files on my computer, the next checks are:

```bash
cd ~/Life-Flow-of-Light/backend

npm test
npm run build
```

The automated tests use memory databases or temporary project databases. The manual `curl` commands use the running backend and its saved database.

No new seed run is needed just because the test folder changed.

I do not need to understand every helper immediately. When maintaining one feature, I can start with its matching test file, read the test names, and follow the prepared situation, action, and expected result.
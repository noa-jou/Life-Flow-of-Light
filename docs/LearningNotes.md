# Life Flow of Light — Learning Notes

## Learning record: Setup, database initialization, and demo data

**Started Date:** 15 October 2026  
**Updated through:** 18 October 2026  
**Scope:** Backend setup, SQLite initialization, local-time demo data, lamp registration and naming, installation and removal, heartbeat recording, lighting-session queries, and Morse detection. Includes manual API checks, live verification scripts, and ten passing Morse tests.

## About these notes

I am building Life Flow of Light as a learning project. I proposed the product concept and requirements, and I am using ChatGPT to help explain technical choices, suggest commands, and develop the implementation step by step.

These notes document what I have done and what the commands mean. Successfully running a command does not mean I have already mastered the technology. Some explanations here were prepared with ChatGPT's assistance, and I will revisit them as I gain practical experience.

This file is a learning record. `UserGuide.md` will explain how readers can install, run, and test the project.

## 1. Checking the starting point

```bash
ls -al
```

This lists files in the current directory. `-a` includes hidden names such as `.git`, and `-l` shows details. My initial project contained a Git repository and two README files. Their product descriptions are separate from the backend implementation.

```bash
cat /etc/os-release
node -v
npm -v
```

- `cat` prints a file's contents. `/etc/os-release` identifies the Linux distribution.
- `node -v` shows the installed Node.js version.
- `npm -v` shows the installed npm version.

My Chromebook's Linux environment is **Debian GNU/Linux 12 (bookworm)**. It uses `apt` for system packages. I initially had Node.js **18.20.4** and npm **9.2.0**.

### The tools have different jobs

| Tool | Purpose in this project |
| --- | --- |
| `apt` | Install Debian system tools, such as curl. |
| `nvm` | Install and select Node.js versions for my user account. |
| Node.js | Run backend JavaScript and provide the built-in SQLite module. |
| `npm` | Install project dependencies and run scripts defined in package.json. |
| Git | Track changes to the project's files. |

## 2. Keeping backend files together

The setup instructions were:

```bash
cd ~/Life-Flow-of-Light
mkdir -p backend
cd backend
```

`cd` changes the working directory. `~` means my home directory. `mkdir -p` creates a directory if needed and does not fail simply because it already exists.

The backend has its own package files and dependencies. The README files, icon, `.gitignore`, and project-wide guides belong in the repository root. A future frontend can have a separate `frontend/` directory. React and TypeScript were suggested for that frontend, but no frontend was built in this stage.

## 3. Preparing .gitignore

I placed `.gitignore` at the repository root so its rules also apply to backend subdirectories.

The suggested rules exclude installed dependencies (`node_modules/`), generated output (`dist/`, `build/`), local SQLite databases and temporary files, local environment files, logs, coverage reports, and tool caches.

These files still exist on my computer. Ignoring them does not hide them in the editor or delete them. It tells Git not to add matching untracked files. Files already tracked by Git require separate handling.

I should commit source code, tests, `schema.sql`, `.nvmrc`, `tsconfig.json`, `package.json`, and `package-lock.json`. A safe `.env.example` can also be committed if we introduce environment settings later.

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

`npm init -y` creates `package.json` with default values. `npm pkg set` edits individual settings in that file.

| Setting | Meaning |
| --- | --- |
| `name` | Identifies this backend package. |
| `type: "module"` | Makes Node.js treat this package's .js files as ES modules, using import/export syntax. |
| `license: "UNLICENSED"` | Records that the package is not offered under an open-source license, matching the README's stated intention. |
| `private: true` | Prevents accidental publication to npm. It does not control GitHub repository visibility. |
| `engines.node: "24.x"` | Declares the intended Node.js major version. It does not install or switch Node.js. |

`--json` makes `true` a JSON boolean rather than the string `"true"`.

The JSON printed by `npm init` showed its original defaults, including `"license": "ISC"`. Later edits were silent. I checked the resulting file with:

```bash
cat package.json
```

## 5. Installing nvm and Node.js 24

We selected Node.js 24 so the backend can use its built-in `node:sqlite` module without an additional SQLite npm driver.

First I ensured the download tools were available:

```bash
sudo apt update
sudo apt install -y curl ca-certificates
```

- `sudo` runs these system-management commands with administrator privileges.
- `apt update` refreshes package information; it does not upgrade all installed packages.
- `apt install` installs the named packages. `-y` accepts its confirmation prompt.
- `curl` downloads content; `ca-certificates` supplies certificates used to verify HTTPS connections.

Both packages were already installed. One Microsoft package source had a temporary name-resolution error, but it did not prevent these tools from being available. The unrelated `apt autoremove` suggestion was not a required project step.

Then I ran the nvm installer:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh | bash

source ~/.bashrc
nvm --version
```

The `curl` flags make HTTP failures fail, keep normal output quiet while showing errors, and follow redirects. The pipe (`|`) sends the downloaded installer to Bash to execute. This command executes code from the official nvm repository.

The first attempts failed because the hostname could not be resolved. A later retry succeeded. The installer placed nvm in `~/.config/nvm` and added its loading commands to `~/.bashrc`.

`source ~/.bashrc` reloads that shell configuration into the current terminal. Afterward, `nvm --version` reported **0.40.8**.

Next, from `backend/`:

```bash
echo "24" > .nvmrc

nvm install
nvm use

node -v
npm -v
```

`echo "24" > .nvmrc` writes `24` into the version file. The `>` operator creates or replaces that file's contents.

With no version argument, `nvm install` reads `.nvmrc` and installs a matching Node.js version. `nvm use` selects it for the current shell. Node.js includes npm, so I did not need a separate npm upgrade.

**Observed result:** Node.js **24.22.0**, npm **11.19.1**. The download checksum matched. `.nvmrc` specifies the major version, so another installation may select a newer 24.x release.

## 6. Installing backend dependencies

```bash
npm install express@5

npm install -D typescript tsx @types/node@24 @types/express@5 supertest @types/supertest
```

The first command adds Express as a runtime dependency. `-D` adds tools used for development and testing to `devDependencies`.

| Package | Why it was installed | Version shown by my installation |
| --- | --- | --- |
| `express` | Define HTTP API routes and respond to requests. | 5.3.0 |
| `typescript` | Check TypeScript types and compile source code to JavaScript. | 7.0.2 |
| `tsx` | Execute TypeScript during development. It does not replace type checking. | 4.23.15 |
| `@types/node` | Describe Node.js APIs to the type checker. | 24.19.2 |
| `@types/express` | Describe Express APIs to the type checker. | 5.0.6 |
| `supertest` | Send requests to the backend during API tests. | 7.3.1 |
| `@types/supertest` | Describe Supertest APIs to the type checker. | 7.2.1 |

These are the versions reported in my terminal, not a requirement to manually enter every version. npm records exact dependency resolutions in `package-lock.json`.

Installing packages created `node_modules/` and `package-lock.json` and updated `package.json`.

```bash
npm ls --depth=0
git status --short
```

`npm ls --depth=0` lists the directly installed dependencies. `git status --short` shows changed and untracked files: `M` means modified, and `??` means untracked. A single `?? ./` entry can summarize an untracked directory; it does not list every file inside it. These commands inspect state; they do not commit or upload files.

## 7. Checking that TypeScript can run

npm reported an installation-script warning for `esbuild`, a dependency used by tsx. We checked whether the installed tool could run this small example:

```bash
./node_modules/.bin/tsx -e "const message: string = 'TypeScript is ready'; console.log(message)"
```

- `./node_modules/.bin/tsx` uses this project's installed executable.
- `-e` runs the following code directly instead of reading a source file.
- `: string` is a TypeScript type annotation.
- `console.log` prints the value.

**Observed output:**

```text
TypeScript is ready
```

This confirmed that this small TypeScript example could execute. It did not test API behavior, database access, or all possible build operations. No additional install-script approval was performed in this session.

## 8. Creating source and test directories

```bash
mkdir -p src test
```

I ran this inside `backend/`. `src/` will contain the backend source code, and `test/` will contain automated tests. Creating the directories does not generate application code or tests.

## 9. Configuring TypeScript

I created `backend/tsconfig.json` with:

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
| `target` | Select ES2023 as the JavaScript output target. |
| `module` and `moduleResolution` | Follow Node.js module and import-resolution rules. |
| `rootDir` | Use src as the source directory for emitted files. |
| `outDir` | Put compiled JavaScript in dist. |
| `strict` | Enable stricter type checks. |
| `esModuleInterop` | Help TypeScript work with CommonJS module imports. |
| `forceConsistentCasingInFileNames` | Help catch filename capitalization inconsistencies. |
| `skipLibCheck` | Skip checking declaration-file internals while still checking application code. |
| `types` | Include Node.js ambient type definitions. Imported packages can still supply their own types. |
| `include` | Select TypeScript files under src. |
| `exclude` | Exclude dependencies and generated output from initial file selection. |

**Testing limitation:** This configuration selects `src/`, not `test/`. Type checking and running the tests still need to be configured. Later steps confirmed that source type checking passes; a compiled build has not yet been verified.

## 10. Adding development commands

```bash
npm pkg set 'scripts.dev=tsx watch src/server.ts'
npm pkg set 'scripts.build=tsc'
npm pkg set 'scripts.typecheck=tsc --noEmit'
npm pkg set 'scripts.start=node dist/server.js'

npm pkg delete main
```

These commands save shortcuts in `package.json`; they do not execute those shortcuts yet.

| Command to run later | What it will do |
| --- | --- |
| `npm run dev` | Execute src/server.ts with tsx and restart when watched source files change. |
| `npm run build` | Run tsc to compile according to tsconfig.json. |
| `npm run typecheck` | Check types without generating JavaScript files. |
| `npm start` | Run the compiled dist/server.js using Node.js. It does not build first. |

`npm pkg delete main` removes the default `index.js` package entry. This backend will be launched through scripts rather than consumed as a library package.

At this setup stage, `src/server.ts` had not yet been created. Section 13 records its implementation and successful development startup. The default `test` script from npm init remains a placeholder that exits with an error.

## 11. Preparing schema.sql for the future database

With ChatGPT's guidance, I created `backend/schema.sql` to define the structure of the future database. This file contains the SQL instructions for creating the two tables, their constraints, the position-based index, and the trigger that prevents serial-number changes.

Writing this file prepared the database design; it did not create the database yet. In the next stage, the backend read and executed this file to initialize SQLite.

I checked the saved file with:

```bash
cat schema.sql
```

`cat` displays the file. It does not execute the SQL instructions.

### The two tables

| Table | Fields | Purpose |
| --- | --- | --- |
| `lamps` | id, serial_number, name, position | Store registered lamps and their current installation positions. |
| `light_sessions` | id, lamp_id, position, started_at, last_seen_at | Store continuous periods of lighting activity and their original positions. |

Positions are `bedroom`, `bathroom`, and `living_room`. An uninstalled lamp has a NULL position. Each position can hold at most one lamp. Removing a lamp from a position means clearing its position, rather than deleting its lighting records.

### What the SQL rules mean

- `PRIMARY KEY` identifies each row.
- `NOT NULL` requires a value. For text, it does not by itself reject an empty string.
- `UNIQUE` prevents duplicate serial numbers and duplicate occupied positions. SQLite permits multiple NULL positions.
- `CHECK` restricts position values and checks that times are nonnegative and last_seen_at is not before started_at.
- `FOREIGN KEY` requires a session to refer to an existing lamp. `ON DELETE RESTRICT` prevents deleting a lamp that has session records.
- `PRAGMA foreign_keys = ON` enables foreign-key checks for the current connection. The backend must enable them on each connection it opens.
- The trigger rejects changes to a lamp's serial number.
- `BEGIN TRANSACTION` and `COMMIT` group the schema changes into one transaction.
- `IF NOT EXISTS` allows existing named objects to be left in place. It does not update an existing table when the SQL file changes; future structural changes will need an explicit migration.

I questioned the proposed lamp-specific session index because the main use case is reviewing activity by position. We kept only the explicit position-and-start-time index. UNIQUE constraints can still create internal indexes.

An index helps SQLite find and order records efficiently. A query must still use `ORDER BY` when a specific output order is required.

The comment “An uninstalled lamp cannot start a session” describes an intended backend rule. The schema requires a valid session position, but does not compare it with the lamp's current installation. The backend must check installation and copy the current position when creating a session. Preserving that historical position also requires the backend not to overwrite it later.

There is no ended_at field or replacement-history table. Times are Unix milliseconds. last_seen_at means the last received heartbeat, not the exact physical switch-off time.

An earlier suggestion used the separate `sqlite3` terminal command to execute schema.sql. We did not confirm using that command. Instead, the next step uses Node.js's built-in SQLite module, so the separate SQLite command-line tool is not required for this workflow.

## 12. Creating and checking the SQLite database

I created `backend/src/database.ts`. The terminal command used to create the file was:

```bash
cd src
touch database.ts
```

`touch` creates an empty file if it does not exist. It does not insert code; I then saved the provided TypeScript code in the file. If the file already exists, touch updates its timestamp without clearing its contents.

The code does the following:

1. Uses `import.meta.url` to resolve paths relative to the source file.
2. Creates `backend/data/` with `mkdirSync(..., { recursive: true })` if needed.
3. Opens or creates `data/life-flow-of-light.sqlite` using `DatabaseSync`.
4. Enables foreign-key checks.
5. Reads schema.sql as UTF-8 text and executes it.
6. Exports the database connection for other backend files to use.
7. Closes the connection if initialization fails.

Resolving paths from the file allows both `src/database.ts` and its future compiled counterpart `dist/database.js` to locate the same backend data directory and schema file.

### Type checking is different from execution

From backend, I ran:

```bash
npm run typecheck
```

This runs `tsc --noEmit`. It passed without errors. It checks types but does not execute database.ts or create a database.

I then executed the code and inspected the resulting tables:

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

Importing database.ts executes its initialization code. `sqlite_schema` is SQLite's built-in schema catalog. The query lists table names; `.prepare()` prepares the SQL, and `.all()` executes this read query and returns all results. `finally` closes the connection even if the query fails.

**Observed output:**

```text
[
  [Object: null prototype] { name: 'lamps' },
  [Object: null prototype] { name: 'light_sessions' }
]
```

The “null prototype” label is Node.js's representation of the returned objects, not an error. This confirmed that the database could be opened and the two tables existed. Listing table names alone did not test every constraint or prove whether the tables contained data.

## 13. Starting the first Express API

I created `backend/src/server.ts` and saved the provided server code. It imports Express and the database connection, enables JSON request-body parsing, defines `GET /health`, and listens on `127.0.0.1:3000`.

The import uses:

```typescript
import { database } from './database.js';
```

With the NodeNext configuration, TypeScript resolves this to the corresponding source file during development. The .js extension is suitable for the compiled JavaScript output.

The endpoint runs `SELECT 1` against SQLite and returns:

```json
{"status":"ok","database":"connected"}
```

`SELECT 1` is a small connectivity check. It does not add or modify lamp records and does not validate the entire schema.

From backend, I ran:

```bash
npm run typecheck
npm run dev
```

**Observed result:** type checking passed, and the server printed:

```text
Backend running at http://127.0.0.1:3000
```

While the server was running, I used another terminal:

```bash
curl http://127.0.0.1:3000/health
```

curl acts as an HTTP client here. Without another method option, this request uses GET. Express receives the request, runs the handler, and sends the JSON response.

**Observed response:**

```json
{"status":"ok","database":"connected"}
```

Pressing Ctrl+C in the server terminal stops the development server. It must be running when making API requests. The configured address is for local development.

## 14. Preparing three days of demo data

Before implementing lamp registration, I asked for a realistic demonstration dataset with three existing lamps:

| Lamp | Position |
| --- | --- |
| A | living_room |
| B | bedroom |
| C | bathroom |

The daily schedule is:

| Time (UTC+08:00) | Lamps on |
| --- | --- |
| 00:00–07:00 | None |
| 07:00–08:30 | A, B, C |
| 08:30–18:00 | None |
| 18:00–21:00 | A, C |
| 21:00–22:00 | B, with a HELP exception on day 3 |
| 22:00–24:00 | None |

### Generating the previous three days

The seed generates the **previous three complete calendar days**, excluding today, using the local timezone of the computer running it.

It constructs each date from local calendar values instead of subtracting fixed 24-hour periods. This avoids assuming that every local day has exactly 24 hours, which is not always true during daylight-saving changes.

Each scheduled local time is converted into Unix milliseconds before being stored in the database.

For example, running the seed on 17 October generates records for 14–16 October. The dates are calculated when the seed runs and do not refresh automatically afterward.

### HELP at the end of the third day

B's regular evening lighting ends at 21:58:40 on day 3. After six seconds off, it flashes HELP from 21:58:46 to 22:00:00:

```text
H: ....
E: .
L: .-..
P: .--.
```

A dot lasts 2 seconds, a dash 6 seconds, gaps within a letter 2 seconds, and gaps between letters 6 seconds. The complete message takes 74 seconds and contains 13 separate lighting pulses. Every dark gap is longer than the planned one-second heartbeat timeout.

This creates the pattern as data; it does not implement an automatic Morse-code decoder.

### How seed.ts stores the simulation

The script registers three lamps with random UUID serial numbers and inserts complete light_sessions directly. It does not send real HTTP heartbeats or wait three days to run.

Each session models heartbeats at the start, then every 200 ms until just before switch-off. Accordingly:

```text
last_seen_at = simulated switch-off time - 200 ms
```

A real heartbeat handler is still to be implemented. Its agreed rule is to continue the session when the gap is at most 1,000 ms and start a new session after a longer gap.

The target dataset contains 18 ordinary sessions plus 13 Morse pulses, for **31 sessions**. Dark intervals do not need rows; they are the gaps between sessions.

## 15. Placing and running seed.ts

Save the provided seed script as **`backend/src/seed.ts`**, beside `database.ts`. It is source code that imports the database connection. The generated SQLite database belongs in `backend/data/`.

Commit seed.ts to Git so other readers can generate their own demo records. The generated database is excluded by .gitignore.

From `backend/`, register the command, check the types, and load the demo data:

```bash
npm pkg set 'scripts.seed=tsx src/seed.ts'
npm run typecheck
npm run seed
```

`npm pkg set` adds a reusable shortcut. `npm run seed` executes the TypeScript seeding script.

### Protecting existing records

The script uses `BEGIN IMMEDIATE` before checking the row counts. This acquires the write transaction before the emptiness check, preventing another writer from slipping data in between the check and inserts.

It requires both lamps and light_sessions to be empty. If either contains data, it stops. If insertion fails, `ROLLBACK` cancels the transaction; otherwise, `COMMIT` saves all inserts together. The connection is closed afterward.

### Example of a successful run

Running the seed on an empty database on **17 October 2026**, with the computer using `Asia/Hong_Kong`, produced:

```text
Created 3 lamps and 31 lighting sessions.
Schedule timezone: Asia/Hong_Kong.
Demo dates: 2026-10-14, 2026-10-15, 2026-10-16 (previous three complete local calendar days).
Day 3, local time: B turns off at 21:58:40; HELP runs 21:58:46–22:00:00.
Database timestamps are Unix milliseconds.
Dark periods have no session rows. No live heartbeat sender was started.
```

The timezone and dates depend on the environment and execution date. `Asia/Hong_Kong` is the timezone reported by this particular run, not a fixed timezone in the script.

The database contained three lamps and 31 lighting sessions. A subsequent Morse check returned HELP from the final demo evening.


## 16. What future readers will install

Readers who already have nvm can enter backend and run:

```bash
nvm install
nvm use
npm ci
```

The package files and .nvmrc come from the repository. `npm ci` installs locked dependencies into node_modules. It requires package.json and package-lock.json to agree, and replaces an existing node_modules directory. It does not create application source or automatically run this seed script.

Readers do not need to repeat npm init or install every dependency individually. Importing database.ts initializes the schema. The seed command is a separate optional step that requires an empty database. `npm run dev` starts the development server.

A compiled build, production start, and automated-test workflow still need to be verified before they are presented as tested instructions.


## 17. Registering, listing, and renaming lamps

The backend now provides three lamp endpoints:

| Method and path | Purpose |
| --- | --- |
| `POST /lamps` | Register a new lamp. |
| `GET /lamps` | List registered lamps. |
| `PATCH /lamps/:id` | Change a lamp's name. |

An endpoint is a combination of an HTTP method and a URL path. Express uses that combination to decide which function handles a request.

### Registering a lamp

From another terminal while the server is running:

```bash
curl -i -X POST http://127.0.0.1:3000/lamps
```

- `curl` sends the request.
- `-i` includes the HTTP response headers.
- `-X POST` selects the POST method.

The backend generates a random UUID and uses it for both the permanent serial number and the initial display name.

A newly registered lamp has `position: null`, meaning it has not been installed.

The database ID and UUID serve different purposes:

- `id` identifies the database row.
- `serial_number` is the lamp's permanent identity.
- `name` is a display label that the user can change.

The successful response uses HTTP `201 Created`.

### Listing lamps

```bash
curl http://127.0.0.1:3000/lamps
```

This returns a JSON array of registered lamps, including their IDs, serial numbers, names, and current positions.

Listing records does not change them.

### Renaming a lamp

This example uses lamp ID `4`. On another database, use an ID returned by `GET /lamps`.

```bash
curl -i -X PATCH http://127.0.0.1:3000/lamps/4 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Desk lamp"}'
```

- `PATCH` requests a change to an existing lamp.
- `Content-Type: application/json` tells the server how to interpret the body.
- `-d` supplies the request body.
- A backslash at the end of a line continues the command on the next line.

The backend removes surrounding whitespace from a custom name and checks that the result is non-empty and no longer than 20 characters.

A name exceeding the limit returns HTTP `400` with:

```json
{"error":"Name must not exceed 20 characters."}
```

The initial UUID name is a deliberate exception to this limit. It allows registration without requiring the user to choose a short name immediately.

Renaming changes only the display name. The serial number remains unchanged.

The current length check counts Unicode code points. Some combined symbols, including certain emoji, can count as more than one character. A future frontend should follow the same rule.

## 18. Adding a Morse-code check

The next feature analyzes stored lighting sessions for possible Morse-code messages.

It does not add another database table or change the existing sessions.

The implementation is divided into two files:

| File | Responsibility |
| --- | --- |
| `backend/src/morse.ts` | Interpret lighting durations and gaps as possible letters and messages. |
| `backend/src/morse-routes.ts` | Validate an HTTP request, read sessions, and return the detection result. |

Keeping these responsibilities separate makes the detection logic easier to understand and test.

The server connects the router with:

```typescript
import { createMorseRouter } from './morse-routes.js';
```

After JSON-body parsing is enabled, it registers the router:

```typescript
app.use(express.json());

// Add the endpoints provided by the Morse router.
app.use(createMorseRouter(database));
```

Although the source file is named `morse-routes.ts`, the import uses `.js`. This matches our NodeNext configuration and the filenames produced when TypeScript compiles the application.

### Requesting a check

The endpoint is:

```text
POST /morse/check
```

The request specifies one position and a time range:

```json
{
  "position": "bedroom",
  "start_time": 1791986326000,
  "end_time": 1791986400000
}
```

All API timestamps are Unix time in milliseconds, matching the database.

The frontend will convert a user's selected local date and time into timestamps before sending a request. It will also format returned timestamps for display.

The backend does not need to guess the user's timezone.

### Understanding the response

A successful detection returns:

```json
{
  "result": [
    {
      "start_time": 1791986326000,
      "end_time": 1791986400000,
      "message": "HELP"
    }
  ]
}
```

A valid request with no detected messages returns:

```json
{"result":[]}
```

No match is a normal result, not an error. Invalid input returns HTTP `400`.

The detector can return individual letters, groups of letters, or messages containing spaces between words. Messages separated by a sufficiently long pause are returned as separate entries in time order.

A message must fit completely within the requested range. The API does not return a fragment simply because the range cuts through a longer message.

### What the returned times mean

`start_time` is the first heartbeat of the detected message.

`end_time` is an estimated switch-off time calculated from the final session:

```text
end_time = last_seen_at + 200 milliseconds
```

This matches the seed's simulated heartbeat timing. It is not a separate database column or an exact measurement of a real bulb's switch-off time.

The detector also waits for enough final silence before returning a trailing message. Otherwise, another letter or word might still be arriving.

See the [Morse Guide](./MorseGuide.md) for an introduction to the timing and the demo message.

## 19. Checking the API manually

With the server running, I used:

```bash
NOW_MS=$(node -p 'Date.now()')

curl -s -X POST http://127.0.0.1:3000/morse/check \
  -H 'Content-Type: application/json' \
  -d "{\"position\":\"bedroom\",\"start_time\":0,\"end_time\":$NOW_MS}"
```

`node -p 'Date.now()'` prints the current Unix timestamp in milliseconds.

`$(...)` runs that command and captures its output. The shell stores it in `NOW_MS`, then substitutes the value into the JSON request.

Checking the seeded bedroom records returned `HELP`.

Checking `living_room` returned an empty result array. Its normal lighting schedule did not match a message.

A request whose range ended exactly when HELP began also returned an empty array, because it did not contain the message.

These manual checks showed how a client can use the endpoint. Automated tests then checked the behavior more systematically.

## 21. Regenerating and checking the demo data

I tested the local-time seed using a fresh database.

First, I stopped the development server with `Ctrl+C` and ensured no other process was using the database.

From `backend/`, I moved the complete data directory into a backup location:

```bash
BACKUP_DIR="$HOME/Life-Flow-of-Light-backups/$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
mv data "$BACKUP_DIR/"

echo "Database backup saved to: $BACKUP_DIR/data"
```

`BACKUP_DIR` is a shell variable containing the destination path. The date command adds a timestamp to help distinguish backups.

Moving the complete directory preserves the database and any SQLite companion files together. The backup is outside the repository.

With the original data directory no longer present, I ran:

```bash
npm run typecheck
npm run seed
npm run dev
```

The database initialization code recreated the data directory and database. The seed populated the empty tables.

In another terminal, I checked:

```bash
curl http://127.0.0.1:3000/lamps
```

The response contained A, B, and C in their expected positions.

I then queried the bedroom through `POST /morse/check`. The result was:

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

For this run, those timestamps represent 16 October 2026, from 21:58:46 to 22:00:00 in Asia/Hong_Kong.

This checked the complete path from generating demo records to reading them through the Morse API.

### Local schedules and stored timestamps

The seed uses local time to decide when the demonstration lamps switch on and off.

The database stores those moments as Unix milliseconds. A timestamp identifies the same instant regardless of which timezone is used to display it.

The frontend will handle local-time input and display. The database does not need to change when a viewer uses another timezone.

## 22. Installing and uninstalling lamps

I added:

```text
backend/src/lamp-position-routes.ts
```

The server imports and registers the router:

```typescript
import { createLampPositionRouter } from './lamp-position-routes.js';
```

```typescript
app.use(createLampPositionRouter(database));
```

Router registration belongs after JSON-body parsing and before `app.listen(...)`.

### Installing a lamp

The endpoint is:

```text
PUT /lamps/:id/position
```

Example:

```bash
curl -i -X PUT http://127.0.0.1:3000/lamps/4/position \
  -H 'Content-Type: application/json' \
  -d '{"position":"living_room"}'
```

The backend checks that:

- The ID is a positive safe integer.
- The position is bedroom, bathroom, or living_room.
- The lamp exists.
- The lamp is not already installed at another position.
- The requested position is available.

Repeating an installation at the lamp's existing position returns success without moving anything.

An occupied position returns HTTP `409 Conflict`. Installing a lamp does not silently replace the current occupant.

The route uses `BEGIN IMMEDIATE` to keep its checks and update in one write transaction. This prevents another writer from taking the position between the availability check and the update.

### Uninstalling a lamp

The endpoint is:

```text
DELETE /lamps/:id/position
```

Example:

```bash
curl -i -X DELETE http://127.0.0.1:3000/lamps/1/position
```

This removes the installation relationship, not the lamp.

The database update is:

```sql
UPDATE lamps
SET position = NULL
WHERE id = ?;
```

The lamp keeps its ID, serial number, and name. Historical rows in light_sessions remain unchanged.

An already-uninstalled lamp returns success again.

Once heartbeat handling was added, uninstalling also required the lamp to be off: more than 1,000 milliseconds must have passed since its last heartbeat. A lamp that has never sent a heartbeat can be uninstalled immediately.

The activity check and removal run in one transaction.

### Keeping replacement simple

For this PoC, replacement uses the existing operations:

1. Stop the old lamp's heartbeats.
2. Wait more than one second.
3. Uninstall the old lamp.
4. Install the selected lamp.

There is no separate replacement endpoint or replacement-history table.

### Manual checks

The following operations worked as expected:

| Operation | Result |
| --- | --- |
| Install A again at its existing living_room position | HTTP 200 |
| Register lamp 4 | HTTP 201, with position null |
| Install lamp 4 while A still occupies living_room | HTTP 409 |
| Uninstall A | HTTP 200, with position null |
| Uninstall A again | HTTP 200 |
| Install lamp 4 in the now-empty living_room | HTTP 200 |

Afterward, A was uninstalled, lamp 4 occupied living_room, and B and C remained in bedroom and bathroom.

## 23. Receiving heartbeats and recording lighting activity

I added:

```text
backend/src/heartbeat-routes.ts
```

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

The client does not supply a timestamp or position. The backend uses its own current time and the lamp's stored installation position.

### Continuing or starting a session

| Condition | Action |
| --- | --- |
| Lamp does not exist | Return HTTP 404. |
| Lamp is not installed | Return HTTP 409. |
| No previous session exists | Create a session. |
| Same position and heartbeat gap is at most 1,000 ms | Update last_seen_at in the existing session. |
| Gap is greater than 1,000 ms, or position differs | Create a new session. |

A new session starts with started_at and last_seen_at set to the same timestamp.

Continuing a session changes only last_seen_at. Its starting time and historical position remain unchanged.

A new session returns HTTP `201`; an updated session returns HTTP `200`.

The response includes the session and a `created` boolean indicating whether a new row was inserted.

The lookup and write occur in a transaction. The route also rejects a heartbeat if the server time is earlier than the previous session's last_seen_at, rather than moving the stored timestamp backwards.

### What happens when a lamp switches off?

The sender stops sending heartbeats.

No additional row or ended_at field is needed. Once more than one second has passed without a signal, the lamp is considered off.

There is no background job that writes a “closed” value into the session. The timestamp remains at the last received heartbeat.

If a lamp switches off and back on within one second, its signals can remain part of the same session. This follows the chosen timeout rule.

### Testing continuous signals

A small Node.js script used fetch to send five heartbeats, waiting approximately 200 milliseconds between requests.

It then stopped sending for 1.2 seconds and sent another heartbeat.

The observed results were:

| Step | Result |
| --- | --- |
| Earlier manual heartbeat | Created session 32 |
| First signal in the script | Created session 33 |
| Next four signals | Updated session 33 |
| Signal after the 1.2-second pause | Created session 34 |

During session 33, started_at stayed unchanged while last_seen_at advanced.

The request spacing was slightly longer than 200 milliseconds because the script waited after each response. This was a local simulation, not a precise timer.

### Checking uninstall restrictions

A second script used Node.js's built-in assert module to verify:

1. A heartbeat followed immediately by an uninstall request returns HTTP 409.
2. The rejected uninstall leaves the installation unchanged.
3. Uninstall succeeds after 1.2 seconds without signals.
4. An uninstalled lamp's heartbeat is rejected.
5. The lamp can be installed again.

All five checks passed, and lamp 4 was restored to living_room.

These scripts exercised the running backend and its real local database. They added lighting records and temporarily changed an installation.

They are different from the Morse test suite, which uses independent in-memory databases.

## 24. Deciding what the frontend will control

The planned frontend will keep each virtual lamp's on/off switch in page memory.

When the page opens, every switch starts off. Saved lamp names and installation positions are loaded through GET /lamps.

| Interaction | Planned behavior |
| --- | --- |
| Switch on | Send a heartbeat immediately, then approximately every 200 ms. |
| Switch off | Stop sending heartbeats. |
| Leave or reload the page | The old page's heartbeat sender stops. |
| Open a fresh page | Start with all switches off. |
| Hover over an installed position | Show the lamp's name from the loaded lamp list. |
| Rename or replace a lamp | Use the existing backend endpoints on the same page. |

A separate API for querying the current on/off state is not required for this demo.

The frontend switch represents what that page is doing. The backend records the signals it actually receives.

Closing a page does not need a final “switch off” request. If the page disappears unexpectedly, the heartbeat timeout still applies.

Switching to another browser tab is different from closing the page. Any decision to stop signals when the page becomes hidden will need explicit frontend handling.

### Multiple tabs

Another open tab could continue sending heartbeats even when the current page shows a lamp as off.

For this PoC, the planned frontend will display:

> Please use only one tab to control the lamps. Another open tab may continue sending heartbeats, even when a lamp appears off here.

This is guidance for the demo, not enforcement of a single active tab.

The frontend has not yet been implemented.

## 25. Querying lighting sessions for the timeline

I added:

```text
backend/src/light-session-routes.ts
```

The server imports and registers it:

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

It accepts one position and a time range expressed as Unix milliseconds.

### Reading URL parameters

Unlike JSON numbers in a request body, URL query parameters arrive as strings.

The route validates the strings, converts them into numbers, and checks that:

- The position is valid.
- Both timestamps are nonnegative safe integers within the supported date range.
- start_time is earlier than end_time.

Invalid input returns HTTP 400.

### Finding overlapping activity

A timeline must include activity that started before the requested range but continued into it.

For example, a lamp on from 18:00 to 21:00 must still appear when requesting 19:00–20:00.

The query uses:

```sql
WHERE position = ?
  AND started_at < ?
  AND last_seen_at >= ?
ORDER BY started_at ASC, id ASC
```

The placeholders receive the position, requested end, and requested start.

This selects sessions whose recorded heartbeat interval overlaps the requested range. A session beginning exactly at the requested end is excluded. A heartbeat exactly at the requested start is included.

The API returns the original timestamps. The frontend can limit the visible part of a bar to the displayed timeline range without changing the stored record.

Unlike the Morse API, this endpoint does not require an entire session to fit inside the range.

### Preserving historical positions

The query reads position directly from light_sessions.

It does not use the lamp's current position to decide where old activity belongs. Uninstalling or moving a lamp therefore does not move its historical records on the timeline.

last_seen_at remains the last recorded heartbeat, not an exact physical switch-off time.

### Request example

```bash
NOW_MS=$(node -p 'Date.now()')

curl -sG http://127.0.0.1:3000/light-sessions \
  --data-urlencode 'position=bedroom' \
  --data-urlencode 'start_time=0' \
  --data-urlencode "end_time=$NOW_MS"
```

`-G` makes curl place these parameters in the URL for a GET request. `--data-urlencode` handles URL encoding.

The response contains:

- position
- start_time and end_time for the requested range
- sessions, ordered by starting time

No matching records produces HTTP 200 with an empty sessions array.

The route returns `Cache-Control: no-store` because incoming heartbeats may change the records between requests.

It allows up to 50,000 matching sessions. A larger result returns HTTP 422 and asks for a shorter range, instead of silently returning an incomplete timeline.

### Manual checks

Three queries produced the expected results:

| Query | Observed result |
| --- | --- |
| Bedroom records from timestamp zero to now | 19 sessions: six ordinary sessions and 13 HELP flashes |
| Living room on 16 October, 19:00–20:00 in Asia/Hong_Kong | A's session beginning at 18:00 was included |
| Bedroom between timestamps 0 and 1 | Empty sessions array |

The living-room result still referred to lamp A even though A had been uninstalled. Its original timestamps were preserved.

## Current checkpoint — 18 October 2026

| Item | Progress |
| --- | --- |
| SQLite initialization | Working |
| Health endpoint | Manually verified |
| Seed using the execution computer's local timezone | Regenerated and checked through the API |
| Lamp registration, listing, and renaming | Manually verified |
| Installing into an empty position | Manually verified |
| Rejecting installation into an occupied position | Manually verified |
| Uninstalling and repeated uninstall requests | Manually verified |
| Blocking uninstall while recently active | Verified by a live API check script |
| Heartbeat session creation and continuation | Verified by a live API check script |
| New session after heartbeat timeout | Verified by a live API check script |
| Rejecting heartbeats from uninstalled lamps | Verified by a live API check script |
| Lighting-session queries and overlapping ranges | Manually verified |
| Morse API | Implemented; ten automated tests previously passed |
| Automated tests for installation, heartbeat, and session queries | Still to be added |
| Dedicated production-schema tests | Still to be added |
| Compiled build and npm start | Not yet verified |
| Frontend | Not yet implemented |
| User Guide reconstruction walkthrough | Drafted; not yet tested from start to finish |

A separate replacement endpoint and a current on/off status endpoint are not planned for this PoC. Existing installation operations and frontend switch state cover the intended interaction.

The next verification work is to add automated tests for the new routes, especially the exact 1,000-millisecond boundary, uninstall restrictions, and query boundaries.

For setup and running instructions, see the [User Guide](./UserGuide.md). 

For the message-detection feature, see the [Morse Guide](./MorseGuide.md).


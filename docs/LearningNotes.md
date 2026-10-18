# Life Flow of Light — Learning Notes

## Learning record: Setup, database initialization, and demo data

**Started Date:** 15 October 2026  
**Updated through:** 17 October 2026  
**Scope:** Backend setup, SQLite initialization, demo data, lamp registration and naming, and the Morse-check API with ten passing automated tests.

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

The seed script generates the **previous three complete calendar days at the time it runs**, excluding today. It calculates these dates using UTC+08:00 so that the demo follows the same local schedule regardless of the computer's timezone.

The calculation first finds today's calendar date in UTC+08:00, subtracts three, two, and one calendar days, and produces date strings. Each schedule time is then parsed with an explicit +08:00 offset. This avoids relying on the computer's own timezone. The fixed offset matches the chosen Taiwan/Hong Kong demonstration timezone.

For example, running the script on 15 October produces 12–14 October; running it on 20 October produces 17–19 October. The dates are calculated at execution time, not continuously refreshed afterward.

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

On an empty database, successful execution prints the following. This example assumes the script runs on **15 October 2026 in UTC+08:00**:

```text
Created 3 lamps and 31 lighting sessions.
Demo dates: 2026-10-12, 2026-10-13, 2026-10-14 (three complete days, UTC+08:00).
Day 3: B turns off at 21:58:40; HELP runs 21:58:46–22:00:00.
Dark periods have no session rows. No live heartbeat sender was started.
```

The three dates depend on the execution date. After a successful run, the database contains A, B, C and their 31 lighting sessions. These records can later be retrieved through the session API and displayed on a timeline.

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

## 20. Adding automated Morse tests

I saved the tests in:

```text
backend/test/morse.test.ts
```

Then, from `backend/`, I added and ran a package script:

```bash
npm pkg set 'scripts.test:morse=node --import tsx --test test/morse.test.ts'

npm run test:morse
```

The script has three parts:

- `node` starts Node.js.
- `--import tsx` loads support for executing the TypeScript test file.
- `--test` runs Node.js's test runner.

Supertest sends HTTP requests to the Express application during the tests. A separate development server does not need to be running.

The tests create an independent SQLite database in memory. They do not modify the real database in `backend/data/`.

They also supply controlled times, allowing timing behavior to be checked without waiting for real seconds to pass.

### What the ten tests check

1. HELP is detected with the expected start and end times.
2. An empty dataset returns an empty result array.
3. Records from another position are excluded.
4. Messages outside or cut by the requested range are excluded.
5. Spaces between words are preserved, as in HELP ME.
6. A long pause separates messages, which remain in time order.
7. Ordinary long lighting is not treated as a Morse letter.
8. Invalid input returns HTTP 400.
9. An unfinished sentence is not returned before the final silence.
10. Repeated checks leave all stored sessions unchanged.

The test run completed with:

```text
tests 10
pass 10
fail 0
cancelled 0
skipped 0
todo 0
```

This verifies the cases covered by this test suite. It does not mean that every future feature or every possible input has been tested.

The test database uses a simplified session table. These tests do not replace tests of the actual schema's foreign keys, unique constraints, or serial-number trigger.

Also, our current TypeScript configuration includes `src/`, not `test/`. Running these tests executes the test code; it does not add the test directory to `npm run typecheck`.

## Current checkpoint

| Item | Progress |
| --- | --- |
| SQLite initialization | Working |
| Health endpoint | Manually verified |
| Three-day demo seed | Implemented |
| Lamp registration and listing | Manually verified |
| Lamp renaming and name validation | Manually verified |
| Morse API with position and time-range inputs | Implemented and manually checked |
| Morse automated tests | 10 passed |
| Lamp installation, removal, and replacement | Not yet implemented |
| Live heartbeat processing | Not yet implemented |
| General lighting-session query API | Not yet implemented |
| Dedicated production-schema tests | Not yet implemented |
| Compiled build and production start | Not yet verified |
| Frontend | Not yet implemented |

The next backend stage is lamp installation, removal, and replacement, while preserving historical lighting records.

For instructions on running the existing project, see the [User Guide](./UserGuide.md).


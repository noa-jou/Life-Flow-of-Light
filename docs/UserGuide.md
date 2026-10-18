# Life Flow of Light — User Guide

[Project overview](../README.md) · [Learning Notes](./LearningNotes.md) · [Morse Guide](./MorseGuide.md)

**Documentation checkpoint: 17 October 2026**

This guide explains how to obtain and run the existing backend on another Debian Linux computer.

It assumes basic terminal use and explains the purpose of each main command.

The project currently has a backend only. There is no frontend application to open yet.

## 1. What this version can do

The backend currently supports:

- Creating and opening its SQLite database.
- Checking server and database connectivity.
- Registering, listing, and renaming lamps.
- Generating an optional three-day demonstration dataset.
- Checking recorded lighting activity for possible Morse messages.
- Running ten automated Morse API tests.

Lamp installation, removal, replacement, live heartbeat processing, and a general lighting-session query API are still under development.

These instructions describe the current checkpoint, not every feature in the project's product concept.

## 2. Before starting

You will need:

- A Debian Linux environment with a Bash terminal.
- Permission to install system packages using `sudo`.
- An internet connection to obtain the repository and dependencies.
- Access to the GitHub repository if it is private.

You do not need to provide your GitHub credentials to ChatGPT.

A fresh copy of the repository contains source code and setup files. It does not contain the original computer's local SQLite database.

## 3. Install the system tools

Check the operating system:

```bash
cat /etc/os-release
```

On Debian, install the tools used in this guide:

```bash
sudo apt update
sudo apt install -y git curl ca-certificates
```

Their purposes are:

| Tool | Purpose |
| --- | --- |
| Git | Download and track the project's source files. |
| curl | Download the Node version manager and send API requests. |
| ca-certificates | Provide certificates used to verify HTTPS connections. |

`apt update` refreshes package information. It does not upgrade every installed package.

The backend uses Node.js's built-in SQLite module, so a separate SQLite database server is not required.

## 4. Obtain the project

On the GitHub repository page, use the **Code** button to obtain its clone URL.

Replace `YOUR_GITHUB_OWNER` below with the actual owner or organization:

```bash
cd ~

git clone https://github.com/YOUR_GITHUB_OWNER/Life-Flow-of-Light.git

cd Life-Flow-of-Light/backend
```

The placeholder is not the actual repository address.

For a private repository, use GitHub's supported authentication method for your own account. An SSH clone URL is also suitable if you have already configured SSH access.

`git clone` is the initial download command. `git pull` is used later, inside an existing checkout, to retrieve and integrate updates.

Check that the backend files are present:

```bash
ls
```

They should include `package.json`, `package-lock.json`, `tsconfig.json`, `schema.sql`, `src/`, and `test/`.

Check the requested Node.js version:

```bash
cat .nvmrc
```

At this checkpoint, it contains `24`.

## 5. Install the Node version manager

The project uses nvm to select its Node.js version.

The setup used for this checkpoint is:

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh | bash

source ~/.bashrc

nvm --version
```

The first command downloads and executes the installer from the official nvm repository.

`source ~/.bashrc` loads the updated shell configuration into the current terminal.

If nvm is already installed and available, you can skip the installer.

If you are rebuilding this project many years later, consult the [official nvm installation instructions](https://github.com/nvm-sh/nvm#installing-and-updating) if this installer no longer works on your system.

## 6. Install the project's Node.js version

From `Life-Flow-of-Light/backend`:

```bash
nvm install
nvm use

node -v
npm -v
```

nvm reads `.nvmrc` and selects the requested Node.js version. Node.js includes npm.

The checkpoint uses Node.js 24.x.

The `.nvmrc` file currently specifies a major version, not an exact patch release. A new installation may therefore select a different 24.x patch version from the original machine.

In a new terminal, return to `backend/` and run `nvm use` before working on the project.

## 7. Install the project dependencies

From `backend/`:

```bash
npm ci
```

This installs the dependency versions recorded in `package-lock.json`.

Keep both `package.json` and `package-lock.json` from the repository. They must agree.

You do not need to run `npm init` or install Express, TypeScript, and the other packages individually.

For this workflow, include development dependencies: the type checker, tests, seed command, and development server use them.

`npm ci` creates or replaces `node_modules/`. It does not generate the application's source files or run the demo seed.

Do not use `sudo` for these npm commands when using nvm.

## 8. Check the source and Morse tests

```bash
npm run typecheck
npm run test:morse
```

`typecheck` checks the source files selected by `tsconfig.json` without producing compiled JavaScript.

`test:morse` runs the Morse API tests using independent in-memory databases. It does not modify the application's saved database.

At this checkpoint, the expected test summary is:

```text
tests 10
pass 10
fail 0
```

Individual execution times will vary.

The general `npm test` command has not yet been configured as a complete project test suite. Use `npm run test:morse` for these tests.

## 9. Choose an empty or demo database

The application creates this local file when its database module first runs:

```text
backend/data/life-flow-of-light.sqlite
```

It also reads `backend/schema.sql` to initialize the tables.

### Start without demonstration records

Skip the seed command and continue to the server-start step.

The backend will initialize an empty database if none exists.

### Start with the demonstration

Before creating your own lamps, run:

```bash
npm run seed
```

The seed creates:

- A in `living_room`.
- B in `bedroom`.
- C in `bathroom`.
- Thirty-one lighting sessions across the previous three complete days.
- A hidden HELP message from B on the final evening.

The demonstration schedule uses UTC+08:00. The dates are calculated when the command runs.

Successful output begins with:

```text
Created 3 lamps and 31 lighting sessions.
```

The seed requires both application tables to be empty. It does not erase or overwrite existing records.

Run it once for a fresh demonstration database. It does not refresh the dates each morning or start a live heartbeat sender.

For the hidden message's meaning and timing, see the [Morse Guide](./MorseGuide.md).

## 10. Start the development server

From `backend/`:

```bash
npm run dev
```

Expected startup message:

```text
Backend running at http://127.0.0.1:3000
```

Leave this terminal running.

The server listens on the local computer. This configuration does not make it available to other devices on the network.

Open a second terminal for API requests:

```bash
curl http://127.0.0.1:3000/health
```

Expected response:

```json
{"status":"ok","database":"connected"}
```

This checks that the server can query SQLite.

To stop the server, press `Ctrl+C` in its terminal.

Stopping the server does not delete saved data.

## 11. Try the lamp endpoints

These examples assume the server is running.

### List lamps

```bash
curl http://127.0.0.1:3000/lamps
```

An empty database returns an empty array. A seeded database includes A, B, and C.

### Register a lamp

```bash
curl -i -X POST http://127.0.0.1:3000/lamps
```

The response uses HTTP `201 Created` and contains:

- An integer database ID.
- A generated UUID serial number.
- An initial name equal to that UUID.
- A `null` position.

The UUID becomes the lamp's permanent serial number.

Registration does not install the lamp at a position.

### Rename a lamp

Find the lamp's ID in the list response.

The following example uses ID `4`; replace it with the appropriate ID:

```bash
curl -i -X PATCH http://127.0.0.1:3000/lamps/4 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Desk lamp"}'
```

A custom name must be non-empty after trimming and contain no more than 20 Unicode code points.

The automatically assigned UUID name is an exception to that length limit.

Changing the name does not change the serial number.

## 12. Check for Morse messages

The endpoint accepts a JSON body:

```text
POST /morse/check
```

| Input | Meaning |
| --- | --- |
| `position` | `bedroom`, `bathroom`, or `living_room`. |
| `start_time` | Beginning of the requested range, as Unix milliseconds. |
| `end_time` | End of the requested range, as Unix milliseconds. |

Times must be nonnegative integers within the supported timestamp range. `start_time` must be earlier than `end_time`.

The interval includes its starting boundary and excludes signals beginning at its ending boundary. A complete message may finish exactly at `end_time`.

### Search the demo bedroom records

For this small demonstration, search from Unix time zero to now:

```bash
NOW_MS=$(node -p 'Date.now()')

curl -s -X POST http://127.0.0.1:3000/morse/check \
  -H 'Content-Type: application/json' \
  -d "{\"position\":\"bedroom\",\"start_time\":0,\"end_time\":$NOW_MS}"
```

`NOW_MS` contains the current time in milliseconds.

With the demonstration records, the result should contain `HELP`.

The following is an example for one particular seed date. Your timestamps will depend on when the seed ran:

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

The returned end time is estimated from the final heartbeat plus 200 milliseconds.

### Search another position

```bash
NOW_MS=$(node -p 'Date.now()')

curl -s -X POST http://127.0.0.1:3000/morse/check \
  -H 'Content-Type: application/json' \
  -d "{\"position\":\"living_room\",\"start_time\":0,\"end_time\":$NOW_MS}"
```

For the normal demo schedule, the expected response is:

```json
{"result":[]}
```

### Interpret the result

- HTTP `200` with an empty array means the request was valid but no complete message was detected.
- HTTP `200` with entries means possible messages were detected.
- HTTP `400` means an input was invalid.
- HTTP `422` means the scan contains too many session rows; request a shorter range.

The scan limit is 50,000 candidate session rows, including nearby context used to recognize message boundaries.

For larger datasets, choose a specific time range instead of searching the entire history.

The API returns complete messages contained in the range. It also waits for enough final silence before returning a trailing message.

The backend uses timestamps without converting them into a display timezone. A future frontend will handle local date selection and formatting.

## 13. Where files and data belong

| Path | Purpose |
| --- | --- |
| `backend/src/` | Backend TypeScript source. |
| `backend/test/` | Automated tests. |
| `backend/schema.sql` | Database structure and constraints. |
| `backend/package.json` | Dependencies and runnable scripts. |
| `backend/package-lock.json` | Locked dependency resolutions. |
| `backend/.nvmrc` | Requested Node.js version. |
| `backend/tsconfig.json` | TypeScript configuration. |
| `backend/data/` | Local SQLite database files. |
| `backend/node_modules/` | Installed dependencies. |
| `backend/dist/` | Generated JavaScript after compilation. |
| `docs/` | Project documentation. |

Source files, tests, schema, configuration, and documentation belong in Git.

Installed dependencies, generated JavaScript, and local database files are excluded by the project's ignore rules.

Downloading the repository recreates the code. It does not restore your previous lamps and sessions.

## 14. Build and compiled startup

The project defines:

```bash
npm run build
npm start
```

The build command compiles TypeScript into `backend/dist/`.

The start command runs `dist/server.js`. It does not compile the source first.

Stop the development server before starting another server on port 3000.

At this documentation checkpoint, development startup and the Morse tests have been verified. Compiled startup has not yet been verified on the original machine.

If checking this workflow, run the build, start the compiled server, then repeat the health request.

Keep `schema.sql` in `backend/`. The compiled application still needs it.

## 15. Stop, back up, and return later

To stop the development server, press `Ctrl+C`.

For a simple local database backup:

1. Stop the server.
2. Ensure no seed process or other application connection is using the database.
3. Copy the complete `backend/data/` directory to your backup location.

Keep source-code backups and database backups separately. Git does not preserve ignored database files.

To return to the project later:

```bash
cd ~/Life-Flow-of-Light/backend
nvm use
npm run dev
```

You do not need to rerun the seed or reinstall dependencies every time.

## 16. Rebuilding years later

This guide records a working development checkpoint. It cannot guarantee that the same downloads and runtime will remain supported indefinitely.

Preserve these together:

- A copy of the Git repository, including its history.
- The exact commit you want to rebuild.
- `package.json` and `package-lock.json`.
- `.nvmrc` and the recorded Node.js and npm versions.
- `schema.sql`.
- These guides.
- Separate database backups if you want to restore historical records.

Useful commands for recording your environment are:

```bash
git rev-parse HEAD
node -v
npm -v
```

The first prints the current commit identifier. Keep these values with your backup notes.

A lockfile records package resolutions, but it does not contain the downloaded packages themselves. Future installation still depends on those packages being available.

When returning after many years:

1. Identify the saved project revision.
2. Read its version requirements and documentation.
3. Recreate the recorded environment where possible.
4. Install dependencies and run the checks.
5. Treat upgrades to a supported Node.js version as separate work, with testing.

The original Node.js version may eventually be unsupported. Reproducing an old local demonstration and maintaining a deployed service are different tasks.

Changing `schema.sql` alone also does not migrate existing tables. Its `IF NOT EXISTS` statements leave existing tables in place. Any future database-structure changes need an explicit migration process.

## 17. Common problems

| Symptom | What to check |
| --- | --- |
| `nvm: command not found` | Reload `~/.bashrc` or open a new terminal after installing nvm. |
| The wrong Node.js version appears | Enter `backend/` and run `nvm use`. |
| `npm ci` reports inconsistent package files | Check that package.json and package-lock.json come from the same project revision. |
| `Could not resolve host` | Check the network connection and DNS before retrying the download. |
| curl cannot connect to port 3000 | Confirm that the server is running in another terminal. |
| Port 3000 is already in use | Check whether another copy of the server is already running. |
| The seed refuses to run | The database already contains records; the seed preserves them. |
| Morse results are empty | Check the position, time range, stored data, and whether the complete message has finished. |
| `npm test` reports its default placeholder error | Use the configured `npm run test:morse` command. |
| Compiled startup cannot find dist/server.js | Run `npm run build` successfully first. |

For the reasoning behind the setup and implementation, see the [Learning Notes](./LearningNotes.md).
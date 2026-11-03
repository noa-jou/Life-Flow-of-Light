# Life Flow of Light — User Guide

[繁體中文](UserGuide.zh-TW.md) · [Project overview](../README.md) · [Structure and technology](StructureIntro.md)

This guide walks you through setting up Life Flow of Light and trying the demonstration on your own computer.

The examples use the author's development environment: Debian Linux in a Chromebook's Linux development environment. This is a reference setup, not a requirement to use the same computer or operating system.

If you use Windows, macOS, or another Linux distribution, use the steps to understand what needs to be done. You may need to adapt installation commands, terminal configuration, and file paths to your environment.

This guide does not provide separate instructions for every operating system, and the examples have not been verified on all platforms.

We will prepare the tools, download the project, install and start both applications, then explore lighting history and practise sending a Morse message.

For an explanation of how the project is organized, see [Structure and Technology](StructureIntro.md). You do not need to read it before following this guide.

## 1. Before you begin

To follow the Debian examples directly, you will need:

- A Debian Linux environment with a Bash terminal.
- Permission to install system packages with `sudo`.

If you use a Chromebook, enable its Linux development environment first.

Regardless of your operating system, you will need:

- A browser and a suitable terminal.
- Node.js 24.x and npm.
- Git if you download the project using `git clone`.
- An internet connection to download the project and dependencies.
- Access to the repository if it is private.

The following steps explain how to prepare these tools on Debian. On another operating system, use the corresponding installation methods for your environment.

The demonstration runs locally. You do not need physical bulbs, sensors, a cloud account, or a separate database server.

Use one browser tab to operate the demonstration. Multiple tabs or clients can send conflicting lighting activity.

### Reading and adapting the commands

Run the commands in order. If a command fails, check the error and whether the command applies to your environment before continuing.

The examples use Bash:

- `~` means your home directory.
- `cd` changes the current directory.
- `pwd` shows your current directory.
- `ls` lists its files.

The guide assumes the project is stored at:

`~/Life-Flow-of-Light`

If you downloaded it elsewhere, adjust the paths accordingly.

Commands such as `apt`, `sudo`, and `source ~/.bashrc` relate to the demonstrated environment. Do not assume that they work unchanged in a different shell or operating system.

The goal is to complete the same setup tasks on your computer, even if the exact commands differ.

## 2. Install the basic system tools

Open a terminal and run:

```bash
sudo apt update
sudo apt install -y git curl ca-certificates
```

`apt update` refreshes the package list. The second command installs:

| Tool | Why it is needed |
| --- | --- |
| Git | Downloads the repository and manages later code updates. |
| curl | Downloads the Node version manager and checks the backend connection. |
| ca-certificates | Helps verify secure HTTPS connections. |

If `sudo` asks for your password, the terminal may show no characters while you type. This is normal.

## 3. Prepare Node.js 24

Both the frontend and backend require Node.js `24.x`.

If you already have Node.js and npm installed, check them first:

```bash
node -v
npm -v
```

If Node.js shows `v24.x.x` and npm is available, you can skip the rest of this section.

For a new Debian environment, the following example uses nvm to install Node.js.

### Install nvm

If nvm is already installed, skip this installer.

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.8/install.sh | bash
source ~/.bashrc
nvm --version
```

The first command downloads and runs the installer from the official nvm repository.

`source ~/.bashrc` loads the updated Bash configuration into this terminal.

If `nvm` is still not found, close the terminal, open a new one, and try:

```bash
nvm --version
```

For installation details, see the [official nvm instructions](https://github.com/nvm-sh/nvm#installing-and-updating).

### Install Node.js and set the default version

```bash
nvm install 24
nvm alias default 24
node -v
npm -v
```

These commands:

1. Install Node.js 24 and select it in the current terminal.
2. Set Node.js 24 as the default for new terminals that load nvm.
3. Display the installed Node.js and npm versions.

`node -v` should show a version beginning with `v24.`.

Node.js includes npm, so you do not need to install npm separately.

Setting the default is convenient for a new development environment. If you already maintain other Node.js projects, you can keep your existing default and use `nvm use 24` when working on this project instead.

Once the correct version is active, you do not need to select it again before every command.

Do not use `sudo` with the npm commands in this guide.

## 4. Obtain the project

If you have already downloaded the complete repository, skip the clone command and enter your existing project folder.

For a first download, open the repository's GitHub page and copy its HTTPS URL from the **Code** button.

```bash
cd ~
git clone https://github.com/noa-jou/Life-Flow-of-Light.git
cd ~/Life-Flow-of-Light
```

The example contains a placeholder, not the actual repository address.

`git clone` downloads the first copy. `git pull` retrieves updates inside an existing checkout.

Check the project root:

```bash
pwd
ls
```

You should see:

```text
backend  docs  frontend  README.md  README.zh-TW.md
```

Downloading the repository gives you the source code. It does not copy the author's local database or installed dependencies.

## 5. Install the backend dependencies

Run:

```bash
cd ~/Life-Flow-of-Light/backend
npm ci
```

`npm ci` installs the dependency versions recorded in `package-lock.json`.

You do not need to run `npm init` or install Express and TypeScript individually. The project already declares its dependencies.

Wait for installation to finish successfully before continuing.

### Check the backend

```bash
npm run typecheck
npm test
npm run build
```

These commands check application types, run the automated tests, and compile the backend.

The tests prepare their own test environments. You do not need to start the server or create demonstration data first.

The test count may change as the project develops. Check that there are no failures and that each command completes successfully.

## 6. Choose how to start the database

The backend initializes its local database when the database module first runs.

The database file is:

`backend/data/life-flow-of-light.sqlite`

You do not need to create the tables manually or install a separate SQLite server.

### Recommended first visit: use demonstration data

While still inside `backend/`, run:

```bash
npm run seed
```

The demonstration creates:

- Three bulbs: A, B, and C.
- Thirty-one lighting sessions.
- Records for the three complete local calendar days before the command runs.
- A HELP Morse pattern in the bedroom on the third evening.

The dates follow the computer's local timezone when the seed runs.

This gives you history to explore immediately.

The seed requires empty application tables. It refuses to overwrite existing records.

Run it once for a fresh demonstration. It does not refresh the dates automatically and does not need to run each time you start the project.

### Alternative: start empty

Skip `npm run seed`.

The backend will initialize an empty database when started. You can then create and install bulbs through the interface.

Your History panel will initially have no saved lighting activity.

If the seed refuses to run because records already exist, you can continue using those records. Do not delete your database just to proceed with this guide.

## 7. Start the backend in Terminal A

Inside `backend/`, run:

```bash
npm run dev
```

The backend is expected to listen at:

`http://127.0.0.1:3000`

Leave this terminal running. It is now Terminal A.

The terminal staying occupied is normal: the server continues running until you stop it.

This address is the backend API, not the frontend application page.

## 8. Install and start the frontend in Terminal B

Open a second terminal.

First, check that the backend responds:

```bash
curl http://127.0.0.1:3000/health
```

Expected response:

```json
{"status":"ok","database":"connected"}
```

This confirms that the backend is reachable and can query the database.

Next, install the frontend dependencies:

```bash
cd ~/Life-Flow-of-Light/frontend
npm ci
```

Check the frontend:

```bash
npm run build
npm run lint
```

Then start its development server:

```bash
npm run dev
```

Leave Terminal B running too.

Open the **Local** URL printed by Vite in your browser. It is commonly:

`http://localhost:5173`

Use the actual URL shown in your terminal if it differs.

The frontend forwards `/api` requests to the backend through its Vite development proxy. Both terminals must remain running.

You do not need to open `index.html` manually.

## 9. Get familiar with the interface

The page contains four panels, in this order:

| Panel | What you can do |
| --- | --- |
| Bulbs | Manage virtual bulbs and their installation positions. |
| House | Operate the simulated lights. |
| History | Review recent activity and saved lighting sessions. |
| Morse | Follow lessons and search for recorded Morse messages. |

Use the language control to switch between English and Traditional Chinese.

Panels can be collapsed or expanded. Up to two panels share the available space; a single expanded panel can use the wider layout.

Opening another panel may collapse an existing one. If you close the last expanded panel, follow the dialog to choose what to open next.

Some columns and controls change their presentation according to the available panel width.

### Changes that stop simulated lighting

- Reloading the page resets the simulated lights to off.
- Adding, installing, uninstalling, or deleting a bulb reloads the page.
- Collapsing House stops its currently active lights.
- Once House is collapsed, its press-and-hold buttons can create new signals.

Saved database history remains available after a page reload. The temporary live activity strip resets.

Avoid reloading or managing bulbs while recording a Morse message.

## 10. Try normal lighting

If you loaded the demonstration data, the three room positions already have bulbs.

Otherwise:

1. Expand **Bulbs**.
2. Add a bulb.
3. Give it a recognizable name if desired.
4. Choose an available position.
5. Repeat for other positions if you want to control all three rooms.

The available positions are Living Room, Bedroom, and Bathroom. Each position can contain only one bulb.

Next:

1. Expand **House**.
2. Use a room's light control to turn it on.
3. Leave it on for several seconds.
4. Turn it off.
5. Observe the recent activity display in **History**.

A position without an installed bulb cannot send lighting activity.

### Bulb management rules

- A custom name must be non-empty and no longer than 20 Unicode code points.
- The serial number is permanent.
- Turn a bulb off and allow the backend to recognize it as inactive before uninstalling it.
- Uninstalling removes the bulb from its position; it does not delete its history.
- Only an uninstalled bulb with no lighting history can be deleted.

If an uninstall is rejected immediately after turning a light off, wait a little longer and try again.

## 11. Explore History

Expand **History**.

Choose a date range using **From** and **To**. The range includes both selected calendar dates.

History loads records when a valid date range changes. There is no separate Search button.

For demonstration data, select the three days before the date when you ran the seed. If you return several days later, adjust the range to those original dates.

Use **By** to change the grouping:

| Grouping | Result |
| --- | --- |
| Day | One chart per date, showing the three positions. |
| Position | One chart per position, showing the selected dates. |

You can also:

- Reverse the displayed date order.
- Zoom to inspect shorter intervals.
- Scroll horizontally through a zoomed chart.
- Point at a recorded bar to see its bulb, position, and times.

Changing the grouping changes the presentation, not the saved records.

### Live activity versus stored history

The live strip shows recent frontend activity. Each cell represents one second:

- Gold: light was observed during some part of that second.
- Pale blue: no light was observed during that second.

A gold cell does not mean the light stayed on for the entire second. Do not use the number of gold cells as a precise stopwatch.

The historical chart displays records retrieved from the database. For an updated query after creating new activity, change the date range and return to the desired range.

An empty chart means no records were returned for that selection. It is different from a failed request, which should show an error.

## 12. Find the demonstration Morse message

If you ran the seed:

1. Expand **Morse**.
2. Set the start and end date/time to include the third demonstration day's evening.
3. Press **Search**.
4. Look for HELP from the bedroom records.

For an easy first search, include all three demonstration days and set the ending time to the following morning.

The search covers the three supported positions. The results identify where a detected message came from.

Morse validates the range when you press **Search**. The starting time must be earlier than the ending time.

If no message appears, check the date range against the date when the seed actually ran.

## 13. Send your own Morse message

The Morse panel contains four lessons:

| Lesson | Practice |
| --- | --- |
| 1 | Send SOS with detailed instructions. |
| 2 | Practise letters using the A–Z reference. |
| 3 | Send I CAN USE MORSE CODE. |
| 4 | Compose your own message. |

Start with Lesson 1.

### Prepare the controls

1. Make sure a bulb is installed at your chosen position.
2. Collapse **House** to reveal its momentary buttons.
3. Open **Morse** and select Lesson 1.
4. Use the same position and bulb throughout the message.

A momentary button sends lighting activity while you hold it. Releasing it stops the signal.

### Follow the timing

| Action | Target duration |
| --- | --- |
| Dot: hold | 2 seconds |
| Dash: hold | 6 seconds |
| Release between signals in one letter | 2 seconds |
| Release between letters | 6 seconds |
| Release between words | 14 seconds |
| Final release before searching | At least 18 seconds |

Use one appropriate gap at each boundary. Do not add the gaps together.

For example, between two letters, release for 6 seconds in total—not 2 seconds followed by another 6 seconds.

### Search your attempt

1. Finish the final signal and release the button.
2. Wait at least 18 seconds.
3. Set the search start before your first signal.
4. Set the search end after the message, preferably to the current time after the wait.
5. Press **Search**.
6. Check the result's time and position to identify your attempt.

If you continue practising, update the ending time before searching again.

The decoder currently supports English letters A–Z and spaces. Do not expect numbers or punctuation to work.

The interface offers timing guidance, but manual signals can still be misread if the holds or pauses are outside the accepted ranges.

For example, O contains three dashes with short pauses inside one letter. Long pauses between those dashes may produce TTT instead.

This is a demonstration of signal interpretation. Sending SOS or HELP does not contact anyone or trigger an emergency service.

## 14. Stop and return later

To stop the project:

1. Finish any signal and turn off the simulated lights.
2. Press `Ctrl+C` in Terminal B.
3. Press `Ctrl+C` in Terminal A.

Stopping the servers does not delete the database.

### Start again

Terminal A:

```bash
cd ~/Life-Flow-of-Light/backend
npm run dev
```

Terminal B:

```bash
cd ~/Life-Flow-of-Light/frontend
npm run dev
```

Open the Local URL printed by Vite.

You do not need to reinstall dependencies, select Node.js again, or rerun the seed when the correct environment is already active.

Run `npm ci` again when intentionally reinstalling dependencies or after an update changes the dependency files.

### Back up your records

Stop the backend and ensure no other process is using its database. Then copy the complete `backend/data/` folder to your backup location.

Source-code downloads and database backups serve different purposes. Downloading the repository again does not restore your saved lighting records.

## 15. Optional: run the compiled backend

The main workflow above uses development mode.

To run the compiled backend instead, first stop its development server with `Ctrl+C`, then run:

```bash
cd ~/Life-Flow-of-Light/backend
npm run build
npm start
```

`npm start` runs the generated JavaScript. It does not compile the source first.

Keep `schema.sql` in `backend/`, and run these commands from that directory.

You can continue using the frontend development server in Terminal B.

The frontend's `npm run preview` command previews built frontend assets. It does not start the backend and is not a complete deployment procedure.

## 16. Common problems

| Problem | What to try |
| --- | --- |
| `nvm: command not found` | Run `source ~/.bashrc`, or open a new terminal after installation. |
| Node.js is not version 24 | Check `node -v`. If using nvm, run `nvm use 24` in the current terminal. |
| New terminals keep selecting another Node.js version | If you want version 24 as your default, run `nvm alias default 24` and check that your shell loads nvm. |
| npm cannot find `package.json` | Use `pwd` and enter `backend/` or `frontend/` before running npm commands. |
| `npm ci` reports mismatched package files | Ensure `package.json` and `package-lock.json` come from the same project revision. |
| Downloads fail | Check the internet connection and the error message before retrying. |
| The health check cannot connect | Confirm that the backend is still running in Terminal A. |
| Port 3000 is already in use | Check for another backend terminal and stop the duplicate server. |
| The browser cannot open the frontend | Use the Local URL printed by Vite and keep Terminal B running. |
| The page opens but API requests fail | Check the backend terminal and repeat the health check. |
| A room button is unavailable | Install a bulb at that position. |
| Uninstalling is rejected | Turn the bulb off, wait for inactivity to be recognized, and try again. |
| Deleting a bulb is rejected | It must be uninstalled and have no historical sessions. |
| The seed refuses to run | Existing records are protected. Continue using them or use an intentionally prepared empty database. |
| History is empty | Check the selected dates, especially the original seed dates. |
| Morse finds nothing | Check the range, signal timing, and final wait; update the end time. |
| Morse returns an unexpected message | Check the result timestamp and review both hold durations and release gaps. |
| A query reports too many records | Search a shorter time range. |
| `npm start` cannot find `dist/server.js` | Run `npm run build` successfully inside `backend/` first. |

For more background, return to [Structure and Technology](StructureIntro.md).

Documentation updated: 3 November 2026.
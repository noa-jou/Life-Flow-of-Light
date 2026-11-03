# Life Flow of Light — Frontend Learning Notes

**Started:** 21 October 2026  
**Stage:** React setup and an empty folding-panel layout  
**Status:** Implementation instructions prepared; local verification pending.

## About these notes

I am building this frontend step by step with ChatGPT's assistance.

These notes explain the commands, design decisions, and React concepts.
They distinguish proposed steps from results verified on my computer.

The panel contents will be designed separately.

## 1. Frontend structure

The repository keeps the frontend and backend in separate directories:

- `backend/`: Express API and SQLite database.
- `frontend/`: React interface.
- `FrontendLearningNotes.md`: frontend learning record.

Each application has its own package.json and dependencies.

## 2. Creating the project

From the repository root:

```bash
cd ~/Life-Flow-of-Light
nvm use 24
node -v
npm -v
ls
```

Before creating the project, check that frontend/ does not already
contain work that must be preserved.

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
echo "24" > .nvmrc
npm install

npm pkg set name="life-flow-of-light-frontend"
npm pkg set private=true --json
npm pkg set license="UNLICENSED"
npm pkg set 'engines.node=24.x'
```

- React describes the interface and updates it when state changes.
- TypeScript checks types.
- Vite provides the development server and production build.
- .nvmrc records the intended Node.js version.
- engines.node documents the expected version; it does not switch Node.
- private prevents accidental publication to npm.
- package-lock.json records resolved dependency versions.

Source files and package-lock.json belong in Git.
node_modules/ and dist/ are generated and should be ignored.

## 3. Entry files

| File | Responsibility |
| --- | --- |
| frontend/index.html | HTML entry and root element. |
| frontend/src/main.tsx | Mount App into the root element. |
| frontend/src/App.tsx | Panel definitions, state, and interactions. |
| frontend/src/index.css | Global styles. |
| frontend/src/App.css | Panel layout and transitions. |

A .tsx file can contain TypeScript and JSX.

JSX describes the interface using syntax resembling HTML.
JavaScript expressions can appear inside braces.

The starter styles are replaced because their layout rules could
interfere with the folding panels.

## 4. Panel rules

The permanent left-to-right order is:

1. Lamps 
2. House 
3. History 

Exactly one or two panels are open.

Full width means the space remaining after the collapsed panels
and layout spacing are accounted for.

When two panels are open, they have equal widths.

The default state is 23: House and History are open.

Collapsing the only open panel opens the other two.

When Lamps and History are open, opening House collapses Lamps.
The resulting state is 23.

The panel array stays in its original order.
Opening and closing changes widths, not ordering.

## 5. Representing layout with React state

```tsx
type Layout = '1' | '2' | '3' | '12' | '13' | '23';

const [layout, setLayout] = useState<Layout>('23');
```

The digits identify the open panels.

Using six explicit states avoids combinations where all panels
are open or all are closed.

useState remembers the current layout.
setLayout requests an update, after which React renders the new state.

The transition table defines every button action:

| Current state | Click 1 | Click 2 | Click 3 |
| --- | --- | --- | --- |
| 1 | 23 | 12 | 13 |
| 2 | 12 | 13 | 23 |
| 3 | 13 | 23 | 12 |
| 12 | 2 | 1 | 23 |
| 13 | 3 | 23 | 1 |
| 23 | 12 | 3 | 2 |

A functional state update calculates the next state from the
previous state:

```tsx
setLayout((previousLayout) => {
  return transitions[previousLayout][panelId];
});
```

The updater only calculates a value. It does not change the DOM,
send requests, or modify the transition table.

## 6. Rendering the panels

panels.map(...) creates one section per panel.

Each section has a stable key based on its ID.

A native button handles clicking and keyboard activation.

aria-expanded communicates whether the panel is open.
aria-controls identifies its content area.
hidden hides the content when the panel is collapsed.

The content areas intentionally contain no product features yet.

## 7. Widths and animation

Flexbox arranges the panels horizontally.

Every panel has the same base width.
Collapsed panels have flex-grow: 0.
Open panels have flex-grow: 1.

Consequently, two open panels are equally wide, while one open
panel receives all the remaining space.

The collapsed width is configured with:

```css
--collapsed-width: 5cm;
```

CSS centimeters do not guarantee the same physical measurement
on every screen.

The current layout has a minimum width of 760px.
Narrower windows can scroll horizontally.

The flex-grow transition animates width changes.
Reduced-motion preferences disable the animation.

## 8. Running and building

From frontend/:

```bash
nvm use
npm run dev
```

Open the local URL printed by Vite, normally:

http://localhost:5173

The backend is not needed for this layout-only stage.

In another terminal, from frontend/:

```bash
nvm use
npm run build
```

The generated build script checks TypeScript and builds the
application into dist/.

Build success does not by itself verify appearance or interactions.

## 9. Manual verification checklist

- [ ] Initial state is 23.
- [ ] Open 1: state becomes 12.
- [ ] Close 2: state becomes 1.
- [ ] Close 1: state becomes 23.
- [ ] Close 2: state becomes 3.
- [ ] Open 2: state becomes 23.
- [ ] Close 3: state becomes 2.
- [ ] Close 2: state becomes 13.
- [ ] Open 2: state becomes 23.
- [ ] Panel order always remains 1, 2, 3.
- [ ] Keyboard activation works.
- [ ] A narrow window allows horizontal scrolling.
- [ ] npm run build succeeds.

ChatGPT checked the 18 state transitions and the requested
interaction sequence with a standalone script.

The complete React application has not yet been verified on
my computer. Record actual results after running it.

---

## 10. Progress update — 24 October 2026

The frontend now includes a working Bulbs panel connected to the backend.

The project title is:

- English: **Life Flow of Light**
- Traditional Chinese: **歲月流明**

The page uses different shades of blue. A selected bulb row has a pale yellow border.

The House and History panels are still empty. Their contents will be developed later.

The earlier sections describe the first layout-only stage. At this stage:

- The frontend build and lint checks passed on my computer.
- Both the backend URL and the frontend proxy returned the bulb list successfully.
- I manually tested the implemented bulb functions and reported that they worked.

The backend must now be running for the bulb functions to work.

## 11. Organizing files by feature

We moved the bulb files into `frontend/src/bulb/`.

The relevant source files are:

```text
frontend/src/
  main.tsx
  index.css
  App.tsx
  App.css
  i18n.ts
  bulb/
    bulb-api.ts
    bulb-text.ts
    BulbPanel.tsx
    BulbPanel.css
```

Each file has a separate job:

| File | Job |
| --- | --- |
| `main.tsx` | Starts React and displays `App`. |
| `index.css` | Defines global styles. |
| `App.tsx` | Manages the page layout and selected language. |
| `App.css` | Styles the page shell and folding panels. |
| `i18n.ts` | Defines the language codes shared by the application. |
| `bulb-api.ts` | Sends bulb requests to the backend. |
| `bulb-text.ts` | Stores English and Chinese text for the bulb interface. |
| `BulbPanel.tsx` | Displays bulbs and handles user interactions. |
| `BulbPanel.css` | Styles the bulb interface. |

Keeping related files together makes them easier to find.

For example, when changing the appearance of a bulb row, I can look in `bulb/BulbPanel.css`.

Shared language definitions stay outside the bulb folder because other panels will also need them.

## 12. Understanding export and import

A file can make something available to other files by using `export`.

Another file can use that exported item by using `import`.

An export does not choose a destination or send something to every file. Each receiving file decides what it needs to import.

### A named export

In `i18n.ts`:

```ts
// Make this type available to other files.
export type Language = 'en' | 'zh-Hant';
```

The exported name is `Language`.

In `App.tsx`:

```tsx
// Import the shared language type.
import type { Language } from './i18n';
```

The braces identify a named export.

The importing file uses the exported name, `Language`.

### A default export

In `BulbPanel.tsx`, the component is exported like this:

```tsx
export default function BulbPanel({ expanded, language }: Props) {
  // The component implementation continues here.
}
```

In `App.tsx`, it is imported like this:

```tsx
import BulbPanel from './bulb/BulbPanel';
```

A default import does not use braces.

Each file can have multiple named exports, but only one default export.

These examples explain the syntax. They are not replacements for the complete component.

## 13. Reading import paths

Import paths are relative to the file containing the import.

- `./` means “start in this file's folder.”
- `../` means “go up one folder.”

Examples:

| Importing file | Import path | Destination |
| --- | --- | --- |
| `src/App.tsx` | `./i18n` | `src/i18n.ts` |
| `src/App.tsx` | `./bulb/BulbPanel` | `src/bulb/BulbPanel.tsx` |
| `src/bulb/BulbPanel.tsx` | `../i18n` | `src/i18n.ts` |
| `src/bulb/BulbPanel.tsx` | `./bulb-text` | `src/bulb/bulb-text.ts` |

Moving all four bulb files together preserved their paths to each other.

However, `App.tsx` needed a new path because `BulbPanel.tsx` moved into a subfolder.

These file paths are different from API URLs. Moving a source file does not change `/api/bulbs`.

## 14. Language support has three separate parts

It helps to separate three ideas:

| Part | Example | Purpose |
| --- | --- | --- |
| Language type | `Language` | Defines which language codes are allowed. |
| Selected language | `language` | Stores the user's current choice. |
| Translation dictionary | `bulbText` | Provides the words to display. |

They work together, but they are not the same thing.

### Part 1: The Language type

`src/i18n.ts` contains:

```ts
// Define the language codes shared by the entire application.
// "zh-Hant" represents Traditional Chinese.
export type Language = 'en' | 'zh-Hant';
```

The `|` means “or.”

A value with type `Language` must be either `'en'` or `'zh-Hant'`.

For example:

```ts
const firstLanguage: Language = 'en';
const secondLanguage: Language = 'zh-Hant';
```

TypeScript checks this while checking the code.

The type does not translate words, remember the user's choice, or switch the interface.

`import type` imports a definition for TypeScript. That import is removed from the JavaScript used by the browser.

### Part 2: The selected language

Inside `App.tsx`:

```tsx
// Start in English whenever the page is loaded.
const [language, setLanguage] = useState<Language>('en');
```

This creates React state:

- `language` is the current value.
- `setLanguage` requests a change to that value.
- `'en'` is the starting value.
- `<Language>` tells TypeScript which values are allowed.

`App` owns this state because it contains all three panels.

This gives the page one shared language choice.

The current implementation starts in English again after a page reload. It does not save the choice in browser storage.

### Part 3: The translation dictionaries

`App.tsx` contains a local `translations` object for the page shell:

- Project name.
- Language label.
- Panel titles.
- Expand and collapse labels.

`bulb-text.ts` exports `bulbText` for the bulb feature:

- Column headings.
- Button labels.
- Confirmation messages.
- Error messages.
- Position names.

Both dictionaries use the same language keys:

```ts
'en'
'zh-Hant'
```

The spelling must match the `Language` type exactly.

## 15. Who imports what?

The current language-related relationships are:

| Source file | What it provides | Who uses it |
| --- | --- | --- |
| `i18n.ts` | Named type export: `Language` | `App.tsx` and `BulbPanel.tsx` |
| `bulb-text.ts` | Named value export: `bulbText` | `BulbPanel.tsx` |
| `BulbPanel.tsx` | Default component export: `BulbPanel` | `App.tsx` |
| `App.tsx` | Default component export: `App` | `main.tsx` |

The `translations` object inside `App.tsx` is local. It does not need an export because only that file uses it.

The current `bulb-text.ts` does not use the `Language` type in its code, so it does not need to import it.

Sharing the language system does not mean every file must import every related item.

Each file imports only what it uses.

## 16. Passing the selected language through props

Imports make code available to a file.

**Props pass values from a parent component to a child component.**

These are two different actions.

`App.tsx` imports the component:

```tsx
import BulbPanel from './bulb/BulbPanel';
```

Then, inside its JSX, it passes the current values:

```tsx
<BulbPanel expanded={isOpen} language={language} />
```

In `language={language}`:

- The left `language` is the prop name.
- The right `{language}` reads the current state value from `App`.

`BulbPanel.tsx` describes the props it expects:

```tsx
type Props = {
  expanded: boolean;
  language: Language;
};
```

This means:

- `expanded` must be `true` or `false`.
- `language` must be `'en'` or `'zh-Hant'`.

The component receives those values:

```tsx
export default function BulbPanel({ expanded, language }: Props) {
  const text = bulbText[language];

  // The rest of the component uses these values.
}
```

`BulbPanel` does not import the current language state from `App`.

It imports the **type** from `i18n.ts`, but receives the **current value** through props.

This distinction is important:

> Importing `Language` tells the component which values are allowed.  
> Receiving `language` tells the component which value to use now.

## 17. What happens when I change the language?

The sequence is:

1. I choose a language from the dropdown.
2. The dropdown's `onChange` handler reads its value.
3. The handler checks whether the value is supported.
4. `setLanguage` updates the state in `App`.
5. React renders `App` again.
6. `App` selects its matching translations.
7. `App` passes the new language to `BulbPanel`.
8. `BulbPanel` selects its matching translations.

The dropdown check is:

```tsx
const nextLanguage = event.target.value;

// Validate the browser's string value before updating state.
if (nextLanguage === 'en' || nextLanguage === 'zh-Hant') {
  setLanguage(nextLanguage);
}
```

The browser gives us a string. The condition checks that it is one of our two supported strings.

Inside `BulbPanel`, this line selects a dictionary:

```tsx
const text = bulbText[language];
```

If `language` is `'en'`, it selects `bulbText.en`.

If `language` is `'zh-Hant'`, it selects `bulbText['zh-Hant']`.

The JSX can then use the same expression in either language:

```tsx
<button>{text.add}</button>
```

The button displays either “Add bulb” or “新增燈泡”.

We do not need a separate button implementation for each language.

An effect in `App` also updates the browser tab title and the HTML language:

```tsx
useEffect(() => {
  document.documentElement.lang = language;
  document.title = translations[language].appName;
}, [language]);
```

The dependency `[language]` makes this effect run after the initial render and when the selected language changes.

Changing the interface language does not rename bulbs or change backend position codes. For example, `living_room` remains the API value, while the interface displays “Living room” or “客廳”.

## 18. Renaming Lamp to Bulb

We changed the feature name from Lamp to Bulb.

The rename affected several connected parts:

- Type and function names.
- Component names and imports.
- API URLs.
- CSS class names.
- Interface text.

Examples include:

```text
Lamp → Bulb
getLamps → getBulbs
/lamps → /bulbs
.lamp-row → .bulb-row
```

Changing a filename alone does not update the exports inside it.

Also, a CSS selector must match the class used in JSX.

For example, `.bulb-row` styles an element with `className="bulb-row"`.

TypeScript helps find broken imports. Manual browser checks help find visual problems such as mismatched CSS classes.

## 19. Connecting the frontend to the backend

The browser requests:

```text
/api/bulbs
```

During development, Vite forwards this request to:

```text
http://127.0.0.1:3000/bulbs
```

The proxy setting removes the `/api` prefix:

```ts
// Remove the /api prefix before forwarding requests to the backend.
rewrite: (path) => path.replace(/^\/api/, ''),
```

This rule also handles bulb URLs containing IDs and `/position`.

The frontend API functions are kept in `bulb-api.ts`. This separates HTTP requests from the interface code.

The implemented operations are:

| Action | HTTP method | Backend path |
| --- | --- | --- |
| Load bulbs | GET | `/bulbs` |
| Add a bulb | POST | `/bulbs` |
| Rename a bulb | PATCH | `/bulbs/:id` |
| Install a bulb | PUT | `/bulbs/:id/position` |
| Uninstall a bulb | DELETE | `/bulbs/:id/position` |
| Delete a bulb | DELETE | `/bulbs/:id` |

`:id` represents the bulb's actual ID.

The Vite `server.proxy` setting is for the development server. A production deployment will need its own API routing arrangement.

## 20. How the bulb interface works

Installed bulbs appear first. Idle bulbs appear immediately below them.

Within each group, bulbs are sorted by ID in ascending order. IDs are used internally and are not displayed.

When the panel is collapsed:

- Only bulb names are displayed.
- Hover text shows the position or “Idle”.
- The list can scroll vertically.

When the panel is expanded:

- Column headings explain the name, serial number, and position.
- Clicking a row opens its name editor.
- The serial number cannot be edited.
- Installed bulbs have an Uninstall button.
- Idle bulbs can be installed at an available position.
- The installation button is disabled when no position is available.
- Idle bulbs have a delete button.
- The Add bulb button stays at the bottom of the panel.

Confirmation dialogs ask before renaming, installing, uninstalling, or deleting.

The backend still checks whether an action is allowed. Frontend controls help the user, but they do not replace backend validation.

For example, a bulb with usage history cannot be deleted.

## 21. Refreshing data after changes

After a successful change, the frontend requests the complete bulb list again.

The shared `synchronize` function handles this for adding, renaming, installing, and uninstalling.

Deletion has its own handler and also reloads the list after success.

The basic sequence is:

1. Send the requested change.
2. Wait for the backend response.
3. Request the latest bulb list.
4. Store it in React state.
5. Let React display the updated list.

Available positions are calculated from that list again.

This keeps the displayed bulbs and available positions based on the same data.

Reloading the list means making another API request. It does not mean reloading the whole browser page.

The interface also distinguishes between:

- A change that could not be confirmed.
- A successful change followed by a failed refresh.

This matters because a refresh failure does not mean the original change failed.

## 22. Highlighting the selected row

React already tracks the row being edited.

When an expanded row is selected, its class list includes `is-editing`.

CSS uses that class to display the pale yellow border:

```css
/* Highlight the selected bulb row with a pale yellow border. */
.bulb-row.is-editing {
  border-color: #ffe89a;
  box-shadow: inset 0 0 0 2px #ffe89a;
}
```

`.bulb-row.is-editing` means an element with both classes.

There is no space between the class selectors because they refer to the same element.

`border-color` changes the existing border color.

The inset shadow adds a visible line inside the row without changing its size or moving nearby content.

React decides which row is selected. CSS decides how that selected row looks.

## 23. Verification and current scope

From `frontend/`:

```bash
npm run build
npm run lint
```

The build script checks TypeScript and creates the production output.

The lint script checks the code for configured rule violations.

Both commands passed after the folder and language-import changes.

We also checked:

```bash
# Check the backend directly.
curl -i http://127.0.0.1:3000/bulbs

# Check the backend through the frontend development proxy.
curl -i http://localhost:5173/api/bulbs
```

Both returned `200 OK` with the same bulb data.

These requests verify reading data through both routes. They do not test all write operations.

I also manually tested the implemented interface functions and reported that they worked smoothly.

The current completed feature is bulb management. The House and History panel contents remain future work.

---

## 24. Progress update — 24 October 2026

The House panel now works with the backend.

Today, I added the floor plan, connected the light switches, and added Morse code instructions. I also fixed a problem that allowed an active bulb to be uninstalled.

I tested the changes on my computer and confirmed that they worked.

The earlier sections describe an earlier stage. The following points have now changed:

- House is no longer empty.
- App translations now live in `i18n.ts`.
- App owns the shared heartbeat manager.
- Bulbs and House use the same light state.
- Confirmation messages use a shared page dialog.

The History panel is still future work.

## 25. New files and their jobs

The new files are inside `frontend/src/`:

| File | Job |
| --- | --- |
| `house/HousePanel.tsx` | Displays the floor plan and light switches. |
| `house/HousePanel.css` | Styles the floor plan, switches, and guide layout. |
| `house/house-text.ts` | Stores text for the House interface. |
| `house/house-api.ts` | Sends heartbeat requests. |
| `house/useBulbHeartbeats.ts` | Manages light state, timers, and pending requests. |
| `house/MorseGuide.tsx` | Displays Morse instructions and the A–Z reference. |
| `components/Dialog.tsx` | Manages and displays the shared page dialog. |
| `components/dialog-context.ts` | Lets components access the shared dialog. |
| `components/Dialog.css` | Styles the dialog and its backdrop. |

Each file has a clear job.

For example, changing the floor plan layout should not require changing the heartbeat API code.

## 26. Placing switches on the floor plan

The floor plan is displayed inside an SVG.

The SVG uses a `viewBox` to define its coordinate system. Each room has a fixed point in that system.

The image and switches use the same coordinates, so they scale together.

I learned these SVG features:

| Feature | Purpose |
| --- | --- |
| `viewBox` | Defines the drawing coordinates. |
| `preserveAspectRatio` | Keeps the drawing in proportion and centered. |
| `<image>` | Displays the floor plan image. |
| `<foreignObject>` | Allows an HTML button inside the SVG. |
| `transform` | Rotates or moves the image. |

The image keeps the same direction in both half-width and full-width layouts.

The switches stay upright and remain in their rooms.

When House is fully open:

- The left side shows the A–Z reference.
- The center shows the floor plan.
- The right side shows Morse instructions.

When House is half open, the guides are hidden.

The image still scales to fit the available space. Its exact size is not locked.

## 27. Showing whether a room has a bulb

A switch has three main appearances:

| Situation | Appearance | Can turn on? |
| --- | --- | --- |
| No bulb installed | White background, black outline | No |
| Bulb installed and off | Black background, white outline | Yes |
| Bulb installed and on | Pale yellow background, gray outline | Already on |

House loads the bulb list from the backend to check which rooms have installed bulbs.

Loading and failure are different from an empty room:

- While loading, the interface says it is checking.
- If loading fails, the interface shows an error and a retry button.
- Only a successful check can confirm that a room has no bulb.

I learned not to treat missing information as a confirmed result.

The unavailable button uses `aria-disabled` so it can still receive focus and show a reason.

However, `aria-disabled` does not stop clicks by itself. The click handler must also reject the action.

## 28. Updating House after a bulb change

Bulbs and House need to stay in sync.

After a successful bulb change:

1. Bulbs calls `onBulbsChanged()`.
2. App increases `bulbRevision`.
3. House receives the new revision through props.
4. House requests the latest bulb list.
5. React updates the switches.

`bulbRevision` is a frontend update counter. It is not a database field.

I learned that a parent can pass a function to a child through props.

The child calls that function to tell the parent that something happened.

House also uses `AbortController` when loading data. If a newer request replaces an older one, the old result should not update the screen.

## 29. Sending real heartbeats

Turning on a bulb sends:

```text
POST /api/bulbs/:id/heartbeat
```

The development proxy removes `/api` before forwarding the request.

The request does not need a JSON body. The backend determines the position and timestamp.

The response means:

- `201`: a new lighting session was created.
- `200`: an existing session was updated.

The frontend sends the first heartbeat immediately, then aims to send one every 200 milliseconds.

It avoids overlapping requests for the same bulb.

Turning the switch off stops future heartbeats. The backend considers the bulb off when the last heartbeat is more than one second old.

I checked the database and confirmed:

- Opening a new lighting session creates a record.
- Continued heartbeats update `last_seen_at`.
- Turning off stops those updates.
- Turning on again after the timeout creates another session.

There is no separate “off” record.

## 30. State, refs, effects, and custom Hooks

The heartbeat code helped me understand several React tools.

| Tool | What it does in this project |
| --- | --- |
| `useState` | Stores values that affect the screen. |
| `useRef` | Holds timers and request controllers without causing a render. |
| `useEffect` | Connects to browser behavior and cleans up resources. |
| `useCallback` | Keeps a function reference stable while its dependencies stay the same. |
| Custom Hook | Groups related React logic into a reusable function. |

Our custom Hook is called `useBulbHeartbeats()`.

It separates heartbeat behavior from the floor plan drawing.

The light states are:

```ts
'off'
'starting'
'on'
'error'
```

The switch becomes yellow after the first successful heartbeat response.

If a request fails, the loop stops and the interface shows an error.

Cleanup matters too. Timers must be cleared and pending requests must be cancelled when they are no longer needed.

Cancelling a request does not undo a heartbeat that the backend has already received.

## 31. Sharing state between House and Bulbs

At first, House owned the heartbeat manager.

This meant Bulbs could not directly check whether a switch was on.

We moved the Hook call into App:

```tsx
const heartbeats = useBulbHeartbeats();
```

App passes the same manager to both components:

```tsx
<BulbPanel heartbeats={heartbeats} /* other props */ />
<HousePanel heartbeats={heartbeats} /* other props */ />
```

These are shortened examples, not complete replacements.

This React pattern is called **lifting state up**.

When two components need the same changing information, their common parent can own it.

An important lesson:

> Calling the same custom Hook in two components does not automatically share its state.

We call the Hook once in App and share its result.

We also used:

```ts
ReturnType<typeof useBulbHeartbeats>
```

This tells TypeScript to use the Hook’s return type, instead of writing the same type again by hand.

## 32. Fixing the uninstall problem

The intended rule is:

> The user must turn the switch off before uninstalling the bulb.

The backend already rejected uninstall requests when the last heartbeat was no more than one second old.

However, the frontend had two problems:

1. Bulbs did not check House’s switch state.
2. The native confirmation dialog could pause JavaScript and interrupt heartbeats.

The screen could remain yellow while the backend stopped receiving heartbeats.

After the timeout, the backend could allow uninstalling.

We added a frontend check before showing the confirmation:

```tsx
if (heartbeats.lights[bulb.position] !== 'off') {
  setBlockedUninstallId(bulb.id);
  return;
}
```

This check runs only after confirming that `bulb.position` is not `null`.

The `return` ends the operation immediately.

No confirmation dialog opens, and no DELETE request is sent.

The interface shows a message beside the affected bulb.

Only `'off'` can continue. The states `'starting'`, `'on'`, and `'error'` are blocked.

For an error state, clicking the House switch once resets it to off. Clicking again starts a new attempt to turn it on.

The backend’s one-second check remains in place.

Frontend checks guide the user. Backend checks protect the data.

## 33. Reading Network errors carefully

I learned that an HTTP status code alone does not explain which operation failed.

These requests have different meanings:

| Request | Meaning |
| --- | --- |
| `DELETE /api/bulbs/:id/position` | Try to uninstall a bulb. |
| `POST /api/bulbs/:id/heartbeat` | Try to record a heartbeat. |

During debugging, the uninstall request returned `200`, while a later heartbeat returned `409`.

This meant uninstalling succeeded, and the later heartbeat was rejected.

It did not mean the backend had rejected uninstalling.

When checking an error, I should inspect:

1. The request URL.
2. The HTTP method.
3. The status code.
4. The response body.
5. The order of nearby requests.

A message in the browser console does not automatically create a message in the application. The frontend must decide how to display it.

## 34. Replacing blocking browser dialogs

We replaced `window.confirm()` and `window.alert()` in Bulbs with a shared page dialog.

The shared files live in `src/components/`, because dialogs can be used by all three tabs.

`DialogProvider` wraps the page once, outside the panel loop.

Components use:

```tsx
const { ask, inform } = useDialog();
```

For a confirmation:

```tsx
const confirmed = await ask('Continue?');

if (!confirmed) return;
```

For a notification:

```tsx
await inform('The operation is complete.');
```

The actual interface uses translated text instead of these example strings.

I learned the difference between waiting and blocking:

- `await` pauses that async function until its Promise finishes.
- It does not pause all JavaScript.
- Heartbeat timers can continue while the user reads the dialog.

The page uses `<dialog>` with `showModal()`.

This blocks background interaction without blocking the heartbeat code.

## 35. Context, Provider, and Portal

The shared dialog introduced three more React ideas.

| Idea | Meaning in this project |
| --- | --- |
| Context | Gives components access to shared dialog actions. |
| Provider | Makes those actions available to the components inside it. |
| Portal | Places the dialog DOM outside the panel containers. |

The Provider receives the page through `children`.

The dialog uses:

```tsx
createPortal(dialogContent, document.body)
```

This places its HTML under the page body while keeping it connected to the React application.

The dialog is not hidden or clipped by a collapsed tab.

CSS centers it in the browser viewport.

The current version displays one dialog at a time. A second call while a dialog is open returns `false`; it is not queued.

## 36. Keeping translations and rendering organized

We moved App’s translation dictionary from `App.tsx` into `i18n.ts` and named it `appText`.

`i18n.ts` now contains:

- The shared `Language` type.
- `appText` for the page shell.
- `dialogText` for the shared dialog.

Feature text remains close to its feature, such as `bulb-text.ts` and `house-text.ts`.

I also learned why conditional rendering matters inside a loop:

```tsx
{panelId === 1 && (
  <BulbPanel /* props */ />
)}

{panelId === 2 && (
  <HousePanel /* props */ />
)}
```

The conditions place each component in the correct panel.

Without the House condition, the floor plan appeared in every panel.

React followed the JSX exactly. The problem was where we told it to render the component.

## 37. Adding Morse code instructions

The House guides explain how to send messages using the switches.

The timings match the current backend decoder:

| Action | Target duration |
| --- | --- |
| Dot | Light on for 2 seconds |
| Dash | Light on for 6 seconds |
| Gap inside a letter | Light off for 2 seconds |
| Gap between letters | Light off for 6 seconds |
| Gap between words | Light off for 14 seconds |

A space does not have its own flashing pattern. It is represented by the gap between words.

After the final signal, the guide asks the user to leave the light off for at least 18 seconds before checking the completed message.

The guide includes `SOS` and an A–Z reference.

These are instructions only. The guide does not automatically send Morse code or request decoding.

I learned that instructions must match the actual program rules.

## 38. Reloading, hiding, and removing are different

Collapsing House does not mean turning its switches off.

The heartbeat manager stays in App, so changing panel widths or the selected language does not stop it.

Reloading the page is different:

- The old page’s heartbeat loop ends.
- The new page initializes all switches as off.
- The backend may still need time to reach its timeout.

The header now reminds users to:

- Use only one frontend tab or window.
- Expect switches to start off after reloading.

These reminders do not technically prevent another browser tab from opening.

Also, 200 milliseconds is a target interval, not a guarantee. Background tabs, network delays, and computer sleep can affect timing.

## 39. What I verified today

During today’s work, I ran:

```bash
npm run build
npm run lint
```

I also manually tested:

- The floor plan and room switch positions.
- Half-width and full-width House layouts.
- Language switching.
- Installed and uninstalled switch appearances.
- Heartbeat requests and database updates.
- Turning lights off and starting new sessions.
- Keeping lights active while changing the layout.
- Rejecting uninstall when the switch is not off.
- Uninstalling after turning off and waiting.
- Shared dialog confirmation and cancellation.
- Continued heartbeats while another operation’s dialog stays open.

I reported that the final tests worked smoothly.

Build and lint checks help find code problems. Browser tests check behavior. Network and database checks show what actually happened behind the interface.

## 40. Main lessons from today

I learned to ask:

- Which component should own this state?
- Which other components need to read it?
- Does this action need a check before sending a request?
- Does the backend check the rule too?
- Could this interface stop another part of the program?
- Am I reading the error from the correct request?

The biggest lesson was that features can affect each other.

A confirmation dialog looked like a small interface detail, but it interrupted the heartbeat simulation.

Sharing state and using a non-blocking page dialog helped the parts work together.

The next major feature is the History panel.

不用心虛，這幾天你一直在實作、測試，也重新思考使用者要怎麼操作。現在補寫，反而能把「為什麼改」一起記錄下來。

我讀完了，原文停在 **第 40 節，History 還沒開始**。以下可以直接接在檔案最後。我用今天作為整理日期，不替每項工作猜測完成日期，也會說明哪些舊設計已經改變。

---

## 41. Progress update — 31 October 2026

This update covers the work since my previous notes.

The frontend now has four panels:

1. Bulbs
2. House
3. History
4. Morse

History now displays real lighting records from the backend. It also shows a live timeline.

Morse has its own panel and learning guide. Its search interface is still future work.

House now has two different controls:

- When expanded, clicking a switch turns the light on or off.
- When collapsed, holding a button turns the light on. Releasing it turns the light off.

The full-width House view now includes a front garden and a back garden.

I tested changes in small steps and reported the results before continuing.

### Changes to earlier notes

Some earlier sections describe designs that we have now replaced:

| Earlier design | Current design |
| --- | --- |
| Three panels | Four panels, including Morse |
| A fixed transition table | An array that remembers the open panels |
| Closing the last panel opens other panels automatically | A dialog asks which panel to open next |
| Collapsing House does not stop its lights | Collapsing House stops all its lights |
| Morse guides appear beside the floor plan | Morse guides live in the Morse panel |
| House keeps one orientation | Half-width is portrait; full-width is landscape |
| Dialog files live in `components/` | Dialog files live in `dialog/` |
| History is future work | History displays lighting records |

The earlier notes are still useful as a record of how the project developed.

## 42. Small fixes that improved the interface

Before building History, we improved two details in Bulbs.

The serial number is useful for reference, but it takes up space. We hid that column when Bulbs is half-width and kept it visible when fully expanded.

This changes what the interface displays. It does not remove the serial number from the data.

We also fixed an old uninstall warning that kept appearing again.

After a blocked uninstall attempt, turning the light off should clear that warning. Turning it on later should not bring back the old warning automatically.

I learned that an error message also has a lifecycle:

1. An action causes the warning.
2. The user changes the situation.
3. The interface clears the warning when it is no longer relevant.

A warning should describe the current situation, not remain forever because something happened earlier.

## 43. Turning House into a Morse input device

The collapsed House panel now contains three momentary buttons.

A momentary button stays active only while it is held.

The intended behavior is:

| Action | Result |
| --- | --- |
| Point at an available button | Show an open-hand cursor |
| Press and hold | Start sending heartbeats |
| Release, even over the same button | Stop sending heartbeats |
| Try a position without a bulb | Do not start |

The implementation also handles keyboard input and cleanup when interaction is interrupted.

We used pointer capture to help track a press even when the pointer moves outside the button.

I learned that `onClick` is not enough for every interaction.

A toggle needs to know that a click happened. A momentary control needs to know when pressing starts and ends.

### Collapsing House

When House changes from expanded to collapsed, App stops all three lights.

Changing House from half-width to full-width does not stop them.

Once House is collapsed, the user can start a new signal by holding one of its buttons.

This separates two actions:

- Entering the collapsed layout resets the lights.
- Using the collapsed controls creates new signals.

## 44. Building the live lighting timeline

History now shows a live timeline for the three positions.

Each cell represents one second:

- Pale blue means no light was observed during that second.
- Gold means the light was on at some point during that second.

A short flash should still leave a gold cell. We should not only check the light at one exact instant and miss everything between checks.

When the light turns off, new cells return to blue. Earlier gold cells remain and move through the timeline.

The local clock shows hours, minutes, and seconds.

The two layouts use different directions:

| Layout | Newest cell | Older cells move |
| --- | --- | --- |
| Collapsed, vertical | Top | Down |
| Expanded header, horizontal | Left | Right |

This live strip is different from the historical Gantt chart. The Gantt chart always shows earlier times on the left and later times on the right.

### Sharing the timeline

App calls the live timeline Hook and passes its result to the displays.

This lets the collapsed timeline and expanded header use the same recent history.

I learned again that sharing a Hook’s result is different from calling the Hook separately in several components.

The live timeline is temporary frontend data. It is not a replacement for the database history, and reloading resets it.

## 45. Designing History around questions

The History panel helps users compare lighting behavior.

The controls are:

- From: the first date.
- To: the last date.
- By: Day or Position.

The default range starts three days before today and ends today. This includes four calendar dates.

The inputs accept dates, not times.

There are two ways to arrange the same records.

### By Day

Each chart represents one date.

- Chart title: the date.
- Y-axis: Living Room, Bedroom, and Bathroom.
- X-axis: the 24 hours of that day.

### By Position

There are three charts, one for each position.

- Chart title: the position.
- Y-axis: the selected dates.
- X-axis: the 24 hours of a day.

Changing the grouping changes the presentation. It does not require a different set of lighting records.

The date-order button also depends on the grouping:

- By Day: reverse the order of the charts.
- By Position: reverse the date rows inside each chart.

The order of the three positions stays fixed.

## 46. Rejecting an invalid date change

History loads data when the date range changes. It does not have a Search button.

Therefore, we must reject an invalid range before saving it into state.

The handler follows this order:

1. Read the proposed input.
2. Build the proposed date range.
3. Check whether From is after To.
4. If invalid, show the shared dialog and return.
5. Otherwise, update the date state.

The previous valid range stays selected after a rejected change.

I learned that showing an error is not the same as preventing an invalid state.

A controlled input gets its displayed value from React state. Keeping the valid state also keeps the valid value on screen.

## 47. Local dates and backend timestamps

Users choose dates in their local timezone.

The backend receives timestamps representing exact moments.

For the historical query, we calculate:

- Start: local midnight at the beginning of From.
- End: local midnight immediately after To.

For example, selecting 28–31 October includes the whole of 31 October by using 1 November at midnight as the end boundary.

The end boundary is exclusive: the next day itself is not part of the selected range.

JavaScript’s `getTime()` converts a Date into milliseconds since the Unix epoch. We do not manually subtract eight hours.

I learned to distinguish:

- A local calendar date.
- A local date and time.
- A timestamp sent to the backend.
- A formatted date shown to the user.

They are related, but they are not interchangeable.

## 48. Loading historical records safely

History requests lighting sessions for all three positions.

We separated the work into files with different responsibilities:

| File | Responsibility |
| --- | --- |
| `history-api.ts` | Send requests and check the response data |
| `useHistorySessions.ts` | Manage loading, results, errors, and cancellation |
| `history-dates.ts` | Prepare dates and query boundaries |
| `history-bars.ts` | Convert sessions into chart positions |
| `HistoryGantt.tsx` | Render the charts |
| `HistoryScroll.tsx` | Manage horizontal scrolling |

The requests for the three positions can run together using `Promise.all`.

We also use `AbortController` and checks for outdated results.

If the user changes dates quickly, an older response should not replace the result for the latest selection.

### Empty results are not errors

A successful query may return no sessions.

Dates outside the available records still appear as empty chart rows. The interface does not need a warning saying when the database has data.

However, an empty chart only tells us that no lighting record was returned. It does not prove that a real room was dark.

A failed request is different. It needs an error message rather than an empty chart that looks successful.

## 49. Turning lighting sessions into bars

A lighting session has a start time and a last-seen time.

To draw it on a daily chart, we calculate:

- Where the bar starts within that day.
- How much of the day the bar covers.

These values become percentages of the timeline width.

If a session crosses midnight, each daily chart shows only the part belonging to that date.

Very short sessions receive a minimum visible width so they can still be noticed.

That minimum width is a display choice. It does not change the recorded timestamps.

I also learned that `last_seen_at` is the time of the last heartbeat. It is not an exact measurement of when someone released a switch.

The chart should not silently invent more precise data than the backend provides.

## 50. Making zoom useful

At first, zoom made the chart wider, but the time labels were too far apart.

A user could see a bar without knowing which time it represented.

We changed the time ticks so they become more detailed as the chart zooms in:

| Zoom | Time between ticks |
| --- | --- |
| 1× | 4 hours |
| 2× | 2 hours |
| 4× | 1 hour |
| 8× | 30 minutes |
| 16× | 15 minutes |

We also removed the record-count message. It was less useful than the controls.

The zoom and date-order buttons now sit together on a separate row, aligned to the left.

I learned that a feature can work technically and still be difficult to use.

Zoom needs enough time labels and position information to help the user understand the enlarged view.

## 51. Keeping scrolling visible and stable

The browser’s horizontal scrollbar could disappear until it was used.

We added a visible horizontal range control above each chart and a label showing the visible time range.

We hid the lower native scrollbar so there would not be two competing controls.

The top control and the chart’s actual scroll position stay connected.

### Preserving position during zoom

Changing zoom originally moved the user away from the part they were examining.

We now remember the relative position within the available horizontal scroll range.

After zoom changes, we restore the corresponding position.

This preserves the relative scrolling position. It is not the same as pinning one exact timestamp under the pointer.

This work introduced several browser and React tools:

| Tool | Why we used it |
| --- | --- |
| `useRef` | Remember the scroll ratio and access the viewport |
| `useLayoutEffect` | Adjust the layout before the browser paints |
| `ResizeObserver` | Detect changes to the available size |
| `requestAnimationFrame` | Schedule measurements with browser rendering |

I learned that zoom and scrolling must be designed together.

## 52. Giving Morse its own panel

We originally planned to place Morse searching beside History.

Later, I decided it needed its own panel.

The intended learning layout is:

- Bulbs collapsed.
- House collapsed, with its hold-to-light buttons.
- History half open, showing live feedback.
- Morse half open, showing instructions.

The user can read the guide, press a House button, and watch the signal appear in History.

This gives each panel a clear role.

We moved `MorseGuide.tsx` from `house/` to `morse/`.

Morse text now lives in `morse-text.ts`, while `Language` remains a shared type in `i18n.ts`.

We also changed the guide’s wording from “click once, then click again” to “hold, then release.”

Moving a component is not only a file operation. Its instructions must still match how the feature works.

The guide and A–Z reference are available now. A more direct SOS walkthrough and the historical message search are still unfinished.

## 53. Replacing the fixed transition table

With four panels, the old table of layout combinations became less convenient.

We replaced it with an array:

```tsx
const [openPanels, setOpenPanels] = useState<PanelId[]>([2, 3]);
```

The array records both:

- Which panels are open.
- Which one was opened earlier.

When a third panel opens, the earlier-opened panel closes.

For example:

```text
[2, 3] → open 4 → [3, 4]
```

The display order still stays Bulbs, House, History, Morse. The array’s order tracks opening history, not screen position.

When two panels are open, either one can close normally.

When only one is open, clicking Collapse opens a dialog asking which other panel should open next.

Cancelling leaves the current layout and lights unchanged.

We calculate the next layout first, then stop House’s lights only if House is actually going to close.

## 54. Extending the shared dialog

The dialog now supports three actions:

| Action | Result |
| --- | --- |
| `ask()` | `true` or `false` |
| `inform()` | A boolean when the dialog finishes |
| `choose()` | The selected string, or `null` when cancelled |

Each choice has:

- `value`: the value used by the program.
- `label`: the text displayed to the user.

The dialog uses a `kind` field to decide which buttons to render.

This is an example of a TypeScript union: different dialog kinds can carry different information.

The existing confirmation and notification functions remain available.

### Placing AppContent inside the Provider

AppContent needs to call `useDialog()` for panel switching.

We therefore separated the structure:

```text
App
  DialogProvider
    AppContent
```

App owns the language state and passes it down.

A component using Context must be inside the matching Provider.

During this change, I accidentally kept another `language` state declaration inside AppContent. TypeScript reported a duplicate identifier.

The fix was to remove the duplicate state and use the language received through props.

I learned to decide where a value is owned before adding another copy of it.

## 55. Finding a CSS conflict

After moving the Morse guides, the full-width House image became very small and stayed on the left.

The rotation worked correctly. The size did not.

The cause was an old three-column layout still inside `App.css`.

That rule reserved columns for:

1. The alphabet guide.
2. The house.
3. The instructions.

The guides were gone, but their old layout rule remained.

We initially added replacement rules in `HousePanel.css`. However, the old rule used the same selector and could win because of stylesheet order.

The final fix was to remove the obsolete rule.

We also removed old House and Morse styles from `App.css`.

The responsibilities are now clearer:

| File | Responsibility |
| --- | --- |
| `App.css` | Page shell and folding panels |
| `HousePanel.css` | House drawing and light controls |
| `MorseGuide.css` | Morse learning content |

I learned that CSS from different files still participates in the same page.

Putting a rule in a component’s CSS file does not automatically isolate it.

Before adding another override, I should search for existing rules using the same class.

## 56. Adding the front and back gardens

With the guides moved, the full-width House had room for a more natural setting.

We added two generated image assets:

```text
src/assets/front_garden.png
src/assets/back_garden.png
```

The current arrangement is:

- Front garden on the left.
- House in the center, with its entrance on the left.
- Back garden on the right.

The gardens appear only when House is fully expanded.

The half-width view keeps the portrait floor plan without gardens.

### One shared SVG coordinate system

We placed both gardens inside the existing SVG.

Instead of moving the house and recalculating every switch, we extended the `viewBox` to include space on both sides.

The front garden uses a negative x-coordinate.

A negative coordinate is valid. It means the drawing includes space to the left of the original origin.

The house keeps its original coordinates, and the buttons continue to use the room positions.

`preserveAspectRatio` keeps the images in proportion.

The gardens are decorative, so they use:

```tsx
aria-hidden="true"
pointerEvents="none"
```

They do not become extra controls or intercept the light buttons.

I tested the combined view and confirmed that the gardens, house, and switches displayed correctly.

## 57. Using errors and tests to guide the work

Several errors helped us find incomplete changes.

### Running npm from the wrong directory

Running the frontend commands from the repository root produced an `ENOENT` error because there was no `package.json` there.

The commands belong in:

```bash
cd ~/Life-Flow-of-Light/frontend
npm run build
npm run lint
```

### Leaving obsolete code behind

After adding the fourth panel, the old `transitions` table caused errors:

- It was no longer used.
- Its type expected a fourth panel entry that the old table did not contain.

We removed the old table and its `Layout` type.

We did not add more entries to a structure the application no longer needed.

### Different checks answer different questions

| Check | What it helps verify |
| --- | --- |
| TypeScript/build | Types, imports, and production compilation |
| Lint | Configured code-quality rules |
| Browser testing | Appearance and interaction |
| Network inspection | Requests and responses |
| Database inspection | Stored records |

A successful build cannot tell me whether a floor plan is too small.

A screenshot cannot tell me whether a backend request succeeded.

I need to choose the check that matches the question.

## 58. Current status and next work

The frontend now includes:

- Bulb management and uninstall protection.
- Shared dialogs.
- Four folding panels.
- Expanded House switches and collapsed momentary controls.
- A live lighting timeline.
- Historical Gantt charts grouped by day or position.
- Date validation, zoom, sorting, and visible scrolling controls.
- A separate Morse guide.
- A full-width House scene with front and back gardens.

The Morse search is not connected yet.

The planned search will include:

- Its own date and time range, including seconds.
- A Find button.
- Conversion from local input to backend timestamps.
- Results showing Local Time, Position, and Message.
- Full start and end times for each message.
- A control for reversing time order.
- Column headings that remain visible when there is no data.

History also does not yet automatically refresh its fetched records whenever a new live signal is created. The live strip and historical query have different jobs.

Before calling the whole PoC finished, I still need to test the complete flow from sending a Morse message to finding it in the stored history.

## 59. What I learned from this stage

I am learning to think about more than the next line of code.

I now ask:

- Who owns this state?
- Is this live information or a stored record?
- Should this value be saved, or calculated from existing state?
- Can an older request overwrite a newer result?
- Does the instruction match the actual control?
- Is an old CSS rule still affecting the screen?
- Did I remove the old implementation after replacing it?
- Can the user understand what happened without reading the code?

Some of the most useful changes came from trying the interface myself.

I noticed that warnings stayed too long, scrollbars were hard to find, zoom moved me away from the record, and Morse teaching was in the wrong place.

These observations became requirements, then code changes, then another round of testing.

I do not understand every part immediately. These notes help me return to the reasons behind the code.

The project is becoming something I can use, question, and improve—not only something I can build.

可以。原本的筆記寫到 **第 59 節**，下面可以直接接在檔案最後。這次同樣用簡單英文，記錄我們完成了什麼、為什麼這樣設計，以及實際操作時發現的問題。

---

## 60. Progress update — 1–3 November 2026

The Morse panel now includes message searching and four lessons.

The earlier sections describe the stage before these features were connected.

Since then, we have added:

- Date and time inputs, including seconds.
- A Find button and shared validation dialog.
- Search results with message times, positions, and bulbs.
- Reversible time sorting.
- Adjustable table columns.
- Different layouts for lessons and search results.
- Four lessons with step-by-step sending instructions.
- More forgiving Morse timing rules.

I tested the interface in English and Traditional Chinese.

During practice, we also used real lighting records to investigate why some messages did not match what I intended to send.

This taught me that a working interface, a successful build, and a correctly decoded message are different things to verify.

## 61. Improving the History tooltip

Before continuing with Morse, we improved the tooltip on each historical lighting bar.

A position tells us where a signal happened. A bulb tells us which device produced it.

These are different pieces of information.

For example, two different bulbs may have been installed in the same room at different times.

The tooltip now includes:

- The bulb label.
- The position recorded in the lighting session.
- The start and last-seen times.

The lighting session keeps its `bulb_id`, allowing the interface to connect the record to the bulb.

This explains why the application protects bulbs that already have history from deletion.

### Current names and historical positions

The displayed bulb name comes from the bulb information available now.

The position comes from the historical lighting session.

Therefore, renaming a bulb may change the label displayed for its older records. This does not mean that the old record changed rooms.

I learned to ask whether a displayed value describes the present or the past.

## 62. Separating Morse responsibilities

Morse has its own interface and teaching content.

The main responsibilities are:

| Part | Responsibility |
| --- | --- |
| `MorsePanel.tsx` | Search controls, results, sorting, and layout state |
| `MorsePanel.css` | Panel, table, and lesson presentation |
| `MorseLessons.tsx` | Lesson content and lesson buttons |
| `morse-text.ts` | English and Traditional Chinese text |
| Backend Morse decoder | Interpret recorded signals |

Keeping the text in `morse-text.ts` makes it easier to compare translations.

Keeping the lessons in a separate component makes the search component easier to read.

The frontend explains how to send a message. The backend decides what the recorded signals mean.

Those two parts must follow compatible timing rules.

## 63. Designing three Morse layouts

The Morse panel has different responsibilities depending on its available space.

### Collapsed

The collapsed panel provides a short timing reminder:

| Meaning | Intended duration |
| --- | --- |
| Dot | Hold for 2 seconds |
| Dash | Hold for 6 seconds |
| Between signals in one letter | Release for 2 seconds |
| Between letters in one word | Release for 6 seconds |
| Between words | Release for 14 seconds |

### Half-width

The search controls stay at the top.

The result table uses the available middle space.

The four lesson buttons stay together at the bottom.

Opening a lesson gives its content approximately half the panel height. The result area becomes smaller, while the search controls remain in place.

Only one lesson can be open at a time.

### Full-width

When a lesson is open:

- The lesson occupies the left side.
- Search controls and results occupy the right side.

When no lesson is open, the search area can use the full width.

We changed this after noticing that an empty left half wasted useful space.

I learned that a layout should respond to the content that is actually visible.

## 64. Representing lesson selection with state

We represent the selected lesson with one value:

```tsx
type LessonId = 1 | 2 | 3 | 4;

const [activeLesson, setActiveLesson] =
  useState<LessonId | null>(null);
```

The number identifies the open lesson.

`null` means that no lesson is open.

This naturally prevents two lessons from being open together.

Clicking a different lesson replaces the selected value. Clicking the selected lesson closes it.

When entering the full-width layout, Lesson 1 opens if no lesson was already selected.

However, the user can still close that lesson afterward and give the search area more space.

I learned that a default selection is not the same as a permanent restriction.

## 65. Moving validation to the Find action

At first, Morse checked the range whenever a date input changed.

This interrupted typing.

For example, changing the month could temporarily make From later than To, even though I had not finished editing.

History and Morse need different validation behavior:

| Panel | When a search starts | When to validate |
| --- | --- | --- |
| History | After a date change | Before accepting the new range |
| Morse | After pressing Find | Before sending the search request |

Morse inputs now allow intermediate edits.

Pressing Find checks that:

- Both dates and times are complete and valid.
- To is at least one minute after From.

The minimum interval is:

```ts
60 * 1000
```

JavaScript timestamps use milliseconds, so one minute is 60,000 milliseconds.

If validation fails, the shared dialog explains the problem and the search does not run.

The user can then correct the inputs.

I learned that validation should happen at a useful moment, rather than interrupting every step of an unfinished action.

## 66. Understanding local time and timestamps

The Morse inputs display local dates and times.

The frontend converts a complete local input into an epoch timestamp before sending it to the backend.

Conceptually:

```ts
const timestamp = new Date(localInput).getTime();
```

An epoch timestamp represents an exact instant as milliseconds since the Unix epoch.

It does not contain a timezone label.

The frontend also formats returned timestamps into local time for display.

The flow is:

1. The user chooses a local date and time.
2. The frontend converts it to a timestamp.
3. The backend compares it with stored timestamps.
4. The frontend formats the returned times for the user.

We do not manually subtract eight hours.

Doing that after the conversion would shift the time again.

The interface language and timezone are also separate. Switching to English changes labels and formatting choices; it does not turn local time into UTC.

## 67. Searching across the three positions

The Morse API accepts a position and a time range.

The frontend searches the three positions and combines their returned messages.

Each result includes:

- `start_time`
- `end_time`
- `message`
- `bulb_id`
- `position`

The bulb ID connects the message to its source device.

The position identifies where that recorded message happened.

The interface distinguishes several states:

| State | Meaning |
| --- | --- |
| Not searched | No search has been completed yet |
| Loading | Requests are still running |
| Success with results | Messages were found |
| Success without results | No matching messages were returned |
| Error | The search could not be completed |

“No data” should not hide a request failure.

Likewise, one failed position request should not silently produce a result that looks complete.

## 68. Updating tests when the response changes

Adding `bulb_id` and `position` changed the API response shape.

Some existing tests still expected only the message and its timestamps.

The tests failed because the actual objects contained additional fields.

A deep equality assertion compares the complete structure of an object.

It does not simply check that a few expected fields are present.

We updated the expected results to include the intended source information.

After those changes, the backend reported:

- 41 tests passed.
- 0 tests failed.
- The TypeScript build succeeded.

This result belongs to that stage of the work. Later timing changes require their own checks.

I learned not to update a test merely to make it pass.

First, I need to decide whether the changed behavior is intentional and correct.

## 69. Making the result table easier to read

The original table gave too much room to the time column.

We wanted Message to receive more space, especially when all four columns were visible.

We also changed the displayed time range.

For a message beginning and ending on the same local date:

```text
01/11/2026 15:09:18
→ 15:10:32
```

If the message crosses into another date, the end date must also be shown.

The exact date order may depend on the selected formatting language.

We compare the local year, month, and day to decide whether both timestamps belong to the same local date.

Comparing only the day number would be incorrect. Two different months can both contain a day numbered 1.

## 70. Hiding columns without losing information

When the result table is narrow, it shows:

- Local time.
- Message.

When Morse is full-width with no lesson open, it also shows:

- Position.
- Bulb.

Hiding a column changes the presentation, not the returned data.

The source information remains available in the result objects and is also provided through hover text on the message.

This follows the same idea used earlier for the Bulbs serial-number column.

I learned that every available field does not need to remain visible in every layout.

## 71. Allowing manual column resizing

We added draggable separators to the table headers.

Dragging changes the selected column’s width.

The resize interaction remembers:

- Which column is being resized.
- Where the pointer started.
- The column’s starting width.
- Its minimum permitted width.

The new width comes from the pointer’s horizontal movement.

Pointer capture helps the drag continue when the pointer moves outside the narrow separator.

Keyboard controls also allow width adjustments.

### Minimum widths

The minimum width is based on the English column heading, with room for padding and relevant controls.

This prevents a column from becoming too narrow to identify.

If the minimum widths together exceed the table container, horizontal scrolling is necessary.

For example, a container cannot display 500 pixels of minimum-width columns inside 400 pixels without either overflowing or breaking those minimum widths.

We chose scrolling instead of crushing the headings.

### Resetting widths

Custom widths are temporary.

Collapsing Morse resets them, so reopening the panel starts with the default widths.

I learned that remembering a setting forever is not always helpful. The correct lifetime depends on how the user expects the feature to behave.

## 72. Responding to the panel’s width

The lesson buttons became cramped when the browser window narrowed.

Even a “full-width” Morse panel can be small because the other collapsed panels still occupy space.

We therefore used a container query.

A media query responds to the browser viewport.

A container query responds to the size of a particular containing element.

When Morse becomes too narrow for the side-by-side layout:

- The search area moves above the lesson area.
- The lesson buttons use the bottom row.
- The buttons remain on one line.
- That row can scroll horizontally if necessary.

This makes the layout depend on the space Morse actually receives.

## 73. Diagnosing the layout that shrank upward

One attempted responsive change caused the content to occupy only the upper part of the panel.

The container query was active, but some older rules still controlled the child positions.

The grid’s row arrangement changed while the children remained in their earlier row.

The result was unused space below them.

The problem involved CSS specificity.

For example:

```css
.morse-panel.is-full.has-lesson
```

is more specific than:

```css
.morse-panel.is-full
```

A later rule does not automatically override a more specific earlier rule.

We corrected the responsive rules for both situations:

- Full-width with a lesson.
- Full-width without a lesson.

We also explicitly placed search in the first row and lessons in the second row.

I tested the corrected layout and confirmed that it behaved as expected.

I learned to check both the grid container and its children when a layout looks wrong.

## 74. Building the four lessons

The lessons move from guided practice toward independent use.

| Lesson | Goal |
| --- | --- |
| Lesson 1 | Send SOS with detailed instructions |
| Lesson 2 | Practise other letters using the A–Z reference |
| Lesson 3 | Send “I CAN USE MORSE CODE” |
| Lesson 4 | Compose a message independently |

The instructions explain how to:

1. Collapse House to use the momentary buttons.
2. Choose a position with an installed bulb.
3. Use the same bulb for the whole message.
4. Watch the live timeline.
5. Hold and release for the required durations.
6. Wait for the message to finish.
7. Search for the stored result.

Lesson 4 currently explains that the decoder supports English letters and spaces.

Numbers and punctuation still need decoder support and tests before the interface can promise that they work.

## 75. Reusing instructions instead of writing every action by hand

Lesson 1 and Lesson 3 use the same `SignalActions` component.

The component receives a message and looks up each letter’s Morse pattern.

It then generates the actions:

- A dot becomes a 2-second hold.
- A dash becomes a 6-second hold.
- Another signal in the same letter requires a 2-second release.
- Another letter requires a 6-second release.
- Another word requires a 14-second release.
- The final signal is followed by the message-completion wait.

This avoids maintaining separate handwritten instructions for every occurrence of a letter.

Fixing the shared component also fixes both lessons.

### Gaps replace one another

The pauses must not be added together.

After the last signal of a letter, release for 6 seconds before the next letter.

Do not release for 2 seconds and then add another 6 seconds.

At a word boundary, use the 14-second gap instead.

This was an important detail to explain clearly in the lessons.

## 76. Why the live strip is not an exact stopwatch

During practice, I saw three short groups of gold cells but did not receive the expected S.

The live strip marks a cell gold if light was observed during any part of that second.

A gold cell does not necessarily mean the light stayed on for the entire second.

For example, a short pulse crossing a one-second boundary can appear in two cells.

The backend works from heartbeat timestamps, not from the number of gold cells.

The decoder estimates the end of a pulse using:

```text
last_seen_at + 200 milliseconds
```

That is an estimate based on the intended heartbeat interval.

It is not an exact measurement of the release action.

I learned that a visual summary and the underlying measurements can have different levels of precision.

## 77. Inspecting real records with curl

When browser-console input was inconvenient, we used `curl` in the Linux terminal.

The request went directly to:

```text
http://127.0.0.1:3000/light-sessions
```

The query included:

- Position.
- Start timestamp.
- End timestamp.

The returned sessions showed their `started_at` and `last_seen_at` values.

From those values, we calculated:

```text
Estimated pulse length =
last_seen_at + heartbeat interval - started_at
```

And between consecutive pulses:

```text
Estimated release gap =
next started_at - previous estimated end
```

This helped us separate several possible causes:

- Looking at an older search result.
- Searching the wrong time range.
- Pulses outside the accepted timing range.
- Gaps interpreted as letter boundaries.

I learned to compare the timestamps before assuming that a displayed result belongs to the latest attempt.

## 78. Making timing more forgiving

The first timing rules were too strict for some of my short manual signals.

One real attempt at S contained estimated pulse lengths of approximately:

- 1.403 seconds.
- 1.605 seconds.
- 1.199 seconds.

Its estimated gaps were approximately 2.605 and 3.056 seconds.

We adjusted the decoder’s timing tolerance.

The revised ranges are:

| Meaning | Accepted duration |
| --- | --- |
| Dot or gap within a letter | 0.8–3.2 seconds |
| Dash or gap between letters | 4.8–7.2 seconds |
| Gap between words | 12.8–15.2 seconds |

The teaching targets remain 2, 6, and 14 seconds.

The tolerance helps interpret imperfect input. It does not change the recorded timestamps.

The ranges still leave ambiguous durations unaccepted rather than forcing every duration into a category.

The message-completion threshold remains separate. The lessons tell the user to wait at least 18 seconds after the final signal before searching.

We also prepared boundary checks and a regression test using the real S attempt.

A regression test keeps a known example so a later change does not accidentally break it again.

## 79. Understanding why O became TTT

Another practice attempt produced TTT instead of O.

The three estimated holds were:

- 6.006 seconds.
- 5.600 seconds.
- 5.806 seconds.

These were all valid dashes.

However, the estimated release gaps were:

- 6.845 seconds.
- 7.177 seconds.

Those gaps separated letters.

Therefore, the decoder read three separate one-dash letters:

```text
T T T
```

To send O, the three dashes must stay within one letter:

```text
Hold 6 seconds
Release 2 seconds
Hold 6 seconds
Release 2 seconds
Hold 6 seconds
```

I realized that I had misread the required pause.

We did not need another decoder change for this example.

I learned that Morse depends on both the light and the silence.

The gaps carry meaning too.

## 80. Making the teaching text visually clear

The A–Z reference made B and S look confusingly similar.

Their actual patterns are different:

| Letter | Pattern |
| --- | --- |
| B | − · · · |
| S | · · · |

The first dash of B was too close to the letter label.

We added space between the letter and its code, increased the code size, and separated the symbols.

The relevant CSS concepts are:

| Property | Purpose |
| --- | --- |
| `display: flex` | Place the letter and code beside each other |
| `gap` | Separate the letter from the code |
| `flex: 0 0 24px` | Reserve a consistent width for the letter |
| `font-family: monospace` | Use consistent character widths |
| `letter-spacing` | Separate the code symbols |
| `white-space: nowrap` | Keep one code pattern together |

We also prepared the same treatment for the letter headings in Lessons 1 and 3.

Because both lessons use `SignalActions`, one shared style can improve both.

### Explicit line breaks

I also wanted each timing sentence on its own line.

We added `\n` to the translation strings and used:

```css
.morse-timing-lines {
  white-space: pre-line;
}
```

A newline in a JavaScript string does not normally become a visible line break in HTML text.

The CSS tells the browser to preserve those breaks while still allowing normal wrapping.

## 81. Verification and remaining work

During this stage, I confirmed several interface changes through manual testing:

- English and Traditional Chinese displays.
- Search-range validation.
- Half-width and full-width layouts.
- Result-table resizing.
- Responsive lesson placement.
- The corrected layout after the CSS conflict.

The backend’s 41-test suite and build passed after adding source fields to the Morse results.

Later, real practice showed that the revised decoder recognized the previously rejected S.

These are separate pieces of evidence, collected at different points in development.

Before release, I should run the checks again against the final code.

From `frontend/`:

```bash
npm run build
npm run lint
```

From `backend/`:

```bash
npm test
npm run build
```

Remaining checks include:

- Practising the complete lesson flow.
- Confirming the latest lesson-spacing changes in the browser.
- Checking messages that cross midnight.
- Checking empty results and failed requests.
- Confirming column widths reset after collapsing Morse.
- Keeping the teaching text consistent with supported characters.

Punctuation and number support remain future work.

## 82. What I learned from this stage

I learned that completing a feature includes more than connecting its API.

The user needs to understand:

- What to do.
- When to do it.
- What the application recorded.
- Why the result appeared.

I also learned to investigate problems in smaller steps.

When a message looks wrong, I can check the selected range, source bulb, timestamps, pulse lengths, gaps, and decoder rules.

When a layout looks wrong, I can check the available width, grid positions, matching selectors, and CSS specificity.

Not every unexpected result needs a code change.

Sometimes the implementation is wrong. Sometimes the instructions are unclear. Sometimes I am looking at an older result or using the wrong pause.

The useful next step is to gather enough evidence to tell those situations apart.

These notes help me keep both the implementation and the reasons behind it understandable when I return later.
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
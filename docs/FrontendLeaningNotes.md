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
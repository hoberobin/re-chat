# re:chat

A logic puzzle game where you reconstruct conversations by reordering chat messages into their correct chronological sequence. Put the messages in order based on conversational tone and constraints.

## Overview

re:chat presents scrambled chat messages and asks you to drag or reorder them into the correct order. Use the hints (when available), pay attention to tone and context, and avoid wrong guesses—you get 3 strikes before you're out.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## How to Play

1. **Reorder messages** – Drag messages or use the up/down arrows to move them. Put the conversation in chronological order.
2. **Check Answer** – Click "Check Answer" to see if your order is correct.
3. **3 Strikes** – Each wrong check adds a strike. At 3 strikes, you're out. Use "Try again" (same puzzle, reset) or "New puzzle" to continue.
4. **Hints** – A lightbulb icon appears in the header when you struggle (after 1 wrong check or ~45 seconds). It glows to draw attention. Click it to show hints in a popover. Use "Another hint" to reveal more. Click the icon again anytime to view hints.
5. **Reset** – Reshuffle the current puzzle and clear strikes without loading a new puzzle.
6. **Incorrect feedback** – Wrong answers show "Wrong order. Try again." near the buttons.

## Conversation Creator

Create custom puzzles at `/create`:

1. **Messages** – Add messages with speaker (A or B) and text.
2. **Correct order** – Use the up/down controls to set the chronological order.
3. **Constraints** – Add hint lines that help solvers infer the order.
4. **Metadata** – Set difficulty (easy/medium/hard), types, tags, and group.
5. **Actions**
   - **Save to localStorage** – Store the puzzle locally.
   - **Preview** – See how it looks as a playable puzzle.
   - **Export JSON** – Download the puzzle as JSON.
   - **Import** – Paste JSON and click "Import from JSON above" to load a puzzle.

Built-in puzzles can be loaded as templates to modify and save as your own.

## Dev Mode and Create (Access Code)

Dev mode and the Create page are gated by an access code:

- **Unlock** – Click the lock icon in the nav bar and enter the code `strawberry`.
- **Create** – The Create link appears in the nav after unlocking.
- **Dev panel** – Collapsible panel in the bottom-right with:
  - **Puzzle selector** – Pick a puzzle by ID; filter by difficulty (easy/medium/hard).
  - **View correct order** – Reveal the solution.
  - **Skip to win** – Mark the puzzle as solved.
  - **Show hints** – Reveal all hints.

## Project Structure

```
src/
├── App.tsx              # Router, layout, nav, dev panel
├── main.tsx
├── index.css
├── context/
│   └── DevToolsContext.tsx
├── types/
│   └── puzzle.ts
├── data/
│   └── puzzles.ts
├── hooks/
│   └── useDevTools.tsx   # Access code + dev panel
├── pages/
│   ├── Play.tsx
│   └── CreatePuzzle.tsx
└── components/
    ├── ArrowUpIcon.tsx
    ├── ArrowDownIcon.tsx
    ├── StrikeIndicator.tsx
    ├── HintIcon.tsx
    └── CodeModal.tsx
```

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router

## License

Private.

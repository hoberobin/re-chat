# Re:Chat

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A daily text mystery: read a group chat, spot the clues, and guess who did it. One puzzle per day, one guess. No sign-up.

## What is Re:Chat?

Re:Chat is a **daily puzzle** built around a text conversation. You read a chat (e.g. friends planning a surprise) and answer a single “who” question—for example, *Who spoiled it?* You get one guess from three names; after you submit, you see whether you got it right and can tap **See why** to read the explanation. New puzzle every day.

The app also includes a **classic mode**: create shareable “reorder the messages” puzzles from a screenshot or by adding messages manually, then share a link for others to solve.

## How to play (daily puzzle)

1. Open the app—you’ll see **today’s puzzle** in the header and a chat thread below.
2. Read the premise (tap the **?** in the header for the full task).
3. Scroll through the chat and use the clues to decide who fits the question.
4. Pick **one** of the three name options (A, B, or C)—that’s your only guess.
5. Submit to see if you were right, the correct answer, and stats. Tap **See why** to reveal the explanation.

## Routes

| Path | Description |
|------|-------------|
| `/` | **Daily puzzle** — today’s text mystery (default home) |
| `/classic` | Classic reorder-the-messages daily puzzle |
| `/create` | Create a shareable reorder puzzle (screenshot or manual) |
| `/practice` | Practice reorder puzzles |
| `/p/:id` | Play a shared puzzle by slug |
| `/embed/:id` | Embeddable player for a shared puzzle |

## Create & share (classic reorder puzzles)

1. **Create** — Go to `/create` and either:
   - **Screenshot** — Drop a chat screenshot (iMessage, WhatsApp, etc.). OCR extracts the text into messages. Edit if needed.
   - **Add manually** — Add messages one by one with speaker and text.

2. **Set order** — Confirm or reorder the messages. This is the sequence solvers must find.

3. **Add hints** (optional) — Hints unlock when solvers are stuck.

4. **Publish** — Click “Create & get link”. Copy the share link or embed code.

- **Share link:** `https://yoursite.com/p/abc123xyz`
- **Embed:** `<iframe src="https://yoursite.com/embed/abc123xyz" width="400" height="500" frameborder="0"></iframe>`

## How to play (classic reorder mode)

1. **Reorder** — Drag messages or use up/down arrows to put the conversation in chronological order.
2. **Check answer** — Submit to see if your order is correct.
3. **3 strikes** — Wrong guesses add strikes; at 3 you’re out. Use “Try again” to reset.
4. **Hints** — Use the lightbulb when stuck.

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Development

**Option A – Run everything together (recommended):**

```bash
npm run dev:all
```

This starts the API server and the Vite dev server. Open [http://localhost:5173](http://localhost:5173).

**Option B – Run separately:**

```bash
# Terminal 1 – API server
npm run server

# Terminal 2 – Frontend
npm run dev
```

### Seeding the daily puzzle

With the server running:

```bash
npm run seed
```

This seeds the database with the built-in daily puzzles (today and tomorrow). The API serves the puzzle whose `date` matches today (or the most recent dated puzzle).

### Build & production

```bash
npm run build
NODE_ENV=production npm run server
```

The server serves the built client and the API. Deploy to Railway, Render, Fly.io, etc. Persist the `server/data/` directory for the SQLite database.

## Project structure

```
re-chat/
├── src/                 # React app
│   ├── api/             # API client (daily puzzle, create, get puzzle)
│   ├── pages/           # DailyPuzzle, Landing (classic), Create, Play, Practice, PuzzleBySlug
│   ├── utils/           # chatColors, parseChatText (OCR-friendly)
│   └── components/      # ChatThread, AnswerOptions, ResultReveal, etc.
├── server/              # Express + SQLite API
│   ├── index.js         # GET /api/daily, POST /api/daily/result, puzzle CRUD, seed
│   ├── seed.js          # Seed script for daily puzzles
│   └── data/            # puzzles.db (gitignored)
└── package.json
```

## Tech stack

- React 19, TypeScript, Vite
- Express, sql.js (SQLite), nanoid
- Tesseract.js for screenshot OCR (create flow)

## Contributing

Contributions are welcome. Open an issue or submit a pull request.

## License

MIT. See [LICENSE](LICENSE).

# Re:Chat

A daily puzzle built around a text conversation. Read a chat, pick up on the clues, and answer one question — one guess, no sign-up, new puzzle every day.

---

## How it works

Each puzzle presents a realistic-looking chat thread and asks you a multiple-choice question about it. The question can be anything: *who started the argument*, *what was actually planned*, *why did someone go quiet* — whatever fits the conversation. You pick from three options (A, B, or C). One try. Then you see whether you got it right, the correct answer, and an explanation.

Puzzles can optionally hide (redact) one or more messages as an extra layer of mystery, but it's not required — the conversation itself is always the primary clue source.

---

## Puzzle format

Each puzzle has:

| Field | Description |
|---|---|
| **Chat name** | The name shown in the chat header (e.g. *"Maya's Bday 🎂"*) |
| **Title** | Internal name used in the admin list |
| **Premise** | Setup and question shown to the player. The last sentence (the actual question) is shown bold. |
| **Messages** | The chat thread — each has a sender, text, optional timestamp, and an optional "hide content" flag |
| **Options** | Three answer choices (A, B, C) — can be names, phrases, anything |
| **Correct answer** | Which option index (0–2) is correct |
| **Explanation** | Revealed after the player submits — explains the reasoning |

---

## Getting started

**Prerequisites:** Node.js 18+, npm

**First-time setup** (from the repo root):

```bash
npm install
npm run seed
npm run dev:all
```

Copy `.env.example` to `.env` and adjust if needed (optional for local dev).

### Run in development

```bash
npm run dev:all
```

Starts both the API server (`localhost:3001`) and the Vite frontend (`localhost:5173`). **Use this so the game can load the daily puzzle** — the frontend needs the API; if you only run `npm run dev`, you’ll get 404 on `/api/daily`.

Or run them separately:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

**If you see 404 on `/api/daily`:** the backend isn’t running. Start it with `npm run server` (or use `npm run dev:all`).

### Seed starter puzzles

No server required. From the repo root:

```bash
npm run seed
```

Creates or overwrites `server/data/puzzles.db` with two sample puzzles — one dated today, one tomorrow. Edit `server/seed.js` to add your own puzzles, then re-run. The server loads puzzles from this SQLite database.

### Build for production

```bash
npm run build
NODE_ENV=production npm run server
```

Then open **http://localhost:3001** — the server serves both the static frontend and the API from the same origin.

To preview the built app locally, run **`npm run preview:all`** (server + Vite preview); open the preview URL and ensure the server is running so `/api` is proxied.

---

## Deploy

1. **Build:** `npm run build`
2. **Run the Node server** with `NODE_ENV=production` and `PORT` set (e.g. `PORT=3001`).
3. **Persist `server/data/`** so `puzzles.db` is kept across restarts (Railway, Render, Fly.io, etc. support persistent disks or volumes).
4. **Optional:** Set `ADMIN_SECRET` in the server environment to enable production puzzle CRUD via `Authorization: Bearer <ADMIN_SECRET>` or `X-Admin-Secret`.
5. Point your host at the **Node process** (not only the static build). Platforms like Railway, Render, and Fly.io can run the Node server and serve the app.

**Health check:** `GET /api/health` returns `{ "status": "ok", "db": "ok" }` when the server and database are ready.

---

## Creating puzzles

Puzzle creation is available in **dev mode** (with `VITE_DEV_MODE=true`) or in **production** when you set an admin secret.

**Dev:** Set `VITE_DEV_MODE=true` in `.env`. This adds a **Puzzle** link and the admin dashboard at `/puzzle`.

**Production:** Set `ADMIN_SECRET` in the server environment. Then send that value on admin API requests via the `Authorization: Bearer <ADMIN_SECRET>` header or `X-Admin-Secret: <ADMIN_SECRET>`. The frontend does not send this by default; use it for scripts or a separate admin tool, or add a simple login that sends the header.

From the admin dashboard you can:

- **Create** a new puzzle at `/puzzle/new` — live preview updates as you type
- **Generate with AI**: On the create form, enter a topic (e.g. "friends planning a surprise party, one spoiled it") and click **Generate with AI** to fill the puzzle fields via OpenAI. Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`, default `gpt-4o-mini`) in your environment. You can edit the result before saving.
- **Edit** an existing puzzle at `/puzzle/:id`
- **Delete** a puzzle from the edit screen

The editor includes a side-by-side live preview of exactly how the puzzle will look to players.

**The "Hide message content" toggle** on each message blacks out that message's text for players. Use it to add mystery — it's optional and not required for the puzzle to work.

**Scheduling:** Each puzzle has a **date** (YYYY-MM-DD). The API serves the puzzle whose date matches today, falling back to the most recent dated puzzle if none matches. To publish a puzzle for a given day, create or edit it and set its date to that day. Only one puzzle per day is used; if multiple share a date, the API picks one deterministically.

---

## Routes

| Path | Description |
|---|---|
| `/` | Daily puzzle (home) |
| `/puzzle` | Admin puzzle list *(dev mode only)* |
| `/puzzle/new` | Create a new puzzle *(dev mode only)* |
| `/puzzle/:id` | Edit a puzzle *(dev mode only)* |

---

## Project structure

```
re-chat/
├── src/
│   ├── api/
│   │   └── puzzles.ts          # API client (fetch daily puzzle, submit answer, CRUD)
│   ├── components/
│   │   ├── ChatThread.tsx       # iMessage-style chat bubble renderer
│   │   ├── AnswerOptions.tsx    # A/B/C answer buttons with reveal states
│   │   ├── DailyPuzzleView.tsx  # Composes the full puzzle screen
│   │   ├── ResultReveal.tsx     # Post-answer outcome, explanation, streak, countdown
│   │   └── OnboardingOverlay.tsx # First-time "How to play" sheet
│   ├── pages/
│   │   ├── DailyPuzzle.tsx      # Home page — loads puzzle, manages state
│   │   ├── DailyPuzzleForm.tsx  # Create / edit puzzle (dev mode)
│   │   └── DailyPuzzlesList.tsx # Admin puzzle list (dev mode)
│   ├── types/
│   │   └── puzzle.ts            # TypeScript types (DailyPuzzle, ChatMessage, PuzzleResult, etc.)
│   └── utils/
│       └── chatColors.ts        # Sender color assignment logic
├── server/
│   ├── index.js                 # Express API (daily puzzle, answer submission, CRUD)
│   ├── seed.js                  # Seed script — writes puzzles.db (no server required)
│   └── data/
│       └── puzzles.db           # SQLite database (gitignored)
└── package.json
```

---

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Mantine UI
- **Backend:** Express, SQLite (sql.js), nanoid

---

## License

MIT. See [LICENSE](LICENSE).

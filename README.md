# re:chat

Turn your text chats into shareable puzzle games. Create a re:chat from a screenshot or by adding messages manually, then share one link. No sign-up, easy to embed.

## What is re:chat?

re:chat lets you turn any text conversation into a fun puzzle. Solvers see the messages in random order and must drag them into the correct chronological sequence. Perfect for sharing funny conversations, memorable moments, or inside jokes with friends.

## Create & Share

1. **Create** – Go to `/create` and either:
   - **Screenshot** – Drop a chat screenshot (iMessage, WhatsApp, etc.). OCR extracts the text and parses it into messages. Edit if needed.
   - **Add manually** – Add each message one by one with speaker (A or B) and text.

2. **Set order** – Confirm or reorder the messages. This is the sequence solvers must find.

3. **Add hints** (optional) – Hints help solvers when they’re stuck.

4. **Publish** – Click “Create & get link”. Copy the share link or embed code.

## Share & Embed

- **Share link** – `https://yoursite.com/p/abc123xyz` – send to anyone.
- **Embed** – Use the iframe code to embed a puzzle in a blog, Notion, etc.

```html
<iframe src="https://yoursite.com/embed/abc123xyz" width="400" height="500" frameborder="0"></iframe>
```

## Getting Started

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

### Build & Production

```bash
npm run build
NODE_ENV=production npm run server
```

The server serves the built client and the API. Deploy the whole project to Railway, Render, or Fly.io. Persist the `server/data/` directory for the SQLite database.

## How to Play

1. **Reorder** – Drag messages or use up/down arrows. Put the conversation in chronological order.
2. **Check Answer** – Click to see if your order is correct.
3. **3 Strikes** – Wrong guesses add strikes. At 3, you’re out. Use “Try again” to reset or “New puzzle” for another.
4. **Hints** – A lightbulb icon appears when you’re stuck. Click for hints.

## Project Structure

```
chat'd/
├── src/                 # React app
│   ├── api/             # API client (create, get puzzle)
│   ├── pages/           # Landing, Create, Play, PlayPuzzle, EmbedPuzzle
│   ├── utils/           # parseChatText (OCR-friendly)
│   └── components/
├── server/              # Express + SQLite API
│   ├── index.js
│   └── data/            # puzzles.db (gitignored)
└── package.json
```

## Tech Stack

- React 19, TypeScript, Vite, Tailwind CSS
- Express, sql.js (SQLite), nanoid
- Tesseract.js for screenshot OCR

## License

Private.

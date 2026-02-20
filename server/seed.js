// server/seed.js — seed the database with starter puzzles
// Requires the server to be running: npm run server (or npm run dev:all)
// Then run: npm run seed

const API_URL = process.env.API_URL || "http://localhost:3001";

function getDateString(offsetDays = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const today = getDateString(0);
const tomorrow = getDateString(1);

const puzzles = [
  {
    id: "the-surprise",
    date: today,
    title: "The Surprise",
    premise:
      "You're reading a group chat between four friends planning a surprise party for Maya. One of them already told her. Who spoiled it?",
    chat_name: "Maya's Bday 🎂",
    is_group: true,
    messages: [
      {
        id: 1,
        sender: "Jordan",
        text: "ok so her birthday is friday — who's bringing the cake",
        is_redacted: false,
        timestamp: "11:42 AM",
        show_timestamp: true,
      },
      {
        id: 2,
        sender: "Priya",
        text: "I can grab it from Rosette's, she loves that place",
        is_redacted: false,
        timestamp: "11:43 AM",
        show_timestamp: false,
      },
      {
        id: 3,
        sender: "Tom",
        text: "should we do 7pm? she gets home from work around 6:30",
        is_redacted: false,
        timestamp: "11:44 AM",
        show_timestamp: false,
      },
      {
        id: 4,
        sender: "Jordan",
        text: "perfect. Priya you good to get there early to help set up?",
        is_redacted: false,
        timestamp: "11:45 AM",
        show_timestamp: false,
      },
      {
        id: 5,
        sender: "Priya",
        text: "yeah for sure, I'll come at 6",
        is_redacted: false,
        timestamp: "11:46 AM",
        show_timestamp: false,
      },
      {
        id: 6,
        sender: "Tom",
        text: "should we tell Danny to come or is that still weird after everything",
        is_redacted: false,
        timestamp: "11:48 AM",
        show_timestamp: false,
      },
      {
        id: 7,
        sender: "Jordan",
        text: "ugh let's not. keep it small",
        is_redacted: false,
        timestamp: "11:49 AM",
        show_timestamp: false,
      },
      {
        id: 8,
        sender: "Tom",
        text: "cool. hey does she have any dietary stuff we should know about? like for the cake",
        is_redacted: false,
        timestamp: "11:52 AM",
        show_timestamp: false,
      },
      {
        id: 9,
        sender: "Priya",
        text: "she mentioned last week she's been avoiding dairy lately",
        is_redacted: false,
        timestamp: "11:53 AM",
        show_timestamp: false,
      },
      {
        id: 10,
        sender: "Jordan",
        text: "wait how do you know that",
        is_redacted: false,
        timestamp: "11:53 AM",
        show_timestamp: false,
      },
      {
        id: 11,
        sender: "Priya",
        text: "she texted me about it",
        is_redacted: false,
        timestamp: "11:54 AM",
        show_timestamp: false,
      },
      {
        id: 12,
        sender: "Jordan",
        text: "ok so dairy free cake from Rosette's — do they have that",
        is_redacted: false,
        timestamp: "11:55 AM",
        show_timestamp: false,
      },
      {
        id: 13,
        sender: "Tom",
        text: "I think so, I can check",
        is_redacted: false,
        timestamp: "11:56 AM",
        show_timestamp: false,
      },
      {
        id: 14,
        sender: "Jordan",
        text: "great. see everyone friday 🎉",
        is_redacted: false,
        timestamp: "11:57 AM",
        show_timestamp: false,
      },
    ],
    options: [
      "Jordan — she organized the whole thing",
      "Priya — she knew too much too soon",
      "Tom — he tried to deflect with the Danny question",
    ],
    correct_option_index: 1,
    explanation:
      "Priya knew Maya was avoiding dairy 'from a text last week' — specific knowledge with no obvious source. Jordan's reaction 'wait how do you know that' confirms the suspicion. Tom's confusion throughout is genuine. Priya's alibi is thin.",
  },
  {
    id: "the-interview",
    date: tomorrow,
    title: "The Interview",
    premise:
      "Someone in this chat knows more than they're letting on. One message has been redacted. What did it say?",
    chat_name: "Work Crew 💼",
    is_group: true,
    messages: [
      {
        id: 1,
        sender: "Dani",
        text: "anyone want to grab lunch tomorrow",
        is_redacted: false,
        timestamp: "2:14 PM",
        show_timestamp: true,
      },
      {
        id: 2,
        sender: "Marcus",
        text: "can't, I have some stuff to figure out",
        is_redacted: false,
        timestamp: "2:15 PM",
        show_timestamp: false,
      },
      {
        id: 3,
        sender: "Lena",
        text: "same, swamped over here",
        is_redacted: false,
        timestamp: "2:15 PM",
        show_timestamp: false,
      },
      {
        id: 4,
        sender: "Dani",
        text: "ugh okay fine, next week then",
        is_redacted: false,
        timestamp: "2:16 PM",
        show_timestamp: false,
      },
      {
        id: 5,
        sender: "Lena",
        text: "Marcus are you good? you've been quiet today",
        is_redacted: false,
        timestamp: "2:18 PM",
        show_timestamp: false,
      },
      {
        id: 6,
        sender: "Marcus",
        text: "[REDACTED]",
        is_redacted: true,
        timestamp: "2:19 PM",
        show_timestamp: false,
      },
      {
        id: 7,
        sender: "Dani",
        text: "wait WHAT? since when",
        is_redacted: false,
        timestamp: "2:19 PM",
        show_timestamp: false,
      },
      {
        id: 8,
        sender: "Lena",
        text: "I mean… it's probably for the best, you'll land somewhere good",
        is_redacted: false,
        timestamp: "2:20 PM",
        show_timestamp: false,
      },
      {
        id: 9,
        sender: "Marcus",
        text: "yeah. thanks I guess",
        is_redacted: false,
        timestamp: "2:21 PM",
        show_timestamp: false,
      },
      {
        id: 10,
        sender: "Dani",
        text: "Lena did you know about this??",
        is_redacted: false,
        timestamp: "2:21 PM",
        show_timestamp: false,
      },
      {
        id: 11,
        sender: "Lena",
        text: "I heard something but didn't want to say anything",
        is_redacted: false,
        timestamp: "2:22 PM",
        show_timestamp: false,
      },
      {
        id: 12,
        sender: "Dani",
        text: "that's so messed up, why wouldn't you tell him",
        is_redacted: false,
        timestamp: "2:23 PM",
        show_timestamp: false,
      },
      {
        id: 13,
        sender: "Lena",
        text: "it wasn't my place",
        is_redacted: false,
        timestamp: "2:23 PM",
        show_timestamp: false,
      },
    ],
    options: [
      "I think I'm getting fired",
      "I've just been tired lately, ignore me",
      "Lena already told me everything, it's fine",
    ],
    correct_option_index: 2,
    explanation:
      "Lena's response — 'it's probably for the best' — is too calm and specific for surprise news. She already processed this. Dani immediately asking 'Lena did you know??' only makes sense if Marcus's message implicated her directly. The redacted message didn't just reveal that Marcus knew — it revealed who told him.",
  },
];

async function seed() {
  console.log(`Seeding ${puzzles.length} puzzle(s) to ${API_URL}...`);
  const res = await fetch(`${API_URL}/api/puzzles/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(puzzles),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Seed failed with status ${res.status}`);
  }

  const data = await res.json();
  console.log(`✓ Seeded ${data.inserted} puzzle(s).`);
  console.log(`  Puzzle 1 date: ${today} (today)`);
  console.log(`  Puzzle 2 date: ${tomorrow} (tomorrow)`);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  console.error(
    "Make sure the server is running first: npm run server (or npm run dev:all)"
  );
  process.exit(1);
});

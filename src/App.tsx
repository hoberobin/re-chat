import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  speaker: string;
  text: string;
}

interface Puzzle {
  id: number;
  messages: Message[];
  correctOrder: string[];
  constraints: string[];
}

const puzzles: Puzzle[] = [
  {
    id: 1,
    messages: [
      { id: "m1", speaker: "A", text: "That's not what I meant." },
      { id: "m2", speaker: "B", text: "Then what did you mean?" },
      { id: "m3", speaker: "A", text: "I thought we agreed on this." },
      { id: "m4", speaker: "B", text: "You changed it without telling me." },
    ],
    correctOrder: ["m3", "m4", "m2", "m1"],
    constraints: [
      "Conversation began neutral.",
      "An action caused tension.",
      "Clarification occurred before resolution.",
    ],
  },
  {
    id: 2,
    messages: [
      { id: "m1", speaker: "A", text: "Oh. I didn't see that part." },
      { id: "m2", speaker: "B", text: "It was in the second paragraph." },
      { id: "m3", speaker: "A", text: "I only read the first section." },
      { id: "m4", speaker: "B", text: "That explains it." },
    ],
    correctOrder: ["m3", "m2", "m1", "m4"],
    constraints: [
      "The misunderstanding was informational, not emotional.",
      "Tone remained calm throughout.",
      "Realization occurred before closure.",
    ],
  },
  {
    id: 3,
    messages: [
      { id: "m1", speaker: "A", text: "You sounded upset." },
      { id: "m2", speaker: "B", text: "I wasn't upset." },
      { id: "m3", speaker: "A", text: "You left early." },
      { id: "m4", speaker: "B", text: "I had another call." },
    ],
    correctOrder: ["m3", "m1", "m2", "m4"],
    constraints: [
      "An assumption was made before clarification.",
      "Tone briefly defensive.",
      "Final message resolved the assumption.",
    ],
  },
  {
    id: 4,
    messages: [
      { id: "m1", speaker: "B", text: "It was due yesterday." },
      { id: "m2", speaker: "A", text: "I thought it was today." },
      { id: "m3", speaker: "B", text: "That's why I followed up." },
      { id: "m4", speaker: "A", text: "Okay, I'll send it now." },
    ],
    correctOrder: ["m1", "m2", "m3", "m4"],
    constraints: [
      "Conversation began with correction.",
      "A misunderstanding about timing occurred.",
      "Resolution ended the exchange.",
    ],
  },
  {
    id: 5,
    messages: [
      { id: "m1", speaker: "A", text: "That wasn't the intention." },
      { id: "m2", speaker: "B", text: "It came across that way." },
      { id: "m3", speaker: "A", text: "What did I say?" },
      { id: "m4", speaker: "B", text: "You said it was obvious." },
    ],
    correctOrder: ["m4", "m3", "m2", "m1"],
    constraints: [
      "An interpretation triggered defensiveness.",
      "Clarification was requested before denial.",
      "Tone softened by the end.",
    ],
  },
];

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickRandomPuzzle(): Puzzle {
  return puzzles[Math.floor(Math.random() * puzzles.length)];
}

function initPuzzle(): { puzzle: Puzzle; order: string[] } {
  const puzzle = pickRandomPuzzle();
  const order = shuffle(puzzle.correctOrder);
  return { puzzle, order };
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function App() {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [messageOrder, setMessageOrder] = useState<string[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [showShake, setShowShake] = useState(false);
  const draggedIndexRef = useRef<number | null>(null);
  const isInitialized = useRef(false);

  const loadPuzzle = () => {
    const { puzzle, order } = initPuzzle();
    setCurrentPuzzle(puzzle);
    setMessageOrder(order);
    setIsSolved(false);
    setShowShake(false);
  };

  useEffect(() => {
    if (!isInitialized.current) {
      loadPuzzle();
      isInitialized.current = true;
    }
  }, []);

  const handleReset = () => {
    if (!currentPuzzle) return;
    setMessageOrder(shuffle(currentPuzzle.correctOrder));
    setIsSolved(false);
    setShowShake(false);
  };

  const handleNewPuzzle = () => {
    loadPuzzle();
  };

  const handleCheck = () => {
    if (!currentPuzzle || isSolved) return;
    const correct = currentPuzzle.correctOrder.every(
      (id, i) => id === messageOrder[i]
    );
    if (correct) {
      setIsSolved(true);
    } else {
      setShowShake(true);
      setTimeout(() => setShowShake(false), 500);
    }
  };

  const moveMessage = (index: number, direction: "up" | "down") => {
    if (isSolved) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= messageOrder.length) return;
    setMessageOrder((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isSolved) return;
    draggedIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    const target = e.currentTarget as HTMLElement;
    const bubble = target.querySelector("[data-bubble]") as HTMLElement;
    if (bubble) bubble.style.opacity = "0.6";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    const bubble = target.querySelector("[data-bubble]") as HTMLElement;
    if (bubble) bubble.style.opacity = "1";
    draggedIndexRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = draggedIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex || isSolved) return;
    setMessageOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
    draggedIndexRef.current = null;
  };

  if (!currentPuzzle) return null;

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:py-8 animate-fade-in">
      <div className="w-full max-w-[600px] mx-auto">
        <h1 className="text-3xl sm:text-3xl font-medium text-gray-900 mb-1">
          re:chat
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mb-6">
          Put the messages in order.
        </p>

        <section className="mb-6 rounded-xl bg-gray-50 px-4 py-3">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Hints
          </h2>
          <ul className="text-sm text-gray-600 space-y-1">
            {currentPuzzle.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>

        <p className="text-sm text-gray-500 mb-3">
          Drag or use arrows to reorder. Put the conversation in chronological
          order.
        </p>

        <ul
          className={`flex flex-col gap-3 mb-6 transition-all rounded-xl p-2 -m-2 min-h-[200px] ${
            showShake ? "animate-shake ring-2 ring-red-400 ring-offset-2" : ""
          } ${isSolved ? "ring-2 ring-green-400 ring-offset-2 bg-green-50/50 rounded-xl" : ""}`}
        >
          {messageOrder.map((id, index) => {
            const msg = currentPuzzle.messages.find((m) => m.id === id);
            if (!msg) return null;
            const isSent = msg.speaker === "A";
            return (
              <li
                key={id}
                draggable={!isSolved}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`flex items-center gap-2 w-full group ${
                  !isSolved ? "cursor-grab active:cursor-grabbing" : ""
                } ${isSent ? "justify-end" : ""}`}
              >
                {!isSolved && (
                  <div className="flex flex-col shrink-0 gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => moveMessage(index, "up")}
                      disabled={index === 0}
                      aria-label="Move up"
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                    >
                      <ArrowUpIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMessage(index, "down")}
                      disabled={index === messageOrder.length - 1}
                      aria-label="Move down"
                      className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                    >
                      <ArrowDownIcon className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                )}
                <div
                  data-bubble
                  className={`flex-shrink-0 max-w-[85%] sm:max-w-[280px] px-4 py-3 rounded-2xl text-[15px] leading-relaxed transition-all ${
                    isSent
                      ? "rounded-br-md bg-[#34C759] text-white"
                      : "rounded-bl-md bg-[#E5E5EA] text-gray-900"
                  }`}
                >
                  {msg.text}
                </div>
              </li>
            );
          })}
        </ul>

        {isSolved && (
          <p className="text-green-600 font-medium text-center mb-4">
            You got it.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCheck}
            disabled={isSolved}
            className="min-h-[44px] px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors touch-manipulation"
          >
            Check Answer
          </button>
          <button
            onClick={handleReset}
            className="min-h-[44px] px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors touch-manipulation"
          >
            Reset
          </button>
          <button
            onClick={handleNewPuzzle}
            className="min-h-[44px] px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors touch-manipulation"
          >
            New Puzzle
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

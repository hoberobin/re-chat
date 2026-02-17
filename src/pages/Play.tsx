import { useState, useRef, useEffect } from "react";
import type { Puzzle } from "../types/puzzle";
import {
  shuffle,
  pickRandomPuzzle,
  getPuzzleById,
} from "../data/puzzles";
import { useDevToolsContext } from "../context/DevToolsContext";
import { ArrowUpIcon } from "../components/ArrowUpIcon";
import { ArrowDownIcon } from "../components/ArrowDownIcon";
import { StrikeIndicator } from "../components/StrikeIndicator";
import { HintIcon } from "../components/HintIcon";

const HINT_TIMEOUT_1 = 45;
const HINT_TIMEOUT_2 = 90;
const HINT_TIMEOUT_3 = 120;
const MAX_STRIKES = 3;

interface PlayProps {
  previewPuzzle?: Puzzle;
  onSolved?: () => void;
  /** When true, hide the "re:chat" header (e.g. when embedded in Landing) */
  hideHeader?: boolean;
  /** When true, hide the "You got it" message (e.g. parent shows its own) */
  hideSuccessMessage?: boolean;
}

function initPuzzle(seedId?: string, override?: Puzzle): { puzzle: Puzzle; order: string[] } {
  const puzzle = override
    ? override
    : seedId
      ? getPuzzleById(seedId) ?? pickRandomPuzzle()
      : pickRandomPuzzle();
  const order = shuffle(puzzle.correctOrder);
  return { puzzle, order };
}

export function Play({ previewPuzzle, onSolved, hideHeader, hideSuccessMessage }: PlayProps = {}) {
  const dev = useDevToolsContext();
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [messageOrder, setMessageOrder] = useState<string[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [strikes, setStrikes] = useState(0);
  const [showShake, setShowShake] = useState(false);
  const [hintTier, setHintTier] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [wrongChecks, setWrongChecks] = useState(0);
  const [userHasOpenedHint, setUserHasOpenedHint] = useState(false);
  const draggedIndexRef = useRef<number | null>(null);
  const isInitialized = useRef(false);
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadPuzzle = (seedId?: string, override?: Puzzle) => {
    const { puzzle, order } = initPuzzle(seedId, override);
    setCurrentPuzzle(puzzle);
    setMessageOrder(order);
    setIsSolved(false);
    setGameOver(false);
    setStrikes(0);
    setShowShake(false);
    setHintTier(0);
    setWrongChecks(0);
    setTimeElapsed(0);
  };

  useEffect(() => {
    if (!isInitialized.current) {
      loadPuzzle(dev.seedPuzzleId, previewPuzzle);
      isInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (previewPuzzle) {
      loadPuzzle(undefined, previewPuzzle);
    } else if (dev.seedPuzzleId && currentPuzzle?.id !== dev.seedPuzzleId) {
      loadPuzzle(dev.seedPuzzleId);
    }
  }, [dev.seedPuzzleId, previewPuzzle]);

  useEffect(() => {
    if (dev.forceSkipWin) {
      setIsSolved(true);
      setGameOver(false);
    }
  }, [dev.forceSkipWin]);

  useEffect(() => {
    if (dev.forceShowHints) {
      setHintTier(3);
    }
  }, [dev.forceShowHints]);

  useEffect(() => {
    if (isSolved && onSolved) onSolved();
  }, [isSolved, onSolved]);

  useEffect(() => {
    if (isSolved || gameOver) {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
      return;
    }
    timeIntervalRef.current = setInterval(() => {
      setTimeElapsed((t) => t + 1);
    }, 1000);
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [isSolved, gameOver]);

  useEffect(() => {
    if (wrongChecks >= 1 || timeElapsed >= HINT_TIMEOUT_1) {
      setHintTier((prev) => Math.max(prev, 1));
    }
    if (wrongChecks >= 2 || timeElapsed >= HINT_TIMEOUT_2) {
      setHintTier((prev) => Math.max(prev, 2));
    }
    if (wrongChecks >= 3 || timeElapsed >= HINT_TIMEOUT_3) {
      setHintTier((prev) => Math.max(prev, 3));
    }
  }, [wrongChecks, timeElapsed]);

  const handleReset = () => {
    if (!currentPuzzle) return;
    setMessageOrder(shuffle(currentPuzzle.correctOrder));
    setIsSolved(false);
    setGameOver(false);
    setStrikes(0);
    setShowShake(false);
  };


  const handleTryAgain = () => {
    if (!currentPuzzle) return;
    setMessageOrder(shuffle(currentPuzzle.correctOrder));
    setIsSolved(false);
    setGameOver(false);
    setStrikes(0);
    setShowShake(false);
    setHintTier(0);
    setWrongChecks(0);
    setTimeElapsed(0);
  };

  const handleCheck = () => {
    if (!currentPuzzle || isSolved || gameOver || dev.forceRevealOrder) return;
    const correct = currentPuzzle.correctOrder.every(
      (id, i) => id === messageOrder[i]
    );
    if (correct) {
      setIsSolved(true);
    } else {
      setWrongChecks((c) => c + 1);
      setStrikes((s) => {
        const next = s + 1;
        if (next >= MAX_STRIKES) setGameOver(true);
        return next;
      });
      setShowShake(true);
      setTimeout(() => setShowShake(false), 500);
    }
  };

  const revealHint = () => {
    if (hintTier < 3 && currentPuzzle && currentPuzzle.constraints.length > hintTier) {
      setHintTier((prev) => Math.min(prev + 1, 3));
    }
  };

  const moveMessage = (index: number, direction: "up" | "down") => {
    if (isSolved || gameOver || dev.forceRevealOrder) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= messageOrder.length) return;
    setMessageOrder((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isSolved || gameOver || dev.forceRevealOrder) return;
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
    if (
      dragIndex === null ||
      dragIndex === dropIndex ||
      isSolved ||
      gameOver ||
      dev.forceRevealOrder
    )
      return;
    setMessageOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
    draggedIndexRef.current = null;
  };

  const showHintButton =
    !isSolved &&
    !gameOver &&
    currentPuzzle &&
    currentPuzzle.constraints.length > 0 &&
    (wrongChecks >= 1 || timeElapsed >= HINT_TIMEOUT_1);

  const effectiveHintTier = dev.forceShowHints ? 3 : hintTier;
  const visibleConstraints =
    currentPuzzle && effectiveHintTier > 0
      ? currentPuzzle.constraints.slice(0, effectiveHintTier)
      : [];

  const allHintsShown =
    currentPuzzle && effectiveHintTier >= currentPuzzle.constraints.length;

  const displayOrder =
    dev.forceRevealOrder && currentPuzzle
      ? currentPuzzle.correctOrder
      : messageOrder;

  const canReorder = !isSolved && !gameOver && !dev.forceRevealOrder;

  if (!currentPuzzle) return null;

  return (
    <div className={`w-full flex flex-col items-center animate-fade-in ${hideHeader ? "px-0 py-0" : "px-4 py-6 sm:py-8 min-h-screen justify-center"}`}>
      <div className="w-full max-w-[600px] mx-auto">
        <div className={`flex flex-wrap justify-between items-start gap-4 mb-4 ${hideHeader ? "justify-end" : ""}`}>
          {!hideHeader && (
            <div>
              <h1 className="text-3xl font-medium text-gray-900 mb-1">re:chat</h1>
              <p className="text-sm sm:text-base text-gray-500">
                Put the messages in order.
              </p>
            </div>
          )}
          <div className={`flex flex-row justify-between items-center ${hideHeader ? "w-full" : "flex-1 min-w-0"}`}>
            <StrikeIndicator strikes={strikes} />
            {showHintButton ? (
              <HintIcon
                hints={visibleConstraints}
                onRevealMore={!allHintsShown ? revealHint : undefined}
                isHighlighted={!userHasOpenedHint}
                onOpen={() => setUserHasOpenedHint(true)}
              />
            ) : (
              <div className="w-11 h-11 shrink-0" aria-hidden />
            )}
          </div>
        </div>

        <p className={`text-sm text-gray-500 mb-3 ${hideHeader ? "hidden" : ""}`}>
          Drag or use arrows to reorder. Put the conversation in chronological
          order.
        </p>

        <ul
          className={`flex flex-col transition-all rounded-xl p-2 -m-2 ${
            hideHeader ? "gap-2 mb-4 min-h-[140px]" : "gap-3 mb-6 min-h-[200px]"
          } ${
            isSolved ? "ring-2 ring-green-400 ring-offset-2 bg-green-50/50 rounded-xl" : ""
          } ${gameOver ? "ring-2 ring-red-400 ring-offset-2 bg-red-50/30" : ""} ${
            dev.forceRevealOrder ? "ring-2 ring-blue-400 ring-offset-2" : ""
          }`}
        >
          {displayOrder.map((id, index) => {
            const msg = currentPuzzle.messages.find((m) => m.id === id);
            if (!msg) return null;
            const isSent = msg.speaker === "A";
            return (
              <li
                key={id}
                draggable={canReorder}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`flex items-center gap-2 w-full group ${
                  canReorder ? "cursor-grab active:cursor-grabbing" : ""
                } ${isSent ? "justify-end" : ""}`}
              >
                {canReorder && (
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
                    canReorder ? "hover:shadow-md" : ""
                  } ${
                    isSent
                      ? "rounded-br-md bg-[#007AFF] text-white"
                      : "rounded-bl-md bg-[#E5E5EA] text-gray-900"
                  }`}
                >
                  {msg.text}
                </div>
              </li>
            );
          })}
        </ul>

        {isSolved && !hideSuccessMessage && (
          <p className="text-green-600 font-medium text-center mb-4">
            You got it.
          </p>
        )}

        {gameOver && (
          <div className="text-center mb-4">
            <p className="text-red-600 font-medium mb-3">Out! 3 strikes.</p>
            <button
              onClick={handleTryAgain}
              className="min-h-[44px] px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors touch-manipulation"
            >
              Try again
            </button>
          </div>
        )}

        {!gameOver && (
          <div
            className={`flex flex-col gap-3 ${showShake ? "animate-shake" : ""}`}
          >
            {showShake && (
              <p className="text-sm text-red-600 font-medium text-center">
                Wrong order. Try again.
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
                disabled={isSolved}
                className="min-h-[44px] px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors touch-manipulation"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

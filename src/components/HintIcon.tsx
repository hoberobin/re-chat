import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLightbulb } from "@fortawesome/free-solid-svg-icons";

interface HintIconProps {
  hints: string[];
  onRevealMore?: () => void;
  isHighlighted?: boolean;
  onOpen?: () => void;
}

export function HintIcon({ hints, onRevealMore, isHighlighted, onOpen }: HintIconProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) onOpen?.();
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="View hints"
        className={`w-11 h-11 rounded-full text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-colors touch-manipulation flex items-center justify-center ${isHighlighted ? "hint-glow" : ""}`}
      >
        <FontAwesomeIcon icon={faLightbulb} className="w-5 h-5" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 min-w-[200px] max-w-[280px] rounded-xl bg-white shadow-lg border border-gray-200 py-3 px-4 animate-fade-in"
          role="dialog"
          aria-label="Hints"
        >
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Hints
          </p>
          {hints.length > 0 ? (
            <ul className="text-sm text-gray-600 space-y-1">
              {hints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mb-2">
              Need a hint? Struggling will reveal hints.
            </p>
          )}
          {onRevealMore && (
            <button
              type="button"
              onClick={onRevealMore}
              className="mt-2 text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Another hint
            </button>
          )}
        </div>
      )}
    </div>
  );
}

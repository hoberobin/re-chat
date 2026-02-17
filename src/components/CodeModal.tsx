import { useState } from "react";

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (code: string) => boolean;
}

export function CodeModal({ isOpen, onClose, onUnlock }: CodeModalProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUnlock(input)) {
      setInput("");
      setError(false);
      onClose();
    } else {
      setError(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-medium text-gray-900 mb-2">Enter code</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            placeholder="Code"
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mb-2"
          />
          {error && (
            <p className="text-sm text-red-600 mb-2">Incorrect code.</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 min-h-[44px] px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

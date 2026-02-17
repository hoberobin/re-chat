import { useState } from "react";
import { Link } from "react-router-dom";
import { Play } from "./Play";
import { learningPuzzle } from "../data/puzzles";

export function Landing() {
  const [exampleSolved, setExampleSolved] = useState(false);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-6 sm:py-8">
      <div className="w-full max-w-[520px]">
        {/* Brand + value prop */}
        <div className="text-center mb-5">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">
            re:chat
          </h1>
          <p className="text-sm text-gray-600">
            Turn a chat screenshot into a puzzle. Share one link.
          </p>
        </div>

        {/* Example: one card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-xs font-medium text-[#007AFF] uppercase tracking-wide">
                re:chat
              </span>
              <h2 className="text-base font-medium text-gray-900 mt-0.5">
                Put the messages in order
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Drag or use arrows. Get it right to continue.
              </p>
            </div>
            <Link
              to="/create"
              className="text-xs text-[#007AFF] hover:underline shrink-0"
            >
              Skip →
            </Link>
          </div>

          <Play
            previewPuzzle={learningPuzzle}
            onSolved={() => setExampleSolved(true)}
            hideHeader
            hideSuccessMessage
          />

          {exampleSolved && (
            <div className="mt-4 p-4 rounded-xl bg-green-50 border border-green-100 text-center animate-fade-in">
              <p className="text-green-800 font-medium text-sm">Nice.</p>
              <p className="text-xs text-green-700 mt-1">
                Now create one from your own chat and share it.
              </p>
            </div>
          )}
        </div>

        {/* Create button – outside card so it pops */}
        <Link
          to="/create"
          className="block w-full text-center py-4 px-6 bg-[#007AFF] text-white text-base font-medium rounded-xl hover:bg-[#0066DD] transition-colors shadow-md hover:shadow-lg"
        >
          Create your re:chat
        </Link>
      </div>
    </div>
  );
}

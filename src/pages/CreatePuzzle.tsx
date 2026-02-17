import { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import type { Message } from "../types/puzzle";
import { parseChatText } from "../utils/parseChatText";
import { createPuzzle } from "../api/puzzles";
import { useScreenshotOCR } from "../hooks/useScreenshotOCR";
import { Play } from "./Play";
import { ArrowUpIcon } from "../components/ArrowUpIcon";
import { ArrowDownIcon } from "../components/ArrowDownIcon";

const MIN_MESSAGES = 2;
const MAX_MESSAGES = 30;

function messagesToOrder(msgs: Message[]): string[] {
  return msgs.map((m) => m.id);
}

function parsedToMessages(parsed: { speaker: string; text: string }[]): Message[] {
  return parsed.map((p, i) => ({
    id: `m${i + 1}`,
    speaker: p.speaker,
    text: p.text,
  }));
}

const blankMessage = (i: number): Message => ({
  id: `m${i + 1}`,
  speaker: i % 2 === 0 ? "A" : "B",
  text: "",
});

type Step = 1 | 2 | 3;
type InputMode = "screenshot" | "manual";

export function CreatePuzzle() {
  const [step, setStep] = useState<Step>(1);
  const [inputMode, setInputMode] = useState<InputMode>("screenshot");
  const [messages, setMessages] = useState<Message[]>([]);
  const [correctOrder, setCorrectOrder] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string[]>([""]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [preview, setPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { extractText, loading: ocrLoading, error: ocrError } = useScreenshotOCR();

  // Initialize manual mode with 2 blank messages if empty
  useEffect(() => {
    if (inputMode === "manual" && messages.length < MIN_MESSAGES) {
      const blanks = Array.from({ length: MIN_MESSAGES }, (_, i) => blankMessage(i));
      setMessages(blanks);
      setCorrectOrder(messagesToOrder(blanks));
    }
  }, [inputMode]);

  const updateMessage = useCallback((index: number, field: keyof Message, value: string) => {
    setMessages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const addMessage = useCallback(() => {
    if (messages.length >= MAX_MESSAGES) return;
    const n = messages.length + 1;
    setMessages((prev) => [...prev, blankMessage(prev.length)]);
    setCorrectOrder((prev) => [...prev, `m${n}`]);
  }, [messages.length]);

  const removeMessage = useCallback((index: number) => {
    if (messages.length <= MIN_MESSAGES) return;
    const id = messages[index].id;
    setMessages((prev) => prev.filter((_, i) => i !== index));
    setCorrectOrder((prev) => prev.filter((x) => x !== id));
  }, [messages.length]);

  const moveInOrder = useCallback((index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= correctOrder.length) return;
    setCorrectOrder((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  }, [correctOrder.length]);

  const updateConstraint = useCallback((index: number, value: string) => {
    setConstraints((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const addConstraint = useCallback(() => setConstraints((p) => [...p, ""]), []);

  const handleScreenshotFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      try {
        const text = await extractText(file);
        const parsed = parseChatText(text);
        if (parsed.length >= MIN_MESSAGES) {
          const clamped = parsed.slice(0, MAX_MESSAGES);
          const msgs = parsedToMessages(clamped);
          setMessages(msgs);
          setCorrectOrder(messagesToOrder(msgs));
        } else if (parsed.length > 0) {
          const msgs = parsedToMessages(parsed);
          setMessages(msgs);
          setCorrectOrder(messagesToOrder(msgs));
        }
      } catch {
        // Error already set in hook
      }
    },
    [extractText]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleScreenshotFile(file);
    },
    [handleScreenshotFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleScreenshotFile(file);
      e.target.value = "";
    },
    [handleScreenshotFile]
  );
  const removeConstraint = useCallback((index: number) => {
    if (constraints.length <= 1) return;
    setConstraints((prev) => prev.filter((_, i) => i !== index));
  }, [constraints.length]);

  const hintList = constraints.filter(Boolean);
  const canProceedStep1 = messages.length >= MIN_MESSAGES && messages.every((m) => m.text.trim());
  const canPublish = canProceedStep1;

  const handlePublish = async () => {
    if (!canPublish) return;
    setIsPublishing(true);
    setPublishError(null);
    try {
      const { id } = await createPuzzle({
        messages,
        correctOrder,
        constraints: hintList,
      });
      setPublishedId(id);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  };

  const puzzle = {
    id: "preview",
    messages,
    correctOrder,
    constraints: hintList,
  };

  if (preview) {
    return (
      <div className="w-full max-w-[600px] mx-auto px-4 py-6">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className="mb-4 text-sm text-gray-600 hover:text-gray-900"
        >
          Back to creator
        </button>
        <Play previewPuzzle={puzzle} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[600px] mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-medium text-gray-900">Create re:chat</h1>
        <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
          Back home
        </Link>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {([1, 2, 3] as Step[]).map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              s <= step ? "bg-gray-900" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <section>
          <h2 className="text-sm font-medium text-gray-700 mb-2">Add your chat</h2>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setInputMode("screenshot")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                inputMode === "screenshot"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Screenshot
            </button>
            <button
              type="button"
              onClick={() => setInputMode("manual")}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                inputMode === "manual"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Add manually
            </button>
          </div>

          {inputMode === "screenshot" && (
            <div className="space-y-3">
              <div
                onDrop={(e) => !ocrLoading && handleDrop(e)}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !ocrLoading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  ocrLoading
                    ? "border-gray-200 bg-gray-50 cursor-wait text-gray-400"
                    : "border-gray-300 text-gray-500 cursor-pointer hover:border-gray-400 hover:bg-gray-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={ocrLoading}
                  className="hidden"
                />
                {ocrLoading ? (
                  <p className="text-gray-600">Reading your screenshot…</p>
                ) : (
                  <>
                    <p className="mb-1">Drop a screenshot or tap to upload</p>
                    <p className="text-xs">Works with chat screenshots from iMessage, WhatsApp, etc.</p>
                  </>
                )}
              </div>
              {ocrError && (
                <p className="text-sm text-red-600">
                  {ocrError}. Try pasting text or adding manually.
                </p>
              )}
              {messages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Parsed messages – edit if needed:</p>
                  {messages.map((msg, i) => (
                    <div key={msg.id} className="flex gap-2 items-center">
                      <select
                        value={msg.speaker}
                        onChange={(e) => updateMessage(i, "speaker", e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-20"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                      </select>
                      <input
                        type="text"
                        value={msg.text}
                        onChange={(e) => updateMessage(i, "text", e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeMessage(i)}
                        disabled={messages.length <= MIN_MESSAGES}
                        className="text-red-600 hover:text-red-800 disabled:opacity-30 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400">
                Looks wrong? Edit above or{" "}
                <button
                  type="button"
                  onClick={() => setInputMode("manual")}
                  className="underline hover:text-gray-600"
                >
                  add manually
                </button>{" "}
                instead.
              </p>
            </div>
          )}

          {inputMode === "manual" && (
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div key={msg.id} className="flex gap-2 items-center">
                  <select
                    value={msg.speaker}
                    onChange={(e) => updateMessage(i, "speaker", e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-2 text-sm w-20"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                  <input
                    type="text"
                    value={msg.text}
                    onChange={(e) => updateMessage(i, "text", e.target.value)}
                    placeholder="Message text"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeMessage(i)}
                    disabled={messages.length <= MIN_MESSAGES}
                    className="text-red-600 hover:text-red-800 disabled:opacity-30 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addMessage}
                disabled={messages.length >= MAX_MESSAGES}
                className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                + Add message
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="mt-6 min-h-[44px] px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            Confirm or reorder – this is the order solvers must find
          </h2>
          <div className="space-y-2 mb-6">
            {correctOrder.map((id, i) => {
              const msg = messages.find((m) => m.id === id);
              if (!msg) return null;
              const isSent = msg.speaker === "A";
              return (
                <div
                  key={id}
                  className={`flex items-center gap-2 ${isSent ? "justify-end" : ""}`}
                >
                  <div className="flex flex-col shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveInOrder(i, "up")}
                      disabled={i === 0}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ArrowUpIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveInOrder(i, "down")}
                      disabled={i === correctOrder.length - 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ArrowDownIcon className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <div
                    className={`flex-shrink-0 max-w-[85%] px-4 py-3 rounded-2xl text-[15px] ${
                      isSent ? "rounded-br-md bg-[#007AFF] text-white" : "rounded-bl-md bg-[#E5E5EA] text-gray-900"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="min-h-[44px] px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="min-h-[44px] px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800"
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="text-sm font-medium text-gray-700 mb-2">Hints (optional)</h2>
          <p className="text-xs text-gray-500 mb-3">Add hints to help solvers.</p>
          <div className="space-y-2 mb-6">
            {constraints.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={c}
                  onChange={(e) => updateConstraint(i, e.target.value)}
                  placeholder={`Hint ${i + 1}`}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeConstraint(i)}
                  disabled={constraints.length <= 1}
                  className="text-red-600 hover:text-red-800 disabled:opacity-30 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addConstraint}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              + Add hint
            </button>
          </div>

          {!publishedId ? (
            <>
              {publishError && (
                <p className="text-sm text-red-600 mb-3">{publishError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(true)}
                  className="min-h-[44px] px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50"
                >
                  Preview
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || !canPublish}
                  className="min-h-[44px] px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? "Publishing…" : "Create & get link"}
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
              <p className="font-medium text-gray-900 mb-1">Your re:chat is ready</p>
              <p className="text-sm text-gray-500 mb-4">Share the link or embed it.</p>
              <ShareBlock id={publishedId} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ShareBlock({ id }: { id: string }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/p/${id}` : "";
  const embedUrl = typeof window !== "undefined" ? `${window.location.origin}/embed/${id}` : "";
  const embedCode = `<iframe src="${embedUrl}" width="400" height="500" frameborder="0"></iframe>`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Share link</label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 text-sm"
          />
          <button
            type="button"
            onClick={copyLink}
            className="px-4 py-2.5 bg-[#007AFF] text-white text-sm font-medium rounded-xl hover:bg-[#0066DD] shrink-0"
          >
            {copiedLink ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Embed code</label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={embedCode}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 text-gray-900 font-mono text-xs"
          />
          <button
            type="button"
            onClick={copyEmbed}
            className="px-4 py-2.5 bg-[#007AFF] text-white text-sm font-medium rounded-xl hover:bg-[#0066DD] shrink-0"
          >
            {copiedEmbed ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <Link
        to={`/p/${id}`}
        className="inline-block text-sm text-[#007AFF] hover:underline"
      >
        Open puzzle →
      </Link>
    </div>
  );
}

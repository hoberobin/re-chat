import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import type { ChatMessage } from "../types/puzzle";
import { getSenderColor, getOrderedSenders } from "../utils/chatColors";

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';

// ---------------------------------------------------------------------------
// Exported header — compact; "Your task" in icon popover to save space
// ---------------------------------------------------------------------------

interface ChatThreadHeaderProps {
  chatName: string;
  isGroup: boolean;
  uniqueSenders: number;
  premise?: string;
  /** When set (e.g. daily flow), use as main line (hook) instead of chatName */
  title?: string;
  /** When set, use as subline instead of "Group · N people" */
  subtitle?: string;
}

export function ChatThreadHeader({
  chatName,
  isGroup,
  uniqueSenders,
  premise,
  title,
  subtitle,
}: ChatThreadHeaderProps) {
  const [taskOpen, setTaskOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const displayTitle = title ?? chatName;
  const displaySubtitle = subtitle ?? (isGroup ? `Group · ${uniqueSenders} people` : undefined);

  useEffect(() => {
    if (!taskOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setTaskOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTaskOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [taskOpen]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 12px 10px 16px",
        minHeight: 44,
        borderBottom: "1px solid #e0e0e0",
        background: "#fff",
        fontFamily: FONT,
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "#1c1c1e" }}>
          {displayTitle}
        </div>
        {displaySubtitle != null && displaySubtitle !== "" && (
          <div style={{ fontSize: 12, color: "#6b6b70", marginTop: 1 }}>
            {displaySubtitle}
          </div>
        )}
      </div>

      {premise && (
        <div ref={popoverRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setTaskOpen((o) => !o)}
            aria-label="Your task / instructions"
            aria-expanded={taskOpen}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: taskOpen ? "#f0f4ff" : "transparent",
              borderRadius: 8,
              color: "#5b7cff",
              cursor: "pointer",
            }}
          >
            <FontAwesomeIcon icon={faQuestionCircle} style={{ fontSize: 20 }} />
          </button>

          {taskOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 6,
                width: "min(320px, calc(100vw - 24px))",
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                border: "1px solid #e5e5ea",
                padding: "14px 16px",
                zIndex: 50,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#5b7cff", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                How it works
              </div>
              <div style={{ fontSize: 14, color: "#1c1c1e", lineHeight: 1.5, fontWeight: 500 }}>
                {premise}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main ChatThread — omits the header when showHeader=false
// ---------------------------------------------------------------------------

interface ChatThreadProps {
  messages: ChatMessage[];
  chatName: string;
  isGroup: boolean;
  premise?: string;
  showHeader?: boolean;
  /** When false, premise is not shown in body (use header task icon instead) */
  showPremiseInBody?: boolean;
  /** Order of senders for consistent unique colors; computed from messages if omitted */
  orderedSenders?: string[];
}

export function ChatThread({
  messages,
  chatName,
  isGroup,
  premise,
  showHeader = true,
  showPremiseInBody = true,
  orderedSenders,
}: ChatThreadProps) {
  const uniqueSenders = new Set(messages.map((m) => m.sender)).size;
  const senderOrder = orderedSenders ?? getOrderedSenders(messages);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        fontFamily: FONT,
      }}
    >
      {showHeader && (
        <ChatThreadHeader
          chatName={chatName}
          isGroup={isGroup}
          uniqueSenders={uniqueSenders}
          premise={showPremiseInBody ? undefined : premise}
        />
      )}

      {/* Premise in body only when showPremiseInBody (e.g. standalone ChatThread) */}
      {premise && showPremiseInBody && (
        <div
          style={{
            padding: "14px 18px",
            background: "#f0f4ff",
            borderBottom: "1px solid #dde2f0",
            borderLeft: "3px solid #5b7cff",
            marginBottom: 12,
            borderRadius: "0 8px 8px 0",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: "#5b7cff", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            How it works
          </div>
          <div style={{ fontSize: 15, color: "#1c1c1e", lineHeight: 1.5, fontWeight: 500 }}>
            {premise}
          </div>
        </div>
      )}

      {/* Message bubbles */}
      <div
        style={{
          padding: "12px 12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          background: "#fff",
        }}
      >
        {messages.map((msg) => {
          return (
            <div key={msg.id}>
              {msg.show_timestamp && (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    color: "#8e8e93",
                    padding: "8px 0 4px",
                  }}
                >
                  {msg.timestamp}
                </div>
              )}

              {isGroup && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: getSenderColor(msg.sender, senderOrder),
                    marginLeft: 12,
                    marginBottom: 2,
                    marginTop: 6,
                  }}
                >
                  {msg.sender}
                </div>
              )}

              <div
                className="animate-bubble"
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: 2,
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    padding: msg.is_redacted ? "10px 14px" : "9px 14px",
                    borderRadius: 18,
                    borderBottomLeftRadius: 4,
                    background: "#E9E9EB",
                    color: "#000",
                    fontSize: 16,
                    lineHeight: 1.4,
                  }}
                >
                  {msg.is_redacted ? (
                    <div
                      className="redacted-pulse"
                      style={{
                        width: 180,
                        height: 20,
                        background: "#000",
                        borderRadius: 4,
                      }}
                    />
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

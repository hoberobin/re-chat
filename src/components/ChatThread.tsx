import type { ChatMessage } from "../types/puzzle";

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';

const SENDER_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"];

function senderColor(sender: string): string {
  let hash = 0;
  for (let i = 0; i < sender.length; i++) {
    hash = (hash << 5) - hash + sender.charCodeAt(i);
    hash |= 0;
  }
  return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

// ---------------------------------------------------------------------------
// Exported header — render this outside the scroll area so it stays sticky
// ---------------------------------------------------------------------------

interface ChatThreadHeaderProps {
  chatName: string;
  isGroup: boolean;
  uniqueSenders: number;
}

export function ChatThreadHeader({
  chatName,
  isGroup,
  uniqueSenders,
}: ChatThreadHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        borderBottom: "1px solid #e5e5ea",
        background: "#f9f9f9",
        minHeight: 56,
        fontFamily: FONT,
        flexShrink: 0,
      }}
    >
      {/* Back chevron */}
      <div style={{ width: 32, color: "#007AFF" }}>
        <svg width="12" height="20" viewBox="0 0 12 20" fill="none">
          <path
            d="M10 2L2 10L10 18"
            stroke="#007AFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Center: name + optional subtitle */}
      <div style={{ textAlign: "center", flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 16, color: "#000" }}>
          {chatName}
        </div>
        {isGroup && (
          <div style={{ fontSize: 12, color: "#8e8e93", marginTop: 1 }}>
            {uniqueSenders} people
          </div>
        )}
      </div>

      {/* Video icon */}
      <div style={{ width: 32, color: "#007AFF", textAlign: "right" }}>
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
          <rect x="1" y="2" width="14" height="12" rx="2" stroke="#007AFF" strokeWidth="1.8" />
          <path d="M15 6L21 3V13L15 10" stroke="#007AFF" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </div>
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
}

export function ChatThread({
  messages,
  chatName,
  isGroup,
  premise,
  showHeader = true,
}: ChatThreadProps) {
  const selfSender = messages.length > 0 ? messages[0].sender : null;
  const uniqueSenders = new Set(messages.map((m) => m.sender)).size;

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
        />
      )}

      {/* Premise text */}
      {premise && (
        <div
          style={{
            textAlign: "center",
            fontSize: 13,
            color: "#8e8e93",
            fontStyle: "italic",
            padding: "8px 16px",
            borderBottom: "1px solid #f2f2f7",
            background: "#fafafa",
          }}
        >
          {premise}
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
          const isSelf = msg.sender === selfSender;
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

              {isGroup && !isSelf && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: senderColor(msg.sender),
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
                  justifyContent: isSelf ? "flex-end" : "flex-start",
                  marginBottom: 2,
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    padding: msg.is_redacted ? "10px 14px" : "9px 14px",
                    borderRadius: 18,
                    ...(isSelf
                      ? { background: "#1C8EF9", color: "#fff", borderBottomRightRadius: 4 }
                      : { background: "#E9E9EB", color: "#000", borderBottomLeftRadius: 4 }),
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

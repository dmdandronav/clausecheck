import React, { useState, useRef, useEffect } from "react";

const APP_NAME = "ClauseCheck";
const TAGLINE = "Know what you're signing before you sign it.";

export default function App() {
  const [mode, setMode] = useState("analyze"); // 'analyze' | 'chat'

  // --- Analyze mode state ---
  const [docText, setDocText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  // --- Chat mode state ---
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! Switch to \"Quick Analyze\" to paste your document, or ask me a follow-up question about a clause you've already had analyzed.",
    },
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatLoading]);

  async function analyzeDocument(e) {
    e.preventDefault();
    const text = docText.trim();
    if (!text || analyzing) return;

    setAnalyzing(true);
    setAnalysis(null);
    setAnalyzeError(null);

    try {
      const res = await fetch("/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (err) {
      setAnalyzeError(
        err.message || "Couldn't reach the backend. Make sure Flask is running on port 5000."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || chatLoading) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setChatLoading(true);
    setSources([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages([...next, { role: "assistant", content: data.reply }]);
      setSources(data.sources || []);
    } catch (err) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "Hmm, I couldn't reach the backend. Make sure the Flask server is running on port 5000 and your API key is set in backend/.env.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-surface)", color: "var(--color-ink)" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--color-line)" }} className="px-6 py-5">
        <div className="max-w-2xl mx-auto">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-accent)" }}
          >
            {APP_NAME}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-ink)", opacity: 0.6 }}>
            {TAGLINE}
          </p>
        </div>
      </header>

      {/* Mode toggle */}
      <div style={{ borderBottom: "1px solid var(--color-line)" }} className="px-6 py-2">
        <div className="max-w-2xl mx-auto flex gap-1">
          {["analyze", "chat"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: mode === m ? "var(--color-accent)" : "transparent",
                color: mode === m ? "#fff" : "var(--color-ink)",
                opacity: mode === m ? 1 : 0.55,
              }}
            >
              {m === "analyze" ? "Quick Analyze" : "Ask Follow-up"}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 px-6 py-6 max-w-2xl w-full mx-auto">
        {mode === "analyze" ? (
          <form onSubmit={analyzeDocument} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium" style={{ color: "var(--color-ink)", opacity: 0.75 }}>
                Paste your document below
              </span>
              <textarea
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder="Paste a lease, internship offer, terms of service, or any contract…"
                rows={12}
                className="w-full rounded-xl text-sm leading-relaxed resize-y focus:outline-none"
                style={{
                  border: "1px solid var(--color-line)",
                  background: "#fff",
                  padding: "0.875rem 1rem",
                  color: "var(--color-ink)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              />
            </label>

            <button
              type="submit"
              disabled={analyzing || !docText.trim()}
              className="self-start rounded-xl px-6 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              {analyzing ? "Analyzing…" : "Analyze Document"}
            </button>

            {/* Analysis result card */}
            {analysis && (
              <div
                className="rounded-2xl p-5 text-sm leading-relaxed mt-2"
                style={{
                  background: "#fff",
                  border: "1px solid var(--color-line)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <h2
                  className="text-base font-semibold mb-3"
                  style={{ fontFamily: "var(--font-display)", color: "var(--color-accent)" }}
                >
                  Document Breakdown
                </h2>
                <div style={{ color: "var(--color-ink)", whiteSpace: "pre-wrap" }}>{analysis}</div>
                <button
                  type="button"
                  onClick={() => {
                    setMode("chat");
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: "assistant",
                        content:
                          "I've analyzed your document. Feel free to ask me about any specific clause or term you'd like clarified!",
                      },
                    ]);
                  }}
                  className="mt-4 text-xs font-medium underline underline-offset-2"
                  style={{ color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Ask a follow-up question →
                </button>
              </div>
            )}

            {analyzeError && (
              <div
                className="rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "#fff0f0",
                  border: "1px solid #fca5a5",
                  color: "#b91c1c",
                }}
              >
                {analyzeError}
              </div>
            )}
          </form>
        ) : (
          /* Chat mode */
          <div className="flex flex-col h-full">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-4 pb-4"
              style={{ maxHeight: "calc(100vh - 280px)" }}
            >
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={
                      m.role === "user"
                        ? { background: "var(--color-accent)", color: "#fff" }
                        : {
                            background: "#fff",
                            border: "1px solid var(--color-line)",
                            color: "var(--color-ink)",
                          }
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2 text-sm pl-1" style={{ color: "var(--color-accent)", opacity: 0.7 }}>
                  <span
                    className="w-2 h-2 rounded-full pulse-soft"
                    style={{ background: "var(--color-accent)" }}
                  />
                  thinking…
                </div>
              )}

              {sources.length > 0 && (
                <div className="text-xs pl-1" style={{ color: "var(--color-ink)", opacity: 0.45 }}>
                  Sources: {sources.join(", ")}
                </div>
              )}
            </div>

            <form
              onSubmit={sendMessage}
              className="flex gap-3 pt-4"
              style={{ borderTop: "1px solid var(--color-line)" }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a clause…"
                className="flex-1 rounded-xl text-sm focus:outline-none px-4 py-2"
                style={{
                  border: "1px solid var(--color-line)",
                  background: "#fff",
                  color: "var(--color-ink)",
                }}
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-50"
                style={{ background: "var(--color-accent)", color: "#fff" }}
              >
                Send
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Disclaimer */}
      <footer
        className="px-6 py-4 text-center text-xs"
        style={{ color: "var(--color-ink)", opacity: 0.5, borderTop: "1px solid var(--color-line)" }}
      >
        ⚠️ This is an educational tool, not legal advice. Always consult a professional for important decisions.
      </footer>
    </div>
  );
}

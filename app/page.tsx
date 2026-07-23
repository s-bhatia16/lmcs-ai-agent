"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Scenario = "loan" | "savings" | "withdrawal" | "registration" | "faq";

type Message = {
  role: "member" | "agent";
  text: string;
  result?: "loan" | "savings" | "withdrawal" | "registration";
  kind?: "scripted" | "claude";
};

const scenarioCopy: Record<Scenario, { prompt: string; reply: string; result?: Message["result"] }> = {
  loan: {
    prompt: "Can I qualify for a normal loan?",
    reply:
      "Yes. Based on your fictional record, you meet the 3-month membership and ₦5,000 monthly savings requirements. Your maximum loan is three times your ordinary savings.",
    result: "loan",
  },
  savings: {
    prompt: "Show me my savings balances.",
    reply:
      "Here is the current breakdown for fictional member LMCS-1042. These balances are demonstration data only.",
    result: "savings",
  },
  withdrawal: {
    prompt: "How do I withdraw my special savings?",
    reply:
      "Special savings withdrawals require advance notice under the published LMCS rules. I can prepare the request, but staff must review it before any funds are released.",
    result: "withdrawal",
  },
  registration: {
    prompt: "I want to join LMCS.",
    reply:
      "I can guide you through a mock registration. To begin, please provide your full name and fictional staff number. Do not enter real personal information in this demonstration.",
    result: "registration",
  },
  faq: {
    prompt: "What is the minimum share capital?",
    reply:
      "The published LMCS FAQ states a minimum share capital of ₦100,000, payable over 20 months, and a maximum of ₦5,000,000.",
  },
};

const quickActions: { id: Scenario; label: string; icon: string }[] = [
  { id: "loan", label: "Check loan eligibility", icon: "÷" },
  { id: "savings", label: "View my savings", icon: "₦" },
  { id: "withdrawal", label: "How do I withdraw?", icon: "↗" },
  { id: "registration", label: "Register a new member", icon: "+" },
];

type MessageBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "source"; text: string };

function formatAgentMessage(text: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  }

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim().replace(/^✓\s*/, "");

    if (!line) {
      flushList();
      continue;
    }

    if (line.toLowerCase().startsWith("bullet:")) {
      listItems.push(line.slice(line.indexOf(":") + 1).trim());
      continue;
    }

    if (line.startsWith("- ")) {
      listItems.push(line.slice(2).trim());
      continue;
    }

    flushList();

    if (line.toLowerCase().startsWith("answer:")) {
      blocks.push({
        type: "paragraph",
        text: line.slice(line.indexOf(":") + 1).trim(),
      });
    } else if (line.toLowerCase().startsWith("source:")) {
      blocks.push({
        type: "source",
        text: line.slice(line.indexOf(":") + 1).trim(),
      });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }

  flushList();
  return blocks;
}

function AgentMessage({ text }: { text: string }) {
  const blocks = formatAgentMessage(text);

  return (
    <div className="formatted-message">
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul key={`list-${index}`}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "source") {
          return (
            <div className="source-badge" key={`source-${index}`}>
              <span aria-hidden="true">✓</span>
              Source: {block.text}
            </div>
          );
        }

        return <p key={`paragraph-${index}`}>{block.text}</p>;
      })}
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "member", text: scenarioCopy.loan.prompt, kind: "scripted" },
    {
      role: "agent",
      text: scenarioCopy.loan.reply,
      result: "loan",
      kind: "scripted",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showMath, setShowMath] = useState(false);
  const [applicationStarted, setApplicationStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, typing]);

  function runScenario(id: Scenario, customPrompt?: string) {
    const scenario = scenarioCopy[id];
    setApplicationStarted(false);
    setMessages((current) => [
      ...current,
      {
        role: "member",
        text: customPrompt || scenario.prompt,
        kind: "scripted",
      },
    ]);
    setInput("");
    setTyping(true);
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          role: "agent",
          text: scenario.reply,
          result: scenario.result,
          kind: "scripted",
        },
      ]);
      setTyping(false);
    }, 650);
  }

  async function askClaude(prompt: string) {
    if (!prompt.trim() || typing) return;

    const history = messages
      .filter((message) => message.kind === "claude")
      .slice(-8)
      .map((message) => ({
        role: message.role === "member" ? "user" : "assistant",
        content: message.text,
      }));

    setApplicationStarted(false);
    setInput("");
    setTyping(true);

    setMessages((current) => [
      ...current,
      {
        role: "member",
        text: prompt.trim(),
        kind: "claude",
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt.trim(),
          memberId: "LMCS-1042",
          history,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The assistant could not respond.");
      }

      setMessages((current) => [
        ...current,
        {
          role: "agent",
          text: data.answer,
          kind: "claude",
        },
      ]);
    } catch (error) {
      console.error("Chat request failed:", error);

      setMessages((current) => [
        ...current,
        {
          role: "agent",
          text:
            "I’m sorry, but I could not reach the LMCS assistant. Please try again.",
          kind: "claude",
        },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function submitMessage(event: FormEvent) {
    event.preventDefault();

    if (!input.trim() || typing) return;

    void askClaude(input);
  }

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <div className="mark" aria-hidden="true">L</div>
          <div>
            <strong>LMCS Member Assistant</strong>
            <span className="poc">Proof of Concept</span>
          </div>
        </div>
        <nav className="site-nav" aria-label="LMCS context">
          <span>Services</span>
          <span>FAQs</span>
          <span>Membership</span>
        </nav>
        <div className="environment"><span /> Demo environment</div>
      </header>

      <div className="page-shell">
        <section className="welcome">
          <div>
            <p className="eyebrow">Fictional member experience</p>
            <h1>Good afternoon, Chinedu</h1>
            <p>How can I help with your LMCS account today?</p>
          </div>
          <button className="member-chip" type="button" title="Fictional demonstration profile">
            <span className="member-icon">○</span>
            <span><strong>Member LMCS-1042</strong><small>Fictional demo account</small></span>
          </button>
        </section>

        <section className="workspace">
          <aside className="quick-panel card">
            <div>
              <p className="section-kicker">Member services</p>
              <h2>Quick actions</h2>
              <p className="panel-intro">Choose a journey to demonstrate.</p>
            </div>
            <div className="action-list">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="quick-action"
                  onClick={() => runScenario(action.id)}
                  disabled={typing}
                >
                  <span className="action-icon">{action.icon}</span>
                  <span>{action.label}</span>
                  <span className="chevron">›</span>
                </button>
              ))}
            </div>
            <button className="faq-link" type="button" onClick={() => runScenario("faq")} disabled={typing}>
              Ask an FAQ question <span>→</span>
            </button>
          </aside>

          <section className="chat card" aria-label="LMCS member assistant conversation">
            <div className="chat-head">
              <div>
                <span className="online-dot" />
                <strong>LMCS Assistant</strong>
              </div>
              <span>Claude + approved LMCS FAQ</span>
            </div>

            <div className="messages" aria-live="polite">
              {messages.map((message, index) => (
                <div className={`message-row ${message.role}`} key={`${message.text}-${index}`}>
                  {message.role === "agent" && <div className="agent-avatar">LM</div>}
                  <div className="message-stack">
                    <div
                      className={`bubble ${
                        message.role === "agent"
                          ? "agent-bubble"
                          : "member-bubble"
                      }`}
                    >
                      {message.role === "agent" ? (
                        <AgentMessage text={message.text} />
                      ) : (
                        message.text
                      )}
                    </div>
                    {message.result === "loan" && (
                      <div className="result-card">
                        <div className="result-grid">
                          <div><span>Ordinary savings</span><strong>₦420,000</strong></div>
                          <div><span>Maximum loan</span><strong>₦1,260,000</strong></div>
                          <div><span>Normal loan rate</span><strong>11%</strong></div>
                          <div><span>Status</span><b>Eligible</b></div>
                        </div>
                        {showMath && (
                          <div className="calculation">
                            <span>Published rule</span>
                            <strong>₦420,000 × 3 = ₦1,260,000</strong>
                          </div>
                        )}
                        {applicationStarted ? (
                          <div className="application-note">
                            Application started. Next: confirm two sureties or collateral. Staff approval is still required.
                          </div>
                        ) : (
                          <div className="result-actions">
                            <button type="button" onClick={() => setApplicationStarted(true)}>Start application</button>
                            <button type="button" className="text-button" onClick={() => setShowMath((value) => !value)}>
                              {showMath ? "Hide calculation" : "See calculation"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {message.result === "savings" && (
                      <div className="mini-result">
                        <div><span>Ordinary</span><strong>₦420,000</strong></div>
                        <div><span>Special</span><strong>₦85,000</strong></div>
                        <div><span>Share capital</span><strong>₦160,000</strong></div>
                      </div>
                    )}
                    {message.result === "withdrawal" && (
                      <div className="step-result">
                        <span>1</span><p><strong>Confirm savings type</strong> Special savings selected</p>
                        <span>2</span><p><strong>Prepare request</strong> Agent collects the amount and preferred date</p>
                        <span>3</span><p><strong>Staff review</strong> No automatic payout in this PoC</p>
                      </div>
                    )}
                    {message.result === "registration" && (
                      <div className="registration-callout">
                        <strong>Safe demo mode</strong>
                        <span>Use only fictional names, staff numbers, and identity details.</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="message-row agent">
                  <div className="agent-avatar">LM</div>
                  <div className="typing" aria-label="Assistant is responding"><i /><i /><i /></div>
                </div>
              )}
              <div ref={messagesEndRef} aria-hidden="true" />
            </div>

            <form className="composer" onSubmit={submitMessage}>
              <label className="sr-only" htmlFor="member-question">Ask the LMCS assistant</label>
              <input
                id="member-question"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about savings, loans, or membership..."
              />
              <button type="submit" disabled={!input.trim() || typing} aria-label="Send message">➤</button>
            </form>
          </section>

          <aside className="safeguards card">
            <div className="shield">✓</div>
            <p className="section-kicker">Built for a safe demonstration</p>
            <h2>Demo safeguards</h2>
            <p className="panel-intro">Clear boundaries for every journey shown today.</p>
            <ul>
              <li><span>✓</span><div><strong>Fictional data only</strong><small>No real member records are used.</small></div></li>
              <li><span>✓</span><div><strong>Staff approval required</strong><small>The agent cannot release funds.</small></div></li>
              <li><span>✓</span><div><strong>Rules from LMCS FAQ</strong><small>Answers cite published policies.</small></div></li>
            </ul>
            <div className="scope-note">
              <strong>PoC scope</strong>
              <p>This experience demonstrates what is possible before integration with LMCS systems.</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

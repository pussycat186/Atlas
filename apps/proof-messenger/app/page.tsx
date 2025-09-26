"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type MessageStatus = "pending" | "sent" | "verified" | "failed";

type Message = {
  id: string;
  content: string;
  ts: number;
  status: MessageStatus;
  receipt?: Receipt;
};

type Receipt = {
  id: string;
  timestamp: number;
  status: MessageStatus;
  hash?: string;
  witnesses?: string[];
};

type RequestState = "idle" | "sending" | "verifying" | "error";

const TEST_IDS = {
  tabMessenger: "tab-messenger",
  tabAdmin: "tab-admin",
  tabDev: "tab-dev",
  skuBasic: "sku-basic",
  skuPro: "sku-pro",
  themeToggle: "theme-toggle",
  composerInput: "composer-input",
  sendBtn: "send-btn",
  verifyBtn: "verify-btn",
  receipt: "receipt",
  minimapToggle: "minimap-toggle",
  copyJavascript: "copy-javascript",
  copyCurl: "copy-curl",
} as const;

const INITIAL_MESSAGES: Message[] = [
  {
    id: "rec_seed_001",
    content: "Integrity snapshot synced",
    ts: Date.now() - 2 * 60 * 1000,
    status: "verified",
    receipt: {
      id: "rec_seed_001",
      timestamp: Date.now() - 2 * 60 * 1000,
      status: "verified",
      hash: "sha256:bafc09",
      witnesses: ["w001", "w014", "w105"],
    },
  },
  {
    id: "rec_seed_002",
    content: "Heartbeat probe scheduled",
    ts: Date.now() - 15 * 60 * 1000,
    status: "sent",
  },
];

export default function Page() {
  const gateway = 'https://atlas-gateway.sonthenguyen186.workers.dev';
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [sku, setSku] = useState<"basic" | "pro">("basic");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    INITIAL_MESSAGES[0]?.id ?? null,
  );
  const [composerValue, setComposerValue] = useState("");
  const [minimapEnabled, setMinimapEnabled] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(INITIAL_MESSAGES[0]?.receipt ?? null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [requestState, setRequestState] = useState<RequestState>("idle");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!selectedMessageId && messages.length > 0) {
      setSelectedMessageId(messages[0].id);
      setReceipt(messages[0].receipt ?? null);
    }
  }, [messages, selectedMessageId]);

  const handleThemeToggle = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const handleMinimapToggle = useCallback(() => {
    setMinimapEnabled((prev) => !prev);
  }, []);

  const selectMessage = useCallback(
    (id: string) => {
      setSelectedMessageId(id);
      const found = messages.find((message) => message.id === id);
      setReceipt(found?.receipt ?? null);
      setReceiptError(null);
    },
    [messages],
  );

  const copySnippet = useCallback((value: string) => {
    if (typeof navigator?.clipboard?.writeText === "function") {
      void navigator.clipboard.writeText(value);
    }
  }, []);

  const buildReceipt = (id: string, data: any): Receipt => ({
    id: data?.id ?? data?.recordId ?? data?.receiptId ?? id,
    timestamp:
      typeof data?.timestamp === "number"
        ? data.timestamp
        : typeof data?.timestamp === "string"
        ? Date.parse(data.timestamp)
        : typeof data?.ts === "number"
        ? data.ts
        : Date.now(),
    status: (data?.status ?? "verified") as MessageStatus,
    hash: data?.hash ?? data?.digest ?? data?.checksum,
    witnesses: Array.isArray(data?.witnesses)
      ? data.witnesses
      : Array.isArray(data?.quorum)
      ? data.quorum
      : undefined,
  });

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, ...updates } : message)));
  }, []);

  const fetchReceipt = useCallback(
    async (id: string) => {
      try {
        setReceiptLoading(true);
        setReceiptError(null);

        const response = await fetch(`${gateway}/record/${id}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Gateway responded ${response.status}`);
        }

        const payload = await response.json().catch(() => ({}));
        const nextReceipt = buildReceipt(id, payload);
        setReceipt(nextReceipt);
        updateMessage(id, { status: "verified", receipt: nextReceipt });
        setRequestState("idle");
      } catch (error) {
        setReceiptError("Gateway degraded — receipt unavailable");
        setRequestState("error");
      } finally {
        setReceiptLoading(false);
      }
    },
    [gateway, updateMessage],
  );

  const handleSend = useCallback(async () => {
    const trimmed = composerValue.trim();
    if (!trimmed) return;

    const tempId = `rec_${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      content: trimmed,
      ts: Date.now(),
      status: "pending",
    };

    setMessages((prev) => [optimistic, ...prev]);
    setComposerValue("");
    setSelectedMessageId(tempId);
    setReceipt(null);
    setReceiptError(null);
    setRequestState("sending");

    try {
      const response = await fetch(`${gateway}/record`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": tempId,
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok) {
        throw new Error(`Gateway responded ${response.status}`);
      }

      const payload = await response.json().catch(() => ({}));
      const persistedId = payload?.id ?? payload?.recordId ?? payload?.receiptId ?? tempId;

      if (persistedId !== tempId) {
        setMessages((prev) =>
          prev.map((message) => (message.id === tempId ? { ...message, id: persistedId } : message)),
        );
        setSelectedMessageId(persistedId);
      }

      updateMessage(persistedId, { status: "sent" });
      await fetchReceipt(persistedId);
    } catch (error) {
      updateMessage(tempId, { status: "failed" });
      setReceiptError("Gateway error — message failed");
      setRequestState("error");
    }
  }, [composerValue, fetchReceipt, gateway, updateMessage]);

  const handleVerify = useCallback(async () => {
    const targetId = selectedMessageId ?? messages[0]?.id;
    if (!targetId) return;
    setRequestState("verifying");
    await fetchReceipt(targetId);
  }, [fetchReceipt, messages, selectedMessageId]);

  const javascriptSnippet = useMemo(
    () =>
      `import { AtlasMessenger } from '@atlas/prism';\n\nconst messenger = new AtlasMessenger({\n  gateway: '${gateway}',\n});\n\nawait messenger.send({\n  channel: 'proof-of-integrity',\n  payload: {\n    message: 'Hello Quantum World!',\n  },\n});`,
    [gateway],
  );

  const curlSnippet = useMemo(
    () =>
      `curl -X POST ${gateway}/record \\\n+  -H 'Content-Type: application/json' \\\n+  -H 'Idempotency-Key: $RANDOM' \\\n+  -d '{"message":"Hello Quantum World!"}'`,
    [gateway],
  );

  const selectedMessage = selectedMessageId
    ? messages.find((message) => message.id === selectedMessageId)
    : undefined;

  return (
    <div className="prism-shell" data-testid="tab-messenger">
      <AuroraOverlay />

      <header className="prism-header">
        <div className="brand">
          <span className="brand-mark">⚡</span>
          <div>
            <p className="brand-title">Atlas Prism</p>
            <p className="brand-subtitle">Messenger hard reset (v14.2)</p>
          </div>
        </div>
        <button
          type="button"
          className="icon-toggle"
          data-testid={TEST_IDS.themeToggle}
          onClick={handleThemeToggle}
          aria-label="Toggle theme"
        >
          <span aria-hidden="true">☀️</span>
          <span aria-hidden="true">🌙</span>
        </button>
      </header>

      <nav className="tab-bar" role="tablist">
        <span data-testid={TEST_IDS.tabMessenger} role="tab" aria-selected="true" className="tab active">
          Messenger
        </span>
        <span data-testid={TEST_IDS.tabAdmin} role="tab" aria-selected="false" className="tab">
          Admin
        </span>
        <span data-testid={TEST_IDS.tabDev} role="tab" aria-selected="false" className="tab">
          Dev
        </span>
      </nav>

      <main className="grid-layout">
        <section className="panel">
          <header className="panel-header">
            <div>
              <p className="panel-label">Plan</p>
              <h2>SKU selector</h2>
            </div>
            <div className="sku-switch" role="radiogroup" aria-label="Plan">
              <button
                type="button"
                role="radio"
                aria-checked={sku === "basic"}
                data-testid={TEST_IDS.skuBasic}
                className={sku === "basic" ? "sku active" : "sku"}
                onClick={() => setSku("basic")}
              >
                Basic
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={sku === "pro"}
                data-testid={TEST_IDS.skuPro}
                className={sku === "pro" ? "sku active" : "sku"}
                onClick={() => setSku("pro")}
              >
                Pro
              </button>
            </div>
          </header>

          {sku === "pro" && (
            <div className="badge-row">
              <span className="badge">Tenant: atlas-proof</span>
              <span className="badge">PQC ready</span>
              <span className="badge">/qtca/stream</span>
            </div>
          )}

          <div className="composer">
            <textarea
              value={composerValue}
              onChange={(event) => setComposerValue(event.target.value)}
              placeholder="Compose a verifiable message"
              rows={3}
              data-testid={TEST_IDS.composerInput}
            />
            <div className="composer-actions">
              <button
                type="button"
                data-testid={TEST_IDS.sendBtn}
                onClick={handleSend}
                disabled={requestState === "sending" || composerValue.trim().length === 0}
              >
                {requestState === "sending" ? "Sending" : "Send"}
              </button>
              <button type="button" data-testid={TEST_IDS.verifyBtn} onClick={handleVerify}>
                Verify
              </button>
              <button
                type="button"
                data-testid={TEST_IDS.minimapToggle}
                className={minimapEnabled ? "toggle active" : "toggle"}
                onClick={handleMinimapToggle}
              >
                Minimap
              </button>
            </div>
          </div>

          <div className="message-area">
            <ul className="message-list">
              {messages.map((message) => {
                const date = new Date(message.ts);
                return (
                  <li key={message.id} className={selectedMessageId === message.id ? "message active" : "message"}>
                    <button type="button" onClick={() => selectMessage(message.id)}>
                      <span className={`status status-${message.status}`}>{message.status}</span>
                      <div className="message-body">
                        <p className="message-content">{message.content}</p>
                        <time>{date.toLocaleString()}</time>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            {minimapEnabled && (
              <div className="minimap" role="navigation">
                <p>Minimap</p>
                <div className="minimap-grid">
                  {messages.map((message) => (
                    <button
                      key={message.id}
                      type="button"
                      className={`minimap-dot status-${message.status}`}
                      onClick={() => selectMessage(message.id)}
                      aria-label={`Focus ${message.id}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="panel">
          <header className="panel-header">
            <div>
              <p className="panel-label">Gateway</p>
              <h2>Verification receipt</h2>
            </div>
          </header>
          <div className="receipt" data-testid={TEST_IDS.receipt}>
            <div>
              <span>ID</span>
              <code>{receipt?.id ?? selectedMessage?.id ?? "—"}</code>
            </div>
            <div>
              <span>Status</span>
              <span className={`chip status-${receipt?.status ?? selectedMessage?.status ?? "pending"}`}>
                {receipt?.status ?? selectedMessage?.status ?? "pending"}
              </span>
            </div>
            <div>
              <span>Timestamp</span>
              <span>
                {receipt?.timestamp
                  ? new Date(receipt.timestamp).toLocaleString()
                  : selectedMessage
                  ? new Date(selectedMessage.ts).toLocaleString()
                  : "—"}
              </span>
            </div>
            <div>
              <span>Hash</span>
              <span>{receipt?.hash ?? "—"}</span>
            </div>
            <div>
              <span>Witnesses</span>
              <span>{receipt?.witnesses?.join(", ") ?? "—"}</span>
            </div>
            {receiptLoading && <p className="hint">Fetching receipt…</p>}
            {receiptError && <p className="error">{receiptError}</p>}
          </div>
        </section>

        <section className="panel">
          <header className="panel-header">
            <div>
              <p className="panel-label">Developer</p>
              <h2>Quickstart</h2>
            </div>
          </header>
          <div className="code-blocks">
            <article>
              <header>
                <span className="badge">JavaScript</span>
              </header>
              <pre>
                <code>{javascriptSnippet}</code>
              </pre>
              <button type="button" data-testid={TEST_IDS.copyJavascript} onClick={() => copySnippet(javascriptSnippet)}>
                Copy JavaScript
              </button>
            </article>
            <article>
              <header>
                <span className="badge">cURL</span>
              </header>
              <pre>
                <code>{curlSnippet}</code>
              </pre>
              <button type="button" data-testid={TEST_IDS.copyCurl} onClick={() => copySnippet(curlSnippet)}>
                Copy curl
              </button>
            </article>
            <footer>
              <span>Gateway endpoint</span>
              <code>{gateway}</code>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}

function AuroraOverlay() {
  return (
    <div className="aurora-overlay" aria-hidden="true">
      <div className="aurora" />
    </div>
  );
}


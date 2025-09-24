"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getGatewayUrl } from "@atlas/config";

type ClusterStatus = "healthy" | "degraded";

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

export default function AdminPage() {
  const gateway = useMemo(() => getGatewayUrl(), []);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [sku, setSku] = useState<"basic" | "pro">("pro");
  const [clusterStatus, setClusterStatus] = useState<ClusterStatus>("healthy");

  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [composerValue, setComposerValue] = useState("");

  const handleThemeToggle = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const handleMinimapToggle = useCallback(() => {
    setMinimapEnabled((prev) => !prev);
  }, []);

  // Monitor gateway health
  useEffect(() => {
    async function checkHealth() {
      try {
        const healthRes = await fetch(`${gateway}/health`, { cache: "no-store" });
        const metricsRes = await fetch(`${gateway}/metrics`, { cache: "no-store" });
        if (!healthRes.ok || !metricsRes.ok) {
          throw new Error("degraded");
        }
        setClusterStatus("healthy");
      } catch {
        setClusterStatus("degraded");
      }
    }
    void checkHealth();
    const id = setInterval(checkHealth, 30_000);
    return () => clearInterval(id);
  }, [gateway]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const javascriptSnippet = useMemo(
    () =>
      `import { AtlasAdmin } from '@atlas/prism';\n\nconst admin = new AtlasAdmin({\n  gateway: '${gateway}',\n});\n\nconst metrics = await admin.fetchMetrics();`,
    [gateway],
  );

  const curlSnippet = useMemo(
    () =>
      `curl ${gateway}/metrics`,
    [gateway],
  );

  const copySnippet = useCallback((value: string) => {
    if (typeof navigator?.clipboard?.writeText === "function") {
      void navigator.clipboard.writeText(value);
    }
  }, []);

  return (
    <div className="prism-shell" data-testid="tab-admin">
      <AuroraOverlay />
      <header className="prism-header">
        <div className="brand">
          <span className="brand-mark">⚡</span>
          <div>
            <p className="brand-title">Atlas Prism</p>
            <p className="brand-subtitle">Admin hard reset (v14.2)</p>
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
        <span data-testid={TEST_IDS.tabMessenger} role="tab" aria-selected="false" className="tab">
          Messenger
        </span>
        <span data-testid={TEST_IDS.tabAdmin} role="tab" aria-selected="true" className="tab active">
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
              <span className="badge">Tenant: atlas-admin</span>
              <span className="badge">PQC ready</span>
              <span className="badge">/qtca/stream</span>
            </div>
          )}

          {/* Health badge */}
          {clusterStatus === "degraded" && <p className="error">Gateway degraded</p>}

          <div className="composer">
            <textarea
              value={composerValue}
              onChange={(e) => setComposerValue(e.target.value)}
              placeholder="Compose admin note"
              rows={3}
              data-testid={TEST_IDS.composerInput}
            />
            <div className="composer-actions">
              <button type="button" data-testid={TEST_IDS.sendBtn} disabled>
                Send (disabled in admin)
              </button>
              <button type="button" data-testid={TEST_IDS.verifyBtn} disabled>
                Verify (disabled)
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

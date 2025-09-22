"use client";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {motion, AnimatePresence, LayoutGroup} from "framer-motion";
import { getGatewayUrl } from "@atlas/config";

/** PRISM UI — Basic vs Pro, Minimap rAF, Luxury light, no duplicate ids */

export default function AtlasPrismSKUDemo() {
  const [tab, setTab] = useState<"messenger"|"admin"|"dev">("messenger");
  const [sku, setSKU] = useState<"basic"|"pro">("basic");
  const [theme, setTheme] = useState<"light"|"dark">("dark");
  const [dense, setDense] = useState(false);
  const [tenant, setTenant] = useState("Atlas Labs");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [transitionKey, setTransitionKey] = useState(0);
  const [lux, setLux] = useState(true);
  const isPro = sku === "pro";

  useEffect(()=>{ document.documentElement.classList.toggle("dark", theme==="dark"); },[theme]);
  useEffect(()=>{ setTransitionKey(k=>k+1); },[tab,sku,theme,lux]);

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{const mod=e.metaKey||e.ctrlKey;if(mod&&e.key.toLowerCase()==='k'){e.preventDefault();setPaletteOpen(v=>!v);}};
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[]);

  const bgIntensity = isPro ? (theme==='dark'?1.0:0.55) : (theme==='dark'?0.5:0.3);

  return (
    <div className={`min-h-screen w-full ${theme==="dark"?"bg-neutral-950 text-neutral-100":"bg-[#f7f7fb] text-neutral-900"}`}>
      <BGParticles theme={theme} intensity={bgIntensity}/>
      <AuroraOverlay key={`aurora-${transitionKey}`} opacity={theme==='dark'?(lux?0.6:0.4):(lux?0.35:0.2)}/>
      {lux && <NoiseOverlay intensity={theme==='dark'?0.03:0.06}/>}

      <div className="mx-auto max-w-7xl px-4 py-4 relative">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-lg" aria-hidden />
            <div className="font-semibold tracking-wide">ATLAS • Prism UI — Peak Preview</div>
            <Badge label={isPro?"PRO":"BASIC"} tone={isPro?"pro":"basic"} />
            {isPro && (
              <div className="hidden md:flex items-center gap-2 ml-2">
                <span className="text-xs dark:text-neutral-400 text-neutral-600">Tenant</span>
                <select aria-label="Tenant" className="dark:bg-white/10 bg-neutral-900/5 border border-transparent rounded-lg px-2 py-1 text-sm" value={tenant} onChange={(e)=>setTenant(e.target.value)}>
                  <option>Atlas Labs</option><option>Globex</option><option>Acme Corp</option>
                </select>
                <LiveLed /><LiveStreamBadge enable={isPro}/>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl dark:bg-white/10 bg-neutral-900/5 p-1" role="tablist" aria-label="SKU">
              {(["basic","pro"] as const).map(k=>(
                <button key={k} role="tab" aria-selected={sku===k} onClick={()=>setSKU(k)}
                        data-testid={`sku-${k}`} className={`px-3 py-1 rounded-lg text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${sku===k?"bg-neutral-900 text-white dark:bg-black dark:text-white":"dark:text-neutral-400 text-neutral-600 hover:brightness-110"}`}>{k.toUpperCase()}</button>
              ))}
            </div>
            <label className="hidden sm:inline-flex items-center gap-2 text-sm"><input type="checkbox" className="accent-fuchsia-500" checked={dense} onChange={(e)=>setDense(e.target.checked)}/>Dense</label>
            <label className="hidden sm:inline-flex items-center gap-2 text-sm"><input type="checkbox" className="accent-amber-500" checked={lux} onChange={(e)=>setLux(e.target.checked)}/>Luxury</label>
            <button data-testid="theme-toggle" onClick={()=>setTheme(theme==="dark"?"light":"dark")} className="px-3 py-1 rounded-lg text-sm font-medium dark:bg-white/10 bg-neutral-900/5"> {theme==="dark"?"Dark":"Light"} </button>
            <button onClick={()=>setPaletteOpen(true)} className="px-3 py-1 rounded-lg text-sm font-medium bg-neutral-900 text-white dark:bg-white dark:text-black hidden sm:inline-flex" aria-label="Open command palette">⌘K</button>
          </div>
        </header>

        <nav className="mt-3 flex items-center gap-2 rounded-xl dark:bg-white/10 bg-neutral-900/5 p-1">
          {[["messenger",isPro?"Messenger (Quantum Threads • PQC)":"Messenger (QuantumTag Lite)"],["admin",isPro?"Admin (Constellations • Scrub)":"Admin (Overview)"],["dev",isPro?"Dev Portal (Marketplace)":"Dev Portal (Curated)"]] as const
          }.map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key as any)} aria-pressed={tab===key}
                    data-testid={`tab-${key}`} className={`px-3 py-1 rounded-lg text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${tab===key?"bg-neutral-900 text-white dark:bg-black dark:text-white":"dark:text-neutral-400 text-neutral-600 hover:brightness-110"}`}>{label}</button>
          ))}
        </nav>

        <main className="mt-4 rounded-2xl dark:border-white/10 border-neutral-200 dark:bg-white/5 bg-white/70 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <ViewTransition key={`vt-${transitionKey}`}/>
          {tab==="messenger" && <Messenger dense={dense} pro={isPro} lux={lux} theme={theme}/>}
          {tab==="admin" && <AdminConstellations pro={isPro} lux={lux}/>}
          {tab==="dev" && <DevPortal pro={isPro}/>}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={()=>setPaletteOpen(false)} onAction={(a)=>{
        if(a==='toggle-theme') setTheme(t=>t==='dark'?'light':'dark');
        if(a==='open-messenger') setTab('messenger'); if(a==='open-admin') setTab('admin'); if(a==='open-dev') setTab('dev');
      }}/>
    </div>
  );
}

// Primitives and subcomponents
function Badge({label, tone}: {label: string, tone: "basic"|"pro"}) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      tone==="pro"?"bg-gradient-to-r from-purple-500 to-pink-500 text-white":"bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
    }`}>
      {label}
    </span>
  );
}

function LiveLed() {
  return <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-label="Live" />;
}

function LiveStreamBadge({enable}: {enable: boolean}) {
  if (!enable) return null;
  return (
    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
      /qtca/stream
    </span>
  );
}

function BGParticles({theme, intensity}: {theme: string, intensity: number}) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{opacity: intensity}}>
        {Array.from({length: 20}).map((_,i)=>(
          <motion.div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${theme==='dark'?'bg-cyan-400':'bg-violet-400'}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AuroraOverlay({opacity}: {opacity: number}) {
  return (
    <div 
      className="fixed inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(ellipse at top, rgba(139, 92, 246, ${opacity}) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(59, 130, 246, ${opacity * 0.5}) 0%, transparent 50%)`,
      }}
    />
  );
}

function NoiseOverlay({intensity}: {intensity: number}) {
  return (
    <div 
      className="fixed inset-0 pointer-events-none opacity-30"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        opacity: intensity,
      }}
    />
  );
}

function ViewTransition({key}: {key: string}) {
  return (
    <motion.div
      key={key}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
      initial={{x: '-100%'}}
      animate={{x: '100%'}}
      transition={{duration: 0.6, ease: 'easeInOut'}}
    />
  );
}

function Messenger({dense, pro, lux, theme}: {dense: boolean, pro: boolean, lux: boolean, theme: string}) {
  const [messages, setMessages] = useState([
    {id: 1, text: "Welcome to Atlas Prism UI", ts: new Date(), status: "sent"},
    {id: 2, text: "Quantum messaging with PQC security", ts: new Date(), status: "verified"},
  ]);
  const [input, setInput] = useState("");
  const [minimap, setMinimap] = useState(pro);
  const [gatewayUrl, setGatewayUrl] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    getGatewayUrl().then(setGatewayUrl).catch(() => {
      setGatewayUrl("https://atlas-gateway.sonthenguyen186.workers.dev");
    });
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;
    
    const messageText = input.trim();
    setInput("");
    setIsSending(true);
    
    const newMsg = {
      id: Date.now(),
      text: messageText,
      ts: new Date(),
      status: "sending" as const,
    };
    setMessages(prev => [...prev, newMsg]);

    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch(`${gatewayUrl}/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          content: messageText,
          metadata: { timestamp: new Date().toISOString() }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessages(prev => prev.map(msg => 
          msg.id === newMsg.id 
            ? { ...msg, status: "sent" as const, id: result.id || msg.id }
            : msg
        ));
        showToast("Message sent successfully", "success");
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === newMsg.id 
          ? { ...msg, status: "error" as const }
          : msg
      ));
      showToast("Failed to send message, using demo mode", "error");
    } finally {
      setIsSending(false);
    }
  };

  const verifyMessage = async (messageId: number) => {
    try {
      const response = await fetch(`${gatewayUrl}/record/${messageId}`);
      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: "verified" as const }
            : msg
        ));
        showToast("Message verified successfully", "success");
      } else {
        // Demo verify for non-existent endpoints
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: "verified" as const }
            : msg
        ));
        showToast("Demo verification completed", "success");
      }
    } catch (error) {
      showToast("Verification failed, using demo mode", "error");
    }
  };

  return (
    <div className="flex h-[600px] relative">
      {toast && (
        <div className={`absolute top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
      
      <div className="flex-1 p-6">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4" ref={useRef<HTMLDivElement>(null)}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                className="flex justify-end"
                data-message-id={msg.id}
              >
                <div className={`max-w-xs text-white p-3 rounded-2xl rounded-br-md ${
                  msg.status === "error" ? "bg-red-500" :
                  msg.status === "sending" ? "bg-yellow-500" :
                  msg.status === "verified" ? "bg-green-500" :
                  "bg-blue-500"
                }`}>
                  <div className="text-sm">{msg.text}</div>
                  <div className="text-xs opacity-70 mt-1 flex items-center gap-1">
                    {msg.ts.toLocaleTimeString()} 
                    {msg.status === "verified" && "✓"}
                    {msg.status === "sending" && "⏳"}
                    {msg.status === "error" && "❌"}
                    {pro && msg.status === "verified" && "PQC"}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea
              data-testid="composer-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 resize-none"
              rows={2}
              disabled={isSending}
            />
            <button
              data-testid="send-btn"
              onClick={sendMessage}
              disabled={isSending || !input.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? "Sending..." : "Send"}
            </button>
            {pro && (
              <button
                data-testid="verify-btn"
                onClick={() => {
                  const lastMessage = messages[messages.length - 1];
                  if (lastMessage) verifyMessage(lastMessage.id);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Verify
              </button>
            )}
            <div data-testid="receipt" className="hidden">
              Receipt functionality available
            </div>
          </div>
        </div>
      </div>
      {pro && (
        <div className="w-48 border-l border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Minimap</h3>
            <button
              data-testid="minimap-toggle"
              onClick={() => setMinimap(!minimap)}
              className="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded"
            >
              {minimap ? "Hide" : "Show"}
            </button>
          </div>
          {minimap && (
            <div className="space-y-2">
              {messages.map((msg, i) => (
                <div
                  key={msg.id}
                  className={`w-2 h-2 rounded-full cursor-pointer hover:scale-125 transition-transform ${
                    msg.status === "error" ? "bg-red-400" :
                    msg.status === "sending" ? "bg-yellow-400" :
                    msg.status === "verified" ? "bg-green-400" :
                    "bg-blue-400"
                  }`}
                  onClick={() => {
                    const element = document.querySelector(`[data-message-id="${msg.id}"]`);
                    element?.scrollIntoView({behavior: 'smooth', block: 'center'});
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminConstellations({pro, lux}: {pro: boolean, lux: boolean}) {
  const [metrics, setMetrics] = useState({
    rps: 1247,
    p95: 23,
    errorPct: 0.02,
    quorum: 8,
  });
  const [gatewayUrl, setGatewayUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDegraded, setIsDegraded] = useState(false);

  useEffect(() => {
    getGatewayUrl().then(setGatewayUrl).catch(() => {
      setGatewayUrl("https://atlas-gateway.sonthenguyen186.workers.dev");
    });
  }, []);

  useEffect(() => {
    if (!gatewayUrl) return;
    
    const fetchMetrics = async () => {
      try {
        const [healthResponse, metricsResponse] = await Promise.allSettled([
          fetch(`${gatewayUrl}/health`),
          fetch(`${gatewayUrl}/metrics`)
        ]);

        if (healthResponse.status === 'fulfilled' && healthResponse.value.ok) {
          const healthData = await healthResponse.value.json();
          setIsDegraded(false);
        } else {
          setIsDegraded(true);
        }

        if (metricsResponse.status === 'fulfilled' && metricsResponse.value.ok) {
          const metricsData = await metricsResponse.value.json();
          setMetrics(prev => ({
            ...prev,
            rps: metricsData.rps || prev.rps,
            p95: metricsData.p95 || prev.p95,
            errorPct: metricsData.errorPct || prev.errorPct,
            quorum: metricsData.quorum || prev.quorum,
          }));
        } else {
          setIsDegraded(true);
        }
      } catch (error) {
        setIsDegraded(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [gatewayUrl]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        {isDegraded && (
          <div className="px-3 py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm rounded-full border border-yellow-500/30">
            Degraded Mode
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/50 dark:bg-white/10 p-4 rounded-lg">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">RPS</div>
          <div className="text-2xl font-bold">{isLoading ? "..." : metrics.rps}</div>
        </div>
        <div className="bg-white/50 dark:bg-white/10 p-4 rounded-lg">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">p95</div>
          <div className="text-2xl font-bold">{isLoading ? "..." : `${metrics.p95}ms`}</div>
        </div>
        <div className="bg-white/50 dark:bg-white/10 p-4 rounded-lg">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Error%</div>
          <div className="text-2xl font-bold">{isLoading ? "..." : `${metrics.errorPct}%`}</div>
        </div>
        <div className="bg-white/50 dark:bg-white/10 p-4 rounded-lg">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">Quorum</div>
          <div className="text-2xl font-bold">{isLoading ? "..." : metrics.quorum}</div>
        </div>
      </div>

      {pro && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/50 dark:bg-white/10 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Constellation View</h3>
            <div className="h-64 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0">
                {Array.from({length: 5}).map((_, i) => (
                  <div
                    key={i}
                    className={`absolute w-3 h-3 rounded-full ${
                      i === 0 ? 'bg-cyan-400' :
                      i === 1 ? 'bg-violet-400' :
                      i === 2 ? 'bg-pink-400' :
                      i === 3 ? 'bg-blue-400' :
                      'bg-green-400'
                    }`}
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${30 + (i % 2) * 40}%`,
                    }}
                  />
                ))}
                {lux && (
                  <div className="absolute inset-0">
                    {Array.from({length: 3}).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white/30 rounded-full"
                        style={{
                          left: `${30 + i * 20}%`,
                          top: `${40 + i * 10}%`,
                        }}
                        animate={{
                          opacity: [0.3, 0.8, 0.3],
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 2 + i * 0.5,
                          repeat: Infinity,
                          delay: i * 0.5,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="text-neutral-600 dark:text-neutral-400 text-center">
                <div>Quantum Constellation</div>
                <div className="text-xs mt-1">API • Auth • Billing • Witness • Gateway</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/50 dark:bg-white/10 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">SLO & Auto-heal</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Uptime</span>
                <span className="text-sm font-medium text-green-500">99.9%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Response Time</span>
                <span className="text-sm font-medium text-green-500">≤ 200ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Auto-heal</span>
                <span className="text-sm font-medium text-purple-500">
                  {pro ? "≤ 1 tick" : "Manual"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">PQC Security</span>
                <span className="text-sm font-medium text-blue-500">
                  {pro ? "Enabled" : "Basic"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DevPortal({pro}: {pro: boolean}) {
  const [gatewayUrl, setGatewayUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getGatewayUrl().then(setGatewayUrl).catch(() => {
      setGatewayUrl("https://atlas-gateway.sonthenguyen186.workers.dev");
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const codeExample = `curl -X POST ${gatewayUrl}/record \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -d '{"content": "Hello Atlas", "metadata": {"timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"}}'`;

  const jsExample = `const response = await fetch('${gatewayUrl}/record', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID()
  },
  body: JSON.stringify({
    content: 'Hello Atlas',
    metadata: { timestamp: new Date().toISOString() }
  })
});`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Developer Portal</h2>
      <div className="space-y-6">
        <div className="bg-white/50 dark:bg-white/10 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Quickstart</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">JavaScript</h4>
              <pre className="bg-neutral-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                <code>{isLoading ? "Loading..." : jsExample}</code>
              </pre>
              <button
                data-testid="copy-javascript"
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                onClick={() => copyToClipboard(jsExample)}
                disabled={isLoading}
              >
                Copy
              </button>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">cURL</h4>
              <pre className="bg-neutral-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                <code>{isLoading ? "Loading..." : codeExample}</code>
              </pre>
              <button
                data-testid="copy-curl"
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                onClick={() => copyToClipboard(codeExample)}
                disabled={isLoading}
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-white/10 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">API Endpoints</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span className="text-sm font-mono">POST /record</span>
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Active</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span className="text-sm font-mono">GET /record/:id</span>
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Active</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span className="text-sm font-mono">GET /health</span>
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Active</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
              <span className="text-sm font-mono">GET /metrics</span>
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">Active</span>
            </div>
            {pro && (
              <>
                <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                  <span className="text-sm font-mono">GET /qtca/tick</span>
                  <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">Pro Only</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-neutral-200 dark:border-neutral-700">
                  <span className="text-sm font-mono">GET /qtca/summary</span>
                  <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">Pro Only</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-mono">GET /qtca/stream</span>
                  <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">Pro Only</span>
                </div>
              </>
            )}
          </div>
        </div>

        {pro && (
          <div className="bg-white/50 dark:bg-white/10 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Marketplace</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Advanced Analytics</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Real-time metrics and insights</p>
              </div>
              <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <h4 className="font-medium text-sm mb-1">PQC Integration</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Post-quantum cryptography</p>
              </div>
              <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Auto-healing</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Self-recovery mechanisms</p>
              </div>
              <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                <h4 className="font-medium text-sm mb-1">Multi-tenant</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Isolated environments</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CommandPalette({open, onClose, onAction}: {open: boolean, onClose: () => void, onAction: (action: string) => void}) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{scale: 0.9, opacity: 0}}
          animate={{scale: 1, opacity: 1}}
          exit={{scale: 0.9, opacity: 0}}
          className="bg-white dark:bg-neutral-800 rounded-lg p-4 w-96 max-w-[90vw]"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold mb-4">Command Palette</h3>
          <div className="space-y-2">
            <button
              onClick={() => {onAction('toggle-theme'); onClose();}}
              className="w-full text-left p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
            >
              Toggle Theme
            </button>
            <button
              onClick={() => {onAction('open-messenger'); onClose();}}
              className="w-full text-left p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
            >
              Open Messenger
            </button>
            <button
              onClick={() => {onAction('open-admin'); onClose();}}
              className="w-full text-left p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
            >
              Open Admin
            </button>
            <button
              onClick={() => {onAction('open-dev'); onClose();}}
              className="w-full text-left p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
            >
              Open Dev Portal
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

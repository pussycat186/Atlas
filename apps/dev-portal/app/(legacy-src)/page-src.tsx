'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
// Removed getGatewayUrl import - using static URL
// import { CommandPalette, type Command } from '@atlas/design-system';
import { 
  Code, 
  Download, 
  Book, 
  Play, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight,
  Copy,
  ExternalLink
} from 'lucide-react';

const codeExamples = (gatewayUrl: string) => ({
  javascript: `// Install the Atlas SDK
npm install @atlas/fabric-client

// Initialize the client
import { AtlasClient } from '@atlas/fabric-client';

const client = new AtlasClient({
  gatewayUrl: '${gatewayUrl}',
  idempotencyKey: 'optional-key'
});

// Submit a record
const record = await client.submitRecord({
  content: 'Hello, Atlas!',
  metadata: { source: 'web-app' }
});

console.log('Record submitted:', record.id);
console.log('Receipt:', record.receipt);`,

  python: `# Install the Atlas SDK
pip install atlas-fabric-client

# Initialize the client
from atlas_fabric_client import AtlasClient

client = AtlasClient(
    gateway_url='${gatewayUrl}',
    idempotency_key='optional-key'
)

# Submit a record
record = client.submit_record({
    'content': 'Hello, Atlas!',
    'metadata': {'source': 'python-app'}
})

print(f'Record submitted: {record.id}')
print(f'Receipt: {record.receipt}')`,

  curl: `# Submit a record via REST API
curl -X POST ${gatewayUrl}/record \\
  -H "Content-Type: application/json" \\
  -H "X-Idempotency-Key: optional-key" \\
  -d '{
    "content": "Hello, Atlas!",
    "metadata": {"source": "curl"}
  }'

# Response includes receipt with witness quorum verification
{
  "id": "rec_1234567890",
  "receipt": {
    "hash": "sha256:abc123...",
    "quorum": {
      "n": 5,
      "q": 4,
      "witnesses": ["w1", "w2", "w3", "w4"],
      "skew": 45
    },
    "verifyResult": true
  }
}`
});

const features = [
  {
    title: 'Zero-Crypto Verification',
    description: 'No cryptographic knowledge required. Atlas handles all verification automatically.',
    icon: Shield,
    color: 'text-green-600'
  },
  {
    title: 'Multi-Witness Quorum',
    description: 'N=5, q=4 witness network ensures integrity with Δ≤2000ms consensus.',
    icon: CheckCircle,
    color: 'text-blue-600'
  },
  {
    title: 'Idempotent Operations',
    description: 'Built-in idempotency prevents duplicate processing and ensures reliability.',
    icon: Zap,
    color: 'text-purple-600'
  },
  {
    title: 'Real-time Monitoring',
    description: 'Comprehensive observability with traces, metrics, and health monitoring.',
    icon: Book,
    color: 'text-orange-600'
  }
];

const sdkDownloads = [
  {
    name: 'JavaScript/TypeScript',
    version: '1.0.0',
    size: '45KB',
    downloads: 'npm install @atlas/fabric-client',
    icon: '📦'
  },
  {
    name: 'Python',
    version: '1.0.0',
    size: '32KB',
    downloads: 'pip install atlas-fabric-client',
    icon: '🐍'
  },
  {
    name: 'REST API',
    version: '1.0.0',
    size: 'OpenAPI 3.0',
    downloads: 'Download Postman Collection',
    icon: '🌐'
  }
];

export default function DeveloperPortal() {
  const [selectedLanguage, setSelectedLanguage] = useState<'javascript' | 'python' | 'curl'>('javascript');
  const [copiedCode, setCopiedCode] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  const gatewayUrl = 'https://atlas-gateway.sonthenguyen186.workers.dev';
  
  const examples = codeExamples(gatewayUrl);

  // Command palette commands - temporarily disabled
  // const commands: Command[] = [
  //   {
  //     id: 'docs',
  //     title: 'View Documentation',
  //     description: 'Open the complete API documentation',
  //     icon: <Book className="h-4 w-4" />,
  //     action: () => window.location.href = '/docs',
  //     category: 'Navigation'
  //   },
  //   {
  //     id: 'sdk',
  //     title: 'SDK Reference',
  //     description: 'Browse SDK documentation and examples',
  //     icon: <Code className="h-4 w-4" />,
  //     action: () => window.location.href = '/sdk',
  //     category: 'Navigation'
  //   },
  //   {
  //     id: 'examples',
  //     title: 'Code Examples',
  //     description: 'View practical implementation examples',
  //     icon: <Play className="h-4 w-4" />,
  //     action: () => window.location.href = '/examples',
  //     category: 'Navigation'
  //   },
  //   {
  //     id: 'copy-js',
  //     title: 'Copy JavaScript Example',
  //     description: 'Copy the JavaScript/TypeScript code example',
  //     icon: <Copy className="h-4 w-4" />,
  //     action: () => {
  //       copyToClipboard(codeExamples.javascript);
  //     },
  //     category: 'Actions'
  //   },
  //   {
  //     id: 'copy-python',
  //     title: 'Copy Python Example',
  //     description: 'Copy the Python code example',
  //     icon: <Copy className="h-4 w-4" />,
  //     action: () => {
  //       copyToClipboard(codeExamples.python);
  //     },
  //     category: 'Actions'
  //   },
  //   {
  //     id: 'copy-curl',
  //     title: 'Copy cURL Example',
  //     description: 'Copy the cURL command example',
  //     icon: <Copy className="h-4 w-4" />,
  //     action: () => {
  //       copyToClipboard(codeExamples.curl);
  //     },
  //     category: 'Actions'
  //   }
  // ];

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Atlas Developer Portal</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => setCommandPaletteOpen(true)} aria-label="Open command palette" className="tap-24 focus-outline">
              <span className="sr-only">Open command palette</span>⌘K
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 space-y-12" data-testid="dev-portal" role="main" aria-label="Developer portal content">
      {/* Hero Section */}
      <section className="text-center" data-testid="hero-section">
        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100" data-testid="portal-title">
          Build Verifiable Applications
        </h2>
        <p className="text-lg mb-8 max-w-3xl mx-auto text-gray-700 dark:text-gray-300" data-testid="portal-description">
          Zero cryptographic knowledge required. Atlas provides multi-witness quorum verification and integrity guarantees.
        </p>
        <div className="flex justify-center space-x-4" data-testid="hero-buttons">
          <Button size="lg" data-testid="quick-start-button" aria-label="Start building with Atlas quickly">
            <Play className="h-5 w-5 mr-2" aria-hidden="true" />
            Quick Start
          </Button>
          <Button size="lg" variant="outline" data-testid="view-docs-button" aria-label="View documentation" className="tap-24 focus-outline">
            <Book className="h-5 w-5 mr-2" aria-hidden="true" />
            View Docs
          </Button>
          <Button size="lg" variant="outline" onClick={() => setCommandPaletteOpen(true)} data-testid="command-palette-button" aria-label="Open search command palette" className="tap-24 focus-outline">
            <span className="mr-2">⌘K</span>
            Search
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="features-grid">
        {features.map((feature) => (
          <Card key={feature.title} className="text-center" data-testid={`feature-card-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardContent className="pt-6">
              <feature.icon className={`h-12 w-12 mx-auto mb-4 text-[var(--primary)]`} />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100" data-testid="feature-title">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="feature-description">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Code Examples */}
      <Card data-testid="code-examples-card">
        <CardHeader>
          <CardTitle data-testid="code-examples-title">Quick Start Examples</CardTitle>
          <CardDescription data-testid="code-examples-description">
            Get started with Atlas in your preferred language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Language Tabs */}
            <div className="flex space-x-2 border-b" data-testid="language-tabs" role="tablist" aria-label="Code example language selection">
              {Object.keys(examples).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang as keyof typeof examples)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    selectedLanguage === lang
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  data-testid={`language-tab-${lang}`}
                  aria-label={`Switch to ${lang === 'javascript' ? 'JavaScript/TypeScript' : lang === 'python' ? 'Python' : 'cURL'} code example`}
                  aria-selected={selectedLanguage === lang}
                  role="tab"
                  tabIndex={selectedLanguage === lang ? 0 : -1}
                >
                  {lang === 'javascript' ? 'JavaScript/TypeScript' : 
                   lang === 'python' ? 'Python' : 'cURL'}
                </button>
              ))}
            </div>

            {/* Code Block with View Transition */}
            <div className="relative" role="tabpanel" aria-label={`${selectedLanguage === 'javascript' ? 'JavaScript/TypeScript' : selectedLanguage === 'python' ? 'Python' : 'cURL'} code example`}>
              <div 
                className="bg-gray-900 rounded-lg p-4 overflow-x-auto transition-all duration-500 group"
                style={{
                  viewTransitionName: `code-block-${selectedLanguage}`
                }}
              >
                <pre className="text-sm text-gray-100">
                  <code className="transition-all duration-300">{examples[selectedLanguage]}</code>
                </pre>
                {/* Code execution indicator */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center space-x-1 text-green-400 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Ready to run</span>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 hover:scale-105"
                onClick={() => copyToClipboard(examples[selectedLanguage])}
                aria-label="Copy code to clipboard"
                data-testid={selectedLanguage === 'javascript' ? 'copy-javascript' : selectedLanguage === 'curl' ? 'copy-curl' : 'copy-python'}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedCode ? 'Copied!' : 'Copy'}
              </Button>
              {/* Run button for quickstart */}
              <Button
                size="sm"
                className="absolute bottom-2 right-2 bg-green-600 hover:bg-green-700 text-white transition-all duration-300 hover:scale-105"
                onClick={() => {
                  // Simulate code execution
                  console.log('Running code:', selectedLanguage);
                  // In a real app, this would execute the code
                }}
                aria-label="Run code example"
              >
                <Play className="h-4 w-4 mr-2" />
                Run
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SDK Downloads */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">SDK Downloads</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sdkDownloads.map((sdk) => (
            <Card key={sdk.name} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{sdk.icon}</span>
                    <div>
                      <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{sdk.name}</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">v{sdk.version} • {sdk.size}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" role="status" aria-label="Latest version">Latest</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-gray-100 rounded p-3 font-mono text-sm">
                    {sdk.downloads}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label={`Download ${sdk.name} SDK`}>
                      <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline" className="tap-24 focus-outline" aria-label={`View ${sdk.name} documentation`}>
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">View documentation</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* API Reference */}
      <Card>
        <CardHeader>
          <CardTitle>API Reference</CardTitle>
          <CardDescription>
            Complete REST API documentation and schema references
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Core Endpoints</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <code className="text-sm font-mono">POST /record</code>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Submit a new record</p>
                  </div>
                  <Badge variant="outline" role="status" aria-label="HTTP POST method">POST</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <code className="text-sm font-mono">GET /record/:id</code>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Retrieve a record</p>
                  </div>
                  <Badge variant="outline" role="status" aria-label="HTTP GET method">GET</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <code className="text-sm font-mono">GET /health</code>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Service health check</p>
                  </div>
                  <Badge variant="outline" role="status" aria-label="HTTP GET method">GET</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <code className="text-sm font-mono">GET /metrics</code>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Prometheus metrics</p>
                  </div>
                  <Badge variant="outline" role="status" aria-label="HTTP GET method">GET</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Evidence Format</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-xs text-gray-700 overflow-x-auto">
{`{
  "messageId": "rec_1234567890",
  "content": "Hello, Atlas!",
  "timestamp": "2024-01-01T00:00:00Z",
  "receipt": {
    "hash": "sha256:abc123...",
    "quorum": {
      "n": 5,
      "q": 4,
      "witnesses": ["w1", "w2", "w3", "w4"],
      "skew": 45
    },
    "verifyResult": true
  },
  "integrityTimeline": {
    "sent": "2024-01-01T00:00:00Z",
    "witnessed": "2024-01-01T00:00:01Z",
    "verified": "2024-01-01T00:00:02Z"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What/Why/Verify/Rollback */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Atlas provides verifiable message integrity through multi-witness quorum consensus 
              without requiring cryptographic knowledge from developers.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Why</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Traditional messaging lacks verifiable integrity guarantees. Atlas ensures 
              message authenticity and prevents tampering through distributed witness verification.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verify</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Every message includes a receipt with witness signatures, timestamps, and 
              integrity proofs that can be independently verified by any party.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rollback</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              In case of issues, Atlas provides complete audit trails and evidence packages 
              for forensic analysis and potential rollback procedures.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="text-center py-12">
          <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-4">
            Ready to build with Atlas?
          </h2>
          <p className="text-blue-700 dark:text-blue-300 mb-6 max-w-2xl mx-auto">
            Join developers building verifiable applications with zero cryptographic complexity. 
            Get started in minutes with our comprehensive SDKs and documentation.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" aria-label="Start building verifiable applications with Atlas">
              <Code className="h-5 w-5 mr-2" aria-hidden="true" />
              Start Building
              <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
            </Button>
            <Button size="lg" variant="outline" className="focus-outline tap-24" aria-label="Read documentation">
              <Book className="h-5 w-5 mr-2" aria-hidden="true" />
              Read Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
      </main>

      {/* Command Palette - temporarily disabled */}
      {/* <CommandPalette
        commands={commands}
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        placeholder="Search documentation, examples, or run commands..."
      /> */}
    </div>
  );
}


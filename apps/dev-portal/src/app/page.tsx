'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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

const codeExamples = {
  javascript: `// Install the Atlas SDK
npm install @atlas/fabric-client

// Initialize the client
import { AtlasClient } from '@atlas/fabric-client';

const client = new AtlasClient({
  gatewayUrl: 'http://localhost:3000',
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
    gateway_url='http://localhost:3000',
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
curl -X POST http://localhost:3000/record \\
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
};

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
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Atlas Developer Portal
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Build verifiable applications with zero cryptographic knowledge. 
          Atlas provides multi-witness quorum verification and integrity guarantees.
        </p>
        <div className="flex justify-center space-x-4">
          <Button size="lg" className="bg-atlas-600 hover:bg-atlas-700">
            <Play className="h-5 w-5 mr-2" />
            Quick Start
          </Button>
          <Button size="lg" variant="outline">
            <Book className="h-5 w-5 mr-2" />
            View Docs
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <Card key={feature.title} className="text-center">
            <CardContent className="pt-6">
              <feature.icon className={`h-12 w-12 mx-auto mb-4 ${feature.color}`} />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Examples</CardTitle>
          <CardDescription>
            Get started with Atlas in your preferred language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Language Tabs */}
            <div className="flex space-x-2 border-b">
              {Object.keys(codeExamples).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang as keyof typeof codeExamples)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    selectedLanguage === lang
                      ? 'border-atlas-600 text-atlas-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {lang === 'javascript' ? 'JavaScript/TypeScript' : 
                   lang === 'python' ? 'Python' : 'cURL'}
                </button>
              ))}
            </div>

            {/* Code Block */}
            <div className="relative">
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{codeExamples[selectedLanguage]}</code>
                </pre>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 bg-gray-800 text-white hover:bg-gray-700"
                onClick={() => copyToClipboard(codeExamples[selectedLanguage])}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedCode ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SDK Downloads */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">SDK Downloads</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sdkDownloads.map((sdk) => (
            <Card key={sdk.name} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{sdk.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{sdk.name}</CardTitle>
                      <CardDescription>v{sdk.version} • {sdk.size}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">Latest</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-gray-100 rounded p-3 font-mono text-sm">
                    {sdk.downloads}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4" />
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
              <h3 className="text-lg font-semibold">Core Endpoints</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <code className="text-sm font-mono">POST /record</code>
                    <p className="text-xs text-gray-500">Submit a new record</p>
                  </div>
                  <Badge variant="outline">POST</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <code className="text-sm font-mono">GET /record/:id</code>
                    <p className="text-xs text-gray-500">Retrieve a record</p>
                  </div>
                  <Badge variant="outline">GET</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <code className="text-sm font-mono">GET /health</code>
                    <p className="text-xs text-gray-500">Service health check</p>
                  </div>
                  <Badge variant="outline">GET</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <code className="text-sm font-mono">GET /metrics</code>
                    <p className="text-xs text-gray-500">Prometheus metrics</p>
                  </div>
                  <Badge variant="outline">GET</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Evidence Format</h3>
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
            <p className="text-sm text-gray-600">
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
            <p className="text-sm text-gray-600">
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
            <p className="text-sm text-gray-600">
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
            <p className="text-sm text-gray-600">
              In case of issues, Atlas provides complete audit trails and evidence packages 
              for forensic analysis and potential rollback procedures.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <Card className="bg-atlas-50 border-atlas-200">
        <CardContent className="text-center py-12">
          <h2 className="text-2xl font-bold text-atlas-900 mb-4">
            Ready to build with Atlas?
          </h2>
          <p className="text-atlas-700 mb-6 max-w-2xl mx-auto">
            Join developers building verifiable applications with zero cryptographic complexity. 
            Get started in minutes with our comprehensive SDKs and documentation.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" className="bg-atlas-600 hover:bg-atlas-700">
              <Code className="h-5 w-5 mr-2" />
              Start Building
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline">
              <Book className="h-5 w-5 mr-2" />
              Read Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


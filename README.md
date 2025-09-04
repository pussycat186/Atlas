# Atlas Secure Fabric

> **Zero-crypto messaging and storage platform with multi-witness quorum consensus**

[![CI](https://github.com/pussycat186/Atlas/actions/workflows/ci.yml/badge.svg)](https://github.com/pussycat186/Atlas/actions/workflows/ci.yml)
[![Deploy](https://github.com/pussycat186/Atlas/actions/workflows/deploy.yml/badge.svg)](https://github.com/pussycat186/Atlas/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Mission

Atlas is a revolutionary messaging and storage platform that provides cryptographic-grade security **without traditional cryptography**. Instead, it uses:

- **Multi-witness quorum consensus** (4-of-5 witnesses)
- **Time diversity** (timestamp skew ≤ 2000ms)
- **Distributed audit** (public append-only ledgers)

## 🏗️ Architecture

### Core Components

```
Atlas/
├── apps/
│   ├── web/                # Next.js chat & drive UI
│   └── admin/              # Admin dashboard & monitoring
├── services/
│   ├── gateway/            # API orchestrator
│   ├── witness-node/       # Core witness service
│   ├── chat/               # Messaging service
│   └── drive/              # Storage service
├── packages/
│   ├── fabric-client/      # SDK for quorum verification
│   └── fabric-protocol/    # Protocol schemas & types
└── infra/
    ├── docker/             # Containerization
    ├── k8s/                # Kubernetes deployment
    └── ci/                 # CI/CD workflows
```

### Security Model

- **Track-Z (Zero-Crypto)**: Default mode with no traditional cryptography
- **Track-L (Crypto-lite)**: Optional internal hashing + MACs between witnesses
- **Quorum Parameters**: N=5 witnesses, q=4 quorum, Δ=2000ms max skew

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/pussycat186/Atlas.git
   cd Atlas
   pnpm install
   ```

2. **Start the development environment:**
   ```bash
   # Start all services with Docker Compose
   docker-compose up -d
   
   # Or start individual services for development
   pnpm dev
   ```

3. **Access the applications:**
   - **Web App**: http://localhost:3006
   - **Admin Dashboard**: http://localhost:3007
   - **Gateway API**: http://localhost:3000
   - **Witness Nodes**: http://localhost:3001-3005

### Using the SDK

```typescript
import { AtlasFabricClient } from '@atlas/fabric-client';

const client = new AtlasFabricClient('http://localhost:3000');

// Submit a record
const result = await client.submitRecord('chat', 'msg_123', 'Hello World!', {
  room_id: 'general',
  user_id: 'alice'
});

// Verify integrity
if (result.ok) {
  console.log(`Integrity: VERIFIED q=${result.quorum_count}/4 Δ=${result.max_skew_ms}ms`);
} else {
  console.log('Integrity: CONFLICT');
}
```

## 📡 API Reference

### Gateway API

#### Submit Record
```http
POST /api/records
Content-Type: application/json

{
  "app": "chat|drive",
  "record_id": "uuid",
  "payload": "data",
  "meta": { "room_id": "123" }
}
```

#### Verify Record
```http
GET /api/records/{record_id}/verify
```

#### Get Conflicts
```http
GET /api/conflicts?since=2025-01-01&status=open
```

### Witness API

#### Submit to Witness
```http
POST /witness/record
Content-Type: application/json

{
  "app": "chat|drive",
  "record_id": "uuid",
  "payload": "data",
  "meta": {}
}
```

#### Get Ledger
```http
GET /witness/ledger?since=2025-01-01&limit=100
```

## 🔧 Configuration

### Environment Variables

#### Gateway
- `PORT`: Gateway port (default: 3000)
- `HOST`: Gateway host (default: 0.0.0.0)

#### Witness Node
- `WITNESS_ID`: Unique witness identifier (e.g., w1, w2)
- `WITNESS_REGION`: Geographic region (e.g., us-east-1)
- `PORT`: Witness port (default: 3001)
- `SECURITY_TRACK`: Security mode Z or L (default: Z)
- `DATA_DIR`: Ledger storage directory (default: ./data)

#### Web Applications
- `NEXT_PUBLIC_GATEWAY_URL`: Gateway endpoint URL

### Fabric Configuration

```typescript
const config = {
  total_witnesses: 5,
  quorum_size: 4,
  max_timestamp_skew_ms: 2000,
  witnesses: [
    { witness_id: 'w1', endpoint: 'http://witness-1:3001', region: 'us-east-1' },
    { witness_id: 'w2', endpoint: 'http://witness-2:3001', region: 'us-west-2' },
    // ... more witnesses
  ],
  security_track: 'Z'
};
```

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### Integration Tests
```bash
pnpm test:integration
```

### Chaos Tests
```bash
pnpm test:chaos
```

### Load Testing
```bash
# Test quorum under load
pnpm test:load --witnesses=5 --quorum=4 --duration=300s
```

## 🚢 Deployment

### Docker Compose
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes
```bash
# Deploy with Helm
helm install atlas ./infra/k8s/atlas

# Deploy witness nodes across regions
helm install atlas-witnesses ./infra/k8s/witness-nodes
```

### Multi-Region Setup

1. **Deploy witness nodes in 5 regions:**
   - US East (us-east-1)
   - US West (us-west-2)
   - EU West (eu-west-1)
   - AP Southeast (ap-southeast-1)
   - AP Northeast (ap-northeast-1)

2. **Configure gateway to connect to all witnesses**

3. **Set up ledger mirroring to S3/IPFS**

## 📊 Monitoring

### Admin Dashboard

Access the admin dashboard at `/admin-dashboard` to monitor:

- **System Metrics**: Latency, quorum rate, conflict rate
- **Witness Health**: Status, performance, region distribution
- **Conflicts**: Real-time conflict detection and resolution
- **Timestamp Skew**: Heatmap of witness timing differences

### Key Metrics

- **Quorum Rate**: Percentage of successful quorum consensus
- **Conflict Rate**: Rate of witness disagreements
- **Latency**: P50, P95, P99 response times
- **Witness Health**: Individual witness status and performance

## 🔍 Troubleshooting

### Common Issues

#### Witness Node Not Responding
```bash
# Check witness health
curl http://witness-1:3001/witness/health

# Check logs
docker logs atlas-witness-1
```

#### Quorum Failures
```bash
# Check witness status
curl http://gateway:3000/api/witnesses/status

# Verify timestamp skew
curl http://gateway:3000/admin/metrics
```

#### Conflict Resolution
```bash
# List open conflicts
curl http://gateway:3000/api/conflicts?status=open

# Resolve conflict
curl -X POST http://gateway:3000/admin/conflicts/{id}/resolve \
  -H "Content-Type: application/json" \
  -d '{"method": "manual", "chosen_attestation_id": "w1", "reason": "Manual resolution"}'
```

### Debug Mode

Enable debug logging:
```bash
export DEBUG=atlas:*
pnpm dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Use conventional commits
- Write tests for new features
- Update documentation
- Follow the existing code style
- Ensure all CI checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by distributed systems research
- Built with modern web technologies
- Designed for zero-trust environments

## 📞 Support

- **Documentation**: [docs.atlas.dev](https://docs.atlas.dev)
- **Issues**: [GitHub Issues](https://github.com/pussycat186/Atlas/issues)
- **Discussions**: [GitHub Discussions](https://github.com/pussycat186/Atlas/discussions)
- **Discord**: [Atlas Community](https://discord.gg/atlas)

---

**Atlas Secure Fabric** - *Security through consensus, not cryptography*

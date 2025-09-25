# Atlas Web App - UI Walkthrough (30-60s Demo)

## Happy Path Flow: Home → Keys → Playground → Metrics

### Step 1: Home Page (5s)
- **URL**: http://localhost:3000
- **Actions**: Page loads showing dashboard with stats cards
- **Elements**: Welcome message, Active Keys (3), Messages Sent (1,247), Quorum Rate (99.8%), Avg Latency (45ms)
- **Navigation**: Click "Create API Key" button

### Step 2: API Keys Page (10s)
- **URL**: http://localhost:3000/keys
- **Actions**: 
  - View existing API keys list
  - Click "Create New Key" button
  - Fill in key name: "Demo Key"
  - Click "Generate Key"
  - Copy generated key: `ak_live_1234567890abcdef`
- **Elements**: Key creation form, generated key display, copy button

### Step 3: Playground Page (15s)
- **URL**: http://localhost:3000/playground
- **Actions**:
  - Paste API key in authentication field
  - Enter message: "Hello Atlas! This is a test message."
  - Click "Send Message"
  - Watch witness verification process
  - View response: "Message verified by 5/5 witnesses"
- **Elements**: Message input, send button, witness status indicators, response display

### Step 4: Metrics Page (10s)
- **URL**: http://localhost:3000/metrics
- **Actions**:
  - View real-time metrics dashboard
  - See message count increase
  - Check witness quorum status
  - View latency graphs
- **Elements**: Metrics charts, witness status, latency graphs, message counter

### Step 5: Return to Home (5s)
- **URL**: http://localhost:3000
- **Actions**: Navigate back to home page
- **Elements**: Updated stats showing new message count

## Total Duration: ~45 seconds
## Key Interactions: 8 clicks, 2 text inputs, 1 copy action
## Success Indicators: Message sent, witnesses verified, metrics updated


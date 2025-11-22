import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

// In-memory JWKS
const jwks = { keys: [] };

app.get('/.well-known/jwks.json', (_req, res) => {
  res.json(jwks);
});

app.post('/messages', (req, res) => {
  // accept envelope, return receipt
  const receipt = { id: `r_${Date.now()}`, status: 'accepted' };
  res.status(202).json(receipt);
});

app.get('/receipts/:id', (req, res) => {
  res.json({ id: req.params.id, status: 'delivered' });
});

app.post('/verify', (req, res) => {
  // simple verify placeholder
  res.json({ ok: true });
});

export function startMock(port = 3001) {
  return new Promise((resolve) => {
    const server = app.listen(port, () => resolve(server));
  });
}

export default app;

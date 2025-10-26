import 'dotenv/config';
import express from 'express';
import { json } from 'express';
import path from 'path';

// We'll load the API handler dynamically so we can capture and log initialization errors (e.g. Prisma client issues)
let handler: any = null;
try {
  const mod: any = await import('../api/proxy.ts');
  handler = mod && (mod.default || mod.handler || mod);
} catch (err: any) {
  console.error('Failed to import API handler:', err && (err.stack || err.message || err));
  // Exit: without the handler the local API cannot function
  process.exit(1);
}

const app = express();
app.use(json());

app.post('/api', async (req, res) => {
  try {
    const request = new Request('http://localhost/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const response = await handler(request as any);
    const text = await response.text();
    const headers: Record<string, string> = {};
    for (const [k, v] of response.headers.entries()) headers[k] = String(v);
    res.status(response.status).set(headers).send(text);
  } catch (err: any) {
    console.error('Local API Error:', err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.LOCAL_API_PORT || 9000;
app.listen(port, () => console.log(`Local API (ts) listening on http://localhost:${port}`));

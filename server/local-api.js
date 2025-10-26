const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Load compiled proxy (CommonJS)
const proxy = require(path.resolve(__dirname, '../.tmp_api_cjs/api/proxy.js'));
const handler = proxy && proxy.default ? proxy.default : proxy;

const app = express();
app.use(bodyParser.json());

app.post('/api', async (req, res) => {
  try {
    // Create a global-like Request for the handler
    const request = new Request('http://localhost/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const response = await handler(request);
    const text = await response.text();
    res.status(response.status).set(Object.fromEntries(response.headers)).send(text);
  } catch (err) {
    console.error('Local API Error:', err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.LOCAL_API_PORT || 4000;
app.listen(port, () => console.log(`Local API server listening on http://localhost:${port}`));

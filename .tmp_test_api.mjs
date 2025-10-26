import { readFile } from 'fs/promises';
import path from 'path';

// Node 18+ required (fetch and Request available)
const apiPath = path.resolve('./api/proxy.ts');
const fileUrl = `file://${apiPath}`;
const mod = await import(fileUrl);
const handler = mod.default;

const req = new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getAllUsers', payload: {} }) });

const res = await handler(req);
const text = await res.text();
console.log('Status:', res.status);
console.log('Body:', text);

import handler from './api/proxy';

const req = new Request('http://localhost/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'getAllUsers', payload: {} }) });

(async () => {
  const res = await handler(req as any);
  const body = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', body);
})();

we move import handler from './api/proxy.ts';

async function call(action: string, payload = {}) {
  const req = new Request('http://local/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload }) });
  const res = await handler(req as any);
  const text = await res.text();
  console.log('ACTION:', action);
  console.log('STATUS:', res.status);
  try { console.log('BODY:', JSON.parse(text)); } catch { console.log('BODY:', text); }
  console.log('---');
}

(async () => {
  await call('getAllUsers');
  await call('registerUser', { userData: { name: 'Test User', address: 'Test', phoneNumber: '9999999', password: 'pass' } });
  await call('getAllUsers');
})();

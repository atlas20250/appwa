const handler = require('./.tmp_api_cjs/api/proxy.cjs');

async function call(action, payload={}){
  const req = new Request('http://local/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, payload }) });
  const res = await handler(req);
  const text = await res.text();
  console.log('ACTION:', action);
  console.log('STATUS:', res.status);
  try { console.log('BODY:', JSON.parse(text)); } catch(e){ console.log('BODY:', text); }
  console.log('---');
}

(async ()=>{
  await call('getAllUsers');
  await call('registerUser', { userData: { name: 'Local Test', address: 'Local', phoneNumber: '9999998', password: 'pass' } });
  await call('getAllUsers');
})();

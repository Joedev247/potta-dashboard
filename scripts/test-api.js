const fs = require('fs');
const path = require('path');
const { URL } = require('url');

function readEnvBaseUrl() {
  try {
    const envPath = path.resolve(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return 'https://payments.dev.instanvi.com';
    const txt = fs.readFileSync(envPath, 'utf8');
    const m = txt.match(/^NEXT_PUBLIC_API_BASE_URL=(.+)$/m);
    if (m) return m[1].trim();
  } catch (e) {
    // ignore
  }
  return 'https://payments.dev.instanvi.com';
}

const BASE = readEnvBaseUrl();
const endpoints = [
  { method: 'OPTIONS', path: '/api/auth/sign-up' },
  { method: 'POST', path: '/api/auth/sign-up', body: { email: 'probe@example.com', password: 'Probe123!' } },
  { method: 'GET', path: '/api/reports/payments?format=JSON' },
  { method: 'GET', path: '/api/balances' },
  { method: 'GET', path: '/api/admin/logs' },
  { method: 'GET', path: '/' },
];

const controllerTimeout = (ms) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, clear: () => clearTimeout(t) };
};

(async function run() {
  console.log('Probing API base URL:', BASE);

  for (const e of endpoints) {
    const url = new URL(e.path, BASE).toString();
    process.stdout.write(`${e.method} ${url} ... `);
    try {
      const ctx = controllerTimeout(7000);
      const opts = { method: e.method, signal: ctx.signal, headers: { 'Accept': 'application/json' } };
      if (e.body) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(e.body);
      }
      const res = await fetch(url, opts);
      ctx.clear();
      console.log(`${res.status} ${res.statusText}`);
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const j = await res.json();
          console.log('  Response (json):', JSON.stringify(j).slice(0, 400));
        } else {
          const t = await res.text();
          console.log('  Response (text):', t.slice(0, 400));
        }
      } catch (e) {
        console.log('  (no body)');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('TIMEOUT');
      } else {
        console.log('ERROR -', err.message || String(err));
      }
    }
  }

  console.log('\nProbe complete.');
})();

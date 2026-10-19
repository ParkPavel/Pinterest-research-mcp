import 'dotenv/config';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { exchangeToken, saveTokens } from './pinterest.js';

const redirect = process.env.PINTEREST_REDIRECT_URI ?? 'http://127.0.0.1:8765/callback';
const uri = new URL(redirect);
if (!['127.0.0.1','localhost'].includes(uri.hostname) || uri.protocol !== 'http:' || uri.pathname !== '/callback')
  throw new Error('Local OAuth callback must be http://127.0.0.1:8765/callback');
if (!process.env.PINTEREST_APP_ID) throw new Error('Set PINTEREST_APP_ID in .env');
const state = randomBytes(24).toString('hex');
const scopes = process.env.PINTEREST_SCOPES ?? 'boards:read,pins:read,user_accounts:read';
const login = new URL('https://www.pinterest.com/oauth/');
for (const [key, value] of Object.entries({
  client_id: process.env.PINTEREST_APP_ID, redirect_uri: redirect, response_type: 'code', scope: scopes, state
})) login.searchParams.set(key, value);

const server = createServer(async (req, res) => {
  if (!req.url?.startsWith('/callback')) { res.writeHead(404).end(); return; }
  const params = new URL(req.url, redirect).searchParams;
  if (params.get('state') !== state) { res.writeHead(403).end('Invalid OAuth state'); return; }
  if (params.has('error')) { res.writeHead(400).end('Authorization denied'); return; }
  const code = params.get('code');
  if (!code) { res.writeHead(400).end('Missing code'); return; }
  try {
    const tokens = await exchangeToken(new URLSearchParams({grant_type:'authorization_code', code, redirect_uri:redirect}));
    await saveTokens(tokens);
    res.writeHead(200, {'Content-Type':'text/plain; charset=utf-8'}).end('Pinterest connected. Close this tab.');
    console.log('Pinterest authorization successful.');
  } catch (error) {
    console.error(error);
    res.writeHead(500).end('Authorization failed. Check terminal.');
  } finally {
    setTimeout(() => server.close(), 1000).unref();
  }
});
server.listen(Number(uri.port || 80), uri.hostname, () => {
  console.log('Open this URL to authorize Pinterest:\n' + login.toString());
});

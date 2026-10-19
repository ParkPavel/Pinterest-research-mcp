import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { READ_SCOPES } from './pinterest.js';

type Options = {
  redirect: string; appId: string;
  connect: (code: string, redirect: string) => Promise<void>;
  now?: () => number; ttlMs?: number;
};
export function validateLocalRedirect(redirect: string): URL {
  const uri = new URL(redirect);
  if (!['127.0.0.1', 'localhost'].includes(uri.hostname) || uri.protocol !== 'http:' ||
      uri.pathname !== '/callback' || uri.username || uri.password || uri.search || uri.hash ||
      !uri.port || Number(uri.port) < 1024)
    throw new Error('Use an explicit loopback HTTP port >=1024 and /callback, without query or fragment');
  return uri;
}
export function createLocalOAuth(options: Options) {
  const uri = validateLocalRedirect(options.redirect), now = options.now ?? Date.now;
  const expires = now() + (options.ttlMs ?? 5 * 60 * 1000);
  const state = randomBytes(32).toString('hex');
  let consumed = false;
  const login = new URL('https://www.pinterest.com/oauth/');
  for (const [key, value] of Object.entries({ client_id: options.appId, redirect_uri: options.redirect,
    response_type: 'code', scope: READ_SCOPES.join(','), state })) login.searchParams.set(key, value);
  async function handler(req: IncomingMessage, res: ServerResponse) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }).end('Method not allowed'); return; }
    if (req.headers.host !== uri.host) { res.writeHead(403).end('Invalid callback host'); return; }
    let incoming: URL;
    try { incoming = new URL(req.url ?? '/', uri.origin); }
    catch { res.writeHead(400).end('Invalid callback URL'); return; }
    if (incoming.origin !== uri.origin || incoming.pathname !== '/callback') { res.writeHead(404).end(); return; }
    const params = incoming.searchParams;
    const supplied = Buffer.from(params.get('state') ?? '');
    const expected = Buffer.from(state);
    if (consumed || now() >= expires || params.getAll('state').length !== 1 ||
        supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      res.writeHead(403).end('Invalid or expired OAuth state'); return;
    }
    if (params.has('error')) { consumed = true; res.writeHead(400).end('Authorization denied. Start a new login.'); return; }
    const code = params.get('code');
    if (!code || code.length > 4096 || params.getAll('code').length !== 1) { res.writeHead(400).end('Missing or invalid code'); return; }
    consumed = true; // Consume before any async exchange, including failed exchanges.
    try {
      await options.connect(code, options.redirect);
      res.writeHead(200).end('Pinterest connected. Close this tab.');
    } catch { res.writeHead(502).end('Authorization failed. Start a new login. No sensitive details were logged.'); }
  }
  const server = createServer((req, res) => {
    res.once('finish', () => { if (consumed) server.close(); });
    void handler(req, res).catch(() => {
      if (!res.headersSent) res.writeHead(500);
      res.end('Authorization failed. Start a new login.');
    });
  });
  return { handler, loginUrl: login.toString(), server };
}

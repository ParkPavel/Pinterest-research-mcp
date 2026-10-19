import 'dotenv/config';
import { createLocalClient } from './pinterest.js';
import { createLocalOAuth } from './local-oauth.js';
import { publicError } from './errors.js';

try {
  const redirect = process.env.PINTEREST_REDIRECT_URI ?? 'http://127.0.0.1:8765/callback';
  const appId = process.env.PINTEREST_APP_ID;
  if (!appId) throw new Error();
  const client = createLocalClient();
  const { server, loginUrl } = createLocalOAuth({ redirect, appId, connect: (code, uri) => client.connect('local', code, uri) });
  const uri = new URL(redirect);
  server.requestTimeout = 25000;
  server.headersTimeout = 10000;
  server.on('error', () => { console.error('Unable to start the local OAuth callback. Check the configured loopback port.'); process.exitCode = 1; });
  server.listen(Number(uri.port), uri.hostname, () => { console.log('Open this URL to authorize Pinterest:\n' + loginUrl); });
  const deadline = setTimeout(() => { server.close(); server.closeAllConnections(); }, 5 * 60 * 1000);
  deadline.unref();
  server.on('close', () => clearTimeout(deadline));
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { server.close(); server.closeAllConnections(); });
} catch (error) { console.error(publicError(error)); process.exitCode = 1; }

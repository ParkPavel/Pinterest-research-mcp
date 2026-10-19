import 'dotenv/config';
import { EncryptedFileTokenStore, type TokenStore, type Tokens } from './token-store.js';
import { PinterestError } from './errors.js';
export type { Tokens } from './token-store.js';
export const READ_SCOPES = ['boards:read', 'pins:read', 'user_accounts:read'] as const;
const API = 'https://api.pinterest.com/v5';
type Options = { appId: string; appSecret: string; fetch?: typeof fetch; now?: () => number };

async function readJson(response: Response): Promise<Record<string, any>> {
  const reader = response.body?.getReader();
  if (!reader) throw new PinterestError('INVALID_RESPONSE');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 2 * 1024 * 1024) throw new Error();
      chunks.push(value);
    }
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, any>;
  } catch { throw new PinterestError('INVALID_RESPONSE'); }
  finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}
async function request(fetcher: typeof fetch, url: string | URL, options: RequestInit): Promise<Response> {
  try { return await fetcher(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(20000) }); }
  catch { throw new PinterestError('UPSTREAM_UNAVAILABLE'); }
}
export class PinterestClient {
  private readonly fetcher: typeof fetch;
  private readonly now: () => number;
  private readonly locks = new Map<string, Promise<void>>();
  constructor(private readonly store: TokenStore, private readonly options: Options) {
    this.fetcher = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
  }
  // One client owns each store within a single process. Replicas need DB locks/CAS.
  private async exclusive<T>(subject: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(subject) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>(resolve => { release = resolve; });
    this.locks.set(subject, current);
    await previous;
    try { return await operation(); }
    finally { release(); if (this.locks.get(subject) === current) this.locks.delete(subject); }
  }
  async exchange(form: URLSearchParams): Promise<Tokens> {
    if (!this.options.appId || !this.options.appSecret) throw new PinterestError('AUTH_REQUIRED');
    const response = await request(this.fetcher, `${API}/oauth/token`, {
      method: 'POST', headers: {
        Authorization: `Basic ${Buffer.from(`${this.options.appId}:${this.options.appSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }, body: form
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new PinterestError(response.status === 400 || response.status === 401 ? 'AUTH_EXPIRED' :
        response.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_UNAVAILABLE');
    }
    const t = await readJson(response);
    if (typeof t.access_token !== 'string' || !t.access_token || t.access_token.length > 16384 ||
        !Number.isFinite(t.expires_in) || t.expires_in <= 0 || t.expires_in > 366 * 86400 ||
        (t.token_type !== undefined && String(t.token_type).toLowerCase() !== 'bearer') ||
        (t.refresh_token !== undefined && (typeof t.refresh_token !== 'string' || !t.refresh_token || t.refresh_token.length > 16384)) ||
        (t.refresh_token_expires_in !== undefined && (!Number.isFinite(t.refresh_token_expires_in) || t.refresh_token_expires_in <= 0 || t.refresh_token_expires_in > 366 * 86400)))
      throw new PinterestError('INVALID_RESPONSE');
    const scopes = typeof t.scope === 'string' ? t.scope.split(/[ ,]+/).filter(Boolean) : [];
    if (READ_SCOPES.some(s => !scopes.includes(s)) || scopes.some((s: string) => !READ_SCOPES.includes(s as any)))
      throw new PinterestError('ACCESS_DENIED');
    return { access_token: t.access_token, refresh_token: t.refresh_token,
      expires_at: this.now() + t.expires_in * 1000,
      refresh_token_expires_at: t.refresh_token_expires_in ? this.now() + t.refresh_token_expires_in * 1000 : undefined };
  }
  async connect(subject: string, code: string, redirect: string) {
    return this.exclusive(subject, async () => {
      const tokens = await this.exchange(new URLSearchParams({ grant_type: 'authorization_code', code,
        redirect_uri: redirect, continuous_refresh: 'true' }));
      if (!tokens.refresh_token) throw new PinterestError('INVALID_RESPONSE');
      await this.store.save(subject, tokens);
    });
  }
  async disconnect(subject: string) { await this.exclusive(subject, () => this.store.delete(subject)); }
  async accessToken(subject: string, rejectedToken?: string): Promise<string> {
    return this.exclusive(subject, async () => {
      const t = await this.store.load(subject);
      if (!t) throw new PinterestError('AUTH_REQUIRED');
      if ((rejectedToken && t.access_token !== rejectedToken) ||
          (!rejectedToken && t.expires_at && t.expires_at > this.now() + 120000)) return t.access_token;
      if (!t.refresh_token || (t.refresh_token_expires_at && t.refresh_token_expires_at <= this.now()))
        throw new PinterestError('AUTH_EXPIRED');
      let next: Tokens;
      try { next = await this.exchange(new URLSearchParams({ grant_type: 'refresh_token', refresh_token: t.refresh_token })); }
      catch (e) {
        if (e instanceof PinterestError && e.code === 'AUTH_EXPIRED') await this.store.delete(subject);
        throw e;
      }
      await this.store.save(subject, { ...next, refresh_token: next.refresh_token ?? t.refresh_token,
        refresh_token_expires_at: next.refresh_token_expires_at ?? t.refresh_token_expires_at });
      return next.access_token;
    });
  }
  async get(subject: string, path: string, params: Record<string, string | number | undefined> = {}): Promise<any> {
    if (path.length > 256 || !/^\/(?:user_account|pins(?:\/\d+)?|boards(?:\/\d+(?:\/pins|\/sections(?:\/\d+\/pins)?)?)?)$/.test(path))
      throw new PinterestError('INVALID_REQUEST');
    const url = new URL(`${API}${path}`);
    for (const [name, value] of Object.entries(params)) {
      if (value === undefined) continue;
      if (name === 'page_size' ? !Number.isInteger(value) || Number(value) < 1 || Number(value) > 250 :
          name === 'bookmark' ? typeof value !== 'string' || value.length > 4096 : true)
        throw new PinterestError('INVALID_REQUEST');
      url.searchParams.set(name, String(value));
    }
    let token = await this.accessToken(subject);
    const send = () => request(this.fetcher, url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    let response = await send();
    if (response.status === 401) {
      await response.body?.cancel();
      token = await this.accessToken(subject, token);
      response = await send();
    }
    if (!response.ok) {
      if (response.status === 403) {
        const body = await readJson(response).catch(() => ({} as Record<string, any>));
        throw new PinterestError(body.message === 'PINNER_DATA_ACCESS_DENIED' || body.code === 'PINNER_DATA_ACCESS_DENIED' ?
          'PINNER_DATA_ACCESS_DENIED' : 'ACCESS_DENIED');
      }
      const retry = Number(response.headers.get('Retry-After'));
      await response.body?.cancel();
      throw new PinterestError(response.status === 401 ? 'AUTH_EXPIRED' : response.status === 429 ? 'RATE_LIMITED' :
        response.status === 404 ? 'ACCESS_DENIED' : 'UPSTREAM_UNAVAILABLE',
        response.status === 429 && Number.isFinite(retry) && retry > 0 ? Math.min(retry, 86400) : undefined);
    }
    return readJson(response);
  }
}
let localClient: PinterestClient | undefined;
export function createLocalClient() {
  if (!localClient) {
    const value = process.env.TOKEN_ENCRYPTION_KEY;
    if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) throw new PinterestError('STORAGE_ERROR');
    const store = new EncryptedFileTokenStore('.data', Buffer.from(value, 'hex'));
    localClient = new PinterestClient(store, { appId: process.env.PINTEREST_APP_ID ?? '', appSecret: process.env.PINTEREST_APP_SECRET ?? '' });
  }
  return localClient;
}
export async function pinterestGet(path: string, params: Record<string, string | number | undefined> = {}) {
  return createLocalClient().get('local', path, params);
}
export function summarizePin(pin: any) {
  return { id: pin.id, title: pin.title, description: pin.description, alt_text: pin.alt_text,
    link: pin.link, board_id: pin.board_id, created_at: pin.created_at, media: pin.media,
    pin_url: /^\d+$/.test(String(pin.id ?? '')) ? `https://www.pinterest.com/pin/${pin.id}/` : undefined };
}

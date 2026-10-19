import 'dotenv/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { dirname, resolve } from 'node:path';

export type Tokens = { access_token: string; refresh_token?: string; expires_at?: number; refresh_token_expires_at?: number };
const file = resolve('.data/tokens.enc');
const api = 'https://api.pinterest.com/v5';

function key(): Buffer {
  const value = process.env.TOKEN_ENCRYPTION_KEY;
  if (!value || !/^[a-fA-F0-9]{64}$/.test(value))
    throw new Error('TOKEN_ENCRYPTION_KEY must be a 32-byte hex value');
  return Buffer.from(value, 'hex');
}
export async function saveTokens(tokens: Tokens) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(tokens), 'utf8'), cipher.final()]);
  await mkdir(dirname(file), {recursive: true});
  await writeFile(file, Buffer.concat([iv, cipher.getAuthTag(), ciphertext]), {mode:0o600});
}
export async function loadTokens(): Promise<Tokens> {
  const override = process.env.PINTEREST_ACCESS_TOKEN;
  if (override) return {access_token: override};
  const raw = await readFile(file).catch(() => {throw new Error('Not authorized. Run npm run auth.');});
  const decipher = createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString());
}
export async function exchangeToken(form: URLSearchParams): Promise<Tokens> {
  const id = process.env.PINTEREST_APP_ID, secret = process.env.PINTEREST_APP_SECRET;
  if (!id || !secret) throw new Error('Missing Pinterest app credentials');
  const response = await fetch(`${api}/oauth/token`, {
    method:'POST',
    headers:{Authorization:`Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type':'application/x-www-form-urlencoded'},
    body:form
  });
  const tokens = await response.json() as Record<string, any>;
  if (!response.ok) throw new Error(`OAuth ${response.status}: ${JSON.stringify(tokens)}`);
  return {
    access_token: tokens.access_token, refresh_token: tokens.refresh_token,
    expires_at: Date.now() + Number(tokens.expires_in ?? 2592000) * 1000,
    refresh_token_expires_at: tokens.refresh_token_expires_in ? Date.now() + Number(tokens.refresh_token_expires_in)*1000 : undefined
  };
}
let refreshPromise: Promise<string> | undefined;
async function accessToken(): Promise<string> {
  const tokens = await loadTokens();
  if (!tokens.expires_at || tokens.expires_at > Date.now()+120000) return tokens.access_token;
  if (!tokens.refresh_token) throw new Error('Token expired. Run npm run auth.');
  if (!refreshPromise) refreshPromise = (async () => {
    const next = await exchangeToken(new URLSearchParams({grant_type:'refresh_token',refresh_token:tokens.refresh_token!}));
    await saveTokens({...next,refresh_token:next.refresh_token ?? tokens.refresh_token});
    return next.access_token;
  })().finally(() => {refreshPromise=undefined;});
  return refreshPromise;
}
export async function pinterestGet(path: string, params: Record<string,string|number|undefined> = {}): Promise<any> {
  const url = new URL(`${api}${path}`);
  for (const [key,value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key,String(value));
  const response = await fetch(url, {
    headers:{Authorization:`Bearer ${await accessToken()}`,Accept:'application/json'},
    signal:AbortSignal.timeout(20000)
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Pinterest API ${response.status}: ${body.slice(0,1200)}`);
  try {return JSON.parse(body);} catch {throw new Error('Pinterest returned invalid JSON');}
}
export function summarizePin(pin: any) {
  return {id:pin.id,title:pin.title,description:pin.description,alt_text:pin.alt_text,
    link:pin.link,board_id:pin.board_id,created_at:pin.created_at,media:pin.media,
    pin_url:pin.id ? `https://www.pinterest.com/pin/${pin.id}/` : undefined};
}

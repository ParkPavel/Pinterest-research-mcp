import { mkdir, readFile, writeFile, rename, rm, chmod } from 'node:fs/promises';
import { randomBytes, createHash, createCipheriv, createDecipheriv } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { PinterestError } from './errors.js';

export type Tokens = { access_token: string; refresh_token?: string; expires_at?: number; refresh_token_expires_at?: number };
export function validTokens(value: unknown): value is Tokens {
  if (!value || typeof value !== 'object') return false;
  const t = value as Tokens;
  return typeof t.access_token === 'string' && t.access_token.length > 0 && t.access_token.length <= 16384 &&
    (t.refresh_token === undefined || (typeof t.refresh_token === 'string' && t.refresh_token.length > 0 && t.refresh_token.length <= 16384)) &&
    [t.expires_at, t.refresh_token_expires_at].every(v => v === undefined || (typeof v === 'number' && Number.isFinite(v) && v > 0));
}
export interface TokenStore {
  load(subject: string): Promise<Tokens | undefined>;
  save(subject: string, tokens: Tokens): Promise<void>;
  delete(subject: string): Promise<void>;
}
/** Single-process filesystem adapter; production replicas need a database.
 * Subjects must come from verified identity, never tool arguments.
 * `local` retains compatibility with the original encrypted token file.
 */
export class EncryptedFileTokenStore implements TokenStore {
  private readonly root: string;
  constructor(root: string, private readonly encryptionKey: Buffer) {
    this.root = resolve(root);
    if (encryptionKey.length !== 32) throw new Error('A 32-byte encryption key is required');
  }
  private location(subject: string) {
    if (!subject || subject.length > 4096) throw new PinterestError('INVALID_REQUEST');
    return subject === 'local' ? resolve(this.root, 'tokens.enc') :
      resolve(this.root, 'users', createHash('sha256').update(subject).digest('hex'), 'tokens.enc');
  }
  async load(subject: string): Promise<Tokens | undefined> {
    let raw: Buffer;
    try { raw = await readFile(this.location(subject)); }
    catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw new PinterestError('STORAGE_ERROR');
    }
    try {
      if (raw.length < 29 || raw.length > 65536) throw new Error();
      const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, raw.subarray(0, 12));
      if (subject !== 'local') decipher.setAAD(Buffer.from(subject));
      decipher.setAuthTag(raw.subarray(12, 28));
      const tokens: unknown = JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString());
      if (!validTokens(tokens)) throw new Error();
      return tokens;
    } catch { throw new PinterestError('STORAGE_ERROR'); }
  }
  async save(subject: string, tokens: Tokens): Promise<void> {
    if (!validTokens(tokens)) throw new PinterestError('INVALID_RESPONSE');
    const file = this.location(subject), temporary = `${file}.${randomBytes(16).toString('hex')}.tmp`;
    try {
      await mkdir(dirname(file), { recursive: true, mode: 0o700 });
      await chmod(dirname(file), 0o700);
      const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
      if (subject !== 'local') cipher.setAAD(Buffer.from(subject));
      const encrypted = Buffer.concat([cipher.update(JSON.stringify(tokens)), cipher.final()]);
      await writeFile(temporary, Buffer.concat([iv, cipher.getAuthTag(), encrypted]), { mode: 0o600, flag: 'wx' });
      await rename(temporary, file);
    } catch { throw new PinterestError('STORAGE_ERROR'); }
    finally { await rm(temporary, { force: true }).catch(() => undefined); }
  }
  async delete(subject: string): Promise<void> {
    try { await rm(this.location(subject), { force: true }); }
    catch { throw new PinterestError('STORAGE_ERROR'); }
  }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, stat, rm, readdir, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { EncryptedFileTokenStore, type Tokens, type TokenStore } from '../src/token-store.js';
import { PinterestClient, READ_SCOPES } from '../src/pinterest.js';
import { PinterestError, publicError } from '../src/errors.js';

const NOW = 1700000000000;
const fresh = (access = 'fixture-access'): Tokens => ({access_token:access,refresh_token:'fixture-refresh',expires_at:NOW+3600000,refresh_token_expires_at:NOW+86400000});
const reply = (value: unknown, status = 200, headers = {}) => new Response(JSON.stringify(value), {status,headers});
const tokenReply = (extra = {}) => reply({access_token:'rotated-access',refresh_token:'rotated-refresh',expires_in:3600,refresh_token_expires_in:86400,scope:READ_SCOPES.join(' '),token_type:'bearer',...extra});
class MemoryStore implements TokenStore {
  data = new Map<string,Tokens>();
  async load(s:string) { return structuredClone(this.data.get(s)); }
  async save(s:string,t:Tokens) { this.data.set(s, structuredClone(t)); }
  async delete(s:string) { this.data.delete(s); }
}
function client(store:TokenStore, fetcher: (url:any,init:any)=>Promise<Response>) {
  return new PinterestClient(store,{appId:'fixture-id',appSecret:'fixture-secret',now:()=>NOW,fetch:fetcher as typeof fetch});
}
const code = (expected:string) => (e:unknown) => e instanceof PinterestError && e.code === expected;

test('encrypted store: atomic writes, private permissions, deletion and no plaintext tokens',async()=>{
  const root=await mkdtemp(join(tmpdir(),'pinterest-vault-'));
  try {
    const store=new EncryptedFileTokenStore(root,Buffer.alloc(32,1));
    assert.equal(await store.load('local'),undefined);
    await store.save('local',fresh());
    assert.deepEqual(await store.load('local'),fresh());
    const file=join(root,'tokens.enc');
    assert.ok(!(await readFile(file)).includes(Buffer.from('fixture-access')));
    assert.equal((await stat(file)).mode & 0o777,0o600);
    assert.equal((await stat(root)).mode & 0o777,0o700);
    await Promise.all(Array.from({length:10},(_,i)=>store.save('local',fresh(`token-${i}`))));
    assert.match((await store.load('local'))!.access_token,/^token-\d$/);
    assert.deepEqual(await readdir(root),['tokens.enc']);
    await store.delete('local'); await store.delete('local');
    assert.equal(await store.load('local'),undefined);
  } finally { await rm(root,{recursive:true,force:true}); }
});
test('encrypted store rejects tampering, wrong keys and ciphertext copied between users',async()=>{
  const root=await mkdtemp(join(tmpdir(),'pinterest-isolation-'));
  try {
    const store=new EncryptedFileTokenStore(root,Buffer.alloc(32,1));
    await store.save('issuer|alice',fresh('alice')); await store.save('issuer|bob',fresh('bob'));
    const path=(s:string)=>join(root,'users',createHash('sha256').update(s).digest('hex'),'tokens.enc');
    assert.equal((await store.load('issuer|bob'))!.access_token,'bob');
    await copyFile(path('issuer|alice'),path('issuer|bob'));
    await assert.rejects(store.load('issuer|bob'),code('STORAGE_ERROR'));
    await assert.rejects(new EncryptedFileTokenStore(root,Buffer.alloc(32,2)).load('issuer|alice'),code('STORAGE_ERROR'));
    const bytes=await readFile(path('issuer|alice')); bytes[30]^=1; await writeFile(path('issuer|alice'),bytes);
    await assert.rejects(store.load('issuer|alice'),code('STORAGE_ERROR'));
  } finally { await rm(root,{recursive:true,force:true}); }
});
test('anonymous identity cannot fall back to another account',async()=>{
  const store=new MemoryStore(); await store.save('local',fresh());
  const c=client(store,async()=>{throw new Error('must not call');});
  await assert.rejects(c.get('alice','/boards'),code('AUTH_REQUIRED'));
});
test('concurrent refresh rotates once and preserves independent user identities',async()=>{
  const store=new MemoryStore(); await store.save('alice',{...fresh('alice-old'),expires_at:NOW}); await store.save('bob',fresh('bob'));
  let refreshes=0;
  const c=client(store,async(url,init)=>{
    if(String(url).endsWith('/oauth/token')) { refreshes++; assert.equal(init.body.get('refresh_token'),'fixture-refresh'); return tokenReply(); }
    return reply({authorization:init.headers.Authorization,items:[],bookmark:null});
  });
  const results=await Promise.all(Array.from({length:20},()=>c.get('alice','/boards')));
  assert.equal(refreshes,1); assert.ok(results.every(x=>x.authorization==='Bearer rotated-access'));
  assert.equal((await c.get('bob','/boards')).authorization,'Bearer bob');
  assert.equal((await store.load('alice'))!.refresh_token,'rotated-refresh');
  assert.equal((await store.load('bob'))!.refresh_token,'fixture-refresh');
});
test('disconnect racing with refresh cannot resurrect the credential',async()=>{
  const store=new MemoryStore(); await store.save('alice',{...fresh(),expires_at:NOW});
  let started!:()=>void, release!:()=>void;
  const pending=new Promise<void>(r=>{started=r}); const finish=new Promise<void>(r=>{release=r});
  const c=client(store,async()=>{started();await finish;return tokenReply()});
  const refresh=c.accessToken('alice'); await pending;
  const disconnect=c.disconnect('alice'); release(); await refresh; await disconnect;
  assert.equal(await store.load('alice'),undefined);
  await assert.rejects(c.accessToken('alice'),code('AUTH_REQUIRED'));
});
test('expired refresh and rejected refresh require reconnect, without leaking upstream body',async()=>{
  const store=new MemoryStore(); await store.save('alice',{...fresh(),expires_at:NOW,refresh_token_expires_at:NOW-1});
  let calls=0;
  const c=client(store,async()=>{calls++;return reply({message:'fixture-secret'},400)});
  await assert.rejects(c.accessToken('alice'),code('AUTH_EXPIRED')); assert.equal(calls,0);
  await store.save('alice',{...fresh(),expires_at:NOW});
  await assert.rejects(c.accessToken('alice'),code('AUTH_EXPIRED'));
  assert.equal(await store.load('alice'),undefined);
});
test('preserves previous refresh token and expiry when refresh response omits them',async()=>{
  const store=new MemoryStore(); await store.save('alice',{...fresh(),expires_at:NOW});
  const c=client(store,async()=>tokenReply({refresh_token:undefined,refresh_token_expires_in:undefined}));
  await c.accessToken('alice');
  assert.equal((await store.load('alice'))!.refresh_token,'fixture-refresh');
  assert.equal((await store.load('alice'))!.refresh_token_expires_at,NOW+86400000);
});
test('401 retries only once using a refreshed token',async()=>{
  const store=new MemoryStore(); await store.save('alice',fresh()); let calls=0,refreshes=0;
  const c=client(store,async(url)=>{
    if(String(url).endsWith('/oauth/token')){refreshes++;return tokenReply()}
    calls++;return reply({message:'fixture-secret'},401);
  });
  await assert.rejects(c.get('alice','/boards'),code('AUTH_EXPIRED'));
  assert.equal(calls,2);assert.equal(refreshes,1);
});
for(const [status,body,expected] of [
  [403,{message:'PINNER_DATA_ACCESS_DENIED'},'PINNER_DATA_ACCESS_DENIED'],
  [403,{message:'fixture-secret'},'ACCESS_DENIED'],
  [404,{},'ACCESS_DENIED'],[429,{},'RATE_LIMITED'],[500,{},'UPSTREAM_UNAVAILABLE']
] as const) test(`HTTP ${status} maps to ${expected}, without retries or raw body`,async()=>{
  const store=new MemoryStore();await store.save('alice',fresh());let calls=0;
  const c=client(store,async()=>{calls++;return reply(body,status,{'Retry-After':'120'})});
  await assert.rejects(c.get('alice','/boards'),e=>{
    assert.ok(code(expected)(e));assert.ok(!publicError(e).includes('fixture-secret'));
    if(status===429)assert.equal((e as PinterestError).retryAfter,120);
    return true;
  }); assert.equal(calls,1);
});
test('bookmark pagination encodes opaque values and preserves next bookmark',async()=>{
  const store=new MemoryStore();await store.save('alice',fresh());const urls:string[]=[];
  const c=client(store,async(url)=>{urls.push(String(url));return reply({items:[{id:'1'}],bookmark:urls.length===1?'opaque+/=&':'last'})});
  const first=await c.get('alice','/boards/123/pins',{page_size:250});
  const second=await c.get('alice','/boards/123/pins',{page_size:250,bookmark:first.bookmark});
  assert.equal(new URL(urls[1]).searchParams.get('bookmark'),'opaque+/=&');assert.equal(second.bookmark,'last');
});
test('SSRF and malformed pagination are rejected before fetch; redirects disabled',async()=>{
  const store=new MemoryStore();await store.save('alice',fresh());let calls=0;
  const c=client(store,async(url,init)=>{calls++;assert.equal(new URL(url).origin,'https://api.pinterest.com');assert.equal(init.redirect,'error');return reply({items:[]})});
  for(const path of ['https://evil.invalid','//evil.invalid','/boards/../oauth/token','/boards?token=secret','/pins/1#x','/boards/%31'])
    await assert.rejects(c.get('alice',path),code('INVALID_REQUEST'));
  for(const params of [{page_size:251},{page_size:-1},{page_size:1.5},{bookmark:'x'.repeat(4097)},{access_token:'bad'}])
    await assert.rejects(c.get('alice','/boards',params),code('INVALID_REQUEST'));
  assert.equal(calls,0);await c.get('alice','/boards');assert.equal(calls,1);
});
test('invalid JSON, oversized response and network error are sanitized',async()=>{
  const store=new MemoryStore();await store.save('alice',fresh());
  for(const fetcher of [async()=>new Response('not json'),async()=>new Response('x'.repeat(2*1024*1024+1))])
    await assert.rejects(client(store,fetcher).get('alice','/boards'),code('INVALID_RESPONSE'));
  await assert.rejects(client(store,async()=>{throw new Error('fixture-secret')}).get('alice','/boards'),e=>{
    assert.ok(code('UPSTREAM_UNAVAILABLE')(e));assert.ok(!publicError(e).includes('fixture-secret'));return true;
  }); assert.ok(!publicError(new Error('fixture-secret')).includes('fixture-secret'));
});
for(const value of [{access_token:''},{expires_in:-1},{expires_in:'3600'},{scope:'boards:read'},{scope:READ_SCOPES.join(' ')+',pins:write'},{refresh_token:42},{token_type:'mac'}])
  test(`malformed token response rejected: ${Object.keys(value)[0]} ${JSON.stringify(value)}`,async()=>{
    const store=new MemoryStore();const c=client(store,async()=>tokenReply(value));
    await assert.rejects(c.connect('alice','fixture-code','http://127.0.0.1:8765/callback'));
    assert.equal(await store.load('alice'),undefined);
  });
test('authorization code exchange uses Basic auth, exact redirect and continuous refresh',async()=>{
  const store=new MemoryStore();const redirect='http://127.0.0.1:8765/callback';
  const c=client(store,async(url,init)=>{
    assert.equal(String(url),'https://api.pinterest.com/v5/oauth/token');assert.match(init.headers.Authorization,/^Basic /);
    assert.equal(init.body.get('grant_type'),'authorization_code');assert.equal(init.body.get('redirect_uri'),redirect);
    assert.equal(init.body.get('continuous_refresh'),'true');assert.equal(init.body.get('code'),'fixture-code');return tokenReply();
  });await c.connect('alice','fixture-code',redirect);assert.equal((await store.load('alice'))!.access_token,'rotated-access');
});

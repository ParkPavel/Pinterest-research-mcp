import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalOAuth, validateLocalRedirect } from '../src/local-oauth.js';
import type { IncomingMessage, ServerResponse } from 'node:http';

for(const redirect of ['https://example.com/callback','http://0.0.0.0:8765/callback','http://127.0.0.1:8765/callback?x=1','http://u:p@localhost:8765/callback','http://localhost:8765/callback#x','http://localhost/callback','http://localhost:8765/callback-evil'])
  test(`unsafe redirect rejected: ${redirect}`,()=>assert.throws(()=>validateLocalRedirect(redirect)));

async function setup(t:any,connect:(code:string,redirect:string)=>Promise<void>,now?:()=>number) {
  const flow=createLocalOAuth({redirect:'http://127.0.0.1:8765/callback',appId:'fixture-id',connect,now});
  const state=new URL(flow.loginUrl).searchParams.get('state');
  const send=async(path:string,method='GET',host='127.0.0.1:8765')=>{
    let status=200, body='', headers:Record<string,string>={};
    const response={
      setHeader(name:string,value:string){headers[name]=value},
      writeHead(value:number,extra:Record<string,string>={}){status=value;Object.assign(headers,extra);return this},
      end(value=''){body=value;return this}
    };
    await flow.handler({method,url:path,headers:{host}} as IncomingMessage,response as unknown as ServerResponse);
    return new Response(body,{status,headers});
  };
  return {send,state};
}
test('callback exact path/host/method, state mismatch and duplicate parameters',async t=>{
  let calls=0;const {send,state}=await setup(t,async()=>{calls++});
  for(const [path,method,host,expected] of [
    ['/callback-evil','GET','127.0.0.1:8765',404],['/callback','POST','127.0.0.1:8765',405],
    ['/callback','GET','evil.invalid',403],['/callback?state=wrong&code=x','GET','127.0.0.1:8765',403],
    [`/callback?state=${state}&state=${state}&code=x`,'GET','127.0.0.1:8765',403],
    [`/callback?state=${state}&code=a&code=b`,'GET','127.0.0.1:8765',400]
  ] as const) assert.equal((await send(path,method,host)).status,expected);
  assert.equal(calls,0);
  const response=await send(`/callback?state=${state}&code=fixture-code`);
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal(response.headers.get('referrer-policy'),'no-referrer');assert.equal(calls,1);
  assert.equal((await send(`/callback?state=${state}&code=replay`)).status,403);assert.equal(calls,1);
});
test('callback state is single-use during concurrent exchange',async t=>{
  let release!:()=>void,started!:()=>void;const pending=new Promise<void>(r=>{started=r});const finish=new Promise<void>(r=>{release=r});
  let calls=0;const {send,state}=await setup(t,async()=>{calls++;started();await finish});
  const first=send(`/callback?state=${state}&code=one`);await pending;
  assert.equal((await send(`/callback?state=${state}&code=two`)).status,403);release();assert.equal((await first).status,200);assert.equal(calls,1);
});
test('expired state is rejected without exchange',async t=>{
  let now=1000;const {send,state}=await setup(t,async()=>assert.fail('exchange'),()=>now);now+=300001;
  assert.equal((await send(`/callback?state=${state}&code=x`)).status,403);
});
test('denial consumes state; failed exchange is sanitized and cannot replay',async t=>{
  const denied=await setup(t,async()=>assert.fail('exchange'));
  assert.equal((await denied.send(`/callback?state=${denied.state}&error=access_denied`)).status,400);
  assert.equal((await denied.send(`/callback?state=${denied.state}&code=x`)).status,403);
  const failed=await setup(t,async()=>{throw new Error('fixture-private-code')});
  const result=await failed.send(`/callback?state=${failed.state}&code=x`);
  assert.equal(result.status,502);assert.ok(!(await result.text()).includes('fixture-private-code'));
  assert.equal((await failed.send(`/callback?state=${failed.state}&code=x`)).status,403);
});

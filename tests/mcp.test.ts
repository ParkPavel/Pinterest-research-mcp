import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('MCP stdio discovery, schema validation and real unauthorized tool call',async t=>{
  const transport=new StdioClientTransport({command:process.execPath,args:['--import','tsx','src/index.ts'],
    env:{PATH:process.env.PATH??'',TOKEN_ENCRYPTION_KEY:'1'.repeat(64)},stderr:'pipe'});
  const client=new Client({name:'security-regression',version:'1.0.0'});
  t.after(async()=>{await client.close()});await client.connect(transport);
  const {tools}=await client.listTools();assert.equal(tools.length,8);
  assert.ok(tools.every(x=>x.annotations?.readOnlyHint===true&&x.annotations?.destructiveHint===false));
  const invalid=await client.callTool({name:'pinterest_board',arguments:{board_id:'https://evil.invalid'}});
  assert.equal(invalid.isError,true);
  const result=await client.callTool({name:'pinterest_boards',arguments:{page_size:50}});
  assert.equal(result.isError,true);assert.match(JSON.stringify(result),/AUTH_REQUIRED/);
});

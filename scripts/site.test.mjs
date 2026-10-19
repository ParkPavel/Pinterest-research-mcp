import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { extractTools, markdownHtml } from '../docs/content.mjs';
const root = new URL('../',import.meta.url);
test('Published site has working local assets, routes, and fragment targets',async()=>{
  for(const page of ['docs/index.html','docs/privacy.html']){
    const html=await readFile(new URL(page,root),'utf8');
    assert.match(html,/<meta name="viewport"/);
    for(const [,href] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
      if(href.startsWith('https://')){assert.doesNotThrow(()=>new URL(href));assert.ok(!/\s/.test(href));continue;}
      if(href.startsWith('#')){assert.ok(html.includes(`id="${href.slice(1)}"`),href);continue;}
      await access(new URL(href,new URL(page,root)));
    }
  }
});
test('Snapshot reflects the actual tool registry and privacy policy',async()=>{
  const data=JSON.parse(await readFile(new URL('docs/project.json',root),'utf8'));
  const tools=extractTools(await readFile(new URL('src/index.ts',root),'utf8'));
  assert.ok(tools.length>0);assert.deepEqual(data.tools,tools);
  assert.equal(data.privacy,await readFile(new URL('PRIVACY.md',root),'utf8'));
});
test('Repository Markdown cannot inject HTML or script links into the policy page',()=>{
  const html=markdownHtml('## Heading\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert(1))\n\n[GitHub](https://github.com/ParkPavel)');
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('href="javascript:'));
  assert.ok(html.includes('href="https://github.com/ParkPavel"'));
});

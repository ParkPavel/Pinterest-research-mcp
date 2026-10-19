import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { extractTools, toolHtml, markdownHtml } from '../docs/content.mjs';
const root = new URL('../', import.meta.url);
const read = name => readFile(new URL(name, root), 'utf8');
const [source, pkg, privacy, readme, template] = await Promise.all(['src/index.ts','package.json','PRIVACY.md','README.md','docs/index.html'].map(read));
const tools = extractTools(source);
if (!tools.length) throw new Error('No MCP tools found; review the registry parser before publishing.');
const sha = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const date = execFileSync('git',['log','-1','--format=%cI','--','src','README.md','PRIVACY.md','package.json'],{cwd:root,encoding:'utf8'}).trim();
const snapshot = { sourceRef:'main', sourceCommit:sha, sourceDate:date, version:JSON.parse(pkg).version, tools, projectStatus:readme.match(/\*\*Project status:\*\*\s*([^\n]+)/)?.[1] || 'See README.md', privacy };
const index = template.replace(/<!-- tools:start -->[\s\S]*?<!-- tools:end -->/,`<!-- tools:start -->${toolHtml(tools)}<!-- tools:end -->`)
  .replace(/id="snapshot-date">[^<]*/,`id="snapshot-date">Снимок: ${date.slice(0,10)}`)
  .replace(/id="version">[^<]*/,`id="version">v${snapshot.version}`)
  .replace(/id="tool-count">[^<]*/,`id="tool-count">${tools.length} инструментов`);
const policy = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Privacy Policy for the experimental Visual Research MCP connector."><title>Privacy Policy — Visual Research MCP</title><link rel="stylesheet" href="./style.css?v=3"><link rel="icon" type="image/png" sizes="32x32" href="./assets/icon-32.png"><link rel="apple-touch-icon" sizes="180x180" href="./assets/icon-180.png"><meta property="og:title" content="Visual Research MCP — Privacy Policy"><meta property="og:image" content="https://parkpavel.github.io/Pinterest-research-mcp/assets/social-card.png"><script type="module" src="./site.js"></script></head>
<body><a class="skip" href="#main">Skip to content</a><div class="page"><header class="header"><a class="brand" href="./"><img src="./assets/icon-128.png" width="36" height="36" alt=""><span>Visual Research MCP</span></a><nav aria-label="Navigation"><a href="./">Главная</a><a href="https://github.com/ParkPavel/Pinterest-research-mcp/blob/main/PRIVACY.md">Source on GitHub</a></nav></header><main id="main" class="policy"><p class="eyebrow">Project documentation / Privacy</p><h1>Privacy Policy</h1><p class="intro" lang="ru">Официальная политика проекта приведена на английском языке из PRIVACY.md. <a href="./">Вернуться на главную</a>.</p><div class="policy-content" id="policy-content">${markdownHtml(privacy)}</div><p class="source-note" id="freshness" aria-live="polite">Repository snapshot: ${date.slice(0,10)}. Checking for updates…</p></main><footer><a href="./">Visual Research MCP</a><a href="https://github.com/ParkPavel/Pinterest-research-mcp/blob/main/PRIVACY.md">PRIVACY.md</a><a href="https://web.tribute.tg/d/SwM">Support on Tribute</a></footer></div></body></html>\n`;
await mkdir(new URL('docs/', root),{recursive:true});
await Promise.all([writeFile(new URL('docs/index.html',root),index),writeFile(new URL('docs/project.json',root),JSON.stringify(snapshot,null,2)+'\n'),writeFile(new URL('docs/privacy.html',root),policy)]);
console.log(`Generated site: ${tools.length} tools, v${snapshot.version}, source ${sha.slice(0,7)}.`);

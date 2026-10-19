import { REPO, GITHUB, extractTools, toolHtml, markdownHtml } from './content.mjs';
const byId = id => document.getElementById(id);
const set = (id, value) => { if (byId(id)) byId(id).textContent = value; };
const policy = Boolean(byId('policy-content'));
const api = `https://api.github.com/repos/${REPO}`;
async function get(url, json = true) {
  const response = await fetch(url, { credentials:'omit', signal:AbortSignal.timeout(10000), headers:json ? {Accept:'application/vnd.github+json'} : {} });
  if (!response.ok) throw new Error(`Source unavailable (${response.status})`);
  return json ? response.json() : response.text();
}
async function updateContent() {
  // Resolve main once, then read all content at that immutable commit.
  const head = await get(`${api}/commits/main`);
  const raw = `https://raw.githubusercontent.com/${REPO}/${head.sha}`;
  if (policy) {
    const privacy = await get(`${raw}/PRIVACY.md`, false);
    byId('policy-content').innerHTML = markdownHtml(privacy);
    set('freshness',`Live source: main · ${head.sha.slice(0,7)} · checked ${new Date().toISOString().slice(0,10)} UTC. Policy text from PRIVACY.md.`);
    return;
  }
  const [source, pkg, readme] = await Promise.all([get(`${raw}/src/index.ts`,false),get(`${raw}/package.json`),get(`${raw}/README.md`,false)]);
  const tools = extractTools(source);
  if (!tools.length) throw new Error('Tool registry format changed');
  byId('tools-list').innerHTML = toolHtml(tools);
  set('tool-count',`${tools.length} инструментов`);
  set('version',`v${pkg.version}`);
  set('snapshot-date',`main · ${head.sha.slice(0,7)}`);
  // Readiness is a reviewed editorial statement; commit/PR/CI are live facts, not proof of product readiness.
  const experimental = /early-stage|experimental|not installable|not a hosted service/i.test(readme);
  set('freshness',`Сведения проверены по main: ${new Date().toISOString().slice(0,10)} UTC · ${head.sha.slice(0,7)}.${experimental ? ' README подтверждает экспериментальный статус.' : ' Изменения готовности уточняйте в README.'}`);
}
async function updatePR() {
  if (policy) return;
  const pr = await get(`${api}/pulls/1`);
  set('pr-status', `${pr.merged_at ? 'объединён' : pr.state === 'closed' ? 'закрыт' : pr.draft ? 'черновик' : 'открыт'} PR #1`);
  byId('pr-status').href = `${GITHUB}/pull/1`;
}
async function updateCI() {
  if (policy) return;
  const data = await get(`${api}/actions/runs?per_page=30`);
  // Do not mistake a Pages deployment or a successful feature-branch run for main CI.
  const runs = data.workflow_runs || [];
  const ci = runs.find(r => r.head_branch === 'main' && /^(CI|Site checks)$/.test(r.name));
  if (!ci) {set('ci-status','CI для main пока не найден. Запуски прототипа и Pages доступны в Actions.');return;}
  const results = {success:'успешно',failure:'ошибка',cancelled:'отменено',skipped:'пропущено',timed_out:'превышено время',action_required:'требует действия',neutral:'нейтральный результат'};
  const status = ci.status === 'completed' ? results[ci.conclusion] || ci.conclusion || 'завершено' : 'выполняется / в очереди';
  set('ci-status',`${ci.name} · main · ${status} · ${ci.head_sha.slice(0,7)} · ${ci.updated_at.slice(0,10)}`);
  const link=byId('ci-link');link.href=`${GITHUB}/actions/runs/${ci.id}`;link.textContent='Открыть этот запуск';
}
const updates = await Promise.allSettled([updateContent(),updatePR(),updateCI()]);
if (updates[0].status === 'rejected') {
  set('freshness',policy ? 'Live GitHub data unavailable. Showing the saved policy; verify the latest version via PRIVACY.md on GitHub.' : 'GitHub недоступен или исчерпан лимит API. Показан сохранённый снимок; актуальные сведения проверяйте в репозитории.');
} else if (!policy && updates.slice(1).some(r=>r.status==='rejected')) {
  byId('freshness').textContent += ' Статус PR или CI не удалось обновить — проверьте GitHub.';
}

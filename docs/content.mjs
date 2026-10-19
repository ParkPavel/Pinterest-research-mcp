// Shared by the zero-dependency generator and the browser. Never execute repository Markdown.
export const REPO = 'ParkPavel/Pinterest-research-mcp';
export const GITHUB = `https://github.com/${REPO}`;
const labels = {
  pinterest_account: 'Информация об авторизованном аккаунте Pinterest.',
  pinterest_boards: 'Список доступных досок с пагинацией.',
  pinterest_board: 'Метаданные доски по идентификатору.',
  pinterest_board_pins: 'Пины доски, ссылки на источники и медиа.',
  pinterest_pins: 'Доступные пины аккаунта с пагинацией.',
  pinterest_pin: 'Метаданные и медиа одного пина.',
  pinterest_board_sections: 'Список разделов доски.',
  pinterest_section_pins: 'Пины выбранного раздела доски.'
};
export function extractTools(source) {
  return [...source.matchAll(/(?:register|registerTool)\(\s*['"](pinterest_[a-z_]+)['"]\s*,\s*['"]([^'"]+)['"]/g)]
    .map(([, name, description]) => ({ name, description: labels[name] || description }));
}
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function toolHtml(tools) {
  return tools.map(t => `<div class="tool"><dt>${escapeHtml(t.name)}</dt><dd>${escapeHtml(t.description)}</dd></div>`).join('\n');
}
function inline(value) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
export function markdownHtml(markdown) {
  const lines = markdown.split(/\r?\n/); let result = '', paragraph = [], list = false;
  const flush = () => { if (paragraph.length) { result += `<p>${inline(paragraph.join(' '))}</p>\n`; paragraph = []; } };
  const closeList = () => { if (list) {result += '</ul>\n'; list = false;} };
  for (const line of lines) {
    if (line.startsWith('# ')) continue; // The page supplies the single h1.
    if (/^## /.test(line)) {flush();closeList();result += `<h2>${inline(line.slice(3))}</h2>\n`;}
    else if (/^- /.test(line)) {flush();if(!list){result+='<ul>\n';list=true;}result+=`<li>${inline(line.slice(2))}</li>\n`;}
    else if (!line.trim()) {flush();closeList();}
    else {closeList();paragraph.push(line.trim());}
  }
  flush();closeList();return result;
}

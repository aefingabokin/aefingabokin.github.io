const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  try {
  await wait(3000);
  d.querySelector('#settingsBtn').click(); await wait(100);
  console.log('normal:', d.querySelector('.editbtn').textContent, '| switches:', d.querySelectorAll('#homeorder .switch').length, '| arrows:', d.querySelectorAll('#homeorder .mv').length);
  d.querySelector('[data-act="reorder"]').click(); await wait(50);
  console.log('edit:', d.querySelector('.editbtn').textContent, '| handles:', d.querySelectorAll('#homeorder .handle').length);
  // fake geometry: rows 50px tall stacked
  const rows = () => [...d.querySelectorAll('#homeorder .orow')];
  const geo = () => rows().forEach((r, i) => { r.getBoundingClientRect = () => ({ top: i * 50, bottom: i * 50 + 50, height: 50 }); });
  geo(); const before = rows().map(r => r.dataset.hc).join(',');
  const h = rows()[0].querySelector('.handle'); h.setPointerCapture = () => {};
  const ev = (t, y) => { const e = new w.Event(t, { bubbles: true }); e.clientY = y; e.pointerId = 1; return e; };
  h.dispatchEvent(ev('pointerdown', 10)); h.dispatchEvent(ev('pointermove', 140)); geo(); h.dispatchEvent(ev('pointermove', 180)); h.dispatchEvent(ev('pointerup', 180));
  const after = rows().map(r => r.dataset.hc).join(',');
  console.log('before:', before); console.log('after: ', after);
  const k = rows()[0].querySelector('.handle'); const ke = new w.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }); k.dispatchEvent(ke);
  console.log('after key:', rows().map(r => r.dataset.hc).join(','));
  console.log('saved:', JSON.parse(w.localStorage.getItem('aefingabokin.settings')).homeCards.join(','));
  d.querySelector('[data-act="reorder"]').click(); d.querySelector('[data-act="setback"]').click(); await wait(100);
  console.log('home order:', [...d.querySelectorAll('#view > section, #view > .stats, #view > .sech, #view > h2, #view > .kcard')].map(e => (e.className || e.tagName).split(' ')[0] + (e.tagName === 'H2' ? ':' + e.textContent : '')).join(' | '));
  } catch(e){ console.log('FAIL', e.stack); }
  console.log('errors', errs); process.exit(0);
})();

const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {};
  w.Blob.prototype.text = function(){ return new Promise(r => { const fr = new w.FileReader(); fr.onload = () => r(fr.result); fr.readAsText(this); }); }; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms)); const T = s => (s || '').replace(/\s+/g, ' ').trim();
const go = async t => { [...d.querySelectorAll('#demoPanel [data-d]')].find(x => x.textContent === t).click(); await wait(600); };
(async () => {
  try {
  await wait(3000);
  d.querySelector('.tabs [data-tab="log"]').click(); await wait(100);
  console.log('watch row:', T(d.querySelector('.watchrow').textContent));
  d.querySelector('[data-act="importhelp"]').click(); await wait(50);
  console.log('help tabs:', [...d.querySelectorAll('[data-act="imphelptab"]')].map(b => b.textContent).join(','), '| garmin:', T(d.querySelector('.helpbody').textContent).slice(0, 90));
  d.querySelector('[data-act="imphelptab"][data-v="apple"]').click(); await wait(30); console.log('apple:', T(d.querySelector('.helpbody').textContent).slice(0, 120));
  await go('Sækja úr úri: sýnidæmi'); await wait(400);
  console.log('preview:', d.querySelector('#sheetTitle').textContent, '|', T(d.querySelector('#sheetBody .tiny').textContent));
  console.log('items:', [...d.querySelectorAll('.impitem')].map(i => (i.querySelector('input').checked ? '[x] ' : '[ ] ') + T(i.querySelector('.impt').textContent)).join(' || '));
  console.log('button:', d.querySelector('[data-act="impgo"]').textContent);
  const cb = d.querySelector('[data-impi]'); cb.checked = false; cb.dispatchEvent(new w.Event('change', { bubbles: true })); console.log('after uncheck:', d.querySelector('[data-act="impgo"]').textContent);
  d.querySelector('[data-act="imprange"][data-v="7"]').click(); await wait(30); console.log('7 days items:', d.querySelectorAll('.impitem').length);
  d.querySelector('[data-act="imprange"][data-v="all"]').click(); await wait(30);
  d.querySelector('[data-act="impgo"]').click(); await wait(500);
  console.log('toast:', d.querySelector('#toast').textContent, '| top list:', [...d.querySelectorAll('.list .item')].slice(0, 3).map(i => T(i.textContent)).join(' || '));
  await go('Sækja úr úri: sýnidæmi'); await wait(400);
  console.log('re-import all dupes:', [...d.querySelectorAll('.impitem')].every(i => !i.querySelector('input').checked), '| dup labels:', d.querySelectorAll('.impdup').length);
  // offline bar
  Object.defineProperty(w.navigator, 'onLine', { value: false, configurable: true }); w.dispatchEvent(new w.Event('offline')); await wait(50);
  console.log('offline bar:', d.querySelector('.netbar').classList.contains('show'), T(d.querySelector('.netbar').textContent).slice(0, 60));
  } catch(e){ console.log('FAIL', e.stack); }
  console.log('errors', errs); process.exit(0);
})();

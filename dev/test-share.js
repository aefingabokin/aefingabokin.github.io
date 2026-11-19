const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms)); const T = s => (s || '').replace(/\s+/g, ' ').trim();
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.click(); };
const sharedCount = () => { /* count Aron's shared docs via friends' view isn't possible; use Vinir feed of partner? use internal: */ return null; };
(async () => {
  try {
  await wait(3000);
  click('#settingsBtn'); await wait(100);
  console.log('options:', [...d.querySelectorAll('.visopt')].map(b => (b.getAttribute('aria-checked') === 'true' ? '*' : '') + T(b.querySelector('b').textContent)).join(' | '));
  click('[data-vis="none"]'); await wait(1600); console.log('set none:', [...d.querySelectorAll('.visopt')].find(b => b.getAttribute('aria-checked') === 'true').querySelector('b').textContent);
  click('[data-vis="summary"]'); await wait(100);
  console.log('prompt:', d.querySelector('#sheetTitle').textContent, '|', T(d.querySelector('#sheetBody p').textContent).slice(0, 90));
  click('[data-act="visfrom"][data-all="0"]'); await wait(1600);
  console.log('note:', T((d.querySelector('[data-act="visall"]') || {}).parentElement ? d.querySelector('[data-act="visall"]').parentElement.textContent : 'none'));
  click('[data-vis="ask"]'); await wait(200); click('[data-act="setback"]');
  // log a run in ask mode
  click('.tabs [data-tab="log"]'); await wait(50); click('[data-newtype="run"]'); await wait(50);
  const set = (s, v) => { const el = d.querySelector(s); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
  set('#dist', '5'); set('#dur', '26:00'); click('[data-act="savelog"]'); await wait(200);
  console.log('ask sheet:', d.querySelector('#sheetTitle').textContent, '|', [...d.querySelectorAll('.shareopt b')].map(b => b.textContent).join(', '));
  click('[data-act="sharepick"][data-v="summary"]'); await wait(200); console.log('toast:', d.querySelector('#toast').textContent);
  // edit it: share row
  click('.tabs [data-tab="history"]'); await wait(100); click(d.querySelector('[data-edit]')); await wait(100);
  console.log('share row:', [...d.querySelectorAll('[data-act="sessshare"]')].map(b => (b.getAttribute('aria-pressed') === 'true' ? '*' : '') + b.textContent).join(' '));
  click('[data-act="sessshare"][data-v="none"]'); await wait(100); console.log('after none:', [...d.querySelectorAll('[data-act="sessshare"]')].map(b => (b.getAttribute('aria-pressed') === 'true' ? '*' : '') + b.textContent).join(' '));
  click('[data-act="cancel"]');
  } catch(e){ console.log('FAIL', e.message); }
  console.log('errors', errs); process.exit(0);
})();

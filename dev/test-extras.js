const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms)); const T = s => (s || '').replace(/\s+/g, ' ').trim();
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.click(); };
const set = (s, v) => { const el = d.querySelector(s); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
(async () => {
  try {
  await wait(3000);
  console.log('muscles:', T(d.querySelector('.hp-muscles') && d.querySelector('.hp-muscles').textContent).slice(0, 200));
  console.log('summary card (wed → none):', !!d.querySelector('.sumcard'));
  w.__demo.summary(); await wait(50); console.log('summary sheet:', d.querySelector('#sheetTitle').textContent, '|', T(d.querySelector('#sheetBody .kv').textContent).slice(0, 160));
  click('#sheetClose'); w.__demo.year(); await wait(50); console.log('year:', T(d.querySelector('#sheetBody .kv').textContent).slice(0, 220));
  click('#sheetClose'); click('.tabs [data-tab="progress"]'); await wait(30); click('[data-pm="badges"]'); await wait(50);
  console.log('badges head:', T(d.querySelector('.bhead').textContent), '| got:', [...d.querySelectorAll('.badge.got b')].map(b => b.textContent).join(', '));
  console.log('pool map:', [...d.querySelectorAll('.preg')].map(b => T(b.textContent)).join(' | '));
  click('[data-act="poolregion"][data-v="Höfuðborgarsvæðið"]'); await wait(30); console.log('region sheet:', d.querySelector('#sheetTitle').textContent, T(d.querySelector('#sheetBody .tiny').textContent), '| first:', T(d.querySelector('#sheetBody .prow').textContent));
  click('#sheetClose');
  // quick log
  click('.tabs [data-tab="log"]'); await wait(30); console.log('quick:', [...d.querySelectorAll('.qchips .chip')].map(c => T(c.textContent)).join(' || '));
  click('[data-act="repeat"]'); await wait(50); console.log('repeat draft:', T(d.querySelector('#view').textContent).slice(0, 80), '| dist:', (d.querySelector('#dist') || {}).value);
  click('[data-act="tplopen"]'); await wait(30); set('#tplname', 'Morgunhlaup'); click('[data-act="tplsave"]'); await wait(30); console.log('toast:', d.querySelector('#toast').textContent);
  click('[data-act="cancel"]'); await wait(30); click('.tabs [data-tab="log"]'); await wait(30);
  console.log('template chip:', T(d.querySelector('.qt') && d.querySelector('.qt').textContent));
  click('.qt'); await wait(40); console.log('from template dist:', (d.querySelector('#dist') || {}).value); click('[data-act="cancel"]'); await wait(20);
  click('.tabs [data-tab="log"]'); await wait(20); click('[data-act="tplmanage"]'); await wait(20); click('[data-act="tpldel"]'); await wait(20); console.log('after delete:', d.querySelectorAll('#sheetBody .prow').length); click('#sheetClose');
  // badges new: log 1 swim at new pool region to trigger pool badge maybe; just log a run and check no error
  click('.tabs [data-tab="log"]'); await wait(20); click('[data-newtype="run"]'); set('#dist', '5'); set('#dur', '25:00'); click('[data-act="savelog"]'); await wait(1200);
  console.log('celebrate after save:', d.querySelector('.celebrate') ? T(d.querySelector('.cbox').textContent) : 'none');
  // verify banner
  const c = d.querySelector('[data-act="closecel"]'); if (c) c.click(); const sc = d.querySelector('[data-act="sheetclose"]'); if (sc) sc.click();
  w.__demo.unverified(); await wait(50); console.log('banner:', T(d.querySelector('.vbanner').textContent).slice(0, 90));
  click('[data-act="verifycheck"]'); await wait(50); console.log('after check:', !!d.querySelector('.vbanner'), d.querySelector('#toast').textContent);
  } catch(e){ console.log('FAIL', e.stack); }
  console.log('errors', errs); process.exit(0);
})();

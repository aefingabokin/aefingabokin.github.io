const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms)); const T = s => (s || '').replace(/\s+/g, ' ').trim();
const set = (s, v) => { const el = d.querySelector(s); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
(async () => {
  try {
  await wait(3000);
  d.querySelector('.tabs [data-tab="log"]').click(); await wait(50); d.querySelector('[data-newtype="golf"]').click(); await wait(50);
  d.querySelector('[data-act="setsub"][data-s="h18"]').click(); await wait(50);
  console.log('fields:', [...d.querySelectorAll('#view [data-field]')].map(i => i.dataset.field).filter(f => !['date','notes'].includes(f)).join(','));
  set('#cf_course', 'Grafarholtsvöllur'); console.log('par autofill:', d.querySelector('#cf_par').value);
  set('#cf_score', '90'); console.log('live rel:', T(d.querySelector('#golfrel').textContent));
  d.querySelector('[data-act="savelog"]').click(); await wait(700);
  console.log('celebrate:', d.querySelector('.celebrate') ? T(d.querySelector('.cbox').textContent) : 'none'); const c = d.querySelector('[data-act="closecel"]'); if (c) c.click();
  console.log('card:', T([...d.querySelectorAll('.list .item')].find(i => i.textContent.includes('Golf')).textContent));
  d.querySelector('.tabs [data-tab="log"]').click(); await wait(50); d.querySelector('[data-newtype="golf"]').click(); await wait(50); d.querySelector('[data-act="setsub"][data-s="range"]').click(); await wait(50);
  console.log('range fields:', [...d.querySelectorAll('#view [data-field]')].map(i => i.dataset.field).filter(f => !['date','notes'].includes(f)).join(','));
  set('#cf_balls', '100'); set('#cf_longest', '240'); d.querySelector('[data-act="savelog"]').click(); await wait(700);
  console.log('celebrate range:', d.querySelector('.celebrate') ? T(d.querySelector('.cbox').textContent) : 'none'); const c2 = d.querySelector('[data-act="closecel"]'); if (c2) c2.click();
  d.querySelector('.tabs [data-tab="progress"]').click(); d.querySelector('[data-pm="cardio"]').click(); d.querySelector('[data-pt="golf"]').click(); await wait(100);
  console.log('golf stats:', [...d.querySelectorAll('.kv .glass')].map(g => T(g.textContent)).join(' | '));
  console.log('charts:', d.querySelectorAll('#view .chart svg').length);
  } catch(e){ console.log('FAIL', e.stack); }
  console.log('errors', errs); process.exit(0);
})();

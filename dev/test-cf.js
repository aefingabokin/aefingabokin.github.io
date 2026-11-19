const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms)); const T = s => (s || '').replace(/\s+/g, ' ').trim();
const set = (s, v) => { const el = d.querySelector(s); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.click(); };
(async () => {
  try {
  await wait(3000);
  click('.tabs [data-tab="log"]'); await wait(50); click('[data-newtype="class"]'); await wait(50); click('[data-act="setsub"][data-s="crossfit"]'); await wait(50);
  console.log('fields:', [...d.querySelectorAll('#view [data-field]')].map(i => i.dataset.field).filter(f => !['date','notes'].includes(f)).join(','));
  click('[data-act="wodpick"][data-v="Fran"]'); await wait(30);
  console.log('desc filled:', d.querySelector('#cf_wodDesc').value, '| best:', T(d.querySelector('.wodbest') && d.querySelector('.wodbest').textContent));
  set('#cf_box', 'CrossFit Reykjavík'); set('#cf_resTime', '5:58');
  click('[data-act="pickex"]'); await wait(50); set('#exq', 'snatch'); await wait(20); click('[data-pickex]'); await wait(50);
  set('[data-sei="0"][data-ssi="0"][data-sk="kg"]', '60'); set('[data-sei="0"][data-ssi="0"][data-sk="reps"]', '2'); click('[data-act="straddset"]'); await wait(20);
  console.log('strength rows:', d.querySelectorAll('.strow').length, 'set2 kg:', d.querySelector('[data-sei="0"][data-ssi="1"][data-sk="kg"]').value);
  click('[data-act="savelog"]'); await wait(700);
  console.log('celebrate:', d.querySelector('.celebrate') ? T(d.querySelector('.cbox').textContent) : 'none'); const c = d.querySelector('[data-act="closecel"]'); if (c) c.click();
  const sc = d.querySelector('[data-act="sheetclose"]'); if (sc) sc.click();
  console.log('card:', T([...d.querySelectorAll('.list .item')].find(i => i.textContent.includes('CrossFit')).textContent));
  // AMRAP format
  click('.tabs [data-tab="log"]'); await wait(50); click('[data-newtype="class"]'); await wait(50); click('[data-act="setsub"][data-s="crossfit"]'); await wait(30);
  click('[data-act="wodfmt"][data-v="amrap"]'); await wait(30); console.log('amrap inputs:', !!d.querySelector('#cf_resRounds'), !!d.querySelector('#cf_resReps'));
  click('[data-act="wodfmt"][data-v="emom"]'); await wait(30); console.log('emom input:', d.querySelector('#cf_resScore').placeholder); click('[data-act="cancel"]');
  // progress
  click('.tabs [data-tab="progress"]'); click('[data-pm="cardio"]'); await wait(30); click('[data-pt="class"]'); await wait(80);
  console.log('wod table:', [...d.querySelectorAll('#view .tbl tbody tr')].map(r => T(r.textContent)).join(' || '));
  click('[data-pm="lift"]'); await wait(50); const sel = d.querySelector('#pex'); console.log('lift list has snatch:', [...sel.options].some(o => o.textContent.includes('Snörun')));
  } catch(e){ console.log('FAIL', e.stack); }
  console.log('errors', errs); process.exit(0);
})();

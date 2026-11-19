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
  click('[data-act="wprev"]'); await wait(80);
  const cells = [...d.querySelectorAll('button.wbtn')]; console.log('cell buttons:', cells.length, '| with workouts:', cells.filter(c => !c.classList.contains('none')).length);
  const one = cells.find(c => !c.classList.contains('none') && !c.classList.contains('multi') && c.dataset.wday.startsWith('u1'));
  click(one); await wait(80);
  console.log('opened editor:', !!d.querySelector('.editbar'), '| editbar:', T(d.querySelector('.editbar') && d.querySelector('.editbar').textContent).slice(0, 60), '| date:', d.querySelector('#ddate').value);
  const y = d.querySelector('#ddate').value; const nd = new Date(y); nd.setDate(nd.getDate() - 1); const nds = nd.toISOString().slice(0, 10);
  set('#ddate', nds); click('[data-act="savelog"]'); await wait(200);
  const sc = d.querySelector('[data-act="sheetclose"]'); if (sc) sc.click();
  console.log('saved; toast:', d.querySelector('#toast').textContent);
  click('.tabs [data-tab="home"]'); await wait(50); click('[data-act="wprev"]'); await wait(80);
  const empty = [...d.querySelectorAll('button.wbtn.none')].find(c => c.dataset.wday.startsWith('u1')); click(empty); await wait(50);
  console.log('empty day sheet:', d.querySelector('#sheetTitle').textContent, '|', T(d.querySelector('#sheetBody').textContent).slice(0, 80));
  const day = empty.dataset.wday.split('|')[1]; click('[data-act="logday"]'); await wait(50); console.log('after logday:', T(d.querySelector('#view').textContent).slice(0,120), '| sheet open:', d.querySelector('#sheet').classList.contains('open')); click('[data-newtype="run"]'); await wait(50);
  console.log('preset date on new:', d.querySelector('#ddate').value === day, d.querySelector('#ddate').value, day);
  click('[data-act="cancel"]');
  const multi = [...d.querySelectorAll('button.wbtn.multi')][0];
  if (multi){ click('.tabs [data-tab="home"]'); await wait(50); click('[data-act="wprev"]'); await wait(50); click([...d.querySelectorAll('button.wbtn.multi')][0]); await wait(50); console.log('multi sheet items:', d.querySelectorAll('#sheetBody .item').length); }
  click('.tabs [data-tab="history"]'); await wait(80); console.log('edit hint in list:', !!d.querySelector('.list .edhint'));
  } catch(e){ console.log('FAIL', e.stack); }
  console.log('errors', errs); process.exit(0);
})();

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
  console.log('fields:', [...d.querySelectorAll('#view [data-field]')].map(i => i.dataset.field).filter(f => !['date','notes'].includes(f)).join(','), '| pb btn:', T(d.querySelector('.pbbtn').textContent));
  click('[data-act="pbopen"]'); await wait(50);
  const names = [...d.querySelectorAll('.pblist b')].map(b => b.textContent); console.log('list first/last:', names.slice(0, 5).join(', '), '...', names.slice(-4).join(', '), '| count', names.length);
  console.log('snatch row:', T([...d.querySelectorAll('.pblist button')].find(b => b.textContent.includes('Snatch') && !b.textContent.includes('Power')).textContent));
  set('#pbq', 'snat'); await wait(20); console.log('search:', [...d.querySelectorAll('.pblist b')].map(b => b.textContent).join(', '));
  click('[data-pbk="snatch"]'); await wait(30); console.log('entry:', d.querySelector('#sheetTitle').textContent, '|', T(d.querySelector('#sheetBody .tiny').textContent));
  set('#pbv', '60'); click('[data-act="pbsave"]'); await wait(20); console.log('warn:', T(d.querySelector('#pbwarn').textContent));
  set('#pbv', '67.5'); d.querySelector('#pbwarn').dataset.ok = ''; click('[data-act="pbsave"]'); await wait(50);
  console.log('chips:', [...d.querySelectorAll('.pbchip')].map(c => T(c.textContent)).join(' | '), '| btn:', T(d.querySelector('.pbbtn').textContent));
  click('[data-act="pbopen"]'); await wait(30); click('[data-pbk="fran"]'); await wait(30); set('#pbv', '5:58'); click('[data-act="pbsave"]'); await wait(30);
  click('[data-act="pbopen"]'); await wait(30); click('[data-act="pbcustom"]'); await wait(30); set('#pbname', 'Wall walk'); click('[data-act="pbkind"][data-v="reps"]'); click('[data-act="pbcustomgo"]'); await wait(30); set('#pbv', '12'); click('[data-act="pbsave"]'); await wait(30);
  click('[data-act="savelog"]'); await wait(700);
  console.log('celebrate:', d.querySelector('.celebrate') ? T(d.querySelector('.cbox').textContent) : 'none'); const c = d.querySelector('[data-act="closecel"]'); if (c) c.click();
  const sc = d.querySelector('[data-act="sheetclose"]'); if (sc) sc.click();
  console.log('card:', T([...d.querySelectorAll('.list .item')].find(i => i.textContent.includes('CrossFit')).textContent));
  click('.tabs [data-tab="progress"]'); click('[data-pm="cardio"]'); await wait(30); click('[data-pt="class"]'); await wait(80);
  console.log('pb table:', [...d.querySelectorAll('#view .tbl tbody tr')].map(r => T(r.textContent)).join(' || '));
  } catch(e){ console.log('FAIL', e.stack); }
  console.log('errors', errs); process.exit(0);
})();

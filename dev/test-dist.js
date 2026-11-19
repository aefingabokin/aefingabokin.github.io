const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {};
  w.Blob.prototype.text = function(){ return new Promise(r => { const fr = new w.FileReader(); fr.onload = () => r(fr.result); fr.readAsText(this); }); }; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms)); const T = s => (s || '').replace(/\s+/g, ' ').trim();
const set = (s, v) => { const el = d.querySelector(s); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.click(); };
(async () => {
  try {
  await wait(3000);
  click('.tabs [data-tab="log"]'); await wait(50); click('[data-newtype="run"]'); await wait(50);
  console.log('presets:', [...d.querySelectorAll('[data-act="distpre"]')].map(b => b.textContent).join(', '));
  click('[data-act="distpre"][data-v="10"]'); console.log('after 10:', d.querySelector('#dist').value, '| pressed:', d.querySelector('[data-act="distpre"][aria-pressed="true"]').textContent);
  click('[data-act="diststep"][data-dir="1"]'); click('[data-act="diststep"][data-dir="1"]'); console.log('after ++:', d.querySelector('#dist').value, '| pressed:', !!d.querySelector('[data-act="distpre"][aria-pressed="true"]'));
  click('[data-act="diststep"][data-dir="-1"]'); console.log('after -:', d.querySelector('#dist').value);
  // yesterday's manual run
  const y = new Date(); y.setDate(y.getDate() - 1); const ymd = `${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;
  set('[data-field="date"]', ymd); click('[data-act="distpre"][data-v="10"]'); set('#dur', '55:00'); d.querySelector('[data-field="notes"]').value = 'Góður dagur'; d.querySelector('[data-field="notes"]').dispatchEvent(new w.Event('input', { bubbles: true }));
  click('[data-act="savelog"]'); await wait(200); const sc = d.querySelector('[data-act="sheetclose"]'); if (sc) sc.click();
  // swim presets
  click('.tabs [data-tab="log"]'); await wait(30); click('[data-newtype="swim"]'); await wait(30); console.log('swim presets:', [...d.querySelectorAll('[data-act="distpre"]')].map(b => b.textContent).join(', '));
  click('[data-act="diststep"][data-dir="1"]'); console.log('swim step:', d.querySelector('#dist').value); click('[data-act="cancel"]');
  // import sample (Garmin run yesterday 10.21 km)
  [...d.querySelectorAll('#demoPanel [data-d]')].find(x => x.textContent === 'Sækja úr úri: sýnidæmi').click(); await wait(900);
  const run = [...d.querySelectorAll('.impitem')].find(i => i.textContent.includes('Hlaup'));
  console.log('run item:', T(run.textContent), '| checked:', run.querySelector('input').checked);
  click('[data-act="impgo"]'); await wait(300);
  console.log('toast:', d.querySelector('#toast').textContent);
  click('.tabs [data-tab="history"]'); await wait(80);
  const runs = [...d.querySelectorAll('.list .item')].filter(i => i.textContent.includes('Hlaup') && i.textContent.includes(['sun','mán','þri','mið','fim','fös','lau'][y.getDay()] + ' ' + y.getDate() + '.'));
  console.log('runs yesterday:', runs.length, runs.map(r => T(r.textContent)).join(' || '));
  } catch(e){ console.log('FAIL', e.stack); }
  console.log('errors', errs); process.exit(0);
})();

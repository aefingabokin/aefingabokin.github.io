const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms)); const T = s => (s || '').replace(/\s+/g, ' ').trim();
const set = (s, v) => { const el = d.querySelector(s); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
(async () => {
  try {
  await wait(3000);
  d.querySelector('.tabs [data-tab="log"]').click(); await wait(50); d.querySelector('[data-newtype="swim"]').click(); await wait(50);
  console.log('pool btn:', T(d.querySelector('.poolbtn').textContent));
  d.querySelector('[data-act="poolpick"]').click(); await wait(50);
  console.log('groups:', [...d.querySelectorAll('#poollist .grp')].map(g => g.textContent).join(' / '));
  console.log('mine:', [...d.querySelectorAll('#poollist .pick')][0].querySelectorAll('li').length, [...[...d.querySelectorAll('#poollist .pick')][0].querySelectorAll('li')].map(l => T(l.textContent)).join(' | '));
  const allList = [...d.querySelectorAll('#poollist .pick')][1]; console.log('all first 5:', [...allList.querySelectorAll('b')].slice(0, 5).map(b => b.textContent).join(', '), '| total:', allList.querySelectorAll('li').length);
  console.log('last 3:', [...allList.querySelectorAll('b')].slice(-3).map(b => b.textContent).join(', '));
  set('#poolq', 'akur'); await wait(20); console.log('search akur:', [...d.querySelectorAll('#poollist b')].map(b => b.textContent).join(', '));
  set('#poolq', 'Leynilaug'); await wait(20); console.log('custom btn:', T(d.querySelector('#poollist .btn.primary').textContent));
  set('#poolq', 'vesturb'); await wait(20); d.querySelector('#poollist [data-pool="Vesturbæjarlaug"]').click(); await wait(50);
  console.log('chosen:', T(d.querySelector('.poolbtn').textContent));
  set('#dist', '800'); d.querySelector('[data-act="savelog"]').click(); await wait(300);
  const c = d.querySelector('[data-act="sheetclose"]'); if (c) c.click();
  console.log('card:', T([...d.querySelectorAll('.list .item')].find(i => i.textContent.includes('Sund')).textContent));
  d.querySelector('.tabs [data-tab="progress"]').click(); d.querySelector('[data-pm="cardio"]').click(); d.querySelector('[data-pt="swim"]').click(); await wait(80);
  const ps = [...d.querySelectorAll('.kv .glass')].find(g => g.textContent.includes('Laugarnar')); console.log('pool stats:', T(ps && ps.textContent));
  } catch(e){ console.log('FAIL', e.stack); }
  console.log('errors', errs); process.exit(0);
})();

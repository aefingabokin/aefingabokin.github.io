const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms)); const T = s => (s || '').replace(/\s+/g, ' ').trim();
(async () => {
  await wait(3000);
  console.log('kudos card:', T(d.querySelector('.kcard') && d.querySelector('.kcard').textContent));
  d.querySelector('.kcard').click(); await wait(100);
  console.log('sheet:', d.querySelector('#sheetTitle').textContent, '|', [...d.querySelectorAll('.kgroup')].map(g => T(g.textContent)).join(' || '));
  d.querySelector('#sheetClose').click();
  console.log('list badges:', [...d.querySelectorAll('.list .kb')].map(b => T(b.textContent)).join(' , '));
  d.querySelector('.tabs [data-tab="friends"]').click(); await wait(200);
  const kb = d.querySelector('.flist .kudos'); kb.click(); await wait(50);
  console.log('picker:', [...d.querySelectorAll('#reactPop .rbtn')].map(b => T(b.textContent)).join(' | '));
  d.querySelector('#reactPop [data-react="muscle"]').click(); await wait(150);
  console.log('after react:', T(d.querySelector('.flist .kudos').textContent), d.querySelector('.flist .kudos').getAttribute('aria-pressed'), '| toast:', d.querySelector('#toast').textContent);
  d.querySelector('.flist .kudos').click(); await wait(50);
  console.log('picker again:', [...d.querySelectorAll('#reactPop .rbtn')].map(b => b.className.includes('on') ? '[' + T(b.textContent) + ']' : T(b.textContent)).join(' | '));
  d.querySelector('#reactPop [data-react=""]').click(); await wait(150);
  console.log('after remove:', T(d.querySelector('.flist .kudos').textContent), d.querySelector('.flist .kudos').getAttribute('aria-pressed'));
  d.querySelector('.flist .kudos').click(); await wait(30); d.querySelector('#view h1').click(); await wait(30); console.log('closed on outside tap:', !d.querySelector('#reactPop'));
  // goal kudos in profile
  w.__demo.openProfile('u3'); await wait(100); const gc = d.querySelector('#sheetBody .gcard'); if (gc) { gc.click(); await wait(100); }
  const gk = d.querySelector('#sheetBody [data-gkudos]'); if (gk){ gk.click(); await wait(50); d.querySelector('#reactPop [data-react="fire"]').click(); await wait(150); console.log('goal kudos btn:', T(d.querySelector('#sheetBody [data-gkudos]').textContent)); }
  console.log('errors', errs); process.exit(0);
})();

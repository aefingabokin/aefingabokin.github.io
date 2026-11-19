const {JSDOM} = require('jsdom');
const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true,
  beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message + ' @' + e.lineno));
const wait = ms => new Promise(r => setTimeout(r, ms));
const T = s => (s || '').replace(/\s+/g, ' ').trim();
(async () => {
  await wait(2500);
  console.log('gate:', d.body.dataset.gate, '| who:', T(d.querySelector('#who').textContent), '| home h1:', d.querySelector('h1').textContent);
  console.log('home sections:', [...d.querySelectorAll('#view h2, #view section, #view .stats')].map(e => e.tagName === 'H2' ? T(e.textContent) : e.className.split(' ').join('.')).join(' | '));
  console.log('goals home:', T(d.querySelector('.ghome') && d.querySelector('.ghome').textContent).slice(0, 160));
  const btns = [...d.querySelectorAll('#demoPanel [data-d]')];
  console.log('screens:', btns.length);
  for (const b of btns){
    b.click(); await wait(700);
    const sheet = d.querySelector('#sheet').classList.contains('open') ? 'sheet:' + d.querySelector('#sheetTitle').textContent : '';
    const cel = d.querySelector('.celebrate') ? 'celebrate' : '';
    const h1 = d.querySelector('#view h1'); 
    console.log(` ${b.textContent.padEnd(30)} gate=${d.body.dataset.gate} tab=${(d.querySelector('.tabs [aria-current=page]')||{}).textContent||'-'} h1=${h1 ? h1.textContent : '-'} ${sheet} ${cel} len=${d.querySelector('#view').textContent.length}`);
  }
  // a few content checks
  w.__demo.gate('app'); await wait(100); d.querySelector('[data-tab="friends"]').click(); await wait(200); d.querySelector('[data-fm="week"]').click(); await wait(100);
  console.log('feed sample:', [...d.querySelectorAll('.flist .t')].slice(0, 4).map(x => T(x.textContent)).join(' / '));
  d.querySelector('[data-fm="ch"]').click(); await wait(100); console.log('challenge:', T(d.querySelector('.chcard').textContent).slice(0, 170));
  d.querySelector('.tabs [data-tab="progress"]').click(); d.querySelector('[data-pm="goals"]').click(); await wait(200);
  console.log('goal cards:', [...d.querySelectorAll('.gcard')].map(g => T(g.textContent).slice(0, 70)).join(' || '));
  d.querySelector('[data-pm="body"]').click(); await wait(100); console.log('body tiles:', [...d.querySelectorAll('.mtile')].map(t => T(t.textContent)).join(' | '));
  d.querySelector('[data-pm="lift"]').click(); await wait(100); console.log('lift kv:', T(d.querySelector('.kv') && d.querySelector('.kv').textContent));
  console.log('errors', errs);
  process.exit(0);
})();

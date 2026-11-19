const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms)); const T = s => (s || '').replace(/\s+/g, ' ').trim();
(async () => {
  await wait(3000);
  console.log('PRs:', [...d.querySelectorAll('.pr .n')].map(x => x.textContent).join(', '));
  console.log('today header:', d.querySelector('.wd.today').outerHTML);
  d.querySelector('.tabs [data-tab="friends"]').click(); await wait(150); d.querySelector('.flist .kudos').click(); await wait(50);
  console.log('picker:', [...d.querySelectorAll('#reactPop .rbtn')].map(b => T(b.textContent) + '(' + b.getAttribute('aria-label') + ')').join(' '));
  console.log('errors', errs); process.exit(0);
})();

const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await wait(2500);
  console.log('tab order:', [...d.querySelectorAll('.tabs button')].map(b => b.dataset.tab).join(','), '| home cta:', d.querySelectorAll('#view .cta[data-act="newlog"]').length);
  d.querySelector('.tabs .tab-log').click(); await wait(100);
  console.log('after center tap:', d.querySelector('#view h1') ? d.querySelector('#view h1').textContent : '-', '| current:', d.querySelector('.tabs [aria-current="page"]').dataset.tab);
  console.log('errors', errs); process.exit(0);
})();

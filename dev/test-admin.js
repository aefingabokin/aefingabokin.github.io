const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-stjornbord-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/admin/', pretendToBeVisual: true });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const T = s => (s || '').replace(/\s+/g, ' ').trim();
setTimeout(() => {
  console.log('kpis:', [...d.querySelectorAll('.akpi')].map(k => T(k.textContent)).join(' | '));
  console.log('tips:'); [...d.querySelectorAll('.atips li')].forEach(l => console.log('  -', T(l.textContent)));
  console.log('sections:', [...d.querySelectorAll('.acard h2')].map(h => h.textContent).join(', '));
  console.log('top exercises:', [...d.querySelectorAll('.acard')][3].querySelectorAll('.an').length, [...[...d.querySelectorAll('.acard')][3].querySelectorAll('.an')].slice(0, 4).map(x => x.textContent).join(', '));
  console.log('cohort rows:', d.querySelectorAll('.atable tbody tr').length);
  d.querySelector('[data-range="90"]').click(); console.log('after 90:', d.querySelector('[data-range="90"]').getAttribute('aria-pressed'));
  console.log('errors', errs);
}, 300);

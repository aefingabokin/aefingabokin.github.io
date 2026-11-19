const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await wait(2500);
  for (const v of ['A','B','C','D']){
    const b = [...d.querySelectorAll('#demoPanel [data-d]')].find(x => x.textContent === `Vikurit ${v}`); b.click(); await wait(900);
    const cells = [...d.querySelectorAll('#view .week .wc')];
    console.log(v, '| style:', d.querySelector('#view .wc').className, '| cells:', cells.length, '| with icons:', cells.filter(c => c.querySelector('svg')).length,
      '| D labels:', [...d.querySelectorAll('#view .wc small')].slice(0, 6).map(x => x.textContent).join(' '), '| legend icons:', d.querySelectorAll('#view .legend svg').length);
  }
  d.querySelector('#settingsBtn').click(); await wait(200);
  console.log('settings previews:', [...d.querySelectorAll('.wsopt')].map(o => o.querySelector('b').textContent + ':' + o.querySelectorAll('.wc').length + (o.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' '));
  d.querySelector('[data-act="setback"]').click(); await wait(100); d.querySelector('.tabs [data-tab="friends"]').click(); await wait(200);
  console.log('friends cells:', d.querySelectorAll('#view .week .wc').length, 'icons:', d.querySelectorAll('#view .week .wc svg').length);
  console.log('errors', errs); process.exit(0);
})();

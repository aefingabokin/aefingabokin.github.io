const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms)); const T = s => (s || '').replace(/\s+/g, ' ').trim();
(async () => {
  await wait(3000);
  console.log('stats heading:', T(d.querySelector('.sech').textContent), '| first label:', d.querySelector('.stat .l').textContent);
  console.log('today label:', T(d.querySelector('.wd.today').textContent));
  d.querySelector('[data-act="wprev"]').click(); await wait(100); console.log('prev week heading:', T(d.querySelector('.sech').textContent));
  d.querySelector('.tabs [data-tab="friends"]').click(); await wait(150); d.querySelector('[data-act="addfriend"]').click(); await wait(50);
  const f = d.querySelector('#fcode');
  for (const v of ['gunna@daemi.is', 'nyr@daemi.is', 'enginn@daemi.is', 'aron@daemi.is', 'HAL3ZK']) {
    if (!d.querySelector('#fcode')) d.querySelector('[data-act="addfriend"]').click(); await wait(30);
    d.querySelector('#fcode').value = v; d.querySelector('[data-act="sendreq"]').click(); await wait(120);
    console.log(` ${v} → ${d.querySelector('#toast').textContent}`);
  }
  w.__demo.invite('HAL3ZK'); await wait(150);
  console.log('invite sheet:', d.querySelector('#sheetTitle').textContent, '|', T(d.querySelector('.invite').textContent));
  d.querySelector('[data-act="invitesend"]').click(); await wait(100); console.log('after invite:', d.querySelector('#toast').textContent);
  console.log('errors', errs); process.exit(0);
})();

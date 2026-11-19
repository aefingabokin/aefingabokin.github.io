const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const ua = process.argv[2];
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/#upphaf', pretendToBeVisual: true, userAgent: ua, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; w.matchMedia = q => ({ matches: false, addEventListener(){}, removeEventListener(){} }); } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms)); const T = s => (s || '').replace(/\s+/g, ' ').trim();
(async () => {
  await wait(3200);
  console.log('gate:', d.body.dataset.gate, '| welcome:', !!d.querySelector('.welcome'), '| install card:', T(d.querySelector('.welcome .installcard') && d.querySelector('.welcome .installcard').textContent));
  // simulate native prompt
  const ev = new w.Event('beforeinstallprompt'); let prompted = false; ev.prompt = () => { prompted = true; }; ev.userChoice = Promise.resolve({ outcome: 'accepted' }); w.dispatchEvent(ev); await wait(50);
  console.log('btn after prompt avail:', d.querySelector('.welcome [data-act="install"]').textContent);
  d.querySelector('.welcome [data-act="install"]').click(); await wait(50); console.log('native prompt called:', prompted);
  d.querySelector('.welcome [data-act="install"]').click(); await wait(50);
  console.log('help tab:', d.querySelector('[data-act="installtab"][aria-pressed="true"]').textContent, '| steps:', [...d.querySelectorAll('.isteps li')].map(l => T(l.textContent)).join(' / '));
  console.log('errors', errs); process.exit(0);
})();

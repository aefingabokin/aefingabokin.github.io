const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms)); const T = s => (s || '').replace(/\s+/g, ' ').trim();
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
(async () => {
  try {
  await wait(3000);
  console.log('home card:', T(d.querySelector('.ccard') && d.querySelector('.ccard').textContent));
  d.querySelector('.ccard').click(); await wait(150);
  console.log('own sheet:', d.querySelector('#sheetTitle').textContent, '|', [...d.querySelectorAll('.cm')].map(c => T(c.textContent)).join(' || '));
  console.log('quick (own):', [...d.querySelectorAll('[data-act="cmquick"]')].map(b => b.textContent).join(' | '));
  d.querySelector('#sheetClose').click(); await wait(100); console.log('card after read:', !!d.querySelector('.ccard'));
  d.querySelector('.tabs [data-tab="friends"]').click(); await wait(200);
  d.querySelector('.flist .cbtn').click(); await wait(200);
  console.log('friend sheet:', d.querySelector('#sheetTitle').textContent, '| comments:', d.querySelectorAll('.cm').length, '| quick:', [...d.querySelectorAll('[data-act="cmquick"]')].map(b => b.textContent).join(' | '));
  const t = d.querySelector('#cmtext');
  type(t, Array(45).fill('orð').join(' ')); console.log('45 words:', d.querySelector('#cmcount').textContent, d.querySelector('#cmcount').className, 'send disabled:', d.querySelector('[data-act="cmsend"]').disabled);
  d.querySelector('[data-act="cmquick"]').click(); console.log('quick filled:', d.querySelector('#cmtext').value, '| disabled:', d.querySelector('[data-act="cmsend"]').disabled);
  d.querySelector('[data-act="cmsend"]').click(); await wait(200);
  console.log('after send:', [...d.querySelectorAll('.cm')].map(c => T(c.querySelector('.cmb').textContent)).join(' || '), '| box empty:', d.querySelector('#cmtext').value === '');
  d.querySelector('.cm.mine [data-act="cmdel"]').click(); await wait(150); console.log('after delete:', d.querySelectorAll('.cm').length);
  // editing own session shows comments block
  d.querySelector('#sheetClose').click(); d.querySelector('.tabs [data-tab="history"]').click(); await wait(100);
  const run = [...d.querySelectorAll('[data-edit]')].find(b => b.textContent.includes('Hlaup')); run.click(); await wait(200);
  console.log('editor comments:', d.querySelectorAll('.cmts .cm').length);
  } catch(e){ console.log('FAIL', e.stack); }
  console.log('errors', errs); process.exit(0);
})();

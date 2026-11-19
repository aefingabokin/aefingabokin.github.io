const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms));
const go = async t => { [...d.querySelectorAll('#demoPanel [data-d]')].find(x => x.textContent === t).click(); await wait(400); };
(async () => {
  await wait(2500);
  await go('Upphafsskjár'); console.log('start:', !!d.querySelector('.welcome'), d.querySelectorAll('.wfeat li').length);
  await go('Nýr aðgangur með netfangi'); console.log('signup h1:', d.querySelector('#view h1').textContent);
  d.querySelector('#au_name').value = 'Prófun Jónsdóttir'; d.querySelector('#au_email').value = 'prof@daemi.is'; d.querySelector('#au_pw').value = 'langtlykilord';
  d.querySelector('#authform').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await wait(300);
  console.log('→', d.body.dataset.gate, d.querySelector('#myname') && d.querySelector('#myname').value);
  d.querySelector('[data-act="create"]').click(); await wait(300); console.log('→', d.body.dataset.gate);
  d.querySelector('[data-act="sportsnext"]').click(); await wait(200); console.log('→', d.body.dataset.gate);
  d.querySelector('[data-act="aboutskip"]').click(); await wait(800); console.log('→', d.body.dataset.gate, d.querySelector('#view h1').textContent);
  await go('Gleymt lykilorð'); console.log('reset h1:', d.querySelector('#view h1').textContent);
  console.log('errors', errs); process.exit(0);
})();

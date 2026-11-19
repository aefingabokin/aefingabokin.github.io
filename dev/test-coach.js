const {JSDOM} = require('jsdom'); const fs = require('fs');
let html = fs.readFileSync('./dev/out/aefingabokin-synishorn.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace('<script type="module">','<script>');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://x.test/', pretendToBeVisual: true, beforeParse(w){ w.scrollTo = () => {}; w.confirm = () => true; w.Element.prototype.scrollIntoView = () => {}; w.navigator.vibrate = () => true; } });
const w = dom.window, d = w.document; const errs = []; w.addEventListener('error', e => errs.push(e.message));
const wait = ms => new Promise(r => setTimeout(r, ms)); const T = s => (s || '').replace(/\s+/g, ' ').trim();
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.click(); };
const set = (s, v) => { const el = d.querySelector(s); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
(async () => {
  try {
  await wait(3000);
  click('.tabs [data-tab="log"]'); await wait(50);
  console.log('entry card:', T(d.querySelector('.plancard').textContent));
  click('[data-act="planopen"]'); await wait(50);
  console.log('groups:', [...d.querySelectorAll('[data-act="plgroup"]')].map(b => T(b.textContent)).join(' | '));
  console.log('combos:', [...d.querySelectorAll('[data-act="plcombo"] b')].map(b => b.textContent).join(', '), '| goals:', [...d.querySelectorAll('.plgoal b')].map(b => b.textContent).join(', '));
  // choose legs only, strength, advanced, 60
  const pressed = [...d.querySelectorAll('[data-act="plgroup"][aria-pressed="true"]')]; for (const b of pressed){ b.click(); await wait(20); }
  click('[data-act="plgroup"][data-v="legs"]'); await wait(20); click('[data-act="plgoal"][data-v="strength"]'); await wait(20); click('[data-act="pllevel"][data-v="advanced"]'); await wait(20); click('[data-act="plmins"][data-v="60"]'); await wait(20);
  click('[data-act="plbuild"]'); await wait(80);
  console.log('preview:', T(d.querySelector('#view h1').textContent), '|', [...d.querySelectorAll('.plmeta .pill')].map(p => p.textContent).join(', '));
  [...d.querySelectorAll('.pitem')].forEach(li => console.log('  -', T(li.querySelector('.pbody').textContent).slice(0, 170)));
  click('[data-act="planswap"][data-i="2"]'); await wait(30); console.log('swap options:', [...d.querySelectorAll('#sheetBody [data-act="planpick"] b')].slice(0, 6).map(b => b.textContent).join(', '));
  click(d.querySelectorAll('#sheetBody [data-act="planpick"]')[1]); await wait(30);
  console.log('after swap #3:', T(d.querySelectorAll('.pitem')[2].querySelector('.ptop b').textContent));
  click('[data-act="planshuffle"]'); await wait(50); console.log('after shuffle:', [...d.querySelectorAll('.pitem .ptop b')].map(b => b.textContent).join(', '));
  click('[data-act="planrm"][data-i="4"]'); await wait(30); console.log('items after remove:', d.querySelectorAll('.pitem').length);
  click('[data-act="planstart"]'); await wait(80);
  console.log('lift view: planbar', T(d.querySelector('.planbar').textContent), '| target:', T(d.querySelector('.ptarget').textContent));
  console.log('cur inputs:', d.querySelector('[data-cur="kg"]').value, d.querySelector('[data-cur="reps"]').value);
  // log 4 sets at 100 x 6 on first exercise
  for (let i = 0; i < 4; i++){ set('[data-cur="kg"]', '100'); set('[data-cur="reps"]', '6'); click('[data-act="doneset"]'); await wait(30); }
  console.log('after 4 sets:', T(d.querySelector('.ptarget .pset').textContent), '| next pulses:', !!d.querySelector('.btn.pulse'), '| rest box target:', d.querySelector('[data-rest]').dataset.target);
  w.eval("void 0"); 
  click('[data-act="savelog"]'); await wait(300); const sc = d.querySelector('[data-act="sheetclose"]'); if (sc) sc.click();
  { const ss = w.__demo._state().sessions.filter(x => x.plan); console.log('saved plan sessions:', ss.length, JSON.stringify(ss.map(x => ({date: x.date, c: x.createdAt, ex: x.exercises.map(e => [e.exId, e.t, e.sets.length])}))).slice(0, 400)); const sq = w.__demo._state().sessions.filter(x => (x.exercises||[]).some(e => e.exId === 'x_hnébeygja')).map(x => [x.date, x.createdAt, x.profileId]); console.log('squat sessions:', JSON.stringify(sq.slice(0,5))); }
  // rebuild same → progression on squat
  click('.tabs [data-tab="log"]'); await wait(30); click('[data-act="planopen"]'); await wait(30);
  console.log('repeat btn:', T(d.querySelector('[data-act="planrepeat"]') && d.querySelector('[data-act="planrepeat"]').textContent));
  click('[data-act="planrepeat"]'); await wait(80);
  console.log('progression first:', T(d.querySelector('.pitem .pbody').textContent).slice(0, 200));
  // beginner check
  click('[data-act="planopen"]'); await wait(30); click('[data-act="pllevel"][data-v="beginner"]'); await wait(20); click('[data-act="plbuild"]'); await wait(60);
  console.log('beginner legs strength:', [...d.querySelectorAll('.pitem')].map(li => T(li.querySelector('.ptop b').textContent) + ' ' + T(li.querySelector('.prx b').textContent)).join(' | '));
  } catch(e){ console.log('FAIL', e.stack); }
  console.log('errors', errs); process.exit(0);
})();

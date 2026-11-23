/* Tímaæfingar (planki: niðurtalning, skeiðklukka, handskráður tími) og eigin þyngd (upphífingar: eigin þyngd,
   aukaþyngd og létting með heildarþyngd) – 3.9 */
import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('./index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.scrollBy = () => {}; w.confirm = () => true; globalThis.confirm = () => true;
w.matchMedia = q => ({ matches: false, addEventListener(){}, removeEventListener(){} });
const errs = []; w.addEventListener('error', e => errs.push(e.message));
/* Klukkan er færð áfram í prófuninni í stað þess að bíða */
const realNow = Date.now; let skew = 0; Date.now = () => realNow() + skew;

const db = { users: { u1: { householdId: 'H1', settings: { news: '9.9' } } }, households: { H1: { owner: 'u1', members: ['u1'], profiles: { u1: { name: 'Aron' } } } },
  sessions: {
    /* Eldri upphífingar (fyrir 3.9): kg var aukaþyngdin. Eldri aðstoðarvél: kg var léttingin. */
    old1: { id: 'old1', profileId: 'u1', type: 'lift', date: '2026-11-10', exercises: [{ exId: 'x_upphífingar', name: 'Upphífingar', sets: [{ kg: 10, reps: 5 }] },
      { exId: 'x_upphífingar-með-aðstoð', name: 'Upphífingar með aðstoð', sets: [{ kg: 30, reps: 8 }] }] },
    old2: { id: 'old2', profileId: 'u1', type: 'lift', date: '2026-11-12', exercises: [{ exId: 'x_planki', name: 'Planki', sets: [{ sec: 45 }, { sec: 50 }] }] }
  } };
const exercises = [];
const Store = {
  configured: true,
  onAuthChange(cb){ setTimeout(() => cb({ uid: 'u1', name: 'Aron', email: 'aron@x.is' }), 0); },
  async signOut(){}, async loadMembership(uid){ return db.users[uid].householdId; },
  async getSettings(uid){ return db.users[uid].settings; }, async saveSettings(){},
  subscribe(hid, cb){ setTimeout(() => cb({ household: db.households.H1, sessions: Object.values(db.sessions), exercises }), 0); return () => {}; },
  async putSession(h, s){ db.sessions[s.id] = JSON.parse(JSON.stringify(s)); },
  async putExercise(h, ex){ const i = exercises.findIndex(e => e.id === ex.id); if (i >= 0) exercises[i] = { ...ex }; else exercises.push({ ...ex }); }
};
const { startApp } = await import('./gh/js/ui.js');
const d = document, wait = (ms = 40) => new Promise(r => setTimeout(r, ms));
const q = s => d.querySelector(s), txt = el => el ? (el.children.length ? [...el.childNodes].map(n => n.textContent.trim()).filter(Boolean).join(' ') : el.textContent).replace(/\s+/g, ' ').trim() : '(vantar)';
const click = s => { const el = typeof s === 'string' ? q(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const set = (sel, v) => { const el = q(sel); if (!el) throw new Error('missing ' + sel); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); };
const pick = id => click([...d.querySelectorAll('[data-pickex]')].find(b => b.dataset.pickex === id) || 'missing-' + id);
const done = () => [...d.querySelectorAll('.done .sv')].map(x => x.firstChild.textContent.trim() + (x.querySelector('.bwk') ? ` [${x.querySelector('.bwk').textContent}]` : '')).reverse().join(', ');
let fails = 0; const ok = (label, cond, extra = '') => { if (!cond) fails++; console.log(cond ? 'ok  ' : 'FAIL', label, extra); };
try {
  const app = startApp(Store); await wait(1300);
  if (q('#sheet').classList.contains('open')) { click('#sheetClose'); await wait(300); }

  /* ---------- Planki ---------- */
  click('[data-tab="log"]'); click('[data-newtype="lift"]'); await wait();
  set('#exq', 'plank'); await wait();
  ok('planki finnst með ensku', [...d.querySelectorAll('[data-pickex]')].some(b => b.dataset.pickex === 'x_planki'));
  pick('x_planki'); await wait();
  ok('tímareitur í stað kg/reps', !!q('input[data-cur="sec"]') && !q('input[data-cur="kg"]') && !q('input[data-cur="reps"]'));
  ok('byrjar á síðasta tíma (45 sek)', q('input[data-cur="sec"]').value === '0:45', q('input[data-cur="sec"]').value);
  ok('ekkert drop í tímaæfingu', !q('[data-act="settype"][data-v="drop"]'));
  click('[data-act="secpre"][data-v="60"]'); await wait();
  ok('fljótval 1:00', q('input[data-cur="sec"]').value === '1:00' && /Telja niður 1:00/.test(txt(q('.bigbtn.go'))), txt(q('.bigbtn.go')));
  set('input[data-cur="sec"]', '1.30'); await wait();
  ok('„1.30“ verður 1:30', q('input[data-cur="sec"]').value === '1:30', q('input[data-cur="sec"]').value);
  click('[data-act="step"][data-k="sec"][data-d="-1"]'); await wait();
  ok('− tekur 5 sek', q('input[data-cur="sec"]').value === '1:25');
  click('[data-act="secpre"][data-v="60"]'); await wait();
  click('[data-act="doneset"]'); await wait();
  ok('handskráð sett', done() === '1:00 mín', done());
  ok('samanburður við síðast', txt(q('.done li .cmp')) === '+15 sek', txt(q('.done li .cmp')));

  /* Niðurtalning: 5 sek undirbúningur, svo 1:00 */
  click('[data-act="timedgo"]'); await wait();
  ok('undirbúningur', !!q('.tmbox.lead') && txt(q('[data-tml]')) === 'Komdu þér í stöðu' && txt(q('[data-tmt]')) === '5', txt(q('.tmv')));
  ok('reitir faldir á meðan', !q('input[data-cur="sec"]') && !q('.stypes'));
  skew += 5200; await wait(300);
  ok('niðurtalning hafin', !!q('.tmbox.run') && txt(q('[data-tmt]')) === '1:00', txt(q('.tmv')));
  skew += 58000; await wait(300);
  ok('síðustu sekúndur', !!q('.tmbox.last') && txt(q('[data-tmt]')) === '0:02', txt(q('.tmv')));
  skew += 2500; await wait(400);
  ok('skráð sjálfkrafa við 0', !q('.tmbox') && done() === '1:00 mín, 1:00 mín', done());
  ok('hvíld hefst', !!q('[data-rest]'));

  /* Stöðvað snemma: tíminn sem náðist skráist, reiturinn heldur 1:00 */
  click('[data-act="timedgo"]'); await wait();
  click('[data-act="timedstop"]'); await wait();   /* Byrja strax */
  ok('byrja strax', !!q('.tmbox.run'), txt(q('.tmv')));
  skew += 42300; await wait(300);
  click('[data-act="timedstop"]'); await wait(1200);
  ok('stöðvað eftir 42 sek', done() === '1:00 mín, 1:00 mín, 42 sek' && q('input[data-cur="sec"]').value === '1:00', done() + ' | ' + q('input[data-cur="sec"]').value);

  /* Til þrots = skeiðklukka */
  click('[data-act="settype"][data-v="fail"]'); await wait();
  ok('skeiðklukkuhnappur', /Taka tíma/.test(txt(q('.bigbtn.go'))), txt(q('.bigbtn.go')));
  click('[data-act="timedgo"]'); await wait(); skew += 5100 + 95400; await wait(300);
  ok('skeiðklukka telur upp', !!q('.tmbox.sw') && txt(q('[data-tmt]')) === '1:35', txt(q('.tmv')));
  click('[data-act="timedstop"]'); await wait(100);
  ok('skeiðklukka skráð sem til þrots', /1:35 mín$/.test(done()) && !!q('.done li.t-fail'), done());

  /* Hætt við */
  click('[data-act="timedgo"]'); await wait(); click('[data-act="timedcancel"]'); await wait();
  ok('hætt við skráir ekkert', !q('.tmbox') && d.querySelectorAll('.done .sv').length === 4);

  /* Endurhlaðið í miðri niðurtalningu (appið lokað): heldur áfram út frá tímanum */
  click('[data-act="settype"][data-v="normal"]'); await wait();
  click('[data-act="timedgo"]'); await wait();
  app.stop(); const app2 = startApp(Store); await wait(1300);
  ok('niðurtalning heldur áfram eftir endurræsingu', !!q('.tmbox'), txt(q('.tmv')));
  skew += 70000; await wait(1300);
  ok('og skráist þegar tíminn er liðinn', d.querySelectorAll('.done .sv').length === 5, done());

  /* ---------- Upphífingar ---------- */
  click('[data-act="pickex"]'); await wait(); set('#exq', 'pull up'); await wait(); pick('x_upphífingar'); await wait();
  ok('eldra sett (kg 10) túlkað sem +10 kg', q('[data-act="bwmode"][data-v="plus"]').getAttribute('aria-pressed') === 'true' && q('input[data-cur="kg"]').value === '10',
    q('input[data-cur="kg"]').value);
  ok('síðast sýnt', /Síðast/.test(txt(q('.exhead .last'))), txt(q('.exhead .last')));
  ok('biður um líkamsþyngd', /Settu inn líkamsþyngd/.test(txt(q('[data-bwtot]'))));
  set('#bwin', '80'); await wait();
  ok('heildarþyngd með aukaþyngd', txt(q('[data-bwtot]')) === 'Heildarþyngd (80 + 10) 90 kg', txt(q('[data-bwtot]')));
  set('input[data-cur="reps"]', '6'); click('[data-act="doneset"]'); await wait();
  click('[data-act="bwmode"][data-v="body"]'); await wait();
  ok('eigin þyngd: enginn kg-reitur', !q('input[data-cur="kg"]') && txt(q('[data-bwtot]')) === 'Heildarþyngd 80 kg', txt(q('[data-bwtot]')));
  set('input[data-cur="reps"]', '8'); click('[data-act="doneset"]'); await wait();
  click('[data-act="bwmode"][data-v="assist"]'); await wait();
  set('input[data-cur="kg"]', '20'); await wait();
  ok('létting dregst frá', txt(q('[data-bwtot]')) === 'Heildarþyngd (80 − 20) 60 kg', txt(q('[data-bwtot]')));
  set('input[data-cur="reps"]', '10'); click('[data-act="doneset"]'); await wait();
  ok('sett með heildarþyngd', done() === '+10 kg × 6 [90 kg], 8 reps [80 kg], −20 kg × 10 [60 kg]', done());
  ok('næsta sett heldur léttingunni', q('[data-act="bwmode"][data-v="assist"]').getAttribute('aria-pressed') === 'true' && q('input[data-cur="kg"]').value === '20');
  click('[data-act="editset"][data-si="0"]'); await wait();
  ok('breyta setti: aukaþyngd í reitnum', q('[data-act="bwmode"][data-v="plus"]').getAttribute('aria-pressed') === 'true' && q('input[data-cur="kg"]').value === '10');
  click('[data-act="canceledit"]'); await wait();

  /* Aðstoðarvél: létting er sjálfgefin, eldra sett (kg 30) var létting */
  click('[data-act="pickex"]'); await wait(); set('#exq', 'aðstoð'); await wait(); pick('x_upphífingar-með-aðstoð'); await wait();
  ok('aðstoðarvél: létting 30 úr eldra setti', q('[data-act="bwmode"][data-v="assist"]').getAttribute('aria-pressed') === 'true' && q('input[data-cur="kg"]').value === '30',
    txt(q('[data-bwtot]')));
  set('input[data-cur="kg"]', '25'); set('input[data-cur="reps"]', '8'); click('[data-act="doneset"]'); await wait();
  ok('léttari aðstoð = framför', txt(q('.done li .cmp')) === '+5 kg', txt(q('.done li .cmp')));

  /* Eigin æfing: tegund af heitinu, og hægt að breyta */
  click('[data-act="pickex"]'); await wait(); set('#exq', 'Hollow hold'); await wait();
  click('[data-newex]'); await wait();
  ok('eigin „hold“ æfing mæld í tíma', !!q('input[data-cur="sec"]') && exercises.some(e => e.name === 'Hollow hold' && e.kind === 'time'));
  click('[data-act="exkind"][data-v="reps"]'); await wait();
  ok('breytt í þyngd og reps', !!q('input[data-cur="kg"]') && exercises.find(e => e.name === 'Hollow hold').kind === 'reps');
  click('[data-act="rmex"]'); await wait();

  click('[data-act="savelog"]'); await wait(200);
  const saved = Object.values(db.sessions).find(s => !s.id.startsWith('old'));
  const P = saved.exercises.find(e => e.exId === 'x_planki'), U = saved.exercises.find(e => e.exId === 'x_upphífingar');
  ok('planki vistaður sem sek', JSON.stringify(P.sets) === JSON.stringify([{ sec: 60 }, { sec: 60 }, { sec: 42 }, { sec: 95, type: 'fail' }, { sec: 60 }]), JSON.stringify(P.sets));
  ok('upphífingar vistaðar með heildarþyngd', JSON.stringify(U.sets) === JSON.stringify([{ kg: 90, reps: 6, add: 10, bw: 80 }, { kg: 80, reps: 8, add: 0, bw: 80 }, { kg: 60, reps: 10, add: -20, bw: 80 }]), JSON.stringify(U.sets));
  ok('sett talin (planki telst með)', /3 æfingar, 9 sett/.test(txt(q('#view'))), (txt(q('#view')).match(/\d+ æfingar?, \d+ sett[^.]*/) || [''])[0]);

  /* Framfarir */
  click('[data-tab="progress"]'); await wait(); click('[data-pm="lift"]'); await wait();
  set('#pex', 'x_planki'); await wait();
  ok('framfarir: lengsti tími', /1:35 mín Lengsti tími/.test(d.querySelector('.kv').innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')), txt(q('.kv')));
  set('#pex', 'x_upphífingar'); await wait();
  ok('framfarir: heildarþyngd', /90 kg Mesta heildarþyngd/.test(d.querySelector('.kv').innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')), txt(q('.kv')));
  app2.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); fails++; }
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(0);

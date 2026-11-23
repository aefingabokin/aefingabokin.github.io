/* Teygjur eftir æfingu (3.10): skráning með gufu og pottum, vistun, birting og hlutfall í Framförum */
import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('./index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.Element.prototype.scrollIntoView = () => {}; w.scrollBy = () => {}; w.confirm = () => true; globalThis.confirm = () => true;
w.matchMedia = q => ({ matches: false, addEventListener(){}, removeEventListener(){} });
const errs = []; w.addEventListener('error', e => errs.push(e.message));
const pad = n => String(n).padStart(2, '0'), ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const lift = (id, days, stretch) => ({ id, profileId: 'u1', type: 'lift', date: ago(days), exercises: [{ exId: 'x_bekkpressa', name: 'Bekkpressa', sets: [{ kg: 60, reps: 8 }] }], ...(stretch ? { stretch } : {}) });
const db = { users: { u1: { householdId: 'H1', settings: { news: '9.9' } } }, households: { H1: { owner: 'u1', members: ['u1'], profiles: { u1: { name: 'Aron' } } } },
  sessions: Object.fromEntries([
    lift('l1', 2, { min: 12 }), lift('l2', 6, { min: null }), lift('l3', 9), lift('l4', 20),
    lift('p1', 35), lift('p2', 40),                                       /* fyrri 4 vikur: engar teygjur */
    { id: 'r1', profileId: 'u1', type: 'run', date: ago(3), distance: 5, durationMin: 28, stretch: { min: 8 } },
    { id: 'r2', profileId: 'u1', type: 'run', date: ago(4), distance: 8, durationMin: 45, source: 'garmin', importKey: 'g1' },   /* úr úri: telst ekki með */
    { id: 'y1', profileId: 'u1', type: 'yoga', date: ago(5), durationMin: 30 }                                                     /* jóga: telst ekki með */
  ].map(s => [s.id, s])) };
const Store = {
  configured: true,
  onAuthChange(cb){ setTimeout(() => cb({ uid: 'u1', name: 'Aron', email: 'aron@x.is' }), 0); },
  async signOut(){}, async loadMembership(uid){ return db.users[uid].householdId; },
  async getSettings(uid){ return db.users[uid].settings; }, async saveSettings(){},
  subscribe(hid, cb){ setTimeout(() => cb({ household: db.households.H1, sessions: Object.values(db.sessions), exercises: [] }), 0); return () => {}; },
  async putSession(h, s){ db.sessions[s.id] = JSON.parse(JSON.stringify(s)); }
};
const { startApp } = await import('./gh/js/ui.js');
const d = document, wait = (ms = 40) => new Promise(r => setTimeout(r, ms));
const q = s => d.querySelector(s), flat = el => el ? el.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '(vantar)';
const click = s => { const el = typeof s === 'string' ? q(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const set = (sel, v) => { const el = q(sel); if (!el) throw new Error('missing ' + sel); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
let fails = 0; const ok = (label, cond, extra = '') => { if (!cond) fails++; console.log(cond ? 'ok  ' : 'FAIL', label, extra); };
try {
  const app = startApp(Store); await wait(1300);
  if (q('#sheet').classList.contains('open')) { click('#sheetClose'); await wait(300); }

  /* Framfarir áður: 2 af 4 lyftingaæfingum (l1, l2) */
  click('[data-tab="progress"]'); await wait(); click('[data-pm="lift"]'); await wait();
  ok('hlutfall í lyftingum', /50%/.test(flat(q('.stcard'))) && /Teygðir eftir 2 af 4 æfingum síðustu 4 vikur/.test(flat(q('.stcard'))), flat(q('.stcard')));
  ok('hækkun frá fyrri 4 vikum', /\+50 prósentustig/.test(flat(q('.stcard'))));
  ok('allar æfingar (hlaup úr úri og jóga ekki með)', /Allar æfingar: 60%/.test(flat(q('.stcard'))), flat(q('.stcard .stx')));
  ok('meðaltími teygja', /Að meðaltali 12 mín/.test(flat(q('.stcard .stx'))));
  ok('8 vikustólpar', d.querySelectorAll('.stcard .stb').length === 8);

  /* Ný lyftingaæfing: teygjur fremst í „eftir æfinguna“ */
  click('[data-tab="log"]'); click('[data-newtype="lift"]'); await wait();
  click([...d.querySelectorAll('[data-pickex]')].find(b => b.dataset.pickex === 'x_bekkpressa')); await wait();
  { const sec = q('[data-act="stretchon"]') && q('[data-act="stretchon"]').closest('section');
    ok('flýtihnappur fyrir teygjur, fremst', !!sec && sec.querySelector('.spachip').dataset.act === 'stretchon' && /Teygjur, gufa eða pottur/.test(flat(sec)), flat(sec)); }
  click('[data-act="stretchon"]'); await wait();
  ok('teygjur opnast með síðasta tíma (12)', q('[data-field="stretchRaw"]').value === '12' && /Eftir æfinguna/.test(flat(q('.spaed .slabel'))));
  click('[data-act="stretchstep"][data-d="1"]'); await wait();
  ok('+ lengir um mínútu', q('[data-field="stretchRaw"]').value === '13');
  click('[data-act="spaadd"][data-k="cold"]'); await wait();
  ok('teygjur og kaldi potturinn saman', !!q('.stretchrow') && d.querySelectorAll('.sparows:not(.stretchrow) li').length === 1);
  click('[data-act="doneset"]'); await wait();
  click('[data-act="savelog"]'); await wait(200);
  const saved = Object.values(db.sessions).find(s => !/^(l|p|r|y)\d$/.test(s.id));
  ok('vistað með teygjum', JSON.stringify(saved.stretch) === '{"min":13}' && saved.spa && saved.spa[0].kind === 'cold', JSON.stringify(saved.stretch));
  ok('sýnt á æfingunni', /Teygjur 13 mín/.test(flat(q('#view'))));

  /* Breyta: teygjur haldast, og hægt að taka þær af */
  click('[data-tab="history"]'); await wait();
  click(q(`[data-edit="${saved.id}"]`) || q(`[data-open="${saved.id}"]`) || [...d.querySelectorAll('[data-edit]')].find(b => b.dataset.edit === saved.id)); await wait();
  ok('breytingarhamur sýnir teygjurnar', q('[data-field="stretchRaw"]') && q('[data-field="stretchRaw"]').value === '13');
  set('[data-field="stretchRaw"]', ''); await wait();
  click('[data-act="savelog"]'); await wait(200);
  ok('tími má vera tómur', JSON.stringify(db.sessions[saved.id].stretch) === '{"min":null}', JSON.stringify(db.sessions[saved.id].stretch));
  click([...d.querySelectorAll('[data-edit]')].find(b => b.dataset.edit === saved.id)); await wait();
  click('[data-act="stretchoff"]'); await wait();
  click('[data-act="savelog"]'); await wait(200);
  ok('teygjur fjarlægðar', db.sessions[saved.id].stretch === null);

  /* Jóga býður ekki upp á teygjur á eftir */
  click('[data-tab="log"]'); await wait();
  const yb = q('[data-newtype="yoga"]');
  if (yb){ click(yb); await wait(); ok('engar teygjur eftir jóga', !q('[data-act="stretchon"]')); click('[data-act="cancel"]'); await wait(); }

  /* Hlaup: hlutfall í Íþróttum */
  click('[data-tab="progress"]'); await wait(); click('[data-pm="cardio"]'); await wait();
  const rb = q('[data-pt="run"]'); if (rb){ click(rb); await wait(); }
  ok('hlaup: 1 af 1 (hlaup úr úri ekki með)', /Teygðir eftir 1 af 1 æfingu/.test(flat(q('.stcard'))), flat(q('.stcard')));
  app.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); fails++; }
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(0);

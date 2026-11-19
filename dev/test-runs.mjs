import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('./index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.confirm = () => true; globalThis.confirm = () => true;
const errs = []; w.addEventListener('error', e => errs.push(e.message));
const day = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
// 5 eldri hlaup: 5:00, 5:10, 5:20, 6:00, 6:10 mín/km  + eitt gamalt án effortAuto
const runs = [[5.0,25],[5.0,25.83],[8,42.67],[6,36],[10,61.67]].map(([km,min],i) => ({ id:'r'+i, profileId:'u1', type:'run', date: day(20-i*3), distance: km, durationMin: min, effortAuto: null }));
delete runs[4].effortAuto;   // eldra hlaup, á að fá merkingu sjálfkrafa
const db = { sessions: Object.fromEntries(runs.map(r => [r.id, r])) };
let puts = [];
const Store = {
  configured: true,
  onAuthChange(cb){ setTimeout(() => cb({ uid: 'u1', name: 'Aron' }), 0); },
  async loadMembership(){ return 'H1'; },
  subscribe(hid, cb){ const emit = () => cb({ household: { owner:'u1', members:['u1'], profiles:{ u1:{ name:'Aron' } } }, sessions: Object.values(db.sessions).map(x => ({...x})), exercises: [] }); setTimeout(emit, 0); Store._emit = emit; return () => {}; },
  async putSession(h, s){ db.sessions[s.id] = JSON.parse(JSON.stringify(s)); puts.push(s.id); setTimeout(Store._emit, 0); },
  async getSettings(){ return null; }, async saveSettings(){},
  subscribeShared(uid, since, cb){ setTimeout(() => cb([]), 0); return () => {}; }, async putShared(){}, async deleteShared(){},
  subscribeSocial(uid, cb){ setTimeout(() => cb({ incoming: [], outgoing: [], friendships: [] }), 0); return () => {}; },
  subscribeChallenges(uid, cb){ setTimeout(() => cb([]), 0); return () => {}; },
  async ensurePerson(){ return { name: 'Aron', code: 'ARON12' }; }, async getPerson(){ return null; }
};
const { startApp } = await import('./gh/js/ui.js');
const d = document, wait = (ms = 40) => new Promise(r => setTimeout(r, ms));
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
try {
  const app = startApp(Store); await wait(1500);
  console.log('backfill:', puts, 'r4 effortAuto =', db.sessions.r4.effortAuto);
  // nýtt hlaup: 6,0 km á 36:30 (6:05/km) → rólegt;  5 km á 25:00 → hratt
  click('[data-tab="log"]'); click('[data-newtype="run"]'); type(d.querySelector('#dist'), '6'); type(d.querySelector('#dur'), '36:30');
  console.log('chips:', [...d.querySelectorAll('#effchips .chip')].map(c => c.textContent + (c.getAttribute('aria-pressed') === 'true' ? '*' : '')).join(' | '));
  type(d.querySelector('#dur'), '25:00'); console.log('5:00/km auto:', d.querySelector('#effchips .chip').textContent);
  type(d.querySelector('#dur'), '33:00'); console.log('5:30/km auto:', d.querySelector('#effchips .chip').textContent);
  type(d.querySelector('#dur'), '36:30'); click('[data-act="savelog"]'); await wait(80);
  const saved = Object.values(db.sessions).find(s => !s.id.startsWith('r'));
  console.log('saved effortAuto:', saved.effortAuto, 'effort:', saved.effort, 'avgHr:', saved.avgHr);
  console.log('home pills:', [...d.querySelectorAll('.list .t')].map(t => t.textContent).join(' / '));
  // handvirkt val + púls
  click('[data-tab="log"]'); click('[data-newtype="run"]'); type(d.querySelector('#dist'), '5'); type(d.querySelector('#dur'), '25:00'); type(d.querySelector('#hr'), '140');
  click('[data-act="seteffort"][data-e="easy"]'); click('[data-act="savelog"]'); await wait(80);
  const s2 = Object.values(db.sessions).filter(s => !s.id.startsWith('r')).find(s => s.avgHr === 140);
  console.log('manual:', s2.effort, 'auto:', s2.effortAuto, '| shown:', d.querySelector('.list .t').textContent);
  // púlsmat með hámarkspúls 190: 140/190 = 74% → rólegt
  click('#settingsBtn'); const hm = d.querySelector('[data-setnum="maxHr"]'); hm.value = '190'; hm.dispatchEvent(new w.Event('change', { bubbles: true })); click('[data-act="setback"]');
  click('[data-tab="log"]'); click('[data-newtype="run"]'); type(d.querySelector('#dist'), '5'); type(d.querySelector('#dur'), '25:00'); type(d.querySelector('#hr'), '140');
  console.log('HR 140/190 auto:', d.querySelector('#effchips .chip').textContent); type(d.querySelector('#hr'), '172'); console.log('HR 172/190 auto:', d.querySelector('#effchips .chip').textContent);
  click('[data-act="cancel"]');
  // framfarir
  click('[data-tab="progress"]'); click('[data-pm="cardio"]'); console.log('progress:', [...d.querySelectorAll('.kv .glass')].pop().textContent.trim());
  // leit í æfingasafni
  click('[data-tab="log"]'); click('[data-newtype="lift"]');
  for (const q of ['rdl', 'rettstodu', 'lat pulldown', 'hip thrust', 'skull']) { type(d.querySelector('#exq'), q); console.log(`search "${q}":`, [...d.querySelectorAll('[data-pickex]')].map(b => b.firstChild.textContent).join(', ')); }
  type(d.querySelector('#exq'), ''); console.log('groups:', [...d.querySelectorAll('.grp')].map(g => g.textContent).join(', '), '| total:', d.querySelectorAll('[data-pickex]').length);
  app.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); }
process.exit(0);

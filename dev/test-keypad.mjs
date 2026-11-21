/* Talnaborð appsins (3.7): plötureikningur, kynning á nýjungum og skráning setts með talnaborðinu */
import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('./index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.scrollBy = () => {}; w.confirm = () => true; globalThis.confirm = () => true;
/* Snertiskjár (sími): talnaborðið er virkt */
w.matchMedia = q => ({ matches: q === '(pointer: coarse)', addEventListener(){}, removeEventListener(){} });
const errs = []; w.addEventListener('error', e => errs.push(e.message));

const { platesFor, plateText } = await import('./gh/js/keypad.js');
const ALL = [25, 20, 15, 10, 5, 2.5, 2, 1.5, 1.25, 1, 0.5];
const pf = (t, b, a = ALL) => { const r = platesFor(t, b, a); return r.state === 'ok' ? plateText(r.per) || 'stöngin' : r.state === 'near' ? `nær ${r.lo}/${r.hi}` : r.state; };
console.log('plötur:', [pf(82.5, 20), pf(140, 20), pf(20, 20), pf(15, 20), pf(82.5, 20, [25, 20, 15, 10, 5, 2.5]), pf(60, 20, [20, 15]), pf(61, 15), pf(0, 20)].join(' | '));

const db = { users: { u1: { householdId: 'H1', settings: {} } }, households: { H1: { owner: 'u1', members: ['u1'], profiles: { u1: { name: 'Aron' } } } },
  sessions: { s1: { id: 's1', profileId: 'u1', type: 'lift', date: '2026-11-18', exercises: [{ exId: 'x_bekkpressa', name: 'Bekkpressa', sets: [{ kg: 80, reps: 8 }] }] } } };
let saved = null;
const Store = {
  configured: true,
  onAuthChange(cb){ setTimeout(() => cb({ uid: 'u1', name: 'Aron', email: 'aron@x.is' }), 0); },
  async signOut(){}, async loadMembership(uid){ return db.users[uid].householdId; },
  async getSettings(uid){ return db.users[uid].settings; },
  async saveSettings(uid, s){ saved = JSON.parse(JSON.stringify(s)); },
  subscribe(hid, cb){ setTimeout(() => cb({ household: db.households.H1, sessions: Object.values(db.sessions), exercises: [] }), 0); return () => {}; },
  async putSession(h, s){ db.sessions[s.id] = s; }
};
const { startApp } = await import('./gh/js/ui.js');
const d = document, wait = (ms = 40) => new Promise(r => setTimeout(r, ms));
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
/* Takki á talnaborðinu (smellur án pointerdown, eins og frá lyklaborði eða skjálesara) */
const key = k => { const b = d.querySelector(`.kp [data-key="${k}"]`); if (!b) throw new Error('no key ' + k); b.dispatchEvent(new w.MouseEvent('click', { bubbles: true, detail: 0 })); };
try {
  const app = startApp(Store); await wait(1300);
  console.log('kynning:', d.querySelector('#sheet').classList.contains('open') ? d.querySelector('#sheetTitle').textContent : 'engin', '| útgáfa:', (d.querySelector('.nwver') || {}).textContent);
  click('[data-act="newsok"]'); await wait(700);
  console.log('lokað:', !d.querySelector('#sheet').classList.contains('open'), '| vistað sem séð:', saved && saved.news);

  click('[data-tab="log"]'); click('[data-newtype="lift"]'); await wait();
  click([...d.querySelectorAll('[data-pickex]')].find(b => b.dataset.pickex === 'x_bekkpressa')); await wait();
  const kg = d.querySelector('[data-cur="kg"]');
  console.log('lyklaborð símans af:', kg.getAttribute('inputmode') === 'none');
  kg.focus(); await wait();
  const kp = d.querySelector('.kp');
  console.log('talnaborð:', !kp.hidden, kp.dataset.l, '|', d.querySelector('.kphead').textContent.replace(/\s+/g, ' ').trim());
  key('9'); key('0'); await wait();
  console.log('þyngd:', kg.value, '|', d.querySelector('.kpinfo .kptxt').textContent.replace(/\s+/g, ' ').trim());
  key('up'); await wait(); console.log('+2,5:', d.querySelector('[data-cur="kg"]').value);
  key('next'); await wait();
  const reps = d.querySelector('[data-cur="reps"]');
  console.log('næsti reitur:', d.activeElement === reps, '| takki:', d.querySelector('.kp .kpk.go').textContent.trim(), '| sama:', d.querySelector('.kp [data-key="same"]').textContent.trim());
  key('8'); await wait();
  key('next'); await wait(100);
  console.log('skráð:', [...d.querySelectorAll('.done .sv')].map(x => x.firstChild.textContent.trim()).join(', '), '| talnaborð lokað:', d.querySelector('.kp').hidden);
  app.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); }
process.exit(0);

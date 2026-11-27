/* Deilimynd (3.11): þrjú útlit sem notandinn velur á milli, valið munað */
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
  click('[data-tab="progress"]'); await wait(); click('[data-pm="badges"]'); await wait();
  click('[data-act="yearopen"]'); await wait(200);
  const picks = [...d.querySelectorAll('[data-act="sharestyle"]')];
  ok('þrjú útlit í boði', picks.length === 3 && picks.map(b => b.dataset.k).join() === 'days,best,poster', picks.map(b => b.dataset.k).join());
  ok('Dagarnir valið sjálfgefið', q('[data-act="sharestyle"][data-k="days"]').getAttribute('aria-checked') === 'true');
  ok('deilihnappur á eftir valinu', !!q('.shpick + [data-act="sharecard"]'));
  click('[data-act="sharestyle"][data-k="poster"]'); await wait();
  ok('Plakat valið', q('[data-k="poster"]').getAttribute('aria-checked') === 'true' && q('[data-k="days"]').getAttribute('aria-checked') === 'false');
  ok('valið munað', localStorage.getItem('aefingabokin.sharestyle') === 'poster');
  click('#sheetClose'); await wait(300); click('[data-act="yearopen"]'); await wait(200);
  ok('valið helst þegar opnað aftur', q('[data-k="poster"]').getAttribute('aria-checked') === 'true');
  click('[data-act="sharecard"]'); await wait(200);
  ok('deiling án canvas hrynur ekki', errs.length === 0, JSON.stringify(errs));
  app.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); fails++; }
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(0);

/* Lagfæringar úr yfirferð 3.8: æfing í gangi hverfur ekki þegjandi, reitir úr úri haldast við breytingu, eldri plan-æfingar
   sýna ekki „undefined“, Framfarir þola æfingu með upphitun eingöngu, skref á þyngd lenda á heilum þrepum og gölluð drög
   fella ekki appið (öryggisnet með leið út). */
import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('./index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.scrollBy = () => {};
let answer = true, asked = [];
w.confirm = msg => { asked.push(msg); return answer; }; globalThis.confirm = w.confirm;
w.matchMedia = q => ({ matches: false, addEventListener(){}, removeEventListener(){} });
const errs = []; w.addEventListener('error', e => errs.push(e.message));

const iso = n => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const db = { users: { u1: { householdId: 'H1', settings: { news: '3.7' } } }, households: { H1: { owner: 'u1', members: ['u1'], profiles: { u1: { name: 'Aron' } } } },
  sessions: {
    g1: { id: 'g1', profileId: 'u1', type: 'run', date: iso(1), distance: 8.2, durationMin: 47, avgHr: 151, notes: 'Úr úri', source: 'garmin', importKey: 'garmin:123', createdAt: '2026-11-01T10:00:00Z' },
    p1: { id: 'p1', profileId: 'u1', type: 'lift', date: iso(2), avgHr: 122, createdAt: '2026-11-02T10:00:00Z',
      exercises: [{ exId: 'x_bekkpressa', name: 'Bekkpressa', sets: [{ kg: 80, reps: 8 }], t: { sets: 3, lo: 8, hi: 10, role: 'main', slot: null } },
                  { exId: 'x_hnebeygja', name: 'Hnébeygja', sets: [{ kg: 40, reps: 10, type: 'warm' }] }] } } };
const puts = [];
const Store = {
  configured: true,
  onAuthChange(cb){ setTimeout(() => cb({ uid: 'u1', name: 'Aron', email: 'aron@x.is' }), 0); },
  async signOut(){}, async loadMembership(uid){ return db.users[uid].householdId; },
  async getSettings(uid){ return db.users[uid].settings; }, async saveSettings(){},
  subscribe(hid, cb){ setTimeout(() => cb({ household: db.households.H1, sessions: Object.values(db.sessions), exercises: [] }), 0); return () => {}; },
  async putSession(h, s){ puts.push(JSON.parse(JSON.stringify(s))); db.sessions[s.id] = s; }
};
/* Gölluð drög frá eldri útgáfu liggja í símanum þegar appið opnast */
localStorage.setItem('aefingabokin.draft.u1', JSON.stringify({ id: 'bad1', profileId: 'u1', type: 'lift', date: iso(0), cur: 0, exercises: [{ exId: 'x_bekkpressa', sets: 'gallað' }] }));
const { startApp } = await import('./gh/js/ui.js');
const d = document, view = d.querySelector('#view'), wait = (ms = 40) => new Promise(r => setTimeout(r, ms));
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const set = (sel, v) => { const el = d.querySelector(sel); if (!el) throw new Error('missing ' + sel); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
try {
  const app = startApp(Store); await wait(400);
  console.log('gölluð drög: öryggisnet í stað hruns:', (view.querySelector('.gate h1') || {}).textContent, '| leið út:', !!view.querySelector('[data-act="dropdraft"]'), '| villan skilar sér:', errs.length > 0);
  click('[data-act="dropdraft"]'); await wait(); errs.length = 0;
  console.log('drögum hent:', d.body.dataset.tab, '| drög eftir:', localStorage.getItem('aefingabokin.draft.u1'));

  /* Æfing úr úri: athugasemd breytt, uppruninn helst */
  click('[data-edit="g1"]'); await wait();
  set('[data-field="notes"]', 'Leiðrétt'); click('[data-act="savelog"]'); await wait();
  const g = puts.pop();
  console.log('æfing úr úri eftir breytingu:', g.notes, '|', g.source, g.importKey, '| púls:', g.avgHr);

  /* Eldri plan-æfing (markmið án reps/hvíldar) opnuð aftur */
  click('[data-edit="p1"]'); await wait();
  console.log('plan-æfing opnuð: undefined á skjá:', /undefined/.test(view.textContent));
  set('[data-cur="kg"]', '82,5'); set('[data-cur="reps"]', '8'); click('[data-act="doneset"]'); await wait();
  console.log('eftir sett:', d.querySelector('[data-cur="kg"]').value, '×', d.querySelector('[data-cur="reps"]').value, '| undefined á skjá:', /undefined/.test(view.textContent));
  const step = dir => click([...d.querySelectorAll('[data-act="step"]')].find(b => b.dataset.k === 'kg' && +b.dataset.d === dir));
  set('[data-cur="kg"]', '20'); const seq = ['20']; step(-1); seq.push(d.querySelector('[data-cur="kg"]').value); for (let i = 0; i < 4; i++){ step(1); seq.push(d.querySelector('[data-cur="kg"]').value); }
  console.log('skref á þyngd:', seq.join(' → '));
  set('[data-cur="kg"]', '82,5'); click('[data-act="savelog"]'); await wait();
  const p = puts.pop();
  console.log('lyftingar vistaðar: púls helst:', p.avgHr, '| sett:', p.exercises[0].sets.length, '| markmið:', JSON.stringify(p.exercises[0].t));

  /* Framfarir → Lyftingar: æfing með upphitun eingöngu er ekki í listanum og fellir ekki skjáinn */
  click('.tabs [data-tab="progress"]'); click('[data-pm="lift"]'); await wait();
  console.log('Framfarir, lyftingar:', [...d.querySelectorAll('#pex option')].map(o => o.textContent).join(', '), '| hrun:', !!view.querySelector('[data-act="reload"]'));

  /* Ný æfing í gangi með setti: að opna aðra æfingu spyr fyrst */
  click('.tabs [data-tab="log"]'); click('[data-newtype="lift"]'); await wait();
  click([...d.querySelectorAll('[data-pickex]')].find(b => b.dataset.pickex === 'x_bekkpressa')); await wait();
  set('[data-cur="kg"]', '60'); set('[data-cur="reps"]', '10'); click('[data-act="doneset"]'); await wait();
  const id0 = JSON.parse(localStorage.getItem('aefingabokin.draft.u1')).id;
  click('.tabs [data-tab="history"]'); await wait();
  answer = false; asked = []; click('[data-edit="g1"]'); await wait();
  console.log('önnur æfing opnuð, svarað nei:', asked.length === 1 ? 'spurt' : 'EKKI spurt', '| æfingin í gangi helst:', (JSON.parse(localStorage.getItem('aefingabokin.draft.u1')) || {}).id === id0);
  answer = true; asked = []; click('[data-edit="g1"]'); await wait();
  console.log('svarað já:', asked.length === 1 ? 'spurt' : 'EKKI spurt', '| opin æfing:', (JSON.parse(localStorage.getItem('aefingabokin.draft.u1')) || {}).id);
  click('[data-act="cancel"]'); await wait();
  app.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); }
process.exit(0);

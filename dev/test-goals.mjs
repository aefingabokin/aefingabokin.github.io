import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('./index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.confirm = () => true; globalThis.confirm = () => true;
const errs = []; w.addEventListener('error', e => errs.push(e.message));
const dayAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); const p = x => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };
// Aron: 3 æfingar á viku síðustu 3 vikur + bekkpressa 95 kg; 10 km á 52:00
const sess = {};
let k = 0; const add = s => { const id = 's' + (++k); sess[id] = { id, profileId: 'u1', ...s }; };
for (let wk = 1; wk <= 3; wk++) for (let i = 0; i < 3; i++) add({ type: 'lift', date: dayAgo(wk * 7 + i), exercises: [{ exId: 'x_bekkpressa', name: 'Bekkpressa', sets: [{ kg: 90 + wk, reps: 3 }] }] });
add({ type: 'lift', date: dayAgo(1), exercises: [{ exId: 'x_bekkpressa', name: 'Bekkpressa', sets: [{ kg: 95, reps: 1 }] }] });
add({ type: 'run', date: dayAgo(2), distance: 10.1, durationMin: 52.5 });
const db = { goals: { u1: {}, u3: { g1: { id: 'g1', type: 'runtime', distance: 5, timeMin: 25, shared: true, status: 'achieved', achievedAt: dayAgo(1), progress: { pct: 1, valueText: '24:40', sub: 'Náð' }, kudos: {} },
  _focus: { id: '_focus', type: 'focus', text: 'Undirbý maraþon', tags: ['Hlaup', 'Þol'], shared: true },
  g2: { id: 'g2', type: 'weekly', activity: 'all', metric: 'sessions', target: 4, shared: true, status: 'active', progress: { pct: 0.5, valueText: '2 af 4 æfingar', sub: 'Vantar 2 æfingar í vikunni', streak: 3, weeks: [1,1,0,1,1,1,1,0].map(Boolean) } } } } };
const L = []; const on = (key, fn) => { L.push({ key, fn }); setTimeout(fn, 0); return () => {}; }; const fire = key => setTimeout(() => L.filter(l => l.key === key).forEach(l => l.fn()), 0);
const Store = {
  configured: true,
  onAuthChange(cb){ setTimeout(() => cb({ uid: 'u1', name: 'Aron' }), 0); },
  async loadMembership(){ return 'H1'; },
  subscribe(hid, cb){ return on('hh', () => cb({ household: { owner: 'u1', members: ['u1'], profiles: { u1: { name: 'Aron' } } }, sessions: Object.values(sess).map(x => ({ ...x })), exercises: [] })); },
  async putSession(h, s){ sess[s.id] = JSON.parse(JSON.stringify(s)); fire('hh'); },
  async getSettings(){ return null; }, async saveSettings(){},
  subscribeSocial(uid, cb){ return on('social', () => cb({ incoming: [], outgoing: [], friendships: [{ id: 'u1_u3', members: ['u1', 'u3'] }] })); },
  subscribeChallenges(uid, cb){ return on('ch', () => cb([])); },
  subscribeShared(uid, since, cb){ return on('sh', () => cb([])); }, async putShared(){}, async deleteShared(){},
  async ensurePerson(){ return { name: 'Aron', code: 'ARON12' }; }, async getPerson(uid){ return uid === 'u3' ? { name: 'Jón' } : null; },
  subscribeGoals(uid, own, cb){ return on('goals', () => cb(Object.values(db.goals[uid] || {}).filter(g => own || g.shared).map(g => JSON.parse(JSON.stringify(g))))); },
  async putGoal(uid, g, merge){ db.goals[uid][g.id] = merge ? { ...(db.goals[uid][g.id] || {}), ...JSON.parse(JSON.stringify(g)) } : JSON.parse(JSON.stringify(g)); fire('goals'); },
  async deleteGoal(uid, id){ delete db.goals[uid][id]; fire('goals'); },
  async setGoalKudos(o, gid, from, name){ const g = db.goals[o][gid]; g.kudos = { ...(g.kudos || {}) }; if (name) g.kudos[from] = name; else delete g.kudos[from]; fire('goals'); }
};
const { startApp } = await import('./gh/js/ui.js');
const d = document, wait = (ms = 60) => new Promise(r => setTimeout(r, ms));
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
const T = s => s.replace(/\s+/g, ' ').trim();
try {
  const app = startApp(Store); await wait(300);
  console.log('home goals card:', T(d.querySelector('.gprompt') ? d.querySelector('.gprompt').textContent : 'none'));
  click('[data-act="goalsopen"]'); console.log('segments:', [...d.querySelectorAll('.seg4 button')].map(b => b.textContent).join(','));
  // preset: 3 æfingar á viku
  click('[data-act="goalnew"]'); click('[data-act="goalpreset"][data-i="1"]'); console.log('form:', d.querySelector('#sheetTitle').textContent, '| title placeholder:', d.querySelector('#gf_title').placeholder);
  click('[data-act="goalsave"]'); await wait(1500);
  console.log('weekly card:', T(d.querySelector('.gcard').textContent), '| dots on:', d.querySelectorAll('.gcard .wdots i.on').length);
  // strength 100 kg
  click('[data-act="goalnew"]'); click([...d.querySelectorAll('[data-act="goalpreset"]')].find(b => b.textContent.includes('Bekkpressa'))); click('[data-act="goalsave"]'); await wait(1500);
  // runtime custom: 10 km undir 52 → already achieved
  click('[data-act="goalnew"]'); click('[data-act="goaltype"][data-t="runtime"]'); d.querySelector('#gf_time').value = '53:00'; click('[data-act="goalsave"]'); await wait(1500);
  console.log('toast:', d.querySelector('#toast').textContent);
  // total via gfset: run distance 300 km to year end, private
  click('[data-act="goalnew"]'); click('[data-act="goaltype"][data-t="total"]'); click('[data-act="gfset"][data-k="activity"][data-v="run"]');
  console.log('total unit:', d.querySelector('#gf_target').nextElementSibling.textContent, 'target:', d.querySelector('#gf_target').value);
  d.querySelector('#gf_shared').checked = false; click('[data-act="goalsave"]'); await wait(1500);
  console.log('goal cards:', [...d.querySelectorAll('.gcard .gt')].map(x => x.textContent).join(' | '));
  console.log('achieved section:', !!d.querySelector('h2') && [...d.querySelectorAll('h2')].map(h => T(h.textContent)).join(','));
  console.log('stored:', Object.values(db.goals.u1).map(g => `${g.type}:${g.status}:shared=${g.shared}:pct=${g.progress && g.progress.pct}`).join(' ; '));
  // focus
  click('[data-act="focusedit"]'); d.querySelector('#fo_text').value = 'Sterkari bekkpressa fyrir jól'; click('[data-act="focustag"][data-t="Styrkur"]'); click('[data-act="focussave"]'); await wait();
  console.log('focus:', T(d.querySelector('.focus').textContent));
  // celebrate: log a 100 kg bench → strength achieved
  click('[data-tab="log"]'); click('[data-newtype="lift"]'); type(d.querySelector('#exq'), 'Bekkpressa'); click('[data-pickex]');
  type(d.querySelector('[data-cur="kg"]'), '100'); type(d.querySelector('[data-cur="reps"]'), '1'); click('[data-act="doneset"]'); click('[data-act="savelog"]'); await wait(1600);
  console.log('celebrate:', d.querySelector('.celebrate') ? T(d.querySelector('.cbox').textContent) : 'none');
  click('[data-act="closecel"]');
  console.log('home goals:', T(d.querySelector('.ghome') ? d.querySelector('.ghome').textContent : 'none'));
  // friend profile + feed achievement + kudos
  click('[data-tab="friends"]'); await wait();
  console.log('feed:', [...d.querySelectorAll('.flist .t')].map(x => x.textContent).join(' / '));
  click('[data-gkudos="u3|g1"]'); await wait(); console.log('goal kudos:', JSON.stringify(db.goals.u3.g1.kudos));
  click('[data-profile="u3"]'); console.log('profile:', T(d.querySelector('#sheetBody').textContent).slice(0, 200));
  click('#sheetClose');
  // goal detail + archive + delete
  click('[data-tab="progress"]'); click('[data-pm="goals"]'); const first = d.querySelector('.gcard'); click(first); console.log('detail:', T(d.querySelector('.gdetail').textContent).slice(0, 120));
  click('[data-act="goalarch"]'); await wait(); console.log('archived details:', !!d.querySelector('details.arch'));
  app.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); }
process.exit(0);

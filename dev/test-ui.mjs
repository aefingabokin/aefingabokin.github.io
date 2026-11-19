import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('./index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/?join=H1', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.confirm = () => true; globalThis.confirm = () => true;
const errs = []; w.addEventListener('error', e => errs.push(e.message));
// In-memory store with one shared "server"
const db = { users: {}, households: { H1: { owner: 'u2', members: ['u2'], profiles: { u2: { name: 'Sigga' } } } }, sessions: { H1: {} }, exercises: { H1: {} } };
let authCb, subs = [];
const emit = hid => subs.forEach(s => s.hid === hid && s.cb({ household: db.households[hid], sessions: Object.values(db.sessions[hid]), exercises: Object.values(db.exercises[hid]) }));
const Store = {
  configured: true,
  onAuthChange(cb){ authCb = cb; setTimeout(() => cb(null), 0); },
  async signIn(){ authCb({ uid: 'u1', name: 'Aron Test', email: 'a@x.is' }); },
  async signOut(){ authCb(null); },
  async loadMembership(uid){ return db.users[uid] || null; },
  async createHousehold(u, name){ db.households.H2 = { owner: u.uid, members: [u.uid], profiles: { [u.uid]: { name } } }; db.sessions.H2 = {}; db.exercises.H2 = {}; db.users[u.uid] = 'H2'; return 'H2'; },
  async joinHousehold(u, hid, name){ const h = db.households[hid]; if (!h.members.includes(u.uid)) h.members.push(u.uid); h.profiles[u.uid] = { name }; db.users[u.uid] = hid; return hid; },
  subscribe(hid, cb){ const s = { hid, cb }; subs.push(s); setTimeout(() => emit(hid), 0); return () => { subs = subs.filter(x => x !== s); }; },
  async putSession(hid, s){ db.sessions[hid][s.id] = JSON.parse(JSON.stringify(s)); setTimeout(() => emit(hid), 0); },
  async deleteSession(hid, id){ delete db.sessions[hid][id]; setTimeout(() => emit(hid), 0); },
  async putExercise(hid, ex){ db.exercises[hid][ex.id] = ex; setTimeout(() => emit(hid), 0); },
  async setProfileName(hid, uid, name){ db.households[hid].profiles[uid].name = name; setTimeout(() => emit(hid), 0); },
  async importAll(hid, ss, ex){ ss.forEach(s => db.sessions[hid][s.id] = s); ex.forEach(e => db.exercises[hid][e.id] = e); setTimeout(() => emit(hid), 0); }
};
const { startApp } = await import('./gh/js/ui.js');
const d = document, wait = (ms = 20) => new Promise(r => setTimeout(r, ms));
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
try {
  const app = startApp(Store); await wait();
  console.log('gate1:', d.body.dataset.gate, '|', d.querySelector('.welcome .authinfo').textContent.slice(0, 60));
  click('[data-act="signin"]'); await wait();
  console.log('gate2:', d.body.dataset.gate, d.querySelector('.gate h1').textContent);
  click('[data-act="join"]'); await wait(50);
  console.log('sports gate after join:', d.body.dataset.gate); click('[data-act="sportsnext"]'); await wait(30); click('[data-act="aboutskip"]'); await wait(50);
  console.log('gate3:', d.body.dataset.gate, 'url:', location.search, 'who:', d.querySelector('#who').textContent, 'rows:', d.querySelectorAll('.wname').length);
  // log a lift
  click('[data-tab="log"]'); click('[data-newtype="lift"]'); type(d.querySelector('#exq'), 'bekk'); click('[data-pickex]');
  type(d.querySelector('[data-cur="kg"]'), '60'); type(d.querySelector('[data-cur="reps"]'), '10'); click('[data-act="doneset"]'); click('[data-act="doneset"]');
  click('[data-act="savelog"]'); await wait();
  console.log('server sessions:', Object.values(db.sessions.H1).map(s => s.profileId + ':' + s.type + ':' + s.exercises[0].sets.length).join(','));
  // remote change arrives while typing — should not steal focus
  click('[data-tab="log"]'); click('[data-newtype="run"]'); const dist = d.querySelector('#dist'); dist.focus(); type(dist, '5,2');
  db.sessions.H1.remote = { id: 'remote', profileId: 'u2', type: 'swim', date: new Date().toISOString().slice(0,10), distance: 1000 }; emit('H1'); await wait();
  console.log('focus kept:', d.activeElement === d.querySelector('#dist'), 'value:', d.querySelector('#dist').value);
  type(d.querySelector('#dur'), '28:30'); click('[data-act="savelog"]'); await wait();
  console.log('home pills:', d.querySelectorAll('.pill span').length, 'stats:', [...d.querySelectorAll('.stat .v')].map(x => x.textContent.trim()).join(' | '));
  // switch to Sigga and back
  click('[data-pid="u2"]'); console.log('active u2 stats:', d.querySelector('.stat .v').textContent);
  click('[data-pid="u1"]');
  // second lift shows last per set
  click('[data-tab="log"]'); click('[data-newtype="lift"]'); click('[data-pickex]');
  console.log('lastpill:', d.querySelector('.lastpill').textContent);
  click('[data-act="cancel"]');
  // import backup mapping
  click('#settingsBtn');
  const backup = { profiles: [{ id: 'p1', name: 'Aron' }, { id: 'p2', name: 'Sigga' }], customExercises: [{ id: 'c_x', name: 'Ketilbjalla', g: 'Mínar æfingar', custom: true }],
    sessions: [{ id: 'old1', profileId: 'p1', type: 'run', date: '2026-11-01', distance: 4 }, { id: 'old2', profileId: 'p2', type: 'walk', date: '2026-11-02', distance: 3, title: undefined }] };
  const inp = d.querySelector('#importFile');
  Object.defineProperty(inp, 'files', { value: [new w.Blob([JSON.stringify(backup)], { type: 'application/json' })] });
  inp.dispatchEvent(new w.Event('change', { bubbles: true })); await wait(50);
  console.log('map selects:', [...d.querySelectorAll('[data-map]')].map(s => s.dataset.map + '->' + s.value).join(', '));
  click('[data-act="doimport"]'); await wait(50);
  console.log('after import server sessions:', Object.keys(db.sessions.H1).length, 'old1 owner:', db.sessions.H1.old1.profileId, 'old2 owner:', db.sessions.H1.old2.profileId, 'custom ex:', Object.keys(db.exercises.H1));
  click('[data-tab="history"]'); click('[data-act="hboth"]'); console.log('history both:', d.querySelectorAll('.item').length);
  click('[data-tab="progress"]'); console.log('progress chart:', !!d.querySelector('.chart svg'));
  click('#settingsBtn'); click('[data-act="signout"]'); await wait();
  console.log('after signout gate:', d.body.dataset.gate);
  // new user creating household
  authCb({ uid: 'u3', name: 'Jón', email: '' }); await wait();
  click('[data-act="create"]'); await wait(50); click('[data-act="sportsnext"]'); await wait(30); click('[data-act="aboutskip"]'); await wait(50);
  console.log('u3 gate:', d.body.dataset.gate, 'invite card:', !!d.querySelector('[data-act="invite"]'), 'who hidden:', d.querySelector('#who').hidden);
  app.stop();
  console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); }
process.exit(0);

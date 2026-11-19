import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('./index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/?vinur=JONJON', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.confirm = () => true; globalThis.confirm = () => true;
const errs = []; w.addEventListener('error', e => errs.push(e.message));
const T = new Date().toISOString().slice(0,10);
// ---- in-memory "server" ----
const db = { users: { u1: 'H1', u2: 'H1' }, households: { H1: { owner: 'u1', members: ['u1','u2'], profiles: { u1: { name: 'Aron', visibility: 'summary' }, u2: { name: 'Sigga' } } } },
  sessions: { H1: {} }, exercises: { H1: {} }, people: { u3: { name: 'Jón', code: 'JONJON' } }, codes: { JONJON: 'u3' },
  requests: {}, friendships: {}, shared: { u3: { j1: { id: 'j1', ownerId: 'u3', date: T, type: 'run', distance: 10, durationMin: 50, kudos: {}, detail: null } } }, challenges: {} };
const L = []; const on = (key, fn) => { const l = { key, fn }; L.push(l); setTimeout(fn, 0); return () => { const i = L.indexOf(l); if (i >= 0) L.splice(i, 1); }; };
const fire = key => setTimeout(() => L.filter(l => l.key === key || key === '*').forEach(l => l.fn()), 0);
let authCb, cid = 0;
const Store = {
  configured: true,
  onAuthChange(cb){ authCb = cb; setTimeout(() => cb({ uid: 'u1', name: 'Aron', email: '' }), 0); },
  async signIn(){}, async signOut(){ authCb(null); },
  async loadMembership(uid){ return db.users[uid] || null; },
  subscribe(hid, cb){ return on('hh', () => cb({ household: db.households[hid], sessions: Object.values(db.sessions[hid]), exercises: Object.values(db.exercises[hid]) })); },
  async putSession(hid, s){ db.sessions[hid][s.id] = JSON.parse(JSON.stringify(s)); fire('hh'); },
  async deleteSession(hid, id){ delete db.sessions[hid][id]; fire('hh'); },
  async putExercise(){}, async setProfileName(){}, async importAll(){},
  async ensurePerson(u, name){ if (!db.people[u.uid]) { db.people[u.uid] = { name, code: 'ARON12' }; db.codes.ARON12 = u.uid; } return db.people[u.uid]; },
  async setPersonName(){}, async getPerson(uid){ return db.people[uid] || null; },
  async setPhoto(uid, data){ db.people[uid] = { ...(db.people[uid]||{}), photo: data || undefined }; },
  async lookupCode(c){ return db.codes[c] || null; },
  async sendRequest(from, fromName, to){ db.requests[`${to}_${from}`] = { id: `${to}_${from}`, from, to, fromName }; fire('social'); },
  async respondRequest(me, from, ok){ if (ok){ const [a,b] = [me, from].sort(); db.friendships[`${a}_${b}`] = { id: `${a}_${b}`, members: [a,b] }; } delete db.requests[`${me}_${from}`]; fire('social'); },
  async cancelRequest(from, to){ delete db.requests[`${to}_${from}`]; fire('social'); },
  async removeFriend(fid){ delete db.friendships[fid]; fire('social'); },
  subscribeSocial(uid, cb){ return on('social', () => cb({ incoming: Object.values(db.requests).filter(r => r.to === uid), outgoing: Object.values(db.requests).filter(r => r.from === uid), friendships: Object.values(db.friendships).filter(f => f.members.includes(uid)) })); },
  subscribeShared(uid, since, cb){ return on('shared', () => cb(Object.values(db.shared[uid] || {}).filter(x => !since || x.date >= since).map(x => JSON.parse(JSON.stringify(x))))); },
  async putShared(uid, d, isNew){ db.shared[uid] = db.shared[uid] || {}; db.shared[uid][d.id] = { ...(db.shared[uid][d.id] || {}), ...(isNew ? { kudos: {} } : {}), ...JSON.parse(JSON.stringify(d)) }; fire('shared'); },
  async deleteShared(uid, id){ delete (db.shared[uid] || {})[id]; fire('shared'); },
  async setKudos(o, sid, from, name){ const d = db.shared[o][sid]; if (!d) throw new Error('nodoc'); d.kudos = { ...(d.kudos || {}) }; if (name) d.kudos[from] = name; else delete d.kudos[from]; fire('shared'); },
  async setVisibility(hid, uid, v){ db.households[hid].profiles[uid].visibility = v; fire('hh'); },
  subscribeChallenges(uid, cb){ return on('ch', () => cb(Object.values(db.challenges).filter(c => c.members.includes(uid)).map(c => JSON.parse(JSON.stringify(c))))); },
  async createChallenge(c){ const id = 'c' + (++cid); db.challenges[id] = { ...c, id, progress: {} }; fire('ch'); return id; },
  async setProgress(id, uid, v){ db.challenges[id].progress[uid] = v; fire('ch'); },
  async leaveChallenge(id, uid){ const c = db.challenges[id]; c.members = c.members.filter(x => x !== uid); delete c.progress[uid]; fire('ch'); },
  async deleteChallenge(id){ delete db.challenges[id]; fire('ch'); }
};
const { startApp } = await import('./gh/js/ui.js');
const d = document, wait = (ms = 30) => new Promise(r => setTimeout(r, ms));
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
try {
  const app = startApp(Store); await wait(700);
  console.log('gate:', d.body.dataset.gate, '| friend sheet opened:', d.querySelector('#sheet').classList.contains('open'), 'prefill:', d.querySelector('#fcode') && d.querySelector('#fcode').value, '| invite:', (d.querySelector('#sheetBody .invite') || {}).textContent, '| url:', location.search);
  click('[data-act="invitesend"]'); await wait(80);
  console.log('request stored:', Object.keys(db.requests));
  // Jón accepts (simulate server side)
  await Store.respondRequest('u3', 'u1', true); await wait(80);
  // Aron logs a lift + run; Sigga's session logged by Aron
  click('[data-tab="log"]'); click('[data-newtype="lift"]'); type(d.querySelector('#exq'), 'Bekkpressa'); click('[data-pickex]');
  type(d.querySelector('[data-cur="kg"]'), '60'); type(d.querySelector('[data-cur="reps"]'), '10'); click('[data-act="doneset"]'); type(d.querySelector('#notes'), 'leyndó'); click('[data-act="savelog"]'); await wait(80);
  click('[data-tab="log"]'); click('[data-newtype="run"]'); type(d.querySelector('#dist'), '5'); type(d.querySelector('#dur'), '25:00'); click('[data-act="savelog"]'); await wait(1500);
  console.log('Aron shared (summary):', Object.values(db.shared.u1).map(x => `${x.type}:detail=${!!x.detail}:vol=${x.volume}`).join(', '));
  click('[data-tab="friends"]'); await wait();
  console.log('week rows:', [...d.querySelectorAll('.wname')].map(x => x.textContent).join(','), '| feed:', [...d.querySelectorAll('.flist .t')].map(x => x.textContent).join(' / '));
  click('[data-kudos="u3|j1"]'); await wait(80);
  console.log('kudos on Jón run:', JSON.stringify(db.shared.u3.j1.kudos), '| button pressed:', d.querySelector('[data-kudos="u3|j1"]').getAttribute('aria-pressed'));
  click('[data-fdetail="u3|j1"]'); console.log('detail sheet:', d.querySelector('#sheetBody').textContent.replace(/\s+/g, ' ').trim().slice(0, 110)); click('#sheetClose');
  click('[data-fm="board"]'); click('[data-bm="km"]'); await wait();
  console.log('board km:', [...d.querySelectorAll('.board li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()).join(' | '));
  click('[data-fm="ch"]'); click('[data-act="newch"]'); type(d.querySelector('#chT'), 'Nóvemberkm'); d.querySelector('#chM').value = 'km'; type(d.querySelector('#chG'), '50');
  click('[data-act="createch"]'); await wait(1500);
  console.log('challenge:', JSON.stringify({ m: db.challenges.c1.members, p: db.challenges.c1.progress }), '| card:', d.querySelector('.chcard') && d.querySelector('.chcard').textContent.replace(/\s+/g, ' ').trim().slice(0, 140));
  // Jón gives kudos to Aron's run (server-side) → home card
  const runId = Object.values(db.shared.u1).find(x => x.type === 'run').id;
  db.shared.u1[runId].kudos = { u3: 'Jón' }; fire('shared'); await wait(80);
  click('[data-tab="home"]'); await wait();
  console.log('home kudos card:', d.querySelector('.kcard') && d.querySelector('.kcard').textContent.trim(), '| list kudos:', [...d.querySelectorAll('.list .d')].map(x => x.textContent).join(' ; '));
  // ---- prófílmynd ----
  console.log('avatar initials:', [...d.querySelectorAll('#who .av')].map(a => a.textContent).join(','), '| feed avatar:', d.querySelector('.feedav .av') ? d.querySelector('.feedav .av').textContent : 'none');
  w.HTMLCanvasElement.prototype.getContext = function(){ return { clearRect(){}, drawImage(){} }; };
  w.HTMLCanvasElement.prototype.toDataURL = function(){ return 'data:image/jpeg;base64,' + 'A'.repeat(20000); };
  w.URL.createObjectURL = () => 'blob:x'; w.URL.revokeObjectURL = () => {}; globalThis.URL.createObjectURL = w.URL.createObjectURL; globalThis.URL.revokeObjectURL = w.URL.revokeObjectURL;
  w.Image = class { constructor(){ this.naturalWidth = 800; this.naturalHeight = 600; } set src(v){ setTimeout(() => this.onload && this.onload(), 0); } }; globalThis.Image = w.Image;
  let created = null; const origCreate = d.createElement.bind(d);
  d.createElement = (tag) => { const el = origCreate(tag); if (tag === 'input') created = el; return el; };
  click('#settingsBtn'); await wait();
  console.log('settings avatar:', d.querySelector('.prof .av').textContent, '| button:', d.querySelector('[data-act="photopick"]').textContent);
  click('[data-act="photopick"]');
  Object.defineProperty(created, 'files', { value: [{ size: 1000 }] }); created.onchange(); await wait(30);
  console.log('cropper open:', d.querySelector('#sheetTitle').textContent, !!d.querySelector('#cropc'));
  const z = d.querySelector('#cropz'); z.value = '2'; z.dispatchEvent(new w.Event('input', { bubbles: true }));
  click('[data-act="photosave"]'); await wait(30);
  console.log('photo saved:', (db.people.u1.photo || '').slice(0, 30), db.people.u1.photo.length, '| settings shows img:', d.querySelector('.prof img.av') !== null, '| header img:', d.querySelector('#who img.av') !== null);
  click('[data-act="photoremove"]'); await wait(30);
  console.log('after remove:', db.people.u1.photo, '| header initial:', d.querySelector('#who .av').textContent);
  d.createElement = origCreate; click('[data-act="setback"]');
  // visibility → full
  click('#settingsBtn'); click('[data-vis="full"]'); await wait(1600);
  console.log('after full:', Object.values(db.shared.u1).map(x => `${x.type}:detail=${!!x.detail}:notes=${x.detail && x.detail.notes}`).join(', '), '| kudos kept:', JSON.stringify(db.shared.u1[runId].kudos));
  click('#sheetClose');
  // incoming request from u4 → accept
  db.people.u4 = { name: 'Gunna', code: 'GUNNA1' }; await Store.sendRequest('u4', 'Gunna', 'u1'); await wait(80);
  click('[data-tab="friends"]'); console.log('request row:', d.querySelector('.reqrow') && d.querySelector('.reqrow').textContent.replace(/\s+/g, ' ').trim());
  click('[data-act="acceptreq"]'); await wait(120);
  console.log('friends now:', Object.keys(db.friendships), '| rows:', [...d.querySelectorAll('.wname')].map(x => x.textContent).join(','));
  // delete a session removes shared
  click('[data-tab="history"]'); click('[data-edit]'); click('[data-act="dellog"]'); await wait(1500);
  console.log('sessions:', Object.keys(db.sessions.H1).length, 'shared u1:', Object.keys(db.shared.u1).length);
  app.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); }
process.exit(0);

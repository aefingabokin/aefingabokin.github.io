import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('gh/index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.confirm = () => true; globalThis.confirm = () => true; w.Element.prototype.scrollIntoView = () => {};
const errs = []; w.addEventListener('error', e => errs.push(e.message));
const sess = {}, shared = {}, goals = {};
const L = []; const on = (k, fn) => { L.push({ k, fn }); setTimeout(fn, 0); return () => {}; }; const fire = k => setTimeout(() => L.filter(l => l.k === k).forEach(l => l.fn()), 0);
const Store = {
  configured: true, onAuthChange(cb){ setTimeout(() => cb({ uid: 'u1', name: 'Aron' }), 0); }, async loadMembership(){ return 'H1'; },
  subscribe(h, cb){ return on('hh', () => cb({ household: { owner: 'u1', members: ['u1'], profiles: { u1: { name: 'Aron', visibility: 'summary' } } }, sessions: Object.values(sess).map(x => JSON.parse(JSON.stringify(x))), exercises: [] })); },
  async putSession(h, s){ sess[s.id] = JSON.parse(JSON.stringify(s)); fire('hh'); },
  async getSettings(){ return null; }, async saveSettings(){},
  subscribeShared(uid, since, cb){ return on('sh', () => cb(Object.values(shared))); }, async putShared(uid, d){ shared[d.id] = { ...(shared[d.id] || {}), ...JSON.parse(JSON.stringify(d)) }; fire('sh'); }, async deleteShared(){},
  subscribeSocial(uid, cb){ return on('so', () => cb({ incoming: [], outgoing: [], friendships: [] })); }, subscribeChallenges(uid, cb){ return on('ch', () => cb([])); },
  async ensurePerson(){ return { name: 'Aron', code: 'X' }; }, async getPerson(){ return null; },
  subscribeGoals(uid, own, cb){ return on('g', () => cb(Object.values(goals))); }, async putGoal(uid, g, m){ goals[g.id] = m ? { ...(goals[g.id] || {}), ...g } : g; fire('g'); }
};
const { startApp } = await import('./gh/js/ui.js');
const d = document, wait = (ms = 60) => new Promise(r => setTimeout(r, ms));
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const type = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
const T = s => s.replace(/\s+/g, ' ').trim();
try {
  const app = startApp(Store); await wait(300);
  click('[data-tab="log"]'); click('[data-newtype="swim"]');
  console.log('spa chips:', [...d.querySelectorAll('[data-act="spaadd"]')].map(b => T(b.textContent)).join(', '));
  type(d.querySelector('#dist'), '800'); type(d.querySelector('#dur'), '20');
  click('[data-act="spaadd"][data-k="hot"]'); click('[data-act="spaadd"][data-k="sauna"]'); click('[data-act="spaadd"][data-k="cold"]'); click('[data-act="spaadd"][data-k="sauna"]'); click('[data-act="spaadd"][data-k="cold"]');
  const ins = d.querySelectorAll('[data-spa]'); type(ins[1], '15'); type(ins[3], '10'); type(ins[4], '1:30');
  click('[data-act="spastep"][data-i="2"][data-d="1"]');
  console.log('rows:', [...d.querySelectorAll('.sparows li')].map(li => T(li.querySelector('.spn').textContent) + '=' + li.querySelector('input').value).join(', '));
  console.log('total:', d.querySelector('#spatotal').textContent);
  click('[data-act="savelog"]'); await wait(1500);
  const s = Object.values(sess)[0]; console.log('saved spa:', JSON.stringify(s.spa));
  console.log('card:', T(d.querySelector('.list .item').textContent));
  console.log('shared spa:', JSON.stringify(Object.values(shared)[0].spa));
  // Pottaferð án sunds
  click('[data-tab="log"]'); click('[data-newtype="swim"]'); click('[data-act="spaadd"][data-k="hot"]'); click('[data-act="spaadd"][data-k="cold"]'); click('[data-act="savelog"]'); await wait(200);
  console.log('spa-only card:', T(d.querySelector('.list .item').textContent));
  // Lyftingar með sauna á eftir
  click('[data-tab="log"]'); click('[data-newtype="lift"]'); type(d.querySelector('#exq'), 'Hnébeygja'); click('[data-pickex]');
  type(d.querySelector('[data-cur="kg"]'), '80'); type(d.querySelector('[data-cur="reps"]'), '5'); click('[data-act="doneset"]');
  click('[data-act="spaadd"][data-k="infrared"]'); click('[data-act="savelog"]'); await wait(200);
  console.log('lift + spa card:', T(d.querySelector('.list .item').textContent));
  // Framfarir sund
  click('[data-tab="progress"]'); click('[data-pm="cardio"]'); click('[data-pt="swim"]'); console.log('spa stats:', T([...d.querySelectorAll('.kv .glass')].pop().textContent));
  // Markmið: kaldi potturinn 3 sinnum á viku
  click('[data-pm="goals"]'); click('[data-act="goalnew"]'); const pre = [...d.querySelectorAll('[data-act="goalpreset"]')].find(b => b.textContent.includes('Kaldi')); click(pre);
  click('[data-act="goalsave"]'); await wait(1500); console.log('cold goal:', T(d.querySelector('.gcard').textContent));
  // Edit keeps spa
  click('[data-tab="history"]'); const sw = [...d.querySelectorAll('[data-edit]')].find(b => b.textContent.includes('800')); click(sw);
  console.log('edit rows:', [...d.querySelectorAll('[data-spa]')].map(i => i.value).join(','));
  click('[data-act="cancel"]');
  app.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); }
process.exit(0);

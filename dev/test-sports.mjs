import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('./index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.confirm = () => true; globalThis.confirm = () => true; w.Element.prototype.scrollIntoView = () => {};
const errs = []; w.addEventListener('error', e => errs.push(e.message));
const sess = {}; let saved = null;
const L = []; const on = (k, fn) => { L.push({ k, fn }); setTimeout(fn, 0); return () => {}; }; const fire = k => setTimeout(() => L.filter(l => l.k === k).forEach(l => l.fn()), 0);
const users = {};
const Store = {
  configured: true, onAuthChange(cb){ setTimeout(() => cb({ uid: 'n1', name: 'Nýr' }), 0); },
  async loadMembership(uid){ return (users[uid] || {}).hid || null; },
  async createHousehold(u, name){ users[u.uid] = { hid: 'H1' }; this.name = name; return 'H1'; },
  subscribe(h, cb){ return on('hh', () => cb({ household: { owner: 'n1', members: ['n1'], profiles: { n1: { name: 'Nýr' } } }, sessions: Object.values(sess).map(x => JSON.parse(JSON.stringify(x))), exercises: [] })); },
  async putSession(h, s){ sess[s.id] = JSON.parse(JSON.stringify(s)); fire('hh'); },
  async getSettings(){ return null; }, async saveSettings(u, s){ saved = JSON.parse(JSON.stringify(s)); },
  async getAbout(){ return null; }, async saveAbout(){}
};
const { startApp } = await import('./gh/js/ui.js');
const d = document, wait = (ms = 60) => new Promise(r => setTimeout(r, ms));
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const type = (sel, v) => { const el = d.querySelector(sel); if (!el) throw new Error('missing ' + sel); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
const T = s => (s || '').replace(/\s+/g, ' ').trim();
const fieldsNow = () => [...d.querySelectorAll('#view [data-field]')].map(i => i.dataset.field).filter(f => !['date', 'notes'].includes(f)).join(',');
try {
  const app = startApp(Store); await wait(100);
  click('[data-act="create"]'); await wait(80);
  console.log('step:', T(d.querySelector('.gate .eyebrow').textContent), '|', d.querySelector('.gate h1').textContent, '| preselected:', [...d.querySelectorAll('.spick[aria-pressed="true"]')].map(b => T(b.textContent)).join(','));
  for (const k of ['walk', 'bike', 'other']) click(`.spick[data-k="${k}"]`);
  for (const k of ['hike', 'golf', 'class', 'ski']) click(`.spick[data-k="${k}"]`);
  click('[data-act="sportsnext"]'); await wait(60);
  console.log('saved sports:', saved.sports.join(','), '| next:', d.querySelector('.gate h1').textContent);
  click('[data-act="aboutskip"]'); await wait(100);
  click('[data-tab="log"]');
  console.log('tiles:', [...d.querySelectorAll('.types .type b')].map(b => b.textContent).join(', '), '| more:', [...d.querySelectorAll('details.more [data-newtype]')].map(b => T(b.textContent)).join(', '));
  // fields per sport / sub
  const check = async (t, sub) => { click(`[data-newtype="${t}"]`); await wait(20); if (sub !== undefined) { click(`[data-act="setsub"][data-s="${sub}"]`); await wait(20); }
    const out = `${t}${sub !== undefined ? '/' + (sub || 'eigið') : ''}: ${fieldsNow()}`; click('[data-act="cancel"]'); await wait(20); click('[data-tab="log"]'); return out; };
  for (const [t, s] of [['hike'], ['ski', 'xc'], ['ski', 'alpine'], ['ski', 'touring'], ['class', 'spin'], ['class', ''], ['golf', 'h18'], ['golf', 'range'], ['golf', 'short'],
    ['row', 'erg'], ['row', 'kayak'], ['yoga'], ['ball'], ['racket'], ['climb'], ['combat'], ['dance'], ['bike'], ['other']]) console.log(' ', await check(t, s));
  // log a golf round, a hike, a spinning class, rowing erg
  click('[data-newtype="golf"]'); click('[data-act="setsub"][data-s="h18"]'); type('#cf_course', 'Grafarholtsvöllur'); type('#cf_score', '92'); type('#cf_points', '34'); type('#dur', '4:05:00'); click('[data-act="savelog"]'); await wait(80);
  click('[data-tab="log"]'); click('[data-newtype="golf"]'); click('[data-act="setsub"][data-s="range"]'); type('#cf_balls', '120'); type('#dur', '45'); click('[data-act="savelog"]'); await wait(80);
  click('[data-tab="log"]'); click('[data-newtype="hike"]'); type('#cf_title', 'Esjan að Steini'); type('#dist', '6,6'); type('#dur', '2:10:00'); type('#cf_elevation', '597');
  console.log('hike pace:', T(d.querySelector('#pace').textContent)); click('[data-act="savelog"]'); await wait(80);
  click('[data-tab="log"]'); click('[data-newtype="class"]'); click('[data-act="setsub"][data-s="spin"]'); type('#dur', '45'); click('[data-act="setint"][data-v="hard"]'); type('#cf_hrRaw', '156'); click('[data-act="savelog"]'); await wait(80);
  click('[data-tab="log"]');
  click('[data-newtype="row"]'); type('#dist', '2000'); type('#dur', '8:05'); console.log('erg pace:', T(d.querySelector('#pace').textContent)); click('[data-act="savelog"]'); await wait(80);
  console.log('home list:'); [...d.querySelectorAll('.list .item')].forEach(i => console.log('   ', T(i.querySelector('.t').textContent), '|', T(i.querySelector('.s').textContent), '|', T((i.querySelector('.tiny') || {}).textContent)));
  console.log('stats km:', T(d.querySelectorAll('.stat .v')[1].textContent));
  // progress
  click('[data-tab="progress"]'); click('[data-pm="cardio"]'); console.log('cardio chips:', [...d.querySelectorAll('[data-pt]')].map(b => b.textContent).join(','));
  click('[data-pt="golf"]'); console.log('golf stats:', [...d.querySelectorAll('.kv .glass')].map(g => T(g.textContent)).join(' | '));
  click('[data-pt="hike"]'); console.log('hike stats:', [...d.querySelectorAll('.kv .glass')].map(g => T(g.textContent)).join(' | '));
  click('[data-pt="class"]'); console.log('class stats:', [...d.querySelectorAll('.kv .glass')].map(g => T(g.textContent)).join(' | '));
  // settings toggles
  click('#settingsBtn'); const tg = d.querySelector('[data-sporttoggle="golf"]'); tg.checked = false; tg.dispatchEvent(new w.Event('change', { bubbles: true }));
  click('[data-act="setback"]'); click('[data-tab="log"]'); console.log('tiles after hiding golf:', [...d.querySelectorAll('.types .type b')].map(b => b.textContent).join(', '));
  // edit golf keeps fields
  click('[data-tab="history"]'); const g = [...d.querySelectorAll('[data-edit]')].find(b => b.textContent.includes('92 högg')); click(g);
  console.log('edit golf:', d.querySelector('[data-act="setsub"][aria-pressed="true"]').textContent, d.querySelector('#cf_score').value, d.querySelector('#cf_course').value);
  app.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); }
process.exit(0);

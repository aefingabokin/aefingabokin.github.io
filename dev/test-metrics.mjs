import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('gh/index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.confirm = () => true; globalThis.confirm = () => true; w.Element.prototype.scrollIntoView = () => {};
const errs = []; w.addEventListener('error', e => errs.push(e.message));
const metrics = {}; const merge = (t, s) => { for (const [k, v] of Object.entries(s)) { if (typeof v === 'number') t[k] = (t[k] || 0) + v; else merge(t[k] = t[k] || {}, v); } };
let users = {}, authCb;
const Store = {
  configured: true, onAuthChange(cb){ authCb = cb; setTimeout(() => cb({ uid: 'n1', name: 'Nýr', email: 'n@x.is' }), 0); },
  async loadMembership(uid){ return (users[uid] || {}).hid || null; },
  async createHousehold(u){ users[u.uid] = { hid: 'H1', joinedAt: new Date(Date.now() - 15 * 86400000).toISOString() }; return 'H1'; },
  subscribe(h, cb){ const emit = () => cb({ household: { owner: 'n1', members: ['n1'], profiles: { n1: { name: 'Nýr' } } }, sessions: [], exercises: [] }); setTimeout(emit, 0); return () => {}; },
  async putSession(){}, async getSettings(){ return null; }, async saveSettings(){},
  async bump(doc, c){ merge(metrics[doc] = metrics[doc] || {}, c); }, async getUserMeta(uid){ return { joinedAt: users[uid].joinedAt }; },
  async importAll(){}, async putExercise(){}
};
const { startApp } = await import('./gh/js/ui.js');
const d = document, wait = (ms = 60) => new Promise(r => setTimeout(r, ms));
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const type = (s, v) => { const el = d.querySelector(s); el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
try {
  const app = startApp(Store); await wait(100);
  click('[data-act="create"]'); await wait(80); click('.spick[data-k="golf"]'); click('[data-act="sportsnext"]'); await wait(50); click('[data-act="aboutskip"]'); await wait(2500);
  click('[data-tab="log"]'); click('[data-newtype="lift"]'); type('#exq', 'Bekkpressa'); click('[data-pickex]'); type('[data-cur="kg"]', '60'); type('[data-cur="reps"]', '10'); click('[data-act="doneset"]');
  click('[data-act="pickex"]'); type('#exq', 'Ketilbjöllu-róður'); click('[data-newex]'); type('[data-cur="kg"]', '20'); type('[data-cur="reps"]', '10'); click('[data-act="doneset"]');
  click('[data-act="spaadd"][data-k="sauna"]'); click('[data-act="savelog"]'); await wait(80);
  click('#settingsBtn'); click('[data-set="weekStyle"][data-val="tiles"]'); await wait(50);
  const an = d.querySelector('[data-settoggle="analytics"]'); console.log('privacy toggle:', !!an, an && an.checked);
  console.log(JSON.stringify(metrics, null, 0));
  an.checked = false; an.dispatchEvent(new w.Event('change', { bubbles: true })); await wait(30);
  const before = JSON.stringify(metrics);
  click('[data-act="setback"]'); click('[data-tab="log"]'); click('[data-newtype="run"]'); type('#dist', '5'); type('#dur', '25:00'); click('[data-act="savelog"]'); await wait(80);
  console.log('after opt-out, unchanged:', JSON.stringify(metrics) === before);
  app.stop(); console.log('errors', errs);
} catch(e){ console.log('FAIL', e.stack, errs); }
process.exit(0);

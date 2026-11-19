import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('./index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.confirm = () => true; globalThis.confirm = () => true;
const errs = []; w.addEventListener('error', e => errs.push(e.message));
const db = { users: { u1: { householdId: 'H1', settings: { palette: 'aurora', homeHidden: ['prs'] } } }, households: { H1: { owner: 'u1', members: ['u1'], profiles: { u1: { name: 'Aron' } } } }, sessions: {} };
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
const change = (s, checked) => { const el = d.querySelector(s); el.checked = checked; el.dispatchEvent(new w.Event('change', { bubbles: true })); };
const R = d.documentElement;
try {
  const app = startApp(Store); await wait(200);
  console.log('remote applied:', R.dataset.palette, '| prs card shown:', !!d.querySelector('.prs'), '| home order:', [...d.querySelectorAll('#view > *')].map(e => e.className || e.tagName).join(','));
  click('#settingsBtn'); await wait();
  console.log('settings page:', d.querySelector('.set-top h1').textContent, '| gear hidden:', d.querySelector('#settingsBtn').hidden, '| sections:', [...d.querySelectorAll('.sec-h')].map(x => x.textContent).join(', '));
  click('[data-set="theme"][data-val="dark"]'); click('[data-set="palette"][data-val="sunset"]'); click('[data-set="textSize"][data-val="large"]');
  change('[data-settoggle="glass"]', false);
  console.log('html attrs:', R.getAttribute('data-theme'), R.dataset.palette, R.dataset.text, R.dataset.glass, '| meta:', d.querySelector('meta[name=theme-color]').content);

  change('[data-homecard="kudos"]', false);
  change('[data-tabtoggle="friends"]', false);
  click('[data-set="kgStep"][data-val="1.25"]'); click('[data-set="startTab"][data-val="log"]');
  await wait(800);
  console.log('saved remote:', JSON.stringify(saved));
  console.log('localStorage:', localStorage.getItem('aefingabokin.settings').slice(0, 80));
  console.log('friends tab hidden:', d.querySelector('[data-tab="friends"]').hidden);
  click('[data-act="setback"]'); await wait();
  console.log('back to:', d.querySelector('h1').textContent, '| order:', [...d.querySelectorAll('#view h2, #view section, #view .stats, #view .cta')].map(e => e.tagName === 'H2' ? 'h2:' + e.textContent : e.className.split(' ')[0]).join(', '));
  click('[data-tab="log"]'); click('[data-newtype="lift"]'); click('[data-pickex]');
  d.querySelector('[data-cur="kg"]').value = '40'; d.querySelector('[data-cur="kg"]').dispatchEvent(new w.Event('input', { bubbles: true }));
  click('[data-act="step"][data-k="kg"][data-d="1"]'); console.log('kg after step 1.25:', d.querySelector('[data-cur="kg"]').value);
  app.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); }
process.exit(0);

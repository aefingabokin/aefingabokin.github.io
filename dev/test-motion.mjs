/* Hreyfing (3.8): skjáskipti (`enter`, `swap`, `wkn`/`wkp`), framhald hreyfingar við endurteikningu (`--fxd`),
   hleðsluskjárinn úr index.html, gluggi dreginn niður og talnasnið þegar vafrinn kann ekki íslensku */
import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('./index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.scrollBy = () => {}; w.confirm = () => true; globalThis.confirm = () => true;
w.matchMedia = q => ({ matches: false, addEventListener(){}, removeEventListener(){} });
const errs = []; w.addEventListener('error', e => errs.push(e.message));
/* Chrome á Android: íslenskt talnasnið vantar. Líkt eftir því áður en appið er lesið inn. */
const sup = Intl.NumberFormat.supportedLocalesOf;
Intl.NumberFormat.supportedLocalesOf = (l, o) => sup.call(Intl.NumberFormat, [].concat(l).filter(x => !/^is/.test(x)), o);

const db = { users: { u1: { householdId: 'H1', settings: { news: '3.7' } } },
  households: { H1: { owner: 'u1', members: ['u1', 'u2'], profiles: { u1: { name: 'Aron' }, u2: { name: 'Sigga' } } } },
  sessions: { s1: { id: 's1', profileId: 'u1', type: 'run', date: new Date().toISOString().slice(0, 10), distance: 10.3, durationMin: 62.5 },
              s2: { id: 's2', profileId: 'u1', type: 'swim', date: new Date().toISOString().slice(0, 10), distance: 1000, durationMin: 25 } } };
let subCb = null;
const Store = {
  configured: true,
  onAuthChange(cb){ setTimeout(() => cb({ uid: 'u1', name: 'Aron', email: 'aron@x.is' }), 30); },
  async signOut(){}, async loadMembership(uid){ return db.users[uid].householdId; },
  async getSettings(uid){ return db.users[uid].settings; }, async saveSettings(){},
  subscribe(hid, cb){ subCb = () => cb({ household: db.households.H1, sessions: Object.values(db.sessions), exercises: [] }); setTimeout(subCb, 0); return () => {}; },
  async putSession(h, s){ db.sessions[s.id] = s; }
};
const d = document, view = d.querySelector('#view'), wait = (ms = 40) => new Promise(r => setTimeout(r, ms));
const boot0 = view.querySelector('.boot');
console.log('hleðsluskjár í index.html:', !!boot0, '| súlur:', view.querySelectorAll('.bootlogo .bb').length);
const { startApp } = await import('./gh/js/ui.js');
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const fx = () => ['enter', 'swap', 'wkn', 'wkp'].filter(c => view.classList.contains(c)).join('+') || '–';
try {
  const app = startApp(Store);
  console.log('sama merki áfram meðan hlaðið er:', view.querySelector('.boot') === boot0, '| gátt:', d.body.dataset.gate);
  await wait(400);
  console.log('appið opnast:', d.body.dataset.gate, d.body.dataset.tab, '| hreyfing:', fx());
  const txt = view.textContent;
  console.log('talnasnið án íslensku í vafra:', /10,3\s*km/.test(txt) ? '10,3 km' : 'RANGT', '|', /1\.000\s*m/.test(txt) ? '1.000 m' : 'RANGT');
  subCb(); console.log('gögn berast í miðri hreyfingu:', fx(), '| heldur áfram (--fxd):', /^-\d+ms$/.test(view.style.getPropertyValue('--fxd')));
  await wait(1500); console.log('hreyfingu lokið:', fx(), '| --fxd hreinsað:', view.style.getPropertyValue('--fxd') === '');
  subCb(); console.log('teikning án skjáskipta:', fx());
  click('.tabs [data-tab="history"]'); console.log('nýr flipi:', d.body.dataset.tab, fx());
  await wait(1500);
  click('.tabs [data-tab="home"]'); await wait(1500);
  click('[data-act="wprev"]'); console.log('fyrri vika:', fx());
  click('[data-act="wnext"]'); console.log('næsta vika:', fx());
  await wait(1500);
  click(d.querySelectorAll('#who button')[1]); console.log('skipt um prófíl:', fx());
  await wait(1500);
  /* Gluggi: dreginn stutt (helst opinn) og langt (lokast) */
  click('#settingsBtn'); await wait();
  click([...d.querySelectorAll('[data-act]')].find(b => b.dataset.act === 'newsopen')); await wait();
  const sh = d.querySelector('#sheet'), head = sh.querySelector('.sheet-h b');
  const pe = (type, y, t) => { const e = new w.MouseEvent(type, { bubbles: true, clientY: y }); Object.defineProperty(e, 'pointerType', { value: 'touch' }); Object.defineProperty(e, 'timeStamp', { value: t }); head.dispatchEvent(e); };
  pe('pointerdown', 100, 0); pe('pointermove', 120, 400); const mid = sh.style.translate; pe('pointerup', 120, 800);
  console.log('gluggi opinn:', sh.classList.contains('open'), '| fylgir fingri:', mid, '| stutt drag lokar ekki:', sh.classList.contains('open') && sh.style.translate === '');
  pe('pointerdown', 100, 1000); pe('pointermove', 400, 1400); pe('pointerup', 400, 1800);
  console.log('langt drag lokar:', !sh.classList.contains('open'));
  app.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); }
process.exit(0);

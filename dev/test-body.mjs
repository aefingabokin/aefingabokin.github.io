import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('./index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.confirm = () => true; globalThis.confirm = () => true;
const errs = []; w.addEventListener('error', e => errs.push(e.message));
const db = { users: {}, households: {}, meas: {} };
let measCb;
const Store = {
  configured: true,
  onAuthChange(cb){ setTimeout(() => cb({ uid: 'n1', name: 'Nýr Notandi' }), 0); },
  async loadMembership(uid){ return (db.users[uid] || {}).householdId || null; },
  async createHousehold(u, name){ db.households.H9 = { owner: u.uid, members: [u.uid], profiles: { [u.uid]: { name } } }; db.users[u.uid] = { householdId: 'H9' }; return 'H9'; },
  subscribe(hid, cb){ setTimeout(() => cb({ household: db.households[hid], sessions: [], exercises: [] }), 0); return () => {}; },
  async getSettings(){ return null; }, async saveSettings(){},
  async getAbout(uid){ return (db.users[uid] || {}).about || null; },
  async saveAbout(uid, a){ db.users[uid] = { ...(db.users[uid] || {}), about: a }; },
  subscribeMeasurements(uid, cb){ measCb = () => cb(Object.values(db.meas).map(x => ({ ...x }))); setTimeout(measCb, 0); return () => {}; },
  async putMeasurement(uid, m){ db.meas[m.id] = JSON.parse(JSON.stringify(m)); setTimeout(measCb, 0); },
  async deleteMeasurement(uid, id){ delete db.meas[id]; setTimeout(measCb, 0); }
};
const { startApp } = await import('./gh/js/ui.js');
const d = document, wait = (ms = 50) => new Promise(r => setTimeout(r, ms));
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const set = (sel, v) => { d.querySelector(sel).value = v; };
try {
  const app = startApp(Store); await wait(100);
  console.log('gate:', d.body.dataset.gate); click('[data-act="create"]'); await wait(100); click('[data-act="sportsnext"]'); await wait(50);
  console.log('about step:', d.body.dataset.gate, '|', d.querySelector('.gate h1').textContent, '| privacy:', d.querySelector('.privacy').textContent.trim());
  set('#ab_birth', '1988-03-14'); click('[data-act="aboutsex"][data-v="male"]'); set('#ab_height', '183'); set('#ab_weight', '88,4'); set('#ab_fat', '21');
  click('[data-act="aboutonboard"]'); await wait(150);
  console.log('saved about:', JSON.stringify({ ...db.users.n1.about, updatedAt: undefined }), '| first measurement:', JSON.stringify(Object.values(db.meas).map(m => [m.weight, m.bodyFat])));
  console.log('after onboarding gate:', d.body.dataset.gate);
  // older measurements to show trend
  const back = n => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
  db.meas.o1 = { id: 'o1', date: back(45), weight: 90.6, bodyFat: 22.4, waist: 94 }; db.meas.o2 = { id: 'o2', date: back(20), weight: 89.5, bodyFat: 21.8, muscle: 38.2 }; measCb(); await wait();
  click('[data-tab="progress"]'); click('[data-pm="body"]'); await wait();
  console.log('aboutbar:', d.querySelector('.aboutbar').textContent.replace(/\s+/g, ' ').trim());
  console.log('tiles:', [...d.querySelectorAll('.mtile')].map(t => t.textContent.replace(/\s+/g, ' ').trim()).join(' | '));
  console.log('chart:', !!d.querySelector('section.glass svg'), '| kv:', d.querySelector('.kv') && d.querySelector('.kv').textContent.replace(/\s+/g, ' ').trim());
  click('[data-bm2="bmi"]'); click('[data-brange="all"]'); console.log('bmi chart pts:', d.querySelectorAll('section.glass svg circle').length);
  // goals
  click('[data-act="aboutedit"]'); set('#ab_tw', '84'); set('#ab_tf', '16'); click('[data-act="aboutsave"]'); await wait();
  click('[data-bm2="weight"]'); console.log('goal line:', d.querySelectorAll('section.glass svg line[stroke-dasharray="6 5"]').length, '| tile:', d.querySelector('[data-bm2="weight"]').textContent.replace(/\s+/g, ' ').trim());
  // new measurement with girth + out of range check
  click('[data-act="measurenew"]'); set('#ms_weight', '400'); click('[data-act="measuresave"]'); console.log('toast:', d.querySelector('#toast').textContent);
  set('#ms_weight', '87,9'); set('#ms_waist', '91,5'); set('#ms_restingHr', '54'); click('[data-act="measuresave"]'); await wait();
  console.log('measurements:', Object.keys(db.meas).length, '| list top:', d.querySelector('.list .item').textContent.replace(/\s+/g, ' ').trim());
  // edit + delete
  click('[data-measure="o1"]'); console.log('edit title:', d.querySelector('#sheetTitle').textContent, '| girth open:', d.querySelector('details.girth').open);
  click('[data-act="measuredel"]'); await wait(); console.log('after delete:', Object.keys(db.meas).length);
  // settings section
  click('#settingsBtn'); console.log('settings about:', [...d.querySelectorAll('.sec-h')].map(x => x.textContent).join(','), '|', d.querySelector('.aboutbar.flat').textContent.replace(/\s+/g, ' ').trim());
  click('[data-act="setback"]');
  app.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); }
process.exit(0);

import { JSDOM } from 'jsdom';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const html = fs.readFileSync('./index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.confirm = () => true; globalThis.confirm = () => true;
w.XLSX = XLSX;                               // í vafranum er þetta sótt af cdnjs
const files = []; w.URL.createObjectURL = b => { files.push(b); return 'blob:' + files.length; }; w.URL.revokeObjectURL = () => {};
globalThis.URL.createObjectURL = w.URL.createObjectURL; globalThis.URL.revokeObjectURL = w.URL.revokeObjectURL;
const names = []; w.HTMLAnchorElement.prototype.click = function(){ names.push(this.download); };
const errs = []; w.addEventListener('error', e => errs.push(e.message));
const T = '2026-11-08';
const sessions = [
  { id: 's1', profileId: 'u1', type: 'lift', date: T, durationMin: 55, notes: 'Góð; "þung" æfing', exercises: [{ exId: 'x_bekkpressa', name: 'Bekkpressa', sets: [{ kg: 60, reps: 10 }, { kg: 62.5, reps: 8 }] }] },
  { id: 's2', profileId: 'u1', type: 'run', date: '2026-11-09', distance: 5.2, durationMin: 28.5, avgHr: 148, effortAuto: 'easy' },
  { id: 's3', profileId: 'u2', type: 'swim', date: '2026-11-09', distance: 1000, durationMin: 25 }
];
const Store = {
  configured: true,
  onAuthChange(cb){ setTimeout(() => cb({ uid: 'u1', name: 'Aron' }), 0); },
  async loadMembership(){ return 'H1'; },
  subscribe(hid, cb){ setTimeout(() => cb({ household: { owner: 'u1', members: ['u1', 'u2'], profiles: { u1: { name: 'Aron' }, u2: { name: 'Sigga' } } }, sessions, exercises: [] }), 0); return () => {}; },
  async getSettings(){ return null; }, async saveSettings(){},
  async getAbout(){ return { heightCm: 183 }; },
  subscribeMeasurements(uid, cb){ setTimeout(() => cb([{ id: 'm1', date: '2026-11-01', weight: 88.4, bodyFat: 21, waist: 94.5, note: 'morgun' }]), 0); return () => {}; },
  async putSession(){}
};
const { startApp } = await import('./gh/js/ui.js');
const d = document, wait = (ms = 60) => new Promise(r => setTimeout(r, ms));
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const txt = b => new Promise(r => { const fr = new w.FileReader(); fr.onload = () => r(fr.result); fr.readAsText(b); });
const buf = b => new Promise(r => { const fr = new w.FileReader(); fr.onload = () => r(fr.result); fr.readAsArrayBuffer(b); });
try {
  const app = startApp(Store); await wait(200);
  click('#settingsBtn'); click('[data-act="exportopen"]');
  console.log('sheet:', d.querySelector('#sheetTitle').textContent, '| rows:', [...d.querySelectorAll('#sheetBody .srow .tiny')].map(x => x.textContent).join(' / '));
  click('[data-act="excsv"][data-t="sessions"]'); await wait();
  console.log('file:', names.at(-1)); console.log((await txt(files.at(-1))).split('\r\n').slice(0, 3).join('\n'));
  click('[data-act="excsv"][data-t="sets"]'); await wait(); console.log('file:', names.at(-1)); console.log((await txt(files.at(-1))).split('\r\n').slice(0, 3).join('\n'));
  click('[data-act="exfmt"][data-v="intl"]'); click('[data-act="exscope"][data-v="both"]');
  click('[data-act="excsv"][data-t="sessions"]'); await wait(); console.log('intl both:'); console.log((await txt(files.at(-1))).split('\r\n').slice(0, 5).join('\n'));
  click('[data-act="excsv"][data-t="meas"]'); await wait(); console.log('meas intl:'); console.log((await txt(files.at(-1))).split('\r\n').slice(0, 2).join('\n'));
  click('[data-act="exxlsx"]'); await wait(200);
  console.log('xlsx file:', names.at(-1));
  const wb = XLSX.read(new Uint8Array(await buf(files.at(-1))), { type: 'array' });
  console.log('sheets:', wb.SheetNames.join(', '));
  wb.SheetNames.forEach(n => { const rows = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1 }); console.log(` ${n}: ${rows.length - 1} rows | ${JSON.stringify(rows[1])}`); });
  click('[data-act="export"]'); await wait(); const j = JSON.parse(await txt(files.at(-1)));
  console.log('json:', names.at(-1), 'version', j.version, 'sessions', j.sessions.length, 'measurements', j.measurements.length, 'about', JSON.stringify(j.about));
  app.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); }
process.exit(0);

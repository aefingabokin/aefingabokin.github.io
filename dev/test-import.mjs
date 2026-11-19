import { JSDOM } from 'jsdom';
import fs from 'fs';
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.DOMParser = dom.window.DOMParser;
const { readImportFile } = await import('./gh/js/importers.js');
const mk = (name) => { const buf = fs.readFileSync('samples/' + name); return { name, size: buf.length, text: async () => buf.toString('utf8'),
  stream: () => { let sent = false; const chunks = []; for (let i = 0; i < buf.length; i += 97) chunks.push(buf.subarray(i, i + 97));
    return { getReader: () => ({ read: async () => chunks.length ? { done: false, value: chunks.shift() } : { done: true } }) }; } }; };
for (const f of ['Activities.csv', 'activities.csv', 'run.gpx', 'act.tcx', 'export.xml']){
  try { const r = await readImportFile(mk(f)); console.log(`== ${f} (${r.source})`);
    r.items.forEach(i => console.log('  ', i.type, i.sub || '', i.date, 'dist=' + i.distance, 'min=' + (i.durationMin && i.durationMin.toFixed(1)), 'hr=' + i.avgHr, 'elev=' + i.elevation, i.title || '', i.importKey));
  } catch(e){ console.log(f, 'ERR', e.code, e.message); }
}
for (const bad of ['x.zip', 'x.fit', 'x.pdf']) { try { await readImportFile({ name: bad }); } catch(e){ console.log(bad, '→', e.code); } }

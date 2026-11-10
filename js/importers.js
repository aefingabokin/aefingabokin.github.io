/* =====================================================================
   Innlestur æfinga úr úrum. Allt er lesið í símanum sjálfum, og aðeins
   æfingarnar (tegund, dagur, vegalengd, tími, púls, hækkun) eru vistaðar.
     Garmin Connect: Activities.csv (Export CSV) og .tcx / .gpx fyrir stakar æfingar
     Strava: activities.csv úr gagnaútflutningi (nær yfir flest úr sem tengjast Strava)
     Apple Watch: export.xml úr Heilsu-appinu (Flytja út öll heilsugögn)
   ===================================================================== */

/* Tegund úr texta (Garmin, Strava, TCX, GPX, Apple) yfir í íþrótt appsins */
export function mapActivity(raw){
  const t = String(raw || '').replace(/^HKWorkoutActivityType/, '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  const has = (...w) => w.some(x => t.includes(x));
  if (has('strength', 'weight training', 'weighttraining', 'functional strength', 'traditional strength')) return { type: 'lift' };
  if (has('nordic ski', 'cross country ski', 'cross-country ski', 'xc ski', 'skate ski')) return { type: 'ski', sub: 'xc' };
  if (has('backcountry', 'alpine touring', 'ski touring', 'skimo')) return { type: 'ski', sub: 'touring' };
  if (has('alpine ski', 'downhill ski', 'resort ski', 'snowboard', 'ski')) return { type: 'ski', sub: 'alpine' };
  if (has('hik', 'mountaineer')) return { type: 'hike' };
  if (has('run', 'jog')) return { type: 'run' };
  if (has('walk')) return { type: 'walk' };
  if (has('swim')) return { type: 'swim' };
  if (has('cycl', 'bik', 'ride', 'spin')) return has('spin', 'indoor cycl') ? { type: 'class', sub: 'spin' } : { type: 'bike' };
  if (has('row', 'kayak', 'canoe', 'paddl')) return has('kayak', 'canoe', 'paddl') ? { type: 'row', sub: 'kayak' } : { type: 'row', sub: 'erg' };
  if (has('yoga')) return { type: 'yoga', sub: 'yoga' };
  if (has('pilates')) return { type: 'yoga', sub: 'pilates' };
  if (has('flexibility', 'stretch', 'mobility', 'cooldown')) return { type: 'yoga', sub: 'stretch' };
  if (has('hiit', 'high intensity')) return { type: 'class', sub: 'hiit' };
  if (has('crossfit', 'cross training', 'functional', 'cardio', 'workout', 'elliptical', 'stair')) return { type: 'class', sub: null, title: titleCase(t) };
  if (has('golf')) return { type: 'golf', sub: 'h18' };
  if (has('padel')) return { type: 'racket', sub: 'padel' };
  if (has('tennis')) return { type: 'racket', sub: has('table') ? 'tabletennis' : 'tennis' };
  if (has('badminton')) return { type: 'racket', sub: 'badminton' };
  if (has('squash', 'racquet', 'pickleball')) return { type: 'racket', sub: 'squash' };
  if (has('soccer', 'football')) return { type: 'ball', sub: 'football' };
  if (has('basketball')) return { type: 'ball', sub: 'basketball' };
  if (has('handball')) return { type: 'ball', sub: 'handball' };
  if (has('volleyball')) return { type: 'ball', sub: 'volleyball' };
  if (has('climb', 'boulder')) return { type: 'climb', sub: has('boulder') ? 'boulder' : 'rope' };
  if (has('box', 'kickbox', 'martial', 'mma', 'judo', 'karate', 'jiu')) return { type: 'combat', sub: has('kick') ? 'kickbox' : has('box') ? 'box' : 'mma' };
  if (has('dance', 'barre', 'zumba')) return { type: 'dance' };
  return { type: 'other', title: titleCase(t) || 'Æfing úr úri' };
}
const titleCase = t => t ? t.replace(/\b\w/g, c => c.toUpperCase()) : '';

/* Tala sem getur haft þúsundakommur (1,000) eða aukastafakommu (5,2) */
function numLoose(v){
  if (v == null) return null;
  let s = String(v).trim().replace(/\s/g, '');
  if (!s || s === '--') return null;
  if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
  else if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, '');
  else s = s.replace(',', '.');
  const n = parseFloat(s); return isFinite(n) ? n : null;
}
function durMin(v){
  if (v == null || v === '' || v === '--') return null;
  const s = String(v).trim();
  if (s.includes(':')){ const p = s.split(':').map(x => parseFloat(x) || 0);
    return p.length === 3 ? p[0] * 60 + p[1] + p[2] / 60 : p[0] + p[1] / 60; }
  const n = numLoose(s); return n == null ? null : n;
}
const pad = n => String(n).padStart(2, '0');
const ymdLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/* Vegalengd í einingu íþróttarinnar: metrar fyrir sund og róðravél, annars km */
function fixDistance(item, km){
  if (km == null || !(km > 0)) return null;
  const meters = item.type === 'swim' || (item.type === 'row' && item.sub === 'erg');
  return meters ? Math.round(km * 1000) : Math.round(km * 100) / 100;
}

/* CSV með gæsalöppum, kommu eða semíkommu */
function parseCsvText(text){
  text = text.replace(/^\uFEFF/, '');
  const first = text.split(/\r?\n/, 1)[0] || '';
  const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++){
    const c = text[i];
    if (q){ if (c === '"'){ if (text[i + 1] === '"'){ cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === sep){ row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r'){ if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length){ row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim() !== ''));
}
function parseCsv(text){
  const rows = parseCsvText(text); if (rows.length < 2) throw Object.assign(new Error('empty'), { code: 'empty' });
  const head = rows[0].map(h => h.trim().toLowerCase()), col = name => head.indexOf(name);
  // Strava: activities.csv
  if (col('activity id') >= 0 && col('activity date') >= 0){
    const iT = col('activity type'), iD = col('activity date'), iN = col('activity name'), iE = col('elapsed time'), iM = col('moving time');
    const iDist = col('distance'), iEl = col('elevation gain'), iHr = col('average heart rate'), iId = col('activity id');
    return { source: 'strava', items: rows.slice(1).map(r => {
      const m = mapActivity(r[iT]), when = new Date(r[iD]); if (isNaN(when)) return null;
      const it = { ...m, date: ymdLocal(when), startISO: when.toISOString(), importKey: `strava:${r[iId]}`, source: 'strava',
        durationMin: (numLoose(r[iM >= 0 && numLoose(r[iM]) ? iM : iE]) || 0) / 60 || null, avgHr: numLoose(r[iHr]), elevation: numLoose(r[iEl]) };
      if (m.type === 'other' && r[iN]) it.title = r[iN];
      if (m.type === 'hike' && r[iN]) it.title = r[iN];
      it.distance = fixDistance(it, numLoose(r[iDist]));
      return it; }).filter(Boolean) };
  }
  // Garmin Connect: Activities.csv (Export CSV)
  if (col('activity type') >= 0 && col('date') >= 0){
    const iT = col('activity type'), iD = col('date'), iTi = col('title'), iDist = col('distance'), iTime = col('time') >= 0 ? col('time') : col('elapsed time');
    const iHr = col('avg hr'), iEl = col('total ascent');
    return { source: 'garmin', items: rows.slice(1).map(r => {
      const m = mapActivity(r[iT]), when = new Date(String(r[iD]).replace(' ', 'T')); if (isNaN(when)) return null;
      const it = { ...m, date: ymdLocal(when), startISO: when.toISOString(), importKey: `garmin:${r[iD]}:${r[iT]}`, source: 'garmin',
        durationMin: durMin(r[iTime]), avgHr: numLoose(r[iHr]), elevation: numLoose(r[iEl]) };
      if ((m.type === 'other' || m.type === 'hike') && r[iTi]) it.title = r[iTi];
      let d = numLoose(r[iDist]);
      if (d != null && m.type === 'swim' && d > 20) d = d / 1000;          // Garmin gefur sund í metrum
      it.distance = fixDistance(it, d);
      return it; }).filter(Boolean) };
  }
  throw Object.assign(new Error('csv'), { code: 'csv-unknown' });
}

function haversineKm(a, b){
  const R = 6371, toR = x => x * Math.PI / 180, dLa = toR(b.lat - a.lat), dLo = toR(b.lon - a.lon);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function gainOf(eles){ let g = 0, last = null; eles.forEach(e => { if (e == null) return; if (last != null && e - last > 0.5) g += e - last; if (last == null || Math.abs(e - last) > 0.5) last = e; }); return Math.round(g); }
function parseGpx(text, filename){
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const pts = [...doc.getElementsByTagName('trkpt')].map(p => ({ lat: +p.getAttribute('lat'), lon: +p.getAttribute('lon'),
    ele: p.getElementsByTagName('ele')[0] ? +p.getElementsByTagName('ele')[0].textContent : null,
    t: p.getElementsByTagName('time')[0] ? new Date(p.getElementsByTagName('time')[0].textContent) : null }));
  if (pts.length < 2) throw Object.assign(new Error('gpx'), { code: 'gpx-empty' });
  let km = 0; for (let i = 1; i < pts.length; i++) km += haversineKm(pts[i - 1], pts[i]);
  const t0 = pts.find(p => p.t), t1 = [...pts].reverse().find(p => p.t);
  const typeEl = doc.getElementsByTagName('type')[0], nameEl = doc.getElementsByTagName('name')[0];
  let m = typeEl ? mapActivity(typeEl.textContent) : null;
  const durationMin = t0 && t1 ? (t1.t - t0.t) / 60000 : null;
  if (!m || m.type === 'other'){ const pace = durationMin && km ? durationMin / km : null; m = pace && pace < 8.5 ? { type: 'run' } : pace && pace < 4 ? { type: 'bike' } : { type: 'walk' }; }
  const start = t0 ? t0.t : new Date();
  const it = { ...m, date: ymdLocal(start), startISO: start.toISOString(), importKey: `gpx:${start.toISOString()}`, source: 'gpx',
    durationMin, elevation: gainOf(pts.map(p => p.ele)) || null, avgHr: null };
  if ((it.type === 'hike' || it.type === 'other') && nameEl) it.title = nameEl.textContent.trim().slice(0, 60);
  it.distance = fixDistance(it, km);
  return it;
}
function parseTcx(text){
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const acts = [...doc.getElementsByTagName('Activity')];
  if (!acts.length) throw Object.assign(new Error('tcx'), { code: 'tcx-empty' });
  return acts.map(a => {
    const m = mapActivity(a.getAttribute('Sport'));
    const idEl = a.getElementsByTagName('Id')[0], start = idEl ? new Date(idEl.textContent) : new Date();
    let sec = 0, meters = 0, hrSum = 0, hrW = 0;
    [...a.getElementsByTagName('Lap')].forEach(l => {
      const g = n => { const e = [...l.children].find(c => c.tagName === n); return e ? parseFloat(e.textContent) || 0 : 0; };
      const s = g('TotalTimeSeconds'); sec += s; meters += g('DistanceMeters');
      const hr = l.getElementsByTagName('AverageHeartRateBpm')[0]; if (hr){ const v = parseFloat(hr.textContent) || 0; hrSum += v * s; hrW += s; }
    });
    const eles = [...a.getElementsByTagName('AltitudeMeters')].map(e => parseFloat(e.textContent));
    const it = { ...m, date: ymdLocal(start), startISO: start.toISOString(), importKey: `tcx:${start.toISOString()}`, source: 'tcx',
      durationMin: sec ? sec / 60 : null, avgHr: hrW ? Math.round(hrSum / hrW) : null, elevation: gainOf(eles) || null };
    it.distance = fixDistance(it, meters / 1000);
    return it;
  });
}
/* Apple Heilsa: export.xml getur verið mjög stór, svo hún er lesin í bútum og aðeins <Workout> er skoðað */
async function parseAppleExport(file, onProgress){
  const reader = file.stream().getReader(), dec = new TextDecoder(), out = [];
  let buf = '', read = 0;
  const attrs = tag => { const o = {}; tag.replace(/(\w+)="([^"]*)"/g, (_, k, v) => { o[k] = v; }); return o; };
  const handle = el => {
    const a = attrs(el.slice(0, el.indexOf('>') + 1));
    const m = mapActivity(a.workoutActivityType);
    const start = new Date(String(a.startDate || '').replace(' ', 'T').replace(/ ([+-]\d{2})(\d{2})$/, '$1:$2'));
    if (isNaN(start)) return;
    let dur = parseFloat(a.duration) || null; const du = (a.durationUnit || 'min').toLowerCase();
    if (dur != null) dur = du === 's' ? dur / 60 : du === 'hr' || du === 'h' ? dur * 60 : dur;
    let dist = parseFloat(a.totalDistance), unit = (a.totalDistanceUnit || 'km').toLowerCase(), hr = null;
    el.replace(/<WorkoutStatistics ([^>]*)\/?>/g, (_, s) => { const st = attrs(s);
      if (/Distance/.test(st.type || '') && isNaN(dist)){ dist = parseFloat(st.sum); unit = (st.unit || 'km').toLowerCase(); }
      if (/HeartRate$/.test(st.type || '') && st.average) hr = Math.round(parseFloat(st.average)); });
    const toKm = { km: 1, m: 0.001, mi: 1.609344, yd: 0.0009144 };
    const km = isNaN(dist) ? null : dist * (toKm[unit] || 1);
    let elev = null; const em = el.match(/key="HKElevationAscended" value="([\d.]+) ?(cm|m|ft)"/);
    if (em) elev = Math.round(parseFloat(em[1]) * (em[2] === 'cm' ? 0.01 : em[2] === 'ft' ? 0.3048 : 1));
    const it = { ...m, date: ymdLocal(start), startISO: start.toISOString(), importKey: `apple:${start.toISOString()}`, source: 'apple',
      durationMin: dur, avgHr: hr, elevation: elev };
    it.distance = fixDistance(it, km);
    out.push(it);
  };
  for (;;){
    const { done, value } = await reader.read();
    if (value){ read += value.length; buf += dec.decode(value, { stream: true }); }
    for (;;){
      const i = buf.indexOf('<Workout '); if (i < 0){ buf = buf.slice(-400); break; }
      const gt = buf.indexOf('>', i); if (gt < 0){ buf = buf.slice(i); break; }
      if (buf[gt - 1] === '/'){ handle(buf.slice(i, gt + 1)); buf = buf.slice(gt + 1); continue; }
      const end = buf.indexOf('</Workout>', gt); if (end < 0){ buf = buf.slice(i); break; }
      handle(buf.slice(i, end + 10)); buf = buf.slice(end + 10);
    }
    if (onProgress && file.size) onProgress(Math.min(1, read / file.size));
    if (done) break;
  }
  return out;
}

export async function readImportFile(file, onProgress){
  const n = (file.name || '').toLowerCase();
  if (n.endsWith('.zip')) throw Object.assign(new Error('zip'), { code: 'zip' });
  if (n.endsWith('.fit')) throw Object.assign(new Error('fit'), { code: 'fit' });
  if (n.endsWith('.gpx')) return { source: 'gpx', items: [parseGpx(await file.text(), file.name)] };
  if (n.endsWith('.tcx')) return { source: 'tcx', items: parseTcx(await file.text()) };
  if (n.endsWith('.csv')) return parseCsv(await file.text());
  if (n.endsWith('.xml')) return { source: 'apple', items: await parseAppleExport(file, onProgress) };
  throw Object.assign(new Error('format'), { code: 'format' });
}

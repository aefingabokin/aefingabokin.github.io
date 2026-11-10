/* =====================================================================
   Æfingabókin — viðmót (útgáfa 0.3, Firebase)
   startApp(Store) tekur við gagnalaginu úr store.js.
   ===================================================================== */
import { readImportFile } from './importers.js';
import { POOLS } from './pools.js';
import { PALETTES, HOME_CARDS, OPTIONAL_TABS, SCHEMA, normalize, readLocal, writeLocal, applyAppearance, prefersDark } from './settings.js';

export function startApp(Store){

/* ---------- Grunnföll ---------- */
const $ = (s, el = document) => el.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = v => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(/\s/g,'').replace(',', '.')); return isFinite(n) ? n : null; };
const nf = (n, d = 0) => { if (n == null || !isFinite(n)) return '–'; try { return new Intl.NumberFormat('is-IS', {maximumFractionDigits: d}).format(n); } catch(e) { return String(Math.round(n * 10**d) / 10**d); } };
const fmtIn = v => (v == null || v === '') ? '' : String(v).replace('.', ',');
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const today = () => ymd(new Date());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const weekStart = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const DAYS = ['sun','mán','þri','mið','fim','fös','lau'];
const DAYSFULL = ['Sunnudagur','Mánudagur','Þriðjudagur','Miðvikudagur','Fimmtudagur','Föstudagur','Laugardagur'];
const MON = ['jan.','feb.','mars','apr.','maí','júní','júlí','ágú.','sep.','okt.','nóv.','des.'];
const MONFULL = ['janúar','febrúar','mars','apríl','maí','júní','júlí','ágúst','september','október','nóvember','desember'];
const fmtDate = s => { const d = parseYmd(s); return `${DAYS[d.getDay()]} ${d.getDate()}. ${MON[d.getMonth()]}`; };
const fmtShort = s => { const d = parseYmd(s); return `${d.getDate()}/${d.getMonth()+1}`; };
const fmtClock = ms => { const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t/3600), m = Math.floor((t%3600)/60), s = t%60; return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`; };
function parseDur(v){
  if (v == null || String(v).trim() === '') return null;
  const s = String(v).trim().replace(',', '.');
  if (s.includes(':')){ const p = s.split(':').map(x => parseFloat(x) || 0);
    if (p.length === 2) return p[0] + p[1]/60; if (p.length === 3) return p[0]*60 + p[1] + p[2]/60; return null; }
  const n = parseFloat(s); return isFinite(n) ? n : null;
}
const fmtDur = min => min == null ? '' : fmtClock(Math.round(min * 60) * 1000);
const LS = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  set(k, v){ try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch(e){} }
};

/* ---------- Tegundir og æfingasafn ---------- */
/* ---------- Íþróttir ----------
   Hver íþrótt skilgreinir hvaða reitir eiga við hana. Undirtegundir (subs) geta haft sína eigin reiti, einingu og hraðamælingu.
   Reitir: distance, dur, hr, elev, runs, intensity, result, course, score, points, balls, grade, rounds, title
   Hraði (pace): km = mín/km, swim = mín/100 m, speed = km/klst, 500 = mín/500 m */
const TYPES = {
  lift:   { name: 'Lyftingar', hint: 'Eitt sett í einu', unit: null },
  run:    { name: 'Hlaup', hint: 'Vegalengd, tími og púls', unit: 'km', fields: ['distance', 'dur', 'hr'], pace: 'km' },
  walk:   { name: 'Ganga', hint: 'Göngutúr í hverfinu', unit: 'km', fields: ['distance', 'dur'], pace: 'km' },
  hike:   { name: 'Fjallganga', hint: 'Vegalengd, tími og hækkun', unit: 'km', fields: ['title', 'distance', 'dur', 'elev', 'hr'], pace: 'km',
            titleLabel: 'Fjall eða leið', titlePh: 't.d. Esjan að Steini' },
  swim:   { name: 'Sund', hint: 'Laug, metrar, gufa og pottar', unit: 'm', fields: ['pool', 'distance', 'dur'], pace: 'swim' },
  bike:   { name: 'Hjól', hint: 'Götuhjól, fjallahjól eða innanhúss', unit: 'km', fields: ['distance', 'dur', 'elev', 'hr'], pace: 'speed' },
  ski:    { name: 'Skíði', hint: 'Göngu-, svig- eða fjallaskíði', unit: 'km', subs: {
            xc:      { name: 'Gönguskíði', fields: ['distance', 'dur', 'hr'], pace: 'km' },
            alpine:  { name: 'Svigskíði', fields: ['dur', 'runs'] },
            touring: { name: 'Fjallaskíði', fields: ['distance', 'dur', 'elev'], pace: 'km' } } },
  class:  { name: 'Hóptími', hint: 'Spinning, CrossFit, HIIT og fleira', subs: {
            spin: 'Spinning', crossfit: { name: 'CrossFit', fields: ['box', 'wodline', 'pbs', 'dur', 'intensity', 'hr'] }, hiit: 'HIIT', pump: 'Body Pump', circuit: 'Hringþjálfun', zumba: 'Zumba', boxfit: 'Boxfit' },
            fields: ['dur', 'intensity', 'hr'], customSub: 'Annar tími' },
  yoga:   { name: 'Jóga og teygjur', hint: 'Jóga, pilates og liðleiki', subs: { yoga: 'Jóga', hot: 'Heitt jóga', pilates: 'Pilates', stretch: 'Teygjur', mobility: 'Liðleiki' },
            fields: ['dur'] },
  ball:   { name: 'Boltaíþróttir', hint: 'Fótbolti, körfubolti og fleira', subs: { football: 'Fótbolti', basketball: 'Körfubolti', handball: 'Handbolti', volleyball: 'Blak' },
            fields: ['dur', 'intensity', 'result'] },
  racket: { name: 'Spaðaíþróttir', hint: 'Padel, tennis, badminton', subs: { padel: 'Padel', tennis: 'Tennis', badminton: 'Badminton', squash: 'Squash', tabletennis: 'Borðtennis' },
            fields: ['dur', 'intensity', 'result'] },
  golf:   { name: 'Golf', hint: '9 eða 18 holur, eða æfingasvæðið', subs: {
            h9:    { name: '9 holur', fields: ['course', 'par', 'score', 'points', 'dur', 'distance'], pace: null },
            h18:   { name: '18 holur', fields: ['course', 'par', 'score', 'points', 'dur', 'distance'], pace: null },
            range: { name: 'Driving range', fields: ['balls', 'longest', 'dur'] },
            short: { name: 'Stutta spilið', fields: ['dur'] } }, unit: 'km' },
  row:    { name: 'Róður', hint: 'Róðravél eða kajak', subs: {
            erg:   { name: 'Róðravél', fields: ['distance', 'dur', 'hr'], unit: 'm', pace: '500' },
            kayak: { name: 'Kajak', fields: ['distance', 'dur'], unit: 'km', pace: 'km' } } },
  climb:  { name: 'Klifur', hint: 'Grjótglíma eða línuklifur', subs: { boulder: 'Grjótglíma', rope: 'Línuklifur' }, fields: ['dur', 'grade'] },
  combat: { name: 'Bardagaíþróttir', hint: 'Box, kickbox, BJJ, júdó…', subs: { box: 'Box', kickbox: 'Kickbox', bjj: 'BJJ', judo: 'Júdó', karate: 'Karate', mma: 'MMA' },
            fields: ['dur', 'rounds', 'intensity'] },
  dance:  { name: 'Dans', hint: 'Tími og álag', fields: ['dur', 'intensity'] },
  other:  { name: 'Annað', hint: 'Allt sem passar ekki annars staðar', unit: 'km', fields: ['title', 'distance', 'dur'], pace: null, titleLabel: 'Hvað var gert?', titlePh: 't.d. skautar eða sjósund' }
};
const GOOGLE_G = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
const PENCIL = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>';
const GRIP = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 8h14M5 12h14M5 16h14"/></svg>';
const MAIL = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg>';
/* Íslensk villuboð fyrir innskráningu */
function authErrorText(e){
  const c = String((e && e.code) || '');
  if (/popup-closed|cancelled-popup|user-cancelled/.test(c)) return '';
  const map = {
    'auth/email-already-in-use': 'Þetta netfang er þegar skráð. Prófaðu að skrá þig inn eða notaðu „Gleymt lykilorð?“.',
    'auth/invalid-email': 'Netfangið lítur ekki út fyrir að vera rétt.',
    'auth/weak-password': 'Lykilorðið er of veikt. Notaðu minnst 8 stafi.',
    'auth/missing-password': 'Sláðu inn lykilorð.',
    'auth/user-not-found': 'Netfang eða lykilorð er rangt.',
    'auth/wrong-password': 'Netfang eða lykilorð er rangt.',
    'auth/invalid-credential': 'Netfang eða lykilorð er rangt.',
    'auth/invalid-login-credentials': 'Netfang eða lykilorð er rangt.',
    'auth/too-many-requests': 'Of margar tilraunir. Bíddu aðeins og reyndu aftur, eða veldu „Gleymt lykilorð?“.',
    'auth/network-request-failed': 'Ekkert netsamband. Athugaðu tenginguna og reyndu aftur.',
    'auth/popup-blocked': 'Vafrinn lokaði á innskráningargluggann. Leyfðu sprettiglugga og reyndu aftur.',
    'auth/account-exists-with-different-credential': 'Þetta netfang er þegar tengt annarri innskráningarleið. Prófaðu hina leiðina.',
    'auth/unauthorized-domain': 'Þetta lén hefur ekki verið leyft í Firebase. Sjá skref 6 í README.',
    'auth/operation-not-allowed': 'Þessi innskráningarleið er ekki virk í Firebase. Sjá README.'
  };
  return map[c] || 'Það tókst ekki. Reyndu aftur.';
}
/* Tákn íþrótta (einfaldar línuteikningar, 24×24) */
const SPORT_ICONS = {
  lift:   '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  run:    '<circle cx="14.5" cy="4.5" r="1.8"/><path d="M6 12.5l3.5-3.5h4l2.5 3.5 3 1M13.5 9l-1.8 6.5 3.3 2.5V22M11.7 15.5L9 21.5"/>',
  walk:   '<circle cx="12" cy="4.2" r="1.8"/><path d="M12 8v6.5l-3 7M12 14.5l3 7M8 12.5l4-4 4 3.5"/>',
  hike:   '<path d="M2.5 20.5l6.5-11 4 6.5 2.5-3.5 6 8z"/><path d="M9 9.5l1.6 2.7"/>',
  swim:   '<circle cx="16" cy="6" r="1.8"/><path d="M5 12.5l4.5-4.5 4 2.5M2 17c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 21c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/>',
  bike:   '<circle cx="6" cy="16" r="3.8"/><circle cx="18" cy="16" r="3.8"/><path d="M6 16l4-7.5h5.5L18 16M10 8.5l3 7.5M8.5 6h3"/>',
  ski:    '<path d="M12 2.5v19M3.8 7.3l16.4 9.4M20.2 7.3L3.8 16.7M9.5 4l2.5 2 2.5-2M9.5 20l2.5-2 2.5 2"/>',
  class:  '<path d="M13.5 2L4.5 13.5h7L10.5 22l9-11.5h-7z"/>',
  yoga:   '<circle cx="12" cy="4.5" r="1.8"/><path d="M12 8v5.5M5.5 11.5l6.5 2 6.5-2M4 20c3-.8 4.6-3.5 8-3.5s5 2.7 8 3.5"/>',
  ball:   '<circle cx="12" cy="12" r="9"/><path d="M12 7.5l4 2.9-1.5 4.6h-5L8 10.4zM12 3v4.5M16 10.4l4.5-1.4M14.5 15l2.8 4M9.5 15l-2.8 4M8 10.4L3.5 9"/>',
  racket: '<ellipse cx="14" cy="9" rx="6" ry="6.5" transform="rotate(35 14 9)"/><path d="M9.7 13.8L4 19.5M3 21.5l2.5-2.5M11 6.5l6 5M12.8 4.6l5.4 4.6"/>',
  golf:   '<path d="M8 21.5V3l9.5 4L8 11"/><path d="M4 21.5h9"/>',
  row:    '<path d="M4 20L18.5 5.5M15.5 2.5l6 6-2.2 2.2-6-6zM2.5 21.5l2.2-2.2"/><path d="M2 16c3 1.8 6 1.8 9 0"/>',
  climb:  '<rect x="6" y="2.5" width="12" height="19" rx="6"/><path d="M14 7v8"/>',
  combat: '<path d="M7 11V7.5a4.5 4.5 0 0 1 4.5-4.5h2A4.5 4.5 0 0 1 18 7.5V12a5 5 0 0 1-5 5H9.5A2.5 2.5 0 0 1 7 14.5V13h4.5"/><path d="M8.5 21h9v-4"/>',
  dance:  '<path d="M9 18V5.5l11-2.5v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  other:  '<path d="M12 3l2.6 5.8 6.4.6-4.8 4.3 1.4 6.3L12 16.8 6.4 20l1.4-6.3L3 9.4l6.4-.6z"/>'
};
const sportIcon = (type, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SPORT_ICONS[type] || SPORT_ICONS.other}</svg>`;
/* Stuttur merkimiði fyrir útgáfu D: högg í golfi, annars mínútur, annars vegalengd */
function cellLabel(list){
  if (list.length === 1){ const a = list[0];
    if (a.type === 'golf' && a.score) return `${a.score}`;
    if (a.durationMin) return `${Math.round(a.durationMin)}′`;
    if (a.distance){ const u = typeCfg(a.type, a.sub).unit; return u === 'm' ? `${nf(a.distance)}m` : `${nf(a.distance, 1)}k`; }
    return ''; }
  const m = list.reduce((v, a) => v + (a.durationMin || 0), 0);
  return m ? `${Math.round(m)}′` : `${list.length}×`;
}
/* Reitur í vikuriti: fjórar útfærslur (A–D) sem notandinn velur í Stillingum → Útlit */
function weekCell(list, isToday, who, day, pid){
  if (pid) return weekCellBase(list, isToday, who, day).replace(/^<div class="/, `<button type="button" data-wday="${esc(pid)}|${day}" class="wbtn `).replace(/<\/div>$/, '</button>');
  return weekCellBase(list, isToday, who, day);
}
function weekCellBase(list, isToday, who, day){
  const st = settings.weekStyle || 'A', cls = `wc wc-${st}${isToday ? ' today' : ''}${list.length ? '' : ' none'}${list.length > 1 ? ' multi' : ''}`;
  const tip = `${who}, ${fmtDate(day)}${list.length ? ': ' + list.map(a => titleOf(a)).join(', ') : ''}`;
  if (!list.length) return `<div class="${cls}" title="${esc(tip)}"></div>`;
  const k = a => TYPES[a.type] ? a.type : 'other', items = list.slice(0, st === 'B' ? 3 : 2), more = list.length - items.length;
  const icons = (fill) => items.map(a => `<span style="${fill ? 'background' : 'color'}:${tc(k(a))}">${sportIcon(k(a), list.length > 1 && st !== 'B' ? 14 : 17)}</span>`).join('');
  const extra = more > 0 ? `<em>+${more}</em>` : '';
  if (st === 'A') return `<div class="${cls}" title="${esc(tip)}">${icons(true)}${extra}</div>`;
  if (st === 'B') return `<div class="${cls}" title="${esc(tip)}">${icons(true)}${extra}</div>`;
  if (st === 'C') return `<div class="${cls}" style="--wc:${tc(k(items[0]))}" title="${esc(tip)}">${icons(false)}${extra}</div>`;
  return `<div class="${cls}" style="--wc:${tc(k(items[0]))}" title="${esc(tip)}"><span class="ic">${icons(false)}</span><small>${esc(cellLabel(list))}</small></div>`;
}
const legendHtml = types => `<div class="legend">${types.map(k => `<span class="lg"><b style="color:${tc(k)}">${sportIcon(k, 14)}</b>${TYPES[k].name}</span>`).join('')}</div>`;
const INTENSITY = { light: 'Létt', mod: 'Miðlungs', hard: 'Erfitt' };
const subsOf = type => (TYPES[type] || {}).subs || null;
const subName = (type, sub) => { const s = subsOf(type); if (!s || !s[sub]) return null; return typeof s[sub] === 'string' ? s[sub] : s[sub].name; };
const firstSub = type => { const s = subsOf(type); return s ? Object.keys(s)[0] : null; };
function typeCfg(type, sub){
  const T = TYPES[type] || TYPES.other, s = (T.subs && sub && typeof T.subs[sub] === 'object') ? T.subs[sub] : {};
  return { name: T.name, fields: s.fields || T.fields || ['dur'], unit: s.unit || T.unit || 'km', pace: 'pace' in s ? s.pace : (T.pace || null) };
}
/* Km sem teljast í vegalengd vikunnar, stigatöflum og markmiðum */
function kmOf(s){
  if (!s || !s.distance) return 0;
  if (['run', 'walk', 'hike', 'bike'].includes(s.type)) return s.distance;
  if (s.type === 'ski' && s.sub !== 'alpine') return s.distance;
  if (s.type === 'row' && s.sub === 'kayak') return s.distance;
  return 0;
}
function titleOf(s){
  if (s.title && ['other', 'hike', 'class'].includes(s.type)) return s.title;
  if (s.type === 'swim' && !s.distance && (s.spa || []).length) return 'Pottaferð';
  const sn = subName(s.type, s.sub);
  if (s.type === 'golf') return sn ? `Golf, ${sn.toLowerCase()}` : 'Golf';
  if (isWod(s) && s.wod) return `CrossFit: ${s.wod}`;
  return sn || (TYPES[s.type] || TYPES.other).name;
}
/* Samantekt sem á við hverja íþrótt (sama fall fyrir eigin æfingar og yfirlit vina) */
function sessionParts(s){
  const cfg = typeCfg(s.type, s.sub), parts = [];
  if (s.type === 'golf'){
    if (s.score) parts.push(`${s.score} högg${s.par ? ` (${golfRel(s.score - s.par)})` : ''}`);
    if (s.points) parts.push(`${s.points} punktar`);
    if (s.balls) parts.push(`${s.balls} boltar`);
    if (s.longest) parts.push(`lengst ${nf(s.longest)} m`);
  }
  if (isWod(s) && wodResult(s)) parts.push(`${s.wodFormat === 'fortime' ? 'tími' : WOD_FORMATS[s.wodFormat] || ''} ${wodResult(s)} ${s.rx === 'scaled' ? 'Scaled' : 'Rx'}`.trim());
  if (s.distance) parts.push(`${nf(s.distance, cfg.unit === 'm' ? 0 : 2)} ${cfg.unit}`);
  if (s.durationMin) parts.push(fmtDur(s.durationMin));
  if ((s.prs || []).length) parts.push(`PB: ${s.prs.map(p => `${p.name} ${pbText(p)}`).join(', ')}`);
  if ((s.exercises || []).length && s.type !== 'lift') parts.push(`styrkur: ${s.exercises.map(e => e.name || exName(e.exId)).join(', ')}`);
  const p = paceText(s.type, s.distance, s.durationMin, s.sub); if (p) parts.push(`${p.v} ${p.l}`);
  if (s.elevation) parts.push(`hækkun ${nf(s.elevation)} m`);
  if (s.runs) parts.push(`${s.runs} ${plural(s.runs, 'ferð', 'ferðir')}`);
  if (s.rounds) parts.push(`${s.rounds} ${plural(s.rounds, 'lota', 'lotur')}`);
  if (s.grade) parts.push(`erfiðast ${s.grade}`);
  if (s.intensity && INTENSITY[s.intensity]) parts.push(INTENSITY[s.intensity].toLowerCase());
  if (s.result) parts.push(s.result);
  return parts;
}
const sportOn = k => settings.sports.includes(k);
/* Golf: árangur miðað við par, t.d. +18, á pari eða −2 */
const golfRel = r => r === 0 ? 'á pari' : r > 0 ? `+${r}` : `−${Math.abs(r)}`;
const pbPill = s => s && s.pb ? `<span class="pbpill">${s.pb === 'long' ? 'Lengsti bolti!' : s.pb === 'cf' ? 'PB!' : s.pb === 'wod' ? 'WOD-met!' : 'Met!'}</span>` : '';
const tc = t => `var(--c-${t})`;
/* Gufa og pottar. Hver ferð getur haft margar lotur, t.d. sauna, kalt, sauna, kalt. */
const SPA = {
  hot:      { name: 'Heiti potturinn', short: 'Heitur pottur', color: '#14A39A', def: '15' },
  steam:    { name: 'Gufa',            short: 'Gufa',          color: '#8DA2B8', def: '10' },
  sauna:    { name: 'Sauna',           short: 'Sauna',         color: '#C9772B', def: '12' },
  infrared: { name: 'Infrarauð sauna', short: 'Infrarauð',     color: '#C2410C', def: '20' },
  cold:     { name: 'Kaldi potturinn', short: 'Kalt',          color: '#3BA7E0', def: '2' }
};
const HEAT = ['steam', 'sauna', 'infrared'];
const spaTime = m => m == null ? '' : (Math.abs(m - Math.round(m)) > 0.01 ? `${fmtDur(m)} mín` : `${Math.round(m)} mín`);
/* Samtölur eftir tegund, í þeirri röð sem fyrst var farið í */
function spaTotals(list){
  const out = [];
  (list || []).forEach(x => { if (!SPA[x.kind] || !(x.min > 0)) return; let t = out.find(o => o.kind === x.kind);
    if (!t){ t = { kind: x.kind, min: 0, n: 0 }; out.push(t); } t.min = Math.round((t.min + x.min) * 100) / 100; t.n++; });
  return out;
}
const spaPills = totals => (totals && totals.length) ? `<div class="spa">${totals.map(t => `<span class="sp"><i style="background:${SPA[t.kind].color}"></i>${SPA[t.kind].short} ${spaTime(t.min)}${t.n > 1 ? ` <small>${t.n}×</small>` : ''}</span>`).join('')}</div>` : '';
/* Álag hlaups */
const EFFORT = { easy: {name: 'Rólegt', c: 'var(--c-walk)'}, mod: {name: 'Miðlungs', c: 'var(--c-bike)'}, hard: {name: 'Hratt', c: 'var(--c-run)'} };
const effPill = lvl => EFFORT[lvl] ? `<span class="eff" style="--ec:${EFFORT[lvl].c}">${EFFORT[lvl].name}</span>` : '';
const effortOf = s => (s && s.type === 'run') ? (s.effort || s.effortAuto || null) : null;
/* Æfingasafnið. Heitin á fyrstu 31 æfingunum mega ekki breytast, því auðkennið er dregið af heitinu.
   Ensku heitin á eftir | eru aðeins notuð í leit. */
const LIB = [
  ['Brjóst', [
    'Bekkpressa|bench press', 'Hallandi bekkpressa|incline bench press', 'Handlóðapressa|dumbbell press db bench',
    'Brjóstpressa í vél|chest press machine', 'Flugur (fly)|fly flyes dumbbell fly', 'Hallandi handlóðapressa|incline dumbbell press db',
    'Niðurhallandi bekkpressa|decline bench press', 'Kapalkross|cable crossover cable fly', 'Flugur í vél (pec deck)|pec deck machine fly',
    'Armbeygjur|push up pushups']],
  ['Bak', [
    'Niðurtog (pull down)|lat pulldown', 'Kapalróður|seated cable row', 'Handlóðaróður|dumbbell row one arm row',
    'Upphífingar|pull up pullups', 'Réttstöðulyfta|deadlift', 'Bakfettur|back extension hyperextension',
    'Stangaróður|barbell row bent over row', 'T-stangarróður|t-bar row', 'Róður í vél|machine row', 'Hökulyftur (chin-up)|chin up chinups',
    'Upphífingar með aðstoð|assisted pull up', 'Niðurtog, mjótt grip|close grip pulldown', 'Beinarma niðurtog|straight arm pulldown',
    'Axlayppingar (shrugs)|shrug shrugs']],
  ['Fætur', [
    'Fótapressa|leg press', 'Hnébeygja|squat back squat', 'Fótarétta|leg extension', 'Fótakreppa|leg curl lying leg curl',
    'Framstig|lunge lunges walking lunge', 'Kálfalyfta|calf raise standing', 'Rúmensk réttstöðulyfta (RDL)|romanian deadlift rdl',
    'Hack squat|hack squat', 'Framhnébeygja|front squat', 'Bikarhnébeygja (goblet)|goblet squat', 'Búlgarskt framstig|bulgarian split squat',
    'Hnébeygja í Smith-vél|smith machine squat', 'Uppstig (step-up)|step up', 'Fótakreppa sitjandi|seated leg curl',
    'Kálfalyfta sitjandi|seated calf raise', 'Súmó-réttstöðulyfta|sumo deadlift']],
  ['Rass og mjaðmir', [
    'Mjaðmalyfta (hip thrust)|hip thrust', 'Mjaðmabrú (glute bridge)|glute bridge', 'Mjaðmaútfærsla í vél|hip abduction machine',
    'Mjaðmaaðfærsla í vél|hip adduction machine', 'Rassspyrna í kapli|cable kickback glute kickback']],
  ['Axlir', [
    'Axlapressa|overhead press ohp shoulder press military press', 'Hliðarlyftur|lateral raise side raise', 'Face pull|face pull',
    'Axlarpressa í vél|shoulder press machine', 'Handlóðaaxlapressa|dumbbell shoulder press', 'Arnold-pressa|arnold press',
    'Framlyftur|front raise', 'Afturaxlaflugur|rear delt fly reverse fly', 'Uppréttur róður|upright row', 'Hliðarlyftur í kapli|cable lateral raise']],
  ['Hendur', [
    'Curl (tvíhöfði)|bicep curl dumbbell curl', 'Hammer curl|hammer curl', 'Þríhöfðapressa (pushdown)|triceps pushdown',
    'Dýfur|dips', 'Franskar pressur|skull crusher lying triceps extension', 'Stangarkrulla|barbell curl ez bar curl',
    'Preacher curl|preacher curl', 'Kapalkrulla|cable curl', 'Einbeitingarkrulla|concentration curl',
    'Þríhöfðalenging yfir höfuð|overhead triceps extension', 'Bekkpressa, mjótt grip|close grip bench press',
    'Þríhöfðaspyrna (kickback)|triceps kickback', 'Úlnliðskreppur|wrist curl forearm']],
  ['Kviður', [
    'Kviðkreppur|crunch crunches sit up', 'Fótalyftur|leg raise', 'Kapalkreppur|cable crunch', 'Rússneskur snúningur|russian twist',
    'Kviðhjól|ab wheel rollout', 'Hangandi fótalyftur|hanging leg raise', 'Kviðkreppur í vél|ab crunch machine',
    'Hliðarbeygjur|side bend oblique', 'Pallof-pressa|pallof press']],
  ['Alhliða', [
    'Ketilbjöllusveifla|kettlebell swing kb', 'Frívending (power clean)|power clean', 'Thruster|thruster', 'Burpees|burpee burpees',
    'Snörun (snatch)|snatch power snatch squat snatch', 'Jafnhending (clean & jerk)|clean and jerk c&j', 'Clean|squat clean hang clean', 'Push press|push press',
    'Push jerk|push jerk split jerk', 'Overhead squat|overhead squat ohs', 'Wall ball|wall balls', 'Kassastökk (box jump)|box jump']]
].flatMap(([g, list]) => list.map(entry => { const [name, alias] = entry.split('|');
  return {id: 'x_' + name.toLowerCase().replace(/[^a-z0-9áðéíóúýþæö]+/g,'-'), name, g, alias: alias || ''}; }));
/* Leit án kommu og íslenskra sérstafa: „rettstodu“ finnur Réttstöðulyftu */
const fold = t => String(t || '').toLowerCase().replace(/þ/g, 'th').replace(/ð/g, 'd').replace(/æ/g, 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/* ---------- Ástand ---------- */
let gate = 'loading';           // config | login | loading | onboard | error | app
let gateMsg = '';
let me = null, hid = null, unsub = null, household = null, pendingRender = false;
let joinTarget = new URLSearchParams(location.search).get('join');
let state = { profiles: [], active: null, customExercises: [], sessions: [] };
let draft = null;
let ui = { tab: 'home', weekOffset: 0, histFilter: 'all', histBoth: false, progMode: 'goals', progEx: null, progType: 'run', bodyMetric: null, bodyRange: '3m', exScope: 'mine', exFmt: 'is', fMode: 'week', fWeekOffset: 0, boardMetric: 'sessions' };
let settings = readLocal(), prevTab = 'home', setSaveT = null;
let newSignup = false;
let authMode = 'start', authErr = '', authInfo = '', authBusy = false, authShowPw = false, authEmail = '', pendingName = '';
let about = null, measurements = [], measUnsub = null;
let friendParam = ((new URLSearchParams(location.search).get('vinur')) || '').toUpperCase() || null;
let social = { incoming: [], outgoing: [], friends: [] };
let shared = {}, people = {}, challenges = [], myPerson = null;
let socialUnsub = null, chUnsub = null, sharedUnsubs = {}, ownSharedLoaded = false, socialStarted = false;

const draftKey = () => 'aefingabokin.draft.' + (me ? me.uid : 'x');
const activeKey = () => 'aefingabokin.active.' + (me ? me.uid : 'x');
const saveDraft = () => LS.set(draftKey(), draft ? JSON.stringify(draft) : null);
const loadDraft = () => { try { return JSON.parse(LS.get(draftKey()) || 'null'); } catch(e){ return null; } };
const setActive = id => { state.active = id; LS.set(activeKey(), id); };
const allEx = () => LIB.concat(state.customExercises);
const exName = id => (allEx().find(e => e.id === id) || {}).name || 'Æfing';
const pname = id => ((state.profiles.find(p => p.id === id) || {}).name || '').trim() || (me && id === me.uid ? 'Ég' : 'Maki');
const mySessions = (pid = state.active) => state.sessions.filter(s => s.profileId === pid);
const byDateDesc = (a, b) => (b.date + (b.createdAt||'')).localeCompare(a.date + (a.createdAt||''));
const fail = what => e => { console.error(e); toast(`${what} tókst ekki${navigator.onLine === false ? ', vistast þegar net kemur' : ''}`); };
const inviteLink = () => `${location.origin}${location.pathname}?join=${hid}`;

/* ---------- Útreikningar ---------- */
const setVol = st => (num(st.kg) || 0) * (num(st.reps) || 0);
const e1rm = (kg, reps) => (!kg || !reps) ? 0 : (reps === 1 ? kg : kg * (1 + reps / 30));
const sessionVolume = s => (s.exercises || []).reduce((a, e) => a + e.sets.reduce((b, st) => b + setVol(st), 0), 0);
const setCount = s => (s.exercises || []).reduce((a, e) => a + e.sets.filter(st => num(st.reps)).length, 0);
const setTxt = st => `${nf(num(st.kg), 1)} kg × ${num(st.reps) ?? 0}`;
function paceText(type, dist, min, sub){
  if (!dist || !min) return null;
  const p = typeCfg(type, sub).pace;
  if (p === 'swim') return {v: fmtDur(min / (dist / 100)), l: 'mín / 100 m'};
  if (p === 'speed') return {v: nf(dist / (min / 60), 1), l: 'km / klst'};
  if (p === '500') return {v: fmtDur(min / (dist / 500)), l: 'mín / 500 m'};
  if (p === 'km') return {v: fmtDur(min / dist), l: 'mín / km'};
  return null;
}
function summary(s){
  if (s.type === 'lift'){
    const vol = sessionVolume(s);
    if (!(s.exercises || []).length) return { title: 'Lyftingar', sub: s.durationMin ? fmtDur(s.durationMin) : 'Skráð', extra: s.source ? `Úr ${SOURCE_NAMES[s.source] || 'úri'}. Opnaðu til að bæta við settum.` : '' };
    return { title: s.title || 'Lyftingar', sub: `${(s.exercises || []).length} ${plural((s.exercises || []).length, 'æfing', 'æfingar')}, ${setCount(s)} sett${vol ? `, ${nf(vol)} kg` : ''}`,
      extra: (s.exercises || []).slice(0, 3).map(e => e.name || exName(e.exId)).join(', ') };
  }
  const parts = sessionParts(s), spaOnly = s.type === 'swim' && !s.distance && (s.spa || []).length;
  const extra = [s.type === 'golf' && s.course ? s.course : '', s.pool || '', s.box || '', isWod(s) && s.wodDesc ? s.wodDesc : '', s.source ? `Úr ${SOURCE_NAMES[s.source] || 'úri'}` : '', s.notes || ''].filter(Boolean).join('. ');
  return { title: titleOf(s), sub: parts.join(', ') || (spaOnly ? 'Gufa og pottar' : 'Skráð'), extra };
}
function lastPerformance(exId, excludeId, pid){
  const list = mySessions(pid).filter(s => (s.exercises || []).length && s.id !== excludeId).sort(byDateDesc);
  for (const s of list){
    const e = (s.exercises || []).find(x => x.exId === exId);
    if (e && e.sets.some(st => num(st.reps))) return {date: s.date, sets: e.sets.filter(st => num(st.reps))};
  }
  return null;
}
const lastSetsOf = ex => (lastPerformance(ex.exId, draft && draft.id, draft && draft.profileId) || {sets: []}).sets;
function suggestion(ex, idx){
  const last = lastSetsOf(ex), i = idx ?? ex.sets.length;
  const s = last[i] || ex.sets[i - 1] || last[last.length - 1];
  return s ? {kg: fmtIn(s.kg), reps: String(s.reps ?? '')} : {kg: '', reps: ''};
}
function compare(st, prev){
  if (!prev) return null;
  const k = num(st.kg) || 0, r = num(st.reps) || 0, pk = num(prev.kg) || 0, pr = num(prev.reps) || 0;
  if (k > pk) return {t: `+${nf(k - pk, 1)} kg`, up: true};
  if (k === pk && r > pr) return {t: `+${r - pr} reps`, up: true};
  if (k === pk && r === pr) return {t: 'Sama', up: false};
  if (k < pk) return {t: `${nf(k - pk, 1)} kg`, up: false};
  return {t: `${r - pr} reps`, up: false};
}
/* Metur sjálfkrafa hvort hlaup var rólegt.
   1) Ef meðalpúls er skráður og hámarkspúls stilltur: undir 77% = rólegt, 77–87% = miðlungs, yfir = hratt.
   2) Annars borið saman við eigin hlaup síðustu 120 daga: miðað er við hraðari fjórðunginn.
      10% hægara eða meira = rólegt, innan við 3% = hratt. Þarf minnst 4 fyrri hlaup. */
function classifyRun(r, pool){
  if (!r || r.type !== 'run') return null;
  if (r.avgHr && maxHrOf() && me && r.profileId === me.uid){
    const p = r.avgHr / maxHrOf();
    return p < 0.77 ? 'easy' : p < 0.87 ? 'mod' : 'hard';
  }
  if (!r.distance || !r.durationMin) return null;
  const from = ymd(addDays(parseYmd(r.date), -120));
  const paces = pool.filter(x => x.type === 'run' && x.id !== r.id && x.distance >= 1 && x.durationMin && x.date >= from && x.date <= r.date)
    .map(x => x.durationMin / x.distance).filter(v => v > 2.5 && v < 15).sort((a, b) => a - b);
  if (paces.length < 4) return null;
  const ref = paces[Math.floor((paces.length - 1) * 0.25)], q = (r.durationMin / r.distance) / ref;
  return q >= 1.10 ? 'easy' : q <= 1.03 ? 'hard' : 'mod';
}
const runPool = pid => state.sessions.filter(x => x.profileId === pid && x.type === 'run');

function liftHistory(exId, pid = state.active){
  return mySessions(pid).filter(s => (s.exercises || []).length).map(s => {
    const e = (s.exercises||[]).find(x => x.exId === exId); if (!e) return null;
    const sets = e.sets.filter(st => num(st.reps)); if (!sets.length) return null;
    return {date: s.date, sets, best: Math.max(...sets.map(st => num(st.kg) || 0)),
      rm: Math.max(...sets.map(st => e1rm(num(st.kg)||0, num(st.reps)||0))),
      vol: sets.reduce((a, st) => a + setVol(st), 0), maxReps: Math.max(...sets.map(st => num(st.reps) || 0))};
  }).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));
}

/* ---------- Teikning ---------- */
const view = $('#view');
const ICON = {
  x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  l: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>',
  r: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>',
  up: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>'
};
function render(){
  (window.requestAnimationFrame || setTimeout)(() => { if (typeof measureTabs === 'function') measureTabs(); });
  pendingRender = false;
  document.body.dataset.gate = gate;
  if (gate !== 'app') return renderGate();
  if (settings.tabsHidden.includes(ui.tab)) ui.tab = 'home';
  const who = $('#who');
  who.hidden = ui.tab === 'settings';
  $('#settingsBtn').hidden = ui.tab === 'settings';
  document.querySelectorAll('.tabs button').forEach(b => { b.hidden = settings.tabsHidden.includes(b.dataset.tab); });
  who.innerHTML = state.profiles.map(p => `<button data-pid="${p.id}" aria-pressed="${p.id === state.active}">${avatar(p.id, 28, pname(p.id))}${esc(pname(p.id))}</button>`).join('');
  document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.tab === ui.tab ? 'page' : 'false'));
  if (ui.tab === 'home') renderHome();
  else if (ui.tab === 'log') renderLog();
  else if (ui.tab === 'history') renderHistory();
  else if (ui.tab === 'friends') renderFriends();
  else if (ui.tab === 'settings') renderSettings();
  else renderProgress();
  tick();
}
/* Ekki teikna upp á nýtt meðan verið er að skrifa í reit (gögn geta borist frá hinu tækinu) */
function softRender(){
  const a = document.activeElement;
  if (a && view.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)){ pendingRender = true; return; }
  render();
}

function renderGate(){
  if (gate === 'config'){
    view.innerHTML = `<div class="gate glass"><h1>Æfingabókin</h1><p>Firebase er ekki tengt ennþá. Settu stillingarnar úr Firebase-verkefninu í <code>js/firebase-config.js</code>, eins og lýst er í README.</p></div>`;
  } else if (gate === 'login'){
    const invite = joinTarget ? 'Þér hefur verið boðið að æfa með maka. Búðu til aðgang eða skráðu þig inn til að halda áfram.'
      : friendParam ? 'Vinur bauð þér í Æfingabókina. Búðu til aðgang eða skráðu þig inn til að tengjast.' : '';
    const err = authErr ? `<div class="autherr" role="alert">${esc(authErr)}</div>` : '';
    const info = authInfo ? `<div class="authinfo" role="status">${esc(authInfo)}</div>` : '';
    const googleBtn = label => `<button class="gbtn" data-act="signin" ${authBusy ? 'disabled' : ''}>${GOOGLE_G}<span>${label}</span></button>`;
    if (authMode === 'start'){
      view.innerHTML = `<div class="welcome">
        <div class="wlogo" aria-hidden="true">${sportIcon('lift', 34)}</div>
        <h1 class="wtitle">Æfingabókin</h1>
        <p class="wsub">Skráðu æfingarnar, fylgstu með framförum og æfðu með þínu fólki.</p>
        ${invite ? `<div class="authinfo">${esc(invite)}</div>` : ''}
        <ul class="wfeat">
          <li><span style="color:var(--c-lift)">${sportIcon('lift', 20)}</span><span><b>Allar æfingar á einum stað</b>Lyftingar, hlaup, sund, golf og fleira, með því sem þú tókst síðast.</span></li>
          <li><span style="color:var(--c-walk)">${TROPHY}</span><span><b>Markmið og framfarir</b>Settu þér markmið og sjáðu þróunina í línuritum.</span></li>
          <li><span style="color:var(--c-run)">${HAND}</span><span><b>Með maka og vinum</b>Deildu því sem þú vilt, hrósaðu og kepptu í áskorunum.</span></li>
        </ul>
        ${err}
        <div class="wbtns">
          ${googleBtn('Halda áfram með Google')}
          <button class="ebtn" data-act="authmode" data-m="signup">${MAIL}<span>Búa til aðgang með netfangi</span></button>
        </div>
        <p class="wlink">Ertu þegar með aðgang? <button class="linkbtn" data-act="authmode" data-m="signin">Skrá inn</button></p>
        ${installCard('welcome')}
        <p class="tiny wpriv">${LOCK}<span>Gögnin þín eru aðeins sýnileg þér og þeim sem þú velur að deila með.</span></p>
      </div>`;
      return;
    }
    if (authMode === 'reset'){
      view.innerHTML = `<div class="gate glass authcard">
        <button class="linkbtn back" data-act="authmode" data-m="signin">${ICON.l}Til baka</button>
        <h1>Gleymt lykilorð</h1>
        <p class="muted">Sláðu inn netfangið þitt og við sendum þér hlekk til að velja nýtt lykilorð.</p>
        <form id="authform" data-mode="reset" novalidate>
          <div class="ff"><label for="au_email">Netfang</label><input class="in" id="au_email" type="email" autocomplete="email" inputmode="email" value="${esc(authEmail)}" required></div>
          ${err}${info}
          <button class="cta" type="submit" ${authBusy ? 'disabled' : ''}>${authBusy ? 'Sendi…' : 'Senda hlekk'}</button>
        </form></div>`;
      return;
    }
    const up = authMode === 'signup';
    view.innerHTML = `<div class="gate glass authcard">
      <button class="linkbtn back" data-act="authmode" data-m="start">${ICON.l}Til baka</button>
      <h1>${up ? 'Búa til aðgang' : 'Skrá inn'}</h1>
      <div class="seg glass" role="tablist" style="margin:4px 0 6px">
        <button role="tab" data-act="authmode" data-m="signup" aria-pressed="${up}" aria-selected="${up}">Nýr aðgangur</button>
        <button role="tab" data-act="authmode" data-m="signin" aria-pressed="${!up}" aria-selected="${!up}">Innskráning</button></div>
      <form id="authform" data-mode="${authMode}" novalidate>
        ${up ? `<div class="ff"><label for="au_name">Nafn</label><input class="in" id="au_name" autocomplete="name" value="${esc(pendingName)}" placeholder="t.d. Aron Jónsson" required></div>` : ''}
        <div class="ff"><label for="au_email">Netfang</label><input class="in" id="au_email" type="email" autocomplete="email" inputmode="email" value="${esc(authEmail)}" required></div>
        <div class="ff"><label for="au_pw">Lykilorð</label><div class="pwwrap">
          <input class="in" id="au_pw" type="${authShowPw ? 'text' : 'password'}" autocomplete="${up ? 'new-password' : 'current-password'}" ${up ? 'minlength="8"' : ''} required>
          <button type="button" class="linkbtn pwtoggle" data-act="pwtoggle" aria-label="${authShowPw ? 'Fela lykilorð' : 'Sýna lykilorð'}">${authShowPw ? 'Fela' : 'Sýna'}</button></div>
          ${up ? `<div class="tiny" style="margin-top:6px">Minnst 8 stafir.</div>` : ''}</div>
        ${err}${info}
        <button class="cta" type="submit" ${authBusy ? 'disabled' : ''}>${authBusy ? 'Augnablik…' : up ? 'Búa til aðgang' : 'Skrá inn'}</button>
      </form>
      ${up ? '' : `<p class="wlink" style="margin:12px 0 0"><button class="linkbtn" data-act="authmode" data-m="reset">Gleymt lykilorð?</button></p>`}
      <div class="ordiv"><span>eða</span></div>
      ${googleBtn(up ? 'Búa til aðgang með Google' : 'Skrá inn með Google')}
    </div>`;
  } else if (gate === 'onboard'){
    const first = ((me && me.name) || pendingName || '').split(' ')[0];
    view.innerHTML = `<div class="gate glass"><h1>${joinTarget ? 'Ganga í heimilið' : 'Velkomin'}</h1>
      <label class="f" for="myname">Nafnið þitt í appinu</label><input class="in" id="myname" value="${esc(first)}" autocomplete="given-name">
      ${joinTarget
        ? `<button class="cta" data-act="join">Ganga í heimilið</button>`
        : `<button class="cta" data-act="create">Byrja</button>
           <p class="tiny" style="margin-top:12px">Þetta býr til þitt svæði í appinu. Maki getur bæst við seinna með boðshlekk. Ef makinn þinn er þegar byrjaður, biddu um boðshlekkinn og opnaðu hann í staðinn.</p>`}
      <button class="btn ghost block" style="margin-top:10px" data-act="signout">Skrá út</button></div>`;
  } else if (gate === 'sports'){
    view.innerHTML = `<div class="gate glass" style="margin-top:6vh"><div class="eyebrow" style="margin:0">Skref 1 af 2</div><h1>Hvaða íþróttir stundar þú?</h1>
      <p class="muted">Þær birtast sem flísar þegar þú skráir æfingu. Hinar eru alltaf aðgengilegar undir „Fleiri íþróttir“ og þú getur breytt þessu í Stillingum.</p>
      <div class="sportpick plain">${Object.keys(TYPES).map(k => `<button type="button" class="spick" data-act="sportpick" data-k="${k}" aria-pressed="${sportOn(k)}">
        <b>${TYPES[k].name}</b><span class="ck" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg></span></button>`).join('')}</div>
      <button class="cta" data-act="sportsnext">Áfram</button></div>`;
  } else if (gate === 'about'){
    view.innerHTML = `<div class="gate glass" style="margin-top:6vh"><div class="eyebrow" style="margin:0">Skref 2 af 2</div><h1>Um þig</h1>
      <p class="muted">Allt valfrjálst. Með þessu getur appið reiknað BMI, áætlað hámarkspúls og sýnt þér framþróun.</p>
      ${privacyNote()}${aboutFields(null, true)}
      <button class="cta" data-act="aboutonboard">Vista og byrja</button>
      <button class="btn ghost block" style="margin-top:8px" data-act="aboutskip">Sleppa í bili</button>
      <p class="tiny" style="text-align:center">Þú getur alltaf breytt þessu í Stillingum eða undir Framfarir.</p></div>`;
  } else if (gate === 'error'){
    view.innerHTML = `<div class="gate glass"><h1>Eitthvað fór úrskeiðis</h1><p>${esc(gateMsg)}</p>
      <button class="cta" data-act="reload">Reyna aftur</button><button class="btn ghost block" style="margin-top:10px" data-act="signout">Skrá út</button></div>`;
  } else {
    view.innerHTML = `<div class="gate"><p class="muted" style="text-align:center">Hleð…</p></div>`;
  }
}

/* Vikan */
function renderHome(){
  const now = new Date(), ws = addDays(weekStart(now), ui.weekOffset * 7), we = addDays(ws, 6);
  const days = [...Array(7)].map((_, i) => ymd(addDays(ws, i))), t = today();
  const title = ui.weekOffset === 0 ? (state.profiles.length > 1 ? 'Vikan okkar' : 'Vikan') : `${ws.getDate()}. ${MON[ws.getMonth()]} – ${we.getDate()}. ${MON[we.getMonth()]}`;
  const rows = state.profiles.map(p => `<button class="wname" data-profile="${p.id}">${avatar(p.id, 22, pname(p.id))}<span>${esc(pname(p.id))}</span></button>` + days.map(d => {
    const ss = state.sessions.filter(s => s.profileId === p.id && s.date === d);
    return weekCell(ss, d === t, pname(p.id), d, p.id);
  }).join('')).join('');
  const weekSess = mySessions().filter(s => s.date >= days[0] && s.date <= days[6]);
  const bothCount = state.sessions.filter(s => s.date >= days[0] && s.date <= days[6]).length;
  const km = weekSess.reduce((a, s) => a + kmOf(s), 0);
  const swimM = weekSess.filter(s => s.type === 'swim').reduce((a, s) => a + (s.distance || 0), 0);
  const vol = weekSess.reduce((a, s) => a + sessionVolume(s), 0);
  const mins = weekSess.reduce((a, s) => a + (s.durationMin || 0), 0);
  const recent = mySessions().sort(byDateDesc).slice(0, 5);
  const used = [...new Set(state.sessions.map(s => s.type))].filter(k => TYPES[k]);
  const counts = {};
  mySessions().forEach(s => (s.exercises||[]).forEach(e => counts[e.exId] = (counts[e.exId]||0) + 1));
  /* Met birtast fyrst þegar æfingin hefur verið tekin a.m.k. fjórum sinnum, svo fyrstu skráningar verði ekki allar „met“ */
  const prs = Object.keys(counts).filter(id => counts[id] >= PR_MIN).sort((a, b) => counts[b] - counts[a]).slice(0, 4).map(id => {
    const h = liftHistory(id); if (!h.length) return null; return {id, best: h.reduce((m, x) => x.best > m.best ? x : m, h[0])};
  }).filter(Boolean);

  const parts = {
    week: `<section class="glass week">
      <div class="week-head"><b>${bothCount} ${state.profiles.length > 1 ? 'æfingar hjá ykkur' : 'æfingar'}</b>
        <div class="navbtns"><button data-act="wprev" aria-label="Fyrri vika">${ICON.l}</button><button data-act="wnext" aria-label="Næsta vika" ${ui.weekOffset >= 0 ? 'disabled' : ''}>${ICON.r}</button></div></div>
      <div class="week-grid"><div></div>${days.map(d => { const x = parseYmd(d); return `<div class="wd ${d === t ? 'today' : ''}">${DAYS[x.getDay()]}<b>${x.getDate()}</b></div>`; }).join('')}${rows}</div>
      ${legendHtml(used.length ? used : Object.keys(TYPES).filter(k => sportOn(k)))}
    </section>`,
    stats: `<div class="sech"><b>${state.active === me.uid ? 'Vikan þín í tölum' : `Vikan hjá ${esc(pname(state.active))} í tölum`}</b>
      <span class="tiny">${DAYS[ws.getDay()]} ${ws.getDate()}. ${MON[ws.getMonth()]} – ${DAYS[we.getDay()]} ${we.getDate()}. ${MON[we.getMonth()]}${ui.weekOffset === 0 ? ', það sem af er' : ''}</span></div>
    <div class="stats">
      <div class="stat glass"><div class="l">Æfingar</div><div class="v">${weekSess.length}</div></div>
      <div class="stat glass"><div class="l">Vegalengd${swimM ? `, + ${nf(swimM)} m sund` : ''}</div><div class="v">${nf(km, 1)} <small>km</small></div></div>
      <div class="stat glass"><div class="l">Lyft</div><div class="v">${vol >= 10000 ? `${nf(vol/1000, 1)} <small>tonn</small>` : `${nf(vol)} <small>kg</small>`}</div></div>
      <div class="stat glass"><div class="l">Tími</div><div class="v">${nf(mins)} <small>mín</small></div></div>
    </div>`,
    kudos: installCard('home') + commentCard() + kudosCard(),
    goals: state.active === me.uid ? homeGoalsCard() : '',
    recent: `<h2>Síðustu æfingar</h2>
    ${recent.length ? `<ul class="list glass">${recent.map(itemHtml).join('')}</ul>` : `<div class="glass empty">Ekkert skráð ennþá. Fyrsta æfingin birtist hér um leið og hún er vistuð.</div>`}`,
    prs: prs.length ? `<h2>Þyngstu settin</h2><div class="prs">${prs.map(p => `<div class="pr glass"><div class="n">${esc(exName(p.id))}</div><div class="k">${nf(p.best.best, 1)} <small>kg</small></div><div class="tiny">${fmtDate(p.best.date)}</div></div>`).join('')}</div>` : ''
  };
  /* Röð og sýnileiki spjalda kemur úr stillingum */
  /* Skráð er með hnappinum fyrir miðju í flipastikunni, svo enginn sér hnappur á forsíðunni */
  let html = '';
  settings.homeCards.filter(id => !settings.homeHidden.includes(id)).forEach(id => {
    html += parts[id] || '';
  });
  view.innerHTML = `
    <div class="eyebrow">${DAYSFULL[now.getDay()]} ${now.getDate()}. ${MONFULL[now.getMonth()]}</div>
    <h1>${title}</h1>
    ${state.profiles.length < 2 ? `<div class="glass" style="padding:16px;margin-bottom:12px"><b>Bjóddu maka að vera með.</b>
      <p class="muted" style="margin:4px 0 10px">Makinn sér allt og getur skráð fyrir ykkur bæði. Vinum bætirðu við í Vinir-flipanum.</p>
      <button class="btn primary" data-act="invite">Senda boðshlekk</button></div>` : ''}
    ${html}`;
}
function kudosCard(){
  if (state.active !== me.uid) return '';
  const got = receivedKudos(7); if (!got.length) return '';
  const names = [...new Set(got.map(g => kName(g.v)))];
  const who = names.length > 2 ? `${names.slice(0, 2).join(', ')} og fleiri` : names.join(' og ');
  const emo = [...new Set(got.map(g => REACTS[kReact(g.v)].e))].slice(0, 4).join('');
  return `<button class="glass kcard" data-act="kudosopen"><span class="kemo">${emo}</span><span><b>${esc(who)}</b> ${got.length === 1 ? `hrósaði æfingunni þinni frá ${fmtDate(got[0].date)}` : `gáfu þér ${got.length} hrós í vikunni`}<span class="tiny" style="display:block">Ýttu til að sjá fyrir hvað</span></span>${ICON.r}</button>`;
}
function itemHtml(s){
  const m = summary(s);
  return `<li><button class="item" data-edit="${esc(s.id)}"><span class="bar" style="background:${tc(TYPES[s.type] ? s.type : 'other')}"></span>
    <span><div class="t">${esc(m.title)}${effPill(effortOf(s))}${pbPill(s)}</div><div class="s">${esc(m.sub)}</div>${spaPills(spaTotals(s.spa))}${m.extra ? `<div class="tiny">${esc(m.extra)}</div>` : ''}</span>
    <span class="d"><span class="edhint" aria-hidden="true">${PENCIL}</span>${fmtDate(s.date)}${ui.histBoth && ui.tab === 'history' ? `<br>${esc(pname(s.profileId))}` : ''}${(() => { const b = kudosBadge(kudosOf(s.profileId, s.id)); return b ? `<br>${b}` : ''; })()}</span></button></li>`;
}

/* Skrá */
function renderLog(){
  if (!draft){
    const mine = Object.keys(TYPES).filter(k => sportOn(k)), rest = Object.keys(TYPES).filter(k => !sportOn(k));
    view.innerHTML = `<div class="eyebrow">Skráð á ${esc(pname(state.active))}</div><h1>Hvað á að gera?</h1>
      ${state.active === me.uid ? `<div class="watchrow glass"><button class="watchbtn" data-act="importopen"><span class="wic">${WATCH}</span>
        <span><b>Sækja æfingar úr úri</b><span class="tiny">Samsung, Garmin, Strava og fleira</span></span></button>
        <button class="ibtn" data-act="importhelp" aria-label="Leiðbeiningar fyrir hvert úr">i</button></div>` : ''}
      <div class="types">${mine.map(k => { const T = TYPES[k]; return `<button class="type glass" style="--tc:${tc(k)}" data-newtype="${k}"><i></i><b>${T.name}</b><span>${T.hint}</span></button>`; }).join('')}</div>
      ${rest.length ? `<details class="more"${ui.moreOpen ? ' open' : ''}><summary>Fleiri íþróttir</summary><div class="opts" style="padding:8px 0 0">${rest.map(k => `<button class="chip spachip" data-newtype="${k}"><i style="background:${tc(k)}"></i>${TYPES[k].name}</button>`).join('')}</div>
        <p class="tiny">Veldu í Stillingum hvaða íþróttir birtast sem flísar.</p></details>` : ''}`;
    return;
  }
  draft.type === 'lift' ? renderLift() : renderCardio();
}
const isNewDraft = () => !state.sessions.some(s => s.id === draft.id);
function edTop(){
  return `<div class="ed-top">
    <button class="roundbtn glass" data-act="cancel" aria-label="${isNewDraft() ? 'Hætta við' : 'Loka'}">${ICON.x}</button>
    ${draft.startedAt ? `<span class="timer" data-timer="session"></span>` : `<span class="timer">${fmtDate(draft.date)}</span>`}
    <button class="btn primary" data-act="savelog">${draft.type === 'lift' ? 'Klára' : 'Vista'}</button></div>`;
}
function renderLift(){
  const exs = draft.exercises;
  if (draft.cur >= exs.length) draft.cur = Math.max(0, exs.length - 1);
  const ex = exs[draft.cur];
  let body;
  if (!ex){
    body = `<div class="glass" style="padding:22px;text-align:center;margin-top:12px"><b>Veldu fyrstu æfinguna</b><p class="muted" style="margin:6px 0 14px">Þú sérð hvað þú tókst síðast í hverju setti.</p>
      <button class="btn primary" data-act="pickex">Velja æfingu</button></div>`;
  } else {
    const last = lastSetsOf(ex), lp = lastPerformance(ex.exId, draft.id, draft.profileId);
    const editing = draft.editSet != null, si = editing ? draft.editSet : ex.sets.length;
    const prevSame = last[si], cur = ex.cur || (ex.cur = suggestion(ex)), next = exs[draft.cur + 1];
    body = `
      <div class="exhead">
        <div class="k">Æfing ${draft.cur + 1} af ${exs.length}</div>
        <div class="nm">${esc(ex.name || exName(ex.exId))}</div>
        <div class="last">${lp ? `Síðast ${fmtDate(lp.date)}: ${lp.sets.map(setTxt).join(', ')}` : 'Fyrsta skiptið, engar fyrri tölur'}</div>
      </div>
      <section class="glass setcard" aria-label="Sett ${si + 1}">
        <div class="row1"><b>${editing ? `Breyta setti ${si + 1}` : `Sett ${si + 1}`}</b>
          ${prevSame ? `<span class="lastpill"><span>Síðast </span>${setTxt(prevSame)}</span>` : (last.length ? `<span class="lastpill"><span>Síðast ${last.length} sett</span></span>` : '')}</div>
        <div class="stepper">
          <button data-act="step" data-k="kg" data-d="-1" aria-label="Minnka þyngd">−</button>
          <div class="val"><input data-cur="kg" inputmode="decimal" autocomplete="off" aria-label="Þyngd í kg" value="${esc(cur.kg)}" placeholder="0"><div class="u">kg</div></div>
          <button data-act="step" data-k="kg" data-d="1" aria-label="Auka þyngd">+</button>
        </div>
        <div class="divider"></div>
        <div class="stepper">
          <button data-act="step" data-k="reps" data-d="-1" aria-label="Færri reps">−</button>
          <div class="val"><input data-cur="reps" inputmode="numeric" autocomplete="off" aria-label="Endurtekningar" value="${esc(cur.reps)}" placeholder="0"><div class="u">reps</div></div>
          <button data-act="step" data-k="reps" data-d="1" aria-label="Fleiri reps">+</button>
        </div>
        <button class="bigbtn" data-act="doneset">${editing ? 'Uppfæra sett' : 'Klára sett'}</button>
        ${editing ? `<button class="btn ghost block" data-act="canceledit">Hætta við breytingu</button>` : ''}
      </section>
      ${draft.lastSetAt ? `<div class="rest glass" data-rest><span class="muted">Hvíld</span><b data-timer="rest"></b></div>` : ''}
      ${ex.sets.length ? `<ul class="done glass list">${ex.sets.map((st, i) => { const c = compare(st, last[i]);
        return `<li><span class="sn">Sett ${i + 1}</span>
          <button class="sv" data-act="editset" data-si="${i}" aria-label="Breyta setti ${i + 1}">${setTxt(st)}<small>${last[i] ? `Síðast ${setTxt(last[i])}` : 'Ekkert sett síðast'}</small></button>
          <span class="cmp ${c && !c.up ? 'down' : ''}">${c ? c.t : ''}</span>
          <button class="xbtn" data-act="rmset" data-si="${i}" aria-label="Eyða setti ${i + 1}">${ICON.x}</button></li>`; }).join('')}</ul>` : ''}
      <div style="display:flex;gap:10px;margin-top:12px">
        ${next ? `<button class="btn primary" style="flex:1" data-act="curex" data-ei="${draft.cur + 1}">Næst: ${esc(next.name || exName(next.exId))}</button>` : `<button class="btn primary" style="flex:1" data-act="pickex">Bæta við æfingu</button>`}
      </div>`;
  }
  view.innerHTML = `${edTop()}
    ${!isNewDraft() ? `<div class="editbar glass">${PENCIL}<span><b>Þú ert að breyta æfingu</b><span class="tiny">Breytingar vistast þegar þú ýtir á Vista.</span></span>
      <label class="edate"><span class="tiny">Dagsetning</span><input class="in" id="ddate" type="date" data-field="date" value="${esc(draft.date)}"></label></div>` : ''}
    <div class="chips" role="group" aria-label="Æfingar í þessari lotu">
      ${exs.map((e, i) => `<button class="chip" data-act="curex" data-ei="${i}" aria-pressed="${i === draft.cur}">${esc(e.name || exName(e.exId))}<small>${e.sets.length}</small></button>`).join('')}
      <button class="chip" data-act="pickex">+ Æfing</button>
    </div>
    ${body}
    <label class="f" for="notes">Athugasemd</label>
    <textarea class="in" id="notes" data-field="notes" placeholder="Hvernig gekk?">${esc(draft.notes ?? '')}</textarea>
    <div class="grid2">
      ${isNewDraft() ? `<div><label class="f" for="ddate">Dagsetning</label><input class="in" id="ddate" type="date" data-field="date" value="${esc(draft.date)}"></div>` : ''}
      <div><label class="f" for="dur">Heildartími</label><input class="in" id="dur" data-field="dur" inputmode="decimal" placeholder="${draft.startedAt ? 'Reiknast sjálfur' : 't.d. 55'}" value="${esc(draft.durRaw ?? '')}"></div>
    </div>
    ${spaEditor()}
    ${ex ? `<button class="btn ghost block" style="margin-top:12px" data-act="rmex">Fjarlægja ${esc(ex.name || exName(ex.exId))} úr lotunni</button>` : ''}
    <button class="cta savebottom" data-act="savelog">${isNewDraft() ? 'Vista æfingu' : 'Vista breytingar'}</button>
    ${shareRow()}
    ${!isNewDraft() ? commentsBlock(draft.profileId, draft.id, draft.profileId === me.uid ? null : draft) : ''}
    ${!isNewDraft() ? `<button class="btn ghost danger block" data-act="dellog">Eyða þessari æfingu</button>` : ''}`;
}
function renderCardio(){
  const T = TYPES[draft.type] || TYPES.other, cfg = typeCfg(draft.type, draft.sub), f = cfg.fields, unit = cfg.unit;
  const has = k => f.includes(k);
  const others = Object.keys(TYPES).filter(k => k !== 'lift' && (sportOn(k) || k === draft.type));
  const subs = T.subs ? Object.keys(T.subs) : [];
  const numF = (k, label, u, ph) => `<div class="ff"><label for="cf_${k}">${label}</label><div class="unitwrap"><input class="in" id="cf_${k}" data-field="${k}" inputmode="decimal" placeholder="${ph || ''}" value="${esc(draft[k] ?? '')}"><span class="unit">${u}</span></div></div>`;
  const txtF = (k, label, ph) => `<div class="ff"><label for="cf_${k}">${label}</label><input class="in" id="cf_${k}" data-field="${k}" placeholder="${ph || ''}" value="${esc(draft[k] ?? '')}"></div>`;
  const small = [];
  if (has('elev')) small.push(numF('elevation', 'Hækkun', 'm', 't.d. 600'));
  if (has('runs')) small.push(numF('runs', 'Ferðir', 'ferðir', 't.d. 12'));
  if (has('par')) small.push(numF('par', 'Par vallar', 'par', draft.sub === 'h9' ? 't.d. 36' : 't.d. 72'));
  if (has('score')) small.push(numF('score', 'Högg', 'högg', draft.sub === 'h9' ? 't.d. 45' : 't.d. 92'));
  if (has('points')) small.push(numF('points', 'Punktar', 'pkt', 'valfrjálst'));
  if (has('balls')) small.push(numF('balls', 'Fjöldi bolta', 'boltar', 't.d. 100'));
  if (has('longest')) small.push(numF('longest', 'Lengsti bolti', 'm', 't.d. 220'));
  if (has('rounds')) small.push(numF('rounds', 'Lotur', 'lotur', 't.d. 6'));
  if (has('hr') && draft.type !== 'run') small.push(numF('hrRaw', 'Meðalpúls', 'slög', 'valfrjálst'));
  view.innerHTML = `${edTop()}
    ${!isNewDraft() ? `<div class="editbar glass">${PENCIL}<span><b>Þú ert að breyta æfingu</b><span class="tiny">Dagsetninguna og allt annað má laga hér. Breytingar vistast þegar þú ýtir á Vista.</span></span></div>` : ''}
    <div class="chips" role="group" aria-label="Íþrótt">${others.map(k => `<button class="chip" data-act="settype" data-t="${k}" aria-pressed="${k === draft.type}">${TYPES[k].name}</button>`).join('')}</div>
    ${subs.length ? `<div class="opts" style="padding:0 0 4px" role="group" aria-label="Tegund">${subs.map(k => `<button class="chip" data-act="setsub" data-s="${k}" aria-pressed="${draft.sub === k}">${subName(draft.type, k)}</button>`).join('')}
      ${T.customSub ? `<button class="chip" data-act="setsub" data-s="" aria-pressed="${!draft.sub}">${T.customSub}</button>` : ''}</div>` : ''}
    ${has('title') || (T.customSub && !draft.sub) ? txtF('title', T.customSub && !draft.sub ? 'Heiti tímans' : (T.titleLabel || 'Heiti'), T.customSub && !draft.sub ? 't.d. Tabata' : (T.titlePh || '')) : ''}
    ${has('pool') ? `<div class="ff"><span class="flabel">Sundlaug</span><button class="poolbtn glass" data-act="poolpick"><span class="pic" aria-hidden="true">${sportIcon('swim', 20)}</span>
      <span><b>${draft.pool ? esc(draft.pool) : 'Veldu laug'}</b><span class="tiny">${draft.pool ? esc(poolRegion(draft.pool) || 'Þín laug') : 'Laugarnar þínar efst, svo allar í stafrófsröð'}</span></span>${ICON.r}</button></div>` : ''}
    ${has('box') ? txtF('box', 'Box / stöð', 't.d. CrossFit Reykjavík').replace('<input ', '<input list="boxes" ') + `<datalist id="boxes">${[...new Set(state.sessions.filter(x => x.box).map(x => x.box))].map(c => `<option value="${esc(c)}">`).join('')}</datalist>` : ''}
    ${has('wodline') ? txtF('wod', 'Æfing dagsins', 't.d. Fran, eða 5 umferðir af róðri og burpees').replace('<input ', '<input list="wodnames" ') + `<datalist id="wodnames">${[...new Set(state.sessions.filter(x => isWod(x) && x.wod).map(x => x.wod))].map(n => `<option value="${esc(n)}">`).join('')}</datalist>` : ''}
    ${has('pbs') ? `<div class="ff"><span class="flabel">Personal best</span>
      ${(draft.prs || []).map((p, i) => `<div class="pbchip"><span class="pbtro" aria-hidden="true">🏆</span><button class="pbedit" data-pbk="${esc(p.key)}"><b>${esc(p.name)}</b><span>${esc(pbText(p))}</span></button>
        <button class="xbtn" data-act="pbrm" data-i="${i}" aria-label="Fjarlægja ${esc(p.name)}">${ICON.x}</button></div>`).join('')}
      <button class="pbbtn" data-act="pbopen"><span aria-hidden="true">🏆</span>${(draft.prs || []).length ? 'Bæta við öðru PB' : 'Náðirðu personal best?'}</button></div>` : ''}
    ${has('course') ? txtF('course', 'Völlur', 't.d. Grafarholtsvöllur').replace('<input ', '<input list="golfcourses" ') + `<datalist id="golfcourses">${[...new Set(state.sessions.filter(x => x.profileId === draft.profileId && x.type === 'golf' && x.course).map(x => x.course))].map(c => `<option value="${esc(c)}">`).join('')}</datalist>` : ''}
    ${has('par') && has('score') ? `<div class="golfrel" id="golfrel"></div>` : ''}
    ${has('distance') ? `<div class="glass bigdist" style="margin-top:10px"><label for="dist" class="muted" style="font-size:14px">Vegalengd í ${unit === 'm' ? 'metrum' : 'km'}${draft.type === 'golf' ? ' (valfrjálst)' : ''}</label>
      <div class="diststep"><button class="stepbtn" data-act="diststep" data-dir="-1" aria-label="Minnka um ${distStep()} ${unit}">−</button>
      <input id="dist" data-field="distance" inputmode="decimal" placeholder="0" value="${esc(draft.distRaw ?? '')}">
      <button class="stepbtn" data-act="diststep" data-dir="1" aria-label="Auka um ${distStep()} ${unit}">+</button></div>
      ${distPresets().length ? `<div class="distpre" role="group" aria-label="Algengar vegalengdir">${distPresets().map(([v, l]) => `<button class="chip" data-act="distpre" data-v="${v}" aria-pressed="${num(draft.distRaw) === v}">${l}</button>`).join('')}</div>` : ''}</div>` : ''}
    ${has('dur') ? (cfg.pace ? `<div class="grid2">
      <div class="cell glass"><label for="dur" class="tiny">Tími</label><input id="dur" data-field="dur" inputmode="decimal" placeholder="28:30" value="${esc(draft.durRaw ?? '')}"></div>
      <div class="cell glass pacecell" id="pace"></div></div>`
      : `<div class="glass bigdist" style="margin-top:10px"><label for="dur" class="muted" style="font-size:14px">Tími${draft.type === 'golf' ? ' (valfrjálst)' : ''}</label>
        <input id="dur" data-field="dur" inputmode="decimal" placeholder="${draft.type === 'golf' && draft.sub === 'h18' ? '4:10:00' : '60'}" value="${esc(draft.durRaw ?? '')}"><div class="tiny">mínútur, eða klst:mín:sek</div></div>`) : ''}
    ${small.length ? `<div class="fgrid">${small.join('')}</div>` : ''}
    ${has('grade') ? txtF('grade', 'Erfiðasta leið', 't.d. 6a eða V4') : ''}
    ${has('result') ? txtF('result', 'Úrslit (valfrjálst)', 't.d. 6–4, 6–3 eða 3–2 sigur') : ''}
    ${has('intensity') ? `<div class="ff"><span class="flabel">Álag</span><div class="opts" style="padding:0">${Object.entries(INTENSITY).map(([k, l]) => `<button class="chip" data-act="setint" data-v="${k}" aria-pressed="${draft.intensity === k}">${l}</button>`).join('')}</div></div>` : ''}
    ${draft.type === 'run' ? `<div class="glass" style="margin-top:10px;padding:14px 0 0">
      <div class="srow" style="padding-top:0;min-height:0"><label for="hr"><b>Meðalpúls</b><div class="tiny">Valfrjálst, t.d. af úrinu</div></label>
        <input class="in" id="hr" data-field="hr" inputmode="numeric" placeholder="slög/mín" value="${esc(draft.hrRaw ?? '')}" style="max-width:130px;text-align:center"></div>
      <div class="slabel" style="padding-top:6px">Álag</div><div class="opts" id="effchips" role="group" aria-label="Álag"></div></div>` : ''}
    ${spaEditor()}
    <label class="f" for="ddate">Dagsetning</label><input class="in" id="ddate" type="date" data-field="date" value="${esc(draft.date)}">
    <label class="f" for="notes">Athugasemd</label>
    <textarea class="in" id="notes" data-field="notes" placeholder="Hvernig gekk?">${esc(draft.notes ?? '')}</textarea>
    <button class="cta savebottom" data-act="savelog">${isNewDraft() ? 'Vista æfingu' : 'Vista breytingar'}</button>
    ${shareRow()}
    ${!isNewDraft() ? commentsBlock(draft.profileId, draft.id, draft.profileId === me.uid ? null : draft) : ''}
    ${!isNewDraft() ? `<button class="btn ghost danger block" style="margin-top:10px" data-act="dellog">Eyða þessari æfingu</button>` : ''}`;
  updatePace();
}
function spaStats(){
  const since = ymd(addDays(new Date(), -28)), list = mySessions().filter(s => s.date >= since && (s.spa || []).length);
  if (!list.length) return '';
  const t = spaTotals(list.flatMap(s => s.spa)), visits = list.length;
  return `<div class="glass" style="grid-column:span 2"><div class="l" style="margin-bottom:6px">Gufa og pottar síðustu 4 vikur, ${visits} ${plural(visits, 'ferð', 'ferðir')}</div>
    ${t.map(x => `<div class="spastat"><span><i style="background:${SPA[x.kind].color}"></i>${SPA[x.kind].name}</span><b>${spaTime(x.min)}</b><span class="tiny">${x.n} ${plural(x.n, 'skipti', 'skipti')}</span></div>`).join('')}</div>`;
}
function spaEditor(){
  const list = draft.spa || [], open = draft.type === 'swim' || list.length || draft.spaOpen;
  if (!open) return `<button class="btn block" style="margin-top:12px" data-act="spaopen">+ Gufa, sauna eða pottur</button>`;
  return `<section class="glass spaed">
    <div class="slabel" style="padding:14px 16px 4px">Gufa og pottar<div class="tiny">Bættu við í þeirri röð sem þú fórst, t.d. sauna, kalt, sauna, kalt</div></div>
    <div class="opts" style="padding:6px 16px 10px">${Object.entries(SPA).map(([k, v]) => `<button class="chip spachip" data-act="spaadd" data-k="${k}"><i style="background:${v.color}"></i>${v.short}</button>`).join('')}</div>
    ${list.length ? `<ul class="sparows">${list.map((x, i) => `<li>
      <span class="spn"><i style="background:${SPA[x.kind].color}"></i>${SPA[x.kind].name}</span>
      <button class="mv" data-act="spastep" data-i="${i}" data-d="-1" aria-label="Mínútu styttra">−</button>
      <span class="unitwrap"><input class="in" data-spa="${i}" inputmode="decimal" value="${esc(x.raw)}" aria-label="Tími í ${SPA[x.kind].name}"><span class="unit">mín</span></span>
      <button class="mv" data-act="spastep" data-i="${i}" data-d="1" aria-label="Mínútu lengra">+</button>
      <button class="xbtn" data-act="sparm" data-i="${i}" aria-label="Fjarlægja">${ICON.x}</button></li>`).join('')}</ul>
      <div class="tiny" id="spatotal" style="padding:0 16px 14px">${spaTotalText()}</div>` : ''}
  </section>`;
}
const spaParsed = () => (draft.spa || []).map(x => ({ kind: x.kind, min: parseDur(x.raw) })).filter(x => x.min > 0);
function spaTotalText(){
  const t = spaTotals(spaParsed()); if (!t.length) return '';
  const heat = t.filter(x => HEAT.includes(x.kind)).reduce((a, x) => a + x.min, 0);
  return `Samtals: ${t.map(x => `${SPA[x.kind].short.toLowerCase()} ${spaTime(x.min)}`).join(', ')}${heat && t.filter(x => HEAT.includes(x.kind)).length > 1 ? `. Hiti alls ${spaTime(heat)}` : ''}`;
}
function updateGolfRel(){
  const el = $('#golfrel'); if (!el || !draft) return;
  const sc = num(draft.score), par = num(draft.par);
  el.innerHTML = sc && par ? `<span class="${sc - par <= 0 ? 'good' : ''}">${golfRel(sc - par)}</span> <span class="tiny">miðað við par ${par}</span>` : '';
}
function updatePace(){
  updateGolfRel();
  const st = $('#spatotal'); if (st && draft) st.textContent = spaTotalText();
  const el = $('#pace'); if (!el || !draft) return;
  const p = paceText(draft.type, num(draft.distRaw), parseDur(draft.durRaw), draft.sub);
  const lab = t => `<div class="tiny" style="color:inherit;opacity:.8">${t}</div>`;
  el.innerHTML = p ? `${lab('Hraði')}<div class="v">${p.v}</div>${lab(p.l)}` : `${lab('Hraði')}<div class="v">–</div>${lab('reiknast sjálfur')}`;
  const ec = $('#effchips');
  if (ec){
    const probe = { id: draft.id, type: 'run', profileId: draft.profileId, date: draft.date || today(), distance: num(draft.distRaw), durationMin: parseDur(draft.durRaw), avgHr: num(draft.hrRaw) };
    const auto = classifyRun(probe, runPool(draft.profileId));
    ec.innerHTML = `<button class="chip" data-act="seteffort" data-e="" aria-pressed="${!draft.effort}">Sjálfvirkt${auto ? `: ${EFFORT[auto].name}` : ''}</button>` +
      Object.entries(EFFORT).map(([k, v]) => `<button class="chip" data-act="seteffort" data-e="${k}" aria-pressed="${draft.effort === k}">${v.name}</button>`).join('');
  }
}
function startDraft(type, existing){
  if (existing) watchComments(existing.profileId, existing.id, refreshComments); else stopComments();
  if (existing){
    draft = JSON.parse(JSON.stringify(existing));
    draft.distRaw = existing.distance != null ? fmtIn(existing.distance) : '';
    draft.durRaw = existing.durationMin != null ? fmtDur(existing.durationMin) : '';
    draft.hrRaw = existing.avgHr ? String(existing.avgHr) : ''; draft.effort = existing.effort || '';
    draft.spa = (existing.spa || []).map(x => ({ kind: x.kind, raw: Math.abs(x.min - Math.round(x.min)) > 0.01 ? fmtDur(x.min) : String(Math.round(x.min)) }));
    if (draft.type === 'lift'){ draft.cur = 0; draft.exercises = draft.exercises || []; draft.exercises.forEach(e => e.cur = null); }
    else { draft.exercises = (draft.exercises || []).map(e => ({ ...e, sets: e.sets.map(st => ({ kg: fmtIn(st.kg), reps: String(st.reps ?? '') })) })); if (draft.resTime) draft.resTime = fmtDur(draft.resTime); }
  } else {
    draft = {id: uid(), profileId: state.active, type, sub: firstSub(type), date: ui.presetDate || today(), notes: '', distRaw: '', durRaw: '', exercises: []}; ui.presetDate = null;
    if (type === 'lift'){ draft.exercises = []; draft.cur = 0; draft.startedAt = Date.now(); }
  }
  saveDraft(); ui.tab = 'log'; render(); window.scrollTo(0, 0);
  if (type === 'lift' && !existing) openExPicker();
}
function saveLog(){
  const d = draft;
  const s = { id: d.id, profileId: d.profileId, type: d.type, date: d.date || today(),
    title: (d.title || '').trim() || null, notes: (d.notes || '').trim(), share: d.share || null,
    durationMin: parseDur(d.durRaw), createdAt: d.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    createdBy: d.createdBy || me.uid };
  if (d.type === 'lift'){
    s.exercises = d.exercises.map(e => ({exId: e.exId, name: e.name || exName(e.exId), sets: e.sets.map(st => ({kg: num(st.kg) ?? 0, reps: num(st.reps) ?? 0}))})).filter(e => e.sets.length);
    if (!s.exercises.length) return toast('Kláraðu að minnsta kosti eitt sett');
    s.spa = spaParsed(); if (!s.spa.length) s.spa = null;
    if (s.durationMin == null && d.startedAt){ const m = (Date.now() - d.startedAt) / 60000; if (m < 300) s.durationMin = Math.round(m); }
  } else {
    const cfg = typeCfg(d.type, d.sub), has = k => cfg.fields.includes(k);
    s.sub = d.sub || null;
    s.distance = has('distance') ? num(d.distRaw) : null;
    if (!has('dur')) s.durationMin = null;
    const nn = (k, ok) => { const v = num(d[k]); return ok && v != null && v >= 0 ? v : null; };
    s.elevation = nn('elevation', has('elev')); s.runs = nn('runs', has('runs')); s.score = nn('score', has('score'));
    s.points = nn('points', has('points')); s.balls = nn('balls', has('balls')); s.rounds = nn('rounds', has('rounds'));
    const tt = k => has(k) ? ((d[k] || '').trim() || null) : null;
    s.course = tt('course'); s.grade = tt('grade'); s.result = tt('result'); s.pool = has('pool') ? (d.pool || null) : null;
    s.par = nn('par', has('par')); s.longest = nn('longest', has('longest')); s.pb = null;
    s.box = tt('box');
    if (has('wodline')) s.wod = (d.wod || '').trim() || null;
    if (has('pbs')){ s.prs = (d.prs || []).map(p => ({ ...p })); if (s.prs.length) s.pb = 'cf'; }
    if (d.type === 'golf'){
      const prev = state.sessions.filter(x => x.profileId === s.profileId && x.type === 'golf' && x.sub === s.sub && x.id !== s.id);
      if (s.score && s.par){ const rels = prev.filter(x => x.score && x.par).map(x => x.score - x.par);
        if (rels.length >= PR_MIN - 1 && s.score - s.par < Math.min(...rels)) s.pb = 'round'; }
      if (s.longest){ const ls = prev.map(x => x.longest || 0).filter(Boolean);
        if (ls.length >= PR_MIN - 1 && s.longest > Math.max(...ls)) s.pb = 'long'; }
    }
    s.title = (has('title') || ((TYPES[d.type] || {}).customSub && !d.sub)) ? ((d.title || '').trim() || null) : null;
    s.intensity = has('intensity') ? (d.intensity || null) : null;
    if (has('hr') && d.type !== 'run'){ const hr = num(d.hrRaw); s.avgHr = hr && hr > 40 && hr < 230 ? Math.round(hr) : null; }
    s.spa = spaParsed(); if (!s.spa.length) s.spa = null;
    const anything = s.wod || (s.prs || []).length || (s.exercises || []).length || s.pool || s.distance || s.durationMin || s.spa || s.score || s.balls || s.longest || s.runs || s.elevation || s.title;
    if (!anything) return toast(d.type === 'swim' ? 'Settu inn vegalengd, tíma eða gufu og potta' : d.type === 'golf' ? 'Settu inn högg, bolta eða tíma' : has('distance') ? 'Settu inn vegalengd eða tíma' : 'Settu inn tíma');
    if (d.type === 'run'){
      const hr = num(d.hrRaw); s.avgHr = hr && hr > 40 && hr < 230 ? Math.round(hr) : null;
      s.effort = d.effort || null;
      s.effortAuto = classifyRun(s, runPool(s.profileId));
    }
  }
  const i = state.sessions.findIndex(x => x.id === s.id);
  if (i >= 0) state.sessions[i] = s; else state.sessions.push(s);
  lastSaveAt = Date.now();
  Store.putSession(hid, s).catch(fail('Vistun'));
  const wasNew = i < 0, lvl = shareLevel(s);
  if (Store.putShared && lvl !== 'none'){ const isNewShared = !(shared[s.profileId] || []).some(x => x.id === s.id);
    Store.putShared(s.profileId, sharedOf(s, lvl), isNewShared).catch(e => console.warn(e)); }
  draft = null; saveDraft(); ui.tab = 'home'; ui.weekOffset = 0; render(); window.scrollTo(0, 0);
  if (wasNew) trackSessions([s]);
  if (s.pb === 'cf' && wasNew && s.profileId === me.uid){ const p0 = s.prs[0], prev = pbBest(pbHistory(s.profileId, p0.key, s.id)), df = pbDiff(p0, prev);
    setTimeout(() => celebrate('Nýtt personal best!', `${p0.name}: ${pbText(p0)}${df ? ` (${df})` : ''}${s.prs.length > 1 ? `, og ${s.prs.length - 1} ${s.prs.length === 2 ? 'annað' : 'önnur'}` : ''}`), 400); }
  else if (s.pb && s.profileId === me.uid) setTimeout(() => celebrate(s.pb === 'long' ? 'Lengsti boltinn þinn!' : 'Nýtt met!',
    s.pb === 'long' ? `${nf(s.longest)} m á driving range` : `${s.score} högg á ${s.sub === 'h9' ? '9' : '18'} holum, ${golfRel(s.score - s.par)}${s.course ? `, ${s.course}` : ''}`), 400);
  if (wasNew && s.profileId === me.uid && visOf(me.uid) === 'ask' && social.friends.length) askShare(s);
  else toast('Æfing vistuð');
}
/* Spurt í lok skráningar þegar stillingin er „Spyrja í hvert skipti“ */
/* Í breytingarham: hvort vinir sjá þessa tilteknu æfingu */
function shareRow(){
  if (isNewDraft() || draft.profileId !== me.uid || visOf(me.uid) === 'none' || !social.friends.length) return '';
  const cur = shareLevel(draft);
  return `<div class="ff"><span class="flabel">Vinir sjá þessa æfingu</span><div class="opts" style="padding:0">${[['none', 'Ekki deilt'], ['summary', 'Yfirlit'], ['full', 'Allt']].map(([k, l]) =>
    `<button class="chip" data-act="sessshare" data-id="${esc(draft.id)}" data-v="${k}" aria-pressed="${cur === k}">${l}</button>`).join('')}</div></div>`;
}
function askShare(s){
  openSheet('Æfing vistuð', `<div class="askshare"><div class="ascheck">${sportIcon(TYPES[s.type] ? s.type : 'other', 30)}</div>
      <h2 style="margin:10px 0 2px">Deila með vinum?</h2>
      <p class="muted" style="margin:0 0 14px">${esc(titleOf(s))}, ${esc(sessionParts(s).slice(0, 2).join(', ') || fmtDate(s.date))}</p></div>
    <button class="shareopt" data-act="sharepick" data-id="${esc(s.id)}" data-v="summary"><b>Já, yfirlit</b><span>Dagur, íþrótt, vegalengd og tími</span></button>
    <button class="shareopt" data-act="sharepick" data-id="${esc(s.id)}" data-v="full"><b>Já, allt</b><span>Líka ${s.type === 'lift' ? 'sett, þyngdir og ' : ''}athugasemdir</span></button>
    <button class="btn ghost block" style="margin-top:6px" data-act="sharepick" data-id="${esc(s.id)}" data-v="none">Ekki í þetta sinn</button>
    <p class="tiny" style="text-align:center;margin-top:10px">Þú getur breytt þessu síðar með því að opna æfinguna. Stilling í Stillingum → Vinir og maki.</p>`);
}
function setSessionShare(id, v){
  const s = state.sessions.find(x => x.id === id); if (!s) return;
  s.share = v; s.updatedAt = new Date().toISOString(); Store.putSession(hid, s).catch(fail('Vistun'));
  const has = (shared[me.uid] || []).some(x => x.id === id);
  if (v === 'none'){ if (has) Store.deleteShared(me.uid, id).catch(() => {}); }
  else Store.putShared(me.uid, sharedOf(s, v), !has).catch(e => console.warn(e));
}
function applyVisibility(v, from){
  trackAppearance('vis', visOf(me.uid), v);
  household.profiles = household.profiles || {};
  household.profiles[me.uid] = { ...profOf(me.uid), visibility: v, shareFrom: from };
  (Store.setSharing ? Store.setSharing(hid, me.uid, v, from) : Store.setVisibility(hid, me.uid, v)).catch(fail('Stilling'));
  scheduleSync(); closeSheet(); render(); toast(`Vinir: ${VIS[v].name.toLowerCase()}`);
}
function changeVisibility(v){
  const cur = visOf(me.uid); if (cur === v) return;
  const opening = (cur === 'none' || cur === 'ask') && (v === 'summary' || v === 'full');
  if (!opening) return applyVisibility(v, profOf(me.uid).shareFrom || null);
  const before = state.sessions.filter(s => s.profileId === me.uid && shareLevel(s) === 'none').length;
  if (!before) return applyVisibility(v, null);
  openSheet('Eldri æfingar', `<p class="muted" style="margin-top:0">Vinir munu sjá ${v === 'full' ? 'allt um' : 'yfirlit yfir'} æfingarnar þínar. Á það líka við um þær ${before} æfingar sem þú hefur ekki deilt hingað til?</p>
    <button class="shareopt" data-act="visfrom" data-v="${v}" data-all="1"><b>Já, líka fyrri æfingar</b><span>Vinir sjá alla söguna þína</span></button>
    <button class="shareopt" data-act="visfrom" data-v="${v}" data-all="0"><b>Nei, bara héðan í frá</b><span>Æfingar sem þú skráir frá og með núna</span></button>
    <button class="btn ghost block" style="margin-top:6px" data-act="sheetclose">Hætta við</button>`);
}
/* Algengar vegalengdir og skref fyrir +/− eftir íþrótt */
function distPresets(){
  const t = draft.type, sub = draft.sub;
  if (t === 'run') return [[3, '3 km'], [5, '5 km'], [10, '10 km'], [15, '15 km'], [21.1, 'Hálft maraþon'], [42.2, 'Maraþon']];
  if (t === 'walk') return [[2, '2 km'], [3, '3 km'], [5, '5 km'], [8, '8 km'], [10, '10 km']];
  if (t === 'hike') return [[5, '5 km'], [8, '8 km'], [10, '10 km'], [15, '15 km'], [20, '20 km']];
  if (t === 'bike') return [[10, '10 km'], [20, '20 km'], [30, '30 km'], [50, '50 km'], [100, '100 km']];
  if (t === 'swim') return [[500, '500 m'], [1000, '1.000 m'], [1500, '1.500 m'], [2000, '2.000 m'], [3000, '3.000 m']];
  if (t === 'ski') return [[5, '5 km'], [10, '10 km'], [15, '15 km'], [20, '20 km'], [25, '25 km']];
  if (t === 'row') return sub === 'erg' ? [[500, '500 m'], [1000, '1.000 m'], [2000, '2.000 m'], [5000, '5.000 m'], [10000, '10.000 m']] : [[2, '2 km'], [5, '5 km'], [10, '10 km']];
  return [];
}
function distStep(){
  const t = draft.type;
  if (t === 'swim') return 50; if (t === 'row' && draft.sub === 'erg') return 100;
  if (t === 'bike') return 1; return 0.5;
}
const curEx = () => draft && draft.exercises && draft.exercises[draft.cur];
function doneSet(){
  const ex = curEx(); if (!ex) return;
  const kg = num(ex.cur.kg), reps = num(ex.cur.reps);
  if (!reps) return toast('Settu inn fjölda reps');
  const st = {kg: kg ?? 0, reps};
  if (draft.editSet != null){ ex.sets[draft.editSet] = st; draft.editSet = null; toast('Sett uppfært'); }
  else { ex.sets.push(st); draft.lastSetAt = Date.now(); }
  ex.cur = suggestion(ex); saveDraft(); render();
}
function step(k, dir){
  const ex = curEx(); if (!ex) return;
  const v = num(ex.cur[k]) || 0, inc = k === 'reps' ? 1 : (settings.kgStep === 'auto' ? (v < 20 ? 1 : 2.5) : (parseFloat(settings.kgStep) || 2.5));
  const nv = Math.max(0, Math.round((v + dir * inc) * 100) / 100);
  ex.cur[k] = k === 'kg' ? fmtIn(nv) : String(nv);
  const inp = view.querySelector(`input[data-cur="${k}"]`); if (inp) inp.value = ex.cur[k];
  saveDraft();
}

/* Saga */
function renderHistory(){
  const list = (ui.histBoth ? state.sessions.slice() : mySessions()).filter(s => ui.histFilter === 'all' || s.type === ui.histFilter).sort(byDateDesc);
  const groups = {};
  list.forEach(s => { const d = parseYmd(s.date); const k = `${MONFULL[d.getMonth()]} ${d.getFullYear()}`; (groups[k] = groups[k] || []).push(s); });
  view.innerHTML = `<h1 style="margin-top:6px">Saga</h1>
    ${state.profiles.length > 1 ? `<div class="seg glass"><button data-act="hme" aria-pressed="${!ui.histBoth}">${esc(pname(state.active))}</button><button data-act="hboth" aria-pressed="${ui.histBoth}">Við bæði</button></div>` : ''}
    <div class="chips"><button class="chip" data-hf="all" aria-pressed="${ui.histFilter === 'all'}">Allt</button>${Object.entries(TYPES).map(([k, T]) => `<button class="chip" data-hf="${k}" aria-pressed="${ui.histFilter === k}">${T.name}</button>`).join('')}</div>
    ${list.length ? Object.entries(groups).map(([k, ss]) => `<div class="month">${k}</div><ul class="list glass">${ss.map(itemHtml).join('')}</ul>`).join('') : `<div class="glass empty" style="margin-top:10px">Engar æfingar passa við þessa síu.</div>`}`;
}

/* Framfarir */
function renderProgress(){
  if (ui.progMode === 'body') return renderBody();
  if (ui.progMode === 'goals') return renderGoals();
  let body = '';
  if (ui.progMode === 'lift'){
    const used = [...new Set(mySessions().flatMap(s => (s.exercises||[]).map(e => e.exId)))];
    if (!used.length) body = `<div class="glass empty">Skráðu lyftingaæfingu og þá sérðu hér hvernig þyngdirnar þróast.</div>`;
    else {
      if (!used.includes(ui.progEx)) ui.progEx = used[0];
      const h = liftHistory(ui.progEx), best = h.reduce((m, x) => x.best > m.best ? x : m, h[0]), totVol = h.reduce((a, x) => a + x.vol, 0);
      body = `<label class="f" for="pex" style="margin-top:4px">Æfing</label>
        <select class="in" id="pex">${used.map(id => `<option value="${esc(id)}" ${id === ui.progEx ? 'selected' : ''}>${esc(exName(id))}</option>`).join('')}</select>
        <div class="chart glass">${lineChart(h.map(x => ({label: fmtShort(x.date), a: x.best, b: x.rm})))}</div>
        <div class="legend"><span><i style="background:var(--c-lift)"></i>Þyngsta sett (kg)</span><span><i style="background:var(--ink-3)"></i>Áætlað 1RM</span></div>
        <div class="kv">
          <div class="glass"><div class="v">${nf(best.best, 1)} kg</div><div class="l">Þyngsta sett</div></div>
          <div class="glass"><div class="v">${nf(Math.max(...h.map(x => x.rm)), 1)} kg</div><div class="l">Áætlað 1RM</div></div>
          <div class="glass"><div class="v">${Math.max(...h.map(x => x.maxReps))}</div><div class="l">Flest reps í setti</div></div>
          <div class="glass"><div class="v">${totVol >= 10000 ? nf(totVol/1000, 1) + ' t' : nf(totVol) + ' kg'}</div><div class="l">Samtals lyft</div></div>
        </div>
        <div class="glass" style="margin-top:10px;overflow:hidden"><table class="tbl"><thead><tr><th>Dags.</th><th>Sett</th></tr></thead><tbody>
          ${h.slice().reverse().slice(0, 8).map(x => `<tr><td>${fmtDate(x.date)}</td><td>${x.sets.map(setTxt).join(', ')}</td></tr>`).join('')}</tbody></table></div>
        <p class="tiny">Áætlað 1RM er reiknað með Epley-formúlu út frá þyngd og reps. Gott til samanburðar milli vikna, ekki nákvæm tala.</p>`;
    }
  } else {
    const avail = Object.keys(TYPES).filter(k => k !== 'lift' && (sportOn(k) || mySessions().some(s => s.type === k)));
    if (!avail.includes(ui.progType)) ui.progType = avail[0] || 'run';
    const type = ui.progType, T = TYPES[type], chips = `<div class="chips">${avail.map(k => `<button class="chip" data-pt="${k}" aria-pressed="${k === type}">${TYPES[k].name}</button>`).join('')}</div>`;
    const all = mySessions().filter(s => s.type === type), ws0 = weekStart(new Date());
    const weekly = f => [...Array(12)].map((_, i) => { const st = addDays(ws0, (i - 11) * 7), a = ymd(st), b = ymd(addDays(st, 6));
      return {label: `${st.getDate()}/${st.getMonth()+1}`, v: all.filter(s => s.date >= a && s.date <= b).reduce((m, s) => m + f(s), 0)}; });
    const since28 = ymd(addDays(new Date(), -28));
    const subBreak = () => { if (!T.subs) return ''; const c = {}; all.filter(s => s.date >= since28).forEach(s => { const n = titleOf(s); c[n] = (c[n] || 0) + 1; });
      const e = Object.entries(c).sort((a, b) => b[1] - a[1]); return e.length ? `<div class="glass" style="grid-column:span 2"><div class="l" style="margin-bottom:6px">Síðustu 4 vikur</div>${e.map(([n, v]) => `<div class="spastat"><span>${esc(n)}</span><b>${v}</b><span class="tiny">${plural(v, 'skipti', 'skipti')}</span></div>`).join('')}</div>` : ''; };
    const distTypes = ['run', 'walk', 'hike', 'swim', 'bike', 'ski'];
    if (type === 'golf'){
      const relOf = s => (s.score && s.par) ? s.score - s.par : null;
      const fmtRel = r => r == null ? '–' : r === 0 ? 'Á pari' : r > 0 ? `+${r}` : `−${Math.abs(r)}`;
      const r18 = all.filter(s => s.sub === 'h18' && s.score).sort((a, b) => a.date.localeCompare(b.date)), r9 = all.filter(s => s.sub === 'h9' && s.score).sort((a, b) => a.date.localeCompare(b.date));
      const range = all.filter(s => s.sub === 'range').sort((a, b) => a.date.localeCompare(b.date)), balls = range.reduce((a, s) => a + (s.balls || 0), 0);
      const best = list => { const w = list.filter(s => relOf(s) != null); return w.length ? w.reduce((m, s) => relOf(s) < relOf(m) ? s : m) : (list.length ? list.reduce((m, s) => s.score < m.score ? s : m) : null); };
      const b18 = best(r18), b9 = best(r9), last5 = r18.filter(s => relOf(s) != null).slice(-5);
      const avgRel = last5.length ? last5.reduce((a, s) => a + relOf(s), 0) / last5.length : null;
      const withLong = range.filter(s => s.longest), longest = withLong.length ? withLong.reduce((m, s) => s.longest > m.longest ? s : m) : null;
      const relSeries = r18.filter(s => relOf(s) != null);
      const bestTxt = s => s ? `${s.par ? fmtRel(relOf(s)) : `${s.score} högg`}` : '–';
      const bestSub = s => s ? `${s.score} högg${s.par ? ` á par ${s.par}` : ''}${s.course ? `, ${esc(s.course)}` : ''}, ${fmtDate(s.date)}` : '';
      body = `${chips}${all.length ? `
        ${relSeries.length > 1 ? `<div class="chart glass">${lineChart(relSeries.map(s => ({ label: fmtShort(s.date), a: relOf(s) })), { color: tc('golf'), unit: 'högg yfir pari', dec: 0, aria: 'Högg miðað við par, 18 holur', allowNeg: true, goal: 0 })}</div>
          <div class="tiny" style="margin-top:6px">Högg miðað við par á 18 holum. Lægra er betra, brotna línan er par.</div>` : ''}
        <div class="kv">
          <div class="glass"><div class="v">${bestTxt(b18)}</div><div class="l">Besti hringur, 18 holur</div><div class="tiny">${bestSub(b18)}</div></div>
          <div class="glass"><div class="v">${bestTxt(b9)}</div><div class="l">Besti hringur, 9 holur</div><div class="tiny">${bestSub(b9)}</div></div>
          <div class="glass"><div class="v">${avgRel != null ? (avgRel > 0 ? '+' : avgRel < 0 ? '−' : '') + nf(Math.abs(avgRel), 1) : '–'}</div><div class="l">${last5.length === 1 ? 'Síðasti hringur miðað við par' : `Meðaltal síðustu ${last5.length || 5} hringja miðað við par`}</div></div>
          <div class="glass"><div class="v">${r18.length + r9.length}</div><div class="l">Hringir spilaðir</div><div class="tiny">${r18.length} × 18 holur, ${r9.length} × 9 holur</div></div>
          <div class="glass"><div class="v">${longest ? `${nf(longest.longest)} m` : '–'}</div><div class="l">Lengsti bolti</div><div class="tiny">${longest ? fmtDate(longest.date) : 'Skráðu á driving range'}</div></div>
          <div class="glass"><div class="v">${nf(balls)}</div><div class="l">Boltar slegnir</div><div class="tiny">${range.length} ${range.length % 10 === 1 && range.length % 100 !== 11 ? 'ferð' : 'ferðir'} á æfingasvæði</div></div>
        </div>
        ${withLong.length > 1 ? `<div class="chart glass">${lineChart(withLong.map(s => ({ label: fmtShort(s.date), a: s.longest })), { color: tc('golf'), unit: 'm', dec: 0, aria: 'Lengsti bolti' })}</div><div class="tiny" style="margin-top:6px">Lengsti bolti á driving range (m)</div>` : ''}`
        : `<div class="glass empty">Ekkert golf skráð ennþá.</div>`}`;
    } else if (distTypes.includes(type) && all.some(s => s.distance && typeCfg(s.type, s.sub).fields.includes('distance'))){
      const ss = all.filter(s => s.distance && typeCfg(s.type, s.sub).fields.includes('distance')), unit = typeCfg(type, ss[0].sub).unit, dec = unit === 'm' ? 0 : 1;
      const weeks = weekly(s => (s.distance && typeCfg(s.type, s.sub).fields.includes('distance')) ? s.distance : 0);
      const tot = ss.reduce((a, s) => a + s.distance, 0), longest = ss.reduce((m, s) => Math.max(m, s.distance), 0);
      const paced = ss.filter(s => s.durationMin && typeCfg(s.type, s.sub).pace); let bestPace = null;
      if (paced.length){
        const speed = typeCfg(type, paced[0].sub).pace === 'speed';
        const b = speed ? paced.reduce((m, s) => (s.distance / s.durationMin) > (m.distance / m.durationMin) ? s : m)
                        : paced.reduce((m, s) => (s.durationMin / s.distance) < (m.durationMin / m.distance) ? s : m);
        bestPace = paceText(type, b.distance, b.durationMin, b.sub);
      }
      const elev = all.reduce((a, s) => a + (s.elevation || 0), 0);
      body = `${chips}<div class="chart glass">${barChart(weeks, tc(type), dec)}</div><div class="tiny" style="margin-top:6px">${unit} á viku, síðustu 12 vikur</div>
        <div class="kv">
          <div class="glass"><div class="v">${nf(tot, dec)} ${unit}</div><div class="l">Samtals</div></div>
          <div class="glass"><div class="v">${all.length}</div><div class="l">Skipti</div></div>
          <div class="glass"><div class="v">${nf(longest, unit === 'm' ? 0 : 2)} ${unit}</div><div class="l">Lengst í einu</div></div>
          <div class="glass"><div class="v">${bestPace ? bestPace.v : '–'}</div><div class="l">${bestPace ? 'Besti hraði, ' + bestPace.l : 'Besti hraði'}</div></div>
          ${elev ? `<div class="glass"><div class="v">${nf(elev)} m</div><div class="l">Samtals hækkun</div></div>
            <div class="glass"><div class="v">${nf(Math.max(...all.map(s => s.elevation || 0)))} m</div><div class="l">Mesta hækkun í einu</div></div>` : ''}
          ${type === 'swim' ? poolStats() + spaStats() : ''}
          ${type === 'run' ? (() => { const recent = ss.filter(s => s.date >= since28 && effortOf(s)), easy = recent.filter(s => effortOf(s) === 'easy').length;
            return recent.length ? `<div class="glass" style="grid-column:span 2"><div class="v">${easy} af ${recent.length}</div><div class="l">hlaupum síðustu 4 vikur voru róleg</div></div>` : ''; })() : ''}
          ${subBreak()}
        </div>`;
    } else if (all.length){
      const weeks = weekly(s => s.durationMin || 0), mins = all.reduce((a, s) => a + (s.durationMin || 0), 0);
      const last28 = all.filter(s => s.date >= since28), withDur = all.filter(s => s.durationMin);
      body = `${chips}<div class="chart glass">${barChart(weeks, tc(type), 0)}</div><div class="tiny" style="margin-top:6px">Mínútur á viku, síðustu 12 vikur</div>
        <div class="kv">
          <div class="glass"><div class="v">${all.length}</div><div class="l">Skipti alls</div></div>
          <div class="glass"><div class="v">${last28.length}</div><div class="l">Síðustu 4 vikur</div></div>
          <div class="glass"><div class="v">${nf(mins / 60, 1)} klst</div><div class="l">Samtals tími</div></div>
          <div class="glass"><div class="v">${withDur.length ? nf(mins / withDur.length) + ' mín' : '–'}</div><div class="l">Meðallengd</div></div>
          ${type === 'swim' ? spaStats() : ''}
          ${subBreak()}
        </div>
        ${type === 'class' ? pbStats() + wodStats() : ''}`;
    } else {
      body = `${chips}${type === 'swim' && spaStats() ? `<div class="kv">${spaStats()}</div>` : `<div class="glass empty">Ekkert skráð í ${esc(T.name.toLowerCase())} ennþá.</div>`}`;
    }
  }
  view.innerHTML = `<h1 style="margin-top:6px">Framfarir</h1>${progressSeg()}${body}`;
}

/* ---------- Vinir: gögn ---------- */
const partnerId = () => (state.profiles.find(p => p.id !== me.uid) || {}).id || null;
/* Hvað vinir sjá: none = ekkert, ask = spurt við hverja skráningu, summary = alltaf yfirlit, full = alltaf allt.
   Vinir sjá ekkert nema notandinn leyfi það, svo sjálfgefið er að spyrja. */
const profOf = id => (household && household.profiles && household.profiles[id]) || {};
const visOf = id => profOf(id).visibility || 'ask';
const VIS = {
  none:    { name: 'Ekkert', desc: 'Vinir sjá engar æfingar frá þér.' },
  ask:     { name: 'Spyrja í hvert skipti', desc: 'Þú velur í lok hverrar skráningar hvort vinir sjá hana.' },
  summary: { name: 'Alltaf yfirlit', desc: 'Dagur, íþrótt, vegalengd og tími. Ekki þyngdir, sett eða athugasemdir.' },
  full:    { name: 'Alltaf allt', desc: 'Líka sett, þyngdir og athugasemdir.' }
};
/* Deilingarstig einnar æfingar: stilling notandans, nema æfingin hafi sitt eigið val */
function shareLevel(s){
  const v = visOf(s.profileId), from = profOf(s.profileId).shareFrom;
  if (v === 'none') return 'none';
  if (v === 'ask') return s.share || 'none';
  if (s.share === 'none') return 'none';
  if (from && (s.createdAt || '') < from) return s.share || 'none';   // æfingar frá því áður en deiling hófst
  return v;
}
const nameOf = id => state.profiles.some(p => p.id === id) ? pname(id) : ((people[id] && people[id].name) || 'Vinur');
const circle = () => [...new Set([me.uid, ...state.profiles.map(p => p.id), ...social.friends.map(f => f.uid)])];
const AV_COLORS = ['#2F62D8', '#C2410C', '#2E7D32', '#0E7490', '#8A6400', '#7A55C4', '#BE185D', '#475569'];
const photoOf = uid => (me && uid === me.uid && myPerson && myPerson.photo) || (people[uid] && people[uid].photo) || null;
/* Prófílmynd eða upphafsstafur í lit sem ræðst af notandanum */
function avatar(uid, size = 32, label){
  const name = label || nameOf(uid), photo = photoOf(uid);
  const st = `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.44)}px`;
  if (photo) return `<img class="av" src="${esc(photo)}" alt="" style="${st}">`;
  const ch = (String(name).trim()[0] || '?').toLocaleUpperCase('is-IS');
  return `<span class="av" aria-hidden="true" style="${st};background:${AV_COLORS[parseInt(hashStr(uid || name), 36) % AV_COLORS.length]}">${esc(ch)}</span>`;
}
/* Hrós með viðbrögðum. Gildi í kudos-korti: { n: nafn, r: viðbragð } (eldri hrós eru bara nafn) */
const REACTS = { fire: { e: '🔥', name: 'Eldur' }, muscle: { e: '💪', name: 'Kraftur' }, sweat: { e: '🥵', name: 'Sveitt' }, clap: { e: '👏', name: 'Vel gert' } };
const kName = v => typeof v === 'string' ? v : ((v && v.n) || 'Vinur');
const kReact = v => (v && typeof v === 'object' && REACTS[v.r]) ? v.r : 'clap';
function kudosBadge(map){
  const vals = Object.values(map || {}); if (!vals.length) return '';
  const counts = {}; vals.forEach(v => { const r = kReact(v); counts[r] = (counts[r] || 0) + 1; });
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3).map(r => REACTS[r].e).join('');
  return `<span class="kb"><span class="ke">${top}</span>${vals.length}</span>`;
}
/* Hróshnappur: sýnir þitt viðbragð ef þú hefur hrósað, annars hönd */
function kudosBtn(attr, owner, id, map){
  const mineV = (map || {})[me.uid], n = Object.keys(map || {}).length;
  return `<button class="kudos" ${attr}="${esc(owner)}|${esc(id)}" aria-pressed="${!!mineV}" aria-haspopup="true" aria-label="${mineV ? 'Breyta hrósi' : 'Hrósa'}">
    ${mineV ? `<span class="ke">${REACTS[kReact(mineV)].e}</span>` : HAND}${n ? `<span>${n}</span>` : ''}</button>`;
}
let reactTarget = null;
function openReact(btn, kind, owner, id){
  closeReact();
  const map = kind === 'goal' ? (((goalsBy[owner] || []).find(x => x.id === id) || {}).kudos || {}) : kudosOf(owner, id) || {};
  const cur = map[me.uid] ? kReact(map[me.uid]) : null;
  const pop = document.createElement('div'); pop.id = 'reactPop'; pop.setAttribute('role', 'menu'); pop.setAttribute('aria-label', 'Veldu hrós');
  pop.innerHTML = Object.entries(REACTS).map(([k, r]) => `<button role="menuitem" class="rbtn ${cur === k ? 'on' : ''}" data-react="${k}" aria-label="${r.name}"><span>${r.e}</span></button>`).join('')
    + (cur ? `<button role="menuitem" class="rbtn rm" data-react="" aria-label="Taka hrós til baka">${ICON.x}</button>` : '');
  document.body.appendChild(pop);
  const r = btn.getBoundingClientRect(), pw = pop.offsetWidth || 260, ph = pop.offsetHeight || 70;
  const left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.right - pw));
  const top = r.top - ph - 8 > 8 ? r.top - ph - 8 : r.bottom + 8;
  pop.style.left = `${left}px`; pop.style.top = `${top}px`;
  reactTarget = { kind, owner, id };
  const first = pop.querySelector('.rbtn'); if (first) first.focus();
}
window.addEventListener('scroll', () => { if (document.getElementById('reactPop')) closeReact(); }, { passive: true });
function closeReact(){ const p = document.getElementById('reactPop'); if (p) p.remove(); reactTarget = null; }
function giveReact(r){
  const t = reactTarget; closeReact(); if (!t) return;
  const val = r ? { n: pname(me.uid), r } : null;
  if (t.kind === 'goal'){
    const g = (goalsBy[t.owner] || []).find(x => x.id === t.id); if (!g) return;
    g.kudos = { ...(g.kudos || {}) }; if (val) g.kudos[me.uid] = val; else delete g.kudos[me.uid];
    Store.setGoalKudos(t.owner, t.id, me.uid, val).catch(fail('Hrós'));
    if ($('#sheet').classList.contains('open') && $('#sheetBody .gdetail')) openGoal(t.owner, t.id);
  } else {
    const doc = (shared[t.owner] || []).find(x => x.id === t.id);
    if (!doc){
      const s0 = state.sessions.find(x => x.id === t.id && x.profileId === t.owner);
      if (!s0) return toast('Ekki hægt að hrósa þessu ennþá');
      const lv = shareLevel(s0) === 'none' ? 'summary' : shareLevel(s0); Store.putShared(t.owner, sharedOf(s0, lv), true).catch(() => {});
    } else { doc.kudos = { ...(doc.kudos || {}) }; if (val) doc.kudos[me.uid] = val; else delete doc.kudos[me.uid]; }
    Store.setKudos(t.owner, t.id, me.uid, val).catch(fail('Hrós'));
  }
  if (val){ toast(`${REACTS[r].e} Hrós sent`); bump('totals', { kudos: { [r]: 1 } }); }
  render();
}
/* Yfirlit yfir hrós sem þú hefur fengið */
function receivedKudos(days){
  const since = ymd(addDays(new Date(), -days)), out = [];
  (shared[me.uid] || []).filter(x => x.date >= since).forEach(x => Object.entries(x.kudos || {}).forEach(([u, v]) => { if (u !== me.uid) out.push({ u, v, date: x.date, what: actTitle(x), sub: actSummary(x), key: 's' + x.id }); }));
  myGoals.filter(g => g.kudos && g.status === 'achieved').forEach(g => Object.entries(g.kudos).forEach(([u, v]) => { if (u !== me.uid) out.push({ u, v, date: g.achievedAt || today(), what: `Markmið: ${goalTitle(g)}`, sub: 'Markmiði náð', key: 'g' + g.id }); }));
  return out.sort((a, b) => b.date.localeCompare(a.date));
}
function openKudosSheet(){
  const list = receivedKudos(30), groups = [];
  list.forEach(k => { let g = groups.find(x => x.key === k.key); if (!g){ g = { key: k.key, what: k.what, sub: k.sub, date: k.date, items: [] }; groups.push(g); } g.items.push(k); });
  openSheet('Hrós sem þú fékkst', groups.length ? `<p class="tiny" style="margin-top:0">Síðustu 30 dagar</p>${groups.map(g => `
    <div class="kgroup glass"><div class="kgh"><b>${esc(g.what)}</b><span class="tiny">${fmtDate(g.date)}${g.sub ? `, ${esc(g.sub)}` : ''}</span></div>
      ${g.items.map(k => `<button class="krow" data-profile="${esc(k.u)}">${avatar(k.u, 34, kName(k.v))}<span><b>${esc(kName(k.v))}</b><span class="tiny">${REACTS[kReact(k.v)].name}</span></span><span class="kemoji">${REACTS[kReact(k.v)].e}</span></button>`).join('')}
    </div>`).join('')}` : `<p class="muted">Engin hrós síðustu 30 daga ennþá.</p>`);
}
const PR_MIN = 4;
const kudosOf = (uid, id) => (((shared[uid] || []).find(x => x.id === id) || {}).kudos) || {};
function hashStr(str){ let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

/* Yfirlit æfingar sem vinir sjá. Smáatriði (sett, þyngdir, athugasemd) aðeins ef notandinn velur „Allt“. */
function sharedOf(s, vis){
  const full = vis === 'full';
  const d = { id: s.id, ownerId: s.profileId, date: s.date, type: s.type,
    title: ['other', 'hike', 'class'].includes(s.type) ? (s.title || null) : null, sub: s.sub || null,
    elevation: s.elevation ?? null, runs: s.runs ?? null, rounds: s.rounds ?? null, grade: s.grade || null, intensity: s.intensity || null,
    result: s.result || null, course: s.course || null, score: s.score ?? null, points: s.points ?? null, balls: s.balls ?? null,
    par: s.par ?? null, longest: s.longest ?? null, pb: s.pb || null, pool: s.pool || null, box: s.box || null,
    prs: (s.prs || []).length ? s.prs : null, wod: s.wod || null, wodFormat: s.wodFormat || null, rx: s.rx || null, resTime: s.resTime ?? null, resRounds: s.resRounds ?? null, resReps: s.resReps ?? null, resScore: s.resScore || null,
    distance: s.distance ?? null, durationMin: s.durationMin ?? null,
    exerciseCount: (s.exercises || []).length, setCount: setCount(s), effort: effortOf(s), spa: spaTotals(s.spa),
    volume: full && s.type === 'lift' ? sessionVolume(s) : null,
    detail: full ? { exercises: s.exercises || null, notes: s.notes || '', wodDesc: s.wodDesc || null } : null };
  d.sig = hashStr(JSON.stringify(d));
  return d;
}
/* Allar æfingar einhvers í hringnum ykkar, á sama formi */
function actsOf(uid){
  if (state.profiles.some(p => p.id === uid)){
    const kud = {}; (shared[uid] || []).forEach(x => kud[x.id] = x.kudos || {});
    return state.sessions.filter(s => s.profileId === uid).map(s => ({ ...sharedOf(s, 'full'), kudos: kud[s.id] || {} }));
  }
  return (shared[uid] || []).map(x => ({ ...x, kudos: x.kudos || {} }));
}
function actSummary(a){
  if (a.type === 'lift') return `${a.exerciseCount || 0} ${plural(a.exerciseCount || 0, 'æfing', 'æfingar')}, ${a.setCount || 0} sett${a.volume ? `, ${nf(a.volume)} kg` : ''}`;
  const parts = sessionParts(a);
  if (a.type === 'golf' && a.course) parts.push(a.course);
  if (a.pool) parts.push(a.pool);
  if ((a.prs || []).length) parts.push(`PB: ${a.prs.map(p => `${p.name} ${pbText(p)}`).join(', ')}`);
  return parts.join(', ') || ((a.spa || []).length ? 'Gufa og pottar' : 'Skráð');
}
const actTitle = a => titleOf(a);

const METRICS = {
  sessions: { name: 'Fjöldi æfinga',          unit: '',    dec: 0, f: () => 1 },
  km:       { name: 'Km (hlaup, ganga, hjól o.fl.)', unit: 'km',  dec: 1, f: s => kmOf(s) },
  runkm:    { name: 'Hlaupnir km',            unit: 'km',  dec: 1, f: s => s.type === 'run' ? (s.distance || 0) : 0 },
  swim:     { name: 'Sundmetrar',             unit: 'm',   dec: 0, f: s => s.type === 'swim' ? (s.distance || 0) : 0 },
  minutes:  { name: 'Mínútur á hreyfingu',    unit: 'mín', dec: 0, f: s => s.durationMin || 0 }
};
const challengeValue = (c, list) => list.filter(s => s.date >= c.start && s.date <= c.end).reduce((a, s) => a + (METRICS[c.metric] || METRICS.sessions).f(s), 0);

function loadPerson(uid){
  if (people[uid] && people[uid].loaded) return;
  people[uid] = { ...(people[uid] || {}), loaded: true };
  Store.getPerson(uid).then(p => { if (p){ people[uid] = { ...people[uid], ...p, loaded: true }; softRender(); } }).catch(() => {});
}
function refreshSharedSubs(){
  refreshGoalSubs();
  if (!Store.subscribeShared) return;
  const want = new Set(circle()), since = ymd(addDays(new Date(), -42));
  want.forEach(u => {
    if (sharedUnsubs[u]) return;
    sharedUnsubs[u] = Store.subscribeShared(u, u === me.uid ? null : since, list => {
      shared[u] = list;
      if (u === me.uid){ ownSharedLoaded = true; scheduleSync(); }
      softRender();
    }, e => console.warn('shared', u, e));
  });
  Object.keys(sharedUnsubs).forEach(u => { if (!want.has(u)){ sharedUnsubs[u](); delete sharedUnsubs[u]; delete shared[u]; } });
}
function attachSocial(){
  if (!Store.subscribeSocial) return;
  socialUnsub = Store.subscribeSocial(me.uid, d => {
    social.incoming = d.incoming || []; social.outgoing = d.outgoing || [];
    social.friends = (d.friendships || []).map(f => ({ fid: f.id, uid: (f.members || []).find(x => x !== me.uid) })).filter(f => f.uid);
    social.incoming.forEach(r => { if (!people[r.from]) people[r.from] = { name: r.fromName }; loadPerson(r.from); });
    social.friends.forEach(f => loadPerson(f.uid));
    social.outgoing.forEach(r => loadPerson(r.to));
    refreshSharedSubs(); softRender();
  }, e => console.warn('social', e));
  chUnsub = Store.subscribeChallenges(me.uid, list => { challenges = list; scheduleSync(); softRender(); }, e => console.warn('challenges', e));
  Store.ensurePerson(me, pname(me.uid)).then(p => { myPerson = p; softRender(); }).catch(e => console.warn('person', e));
}
function detachSocial(){
  [socialUnsub, chUnsub].forEach(f => f && f());
  Object.values(sharedUnsubs).forEach(f => f());
  socialUnsub = chUnsub = null; sharedUnsubs = {}; shared = {}; people = {}; challenges = []; myPerson = null; ownSharedLoaded = false; socialStarted = false;
  social = { incoming: [], outgoing: [], friends: [] };
}

/* Heldur yfirlitum vina og framvindu áskorana í takt við eigin æfingar */
let syncT = null;
function scheduleSync(){ clearTimeout(syncT); syncT = setTimeout(() => { syncShared(); syncGoals(); }, 1200); }
function syncShared(){
  if (gate !== 'app' || !me || !ownSharedLoaded || !Store.putShared) return;
  const mine = state.sessions.filter(s => s.profileId === me.uid), have = {};
  mine.filter(s => s.type === 'run' && !('effortAuto' in s)).forEach(s => {
    s.effortAuto = classifyRun(s, runPool(me.uid)); Store.putSession(hid, s).catch(e => console.warn(e)); });
  (shared[me.uid] || []).forEach(x => have[x.id] = x);
  mine.forEach(s => { const lvl = shareLevel(s); if (lvl === 'none') return;   // ekki deilt: yfirlitið er fjarlægt hér fyrir neðan
    const d = sharedOf(s, lvl), h = have[s.id];
    if (!h || h.sig !== d.sig) Store.putShared(me.uid, d, !h).catch(e => console.warn(e));
    delete have[s.id]; });
  Object.keys(have).forEach(id => Store.deleteShared(me.uid, id).catch(() => {}));
  challenges.forEach(c => { const v = Math.round(challengeValue(c, mine) * 10) / 10;
    if ((c.progress || {})[me.uid] !== v) Store.setProgress(c.id, me.uid, v).catch(e => console.warn(e)); });
}

/* ---------- Vinir: viðmót ---------- */
const HAND = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10m0-.5v-6a1.5 1.5 0 0 1 3 0V10m0-4.5a1.5 1.5 0 0 1 3 0V11m0-3.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.6-2.2L3.7 15.4a1.6 1.6 0 0 1 2.4-2.1L7 14.4"/></svg>';
function renderFriends(){
  const reqs = social.incoming;
  let body = ui.fMode === 'board' ? friendsBoard() : ui.fMode === 'ch' ? friendsChallenges() : friendsWeek();
  view.innerHTML = `<div class="row-h"><h1 style="margin:6px 0 12px">Vinir</h1><button class="btn primary" data-act="addfriend">Bæta við vini</button></div>
    ${reqs.length ? `<div class="glass" style="margin-bottom:12px;overflow:hidden">${reqs.map(r => `<div class="reqrow">${avatar(r.from, 36, r.fromName)}
      <div><b>${esc(r.fromName || nameOf(r.from))}</b><div class="tiny">vill vera vinur þinn</div></div>
      <button class="btn primary" data-act="acceptreq" data-from="${esc(r.from)}">Samþykkja</button>
      <button class="btn ghost" data-act="declinereq" data-from="${esc(r.from)}">Hafna</button></div>`).join('')}</div>` : ''}
    <div class="seg3 glass">${[['week','Vikan'],['board','Stigatafla'],['ch','Áskoranir']].map(([k, l]) => `<button data-fm="${k}" aria-pressed="${ui.fMode === k}">${l}</button>`).join('')}</div>
    ${body}`;
}
function emptyFriends(){
  return `<div class="glass" style="padding:18px"><b>Engir vinir ennþá</b>
    <p class="muted" style="margin:6px 0 12px">Sendu vinum vinakóðann þinn${myPerson ? `, <b>${esc(myPerson.code)}</b>,` : ''} eða vinahlekk. Þegar þeir senda beiðni og þú samþykkir birtast æfingarnar þeirra hér.</p>
    <button class="btn primary" data-act="sharecode">Deila vinahlekk</button></div>`;
}
function friendsWeek(){
  const others = circle().filter(u => u !== me.uid);
  if (!others.length) return emptyFriends();
  const ws = addDays(weekStart(new Date()), ui.fWeekOffset * 7), days = [...Array(7)].map((_, i) => ymd(addDays(ws, i))), t = today();
  const rows = circle().map(u => { const acts = actsOf(u);
    return `<button class="wname" data-profile="${esc(u)}">${avatar(u, 22)}<span>${u === me.uid ? 'Þú' : esc(nameOf(u))}</span></button>` + days.map(d => weekCell(acts.filter(a => a.date === d), d === t, u === me.uid ? 'Þú' : nameOf(u), d)).join(''); }).join('');
  const since = ymd(addDays(new Date(), -14));
  const feed = [...others.flatMap(u => actsOf(u).filter(a => a.date >= since).map(a => ({ ...a, ownerId: u }))),
    ...others.flatMap(u => (goalsBy[u] || []).filter(g => g.status === 'achieved' && g.achievedAt >= since).map(g => ({ kind: 'goal', ownerId: u, date: g.achievedAt, g })))]
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  return `<section class="glass week">
      <div class="week-head"><b>${ui.fWeekOffset === 0 ? 'Þessi vika' : `Vika ${ws.getDate()}. ${MON[ws.getMonth()]}`}</b>
        <div class="navbtns"><button data-act="fwprev" aria-label="Fyrri vika">${ICON.l}</button><button data-act="fwnext" aria-label="Næsta vika" ${ui.fWeekOffset >= 0 ? 'disabled' : ''}>${ICON.r}</button></div></div>
      <div class="week-grid"><div></div>${days.map(d => { const x = parseYmd(d); return `<div class="wd ${d === t ? 'today' : ''}">${DAYS[x.getDay()]}<b>${x.getDate()}</b></div>`; }).join('')}${rows}</div>
      ${(() => { const u2 = [...new Set(circle().flatMap(u => actsOf(u).filter(a => a.date >= days[0] && a.date <= days[6]).map(a => TYPES[a.type] ? a.type : 'other')))]; return u2.length ? legendHtml(u2) : ''; })()}
    </section>
    <h2>Nýlegt hjá vinum</h2>
    ${feed.length ? `<ul class="flist glass">${feed.map(a => { if (a.kind === 'goal'){ const k = a.g.kudos || {}, n = Object.keys(k).length, mine = !!k[me.uid];
        return `<li><button class="item" data-gopen="${esc(a.ownerId)}|${esc(a.g.id)}"><span class="feedav">${avatar(a.ownerId, 38)}<i class="tro">${TROPHY}</i></span>
          <span style="min-width:0"><div class="t">${esc(nameOf(a.ownerId))} náði markmiði</div><div class="s">${esc(goalTitle(a.g))}</div><div class="tiny">${fmtDate(a.date)}</div></span></button>
          ${kudosBtn('data-gkudos', a.ownerId, a.g.id, k)}</li>`; }
      const n = Object.keys(a.kudos).length, mine = !!a.kudos[me.uid];
      return `<li><button class="item" data-fdetail="${esc(a.ownerId)}|${esc(a.id)}"><span class="feedav">${avatar(a.ownerId, 38)}<i style="background:${tc(TYPES[a.type] ? a.type : 'other')}"></i></span>
        <span style="min-width:0"><div class="t">${esc(nameOf(a.ownerId))}: ${esc(actTitle(a))}${effPill(a.effort)}${pbPill(a)}</div><div class="s">${esc(actSummary(a))}</div>${spaPills(a.spa)}<div class="tiny">${fmtDate(a.date)}</div></span></button>
        <button class="cbtn" data-fdetail="${esc(a.ownerId)}|${esc(a.id)}" aria-label="Athugasemdir"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-4.8A8 8 0 1 1 21 12z"/></svg></button>
        ${kudosBtn('data-kudos', a.ownerId, a.id, a.kudos)}</li>`; }).join('')}</ul>`
      : `<div class="glass empty">Ekkert skráð hjá vinum síðustu tvær vikur.</div>`}`;
}
function friendsBoard(){
  const people_ = circle();
  if (people_.length < 2) return emptyFriends();
  const M = METRICS[ui.boardMetric] || METRICS.sessions;
  const ws = addDays(weekStart(new Date()), ui.fWeekOffset * 7), a = ymd(ws), b = ymd(addDays(ws, 6));
  const rows = people_.map(u => ({ u, v: actsOf(u).filter(x => x.date >= a && x.date <= b).reduce((s, x) => s + M.f(x), 0) })).sort((x, y) => y.v - x.v);
  const max = rows[0].v || 1;
  return `<div class="chips">${['sessions','km','minutes','swim'].map(k => `<button class="chip" data-bm="${k}" aria-pressed="${ui.boardMetric === k}">${{sessions:'Æfingar', km:'Km', minutes:'Mínútur', swim:'Sund'}[k]}</button>`).join('')}</div>
    <section class="glass" style="overflow:hidden">
      <div class="week-head" style="padding:12px 16px 0"><b>${ui.fWeekOffset === 0 ? 'Þessi vika' : `${ws.getDate()}. ${MON[ws.getMonth()]} – ${addDays(ws, 6).getDate()}. ${MON[addDays(ws, 6).getMonth()]}`}</b>
        <div class="navbtns"><button data-act="fwprev" aria-label="Fyrri vika">${ICON.l}</button><button data-act="fwnext" aria-label="Næsta vika" ${ui.fWeekOffset >= 0 ? 'disabled' : ''}>${ICON.r}</button></div></div>
      <ol class="board">${rows.map((r, i) => `<li class="${r.u === me.uid ? 'me' : ''}"><span class="rk">${i + 1}</span>${avatar(r.u, 32)}
        <div><div class="bn">${r.u === me.uid ? 'Þú' : esc(nameOf(r.u))}</div><div class="bb"><span style="width:${Math.round(r.v / max * 100)}%"></span></div></div>
        <span class="bv">${nf(r.v, M.dec)}${M.unit ? ` ${M.unit}` : ''}</span></li>`).join('')}</ol>
    </section>
    <p class="tiny">${M.name}. Byggt á því sem hver og einn deilir.</p>`;
}
function friendsChallenges(){
  const t = today(), mine = state.sessions.filter(s => s.profileId === me.uid);
  const list = challenges.slice().sort((a, b) => ((a.end < t) - (b.end < t)) || a.end.localeCompare(b.end));
  const canCreate = circle().length > 1;
  return `${canCreate ? `<button class="cta" style="margin-top:0" data-act="newch">Ný áskorun</button>` : emptyFriends()}
    ${list.length ? list.map(c => {
      const M = METRICS[c.metric] || METRICS.sessions, prog = { ...(c.progress || {}), [me.uid]: challengeValue(c, mine) };
      const rows = (c.members || []).map(u => ({ u, v: prog[u] || 0 })).sort((x, y) => y.v - x.v);
      const top = Math.max(c.target || 0, rows.length ? rows[0].v : 0) || 1;
      const left = Math.round((parseYmd(c.end) - parseYmd(t)) / 86400000);
      const status = c.start > t ? `Hefst ${fmtDate(c.start)}` : left < 0 ? 'Lokið' : left === 0 ? 'Síðasti dagurinn' : `${left} dagar eftir`;
      return `<section class="glass chcard">
        <div class="row-h"><h3>${esc(c.title)}</h3><span class="tiny">${status}</span></div>
        <div class="tiny" style="margin-top:2px">${M.name}${c.target ? `, markmið ${nf(c.target, M.dec)}${M.unit ? ` ${M.unit}` : ''}` : ''}. ${fmtDate(c.start)} – ${fmtDate(c.end)}</div>
        <ol class="board" style="padding:6px 0 0">${rows.map((r, i) => `<li class="${r.u === me.uid ? 'me' : ''}" style="padding:8px 0"><span class="rk">${i + 1}</span>${avatar(r.u, 30, (c.names || {})[r.u])}
          <div><div class="bn">${r.u === me.uid ? 'Þú' : esc((c.names || {})[r.u] || nameOf(r.u))}</div><div class="bb"><span style="width:${Math.min(100, Math.round(r.v / top * 100))}%"></span></div></div>
          <span class="bv">${nf(r.v, M.dec)}${M.unit ? ` ${M.unit}` : ''}</span></li>`).join('')}</ol>
        ${c.owner === me.uid ? `<button class="btn ghost danger" data-act="delch" data-cid="${esc(c.id)}">Eyða áskorun</button>` : `<button class="btn ghost" data-act="leavech" data-cid="${esc(c.id)}">Hætta í áskorun</button>`}
      </section>`; }).join('') : (canCreate ? `<div class="glass empty" style="margin-top:12px">Engar áskoranir ennþá. Stofnaðu eina og bjóddu vinum, t.d. flestir km í desember.</div>` : '')}`;
}
function openFriendDetail(uid, id){
  const a = actsOf(uid).find(x => x.id === id); if (!a) return;
  const det = a.detail;
  openSheet(`${nameOf(uid)}: ${actTitle(a)}`, `<div style="display:flex;justify-content:center;margin-bottom:8px">${avatar(uid, 64)}</div><p class="muted" style="margin-top:0;text-align:center">${fmtDate(a.date)}, ${esc(actSummary(a))}</p>${a.spa && a.spa.length ? `<div style="display:flex;justify-content:center">${spaPills(a.spa)}</div>` : ''}
    ${det ? `${(det.exercises || []).map(e => `<div class="grp">${esc(e.name || exName(e.exId))}</div><p style="margin:2px 0 8px">${(e.sets || []).map(setTxt).join(', ')}</p>`).join('')}
      ${det.notes ? `<div class="grp">Athugasemd</div><p style="margin:2px 0">${esc(det.notes)}</p>` : ''}`
    : `<p class="tiny">${esc(nameOf(uid))} deilir bara yfirliti, ekki einstökum settum og þyngdum.</p>`}
    ${Object.keys(a.kudos).length ? `<p class="tiny" style="text-align:center">Hrós: ${Object.values(a.kudos).map(v => `${REACTS[kReact(v)].e} ${esc(kName(v))}`).join(', ')}</p>` : ''}
    ${commentsBlock(uid, id, a)}
    <button class="btn block" style="margin-top:12px" data-profile="${esc(uid)}">Sjá prófíl ${esc(nameOf(uid))}</button>`);
  watchComments(uid, id, refreshComments);
}
function openAddFriend(prefill){
  const outgoing = social.outgoing, friends = social.friends;
  openSheet('Vinir', `
    <p class="muted" style="margin:0">Vinakóðinn þinn</p>
    <div class="code">${myPerson ? esc(myPerson.code) : '…'}</div>
    <button class="btn primary block" data-act="sharecode">Bjóða vinum: deila hlekk</button>
    <p class="tiny" style="text-align:center;margin:6px 0 0">Opnar deilingu símans: Messenger, SMS, WhatsApp, tölvupóst og fleira.</p>
    <label class="f" for="fcode">Netfang eða vinakóði vinar</label>
    <input class="in" id="fcode" value="${esc(prefill || '')}" autocomplete="off" autocapitalize="off" inputmode="email" placeholder="t.d. jon@gmail.com eða K7M2QX">
    <p class="tiny" style="margin:6px 2px 0">Netfangið sem vinurinn skráði sig með dugar. Ef hann er ekki kominn í appið, sendu honum vinahlekkinn: þegar hann skráir sig birtist beiðnin hjá honum.</p>
    <button class="cta" data-act="sendreq">Senda vinabeiðni</button>
    ${outgoing.length ? `<h2>Bíður svars</h2><ul class="flist glass">${outgoing.map(r => `<li class="reqrow">${avatar(r.to, 32)}<div><b>${esc(nameOf(r.to))}</b></div><button class="btn ghost" data-act="cancelreq" data-to="${esc(r.to)}">Hætta við</button></li>`).join('')}</ul>` : ''}
    ${friends.length ? `<h2>Vinir þínir</h2><ul class="flist glass">${friends.map(f => `<li class="reqrow"><button class="plink" data-profile="${esc(f.uid)}">${avatar(f.uid, 32)}<b>${esc(nameOf(f.uid))}</b></button><button class="btn ghost" data-act="unfriend" data-fid="${esc(f.fid)}">Fjarlægja</button></li>`).join('')}</ul>` : ''}`);
}
/* ---------- Prófílmynd ---------- */
let crop = null;
function pickPhoto(){
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) loadPhoto(f); };
  inp.click();
}
function loadPhoto(file){
  if (file.size > 30 * 1024 * 1024) return toast('Myndin er of stór');
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => openCropper(img, url);
  img.onerror = () => { URL.revokeObjectURL(url); toast('Gat ekki lesið myndina. Prófaðu JPEG eða PNG.'); };
  img.src = url;
}
function drawCrop(canvas, size){
  const c = crop, ctx = canvas.getContext && canvas.getContext('2d'); if (!ctx || !c) return;
  const w = c.img.naturalWidth || c.img.width, h = c.img.naturalHeight || c.img.height;
  const s = Math.max(size / w, size / h) * c.z, dw = w * s, dh = h * s;
  const mx = (dw - size) / 2, my = (dh - size) / 2;
  const k = size / 512;   // hliðrun er geymd í 512-px hnitum
  c.ox = Math.max(-mx / k, Math.min(mx / k, c.ox)); c.oy = Math.max(-my / k, Math.min(my / k, c.oy));
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(c.img, (size - dw) / 2 + c.ox * k, (size - dh) / 2 + c.oy * k, dw, dh);
}
function openCropper(img, url){
  crop = { img, url, z: 1, ox: 0, oy: 0 };
  openSheet('Prófílmynd', `<div class="crop"><canvas id="cropc" width="512" height="512" aria-label="Forskoðun prófílmyndar"></canvas></div>
    <label class="f" for="cropz">Aðdráttur</label><input type="range" id="cropz" min="1" max="3" step="0.01" value="1">
    <p class="tiny">Dragðu myndina til að staðsetja hana í hringnum.</p>
    <div class="grid2"><button class="btn" data-act="photopick">Velja aðra</button><button class="btn primary" data-act="photosave">Nota mynd</button></div>`);
  const cv = $('#cropc'); drawCrop(cv, 512);
  $('#cropz').addEventListener('input', e => { crop.z = parseFloat(e.target.value) || 1; drawCrop(cv, 512); });
  let drag = null;
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch(_){} });
  cv.addEventListener('pointermove', e => { if (!drag) return; const f = 512 / (cv.clientWidth || 240);
    crop.ox += (e.clientX - drag.x) * f; crop.oy += (e.clientY - drag.y) * f; drag = { x: e.clientX, y: e.clientY }; drawCrop(cv, 512); });
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { drag = null; }));
}
function savePhoto(){
  if (!crop) return;
  const out = document.createElement('canvas'); out.width = out.height = 256;
  if (!out.getContext || !out.getContext('2d')) return toast('Síminn styður ekki myndvinnslu');
  drawCrop(out, 256);
  let data = out.toDataURL('image/jpeg', 0.85);
  if (data.length > 150000) data = out.toDataURL('image/jpeg', 0.7);
  URL.revokeObjectURL(crop.url); crop = null;
  myPerson = { ...(myPerson || {}), photo: data };
  people[me.uid] = { ...(people[me.uid] || {}), photo: data };
  Store.setPhoto(me.uid, data).catch(fail('Vistun myndar'));
  closeSheet(); render(); toast('Prófílmynd vistuð');
}
function removePhoto(){
  if (!confirm('Fjarlægja prófílmyndina?')) return;
  if (myPerson) delete myPerson.photo;
  if (people[me.uid]) delete people[me.uid].photo;
  Store.setPhoto(me.uid, null).catch(fail('Breyting'));
  render(); toast('Mynd fjarlægð');
}

function openNewChallenge(){
  const others = circle().filter(u => u !== me.uid);
  openSheet('Ný áskorun', `
    <label class="f" for="chT">Heiti</label><input class="in" id="chT" placeholder="t.d. Desemberkílómetrar">
    <label class="f" for="chM">Mælt í</label><select class="in" id="chM">${Object.entries(METRICS).map(([k, m]) => `<option value="${k}">${m.name}</option>`).join('')}</select>
    <label class="f" for="chG">Markmið (valfrjálst)</label><input class="in" id="chG" inputmode="decimal" placeholder="t.d. 100">
    <div class="grid2"><div><label class="f" for="chS">Frá</label><input class="in" type="date" id="chS" value="${today()}"></div>
      <div><label class="f" for="chE">Til</label><input class="in" type="date" id="chE" value="${ymd(addDays(new Date(), 30))}"></div></div>
    <div class="f">Hverjir taka þátt?</div>
    ${others.map(u => `<label class="check"><input type="checkbox" data-chm="${esc(u)}" checked>${esc(nameOf(u))}</label>`).join('')}
    <button class="cta" data-act="createch">Stofna áskorun</button>`);
}
/* Vinur opnaði vinahlekk: sýna hver bauð og senda beiðni með einum smelli */
async function openFriendInvite(code){
  try {
    const target = await Store.lookupCode(code);
    if (!target || target === me.uid) return openAddFriend(code);
    if (social.friends.some(f => f.uid === target)) return toast('Þið eruð nú þegar vinir');
    const p = Store.getPerson ? await Store.getPerson(target) : null;
    people[target] = { ...(people[target] || {}), ...(p || {}), loaded: true };
    openSheet('Vinabeiðni', `<div class="invite">${avatar(target, 88)}<div class="pname">${esc(nameOf(target))}</div><div class="muted">bauð þér að vera með í Æfingabókinni</div></div>
      <p class="muted" style="text-align:center">Þegar þið eruð orðin vinir sjáið þið vikuna hjá hvort öðru, getið hrósað og keppt í áskorunum.</p>
      <button class="cta" data-act="invitesend" data-uid="${esc(target)}">Senda vinabeiðni</button>
      <button class="btn ghost block" style="margin-top:8px" data-act="sheetclose">Ekki núna</button>`);
  } catch(e){ openAddFriend(code); }
}
async function sendFriendRequest(){
  const raw = ($('#fcode').value || '').trim();
  let target;
  if (raw.includes('@')){
    const email = raw.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast('Netfangið lítur ekki út fyrir að vera rétt');
    if (me.email && email === me.email.toLowerCase()) return toast('Þetta er þitt eigið netfang');
    try { target = Store.lookupEmail ? await Store.lookupEmail(email) : null; } catch(e){ return toast('Náði ekki sambandi'); }
    if (!target) return toast('Enginn með þetta netfang hefur skráð sig. Sendu vinahlekkinn í staðinn.');
  } else {
    const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) return toast('Settu inn netfang eða vinakóða');
    if (myPerson && code === myPerson.code) return toast('Þetta er þinn eigin kóði');
    try { target = await Store.lookupCode(code); } catch(e){ return toast('Náði ekki sambandi'); }
    if (!target) return toast('Kóðinn fannst ekki');
  }
  if (target === me.uid) return toast('Þetta er þinn eigin kóði');
  if (social.friends.some(f => f.uid === target)) return toast('Þið eruð nú þegar vinir');
  if (social.incoming.some(r => r.from === target)){ Store.respondRequest(me.uid, target, true).catch(fail('Samþykki')); closeSheet(); return toast('Þið eruð orðnir vinir'); }
  Store.sendRequest(me.uid, pname(me.uid), target).catch(fail('Beiðni'));
  closeSheet(); toast('Vinabeiðni send');
}
async function shareFriendCode(){
  if (!myPerson) return toast('Kóðinn er ekki tilbúinn, reyndu aftur eftir smá');
  const link = `${location.origin}${location.pathname}?vinur=${myPerson.code}`;
  try { if (navigator.share){ await navigator.share({ title: 'Æfingabókin', text: `Ég er að skrá æfingarnar mínar í Æfingabókinni. Vertu með, þá sjáum við hreyfinguna hjá hvort öðru og getum keppt í áskorunum! Vinakóðinn minn er ${myPerson.code}.`, url: link }); return; } }
  catch(e){ if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(link); toast('Vinahlekkur afritaður'); }
  catch(e){ toast(`Kóðinn þinn: ${myPerson.code}`); }
}
function createChallenge(){
  const title = $('#chT').value.trim(), metric = $('#chM').value, target = num($('#chG').value), start = $('#chS').value, end = $('#chE').value;
  if (!title) return toast('Gefðu áskoruninni heiti');
  if (!start || !end || end < start) return toast('Athugaðu dagsetningarnar');
  const members = [me.uid, ...[...document.querySelectorAll('[data-chm]')].filter(c => c.checked).map(c => c.dataset.chm)];
  const names = {}; members.forEach(u => names[u] = u === me.uid ? pname(me.uid) : nameOf(u));
  Store.createChallenge({ title, metric, target: target || null, start, end, owner: me.uid, members, names }).catch(fail('Áskorun'));
  bump('totals', { challenges: 1, challengeMetric: { [metric]: 1 } });
  closeSheet(); toast('Áskorun stofnuð');
}

/* ---------- Um þig og mælingar (einkamál notandans) ---------- */
const SEXES = [['male', 'Karl'], ['female', 'Kona'], ['other', 'Annað'], ['', 'Vil ekki segja']];
const BODY_METRICS = [
  { key: 'weight',    name: 'Þyngd',          unit: 'kg', dec: 1, min: 25, max: 350 },
  { key: 'bodyFat',   name: 'Fituprósenta',   unit: '%',  dec: 1, min: 2,  max: 70 },
  { key: 'muscle',    name: 'Vöðvamassi',     unit: 'kg', dec: 1, min: 5,  max: 150, hint: 'Beinagrindarvöðvar, t.d. af úri eða vog' },
  { key: 'restingHr', name: 'Hvíldarpúls',    unit: 'slög/mín', dec: 0, min: 25, max: 140 },
  { key: 'waist',     name: 'Mittismál',      unit: 'cm', dec: 1, min: 40, max: 250, girth: true },
  { key: 'hips',      name: 'Mjaðmamál',      unit: 'cm', dec: 1, min: 40, max: 250, girth: true },
  { key: 'chest',     name: 'Brjóstmál',      unit: 'cm', dec: 1, min: 40, max: 250, girth: true },
  { key: 'arm',       name: 'Upphandleggur',  unit: 'cm', dec: 1, min: 10, max: 80,  girth: true },
  { key: 'thigh',     name: 'Læri',           unit: 'cm', dec: 1, min: 20, max: 120, girth: true }
];
const DERIVED = [
  { key: 'bmi', name: 'BMI', unit: '', dec: 1, derive: e => (about && about.heightCm && e.weight) ? e.weight / Math.pow(about.heightCm / 100, 2) : null },
  { key: 'lean', name: 'Fitulaus massi', unit: 'kg', dec: 1, derive: e => (e.weight && e.bodyFat) ? e.weight * (1 - e.bodyFat / 100) : null }
];
const allMetrics = () => [...BODY_METRICS.slice(0, 3), ...DERIVED, ...BODY_METRICS.slice(3)];
const mval = (m, e) => m.derive ? m.derive(e) : (e[m.key] ?? null);
function ageOf(birth){
  if (!birth) return null;
  const b = parseYmd(birth), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a >= 5 && a <= 110 ? a : null;
}
/* Hámarkspúls: stilltur, annars áætlaður út frá aldri (Tanaka: 208 − 0,7 × aldur) */
const maxHrOf = () => settings.maxHr || (about && ageOf(about.birthDate) ? Math.round(208 - 0.7 * ageOf(about.birthDate)) : null);
const LOCK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg>';
const privacyNote = () => `<div class="privacy">${LOCK}<span>Aðeins þú sérð þetta. Hvorki maki né vinir hafa aðgang.</span></div>`;

function numField(id, label, unit, value, hint){
  return `<div class="ff"><label for="${id}">${label}${hint ? `<span class="tiny"> ${hint}</span>` : ''}</label>
    <div class="unitwrap"><input class="in" id="${id}" inputmode="decimal" autocomplete="off" value="${value == null ? '' : esc(fmtIn(value))}"><span class="unit">${unit}</span></div></div>`;
}
function aboutFields(a, withFirst){
  a = a || {};
  return `
    <div class="ff"><label for="ab_birth">Fæðingardagur</label><input class="in" id="ab_birth" type="date" value="${esc(a.birthDate || '')}" max="${today()}"></div>
    <div class="ff"><span class="flabel">Kyn</span><div class="opts" style="padding:0" role="group" aria-label="Kyn">${SEXES.map(([v, l]) =>
      `<button type="button" class="chip" data-act="aboutsex" data-v="${v}" aria-pressed="${(a.sex || '') === v && (v !== '' || a.sex !== undefined)}">${l}</button>`).join('')}</div></div>
    <div class="fgrid">
      ${numField('ab_height', 'Hæð', 'cm', a.heightCm)}
      ${withFirst ? numField('ab_weight', 'Þyngd', 'kg', null) : numField('ab_tw', 'Markþyngd', 'kg', a.targetWeight)}
      ${withFirst ? numField('ab_fat', 'Fituprósenta', '%', null) : numField('ab_tf', 'Markfituprósenta', '%', a.targetBodyFat)}
    </div>`;
}
function readAbout(){
  const pick = $('[data-act="aboutsex"][aria-pressed="true"]');
  const h = num($('#ab_height').value), tw = $('#ab_tw') ? num($('#ab_tw').value) : (about && about.targetWeight) || null, tf = $('#ab_tf') ? num($('#ab_tf').value) : (about && about.targetBodyFat) || null;
  const birth = $('#ab_birth').value || null;
  if (h != null && (h < 100 || h > 250)) { toast('Hæð þarf að vera á bilinu 100–250 cm'); return null; }
  if (birth && !ageOf(birth)) { toast('Athugaðu fæðingardaginn'); return null; }
  return { birthDate: birth, sex: pick ? (pick.dataset.v || null) : null, heightCm: h, targetWeight: tw, targetBodyFat: tf, updatedAt: new Date().toISOString() };
}
function saveAboutFrom(withFirst){
  const a = readAbout(); if (!a) return false;
  if (withFirst){
    const w = num($('#ab_weight').value), f = num($('#ab_fat').value);
    if (w != null && (w < 25 || w > 350)) { toast('Athugaðu þyngdina'); return false; }
    if (f != null && (f < 2 || f > 70)) { toast('Athugaðu fituprósentuna'); return false; }
    if (w != null || f != null){
      const m = { id: uid(), date: today(), weight: w, bodyFat: f, createdAt: new Date().toISOString() };
      measurements.push(m); Store.putMeasurement(me.uid, m).catch(fail('Vistun mælingar'));
    }
  }
  about = a; Store.saveAbout(me.uid, a).catch(fail('Vistun'));
  return true;
}
function openAbout(){
  openSheet('Um þig', `${privacyNote()}${aboutFields(about, false)}
    <p class="tiny">Fæðingardagur er notaður til að reikna aldur og áætla hámarkspúls. Hæð er notuð til að reikna BMI.</p>
    <button class="cta" data-act="aboutsave">Vista</button>`);
}
function openMeasure(id){
  const e = id ? measurements.find(x => x.id === id) : null, v = k => e ? e[k] : null;
  const main = BODY_METRICS.filter(m => !m.girth), girth = BODY_METRICS.filter(m => m.girth);
  const hasGirth = e && girth.some(m => e[m.key] != null);
  openSheet(e ? 'Breyta mælingu' : 'Ný mæling', `${privacyNote()}
    <div class="ff"><label for="ms_date">Dagsetning</label><input class="in" id="ms_date" type="date" value="${esc(e ? e.date : today())}" max="${today()}"></div>
    <div class="fgrid">${main.map(m => numField('ms_' + m.key, m.name, m.unit, v(m.key), '')).join('')}</div>
    <details class="girth" ${hasGirth ? 'open' : ''}><summary>Ummál</summary><div class="fgrid">${girth.map(m => numField('ms_' + m.key, m.name, m.unit, v(m.key))).join('')}</div></details>
    <div class="ff"><label for="ms_note">Athugasemd</label><input class="in" id="ms_note" value="${esc(e && e.note || '')}" placeholder="t.d. mælt á morgnana, fastandi"></div>
    <button class="cta" data-act="measuresave" data-id="${e ? esc(e.id) : ''}">Vista mælingu</button>
    ${e ? `<button class="btn ghost danger block" style="margin-top:8px" data-act="measuredel" data-id="${esc(e.id)}">Eyða mælingu</button>` : ''}`);
}
function saveMeasure(id){
  const m = { id: id || uid(), date: $('#ms_date').value || today(), note: ($('#ms_note').value || '').trim() || null,
    createdAt: (id && (measurements.find(x => x.id === id) || {}).createdAt) || new Date().toISOString() };
  let any = false;
  for (const def of BODY_METRICS){
    const v = num($('#ms_' + def.key).value);
    if (v != null && (v < def.min || v > def.max)) return toast(`${def.name} er utan eðlilegra marka (${def.min}–${def.max} ${def.unit})`);
    m[def.key] = v; if (v != null) any = true;
  }
  if (!any) return toast('Settu inn að minnsta kosti eina mælingu');
  const i = measurements.findIndex(x => x.id === m.id);
  if (i >= 0) measurements[i] = m; else measurements.push(m);
  Store.putMeasurement(me.uid, m).catch(fail('Vistun mælingar'));
  closeSheet(); render(); toast('Mæling vistuð');
}

function renderBody(){
  const a = about || {}, ms = measurements.slice().sort((x, y) => x.date.localeCompare(y.date));
  const age = ageOf(a.birthDate), sex = (SEXES.find(([v]) => v === a.sex) || [])[1];
  const metrics = allMetrics().filter(m => ms.some(e => mval(m, e) != null));
  if (!metrics.some(m => m.key === ui.bodyMetric)) ui.bodyMetric = metrics.length ? metrics[0].key : null;
  const profileBar = `<div class="glass aboutbar">
      <div><div class="l">Aldur</div><div class="v">${age != null ? `${age} <small>ára</small>` : '–'}</div></div>
      <div><div class="l">Hæð</div><div class="v">${a.heightCm ? `${nf(a.heightCm)} <small>cm</small>` : '–'}</div></div>
      <div><div class="l">Kyn</div><div class="v sm">${sex && a.sex ? sex : '–'}</div></div>
      <button class="roundbtn" data-act="aboutedit" aria-label="Breyta upplýsingum um þig"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>
    </div>`;
  if (!ms.length){
    view.innerHTML = `<h1 style="margin-top:6px">Framfarir</h1>${progressSeg()}${privacyNote()}${profileBar}
      <div class="glass empty" style="margin-top:12px"><b>Engar mælingar ennþá</b><p class="muted" style="margin:6px 0 14px">Skráðu þyngd, fituprósentu eða ummál reglulega, t.d. vikulega á sama tíma dags, og fylgstu með þróuninni hér.</p>
      <button class="btn primary" data-act="measurenew">Skrá fyrstu mælingu</button></div>`;
    return;
  }
  const latest = ms[ms.length - 1];
  const tile = m => {
    const pts = ms.filter(e => mval(m, e) != null); if (!pts.length) return '';
    const last = pts[pts.length - 1], lv = mval(m, last);
    const cutoff = ymd(addDays(parseYmd(last.date), -30));
    const base = [...pts].reverse().find(e => e.date <= cutoff) || (pts.length > 1 ? pts[0] : null);
    let delta = '';
    if (base && base !== last){ const dv = lv - mval(m, base), sign = dv > 0 ? '+' : dv < 0 ? '−' : '';
      delta = `${sign}${nf(Math.abs(dv), m.dec)}${m.unit && m.unit !== '%' ? ' ' + m.unit : m.unit} ${base.date <= cutoff ? 'á 30 dögum' : 'frá ' + fmtShort(base.date)}`; }
    const target = m.key === 'weight' ? a.targetWeight : m.key === 'bodyFat' ? a.targetBodyFat : null;
    const tgt = target ? `Markmið ${nf(target, m.dec)} ${m.unit}` : '';
    return `<button class="mtile glass" data-bm2="${m.key}" aria-pressed="${ui.bodyMetric === m.key}">
      <span class="l">${m.name}</span><span class="v">${nf(lv, m.dec)}${m.unit ? ` <small>${m.unit}</small>` : ''}</span>
      <span class="tiny">${delta || fmtShort(last.date)}${tgt ? `<br>${tgt}` : ''}</span></button>`;
  };
  const sel = metrics.find(m => m.key === ui.bodyMetric);
  const ranges = [['3m', '3 mán', 91], ['6m', '6 mán', 182], ['1y', '1 ár', 365], ['all', 'Allt', 0]];
  const rg = ranges.find(r => r[0] === ui.bodyRange) || ranges[0];
  const from = rg[2] ? ymd(addDays(new Date(), -rg[2])) : '0000';
  const series = ms.filter(e => e.date >= from && mval(sel, e) != null).map(e => ({ label: fmtShort(e.date), a: mval(sel, e) }));
  const target = sel.key === 'weight' ? a.targetWeight : sel.key === 'bodyFat' ? a.targetBodyFat : null;
  const fatMass = latest.weight && latest.bodyFat ? latest.weight * latest.bodyFat / 100 : null;
  view.innerHTML = `<h1 style="margin-top:6px">Framfarir</h1>${progressSeg()}
    ${privacyNote()}${profileBar}
    <button class="cta" data-act="measurenew">Skrá mælingu</button>
    <div class="mgrid">${metrics.map(tile).join('')}</div>
    <section class="glass" style="margin-top:12px;padding:14px 10px 8px">
      <div class="row-h" style="padding:0 6px"><b>${sel.name}</b><div class="opts" style="padding:0">${ranges.map(([k, l]) => `<button class="chip sm" data-brange="${k}" aria-pressed="${rg[0] === k}">${l}</button>`).join('')}</div></div>
      ${series.length ? lineChart(series, { color: 'var(--c-swim)', goal: target, unit: sel.unit, dec: sel.dec, aria: `Þróun: ${sel.name}` }) : `<p class="tiny" style="padding:12px 6px">Engar mælingar á þessu tímabili.</p>`}
      ${target ? `<div class="legend" style="padding:0 6px 4px"><span><i style="background:var(--c-swim)"></i>${sel.name}</span><span><i style="background:var(--ink-3)"></i>Markmið</span></div>` : ''}
    </section>
    ${fatMass ? `<div class="kv"><div class="glass"><div class="v">${nf(fatMass, 1)} kg</div><div class="l">Fitumassi</div></div><div class="glass"><div class="v">${nf(latest.weight - fatMass, 1)} kg</div><div class="l">Fitulaus massi</div></div></div>` : ''}
    <h2>Mælingar</h2>
    <ul class="list glass">${ms.slice().reverse().slice(0, 15).map(e => {
      const parts = BODY_METRICS.filter(m => e[m.key] != null).map(m => `${m.name.toLowerCase()} ${nf(e[m.key], m.dec)}${m.unit === '%' ? '%' : ' ' + m.unit}`);
      return `<li><button class="item" data-measure="${esc(e.id)}"><span class="bar" style="background:var(--c-swim)"></span>
        <span style="min-width:0"><div class="t">${e.weight != null ? `${nf(e.weight, 1)} kg` : (BODY_METRICS.find(m => e[m.key] != null) || {}).name || 'Mæling'}</div>
        <div class="s">${esc(parts.slice(e.weight != null ? 1 : 0, 4).join(', ') || (e.note || ''))}</div></span>
        <span class="d">${fmtDate(e.date)}</span></button></li>`; }).join('')}</ul>
    ${ms.length > 15 ? `<p class="tiny">Sýni síðustu 15 af ${ms.length} mælingum. Allar eru með í línuritunum og afritinu.</p>` : ''}`;
}
const progressSeg = () => `<div class="seg4 glass">${[['goals', 'Markmið'], ['lift', 'Lyftingar'], ['cardio', 'Íþróttir'], ['body', 'Líkaminn']].map(([k, l]) => `<button data-pm="${k}" aria-pressed="${ui.progMode === k}">${l}</button>`).join('')}</div>`;

/* ---------- Útflutningur gagna ---------- */
const XLSX_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const scriptLoads = {};
function loadScript(src, globalName){
  if (window[globalName]) return Promise.resolve(window[globalName]);
  return scriptLoads[src] || (scriptLoads[src] = new Promise((res, rej) => {
    const el = document.createElement('script'); el.src = src; el.async = true;
    el.onload = () => window[globalName] ? res(window[globalName]) : rej(new Error('script'));
    el.onerror = () => { delete scriptLoads[src]; rej(new Error('script')); };
    document.head.appendChild(el);
  }));
}
const r2 = (v, d = 2) => v == null || !isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d;
/* Hver tafla: dálkar með íslensku og ensku heiti, og raðir sem fylki af gildum (tölur haldast tölur) */
function exportTables(scope){
  const ownerOk = s => scope === 'both' ? true : s.profileId === me.uid;
  const sess = state.sessions.filter(ownerOk).slice().sort((a, b) => (a.date + (a.createdAt || '')).localeCompare(b.date + (b.createdAt || '')));
  const sessions = {
    name: 'Æfingar', file: 'aefingar',
    cols: [['Dagsetning','date'],['Nafn','person'],['Íþrótt','type'],['Heiti','title'],['Vegalengd','distance'],['Eining','unit'],['Tími (mín)','duration_min'],
      ['Tími','duration'],['Hraði','pace'],['Hraðaeining','pace_unit'],['Meðalpúls','avg_hr'],['Álag','effort'],['Fjöldi æfinga','exercises'],
      ['Fjöldi setta','sets'],['Heildarþyngd (kg)','volume_kg'],['Heitur pottur (mín)','hot_tub_min'],['Gufa (mín)','steam_min'],['Sauna (mín)','sauna_min'],
      ['Infrarauð sauna (mín)','infrared_min'],['Kaldi potturinn (mín)','cold_plunge_min'],['Hækkun (m)','elevation_m'],['Ferðir','runs'],
      ['Högg','golf_strokes'],['Par','golf_par'],['Miðað við par','golf_to_par'],['Punktar','golf_points'],['Völlur','course'],['Lengsti bolti (m)','longest_ball_m'],['Boltar','balls'],['Lotur','rounds'],['Erfiðasta leið','grade'],
      ['Sundlaug','pool'],['Box','box'],['WOD','wod'],['Personal best','personal_best'],['Álag (handvirkt)','intensity'],['Úrslit','result'],['Athugasemd','notes'],['Auðkenni','id']],
    rows: sess.map(s => { const T = TYPES[s.type] || TYPES.other, cfg = typeCfg(s.type, s.sub), p = paceText(s.type, s.distance, s.durationMin, s.sub), ef = effortOf(s);
      return [s.date, pname(s.profileId), T.name, titleOf(s), s.distance ?? null, s.distance != null ? cfg.unit : '', r2(s.durationMin, 1),
        s.durationMin != null ? fmtDur(s.durationMin) : '', p ? p.v : '', p ? p.l : '', s.avgHr ?? null, ef ? EFFORT[ef].name : '',
        s.type === 'lift' ? (s.exercises || []).length : null, s.type === 'lift' ? setCount(s) : null, s.type === 'lift' ? r2(sessionVolume(s), 1) : null,
        ...['hot', 'steam', 'sauna', 'infrared', 'cold'].map(k => { const t = spaTotals(s.spa).find(x => x.kind === k); return t ? r2(t.min, 1) : null; }),
        s.elevation ?? null, s.runs ?? null, s.score ?? null, s.par ?? null, s.score && s.par ? s.score - s.par : null, s.points ?? null, s.course || '', s.longest ?? null, s.balls ?? null, s.rounds ?? null, s.grade || '',
        s.pool || '', s.box || '', s.wod || '', (s.prs || []).map(p => `${p.name} ${pbText(p)}`).join('; '), s.intensity ? INTENSITY[s.intensity] : '', s.result || '',
        s.notes || '', s.id]; })
  };
  const sets = {
    name: 'Sett', file: 'sett',
    cols: [['Dagsetning','date'],['Nafn','person'],['Æfing','exercise'],['Vöðvahópur','muscle_group'],['Sett nr.','set'],['Þyngd (kg)','weight_kg'],
      ['Endurtekningar','reps'],['Rúmmál (kg)','volume_kg'],['Áætlað 1RM (kg)','est_1rm_kg'],['Auðkenni æfingar','session_id']],
    rows: sess.filter(s => s.type === 'lift').flatMap(s => (s.exercises || []).flatMap(e => {
      const ex = allEx().find(x => x.id === e.exId) || {};
      return e.sets.map((st, i) => { const kg = num(st.kg) ?? 0, reps = num(st.reps) ?? 0;
        return [s.date, pname(s.profileId), e.name || ex.name || '', ex.g || '', i + 1, kg, reps, r2(kg * reps, 1), r2(e1rm(kg, reps), 1), s.id]; });
    }))
  };
  const ms = measurements.slice().sort((a, b) => a.date.localeCompare(b.date));
  const meas = {
    name: 'Mælingar', file: 'maelingar',
    cols: [['Dagsetning','date'],['Þyngd (kg)','weight_kg'],['Fituprósenta','body_fat_pct'],['Vöðvamassi (kg)','muscle_kg'],['BMI','bmi'],
      ['Hvíldarpúls','resting_hr'],['Mittismál (cm)','waist_cm'],['Mjaðmamál (cm)','hips_cm'],['Brjóstmál (cm)','chest_cm'],
      ['Upphandleggur (cm)','arm_cm'],['Læri (cm)','thigh_cm'],['Athugasemd','notes']],
    rows: ms.map(e => [e.date, e.weight ?? null, e.bodyFat ?? null, e.muscle ?? null, r2(DERIVED[0].derive(e), 1), e.restingHr ?? null,
      e.waist ?? null, e.hips ?? null, e.chest ?? null, e.arm ?? null, e.thigh ?? null, e.note || ''])
  };
  return { sessions, sets, meas };
}
function toCsv(t, fmt){
  const is = fmt === 'is', sep = is ? ';' : ',';
  const cell = v => {
    if (v == null) return '';
    let s = typeof v === 'number' ? (is ? String(v).replace('.', ',') : String(v)) : String(v);
    if (s.includes(sep) || /["\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const head = t.cols.map(c => cell(is ? c[0] : c[1])).join(sep);
  return '\uFEFF' + [head, ...t.rows.map(r => r.map(cell).join(sep))].join('\r\n') + '\r\n';
}
async function deliverFile(blob, filename){
  if (downloadsCap){ try { await downloadsCap.save({filename, data: blob}); toast('Skrá vistuð'); } catch(e){ if (e && e.code !== 'declined') toast('Ekki tókst að vista skrána'); } return; }
  try {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000); toast(`${filename} sótt`);
  } catch(e){ toast('Ekki tókst að sækja skrána'); }
}
function openExport(){
  const t = exportTables(ui.exScope), hasPartner = !!partnerId();
  const lin = n => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'lína' : 'línur'}`;
  const row = (key, label, desc) => `<div class="srow"><span>${label}<div class="tiny">${desc}</div></span><button class="btn" data-act="excsv" data-t="${key}">CSV</button></div>`;
  openSheet('Flytja út gögn', `
    ${hasPartner ? `<div class="ff" style="margin-top:0"><span class="flabel">Hvaða æfingar?</span><div class="opts" style="padding:0">
      <button class="chip" data-act="exscope" data-v="mine" aria-pressed="${ui.exScope !== 'both'}">Mínar</button>
      <button class="chip" data-act="exscope" data-v="both" aria-pressed="${ui.exScope === 'both'}">Okkar beggja</button></div></div>` : ''}
    <div class="sec-h">Excel</div>
    <div class="glass sgroup"><div class="srow"><span>Allt í einni skrá (.xlsx)<div class="tiny">Flipar fyrir æfingar, sett og mælingar. Opnast í Excel, Google Sheets og Numbers.</div></span>
      <button class="btn primary" data-act="exxlsx">Sækja</button></div></div>
    <div class="sec-h">CSV, til að flytja annað</div>
    <div class="glass sgroup">
      <div class="sitem"><div class="slabel">Snið<div class="tiny">${ui.exFmt === 'intl' ? 'Kommur á milli dálka, punktur í tölum og ensk dálkaheiti. Hentar flestum öðrum forritum.' : 'Semíkomma á milli dálka og komma í tölum. Opnast rétt í Excel á íslensku.'}</div></div>
        <div class="opts"><button class="chip" data-act="exfmt" data-v="is" aria-pressed="${ui.exFmt !== 'intl'}">Íslenskt Excel</button><button class="chip" data-act="exfmt" data-v="intl" aria-pressed="${ui.exFmt === 'intl'}">Alþjóðlegt</button></div></div>
      ${row('sessions', 'Æfingar', `${lin(t.sessions.rows.length)}, ein á hverja æfingu`)}
      ${row('sets', 'Sett í lyftingum', `${lin(t.sets.rows.length)}, ein á hvert sett`)}
      ${row('meas', 'Mælingar', `${lin(t.meas.rows.length)}, aðeins þínar`)}
    </div>
    <div class="sec-h">Fullt afrit</div>
    <div class="glass sgroup"><div class="srow"><span>JSON-skrá<div class="tiny">Öll gögnin þín í einni skrá. Má lesa aftur inn í appið.</div></span><button class="btn" data-act="export">Sækja</button></div></div>
    <p class="tiny" style="margin-top:12px">Mælingar og upplýsingar um þig fylgja aðeins þínum eigin útflutningi.</p>`);
}
async function exportXlsx(){
  const t = exportTables(ui.exScope);
  toast('Útbý Excel-skrá…');
  let X;
  try { X = await loadScript(XLSX_SRC, 'XLSX'); } catch(e){ return toast('Náði ekki í Excel-hlutann. Athugaðu netið.'); }
  const wb = X.utils.book_new();
  [t.sessions, t.sets, t.meas].forEach(tb => {
    /* Dagsetningar verða raunverulegar dagsetningar í Excel svo hægt sé að raða og sía */
    const ws = X.utils.aoa_to_sheet([tb.cols.map(c => c[0]), ...tb.rows.map(r => [parseYmd(r[0]), ...r.slice(1)])], { cellDates: true, dateNF: 'yyyy-mm-dd' });
    ws['!cols'] = tb.cols.map((c, i) => ({ wch: Math.min(40, Math.max(c[0].length + 2, ...tb.rows.slice(0, 200).map(r => String(r[i] ?? '').length + 1))) }));
    X.utils.book_append_sheet(wb, ws, tb.name);
  });
  const out = X.write(wb, { bookType: 'xlsx', type: 'array' });
  deliverFile(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `aefingabokin-${today()}.xlsx`);
}
function exportCsv(key){
  const t = exportTables(ui.exScope)[key]; if (!t) return;
  if (!t.rows.length) return toast('Engin gögn í þessari töflu ennþá');
  deliverFile(new Blob([toCsv(t, ui.exFmt)], { type: 'text/csv;charset=utf-8' }), `aefingabokin-${t.file}-${today()}.csv`);
}

/* ---------- Markmið ---------- */
const ACTS_BASE = { all: 'Allar æfingar', heat: 'Gufa eða sauna', cold: 'Kaldi potturinn' };
const actsList = cur => ({ all: ACTS_BASE.all, ...Object.fromEntries(Object.keys(TYPES).filter(k => k !== 'other' && (sportOn(k) || k === cur)).map(k => [k, TYPES[k].name])), heat: ACTS_BASE.heat, cold: ACTS_BASE.cold });
const ACTS = new Proxy({}, { get: (_, k) => ACTS_BASE[k] || (TYPES[k] && TYPES[k].name) });
const actHasDist = a => a === 'all' || ['run', 'walk', 'hike', 'swim', 'bike', 'ski'].includes(a);
const FOCUS_TAGS = ['Styrkur', 'Þol', 'Hlaup', 'Sund', 'Vöðvamassi', 'Fitubrennsla', 'Liðleiki', 'Heilsa', 'Endurheimt', 'Keppni'];
const GOAL_TYPES = {
  weekly:   { name: 'Vikuleg venja', hint: 'T.d. 5 æfingar á viku eða sund einu sinni í viku', color: 'var(--c-walk)' },
  strength: { name: 'Styrkur',       hint: 'T.d. 100 kg í bekkpressu eða 80 kg × 5 í hnébeygju', color: 'var(--c-lift)' },
  runtime:  { name: 'Hraði',         hint: 'T.d. 10 km undir 50 mínútum', color: 'var(--c-run)' },
  total:    { name: 'Heildarmarkmið', hint: 'T.d. 500 km eða 150 æfingar fyrir áramót', color: 'var(--c-swim)' }
};
const yearEnd = () => `${new Date().getFullYear()}-12-31`;
const GOAL_PRESETS = [
  { label: '5 æfingar á viku',        g: { type: 'weekly', activity: 'all', metric: 'sessions', target: 5 } },
  { label: '3 æfingar á viku',        g: { type: 'weekly', activity: 'all', metric: 'sessions', target: 3 } },
  { label: 'Sund einu sinni í viku',  g: { type: 'weekly', activity: 'swim', metric: 'sessions', target: 1 } },
  { label: 'Hlaupa 20 km á viku',     g: { type: 'weekly', activity: 'run', metric: 'distance', target: 20 } },
  { label: '150 mínútur á viku',      g: { type: 'weekly', activity: 'all', metric: 'minutes', target: 150 } },
  { label: 'Kaldi potturinn 3 sinnum á viku', g: { type: 'weekly', activity: 'cold', metric: 'sessions', target: 3 } },
  { label: '5 km undir 25 mín',       g: { type: 'runtime', distance: 5, timeMin: 25 } },
  { label: '10 km undir 50 mín',      g: { type: 'runtime', distance: 10, timeMin: 50 } },
  { label: 'Bekkpressa 100 kg',       g: { type: 'strength', exId: 'x_bekkpressa', kg: 100, reps: 1 } },
  { label: '500 km fyrir áramót',     g: { type: 'total', activity: 'all', metric: 'distance', target: 500 } },
  { label: '150 æfingar fyrir áramót', g: { type: 'total', activity: 'all', metric: 'sessions', target: 150 } }
];
let myGoals = [], myGoalsLoaded = false, myGoalsUnsub = null, goalsBy = {}, goalUnsubs = {}, lastSaveAt = 0, goalDraft = null;
const plural = (n, one, many) => (Math.round(n) % 10 === 1 && Math.round(n) % 100 !== 11) ? one : many;
const distUnit = act => act === 'swim' ? 'm' : 'km';
function metricVal(g, s){
  if (g.activity === 'heat' || g.activity === 'cold'){
    const e = (s.spa || []).filter(x => g.activity === 'cold' ? x.kind === 'cold' : HEAT.includes(x.kind));
    if (!e.length) return 0;
    return g.metric === 'minutes' ? e.reduce((a, x) => a + (x.min || 0), 0) : g.metric === 'sessions' ? 1 : 0;
  }
  if (g.activity && g.activity !== 'all' && s.type !== g.activity) return 0;
  if (g.metric === 'sessions') return 1;
  if (g.metric === 'minutes') return s.durationMin || 0;
  if (g.metric === 'distance') return (g.activity === 'all' || !g.activity) ? kmOf(s) : (s.distance || 0);
  return 0;
}
/* Íslensk beyging: nf = nefnifall (í heiti), þf = þolfall (eftir „vantar“), þgf = þágufall (eftir „af“) */
const WORDS = {
  all:     { nf: ['æfing', 'æfingar'], þf: ['æfingu', 'æfingar'], þgf: ['æfingu', 'æfingum'] },
  act:     { nf: ['sinni', 'sinnum'],  þf: ['skipti', 'skipti'],  þgf: ['skipti', 'skiptum'] },
  minutes: { nf: ['mínúta', 'mínútur'], þf: ['mínútu', 'mínútur'], þgf: ['mínútu', 'mínútum'] }
};
function amountText(g, n, fall = 'nf'){
  const w = g.metric === 'sessions' ? (g.activity && g.activity !== 'all' ? WORDS.act : WORDS.all) : g.metric === 'minutes' ? WORDS.minutes : null;
  if (w) return `${nf(n)} ${plural(n, w[fall][0], w[fall][1])}`;
  return `${nf(n, 1)} ${distUnit(g.activity)}`;
}
function goalTitle(g){
  if (g.title) return g.title;
  const act = g.activity && g.activity !== 'all' ? ACTS[g.activity] : '';
  if (g.type === 'weekly') return `${act ? act + ' ' : ''}${amountText(g, g.target)} á viku`;
  if (g.type === 'strength') return `${g.exName || exName(g.exId)} ${nf(g.kg, 1)} kg${(g.reps || 1) > 1 ? ` × ${g.reps}` : ''}`;
  if (g.type === 'runtime') return `${nf(g.distance, 1)} km undir ${fmtDur(g.timeMin)}`;
  if (g.type === 'total') return `${act ? act + ': ' : ''}${amountText(g, g.target)} fyrir ${fmtDate(g.end)}`;
  return 'Markmið';
}
/* Reiknar framvindu markmiðs út frá eigin æfingum */
function computeGoal(g, list){
  const t = today();
  if (g.type === 'weekly'){
    const ws0 = weekStart(new Date());
    const weekVal = off => { const a = ymd(addDays(ws0, off * 7)), b = ymd(addDays(ws0, off * 7 + 6)); return list.filter(s => s.date >= a && s.date <= b).reduce((v, s) => v + metricVal(g, s), 0); };
    const cur = weekVal(0), weeks = [];
    for (let i = -7; i <= 0; i++) weeks.push(weekVal(i) >= g.target);
    let streak = 0; for (let i = -1; i > -105 && weekVal(i) >= g.target; i--) streak++;
    if (cur >= g.target) streak++;
    const left = g.target - cur;
    return { pct: cur / g.target, valueText: `${g.metric === 'distance' ? nf(cur, 1) : nf(cur)} af ${amountText(g, g.target, 'þgf')}`,
      sub: cur >= g.target ? 'Vikumarkmiði náð' : `Vantar ${amountText(g, left, 'þf')} í vikunni`, streak, weeks, achieved: false };
  }
  if (g.type === 'strength'){
    let best = null, first = null;
    list.filter(s => s.type === 'lift').sort((a, b) => a.date.localeCompare(b.date)).forEach(s => (s.exercises || []).filter(e => e.exId === g.exId).forEach(e => e.sets.forEach(st => {
      const kg = num(st.kg) || 0, r = num(st.reps) || 0;
      if (r >= (g.reps || 1)){ if (!best || kg > best.kg) best = { kg, reps: r, date: s.date }; if (!first && kg >= g.kg) first = s.date; }
    })));
    const achieved = !!(best && best.kg >= g.kg);
    return { pct: best ? best.kg / g.kg : 0, valueText: best ? `${nf(best.kg, 1)} kg${(g.reps || 1) > 1 ? ` × ${g.reps}` : ''}` : 'Ekkert skráð',
      sub: achieved ? `Náð ${fmtDate(first)}` : best ? `Vantar ${nf(g.kg - best.kg, 1)} kg. Besta: ${setTxt(best)}, ${fmtDate(best.date)}` : `Skráðu ${g.exName || exName(g.exId)} með ${g.reps || 1} ${plural(g.reps || 1, 'endurtekningu', 'endurtekningum')} eða fleiri`,
      achieved, achievedAt: first };
  }
  if (g.type === 'runtime'){
    let best = null, first = null;
    list.filter(s => s.type === 'run' && s.distance >= g.distance * 0.98 && s.durationMin).sort((a, b) => a.date.localeCompare(b.date)).forEach(s => {
      const proj = s.durationMin * g.distance / s.distance;
      if (!best || proj < best.proj) best = { proj, date: s.date };
      if (!first && proj <= g.timeMin + 1e-9) first = s.date;
    });
    const achieved = !!(best && best.proj <= g.timeMin + 1e-9);
    return { pct: best ? Math.min(1, g.timeMin / best.proj) : 0, valueText: best ? fmtDur(best.proj) : 'Enginn tími ennþá',
      sub: achieved ? `Náð ${fmtDate(first)}` : `${best ? `Vantar ${fmtDur(best.proj - g.timeMin)}. ` : ''}Hraði sem þarf: ${fmtDur(g.timeMin / g.distance)} mín/km`,
      achieved, achievedAt: first };
  }
  if (g.type === 'total'){
    const v = list.filter(s => s.date >= g.start && s.date <= g.end).reduce((a, s) => a + metricVal(g, s), 0);
    const span = Math.max(1, (parseYmd(g.end) - parseYmd(g.start)) / 86400000 + 1), gone = Math.min(span, Math.max(0, (parseYmd(t) - parseYmd(g.start)) / 86400000 + 1));
    const diff = v / g.target - gone / span, achieved = v >= g.target;
    return { pct: v / g.target, valueText: `${g.metric === 'distance' ? nf(v, 1) : nf(v)} af ${amountText(g, g.target, 'þgf')}`,
      sub: achieved ? 'Markmiði náð' : t > g.end ? 'Tímabilinu er lokið' : Math.abs(diff) < 0.02 ? 'Á áætlun' : `${Math.round(Math.abs(diff) * 100)}% ${diff > 0 ? 'á undan' : 'á eftir'} áætlun`,
      achieved, achievedAt: achieved ? t : null };
  }
  return { pct: 0, valueText: '', sub: '' };
}
const progOf = (g, owner) => owner === me.uid ? computeGoal(g, state.sessions.filter(s => s.profileId === me.uid)) : (g.progress || { pct: 0, valueText: '', sub: '' });
function ring(pct, size, color, inner){
  const r = (size - 9) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct || 0)), h = size / 2;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${Math.round(p * 100)}% náð">
    <circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="var(--hair)" stroke-width="${size > 90 ? 10 : 7}"/>
    <circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="${color}" stroke-width="${size > 90 ? 10 : 7}" stroke-linecap="round" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${h} ${h})"/>
    <text x="${h}" y="${h}" text-anchor="middle" dominant-baseline="central" style="font-size:${Math.round(size * (inner.length > 4 ? 0.2 : 0.26))}px;font-weight:800;fill:var(--ink)">${inner}</text></svg>`;
}
const FLAME = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c1 3.5-1.5 5-1.5 7.5 0 1.4 1 2.5 2.3 2.5 1.6 0 2.4-1.4 2-3.4 2.6 1.8 4.2 4.6 4.2 7.4 0 4.1-3.3 6-7 6s-7-2.2-7-6.2C5 10.6 10 8.1 12 2z"/></svg>';
const TROPHY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>';
function goalColor(g, p){ return g.status === 'achieved' || (p && p.achieved) ? 'var(--c-bike)' : (GOAL_TYPES[g.type] || GOAL_TYPES.weekly).color; }
function goalCard(g, owner, compact){
  const p = progOf(g, owner), achieved = g.status === 'achieved';
  const inner = achieved ? '✓' : `${Math.min(999, Math.round((p.pct || 0) * 100))}%`;
  const meta = [];
  if (g.type === 'weekly' && p.streak) meta.push(`<span class="gbadge streak">${FLAME}${p.streak} ${plural(p.streak, 'vika', 'vikur')} í röð</span>`);
  if (g.deadline && !achieved){ const dl = Math.round((parseYmd(g.deadline) - parseYmd(today())) / 86400000); meta.push(`<span class="gbadge">${dl < 0 ? 'Fresturinn liðinn' : dl === 0 ? 'Síðasti dagurinn' : `${dl} dagar eftir`}</span>`); }
  if (owner === me.uid && !g.shared) meta.push(`<span class="gbadge">${LOCK}Aðeins þú</span>`);
  if (achieved && g.achievedAt) meta.push(`<span class="gbadge gold">${TROPHY}${fmtDate(g.achievedAt)}</span>`);
  return `<button class="gcard glass" data-gopen="${esc(owner)}|${esc(g.id)}">
    ${ring(achieved ? 1 : p.pct, compact ? 54 : 66, goalColor(g, p), inner)}
    <span class="gbody"><span class="gt">${esc(goalTitle(g))}</span><span class="gv">${esc(p.valueText || '')}</span>
      ${compact ? '' : `<span class="gs">${esc(p.sub || '')}</span>`}
      ${g.type === 'weekly' && p.weeks && !compact ? `<span class="wdots" aria-label="Síðustu 8 vikur">${p.weeks.map((ok, i) => `<i class="${ok ? 'on' : ''} ${i === 7 ? 'cur' : ''}"></i>`).join('')}</span>` : ''}
      ${meta.length && !compact ? `<span class="gmeta">${meta.join('')}</span>` : ''}</span></button>`;
}
const activeGoals = list => list.filter(g => g.type !== 'focus' && g.status !== 'archived' && g.status !== 'achieved');
const focusOf = list => list.find(g => g.type === 'focus');
function focusCard(owner, list, editable){
  const f = focusOf(list);
  if (!f || (!f.text && !(f.tags || []).length)){
    return editable ? `<button class="focus glass" data-act="focusedit"><span class="fl">Áherslan þín</span><span class="ft muted">Hvað ertu að leggja áherslu á? T.d. „Undirbý Reykjavíkurmaraþonið“</span></button>` : '';
  }
  return `<${editable ? 'button' : 'div'} class="focus glass" ${editable ? 'data-act="focusedit"' : ''}>
    <span class="fl">${editable ? 'Áherslan þín' : 'Áhersla'}${editable && !f.shared ? `<span class="gbadge">${LOCK}Aðeins þú</span>` : ''}</span>
    ${f.text ? `<span class="ft">${esc(f.text)}</span>` : ''}
    ${(f.tags || []).length ? `<span class="ftags">${f.tags.map(x => `<span class="ftag">${esc(x)}</span>`).join('')}</span>` : ''}</${editable ? 'button' : 'div'}>`;
}
function renderGoals(){
  const act = activeGoals(myGoals).sort((a, b) => ['weekly', 'total', 'strength', 'runtime'].indexOf(a.type) - ['weekly', 'total', 'strength', 'runtime'].indexOf(b.type));
  const done = myGoals.filter(g => g.status === 'achieved').sort((a, b) => (b.achievedAt || '').localeCompare(a.achievedAt || ''));
  const arch = myGoals.filter(g => g.status === 'archived');
  view.innerHTML = `<h1 style="margin-top:6px">Framfarir</h1>${progressSeg()}
    ${focusCard(me.uid, myGoals, true)}
    <button class="cta" data-act="goalnew">Nýtt markmið</button>
    ${act.length ? `<div class="glist">${act.map(g => goalCard(g, me.uid)).join('')}</div>`
      : `<div class="glass empty" style="margin-top:12px"><b>Engin markmið ennþá</b><p class="muted" style="margin:6px 0 0">Settu þér markmið, t.d. að æfa fimm sinnum í viku eða hlaupa 10 km undir 50 mínútum. Appið fylgist sjálft með framvindunni út frá því sem þú skráir.</p></div>`}
    ${done.length ? `<h2>${TROPHY} Náð markmið</h2><div class="glist">${done.map(g => goalCard(g, me.uid)).join('')}</div>` : ''}
    ${arch.length ? `<details class="arch"><summary>Geymd markmið (${arch.length})</summary><div class="glist">${arch.map(g => goalCard(g, me.uid, true)).join('')}</div></details>` : ''}`;
}
function homeGoalsCard(){
  const act = activeGoals(myGoals).slice(0, 4);
  if (!act.length) return `<button class="glass gprompt" data-act="goalsopen">${TROPHY}<span><b>Settu þér markmið</b><span class="tiny">T.d. 5 æfingar á viku eða 10 km undir 50 mín</span></span></button>`;
  return `<section class="glass ghome"><div class="week-head" style="margin:0 0 8px"><b>Markmiðin þín</b><button class="btn ghost" data-act="goalsopen" style="min-height:36px;padding:0 6px">Öll</button></div>
    <div class="grow">${act.map(g => { const p = progOf(g, me.uid);
      return `<button class="gmini" data-gopen="${me.uid}|${esc(g.id)}">${ring(p.pct, 62, goalColor(g, p), `${Math.min(999, Math.round(p.pct * 100))}%`)}<span>${esc(goalTitle(g))}</span>${p.streak ? `<span class="tiny streak">${FLAME}${p.streak}</span>` : ''}</button>`; }).join('')}</div></section>`;
}

/* Markmiðaform */
function openGoalNew(){
  openSheet('Nýtt markmið', `<div class="flabel" style="margin-top:0">Fljótlegt</div>
    <div class="opts" style="padding:0 0 6px">${GOAL_PRESETS.map((p, i) => `<button class="chip" data-act="goalpreset" data-i="${i}">${p.label}</button>`).join('')}</div>
    <div class="flabel" style="margin-top:14px">Eða búðu til þitt eigið</div>
    <div class="types">${Object.entries(GOAL_TYPES).map(([k, t]) => `<button class="type glass" style="--tc:${t.color}" data-act="goaltype" data-t="${k}"><i></i><b>${t.name}</b><span>${t.hint}</span></button>`).join('')}</div>`);
}
function newGoalDraft(base){
  const g = { id: uid(), shared: true, status: 'active', start: today(), activity: 'all', metric: 'sessions', target: 5, reps: 1, ...base };
  if (g.type === 'total'){ g.start = g.start || today(); g.end = g.end || yearEnd(); }
  if (g.type === 'strength' && g.exId){ g.exName = exName(g.exId); }
  return g;
}
function openGoalForm(){
  const g = goalDraft, T = GOAL_TYPES[g.type], chip = (k, v, l) => `<button class="chip" data-act="gfset" data-k="${k}" data-v="${v}" aria-pressed="${String(g[k]) === String(v)}">${l}</button>`;
  let body = '';
  if (g.type === 'weekly' || g.type === 'total'){
    const unit = g.metric === 'sessions' ? (g.activity === 'all' ? 'æfingar' : 'skipti') : g.metric === 'minutes' ? 'mínútur' : distUnit(g.activity);
    body = `<div class="ff"><span class="flabel">Hvað?</span><div class="opts" style="padding:0">${Object.entries(actsList(g.activity)).map(([k, l]) => chip('activity', k, l)).join('')}</div></div>
      <div class="ff"><span class="flabel">Mælt í</span><div class="opts" style="padding:0">${chip('metric', 'sessions', 'Fjölda skipta')}${actHasDist(g.activity) ? chip('metric', 'distance', 'Vegalengd') : ''}${chip('metric', 'minutes', 'Mínútum')}</div></div>
      ${numField('gf_target', g.type === 'weekly' ? 'Markmið á viku' : 'Markmið alls', unit, g.target)}
      ${g.type === 'total' ? `<div class="fgrid"><div class="ff"><label for="gf_start">Frá</label><input class="in" type="date" id="gf_start" value="${esc(g.start)}"></div>
        <div class="ff"><label for="gf_end">Til</label><input class="in" type="date" id="gf_end" value="${esc(g.end)}"></div></div>` : ''}`;
  } else if (g.type === 'strength'){
    const recent = [...new Set(mySessions(me.uid).filter(s => s.type === 'lift').flatMap(s => (s.exercises || []).map(e => e.exId)))];
    const opts = [...recent.map(id => allEx().find(e => e.id === id)).filter(Boolean), ...allEx().filter(e => !recent.includes(e.id))];
    body = `<div class="ff"><label for="gf_ex">Æfing</label><select class="in" id="gf_ex">${opts.map(e => `<option value="${esc(e.id)}" ${e.id === g.exId ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select></div>
      <div class="fgrid">${numField('gf_kg', 'Þyngd', 'kg', g.kg)}${numField('gf_reps', 'Endurtekningar', 'reps', g.reps || 1)}</div>
      <div class="ff"><label for="gf_deadline">Lokadagur (valfrjálst)</label><input class="in" type="date" id="gf_deadline" value="${esc(g.deadline || '')}"></div>`;
  } else if (g.type === 'runtime'){
    body = `<div class="ff"><span class="flabel">Vegalengd</span><div class="opts" style="padding:0">${[[5, '5 km'], [10, '10 km'], [21.1, 'Hálfmaraþon'], [42.2, 'Maraþon']].map(([v, l]) => chip('distance', v, l)).join('')}</div></div>
      <div class="fgrid">${numField('gf_dist', 'Eða önnur vegalengd', 'km', g.distance)}
        <div class="ff"><label for="gf_time">Á tíma undir</label><div class="unitwrap"><input class="in" id="gf_time" inputmode="decimal" placeholder="50:00" value="${g.timeMin ? fmtDur(g.timeMin) : ''}"><span class="unit">mm:ss</span></div></div></div>
      <div class="ff"><label for="gf_deadline">Lokadagur (valfrjálst)</label><input class="in" type="date" id="gf_deadline" value="${esc(g.deadline || '')}"></div>`;
  }
  openSheet(T.name, `${body}
    <div class="ff"><label for="gf_title">Eigið heiti (valfrjálst)</label><input class="in" id="gf_title" value="${esc(g.title || '')}" placeholder="${esc(goalTitle({ ...g, title: '' }))}"></div>
    <label class="srow" style="padding:14px 0 0"><span><b>Sýna vinum og maka</b><div class="tiny">Birtist á prófílnum þínum. Annars sérð aðeins þú markmiðið.</div></span>
      <input type="checkbox" class="switch" id="gf_shared" ${g.shared ? 'checked' : ''}></label>
    <button class="cta" data-act="goalsave">${myGoals.some(x => x.id === g.id) ? 'Vista breytingar' : 'Setja markmið'}</button>`);
}
function readGoalForm(){
  const g = goalDraft, v = id => { const el = $('#' + id); return el ? el.value : null; };
  if (v('gf_target') != null) g.target = num(v('gf_target'));
  if (v('gf_start') != null) g.start = v('gf_start'); if (v('gf_end') != null) g.end = v('gf_end');
  if (v('gf_ex') != null){ g.exId = v('gf_ex'); g.exName = exName(g.exId); }
  if (v('gf_kg') != null) g.kg = num(v('gf_kg')); if (v('gf_reps') != null) g.reps = Math.max(1, Math.round(num(v('gf_reps')) || 1));
  if (v('gf_dist') != null && num(v('gf_dist'))) g.distance = num(v('gf_dist'));
  if (v('gf_time') != null) g.timeMin = parseDur(v('gf_time'));
  if (v('gf_deadline') != null) g.deadline = v('gf_deadline') || null;
  if (v('gf_title') != null) g.title = v('gf_title').trim() || null;
  const sh = $('#gf_shared'); if (sh) g.shared = sh.checked;
}
function saveGoal(){
  readGoalForm(); const g = goalDraft;
  if ((g.type === 'weekly' || g.type === 'total') && !(g.target > 0)) return toast('Settu inn markmið');
  if (g.type === 'total' && (!g.start || !g.end || g.end < g.start)) return toast('Athugaðu dagsetningarnar');
  if (g.type === 'strength' && !(g.kg > 0)) return toast('Settu inn þyngd');
  if (g.type === 'runtime' && !(g.distance > 0 && g.timeMin > 0)) return toast('Settu inn vegalengd og tíma, t.d. 50:00');
  if (!actHasDist(g.activity) && g.metric === 'distance') g.metric = 'sessions';
  const p = computeGoal(g, state.sessions.filter(s => s.profileId === me.uid));
  if (g.type !== 'weekly'){ g.status = p.achieved ? 'achieved' : 'active'; g.achievedAt = p.achieved ? (p.achievedAt || today()) : null; }
  g.progress = progressSnap(p); g.updatedAt = new Date().toISOString(); g.createdAt = g.createdAt || g.updatedAt;
  const i = myGoals.findIndex(x => x.id === g.id); if (i >= 0) myGoals[i] = { ...g }; else myGoals.push({ ...g });
  Store.putGoal(me.uid, { ...g }, false).catch(fail('Vistun markmiðs'));
  if (i < 0) bump('totals', { goals: { [g.type]: 1 }, ...(g.status === 'achieved' ? { goalsAchieved: { [g.type]: 1 } } : {}) });
  goalDraft = null; closeSheet(); ui.tab = 'progress'; ui.progMode = 'goals'; render();
  toast(p.achieved && g.type !== 'weekly' ? 'Þessu markmiði er þegar náð!' : 'Markmið sett');
}
function progressSnap(p){
  const snap = { pct: Math.round((p.pct || 0) * 1000) / 1000, valueText: p.valueText || '', sub: p.sub || '', streak: p.streak || 0, weeks: p.weeks || null };
  snap.sig = hashStr(JSON.stringify(snap)); return snap;
}
function openGoal(owner, gid){
  const list = owner === me.uid ? myGoals : (goalsBy[owner] || []), g = list.find(x => x.id === gid); if (!g) return;
  const p = progOf(g, owner), achieved = g.status === 'achieved', own = owner === me.uid;
  const kud = g.kudos || {}, n = Object.keys(kud).length, mine = !!kud[me.uid];
  openSheet(own ? 'Markmið' : `${nameOf(owner)}: markmið`, `
    <div class="gdetail">${ring(achieved ? 1 : p.pct, 132, goalColor(g, p), achieved ? '✓' : `${Math.min(999, Math.round(p.pct * 100))}%`)}
      <h2 style="margin:12px 0 2px;text-align:center">${esc(goalTitle(g))}</h2>
      <div class="muted" style="text-align:center">${esc(p.valueText || '')}</div>
      <div class="tiny" style="text-align:center;margin-top:4px">${esc(p.sub || '')}</div>
      ${g.type === 'weekly' && p.weeks ? `<div class="wdots big" aria-label="Síðustu 8 vikur">${p.weeks.map((ok, i) => `<span><i class="${ok ? 'on' : ''} ${i === 7 ? 'cur' : ''}"></i><small>${i === 7 ? 'Nú' : `−${7 - i}`}</small></span>`).join('')}</div>
        ${p.streak ? `<div class="streakbig">${FLAME}${p.streak} ${plural(p.streak, 'vika', 'vikur')} í röð</div>` : ''}` : ''}
      ${achieved && g.achievedAt ? `<div class="streakbig gold">${TROPHY}Náð ${fmtDate(g.achievedAt)}</div>` : ''}
    </div>
    ${n ? `<p class="tiny" style="text-align:center">Hrós: ${Object.values(kud).map(v => `${REACTS[kReact(v)].e} ${esc(kName(v))}`).join(', ')}</p>` : ''}
    ${own ? `<div class="glass sgroup" style="margin-top:12px">
        <label class="srow"><span><b>Sýna vinum og maka</b></span><input type="checkbox" class="switch" data-gshare="${esc(g.id)}" ${g.shared ? 'checked' : ''}></label>
      </div>
      <div class="grid2" style="margin-top:12px"><button class="btn" data-act="goaledit" data-id="${esc(g.id)}">Breyta</button>
        <button class="btn" data-act="goalarch" data-id="${esc(g.id)}">${g.status === 'archived' ? 'Virkja aftur' : 'Geyma'}</button></div>
      <button class="btn ghost danger block" style="margin-top:8px" data-act="goaldel" data-id="${esc(g.id)}">Eyða markmiði</button>`
    : `<button class="cta ${mine ? 'on' : ''}" data-gkudos="${esc(owner)}|${esc(g.id)}" aria-pressed="${mine}" aria-haspopup="true">${mine ? `${REACTS[kReact(kud[me.uid])].e} Þú hrósaðir` : `${HAND} Hrósa`}</button>`}`);
}
function openFocus(){
  const f = focusOf(myGoals) || { id: '_focus', type: 'focus', text: '', tags: [], shared: true };
  goalDraft = { ...f, tags: [...(f.tags || [])] };
  openSheet('Áherslan þín', `<div class="ff" style="margin-top:0"><label for="fo_text">Hvað ertu að leggja áherslu á?</label>
      <input class="in" id="fo_text" maxlength="80" value="${esc(f.text || '')}" placeholder="T.d. Undirbý Reykjavíkurmaraþonið"></div>
    <div class="ff"><span class="flabel">Merki (mest 3)</span><div class="opts" style="padding:0" id="fo_tags">${FOCUS_TAGS.map(t => `<button class="chip" data-act="focustag" data-t="${esc(t)}" aria-pressed="${goalDraft.tags.includes(t)}">${t}</button>`).join('')}</div></div>
    <label class="srow" style="padding:14px 0 0"><span><b>Sýna vinum og maka</b><div class="tiny">Birtist efst á prófílnum þínum</div></span><input type="checkbox" class="switch" id="fo_shared" ${f.shared !== false ? 'checked' : ''}></label>
    <button class="cta" data-act="focussave">Vista</button>`);
}
function saveFocus(){
  const f = { ...goalDraft, id: '_focus', type: 'focus', text: ($('#fo_text').value || '').trim(), shared: $('#fo_shared').checked, updatedAt: new Date().toISOString() };
  const i = myGoals.findIndex(x => x.id === '_focus'); if (i >= 0) myGoals[i] = f; else myGoals.push(f);
  Store.putGoal(me.uid, f, false).catch(fail('Vistun'));
  goalDraft = null; closeSheet(); render(); toast('Áhersla vistuð');
}
/* Prófíll annars notanda (vinar eða maka) */
function openProfile(uid_){
  if (uid_ === me.uid){ closeSheet(); ui.tab = 'progress'; ui.progMode = 'goals'; render(); window.scrollTo(0, 0); return; }
  const list = goalsBy[uid_] || [], acts = actsOf(uid_), ws = ymd(weekStart(new Date()));
  const wk = acts.filter(a => a.date >= ws), km = wk.reduce((v, a) => v + kmOf(a), 0);
  const act = activeGoals(list), done = list.filter(g => g.status === 'achieved').sort((a, b) => (b.achievedAt || '').localeCompare(a.achievedAt || ''));
  openSheet(nameOf(uid_), `<div class="pheader">${avatar(uid_, 84)}<div><div class="pname">${esc(nameOf(uid_))}</div>
      <div class="tiny">${state.profiles.some(p => p.id === uid_) ? 'Maki' : 'Vinur'}</div></div></div>
    ${focusCard(uid_, list, false)}
    <div class="aboutbar flat glass" style="border-radius:20px;margin-top:10px">
      <div><div class="l">Æfingar í viku</div><div class="v">${wk.length}</div></div>
      <div><div class="l">Km í viku</div><div class="v">${nf(km, 1)}</div></div>
      <div><div class="l">Náð markmið</div><div class="v">${done.length}</div></div></div>
    ${act.length ? `<h2>Markmið</h2><div class="glist">${act.map(g => goalCard(g, uid_)).join('')}</div>` : `<p class="tiny" style="margin-top:14px">${esc(nameOf(uid_))} hefur ekki deilt neinum markmiðum.</p>`}
    ${done.length ? `<h2>${TROPHY} Náð</h2><div class="glist">${done.slice(0, 5).map(g => goalCard(g, uid_, true)).join('')}</div>` : ''}`);
}
/* Fagnaðarskjár */
function celebrate(title, sub){
  const colors = ['var(--c-lift)', 'var(--c-run)', 'var(--c-walk)', 'var(--c-swim)', 'var(--c-bike)', 'var(--c-other)'];
  const el = document.createElement('div'); el.className = 'celebrate'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', title);
  el.innerHTML = `<div class="confetti" aria-hidden="true">${Array.from({ length: 36 }, (_, i) => `<span style="left:${(i * 37) % 100}%;background:${colors[i % colors.length]};animation-delay:${(i % 9) * 0.08}s;animation-duration:${1.6 + (i % 5) * 0.25}s;transform:rotate(${i * 23}deg)"></span>`).join('')}</div>
    <div class="cbox glass"><div class="ctrophy">${TROPHY}</div><h2>${esc(title)}</h2><p>${esc(sub)}</p><button class="cta" data-act="closecel">Æðislegt</button></div>`;
  document.body.appendChild(el);
}
/* Heldur framvindu markmiða á prófílnum í takt við æfingarnar (vinir sjá þetta yfirlit) */
function syncGoals(){
  if (!myGoalsLoaded || !me || !Store.putGoal) return;
  const mine = state.sessions.filter(s => s.profileId === me.uid), recent = Date.now() - lastSaveAt < 120000;
  myGoals.filter(g => g.type !== 'focus' && g.status !== 'archived').forEach(g => {
    const p = computeGoal(g, mine), snap = progressSnap(p), patch = {};
    if (!g.progress || g.progress.sig !== snap.sig){
      patch.progress = snap;
      if (g.type === 'weekly' && recent && (g.progress ? g.progress.pct : 0) < 1 && snap.pct >= 1) celebrate('Vikumarkmiði náð!', goalTitle(g));
    }
    if (g.type !== 'weekly' && p.achieved && g.status !== 'achieved'){
      patch.status = 'achieved'; patch.achievedAt = p.achievedAt || today(); bump('totals', { goalsAchieved: { [g.type]: 1 } });
      if (recent) celebrate('Markmiði náð!', goalTitle(g));
    }
    if (Object.keys(patch).length){ Object.assign(g, patch); Store.putGoal(me.uid, { id: g.id, ...patch }, true).catch(e => console.warn(e)); }
  });
}
function attachGoals(){
  if (!Store.subscribeGoals || myGoalsUnsub) return;
  myGoalsUnsub = Store.subscribeGoals(me.uid, true, list => { myGoals = list; myGoalsLoaded = true; scheduleSync(); softRender(); }, e => console.warn('goals', e));
}
function refreshGoalSubs(){
  if (!Store.subscribeGoals) return;
  const want = new Set(circle().filter(u => u !== me.uid));
  want.forEach(u => { if (!goalUnsubs[u]) goalUnsubs[u] = Store.subscribeGoals(u, false, list => { goalsBy[u] = list; softRender(); }, e => console.warn('goals', u, e)); });
  Object.keys(goalUnsubs).forEach(u => { if (!want.has(u)){ goalUnsubs[u](); delete goalUnsubs[u]; delete goalsBy[u]; } });
}
function detachGoals(){
  if (myGoalsUnsub){ myGoalsUnsub(); myGoalsUnsub = null; }
  Object.values(goalUnsubs).forEach(f => f()); goalUnsubs = {}; goalsBy = {}; myGoals = []; myGoalsLoaded = false;
}

/* ---------- Innlestur úr úrum ---------- */
const WATCH = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="6.5"/><path d="M9 6.2L9.6 2.5h4.8l.6 3.7M9 17.8l.6 3.7h4.8l.6-3.7M12 9.3V12l1.8 1.2"/><path d="M18.5 11v2"/></svg>';
const SOURCE_NAMES = { garmin: 'Garmin', apple: 'Apple Watch', strava: 'Strava', gpx: 'GPX-skrá', tcx: 'TCX-skrá' };
let importState = null;
function pickImportFile(){
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.csv,.gpx,.tcx,.xml,.fit,.zip,text/csv,application/xml,text/xml,application/gpx+xml';
  inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) runImport(f); };
  inp.click();
}
async function runImport(file){
  openSheet('Les skrá', `<div class="impload"><div class="spin" aria-hidden="true"></div><p class="muted" id="impprog">Les ${esc(file.name)}…</p>
    <p class="tiny">Skráin er lesin í símanum. Aðeins æfingarnar eru vistaðar.</p></div>`);
  try {
    const res = await readImportFile(file, p => { const el = $('#impprog'); if (el) el.textContent = `Les ${file.name}… ${Math.round(p * 100)}%`; });
    const mine = state.sessions.filter(s => s.profileId === me.uid);
    const keys = new Set(mine.map(s => s.importKey).filter(Boolean));
    const items = res.items.filter(it => it && it.date && TYPES[it.type]).map(it => {
      const dupe = keys.has(it.importKey) || mine.some(s => s.importKey && s.date === it.date && s.type === it.type && (
        (it.distance && s.distance && Math.abs(s.distance - it.distance) / it.distance < 0.05) ||
        (it.durationMin && s.durationMin && Math.abs(s.durationMin - it.durationMin) < 3)));
      /* Handskráð æfing sama dag, sömu íþrótt og svipaðrar lengdar: gögnin úr úrinu eru nákvæmari og taka við */
      const merge = dupe ? null : mine.find(s => !s.importKey && s.date === it.date && s.type === it.type && (
        (it.distance && s.distance && Math.abs(s.distance - it.distance) / it.distance <= 0.2) ||
        (!s.distance && it.durationMin && s.durationMin && Math.abs(s.durationMin - it.durationMin) <= 15) ||
        (!s.distance && !s.durationMin)));
      return { ...it, dupe, merge: merge ? merge.id : null, pick: !dupe };
    }).sort((a, b) => (b.startISO || b.date).localeCompare(a.startISO || a.date));
    if (!items.length) return openSheet('Engar æfingar fundust', `<p class="muted" style="margin-top:0">Skráin var lesin en engar æfingar fundust í henni. Athugaðu að þetta sé rétt skrá, sjá leiðbeiningarnar.</p>
      <button class="btn block" data-act="importhelp">Sjá leiðbeiningar</button>`);
    importState = { source: res.source, items, range: items.length > 40 ? '30' : 'all' };
    renderImportPreview();
  } catch(e){
    const msg = { zip: 'Þetta er þjöppuð skrá (.zip). Opnaðu hana fyrst í Skrám (Files) til að afþjappa, og veldu svo skrána inni í henni, t.d. export.xml eða activities.csv.',
      fit: '.fit-skrár eru ekki studdar ennþá. Í Garmin Connect má í staðinn velja „Export to TCX“ eða „Export to GPX“ á æfingunni.',
      'csv-unknown': 'Þessi CSV-skrá er ekki þekkt. Studdar eru Activities.csv úr Garmin Connect og activities.csv úr Strava.',
      format: 'Þessi skráartegund er ekki studd. Veldu .csv, .gpx, .tcx eða export.xml.' }[e && e.code];
    openSheet('Gat ekki lesið skrána', `<p class="muted" style="margin-top:0">${esc(msg || 'Eitthvað fór úrskeiðis við lesturinn. Prófaðu aftur eða aðra skrá.')}</p>
      <button class="btn block" data-act="importhelp">Sjá leiðbeiningar</button>`);
  }
}
function renderImportPreview(){
  const st = importState, since = st.range === 'all' ? '0000' : ymd(addDays(new Date(), -parseInt(st.range, 10)));
  const shown = st.items.filter(it => it.date >= since), picked = shown.filter(it => it.pick).length;
  openSheet(`Úr ${SOURCE_NAMES[st.source] || 'skrá'}`, `
    <div class="opts" style="padding:0 0 8px">${[['7', 'Síðustu 7 dagar'], ['30', 'Síðustu 30 dagar'], ['all', 'Allt']].map(([k, l]) => `<button class="chip" data-act="imprange" data-v="${k}" aria-pressed="${st.range === k}">${l}</button>`).join('')}</div>
    <p class="tiny" style="margin:0 0 6px">${shown.length} ${shown.length % 10 === 1 && shown.length % 100 !== 11 ? 'æfing fannst' : 'æfingar fundust'}. Æfingar sem eru þegar komnar úr úrinu eru ekki valdar. Ef þú skráðir sömu æfingu sjálfur taka nákvæmari tölur úrsins við, en athugasemdir, laug, gufa og hrós haldast.</p>
    <ul class="implist glass">${shown.map(it => { const i = st.items.indexOf(it), k = TYPES[it.type] ? it.type : 'other';
      return `<li><label class="impitem"><input type="checkbox" data-impi="${i}" ${it.pick ? 'checked' : ''}>
        <span class="impic" style="color:${tc(k)}">${sportIcon(k, 20)}</span>
        <span class="impt"><b>${esc(titleOf(it))}</b><span class="tiny">${fmtDate(it.date)}${sessionParts(it).length ? ', ' + esc(sessionParts(it).slice(0, 3).join(', ')) : ''}</span>
          ${it.dupe ? '<span class="impdup">Virðist þegar skráð</span>' : ''}
          ${it.merge ? (() => { const o = state.sessions.find(x => x.id === it.merge); return `<span class="impmerge">Uppfærir handskráða æfingu${o && o.distance ? ` (${nf(o.distance, 2)} → ${nf(it.distance || o.distance, 2)} ${typeCfg(o.type, o.sub).unit})` : ''}</span>`; })() : ''}</span></label></li>`; }).join('')}</ul>
    <button class="cta" data-act="impgo" ${picked ? '' : 'disabled'}>Lesa inn ${picked} ${picked % 10 === 1 && picked % 100 !== 11 ? 'æfingu' : 'æfingar'}</button>
    <p class="tiny" style="text-align:center">Lyftingar úr úri koma inn með tíma. Sett og þyngdir má bæta við með því að opna æfinguna.</p>`);
}
function doImport_(){
  const st = importState; if (!st) return;
  const since = st.range === 'all' ? '0000' : ymd(addDays(new Date(), -parseInt(st.range, 10))), now = new Date().toISOString();
  const picked = st.items.filter(it => it.pick && it.date >= since);
  /* Uppfæra handskráðar æfingar með gögnum úr úrinu */
  const merged = picked.filter(it => it.merge).map(it => {
    const o = state.sessions.find(x => x.id === it.merge); if (!o) return null;
    const s = { ...o, distance: it.distance ?? o.distance ?? null, durationMin: it.durationMin ? Math.round(it.durationMin * 60) / 60 : (o.durationMin ?? null),
      avgHr: it.avgHr ? Math.round(it.avgHr) : (o.avgHr ?? null), elevation: it.elevation || o.elevation || null, source: it.source, importKey: it.importKey, updatedAt: now };
    if (s.type === 'run') delete s.effortAuto;
    const i = state.sessions.findIndex(x => x.id === o.id); state.sessions[i] = s; Store.putSession(hid, s).catch(fail('Uppfærsla'));
    return s;
  }).filter(Boolean);
  const list = picked.filter(it => !it.merge).map(it => {
    const s = { id: uid(), profileId: me.uid, type: it.type, sub: it.sub || firstSub(it.type), date: it.date, title: it.title || null,
      distance: it.distance ?? null, durationMin: it.durationMin ? Math.round(it.durationMin * 60) / 60 : null, avgHr: it.avgHr ? Math.round(it.avgHr) : null,
      elevation: it.elevation || null, notes: '', source: it.source, importKey: it.importKey, createdAt: it.startISO || now, updatedAt: now, createdBy: me.uid, share: null };
    if (s.type === 'lift') s.exercises = [];
    if (s.type === 'golf') s.sub = 'h18';
    return s;
  });
  if (!list.length && !merged.length) return;
  state.sessions.push(...list.map(s => ({ ...s })));
  if (list.length){ Store.importAll(hid, list, []).then(() => {}).catch(fail('Innlestur')); trackSessions(list); }
  importState = null; closeSheet(); ui.tab = 'home'; render(); window.scrollTo(0, 0);
  toast([list.length ? `${list.length} ${list.length % 10 === 1 && list.length % 100 !== 11 ? 'æfing lesin' : 'æfingar lesnar'} inn` : '', merged.length ? `${merged.length} ${merged.length % 10 === 1 && merged.length % 100 !== 11 ? 'uppfærð' : 'uppfærðar'} með gögnum úr úrinu` : ''].filter(Boolean).join(', '));
}
function openImportHelp(tab){
  const t = tab || ui.importHelp || 'samsung'; ui.importHelp = t;
  const tabs = [['samsung', 'Galaxy Watch'], ['garmin', 'Garmin'], ['strava', 'Strava og önnur'], ['apple', 'Apple Watch']];
  const steps = {
    garmin: `<p class="muted">Best að gera í tölvu, á connect.garmin.com.</p>
      <div class="hstep"><b>Margar æfingar í einu</b><ol><li>Farðu í <i>Activities → All Activities</i>.</li><li>Ýttu á <i>Export CSV</i> efst til hægri. Skráin <i>Activities.csv</i> vistast.</li><li>Hér: <i>Velja skrá</i> og veldu hana.</li></ol></div>
      <div class="hstep"><b>Ein æfing, með hækkun</b><ol><li>Opnaðu æfinguna og ýttu á tannhjólið.</li><li>Veldu <i>Export to TCX</i> (eða GPX).</li><li>Veldu skrána hér.</li></ol></div>`,
    apple: `<p class="muted">Allt gert í iPhone. Fyrsti útflutningur getur tekið nokkrar mínútur.</p>
      <div class="hstep"><ol><li>Opnaðu <i>Heilsa</i> (Health) og ýttu á myndina þína efst.</li><li>Veldu <i>Flytja út öll heilsugögn</i> (Export All Health Data) og vistaðu í <i>Skrár</i> (Files).</li>
        <li>Í Skrám: ýttu á <i>export.zip</i> til að afþjappa.</li><li>Hér: <i>Velja skrá</i> og veldu <i>export.xml</i> í möppunni.</li></ol></div>
      <p class="tiny">Aðeins æfingarnar (Workouts) eru lesnar. Önnur heilsugögn eru hvorki lesin né vistuð. Veldu svo t.d. síðustu 7 daga.</p>`,
    samsung: `<p class="muted">Galaxy Watch vistar æfingar í Samsung Health.</p>
      <div class="hstep"><b>Í dag</b><ol><li>Tengdu Samsung Health við Strava (Samsung Health → Stillingar → tengd þjónusta).</li><li>Fylgdu svo leiðbeiningunum undir <i>Strava og önnur</i>.</li></ol></div>
      <div class="hstep"><b>Bráðlega</b><p>Android-útgáfa appsins mun sækja æfingarnar sjálfkrafa úr úrinu í gegnum Health Connect, án skráa.</p></div>`,
    strava: `<p class="muted">Flest úr (Garmin, Coros, Polar, Suunto, Wahoo, Galaxy Watch) geta sent æfingar á Strava. Þaðan má lesa allt inn í einu.</p>
      <div class="hstep"><ol><li>Á strava.com: <i>Settings → My Account → Download or Delete Your Account → Request Your Archive</i>.</li>
        <li>Þú færð tölvupóst með zip-skrá. Afþjappaðu hana.</li><li>Hér: <i>Velja skrá</i> og veldu <i>activities.csv</i>.</li></ol></div>
      <div class="hstep"><b>Ein æfing</b><p>Opnaðu æfinguna á strava.com, ýttu á <i>…</i> og <i>Export GPX</i>, og veldu skrána hér.</p></div>`
  };
  openSheet('Sækja æfingar úr úri', `<div class="chips" role="tablist">${tabs.map(([k, l]) => `<button class="chip" role="tab" data-act="imphelptab" data-v="${k}" aria-pressed="${t === k}">${l}</button>`).join('')}</div>
    <div class="helpbody">${steps[t]}</div>
    <p class="tiny">Skrár sem virka: Activities.csv (Garmin), activities.csv (Strava), export.xml (Apple), .tcx og .gpx. Það sama er ekki lesið inn tvisvar.</p>
    <button class="cta" data-act="importopen">Velja skrá</button>`);
}

/* ---------- Nafnlaus notkunartölfræði (fyrir stjórnborðið) ----------
   Sendir aðeins samtölur, t.d. „ein hlaupaæfing í viðbót“. Engin nöfn, engin auðkenni, engin gildi úr mælingum. */
const statsOn = () => settings.analytics !== 'off' && !!Store.bump && !!me;
function trackSignup(){
  if (!newSignup) return; newSignup = false;
  const sp = {}; settings.sports.forEach(k => sp[k] = 1);
  bump('totals', { users: 1, platform: { [platformOf()]: 1 }, sportsSelected: sp, visibility: { [visOf(me.uid)]: 1 }, aboutFilled: about && (about.birthDate || about.heightCm) ? 1 : 0,
    appearance: { [`weekStyle_${settings.weekStyle}`]: 1, [`palette_${settings.palette}`]: 1, [`theme_${settings.theme}`]: 1 } });
  bump(dayKey(), { newUsers: 1 });
}
function bump(doc, counts){ if (statsOn()) Store.bump(doc, counts).catch(() => {}); }
const dayKey = (d = new Date()) => `day-${ymd(d)}`;
function weekKey(d = new Date()){
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1)), w = Math.ceil(((x - y0) / 86400000 + 1) / 7);
  return `${x.getUTCFullYear()}-W${String(w).padStart(2, '0')}`;
}
const platformOf = () => /android/i.test(navigator.userAgent) ? 'android' : /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : 'desktop';
const standalone = () => { try { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch(e){ return false; } };
function sessionCounts(list){
  const t = { sessions: list.length, sessionsByType: {} };
  list.forEach(s => {
    t.sessionsByType[s.type] = (t.sessionsByType[s.type] || 0) + 1;
    if (s.sub){ t.subs = t.subs || {}; t.subs[`${s.type}_${s.sub}`] = (t.subs[`${s.type}_${s.sub}`] || 0) + 1; }
    if (s.type === 'lift') (s.exercises || []).forEach(e => { if (/^x_/.test(e.exId)){ t.exercises = t.exercises || {}; t.exercises[e.exId] = (t.exercises[e.exId] || 0) + 1; } });
    spaTotals(s.spa).forEach(x => { t.spa = t.spa || {}; t.spa[x.kind] = (t.spa[x.kind] || 0) + 1; });
    (s.prs || []).forEach(p => { t.cfPbs = t.cfPbs || {}; const k = p.key.startsWith('c:') ? 'Annað' : p.name; t.cfPbs[k] = (t.cfPbs[k] || 0) + 1; });
    if (s.pool){ t.pools = t.pools || {}; t.pools[s.pool] = (t.pools[s.pool] || 0) + 1; }
    if (s.source){ t.imports = t.imports || {}; t.imports[s.source] = (t.imports[s.source] || 0) + 1; }
    if (s.type === 'run' && effortOf(s)){ t.runEffort = t.runEffort || {}; t.runEffort[effortOf(s)] = (t.runEffort[effortOf(s)] || 0) + 1; }
  });
  return t;
}
function trackSessions(list){
  if (!list.length) return;
  bump('totals', sessionCounts(list));
  const h = new Date().getHours(), byType = {}; list.forEach(s => byType[s.type] = (byType[s.type] || 0) + 1);
  bump(dayKey(), { sessions: list.length, sessionsByType: byType, hours: { [h]: list.length } });
}
/* Einu sinni á dag: virkur notandi í dag og í vikunni, og hvort hann er enn virkur X vikum eftir nýskráningu */
async function activePing(){
  if (!statsOn()) return;
  const k = 'aefingabokin.ping.' + me.uid, last = JSON.parse(LS.get(k) || '{}'), t = today(), wk = weekKey();
  if (last.day === t) return;
  bump(dayKey(), { active: 1, platform: { [platformOf()]: 1 }, installed: standalone() ? 1 : 0 });
  if (last.week !== wk){
    bump(`week-${wk}`, { active: 1 });
    try {
      const meta = Store.getUserMeta ? await Store.getUserMeta(me.uid) : {};
      if (meta.joinedAt){ const j = new Date(meta.joinedAt), weeks = Math.floor((weekStart(new Date()) - weekStart(j)) / (7 * 86400000));
        if (weeks >= 0 && weeks <= 26) bump('cohorts', { [weekKey(j)]: { [`w${weeks}`]: 1 } }); }
    } catch(e){}
  }
  LS.set(k, JSON.stringify({ day: t, week: wk }));
}
function trackAppearance(key, from, to){ if (from !== to) bump('totals', { appearance: { [`${key}_${to}`]: 1, [`${key}_${from}`]: -1 } }); }

/* ---------- Athugasemdir við æfingar ---------- */
const MAX_WORDS = 40, MAX_CHARS = 280;
const wordCount = t => (String(t).trim().match(/\S+/g) || []).length;
let commentsBy = {}, commentSub = null, commentKey = null, inbox = [], inboxUnsub = null;
function timeAgo(iso){
  const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
  if (m < 1) return 'rétt í þessu'; if (m < 60) return `fyrir ${m} mín`;
  const h = Math.round(m / 60); if (h < 24) return `fyrir ${h} klst`;
  const d = Math.round(h / 24); return d === 1 ? 'í gær' : d < 7 ? `fyrir ${d} dögum` : fmtDate(iso.slice(0, 10));
}
/* Hlustar á athugasemdir einnar æfingar meðan hún er opin */
function watchComments(owner, sid, onUpdate){
  const key = `${owner}/${sid}`;
  if (commentKey === key) return;
  if (commentSub){ commentSub(); commentSub = null; }
  commentKey = key;
  if (!Store.subscribeComments) return;
  commentSub = Store.subscribeComments(owner, sid, list => { commentsBy[key] = list; onUpdate(); }, e => console.warn('comments', e));
}
function stopComments(){ if (commentSub){ commentSub(); commentSub = null; } commentKey = null; }
function quickReplies(a, own){
  if (own) return ['Takk! 🙌', 'Endilega komdu með næst', 'Þetta var erfitt en gaman'];
  const t = a && a.type;
  return [t === 'run' || t === 'hike' || t === 'bike' ? 'Flottur hraði! 🔥' : t === 'lift' ? 'Sterkur! 💪' : 'Vel gert! 👏',
    'Hvernig gekk?', 'Má ég koma með næst?'];
}
function commentsBlock(owner, sid, a){
  const key = `${owner}/${sid}`, list = commentsBy[key] || [], own = owner === me.uid;
  return `<section class="cmts" data-ckey="${esc(key)}">
    <div class="cmh"><b>Athugasemdir</b>${list.length ? `<span class="tiny">${list.length}</span>` : ''}</div>
    ${list.length ? `<ul class="cmlist">${list.map(c => `<li class="cm ${c.from === me.uid ? 'mine' : ''}">${avatar(c.from, 30, c.name)}
      <div class="cmb"><div class="cmm"><b>${esc(c.from === me.uid ? 'Þú' : c.name)}</b><span class="tiny">${timeAgo(c.at)}</span></div><p>${esc(c.text)}</p></div>
      ${c.from === me.uid || own ? `<button class="xbtn" data-act="cmdel" data-owner="${esc(owner)}" data-sid="${esc(sid)}" data-cid="${esc(c.id)}" aria-label="Eyða athugasemd">${ICON.x}</button>` : ''}</li>`).join('')}</ul>`
      : `<p class="tiny" style="margin:4px 0 10px">${own ? 'Engar athugasemdir ennþá.' : `Skrifaðu eitthvað hvetjandi til ${esc(nameOf(owner))}.`}</p>`}
    <div class="cmquick">${quickReplies(a, own).map(q => `<button class="chip sm" data-act="cmquick" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    <div class="cmform"><textarea class="in" id="cmtext" rows="2" maxlength="${MAX_CHARS}" placeholder="Skrifa athugasemd…" aria-label="Athugasemd"></textarea>
      <button class="cmsend" data-act="cmsend" data-owner="${esc(owner)}" data-sid="${esc(sid)}" aria-label="Senda" disabled>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>
    <div class="cmcount tiny" id="cmcount">0 / ${MAX_WORDS} orð</div>
  </section>`;
}
function refreshComments(){
  const box = document.querySelector('.cmts'); if (!box) return;
  const [owner, sid] = box.dataset.ckey.split('/'), txt = $('#cmtext'), keep = txt ? txt.value : '';
  const focused = txt && document.activeElement === txt;
  const a = owner === me.uid ? null : actsOf(owner).find(x => x.id === sid);
  box.outerHTML = commentsBlock(owner, sid, a);
  const nt = $('#cmtext'); if (nt){ nt.value = keep; updateCount(); if (focused) nt.focus(); }
}
function updateCount(){
  const t = $('#cmtext'), c = $('#cmcount'), b = $('[data-act="cmsend"]'); if (!t || !c) return;
  const w = wordCount(t.value), over = w > MAX_WORDS;
  c.textContent = `${w} / ${MAX_WORDS} orð`; c.classList.toggle('over', over);
  if (b) b.disabled = !t.value.trim() || over;
}
function sendComment(owner, sid){
  const t = $('#cmtext'); if (!t) return;
  const text = t.value.trim().replace(/\s+\n/g, '\n'); if (!text) return;
  if (wordCount(text) > MAX_WORDS) return toast(`Hámark ${MAX_WORDS} orð`);
  const at = new Date().toISOString(), c = { id: uid(), from: me.uid, name: pname(me.uid), text: text.slice(0, MAX_CHARS), at };
  const key = `${owner}/${sid}`; commentsBy[key] = [...(commentsBy[key] || []), c];
  const a = owner === me.uid ? null : actsOf(owner).find(x => x.id === sid);
  const s0 = owner === me.uid ? state.sessions.find(x => x.id === sid) : null;
  const what = a ? actTitle(a) : s0 ? titleOf(s0) : 'æfingu';
  const note = owner !== me.uid ? { kind: 'comment', from: me.uid, name: c.name, sid, text: c.text, what, at, read: false } : null;
  Store.addComment(owner, sid, c, note).catch(fail('Athugasemd'));
  bump('totals', { comments: 1 });
  t.value = ''; refreshComments();
}
/* Athugasemdir við eigin æfingu, opnaðar úr tilkynningu */
function openOwnComments(sid){
  const s0 = state.sessions.find(x => x.id === sid) || (shared[me.uid] || []).find(x => x.id === sid);
  if (!s0) return toast('Æfingin fannst ekki');
  watchComments(me.uid, sid, refreshComments);
  openSheet(titleOf(s0), `<p class="muted" style="margin-top:0">${fmtDate(s0.date)}, ${esc(sessionParts(s0).slice(0, 3).join(', '))}</p>${commentsBlock(me.uid, sid, null)}`);
  const unread = inbox.filter(n => !n.read && n.sid === sid).map(n => n.id);
  if (unread.length && Store.markRead){ inbox.forEach(n => { if (unread.includes(n.id)) n.read = true; }); Store.markRead(me.uid, unread).catch(() => {}); }
}
function commentCard(){
  if (state.active !== me.uid) return '';
  const un = inbox.filter(n => n.kind === 'comment' && !n.read); if (!un.length) return '';
  const n = un[0], more = un.length - 1;
  return `<button class="glass kcard ccard" data-act="cmopen" data-sid="${esc(n.sid)}">${avatar(n.from, 36, n.name)}
    <span><b>${esc(n.name)}</b> skrifaði við ${esc(String(n.what || 'æfingu').toLowerCase())}: „${esc(n.text.length > 70 ? n.text.slice(0, 70) + '…' : n.text)}“
      ${more ? `<span class="tiny" style="display:block">og ${more} ${more % 10 === 1 && more % 100 !== 11 ? 'önnur athugasemd' : 'aðrar athugasemdir'}</span>` : ''}</span>${ICON.r}</button>`;
}

/* ---------- Ábendingar ---------- */
const APP_VERSION = '2.1';
const FB_TYPES = { idea: { name: 'Hugmynd', desc: 'Viðbót eða breyting sem væri gaman að sjá', ph: 'T.d. væri gott að geta…' },
  bug: { name: 'Villa', desc: 'Eitthvað virkar ekki eins og það á að gera', ph: 'Hvað gerðist, og hvað áttirðu von á?' },
  other: { name: 'Annað', desc: 'Hrós, spurning eða annað', ph: 'Skrifaðu hér…' } };
let fbDraft = { type: 'idea', text: '', contact: false };
function openFeedback(type){
  if (type) fbDraft.type = type;
  const t = FB_TYPES[fbDraft.type];
  openSheet('Senda ábendingu', `
    <div class="fbtypes" role="radiogroup" aria-label="Tegund">${Object.entries(FB_TYPES).map(([k, o]) => `<button class="fbtype" role="radio" data-act="fbtype" data-v="${k}" aria-checked="${fbDraft.type === k}">
      <span class="fbic" aria-hidden="true">${k === 'idea' ? '💡' : k === 'bug' ? '🐞' : '💬'}</span><b>${o.name}</b><span class="tiny">${o.desc}</span></button>`).join('')}</div>
    <div class="ff"><label for="fbtext">${fbDraft.type === 'bug' ? 'Lýstu villunni' : fbDraft.type === 'idea' ? 'Hugmyndin þín' : 'Skilaboð'}</label>
      <textarea class="in" id="fbtext" rows="5" maxlength="1500" placeholder="${t.ph}">${esc(fbDraft.text)}</textarea>
      <div class="tiny" id="fbcount" style="text-align:right;margin-top:4px">${fbDraft.text.length} / 1500</div></div>
    ${fbDraft.type === 'bug' ? `<p class="tiny" style="margin:6px 2px 0">Með fylgir útgáfa appsins (${APP_VERSION}), tegund tækis og hvaða skjár var opinn, til að auðvelda leitina að villunni.</p>` : ''}
    <label class="srow" style="padding:14px 0 0"><span><b>Það má hafa samband við mig</b><div class="tiny">${me && me.email ? `Netfangið ${esc(me.email)} fylgir með.` : 'Netfangið þitt fylgir með.'} Annars er ábendingin nafnlaus.</div></span>
      <input type="checkbox" class="switch" id="fbcontact" ${fbDraft.contact ? 'checked' : ''}></label>
    <button class="cta" data-act="fbsend" ${fbDraft.text.trim() ? '' : 'disabled'}>Senda</button>`);
}
function sendFeedback(){
  const text = ($('#fbtext').value || '').trim(); if (!text) return;
  const contact = $('#fbcontact').checked;
  const fb = { type: fbDraft.type, text: text.slice(0, 1500), version: APP_VERSION, platform: platformOf(), installed: standalone(),
    screen: fbDraft.type === 'bug' ? `${prevTab || 'home'}${ui.progMode && prevTab === 'progress' ? '/' + ui.progMode : ''}` : null };
  if (contact && me){ fb.uid = me.uid; fb.email = me.email || null; fb.name = pname(me.uid); }
  (Store.sendFeedback ? Store.sendFeedback(fb) : Promise.resolve()).catch(fail('Sending'));
  fbDraft = { type: 'idea', text: '', contact: false };
  openSheet('Takk fyrir!', `<div class="askshare"><div class="ascheck">${HAND}</div><h2 style="margin:10px 0 4px">Ábendingin er komin til skila</h2>
    <p class="muted" style="margin:0 0 14px">Allar ábendingar eru lesnar og hjálpa til við að gera appið betra.${contact ? ' Við höfum samband ef þarf.' : ''}</p></div>
    <button class="btn block" data-act="sheetclose">Loka</button>`);
}
/* ---------- Sundlaugar ---------- */
const poolColl = (() => { try { return new Intl.Collator('is', { sensitivity: 'base' }); } catch(e){ return { compare: (a, b) => a.localeCompare(b) }; } })();
const POOL_SORTED = POOLS.slice().sort((a, b) => poolColl.compare(a[0], b[0]));
const poolRegion = name => (POOLS.find(p => p[0] === name) || [])[1] || '';
function poolCounts(pid){
  const c = {}; state.sessions.filter(x => x.profileId === pid && x.pool).forEach(x => c[x.pool] = (c[x.pool] || 0) + 1); return c;
}
let poolQuery = '';
function openPoolPicker(){
  poolQuery = '';
  openSheet('Veldu sundlaug', `<input class="in" id="poolq" placeholder="Leita, t.d. Vesturbæjarlaug eða Akureyri" autocomplete="off" aria-label="Leita að sundlaug"><div id="poollist"></div>`);
  const q = $('#poolq'); q.addEventListener('input', () => { poolQuery = q.value; drawPools(); }); drawPools();
}
function drawPools(){
  const el = $('#poollist'); if (!el || !draft) return;
  const counts = poolCounts(draft.profileId), term = fold(poolQuery.trim());
  const match = n => !term || fold(n[0] + ' ' + n[1]).includes(term);
  const custom = Object.keys(counts).filter(n => !POOLS.some(p => p[0] === n)).map(n => [n, 'Þín laug']);
  const mine = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || poolColl.compare(a, b)).map(n => [n, poolRegion(n) || 'Þín laug']).filter(match);
  const all = [...POOL_SORTED, ...custom].filter(p => match(p) && !counts[p[0]]);
  const exact = [...POOLS, ...custom].some(p => fold(p[0]) === term);
  const row = (p, n) => `<li><button data-pool="${esc(p[0])}" aria-pressed="${draft.pool === p[0]}"><span><b>${esc(p[0])}</b><span class="tiny">${esc(p[1])}</span></span>
    ${n ? `<span class="pcount">${n} ${n % 10 === 1 && n % 100 !== 11 ? 'ferð' : 'ferðir'}</span>` : ''}</button></li>`;
  el.innerHTML = (term && !exact ? `<button class="btn primary block" style="margin-top:12px" data-pool="${esc(poolQuery.trim())}">Nota „${esc(poolQuery.trim())}“</button>` : '') +
    (draft.pool ? `<button class="btn ghost block" style="margin-top:8px" data-pool="">Engin laug valin</button>` : '') +
    (mine.length ? `<div class="grp">Laugarnar þínar</div><ul class="pick pools">${mine.map(p => row(p, counts[p[0]])).join('')}</ul>` : '') +
    (all.length ? `<div class="grp">${mine.length ? 'Allar laugar' : 'Sundlaugar og baðlón'}</div><ul class="pick pools">${all.map(p => row(p, 0)).join('')}</ul>` : (term && !mine.length ? '<p class="tiny">Engin laug fannst. Notaðu heitið sem þú skrifaðir hér að ofan.</p>' : ''));
}
function poolStats(){
  const counts = poolCounts(state.active), names = Object.keys(counts); if (!names.length) return '';
  const visited = names.filter(n => POOLS.some(p => p[0] === n)).length, top = names.sort((a, b) => counts[b] - counts[a]).slice(0, 5);
  return `<div class="glass" style="grid-column:span 2"><div class="l" style="margin-bottom:6px">Laugarnar þínar</div>
    ${top.map(n => `<div class="spastat"><span>${esc(n)}</span><b>${counts[n]}</b><span class="tiny">${counts[n] % 10 === 1 && counts[n] % 100 !== 11 ? 'ferð' : 'ferðir'}</span></div>`).join('')}
    <div class="tiny" style="margin-top:8px">Þú hefur farið í <b>${visited} af ${POOLS.length}</b> sundlaugum og baðlónum landsins.</div></div>`;
}

/* ---------- CrossFit: WOD, árangur, Rx og benchmark-met ---------- */
const WOD_FORMATS = { fortime: 'For time', amrap: 'AMRAP', emom: 'EMOM', tabata: 'Tabata', other: 'Annað' };
const BENCHMARKS = {
  'Fran':   { f: 'fortime', d: '21-15-9: Thrusters (43/29 kg) og upphífingar' },
  'Grace':  { f: 'fortime', d: '30 clean & jerk (61/43 kg)' },
  'Isabel': { f: 'fortime', d: '30 snörun (61/43 kg)' },
  'Diane':  { f: 'fortime', d: '21-15-9: Réttstöðulyfta (102/70 kg) og handstöðuarmbeygjur' },
  'Helen':  { f: 'fortime', d: '3 umferðir: 400 m hlaup, 21 ketilbjöllusveiflur (24/16 kg), 12 upphífingar' },
  'Karen':  { f: 'fortime', d: '150 wall balls (9/6 kg)' },
  'Annie':  { f: 'fortime', d: '50-40-30-20-10: Double-unders og kviðkreppur' },
  'Jackie': { f: 'fortime', d: '1000 m róður, 50 thrusters (20 kg), 30 upphífingar' },
  'Nancy':  { f: 'fortime', d: '5 umferðir: 400 m hlaup, 15 overhead squats (43/29 kg)' },
  'DT':     { f: 'fortime', d: '5 umferðir: 12 réttstöðulyftur, 9 hang power clean, 6 push jerk (70/47 kg)' },
  'Murph':  { f: 'fortime', d: '1,6 km hlaup, 100 upphífingar, 200 armbeygjur, 300 hnébeygjur, 1,6 km hlaup (vesti 9/6 kg)' },
  'Cindy':  { f: 'amrap', d: 'AMRAP 20 mín: 5 upphífingar, 10 armbeygjur, 15 hnébeygjur' },
  'Filthy Fifty': { f: 'fortime', d: '50 af hverju: kassastökk, jumping pull-ups, ketilbjöllusveiflur, framstig, knees-to-elbows, push press, bakfettur, wall balls, burpees, double-unders' }
};
const isWod = d => d && d.type === 'class' && d.sub === 'crossfit';
function wodResult(s){
  if (!s) return '';
  if (s.wodFormat === 'fortime' && s.resTime) return fmtDur(s.resTime);
  if (s.wodFormat === 'amrap' && (s.resRounds != null || s.resReps != null)) return `${s.resRounds || 0} umf.${s.resReps ? ` + ${s.resReps}` : ''}`;
  if (s.resScore) return String(s.resScore);
  return '';
}
/* Hærra er betra nema í For time þar sem lægri tími vinnur */
function wodScore(s){
  if (s.wodFormat === 'fortime') return s.resTime ? -s.resTime : null;
  if (s.wodFormat === 'amrap') return (s.resRounds != null || s.resReps != null) ? (s.resRounds || 0) * 1000 + (s.resReps || 0) : null;
  const n = num(s.resScore); return n;
}
function wodPrev(s){
  const key = String(s.wod || '').trim().toLowerCase(); if (!key) return [];
  return state.sessions.filter(x => x.profileId === s.profileId && x.id !== s.id && isWod(x) && String(x.wod || '').trim().toLowerCase() === key
    && x.wodFormat === s.wodFormat && (x.rx || 'rx') === (s.rx || 'rx') && wodScore(x) != null);
}
/* Framfarir: benchmark-WOD og bestu tímar */
function wodStats(){
  const all = mySessions().filter(x => isWod(x) && x.wod && wodScore(x) != null); if (!all.length) return '';
  const groups = {};
  all.forEach(x => { const k = `${x.wod}|${x.wodFormat}`; (groups[k] = groups[k] || []).push(x); });
  const rows = Object.values(groups).map(list => { const rx = list.filter(x => (x.rx || 'rx') === 'rx'), pool = rx.length ? rx : list;
    const best = pool.reduce((m, x) => wodScore(x) > wodScore(m) ? x : m); return { best, n: list.length }; })
    .sort((a, b) => (BENCHMARKS[b.best.wod] ? 1 : 0) - (BENCHMARKS[a.best.wod] ? 1 : 0) || b.n - a.n).slice(0, 12);
  const rxShare = Math.round(all.filter(x => (x.rx || 'rx') === 'rx').length / all.length * 100);
  return `<h2>WOD og met</h2><div class="glass" style="overflow:hidden"><table class="tbl"><thead><tr><th>WOD</th><th>Besta</th><th>Skipti</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td><b>${esc(r.best.wod)}</b><div class="tiny">${WOD_FORMATS[r.best.wodFormat] || ''}</div></td><td>${esc(wodResult(r.best))} <span class="tiny">${r.best.rx === 'scaled' ? 'Scaled' : 'Rx'}, ${fmtDate(r.best.date)}</span></td><td>${r.n}</td></tr>`).join('')}
    </tbody></table></div><p class="tiny">${rxShare}% WOD-a tekin Rx. Bestu tímar miðast við Rx ef það hefur verið gert.</p>`;
}
function wodEditor(){
  const d = draft, fmt = d.wodFormat || 'fortime', chip = (act, v, l, on) => `<button class="chip" data-act="${act}" data-v="${esc(v)}" aria-pressed="${on}">${l}</button>`;
  const prev = d.wod ? wodPrev({ ...d, wodFormat: fmt }) : [];
  const best = prev.length ? prev.reduce((m, x) => wodScore(x) > wodScore(m) ? x : m) : null;
  let res = '';
  if (fmt === 'fortime') res = `<div class="ff"><label for="cf_resTime">Tími</label><div class="unitwrap"><input class="in" id="cf_resTime" data-field="resTime" inputmode="decimal" placeholder="t.d. 4:32" value="${esc(d.resTime ?? '')}"><span class="unit">mm:ss</span></div></div>`;
  else if (fmt === 'amrap') res = `<div class="fgrid">
      <div class="ff"><label for="cf_resRounds">Umferðir</label><div class="unitwrap"><input class="in" id="cf_resRounds" data-field="resRounds" inputmode="numeric" placeholder="t.d. 18" value="${esc(d.resRounds ?? '')}"><span class="unit">umf.</span></div></div>
      <div class="ff"><label for="cf_resReps">Aukareps</label><div class="unitwrap"><input class="in" id="cf_resReps" data-field="resReps" inputmode="numeric" placeholder="t.d. 7" value="${esc(d.resReps ?? '')}"><span class="unit">reps</span></div></div></div>`;
  else res = `<div class="ff"><label for="cf_resScore">Árangur</label><input class="in" id="cf_resScore" data-field="resScore" placeholder="${fmt === 'emom' ? 't.d. 120 reps eða kláraði öll' : fmt === 'tabata' ? 't.d. 95 (lægsta umferð × 8)' : 't.d. 245 reps'}" value="${esc(d.resScore ?? '')}"></div>`;
  return `<section class="glass wodbox">
    <div class="wodh"><b>WOD</b><span class="tiny">Æfing dagsins</span></div>
    <div class="chips" role="group" aria-label="Benchmark WOD">${Object.keys(BENCHMARKS).map(n => chip('wodpick', n, n, d.wod === n)).join('')}</div>
    <div class="ff" style="margin-top:6px"><label for="cf_wod">Heiti</label><input class="in" id="cf_wod" data-field="wod" list="wodnames" placeholder="t.d. Fran eða WOD dagsins" value="${esc(d.wod ?? '')}">
      <datalist id="wodnames">${[...new Set(state.sessions.filter(x => isWod(x) && x.wod).map(x => x.wod))].map(n => `<option value="${esc(n)}">`).join('')}</datalist></div>
    <div class="ff"><span class="flabel">Snið</span><div class="opts" style="padding:0">${Object.entries(WOD_FORMATS).map(([k, l]) => chip('wodfmt', k, l, fmt === k)).join('')}</div></div>
    ${res}
    <div class="ff"><span class="flabel">Útfærsla</span><div class="opts" style="padding:0">${chip('wodrx', 'rx', 'Rx', (d.rx || 'rx') === 'rx')}${chip('wodrx', 'scaled', 'Scaled', d.rx === 'scaled')}</div></div>
    ${best ? `<div class="wodbest">Besta hingað til: <b>${esc(wodResult(best))}</b> ${best.rx === 'scaled' ? 'Scaled' : 'Rx'}, ${fmtDate(best.date)}</div>` : ''}
    <div class="ff"><label for="cf_wodDesc">Æfingin</label><textarea class="in" id="cf_wodDesc" data-field="wodDesc" rows="3" placeholder="t.d. 21-15-9: Thrusters 43 kg og upphífingar">${esc(d.wodDesc ?? '')}</textarea></div>
  </section>`;
}
function strengthEditor(){
  const exs = draft.exercises || [];
  return `<section class="glass wodbox">
    <div class="wodh"><b>Styrktarhluti</b><span class="tiny">Valfrjálst. Telur með í lyftingaframförum.</span></div>
    ${exs.map((e, ei) => `<div class="stex"><div class="row-h"><b>${esc(e.name || exName(e.exId))}</b><button class="xbtn" data-act="strm" data-ei="${ei}" aria-label="Fjarlægja">${ICON.x}</button></div>
      ${(() => { const lp = lastPerformance(e.exId, draft.id, draft.profileId); return lp ? `<div class="tiny">Síðast: ${lp.sets.map(setTxt).join(', ')}</div>` : ''; })()}
      ${e.sets.map((st, si) => `<div class="strow"><span class="sn">${si + 1}</span>
        <span class="unitwrap"><input class="in" data-sei="${ei}" data-ssi="${si}" data-sk="kg" inputmode="decimal" value="${esc(fmtIn(st.kg))}" aria-label="kg"><span class="unit">kg</span></span>
        <span class="unitwrap"><input class="in" data-sei="${ei}" data-ssi="${si}" data-sk="reps" inputmode="numeric" value="${esc(st.reps ?? '')}" aria-label="reps"><span class="unit">reps</span></span>
        <button class="xbtn" data-act="strmset" data-ei="${ei}" data-si="${si}" aria-label="Eyða setti">${ICON.x}</button></div>`).join('')}
      <button class="addset" data-act="straddset" data-ei="${ei}">+ Sett</button></div>`).join('')}
    <button class="btn block" data-act="pickex">+ Bæta við lyftu</button>
  </section>`;
}

/* ---------- CrossFit: personal best ---------- */
/* [lykill, heiti, tegund] þar sem tegund er kg (hærra betra), time (lægra betra), reps (hærra betra) eða rounds (umferðir + reps) */
const CF_PB = [
  ['backsquat', 'Back squat', 'kg'], ['bench', 'Bekkpressa', 'kg'], ['clean', 'Clean', 'kg'], ['cnj', 'Clean & jerk', 'kg'],
  ['deadlift', 'Deadlift', 'kg'], ['frontsquat', 'Front squat', 'kg'], ['ohs', 'Overhead squat', 'kg'], ['powerclean', 'Power clean', 'kg'],
  ['powersnatch', 'Power snatch', 'kg'], ['pushjerk', 'Push jerk', 'kg'], ['pushpress', 'Push press', 'kg'], ['snatch', 'Snatch', 'kg'],
  ['strictpress', 'Strict press', 'kg'], ['thruster', 'Thruster', 'kg'],
  ['pullups', 'Upphífingar (max)', 'reps'], ['t2b', 'Toes-to-bar (max)', 'reps'], ['barmu', 'Bar muscle-ups (max)', 'reps'],
  ['ringmu', 'Ring muscle-ups (max)', 'reps'], ['hspu', 'HSPU (max)', 'reps'], ['du', 'Double-unders (unbroken)', 'reps'], ['pushups', 'Armbeygjur (max)', 'reps'],
  ['row500', 'Róður 500 m', 'time'], ['row2k', 'Róður 2000 m', 'time'], ['ski1k', 'SkiErg 1000 m', 'time'], ['run1k', 'Hlaup 1 km', 'time'],
  ['fran', 'Fran', 'time'], ['grace', 'Grace', 'time'], ['isabel', 'Isabel', 'time'], ['diane', 'Diane', 'time'], ['helen', 'Helen', 'time'],
  ['karen', 'Karen', 'time'], ['annie', 'Annie', 'time'], ['jackie', 'Jackie', 'time'], ['nancy', 'Nancy', 'time'], ['dt', 'DT', 'time'],
  ['murph', 'Murph', 'time'], ['filthy', 'Filthy Fifty', 'time'], ['cindy', 'Cindy', 'rounds']
];
const PB_KIND = { kg: 'Þyngd', time: 'Tími', reps: 'Reps', rounds: 'Umferðir' };
const pbDef = key => { const d = CF_PB.find(x => x[0] === key); return d ? { key, name: d[1], kind: d[2] } : null; };
const pbText = p => p.kind === 'kg' ? `${nf(p.value, 1)} kg` : p.kind === 'time' ? fmtDur(p.value) : p.kind === 'rounds' ? `${p.rounds} umf.${p.reps ? ` + ${p.reps}` : ''}` : `${nf(p.value)} reps`;
const pbScore = p => p.kind === 'time' ? -p.value : p.kind === 'rounds' ? (p.rounds || 0) * 1000 + (p.reps || 0) : p.value;
function pbDiff(p, prev){
  if (!prev) return '';
  if (p.kind === 'kg') return `${p.value - prev.value >= 0 ? '+' : '−'}${nf(Math.abs(p.value - prev.value), 1)} kg`;
  if (p.kind === 'time') return `${p.value <= prev.value ? '−' : '+'}${fmtDur(Math.abs(prev.value - p.value))}`;
  if (p.kind === 'reps') return `${p.value - prev.value >= 0 ? '+' : '−'}${Math.abs(p.value - prev.value)} reps`;
  return '';
}
/* Allir skráðir PB-ar notandans, nýjasti fyrst */
function pbHistory(pid, key, excludeId){
  return state.sessions.filter(s => s.profileId === pid && s.id !== excludeId && (s.prs || []).length)
    .flatMap(s => s.prs.filter(p => p.key === key).map(p => ({ ...p, date: s.date }))).sort((a, b) => b.date.localeCompare(a.date));
}
const pbBest = list => list.length ? list.reduce((m, p) => pbScore(p) > pbScore(m) ? p : m) : null;
let pbQuery = '', pbPick = null;
function openPbPicker(){
  pbQuery = ''; pbPick = null;
  openSheet('Personal best', `<input class="in" id="pbq" placeholder="Leita, t.d. snatch eða Fran" autocomplete="off" aria-label="Leita"><div id="pblist"></div>`);
  const q = $('#pbq'); q.addEventListener('input', () => { pbQuery = q.value; drawPbList(); }); drawPbList();
}
function drawPbList(){
  const el = $('#pblist'); if (!el) return;
  const term = fold(pbQuery.trim()), customs = [...new Set(state.sessions.filter(s => s.profileId === draft.profileId).flatMap(s => (s.prs || []).filter(p => p.key.startsWith('c:')).map(p => p.key)))];
  const items = [...CF_PB.map(d => ({ key: d[0], name: d[1], kind: d[2] })), ...customs.map(k => { const h = pbHistory(draft.profileId, k)[0]; return { key: k, name: h.name, kind: h.kind }; })]
    .filter(x => !term || fold(x.name).includes(term)).sort((a, b) => poolColl.compare(a.name, b.name));
  el.innerHTML = `<ul class="pick pblist">${items.map(x => { const b = pbBest(pbHistory(draft.profileId, x.key, draft.id));
    return `<li><button data-pbk="${esc(x.key)}"><span><b>${esc(x.name)}</b><span class="tiny">${PB_KIND[x.kind]}${b ? `, þitt besta: ${esc(pbText(b))}` : ''}</span></span>${ICON.r}</button></li>`; }).join('')}</ul>
    <button class="btn block" style="margin-top:10px" data-act="pbcustom">+ Annað PB${term ? `: „${esc(pbQuery.trim())}“` : ''}</button>`;
}
function openPbEntry(key, custom){
  const def = custom ? { key: 'c:' + fold(custom.name).replace(/[^a-z0-9]+/g, '-'), name: custom.name, kind: custom.kind } : pbDef(key) || (() => { const h = pbHistory(draft.profileId, key)[0]; return h ? { key, name: h.name, kind: h.kind } : null; })();
  if (!def) return;
  pbPick = def;
  const best = pbBest(pbHistory(draft.profileId, def.key, draft.id)), cur = (draft.prs || []).find(p => p.key === def.key);
  const inp = def.kind === 'rounds'
    ? `<div class="fgrid"><div class="ff"><label for="pbr">Umferðir</label><input class="in big" id="pbr" inputmode="numeric" value="${cur ? cur.rounds : ''}"></div>
       <div class="ff"><label for="pbx">Aukareps</label><input class="in big" id="pbx" inputmode="numeric" value="${cur && cur.reps ? cur.reps : ''}"></div></div>`
    : `<div class="ff"><label for="pbv">${PB_KIND[def.kind]}</label><div class="unitwrap"><input class="in big" id="pbv" inputmode="decimal" placeholder="${def.kind === 'time' ? 't.d. 4:32' : def.kind === 'kg' ? 't.d. 70' : 't.d. 25'}" value="${cur ? (def.kind === 'time' ? fmtDur(cur.value) : fmtIn(cur.value)) : ''}">
       <span class="unit">${def.kind === 'kg' ? 'kg' : def.kind === 'time' ? 'mm:ss' : 'reps'}</span></div></div>`;
  openSheet(def.name, `<div class="pbhead">🏆</div>${inp}
    <p class="tiny" style="margin:8px 2px 0">${best ? `Fyrra besta: <b>${esc(pbText(best))}</b>, ${fmtDate(best.date)}` : 'Fyrsta skráða PB í þessu.'}</p>
    <div id="pbwarn" class="tiny" style="margin:6px 2px 0"></div>
    <button class="cta" data-act="pbsave">Vista personal best</button>
    <button class="btn ghost block" style="margin-top:8px" data-act="pbback">Til baka í listann</button>`);
  const f = $('#pbv') || $('#pbr'); if (f) f.focus();
}
function savePb(){
  const def = pbPick; if (!def) return;
  const p = { key: def.key, name: def.name, kind: def.kind };
  if (def.kind === 'rounds'){ p.rounds = num($('#pbr').value); p.reps = num($('#pbx').value) || 0; if (!p.rounds && !p.reps) return toast('Sláðu inn umferðir'); p.value = p.rounds; }
  else { p.value = def.kind === 'time' ? parseDur($('#pbv').value) : num($('#pbv').value); if (!p.value) return toast(`Sláðu inn ${PB_KIND[def.kind].toLowerCase()}`); }
  const best = pbBest(pbHistory(draft.profileId, def.key, draft.id));
  if (best && pbScore(p) <= pbScore(best) && !$('#pbwarn').dataset.ok){
    $('#pbwarn').dataset.ok = '1';
    $('#pbwarn').innerHTML = `<span style="color:var(--danger);font-weight:700">Þetta er ekki betra en fyrra besta (${esc(pbText(best))}).</span> Ýttu aftur til að vista samt.`; return;
  }
  draft.prs = (draft.prs || []).filter(x => x.key !== p.key); draft.prs.push(p);
  saveDraft(); closeSheet(); render();
}
function pbStats(){
  const pid = state.active, keys = [...new Set(state.sessions.filter(s => s.profileId === pid).flatMap(s => (s.prs || []).map(p => p.key)))];
  if (!keys.length) return '';
  const rows = keys.map(k => { const h = pbHistory(pid, k), best = pbBest(h), first = h[h.length - 1];
    return { best, n: h.length, diff: h.length > 1 ? pbDiff(best, first) : '' }; }).sort((a, b) => poolColl.compare(a.best.name, b.best.name));
  return `<h2>Personal best</h2><div class="glass" style="overflow:hidden"><table class="tbl"><thead><tr><th>Æfing</th><th>Besta</th><th>Framför</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td><b>${esc(r.best.name)}</b><div class="tiny">${fmtDate(r.best.date)}</div></td><td><b>${esc(pbText(r.best))}</b></td>
      <td>${r.diff ? `<span class="up">${esc(r.diff)}</span><div class="tiny">${r.n} skráningar</div>` : '<span class="tiny">Fyrsta skráning</span>'}</td></tr>`).join('')}
    </tbody></table></div>`;
}

/* ---------- Setja upp sem app á heimaskjá ---------- */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (gate === 'login' || ui.tab === 'home') softRender(); });
window.addEventListener('appinstalled', () => { deferredInstall = null; LS.set('aefingabokin.installDismissed', '1'); toast('Æfingabókin er komin á heimaskjáinn'); softRender(); });
function installEnv(){
  const ua = navigator.userAgent || '';
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1), android = /android/i.test(ua);
  const browser = /SamsungBrowser/i.test(ua) ? 'samsung' : /FxiOS|Firefox/i.test(ua) ? 'firefox' : /EdgiOS|EdgA|Edg\//i.test(ua) ? 'edge' : /CriOS|Chrome/i.test(ua) ? 'chrome' : /Safari/i.test(ua) ? 'safari' : 'other';
  return { ios, android, mobile: ios || android, browser };
}
const canOfferInstall = () => !standalone() && (installEnv().mobile || window.__forceInstall);
function installCard(where){
  if (!canOfferInstall()) return '';
  if (where === 'home' && LS.get('aefingabokin.installDismissed')) return '';
  return `<div class="installcard glass ${where}"><div class="iapp" aria-hidden="true">${sportIcon('lift', 24)}</div>
    <div class="itext"><b>Settu Æfingabókina á heimaskjáinn</b><span class="tiny">Opnast eins og app, í fullum skjá, og virkar líka án nets.</span></div>
    <div class="ibtns"><button class="btn primary" data-act="install">${deferredInstall ? 'Setja upp' : 'Sýna hvernig'}</button>
    ${where === 'home' ? `<button class="linkbtn" data-act="installlater">Seinna</button>` : ''}</div></div>`;
}
const SHARE_IC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
const DOTS_IC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
const MENU_IC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
const PLUS_IC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';
const INSTALL_STEPS = {
  safari:  { name: 'iPhone: Safari', steps: [`Ýttu á <b>Deila</b> ${SHARE_IC} neðst á skjánum.`, `Skrunaðu niður og veldu <b>Add to Home Screen</b> ${PLUS_IC}.`, 'Ýttu á <b>Add</b> efst til hægri.'] },
  ioschrome: { name: 'iPhone: Chrome', steps: [`Ýttu á <b>Deila</b> ${SHARE_IC} efst í vistfangsstikunni.`, `Veldu <b>Add to Home Screen</b> ${PLUS_IC}.`, 'Ýttu á <b>Add</b>.'], note: 'Virkar í iOS 16.4 og nýrra. Í eldri iPhone þarf að nota Safari.' },
  chrome:  { name: 'Android: Chrome', steps: [`Ýttu á <b>⋮</b> ${DOTS_IC} efst til hægri.`, 'Veldu <b>Setja upp forrit</b> (Install app) eða <b>Bæta á heimaskjá</b>.', 'Staðfestu með <b>Setja upp</b>.'] },
  samsung: { name: 'Samsung Internet', steps: [`Ýttu á <b>valmyndina</b> ${MENU_IC} neðst til hægri.`, 'Veldu <b>Bæta síðu við</b> (Add page to).', 'Veldu <b>Heimaskjár</b> (Home screen) og staðfestu.'], note: 'Ef niðurhalstákn birtist í vistfangsstikunni má líka ýta á það.' },
  firefox: { name: 'Firefox', steps: [`Ýttu á <b>⋮</b> ${DOTS_IC} valmyndina.`, 'Veldu <b>Setja upp</b> (Install) eða <b>Bæta á heimaskjá</b>.', 'Staðfestu.'] }
};
function defaultInstallTab(){
  const e = installEnv();
  if (e.ios) return e.browser === 'safari' ? 'safari' : 'ioschrome';
  if (e.browser === 'samsung') return 'samsung';
  if (e.browser === 'firefox') return 'firefox';
  return 'chrome';
}
async function startInstall(){
  if (deferredInstall){
    const p = deferredInstall; deferredInstall = null;
    try { p.prompt(); const r = await p.userChoice; if (r && r.outcome === 'accepted') return; } catch(e){}
  }
  openInstallHelp();
}
function openInstallHelp(tab){
  const t = tab || defaultInstallTab(), info = INSTALL_STEPS[t];
  openSheet('Setja upp á heimaskjá', `<div class="ihero"><div class="iapp big" aria-hidden="true">${sportIcon('lift', 34)}</div>
      <p class="muted" style="margin:10px 0 0">Æfingabókin opnast þá beint af heimaskjánum, í fullum skjá eins og hvert annað app, og virkar líka án nets.</p></div>
    ${deferredInstall ? `<button class="cta" data-act="install">Setja upp núna</button><p class="tiny" style="text-align:center">eða fylgdu skrefunum hér fyrir neðan</p>` : ''}
    <div class="chips" role="tablist" aria-label="Vafri">${Object.entries(INSTALL_STEPS).map(([k, o]) => `<button class="chip" role="tab" data-act="installtab" data-v="${k}" aria-pressed="${k === t}">${o.name}</button>`).join('')}</div>
    <ol class="isteps">${info.steps.map(s => `<li>${s}</li>`).join('')}</ol>
    ${info.note ? `<p class="tiny">${info.note}</p>` : ''}
    <p class="tiny" style="margin-top:12px">Táknið á heimaskjánum heitir <b>Æfingabókin</b>. Þú ert áfram innskráð(ur) þegar þú opnar það.</p>`);
}

/* ---------- Dagur í vikuritinu: sjá og breyta æfingum þess dags ---------- */
function openDay(pid, day){
  const list = state.sessions.filter(s => s.profileId === pid && s.date === day).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  if (list.length === 1){ if (pid !== state.active) setActive(pid); startDraft(list[0].type, list[0]); return; }
  const who = pid === me.uid ? '' : `${pname(pid)}, `;
  openSheet(`${who}${fmtDate(day)}`, `${list.length ? `<p class="muted" style="margin-top:0">Veldu æfingu til að skoða eða breyta, t.d. ef dagsetningin er röng.</p>
      <ul class="list glass">${list.map(itemHtml).join('')}</ul>` : `<p class="muted" style="margin-top:0">Engin æfing skráð þennan dag.</p>`}
    <button class="btn block" style="margin-top:12px" data-act="logday" data-lpid="${esc(pid)}" data-lday="${day}">+ Skrá æfingu á þennan dag</button>`);
}

/* ---------- Gröf ---------- */
function niceMax(v){ if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function lineChart(pts, o = {}){
  const W = 340, H = 180, L = 34, R = 10, T = 12, B = 26, col = o.color || 'var(--c-lift)';
  if (pts.length === 1) pts = [pts[0], {...pts[0]}];
  const hasB = pts.some(p => p.b != null);
  const vals = pts.flatMap(p => hasB ? [p.a, p.b] : [p.a]).concat(o.goal != null ? [o.goal] : []);
  const mn = Math.min(...vals), mx = Math.max(...vals), span = Math.max(mx - mn, mx * 0.04, 1);
  const lo = o.allowNeg ? Math.floor(mn - span * 0.3) : o.color ? Math.max(0, Math.floor(mn - span * 0.3)) : Math.max(0, Math.floor(mn * 0.85)), hi = o.color ? Math.ceil(mx + span * 0.3) : niceMax(mx * 1.05);
  const x = i => L + i * (W - L - R) / (pts.length - 1), y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo || 1));
  const path = k => pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join('');
  const stp = Math.ceil(pts.length / 6);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria || 'Þróun þyngda'}">
    ${[lo, (lo + hi) / 2, hi].map(t => `<line class="ax" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 6}" y="${y(t) + 3}" text-anchor="end">${nf(t, hi - lo < 6 ? 1 : 0)}</text>`).join('')}
    ${o.goal != null ? `<line x1="${L}" x2="${W - R}" y1="${y(o.goal)}" y2="${y(o.goal)}" stroke="var(--ink-3)" stroke-width="1.4" stroke-dasharray="6 5"/>` : ''}
    ${hasB ? `<path d="${path('b')}" fill="none" stroke="var(--ink-3)" stroke-width="1.6" stroke-dasharray="4 4"/>` : ''}
    <path d="${path('a')}" fill="none" stroke="${col}" stroke-width="2.8" stroke-linejoin="round"/>
    ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.a)}" r="3.6" fill="${col}"><title>${p.label}: ${nf(p.a, o.dec ?? 1)}${o.unit ? ' ' + o.unit : ''}</title></circle>`).join('')}
    ${pts.map((p, i) => (i % stp === 0 || i === pts.length - 1) ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${p.label}</text>` : '').join('')}</svg>`;
}
function barChart(data, color, dec){
  const W = 340, H = 170, L = 34, R = 8, T = 12, B = 26, hi = niceMax(Math.max(...data.map(d => d.v), 0.1)), bw = (W - L - R) / data.length;
  const y = v => T + (H - T - B) * (1 - v / hi);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Vegalengd á viku">
    ${[0, hi / 2, hi].map(t => `<line class="ax" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 6}" y="${y(t) + 3}" text-anchor="end">${nf(t, dec)}</text>`).join('')}
    ${data.map((d, i) => `<rect x="${(L + i * bw + bw * 0.18).toFixed(1)}" y="${y(d.v).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${Math.max(0, H - B - y(d.v)).toFixed(1)}" rx="4" fill="${color}"><title>${d.label}: ${nf(d.v, dec)}</title></rect>`).join('')}
    ${data.map((d, i) => i % 2 === 1 ? `<text x="${L + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${d.label}</text>` : '').join('')}</svg>`;
}

/* ---------- Spjöld ---------- */
function openSheet(title, html){ $('#sheetTitle').textContent = title; $('#sheetBody').innerHTML = html; $('#sheet').classList.add('open'); $('#sheetBg').classList.add('open'); }
function closeSheet(){ stopComments(); $('#sheet').classList.remove('open'); $('#sheetBg').classList.remove('open'); if (pendingRender) softRender(); }
$('#sheetClose').onclick = closeSheet; $('#sheetBg').onclick = closeSheet;
document.addEventListener('keydown', e => { if (e.key === 'Escape'){ if (document.getElementById('reactPop')) return closeReact(); closeSheet(); } });

function openExPicker(){
  openSheet('Veldu æfingu', `<input class="in" id="exq" placeholder="Leita eða skrifa nýja æfingu" autocomplete="off"><div id="exlist"></div>`);
  const q = $('#exq');
  const draw = () => {
    const term = q.value.trim().toLowerCase(), pid = draft ? draft.profileId : state.active;
    const inSession = new Set((draft && draft.exercises || []).map(e => e.exId));
    const recentIds = [...new Set(mySessions(pid).filter(s => s.type === 'lift').sort(byDateDesc).flatMap(s => (s.exercises||[]).map(e => e.exId)))].slice(0, 6);
    const groups = {};
    if (!term && recentIds.length) groups['Nýlega teknar'] = recentIds.map(id => allEx().find(e => e.id === id)).filter(Boolean);
    allEx().filter(e => !term || fold(e.name + ' ' + (e.alias || '')).includes(fold(term))).forEach(e => (groups[e.g || 'Mínar æfingar'] = groups[e.g || 'Mínar æfingar'] || []).push(e));
    const exact = allEx().some(e => e.name.toLowerCase() === term);
    $('#exlist').innerHTML = (term && !exact ? `<button class="btn primary block" style="margin-top:12px" data-newex="${esc(q.value.trim())}">Búa til „${esc(q.value.trim())}“</button>` : '') +
      Object.entries(groups).map(([g, list]) => `<div class="grp">${esc(g)}</div><ul class="pick">${list.map(e => { const lp = lastPerformance(e.id, draft && draft.id, pid);
        return `<li><button data-pickex="${esc(e.id)}">${esc(e.name)}<span>${inSession.has(e.id) ? 'Í lotunni' : lp ? `Síðast ${setTxt(lp.sets[lp.sets.length - 1])}` : (e.custom ? 'Þín æfing' : '')}</span></button></li>`; }).join('')}</ul>`).join('');
  };
  q.addEventListener('input', draw); draw();
}
function addExercise(id){
  const e = allEx().find(x => x.id === id); if (!e || !draft) return;
  draft.exercises = draft.exercises || [];
  const at = draft.exercises.findIndex(x => x.exId === id);
  if (at >= 0) draft.cur = at;
  else { const ex = {exId: id, name: e.name, sets: []}; ex.cur = suggestion(ex); if (draft.type !== 'lift') ex.sets.push({ ...ex.cur }); draft.exercises.push(ex); draft.cur = draft.exercises.length - 1; }
  draft.editSet = null; saveDraft(); closeSheet(); render(); window.scrollTo(0, 0);
}
function openSettings(){
  if (ui.tab !== 'settings') prevTab = ui.tab;
  closeSheet(); ui.tab = 'settings'; render(); window.scrollTo(0, 0);
}
function settingItem(it){
  const hint = it.hint ? `<div class="tiny">${it.hint}</div>` : '';
  if (it.type === 'toggle') return `<label class="srow"><span>${it.label}${hint}</span>
    <input type="checkbox" class="switch" data-settoggle="${it.key}" data-on="${it.on}" data-off="${it.off}" ${settings[it.key] === it.on ? 'checked' : ''}></label>`;
  if (it.type === 'number') return `<div class="srow"><label for="set_${it.key}" style="flex:1"><b style="font-weight:600">${it.label}</b>${hint}</label>
    <input class="in" id="set_${it.key}" data-setnum="${it.key}" inputmode="numeric" placeholder="${it.placeholder || ''}" value="${settings[it.key] ?? ''}" style="max-width:120px;text-align:center"></div>`;
  if (it.type === 'weekstyle'){
    const sample = [[{ type: 'lift', durationMin: 58 }], [{ type: 'run', distance: 5.2, durationMin: 29 }], [], [{ type: 'swim', distance: 1000, durationMin: 25 }, { type: 'lift', durationMin: 45 }]];
    const names = { A: 'Lituð tákn', B: 'Hringir', C: 'Ljóst', D: 'Með tölum' }, keep = settings.weekStyle;
    const opts = ['A', 'B', 'C', 'D'].map(v => { settings.weekStyle = v;
      const cells = sample.map((l, i) => weekCell(l, i === 1, '', today())).join(''); settings.weekStyle = keep;
      return `<button class="wsopt" data-set="weekStyle" data-val="${v}" aria-pressed="${keep === v}"><span class="wsprev">${cells}</span><b>${v}</b><span class="tiny">${names[v]}</span></button>`; }).join('');
    return `<div class="sitem"><div class="slabel">${it.label}${hint}</div><div class="wsgrid">${opts}</div></div>`;
  }
  if (it.type === 'palette'){
    const dark = prefersDark(settings);
    return `<div class="sitem"><div class="slabel">${it.label}</div><div class="swatches" role="group" aria-label="${it.label}">${PALETTES.map(p => { const c = dark ? p.dark : p.light;
      return `<button class="swatch" data-set="palette" data-val="${p.id}" aria-pressed="${settings.palette === p.id}"><span style="background:radial-gradient(circle at 25% 20%, ${c[1]}, transparent 62%), radial-gradient(circle at 85% 30%, ${c[2]}, transparent 60%), radial-gradient(circle at 40% 95%, ${c[3]}, transparent 65%), ${c[0]}"></span>${p.name}</button>`; }).join('')}</div></div>`;
  }
  return `<div class="sitem"><div class="slabel">${it.label}${hint}</div><div class="opts" role="group" aria-label="${it.label}">${it.options.map(([v, l]) =>
    `<button class="chip" data-set="${it.key}" data-val="${v}" aria-pressed="${String(settings[it.key]) === v}">${l}</button>`).join('')}</div></div>`;
}
function renderSettings(){
  const order = settings.homeCards;
  const partner = partnerId();
  view.innerHTML = `
    <div class="set-top"><button class="roundbtn glass" data-act="setback" aria-label="Til baka">${ICON.l}</button><h1>Stillingar</h1></div>

    <div class="sec-h">Prófíll</div>
    <div class="glass sgroup">
      <div class="prof">${avatar(me.uid, 84, pname(me.uid))}
        <div class="acts"><button class="btn primary" data-act="photopick">${photoOf(me.uid) ? 'Skipta um mynd' : 'Velja mynd'}</button>
          ${photoOf(me.uid) ? `<button class="btn ghost danger" data-act="photoremove">Fjarlægja mynd</button>` : `<span class="tiny">Annars birtist upphafsstafurinn þinn</span>`}</div></div>
      ${state.profiles.map((p, i) => `<div class="sitem"><label class="slabel" for="pn${i}" style="display:block">${p.id === me.uid ? 'Nafnið þitt' : 'Nafn maka'}</label>
        <div style="padding:0 16px 14px"><input class="in" id="pn${i}" data-pidname="${p.id}" value="${esc(p.name)}"></div></div>`).join('')}
      <div style="padding:12px 16px"><button class="btn primary block" data-act="savenames">Vista nöfn</button></div>
    </div>

    <div class="sec-h">Um þig</div>
    <div class="glass sgroup">
      <div class="aboutbar flat">
        <div><div class="l">Aldur</div><div class="v">${ageOf(about && about.birthDate) != null ? `${ageOf(about.birthDate)} <small>ára</small>` : '–'}</div></div>
        <div><div class="l">Hæð</div><div class="v">${about && about.heightCm ? `${nf(about.heightCm)} <small>cm</small>` : '–'}</div></div>
        <div><div class="l">Kyn</div><div class="v sm">${about && about.sex ? (SEXES.find(([v]) => v === about.sex) || [, '–'])[1] : '–'}</div></div>
      </div>
      <div class="srow"><span>Upplýsingar og markmið<div class="tiny">Aðeins þú sérð þetta</div></span><button class="btn" data-act="aboutedit">Breyta</button></div>
      <div class="srow"><span>Mælingar og framþróun<div class="tiny">${measurements.length ? `${measurements.length} mælingar skráðar` : 'Þyngd, fituprósenta, ummál, hvíldarpúls'}</div></span><button class="btn" data-act="bodyopen">Opna</button></div>
    </div>

    <div class="sec-h">Útlit</div>
    <div class="glass sgroup">${SCHEMA.appearance.map(settingItem).join('')}</div>

    <div class="sec-h sec-hrow"><span>Forsíðan</span><button class="linkbtn editbtn" data-act="reorder" aria-pressed="${!!ui.reorder}">${ui.reorder ? 'Lokið' : 'Breyta uppröðun'}</button></div>
    ${ui.reorder ? `<p class="tiny" style="margin:-2px 4px 8px">Haltu í ${GRIP} og dragðu spjöldin í þá röð sem þú vilt.</p>` : ''}
    <div class="glass sgroup ${ui.reorder ? 'reordering' : ''}" id="homeorder">${order.map(id => { const c = HOME_CARDS.find(x => x.id === id), on = !settings.homeHidden.includes(id);
      return `<div class="orow ${on ? '' : 'off'}" data-hc="${id}"><span>${c.name}</span>
        ${ui.reorder ? `<button class="handle" aria-label="Færa ${c.name}. Notaðu örvatakkana upp og niður." data-hc="${id}">${GRIP}</button>`
          : `<input type="checkbox" class="switch" data-homecard="${id}" aria-label="Sýna ${c.name}" ${on ? 'checked' : ''}>`}</div>`; }).join('')}</div>

    <div class="sec-h">Flipar neðst</div>
    <div class="glass sgroup">${OPTIONAL_TABS.map(t => `<label class="srow"><span>${t.name}</span>
      <input type="checkbox" class="switch" data-tabtoggle="${t.id}" ${settings.tabsHidden.includes(t.id) ? '' : 'checked'}></label>`).join('')}</div>

    <div class="sec-h">Íþróttir</div>
    <div class="glass sgroup">
      <div class="sitem"><div class="slabel">Íþróttir sem birtast við skráningu<div class="tiny">Hinar eru alltaf aðgengilegar undir „Fleiri íþróttir“.</div></div></div>
      ${Object.keys(TYPES).map(k => `<label class="srow"><span class="sportrow"><i style="background:${tc(k)}"></i>${TYPES[k].name}<span class="tiny">${TYPES[k].hint}</span></span>
        <input type="checkbox" class="switch" data-sporttoggle="${k}" ${sportOn(k) ? 'checked' : ''}></label>`).join('')}
    </div>

    <div class="sec-h">Skráning</div>
    <div class="glass sgroup">${SCHEMA.logging.map(settingItem).join('')}</div>

    <div class="sec-h">Vinir og maki</div>
    <div class="glass sgroup">
      <div class="sitem"><div class="slabel">Hvað sjá vinir af æfingunum þínum?<div class="tiny">Vinir sjá ekkert nema þú leyfir það. Makinn sér alltaf allt.</div></div>
        <div class="visopts" role="radiogroup" aria-label="Hvað sjá vinir">${Object.entries(VIS).map(([k, o]) => `<button class="visopt" role="radio" data-vis="${k}" aria-checked="${visOf(me.uid) === k}" aria-pressed="${visOf(me.uid) === k}">
          <span class="rd" aria-hidden="true"></span><span><b>${o.name}</b><span class="tiny">${o.desc}</span></span></button>`).join('')}</div>
        ${profOf(me.uid).shareFrom && ['summary', 'full'].includes(visOf(me.uid)) ? `<p class="tiny" style="padding:0 16px 12px;margin:0">Deilt frá ${fmtDate(profOf(me.uid).shareFrom.slice(0, 10))}, eldri æfingum er ekki deilt. <button class="linkbtn" data-act="visall">Deila líka eldri</button></p>` : ''}</div>
      ${myPerson ? `<div class="srow"><span>Vinakóðinn þinn<div class="tiny">${esc(myPerson.code)}</div></span><button class="btn" data-act="sharecode">Deila</button></div>` : ''}
      ${partner ? '' : `<div class="srow"><span>Maki<div class="tiny">Enginn tengdur ennþá</div></span><button class="btn" data-act="invite">Bjóða</button></div>`}
    </div>

    <div class="sec-h">Gögn</div>
    <div class="glass sgroup">
      <div class="srow"><span>Flytja út gögn<div class="tiny">Excel, CSV eða fullt afrit (JSON)</div></span><button class="btn primary" data-act="exportopen">Opna</button></div>
      <div class="srow"><span>Lesa inn afrit<div class="tiny">Úr prufuútgáfunni eða eldra afriti</div></span><label class="btn" style="display:grid;place-items:center">Velja skrá<input type="file" accept=".json,application/json" id="importFile" hidden></label></div>
    </div>

    <div class="sec-h">Hjálp og ábendingar</div>
    <div class="glass sgroup">
      <button class="srow fbrow" data-act="fbopen" data-v="idea"><span class="fbic" aria-hidden="true">💡</span><span>Senda hugmynd<div class="tiny">Viðbót eða breyting sem væri gaman að sjá</div></span>${ICON.r}</button>
      <button class="srow fbrow" data-act="fbopen" data-v="bug"><span class="fbic" aria-hidden="true">🐞</span><span>Tilkynna villu<div class="tiny">Eitthvað virkar ekki eins og það á að gera</div></span>${ICON.r}</button>
      <button class="srow fbrow" data-act="fbopen" data-v="other"><span class="fbic" aria-hidden="true">💬</span><span>Annað<div class="tiny">Hrós, spurning eða annað</div></span>${ICON.r}</button>
    </div>

    ${!standalone() ? `<div class="sec-h">App</div>
    <div class="glass sgroup"><button class="srow fbrow" data-act="installhelp"><span class="fbic" aria-hidden="true">📲</span><span>Setja upp á heimaskjá<div class="tiny">Opnast eins og app og virkar án nets</div></span>${ICON.r}</button></div>` : ''}

    <div class="sec-h">Persónuvernd</div>
    <div class="glass sgroup">
      <label class="srow"><span>Nafnlaus notkunartölfræði<div class="tiny">Hjálpar til við að bæta appið, t.d. hvaða íþróttir og æfingar eru mest notaðar. Aðeins samtölur eru sendar, aldrei nafn þitt, æfingarnar sjálfar eða mælingar.</div></span>
        <input type="checkbox" class="switch" data-settoggle="analytics" data-on="on" data-off="off" ${settings.analytics !== 'off' ? 'checked' : ''}></label>
    </div>

    <div class="sec-h">Aðgangur</div>
    <div class="glass sgroup">
      <div class="srow"><span>Innskráð${me.email ? `<div class="tiny">${esc(me.email)}</div>` : ''}</span><button class="btn danger" data-act="signout">Skrá út</button></div>
    </div>
    <div class="soon">Fleiri stillingar bætast hér við eftir því sem appið stækkar.<br>${state.sessions.length} æfingar skráðar. Útgáfa ${APP_VERSION}</div>`;
  const f = $('#importFile'); if (f) f.addEventListener('change', importFile);
  if (ui.reorder) setupReorder($('#homeorder'));
}
/* Dregið til að raða spjöldum forsíðunnar (fingur eða mús), og örvatakkar fyrir lyklaborð */
function setupReorder(list){
  if (!list) return;
  const commit = () => { const order = [...list.querySelectorAll('.orow')].map(r => r.dataset.hc);
    if (order.join() !== settings.homeCards.join()){ settings = normalize({ ...settings, homeCards: order }); writeLocal(settings);
      clearTimeout(setSaveT); if (me && Store.saveSettings) setSaveT = setTimeout(() => Store.saveSettings(me.uid, settings).catch(() => {}), 600); } };
  list.querySelectorAll('.handle').forEach(h => {
    h.addEventListener('pointerdown', e => {
      e.preventDefault();
      const row = h.closest('.orow'); row.classList.add('dragging');
      try { h.setPointerCapture(e.pointerId); } catch(_){}
      const move = ev => {
        const rows = [...list.querySelectorAll('.orow')].filter(x => x !== row);
        const over = rows.find(x => { const r = x.getBoundingClientRect(); return ev.clientY >= r.top && ev.clientY <= r.bottom; });
        if (!over) return;
        const r = over.getBoundingClientRect();
        list.insertBefore(row, ev.clientY < r.top + r.height / 2 ? over : over.nextSibling);
      };
      const up = () => { row.classList.remove('dragging'); h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); commit(); };
      h.addEventListener('pointermove', move); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
    });
    h.addEventListener('keydown', e => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault(); const row = h.closest('.orow');
      if (e.key === 'ArrowUp' && row.previousElementSibling) list.insertBefore(row, row.previousElementSibling);
      if (e.key === 'ArrowDown' && row.nextElementSibling) list.insertBefore(row.nextElementSibling, row);
      h.focus(); commit();
    });
  });
}
async function invite(){
  const link = inviteLink(), text = 'Vertu með í Æfingabókinni minni';
  try {
    if (navigator.share){ await navigator.share({title: 'Æfingabókin', text, url: link}); return; }
  } catch(e){ if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(link); toast('Hlekkur afritaður'); }
  catch(e){ openSheet('Boðshlekkur', `<p class="muted" style="margin-top:0">Sendu makanum þennan hlekk:</p><input class="in" readonly value="${esc(link)}">`); }
}

let downloadsCap = null;
if (window.claude && typeof window.claude.use === 'function') window.claude.use('downloads').then(d => { downloadsCap = d; }).catch(() => {});
async function exportData(){
  const data = JSON.stringify({version: 4, profiles: state.profiles, customExercises: state.customExercises, sessions: state.sessions, about, measurements, goals: myGoals, exportedAt: new Date().toISOString()}, null, 2);
  deliverFile(new Blob([data], {type: 'application/json'}), `aefingabokin-${today()}.json`);
}
let importData = null;
function importFile(e){
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!Array.isArray(d.sessions) || !Array.isArray(d.profiles)) throw 0;
      importData = d;
      const opts = sel => `<option value="">Sleppa</option>` + state.profiles.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(pname(p.id))}</option>`).join('');
      openSheet('Hver á hvaða æfingar?', `<p class="muted" style="margin-top:0">Í afritinu eru ${d.sessions.length} æfingar. Veldu hvert þær eiga að fara.</p>
        ${d.profiles.map((p, i) => { const n = d.sessions.filter(s => s.profileId === p.id).length;
          const guess = (state.profiles.find(q => (q.name || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase()) || state.profiles[i] || {}).id;
          return `<label class="f" for="map${i}">${esc(p.name || 'Án nafns')} (${n} æfingar)</label><select class="in" id="map${i}" data-map="${esc(p.id)}">${opts(guess)}</select>`; }).join('')}
        <button class="cta" data-act="doimport">Lesa inn</button>`);
    } catch(err){ toast('Skráin er ekki afrit úr Æfingabókinni'); }
  };
  r.readAsText(f);
}
async function doImport(){
  const map = {};
  document.querySelectorAll('[data-map]').forEach(s => { if (s.value) map[s.dataset.map] = s.value; });
  const sessions = importData.sessions.filter(s => map[s.profileId]).map(s => {
    const c = JSON.parse(JSON.stringify(s)); c.profileId = map[s.profileId]; c.createdBy = c.createdBy || me.uid;
    Object.keys(c).forEach(k => c[k] === undefined && delete c[k]); return c; });
  const exercises = (importData.customExercises || []).filter(x => x && x.id);
  closeSheet(); toast('Les inn…');
  try { await Store.importAll(hid, sessions, exercises); toast(`${sessions.length} æfingar lesnar inn`); }
  catch(e){ console.error(e); toast('Innlestur tókst ekki'); }
}
let toastT;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400); }

function tick(){
  if (!draft || gate !== 'app') return;
  const sEl = view.querySelector('[data-timer="session"]'); if (sEl && draft.startedAt) sEl.textContent = fmtClock(Date.now() - draft.startedAt);
  const rEl = view.querySelector('[data-timer="rest"]');
  if (rEl && draft.lastSetAt){ const ms = Date.now() - draft.lastSetAt; if (ms > 15 * 60000) rEl.closest('[data-rest]').style.display = 'none'; else rEl.textContent = fmtClock(ms); }
}
const tickTimer = setInterval(tick, 1000);

/* ---------- Innskráning og heimili ---------- */
async function loadAbout(){
  if (!Store.getAbout) return;
  try { about = await Store.getAbout(me.uid); } catch(e){ console.warn('about', e); }
}
async function loadSettings(){
  if (!Store.getSettings) return;
  try {
    const remote = await Store.getSettings(me.uid);
    if (remote){ settings = normalize(remote); applyAppearance(settings); writeLocal(settings); }
    else Store.saveSettings(me.uid, settings).catch(() => {});
  } catch(e){ console.warn('settings', e); }
}
function setSetting(key, value){
  if (['weekStyle', 'palette', 'theme'].includes(key)) trackAppearance(key, settings[key], value);
  settings = normalize({ ...settings, [key]: value }); commitSettings();
}
function commitSettings(){
  applyAppearance(settings); writeLocal(settings);
  clearTimeout(setSaveT);
  if (me && Store.saveSettings) setSaveT = setTimeout(() => Store.saveSettings(me.uid, settings).catch(e => console.warn(e)), 600);
  render();
}
function toggleIn(list, id, on){ const set = new Set(list); on ? set.add(id) : set.delete(id); return [...set]; }
function clearParam(name){
  try { const u = new URL(location.href); u.searchParams.delete(name); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch(e){}
}
function clearJoinParam(){ joinTarget = null; clearParam('join'); }
function applyData(data){
  if (data.household){
    household = data.household;
    const profs = household.profiles || {};
    state.profiles = (household.members || []).map(id => ({id, name: (profs[id] && profs[id].name) || ''}));
  }
  if (data.sessions) state.sessions = data.sessions;
  if (data.exercises) state.customExercises = data.exercises.map(e => ({...e, custom: true, g: e.g || 'Mínar æfingar'}));
  if (me) state.profiles.forEach(p => { if (p.id !== me.uid && Store.getPerson) loadPerson(p.id); });
  const saved = LS.get(activeKey());
  state.active = state.profiles.some(p => p.id === saved) ? saved : me.uid;
}
function attach(){
  attachGoals();
  if (Store.subscribeInbox && !inboxUnsub) inboxUnsub = Store.subscribeInbox(me.uid, list => { inbox = list; if (ui.tab === 'home') softRender(); }, e => console.warn('inbox', e));
  if (Store.subscribeMeasurements && !measUnsub)
    measUnsub = Store.subscribeMeasurements(me.uid, list => { measurements = list; if (ui.tab === 'progress' || ui.tab === 'settings') softRender(); }, e => console.warn('measurements', e));
  draft = loadDraft();
  ui.tab = draft ? 'log' : (settings.startTab === 'log' ? 'log' : 'home');
  gate = 'loading'; render();
  if (unsub){ unsub(); unsub = null; }
  unsub = Store.subscribe(hid, data => {
    applyData(data);
    if (!household || !data.sessions) return;           // bíðum eftir fyrstu gögnum
    if (!socialStarted){ socialStarted = true; attachSocial(); setTimeout(activePing, 2000); }
    refreshSharedSubs(); scheduleSync();
    if (gate !== 'app'){ gate = 'app'; render();
      if (friendParam){ const c = friendParam; friendParam = null; clearParam('vinur'); setTimeout(() => openFriendInvite(c), 300); }
    } else softRender();
  }, err => { console.error(err); if (gate !== 'app'){ gate = 'error'; gateMsg = 'Náði ekki í gögnin. Athugaðu netsambandið.'; render(); } else toast('Samstilling rofnaði'); });
}
async function afterAuth(user){
  if (unsub){ unsub(); unsub = null; }
  detachSocial();
  if (measUnsub){ measUnsub(); measUnsub = null; } about = null; measurements = []; detachGoals();
  if (inboxUnsub){ inboxUnsub(); inboxUnsub = null; } inbox = []; stopComments(); commentsBy = {};
  household = null; state = { profiles: [], active: null, customExercises: [], sessions: [] };
  if (!user){ me = null; hid = null; gate = 'login'; render(); return; }
  me = user; gate = 'loading'; render();
  try { hid = await Store.loadMembership(me.uid); }
  catch(e){ console.error(e); gate = 'error'; gateMsg = 'Náði ekki sambandi við gagnagrunninn. Athugaðu netið og reyndu aftur.'; render(); return; }
  if (!hid){ gate = 'onboard'; render(); return; }
  await loadSettings();
  await loadAbout();
  if (joinTarget && joinTarget !== hid) toast('Þú ert nú þegar í öðru heimili');
  clearJoinParam(); attach();
}

/* ---------- Atburðir ---------- */
document.addEventListener('click', async e => {
  const b = e.target.closest('button, [data-act]');
  if (!b || !b.closest('#reactPop')) { if (document.getElementById('reactPop') && !(b && (b.dataset.kudos || b.dataset.gkudos))) closeReact(); }
  if (!b) return;
  const d = b.dataset;
  if (d.react !== undefined && b.closest('#reactPop')){ giveReact(d.react); return; }
  if (d.tab){ ui.tab = d.tab; render(); window.scrollTo(0, 0); return; }
  if (d.pid){ setActive(d.pid); if (draft && isNewDraft()){ draft.profileId = d.pid; (draft.exercises || []).forEach(x => { if (!x.sets.length) x.cur = suggestion(x); }); saveDraft(); } render(); return; }
  if (d.newtype){ ui.moreOpen = false; startDraft(d.newtype); return; }
  if (d.edit){ const s = state.sessions.find(x => x.id === d.edit); if (s){ closeSheet(); if (s.profileId !== state.active) setActive(s.profileId); startDraft(s.type, s); } return; }
  if (d.wday){ const [pid, day] = d.wday.split('|'); openDay(pid, day); return; }
  if (d.pickex){ addExercise(d.pickex); return; }
  if (d.newex){ const name = d.newex.trim(); if (!name) return; const ex = {id: 'c_' + uid(), name, g: 'Mínar æfingar', custom: true};
    state.customExercises.push(ex); Store.putExercise(hid, ex).catch(fail('Vistun æfingar'));
    bump('custom', { names: { [name.toLowerCase().slice(0, 40)]: 1 } }); addExercise(ex.id); return; }
  if (d.hf){ ui.histFilter = d.hf; render(); return; }
  if (d.pm){ ui.progMode = d.pm; render(); return; }
  if (d.pt){ ui.progType = d.pt; render(); return; }
  if (d.set){ setSetting(d.set, d.val); return; }
  if (d.move){ const arr = settings.homeCards.slice(), i = arr.indexOf(d.move), j = i + (+d.dir);
    if (i >= 0 && j >= 0 && j < arr.length){ [arr[i], arr[j]] = [arr[j], arr[i]]; setSetting('homeCards', arr); } return; }
  if (d.fm){ ui.fMode = d.fm; render(); return; }
  if (d.bm2){ ui.bodyMetric = d.bm2; render(); return; }
  if (d.pbk){ openPbEntry(d.pbk); return; }
  if (d.pool !== undefined && b.closest('#poollist')){ draft.pool = d.pool || null; saveDraft(); closeSheet(); render(); return; }
  if (d.gopen){ const [u, id] = d.gopen.split('|'); openGoal(u, id); return; }
  if (d.profile){ openProfile(d.profile); return; }
  if (d.gkudos){ const [u, id] = d.gkudos.split('|'); openReact(b, 'goal', u, id); return; }
  if (d.brange){ ui.bodyRange = d.brange; render(); return; }
  if (d.measure){ openMeasure(d.measure); return; }
  if (d.bm){ ui.boardMetric = d.bm; render(); return; }
  if (d.kudos){ const [u, id] = d.kudos.split('|'); openReact(b, 'session', u, id); return; }
  if (d.fdetail){ const [u, id] = d.fdetail.split('|'); openFriendDetail(u, id); return; }
  if (d.vis){ changeVisibility(d.vis); return; }
  switch (d.act){
    case 'signin': authErr = ''; authInfo = ''; authBusy = true; render();
      try { await Store.signIn(); } catch(err){ authErr = authErrorText(err); }
      authBusy = false; if (gate === 'login') render(); break;
    case 'authmode': { const f = $('#au_email'); if (f) authEmail = f.value.trim(); const n = $('#au_name'); if (n) pendingName = n.value.trim();
      authMode = d.m; authErr = ''; authInfo = ''; authShowPw = false; render(); const first = view.querySelector('input'); if (first && d.m !== 'start') first.focus(); break; }
    case 'pwtoggle': { const pw = $('#au_pw'); authShowPw = !authShowPw; if (pw){ pw.type = authShowPw ? 'text' : 'password'; } b.textContent = authShowPw ? 'Fela' : 'Sýna'; b.setAttribute('aria-label', authShowPw ? 'Fela lykilorð' : 'Sýna lykilorð'); break; }
    case 'signout': closeSheet(); if (draft && isNewDraft() && !confirm('Óvistuð skráning hverfur. Skrá út samt?')) break; authMode = 'start'; authErr = ''; authInfo = ''; await Store.signOut(); break;
    case 'reload': location.reload(); break;
    case 'create': case 'join': {
      const name = ($('#myname').value || '').trim(); if (!name) return toast('Settu inn nafn');
      b.disabled = true;
      try {
        hid = d.act === 'create' ? await Store.createHousehold(me, name) : await Store.joinHousehold(me, joinTarget, name);
        clearJoinParam(); await loadSettings(); newSignup = true; if (d.act === 'join') bump('totals', { couples: 1 });
        gate = 'sports'; render(); if (d.act === 'join') toast('Velkomin í heimilið');
      } catch(err){ console.error(err); b.disabled = false;
        toast(d.act === 'join' ? 'Gat ekki gengið í heimilið. Er hlekkurinn réttur og ekki þegar tveir í því?' : 'Gat ekki stofnað heimili'); }
      break; }
    case 'invite': invite(); break;
    case 'sheetclose': closeSheet(); break;
    case 'logday': closeSheet(); if (d.lpid !== state.active) setActive(d.lpid); draft = null; saveDraft(); ui.presetDate = d.lday; ui.tab = 'log'; render(); window.scrollTo(0, 0); break;
    case 'diststep': case 'distpre': {
      const st = distStep(), cur = num(draft.distRaw) || 0;
      let v = d.act === 'distpre' ? +d.v : Math.max(0, Math.round((cur + st * +d.dir) / st) * st);
      v = Math.round(v * 100) / 100; draft.distRaw = v ? fmtIn(v) : '';
      const inp = $('#dist'); if (inp) inp.value = draft.distRaw;
      document.querySelectorAll('[data-act="distpre"]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.v === v)));
      saveDraft(); updatePace(); break; }
    case 'install': startInstall(); break;
    case 'installhelp': openInstallHelp(); break;
    case 'installtab': openInstallHelp(d.v); break;
    case 'installlater': LS.set('aefingabokin.installDismissed', '1'); render(); toast('Þú finnur þetta líka í Stillingum'); break;
    case 'poolpick': openPoolPicker(); break;
    case 'fbopen': fbDraft.text = ''; openFeedback(d.v); break;
    case 'fbtype': { const tx = $('#fbtext'); if (tx) fbDraft.text = tx.value; const ct = $('#fbcontact'); if (ct) fbDraft.contact = ct.checked; openFeedback(d.v); break; }
    case 'fbsend': sendFeedback(); break;
    case 'reorder': ui.reorder = !ui.reorder; render(); break;
    case 'cmsend': sendComment(d.owner, d.sid); break;
    case 'cmquick': { const t = $('#cmtext'); if (t){ t.value = d.q; t.focus(); updateCount(); } break; }
    case 'cmdel': if (confirm('Eyða athugasemd?')){ const key = `${d.owner}/${d.sid}`; const c = (commentsBy[key] || []).find(x => x.id === d.cid);
      commentsBy[key] = (commentsBy[key] || []).filter(x => x.id !== d.cid); Store.deleteComment(d.owner, d.sid, d.cid, c && c.from === me.uid).catch(fail('Eyðing')); refreshComments(); } break;
    case 'cmopen': openOwnComments(d.sid); break;
    case 'importopen': pickImportFile(); break;
    case 'importhelp': openImportHelp(); break;
    case 'imphelptab': openImportHelp(d.v); break;
    case 'imprange': importState.range = d.v; renderImportPreview(); break;
    case 'impgo': doImport_(); break;
    case 'visfrom': applyVisibility(d.v, d.all === '1' ? null : new Date().toISOString()); break;
    case 'visall': applyVisibility(visOf(me.uid), null); break;
    case 'sharepick': setSessionShare(d.id, d.v); closeSheet(); render(); toast(d.v === 'none' ? 'Æfing vistuð, ekki deilt' : 'Æfing vistuð og deilt með vinum'); break;
    case 'sessshare': setSessionShare(d.id, d.v); if (draft && draft.id === d.id){ draft.share = d.v; saveDraft(); } render(); toast(d.v === 'none' ? 'Vinir sjá ekki þessa æfingu' : 'Vinir sjá þessa æfingu'); break;
    case 'invitesend': { const u = d.uid;
      if (social.incoming.some(r => r.from === u)) Store.respondRequest(me.uid, u, true).catch(fail('Samþykki'));
      else Store.sendRequest(me.uid, pname(me.uid), u).catch(fail('Beiðni'));
      closeSheet(); toast('Vinabeiðni send'); break; }
    case 'kudosopen': openKudosSheet(); break;
    case 'setback': ui.reorder = false; ui.tab = prevTab && prevTab !== 'settings' ? prevTab : 'home'; render(); window.scrollTo(0, 0); break;
    case 'addfriend': openAddFriend(''); break;
    case 'photopick': pickPhoto(); break;
    case 'goalsopen': ui.tab = 'progress'; ui.progMode = 'goals'; render(); window.scrollTo(0, 0); break;
    case 'goalnew': openGoalNew(); break;
    case 'goalpreset': goalDraft = newGoalDraft(JSON.parse(JSON.stringify(GOAL_PRESETS[+d.i].g))); openGoalForm(); break;
    case 'goaltype': goalDraft = newGoalDraft({ type: d.t, ...(d.t === 'runtime' ? { distance: 10, timeMin: 50 } : d.t === 'strength' ? { exId: 'x_bekkpressa', kg: null } : d.t === 'total' ? { metric: 'distance', target: 500 } : {}) }); openGoalForm(); break;
    case 'gfset': readGoalForm(); goalDraft[d.k] = d.k === 'distance' ? parseFloat(d.v) : d.v;
      if (d.k === 'activity' && !actHasDist(d.v) && goalDraft.metric === 'distance'){ goalDraft.metric = 'sessions'; goalDraft.target = goalDraft.type === 'weekly' ? 3 : 100; }
      if (d.k === 'metric') goalDraft.target = d.v === 'sessions' ? (goalDraft.type === 'weekly' ? 3 : 100) : d.v === 'minutes' ? (goalDraft.type === 'weekly' ? 150 : 3000) : (goalDraft.activity === 'swim' ? (goalDraft.type === 'weekly' ? 2000 : 50000) : (goalDraft.type === 'weekly' ? 20 : 500));
      openGoalForm(); break;
    case 'goalsave': saveGoal(); break;
    case 'goaledit': { const g = myGoals.find(x => x.id === d.id); if (g){ goalDraft = JSON.parse(JSON.stringify(g)); openGoalForm(); } break; }
    case 'goalarch': { const g = myGoals.find(x => x.id === d.id); if (g){ const st = g.status === 'archived' ? 'active' : 'archived'; g.status = st;
      Store.putGoal(me.uid, { id: g.id, status: st }, true).catch(fail('Breyting')); scheduleSync(); closeSheet(); render(); toast(st === 'archived' ? 'Markmið geymt' : 'Markmið virkt aftur'); } break; }
    case 'goaldel': if (confirm('Eyða markmiðinu?')){ myGoals = myGoals.filter(x => x.id !== d.id); Store.deleteGoal(me.uid, d.id).catch(fail('Eyðing')); closeSheet(); render(); toast('Markmiði eytt'); } break;
    case 'focusedit': openFocus(); break;
    case 'focustag': { const t = d.t, tags = goalDraft.tags; const i = tags.indexOf(t);
      if (i >= 0) tags.splice(i, 1); else if (tags.length < 3) tags.push(t); else { toast('Mest 3 merki'); break; }
      b.setAttribute('aria-pressed', String(i < 0)); break; }
    case 'focussave': saveFocus(); break;
    case 'closecel': { const c = b.closest('.celebrate'); if (c) c.remove(); break; }
    case 'aboutsex': b.parentElement.querySelectorAll('[data-act="aboutsex"]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); break;
    case 'aboutedit': openAbout(); break;
    case 'aboutsave': if (saveAboutFrom(false)){ closeSheet(); render(); toast('Upplýsingar vistaðar'); } break;
    case 'sportpick': b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); break;
    case 'sportsnext': { const sel = [...document.querySelectorAll('[data-act="sportpick"][aria-pressed="true"]')].map(x => x.dataset.k);
      if (!sel.length) return toast('Veldu að minnsta kosti eina íþrótt');
      settings = normalize({ ...settings, sports: sel }); applyAppearance(settings); writeLocal(settings);
      if (Store.saveSettings) Store.saveSettings(me.uid, settings).catch(() => {});
      gate = 'about'; render(); window.scrollTo(0, 0); break; }
    case 'aboutonboard': if (saveAboutFrom(true)){ trackSignup(); attach(); } break;
    case 'aboutskip': trackSignup(); attach(); break;
    case 'measurenew': openMeasure(null); break;
    case 'measuresave': saveMeasure(d.id || null); break;
    case 'measuredel': if (confirm('Eyða þessari mælingu?')){ measurements = measurements.filter(x => x.id !== d.id); Store.deleteMeasurement(me.uid, d.id).catch(fail('Eyðing')); closeSheet(); render(); toast('Mælingu eytt'); } break;
    case 'bodyopen': ui.tab = 'progress'; ui.progMode = 'body'; render(); window.scrollTo(0, 0); break;
    case 'photosave': savePhoto(); break;
    case 'photoremove': removePhoto(); break;
    case 'sharecode': shareFriendCode(); break;
    case 'sendreq': sendFriendRequest(); break;
    case 'acceptreq': Store.respondRequest(me.uid, d.from, true).then(() => toast('Nýr vinur')).catch(fail('Samþykki')); bump('totals', { friendships: 1 }); social.incoming = social.incoming.filter(r => r.from !== d.from); render(); break;
    case 'declinereq': Store.respondRequest(me.uid, d.from, false).catch(fail('Höfnun')); social.incoming = social.incoming.filter(r => r.from !== d.from); render(); break;
    case 'cancelreq': Store.cancelRequest(me.uid, d.to).catch(fail('Afturköllun')); social.outgoing = social.outgoing.filter(r => r.to !== d.to); openAddFriend(''); break;
    case 'unfriend': if (confirm('Fjarlægja vin? Þið hættið að sjá æfingar hvors annars.')){ Store.removeFriend(d.fid).catch(fail('Fjarlæging')); social.friends = social.friends.filter(f => f.fid !== d.fid); refreshSharedSubs(); closeSheet(); render(); } break;
    case 'fwprev': ui.fWeekOffset--; render(); break;
    case 'fwnext': if (ui.fWeekOffset < 0){ ui.fWeekOffset++; render(); } break;
    case 'newch': openNewChallenge(); break;
    case 'createch': createChallenge(); break;
    case 'leavech': if (confirm('Hætta í áskoruninni?')){ Store.leaveChallenge(d.cid, me.uid).catch(fail('Breyting')); challenges = challenges.filter(c => c.id !== d.cid); render(); } break;
    case 'delch': if (confirm('Eyða áskoruninni fyrir alla?')){ Store.deleteChallenge(d.cid).catch(fail('Eyðing')); challenges = challenges.filter(c => c.id !== d.cid); render(); } break;
    case 'newlog': ui.tab = 'log'; render(); window.scrollTo(0, 0); break;
    case 'wprev': ui.weekOffset--; render(); break;
    case 'wnext': if (ui.weekOffset < 0){ ui.weekOffset++; render(); } break;
    case 'pickex': openExPicker(); break;
    case 'curex': draft.cur = +d.ei; draft.editSet = null; saveDraft(); render(); window.scrollTo(0, 0); break;
    case 'step': step(d.k, +d.d); break;
    case 'doneset': doneSet(); break;
    case 'editset': { const ex = curEx(), st = ex.sets[+d.si]; draft.editSet = +d.si; ex.cur = {kg: fmtIn(st.kg), reps: String(st.reps)}; saveDraft(); render(); window.scrollTo(0, 0); break; }
    case 'canceledit': { const ex = curEx(); draft.editSet = null; ex.cur = suggestion(ex); saveDraft(); render(); break; }
    case 'rmset': { const ex = curEx(); ex.sets.splice(+d.si, 1); draft.editSet = null; ex.cur = suggestion(ex); saveDraft(); render(); break; }
    case 'rmex': draft.exercises.splice(draft.cur, 1); draft.cur = Math.max(0, draft.cur - 1); draft.editSet = null; saveDraft(); render(); break;
    case 'settype': draft.type = d.t; if (!subsOf(d.t) || !(draft.sub in subsOf(d.t))) draft.sub = firstSub(d.t); saveDraft(); render(); break;
    case 'setsub': draft.sub = d.s || null; saveDraft(); render(); break;
    case 'pbopen': openPbPicker(); break;
    case 'pbback': openPbPicker(); break;
    case 'pbsave': savePb(); break;
    case 'pbrm': draft.prs.splice(+d.i, 1); saveDraft(); render(); break;
    case 'pbcustom': openSheet('Annað personal best', `<div class="ff"><label for="pbname">Heiti</label><input class="in" id="pbname" placeholder="t.d. Wall walk eða Assault bike 50 cal" value="${esc((pbQuery || '').trim())}"></div>
      <div class="ff"><span class="flabel">Hvernig er það mælt?</span><div class="opts" style="padding:0">${['kg', 'time', 'reps'].map((k, i) => `<button class="chip" data-act="pbkind" data-v="${k}" aria-pressed="${i === 0}">${PB_KIND[k]}</button>`).join('')}</div></div>
      <button class="cta" data-act="pbcustomgo">Áfram</button><button class="btn ghost block" style="margin-top:8px" data-act="pbback">Til baka í listann</button>`); break;
    case 'pbkind': document.querySelectorAll('[data-act="pbkind"]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); break;
    case 'pbcustomgo': { const nm = ($('#pbname').value || '').trim(); if (!nm) { toast('Gefðu því heiti'); break; }
      const kb = document.querySelector('[data-act="pbkind"][aria-pressed="true"]'); openPbEntry(null, { name: nm.slice(0, 40), kind: kb ? kb.dataset.v : 'kg' }); break; }
    case 'wodpick': { const bm = BENCHMARKS[d.v]; draft.wod = d.v; if (bm){ draft.wodFormat = bm.f; if (!draft.wodDesc) draft.wodDesc = bm.d; } saveDraft(); render(); break; }
    case 'wodfmt': draft.wodFormat = d.v; saveDraft(); render(); break;
    case 'wodrx': draft.rx = d.v; saveDraft(); render(); break;
    case 'straddset': { const ex = draft.exercises[+d.ei]; ex.sets.push({ ...(ex.sets[ex.sets.length - 1] || { kg: '', reps: '' }) }); saveDraft(); render(); break; }
    case 'strmset': { const ex = draft.exercises[+d.ei]; ex.sets.splice(+d.si, 1); if (!ex.sets.length) draft.exercises.splice(+d.ei, 1); saveDraft(); render(); break; }
    case 'strm': draft.exercises.splice(+d.ei, 1); saveDraft(); render(); break;
    case 'setint': draft.intensity = draft.intensity === d.v ? '' : d.v; saveDraft(); render(); break;
    case 'spaopen': draft.spaOpen = true; saveDraft(); render(); break;
    case 'spaadd': { draft.spa = draft.spa || []; const last = [...draft.spa].reverse().find(x => x.kind === d.k);
      draft.spa.push({ kind: d.k, raw: last ? last.raw : SPA[d.k].def }); saveDraft(); render();
      const ins = view.querySelectorAll('[data-spa]'); if (ins.length) ins[ins.length - 1].scrollIntoView({ block: 'center' }); break; }
    case 'sparm': draft.spa.splice(+d.i, 1); saveDraft(); render(); break;
    case 'spastep': { const x = draft.spa[+d.i], v = parseDur(x.raw) || 0, step = v < 5 ? 0.5 : 1;
      const nv = Math.max(0, Math.round((v + (+d.d) * step) * 2) / 2); x.raw = Math.abs(nv - Math.round(nv)) > 0.01 ? fmtDur(nv) : String(nv);
      const inp = view.querySelector(`[data-spa="${d.i}"]`); if (inp) inp.value = x.raw; saveDraft(); updatePace(); break; }
    case 'seteffort': draft.effort = d.e || ''; saveDraft(); updatePace(); break;
    case 'cancel': {
      const hasData = isNewDraft() && ((draft.exercises || []).some(x => x.sets.length) || draft.distRaw || draft.durRaw || draft.notes);
      if (hasData && !confirm('Henda þessari skráningu?')) break;
      draft = null; saveDraft(); ui.tab = 'home'; render(); break; }
    case 'savelog': saveLog(); break;
    case 'dellog': if (confirm('Eyða þessari æfingu? Það er ekki hægt að afturkalla.')){ const id = draft.id;
      const owner = draft.profileId; state.sessions = state.sessions.filter(s => s.id !== id); Store.deleteSession(hid, id).catch(fail('Eyðing'));
      if (Store.deleteShared) Store.deleteShared(owner, id).catch(() => {});
      draft = null; saveDraft(); ui.tab = 'history'; render(); toast('Æfingu eytt'); } break;
    case 'hme': ui.histBoth = false; render(); break;
    case 'hboth': ui.histBoth = true; render(); break;
    case 'savenames':
      document.querySelectorAll('[data-pidname]').forEach(inp => { const id = inp.dataset.pidname, name = inp.value.trim();
        const p = state.profiles.find(x => x.id === id); if (p && p.name !== name){ p.name = name; Store.setProfileName(hid, id, name).catch(fail('Vistun nafns'));
          if (id === me.uid && Store.setPersonName) Store.setPersonName(id, name).catch(() => {}); } });
      closeSheet(); render(); toast('Nöfn vistuð'); break;
    case 'export': exportData(); break;
    case 'exportopen': openExport(); break;
    case 'exscope': ui.exScope = d.v; openExport(); break;
    case 'exfmt': ui.exFmt = d.v; openExport(); break;
    case 'excsv': exportCsv(d.t); break;
    case 'exxlsx': exportXlsx(); break;
    case 'doimport': doImport(); break;
  }
});
$('#settingsBtn').addEventListener('click', openSettings);
/* Mælir hve mikið pláss flipastikan tekur neðst (með upphækkaða Skrá-hnappnum og öryggissvæði símans),
   svo hægt sé að skruna öllu efni upp fyrir hana, líka þegar letur er stækkað í stillingum símans */
function measureTabs(){
  const t = document.querySelector('.tabs'); if (!t) return;
  const r = t.getBoundingClientRect();
  const raised = t.querySelector('.tab-log .plus'), top = raised ? Math.min(r.top, raised.getBoundingClientRect().top) : r.top;
  const space = r.height && getComputedStyle(t).display !== 'none' ? Math.ceil(window.innerHeight - top) : 0;
  if (space > 0) document.documentElement.style.setProperty('--tabspace', `${space}px`);
  else document.documentElement.style.removeProperty('--tabspace');
}
window.addEventListener('resize', measureTabs);
if (window.visualViewport) window.visualViewport.addEventListener('resize', measureTabs);
if (window.ResizeObserver){ const ro = new ResizeObserver(measureTabs); const tb = document.querySelector('.tabs'); if (tb) ro.observe(tb); }
setTimeout(measureTabs, 300);
/* Netsamband: allt vistast í símanum og sendist þegar netið kemur */
const netbar = document.createElement('div'); netbar.className = 'netbar'; netbar.setAttribute('role', 'status');
netbar.innerHTML = `<span class="nd" aria-hidden="true"></span><span><b>Ekkert netsamband.</b> Það sem þú skráir vistast í símanum og sendist sjálfkrafa þegar netið kemur.</span>`;
document.body.appendChild(netbar);
const netUpdate = () => { netbar.classList.toggle('show', navigator.onLine === false && gate === 'app'); };
window.addEventListener('offline', netUpdate);
window.addEventListener('online', () => { netUpdate(); if (gate === 'app') toast('Netið er komið. Samstilli…'); });
setTimeout(netUpdate, 500); setInterval(netUpdate, 4000);
/* Innskráning með netfangi */
document.addEventListener('submit', async e => {
  const f = e.target; if (!f || f.id !== 'authform') return;
  e.preventDefault(); if (authBusy) return;
  const mode = f.dataset.mode, email = ($('#au_email').value || '').trim(), pw = $('#au_pw') ? $('#au_pw').value : '', nameEl = $('#au_name');
  authEmail = email; if (nameEl) pendingName = nameEl.value.trim();
  authErr = ''; authInfo = '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { authErr = 'Sláðu inn gilt netfang.'; return render(); }
  if (mode === 'signup' && !pendingName) { authErr = 'Sláðu inn nafnið þitt.'; return render(); }
  if (mode === 'signup' && pw.length < 8) { authErr = 'Lykilorðið þarf að vera minnst 8 stafir.'; return render(); }
  if (mode === 'signin' && !pw) { authErr = 'Sláðu inn lykilorð.'; return render(); }
  authBusy = true; render();
  try {
    if (mode === 'signup') await Store.signUpEmail(pendingName, email, pw);
    else if (mode === 'signin') await Store.signInEmail(email, pw);
    else { await Store.resetPassword(email); authInfo = `Ef ${email} er skráð færðu póst með hlekk til að velja nýtt lykilorð. Athugaðu líka ruslpóstinn.`; }
  } catch(err){ authErr = authErrorText(err) || 'Það tókst ekki. Reyndu aftur.'; }
  authBusy = false; if (gate === 'login') render();
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'cmtext'){ updateCount(); return; }
  if (t.id === 'fbtext'){ fbDraft.text = t.value; const c = $('#fbcount'); if (c) c.textContent = `${t.value.length} / 1500`; const b = $('[data-act="fbsend"]'); if (b) b.disabled = !t.value.trim(); return; } if (!draft || !view.contains(t)) return;
  if (t.dataset.cur){ const ex = curEx(); if (ex){ ex.cur[t.dataset.cur] = t.value; saveDraft(); } return; }
  if (t.dataset.sei != null){ const ex = (draft.exercises || [])[+t.dataset.sei]; if (ex && ex.sets[+t.dataset.ssi]){ ex.sets[+t.dataset.ssi][t.dataset.sk] = t.value; saveDraft(); } return; }
  if (t.dataset.spa != null){ const x = (draft.spa || [])[+t.dataset.spa]; if (x){ x.raw = t.value; saveDraft(); updatePace(); } return; }
  const f = t.dataset.field; if (!f) return;
  if (f === 'distance'){ draft.distRaw = t.value; document.querySelectorAll('[data-act="distpre"]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.v === num(t.value)))); } else if (f === 'dur') draft.durRaw = t.value; else if (f === 'hr') draft.hrRaw = t.value; else draft[f] = t.value;
  if (f === 'course' && draft.type === 'golf' && !num(draft.par)){
    const prev = state.sessions.filter(x => x.type === 'golf' && x.sub === draft.sub && x.par && (x.course || '').toLowerCase() === t.value.trim().toLowerCase()).sort(byDateDesc)[0];
    if (prev){ draft.par = String(prev.par); const pi = $('#cf_par'); if (pi) pi.value = draft.par; }
  }
  saveDraft(); updatePace();
});
document.addEventListener('change', e => {
  const t = e.target, d = t.dataset || {};
  if (t.id === 'pex'){ ui.progEx = t.value; render(); return; }
  if (d.impi != null && importState){ importState.items[+d.impi].pick = t.checked; const n = importState.items.filter(x => x.pick).length;
    const go = $('[data-act="impgo"]'); if (go){ go.disabled = !n; go.textContent = `Lesa inn ${n} ${n % 10 === 1 && n % 100 !== 11 ? 'æfingu' : 'æfingar'}`; } return; }
  if (d.settoggle){ setSetting(d.settoggle, t.checked ? d.on : d.off); return; }
  if (d.setnum){ const v = num(t.value); setSetting(d.setnum, v); if (t.value && settings[d.setnum] == null) toast('Gildið er utan marka'); return; }
  if (d.gshare){ const g = myGoals.find(x => x.id === d.gshare); if (g){ g.shared = t.checked; Store.putGoal(me.uid, { id: g.id, shared: t.checked }, true).catch(fail('Breyting')); render(); toast(t.checked ? 'Vinir og maki sjá markmiðið' : 'Aðeins þú sérð markmiðið'); } return; }
  if (d.sporttoggle){ const on = t.checked, list = toggleIn(settings.sports, d.sporttoggle, on);
    if (!list.length){ t.checked = true; return toast('Veldu að minnsta kosti eina íþrótt'); }
    setSetting('sports', Object.keys(TYPES).filter(k => list.includes(k))); return; }
  if (d.homecard){ setSetting('homeHidden', toggleIn(settings.homeHidden, d.homecard, !t.checked)); return; }
  if (d.tabtoggle){ setSetting('tabsHidden', toggleIn(settings.tabsHidden, d.tabtoggle, !t.checked)); return; }
});
document.addEventListener('focusout', () => { if (pendingRender) setTimeout(() => { if (pendingRender) softRender(); }, 0); });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.dataset && e.target.dataset.cur){ e.preventDefault(); doneSet(); } });

/* ---------- Ræsing ---------- */
if (!Store.configured){ gate = 'config'; render(); }
else { render(); Store.onAuthChange(afterAuth); }

return { stop(){ clearInterval(tickTimer); clearTimeout(syncT); if (unsub) unsub(); if (measUnsub) measUnsub(); detachGoals(); detachSocial(); } };
}

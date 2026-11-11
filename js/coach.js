/* =====================================================================
   Æfingaplan („einkaþjálfari“) fyrir lyftingar.
   Uppsetning eins og hjá þjálfurum:
   - Fjölliðaæfing fyrst (þyngst og tæknilegust), svo aukaæfingar, einangrun síðast.
   - Aðalæfingar haldast eins milli skipta svo hægt sé að bæta sig (framvinda),
     aukaæfingum er skipt út reglulega fyrir fjölbreytni.
   - Tvöföld framvinda: þegar öll sett ná efri mörkum endurtekninga hækkar þyngdin.
   - Byrjendur fá færri sett, vélar og handlóð í stað tæknilegra stangaræfinga.
   ===================================================================== */
export const exId = name => 'x_' + name.toLowerCase().replace(/[^a-z0-9áðéíóúýþæö]+/g, '-');

/* Vöðvaflokkar sem notandinn velur */
export const GROUPS = {
  chest:     { name: 'Brjóst', hint: 'og þríhöfði' },
  back:      { name: 'Bak', hint: 'og tvíhöfði' },
  legs:      { name: 'Fætur', hint: 'framanverð læri' },
  glutes:    { name: 'Rass og aftanlæri', hint: 'mjaðmir' },
  shoulders: { name: 'Axlir', hint: '' },
  arms:      { name: 'Hendur', hint: 'tví- og þríhöfði' },
  core:      { name: 'Kviður og miðja', hint: '' }
};
export const COMBOS = {
  full:  { name: 'Allur líkaminn', hint: 'Gott 2–3 sinnum í viku', groups: ['legs', 'chest', 'back', 'glutes', 'shoulders', 'core'] },
  upper: { name: 'Efri hluti', hint: 'Brjóst, bak, axlir, hendur', groups: ['chest', 'back', 'shoulders', 'arms'] },
  lower: { name: 'Neðri hluti', hint: 'Fætur, rass, aftanlæri', groups: ['legs', 'glutes'] },
  push:  { name: 'Push', hint: 'Brjóst, axlir, þríhöfði', groups: ['chest', 'shoulders', 'arms'] },
  pull:  { name: 'Pull', hint: 'Bak, afturaxlir, tvíhöfði', groups: ['back', 'shoulders', 'arms'] }
};

/* Lýsing æfinga: vöðvi, tegund (fjölliða eða einangrun), búnaður og erfiðleiki (1 byrjendavænt – 3 tæknilegt) */
const M = (m, kind, eq, lvl, bw) => ({ m, kind, eq, lvl, bw: !!bw });
export const EXMETA = Object.fromEntries(Object.entries({
  'Bekkpressa': M('chest', 'c', 'bar', 2), 'Hallandi bekkpressa': M('chest', 'c', 'bar', 2), 'Handlóðapressa': M('chest', 'c', 'db', 1),
  'Brjóstpressa í vél': M('chest', 'c', 'mach', 1), 'Flugur (fly)': M('chest', 'i', 'db', 1), 'Hallandi handlóðapressa': M('chest', 'c', 'db', 1),
  'Niðurhallandi bekkpressa': M('chest', 'c', 'bar', 2), 'Kapalkross': M('chest', 'i', 'cable', 1), 'Flugur í vél (pec deck)': M('chest', 'i', 'mach', 1),
  'Armbeygjur': M('chest', 'c', 'bw', 1, 1), 'Dýfur': M('chest', 'c', 'bw', 2, 1),
  'Niðurtog (pull down)': M('back', 'c', 'cable', 1), 'Kapalróður': M('back', 'c', 'cable', 1), 'Handlóðaróður': M('back', 'c', 'db', 1),
  'Upphífingar': M('back', 'c', 'bw', 2, 1), 'Réttstöðulyfta': M('back', 'c', 'bar', 3), 'Bakfettur': M('back', 'i', 'bw', 1, 1),
  'Stangaróður': M('back', 'c', 'bar', 2), 'T-stangarróður': M('back', 'c', 'bar', 2), 'Róður í vél': M('back', 'c', 'mach', 1),
  'Hökulyftur (chin-up)': M('back', 'c', 'bw', 2, 1), 'Upphífingar með aðstoð': M('back', 'c', 'mach', 1), 'Niðurtog, mjótt grip': M('back', 'c', 'cable', 1),
  'Beinarma niðurtog': M('back', 'i', 'cable', 1), 'Axlayppingar (shrugs)': M('back', 'i', 'db', 1),
  'Fótapressa': M('legs', 'c', 'mach', 1), 'Hnébeygja': M('legs', 'c', 'bar', 3), 'Fótarétta': M('legs', 'i', 'mach', 1),
  'Fótakreppa': M('glutes', 'i', 'mach', 1), 'Framstig': M('legs', 'c', 'db', 1), 'Kálfalyfta': M('legs', 'i', 'mach', 1),
  'Rúmensk réttstöðulyfta (RDL)': M('glutes', 'c', 'bar', 2), 'Hack squat': M('legs', 'c', 'mach', 1), 'Framhnébeygja': M('legs', 'c', 'bar', 3),
  'Bikarhnébeygja (goblet)': M('legs', 'c', 'db', 1), 'Búlgarskt framstig': M('legs', 'c', 'db', 2), 'Hnébeygja í Smith-vél': M('legs', 'c', 'mach', 1),
  'Uppstig (step-up)': M('legs', 'c', 'db', 1), 'Fótakreppa sitjandi': M('glutes', 'i', 'mach', 1), 'Kálfalyfta sitjandi': M('legs', 'i', 'mach', 1),
  'Súmó-réttstöðulyfta': M('glutes', 'c', 'bar', 3),
  'Mjaðmalyfta (hip thrust)': M('glutes', 'c', 'bar', 2), 'Mjaðmabrú (glute bridge)': M('glutes', 'c', 'bw', 1, 1),
  'Mjaðmaútfærsla í vél': M('glutes', 'i', 'mach', 1), 'Rassspyrna í kapli': M('glutes', 'i', 'cable', 1),
  'Axlapressa': M('shoulders', 'c', 'bar', 2), 'Hliðarlyftur': M('shoulders', 'i', 'db', 1), 'Face pull': M('shoulders', 'i', 'cable', 1),
  'Axlarpressa í vél': M('shoulders', 'c', 'mach', 1), 'Handlóðaaxlapressa': M('shoulders', 'c', 'db', 1), 'Arnold-pressa': M('shoulders', 'c', 'db', 2),
  'Framlyftur': M('shoulders', 'i', 'db', 1), 'Afturaxlaflugur': M('shoulders', 'i', 'db', 1), 'Uppréttur róður': M('shoulders', 'i', 'bar', 2),
  'Hliðarlyftur í kapli': M('shoulders', 'i', 'cable', 1), 'Push press': M('shoulders', 'c', 'bar', 3),
  'Curl (tvíhöfði)': M('arms', 'i', 'db', 1), 'Hammer curl': M('arms', 'i', 'db', 1), 'Þríhöfðapressa (pushdown)': M('arms', 'i', 'cable', 1),
  'Franskar pressur': M('arms', 'i', 'bar', 2), 'Stangarkrulla': M('arms', 'i', 'bar', 1), 'Preacher curl': M('arms', 'i', 'mach', 1),
  'Kapalkrulla': M('arms', 'i', 'cable', 1), 'Einbeitingarkrulla': M('arms', 'i', 'db', 1), 'Þríhöfðalenging yfir höfuð': M('arms', 'i', 'cable', 1),
  'Bekkpressa, mjótt grip': M('arms', 'c', 'bar', 2), 'Þríhöfðaspyrna (kickback)': M('arms', 'i', 'db', 1),
  'Kviðkreppur': M('core', 'i', 'bw', 1, 1), 'Fótalyftur': M('core', 'i', 'bw', 1, 1), 'Kapalkreppur': M('core', 'i', 'cable', 1),
  'Rússneskur snúningur': M('core', 'i', 'bw', 1, 1), 'Kviðhjól': M('core', 'i', 'bw', 2, 1), 'Hangandi fótalyftur': M('core', 'i', 'bw', 2, 1),
  'Kviðkreppur í vél': M('core', 'i', 'mach', 1), 'Pallof-pressa': M('core', 'i', 'cable', 1)
}).map(([n, m]) => [exId(n), { ...m, name: n }]));

/* Æfingaplön eftir vöðvaflokki. Hver lína er „hólf“ með hlutverk og valkostum í forgangsröð.
   b = valkostir fyrir byrjendur (ef ekki tilgreint: þeir valkostir sem eru ekki of tæknilegir). */
const S = (r, o, b) => ({ r, o: o.map(exId), b: b ? b.map(exId) : null });
const SLOTS = {
  chest: [
    S('main', ['Bekkpressa', 'Handlóðapressa'], ['Brjóstpressa í vél', 'Handlóðapressa']),
    S('main2', ['Hallandi handlóðapressa', 'Hallandi bekkpressa'], ['Hallandi handlóðapressa']),
    S('acc', ['Dýfur', 'Brjóstpressa í vél', 'Niðurhallandi bekkpressa', 'Armbeygjur'], ['Brjóstpressa í vél', 'Armbeygjur']),
    S('iso', ['Kapalkross', 'Flugur í vél (pec deck)', 'Flugur (fly)']),
    S('iso', ['Þríhöfðapressa (pushdown)', 'Þríhöfðalenging yfir höfuð', 'Franskar pressur']),
    S('iso', ['Hliðarlyftur', 'Hliðarlyftur í kapli'])],
  back: [
    S('main', ['Upphífingar', 'Niðurtog (pull down)', 'Hökulyftur (chin-up)'], ['Niðurtog (pull down)', 'Upphífingar með aðstoð']),
    S('main2', ['Stangaróður', 'T-stangarróður', 'Kapalróður'], ['Róður í vél', 'Kapalróður']),
    S('acc', ['Handlóðaróður', 'Kapalróður', 'Niðurtog, mjótt grip']),
    S('iso', ['Face pull', 'Afturaxlaflugur', 'Beinarma niðurtog']),
    S('iso', ['Curl (tvíhöfði)', 'Hammer curl', 'Kapalkrulla', 'Stangarkrulla']),
    S('core', ['Bakfettur', 'Axlayppingar (shrugs)'])],
  legs: [
    S('main', ['Hnébeygja', 'Framhnébeygja', 'Hack squat'], ['Bikarhnébeygja (goblet)', 'Fótapressa', 'Hnébeygja í Smith-vél']),
    S('main2', ['Rúmensk réttstöðulyfta (RDL)'], ['Rúmensk réttstöðulyfta (RDL)']),
    S('acc', ['Fótapressa', 'Hack squat', 'Hnébeygja í Smith-vél'], ['Fótapressa']),
    S('acc', ['Búlgarskt framstig', 'Framstig', 'Uppstig (step-up)'], ['Framstig', 'Uppstig (step-up)']),
    S('iso', ['Fótarétta', 'Fótakreppa', 'Fótakreppa sitjandi']),
    S('iso', ['Kálfalyfta', 'Kálfalyfta sitjandi'])],
  glutes: [
    S('main', ['Mjaðmalyfta (hip thrust)'], ['Mjaðmabrú (glute bridge)', 'Mjaðmalyfta (hip thrust)']),
    S('main2', ['Rúmensk réttstöðulyfta (RDL)', 'Súmó-réttstöðulyfta'], ['Rúmensk réttstöðulyfta (RDL)']),
    S('acc', ['Búlgarskt framstig', 'Uppstig (step-up)', 'Framstig'], ['Uppstig (step-up)', 'Framstig']),
    S('iso', ['Fótakreppa', 'Fótakreppa sitjandi']),
    S('iso', ['Mjaðmaútfærsla í vél', 'Rassspyrna í kapli']),
    S('core', ['Bakfettur'])],
  shoulders: [
    S('main', ['Axlapressa', 'Handlóðaaxlapressa', 'Push press'], ['Axlarpressa í vél', 'Handlóðaaxlapressa']),
    S('main2', ['Arnold-pressa', 'Handlóðaaxlapressa', 'Axlarpressa í vél'], ['Handlóðaaxlapressa', 'Axlarpressa í vél']),
    S('iso', ['Hliðarlyftur', 'Hliðarlyftur í kapli']),
    S('iso', ['Afturaxlaflugur', 'Face pull']),
    S('acc', ['Uppréttur róður', 'Framlyftur'], ['Framlyftur']),
    S('iso', ['Axlayppingar (shrugs)'])],
  arms: [
    S('main', ['Bekkpressa, mjótt grip', 'Dýfur'], ['Þríhöfðapressa (pushdown)']),
    S('main2', ['Stangarkrulla', 'Curl (tvíhöfði)'], ['Curl (tvíhöfði)']),
    S('iso', ['Franskar pressur', 'Þríhöfðalenging yfir höfuð'], ['Þríhöfðalenging yfir höfuð']),
    S('iso', ['Hammer curl', 'Preacher curl', 'Kapalkrulla']),
    S('iso', ['Þríhöfðapressa (pushdown)', 'Þríhöfðaspyrna (kickback)']),
    S('iso', ['Einbeitingarkrulla', 'Kapalkrulla'])],
  core: [
    S('core', ['Kviðhjól', 'Hangandi fótalyftur'], ['Fótalyftur', 'Kviðkreppur']),
    S('core', ['Kapalkreppur', 'Kviðkreppur í vél']),
    S('core', ['Pallof-pressa', 'Rússneskur snúningur']),
    S('core', ['Fótalyftur', 'Kviðkreppur']),
    S('core', ['Bakfettur'])]
};
/* Samsett plön: valin hólf úr hverjum flokki, í þeirri röð sem þjálfari raðar þeim */
const PICK = (g, i) => ({ g, i });
const COMBO_SLOTS = {
  full:  [PICK('legs', 0), PICK('chest', 0), PICK('back', 1), PICK('glutes', 1), PICK('shoulders', 2), PICK('core', 0), PICK('back', 0)],
  upper: [PICK('chest', 0), PICK('back', 1), PICK('shoulders', 0), PICK('back', 0), PICK('arms', 1), PICK('arms', 4), PICK('shoulders', 2)],
  lower: [PICK('legs', 0), PICK('glutes', 1), PICK('glutes', 0), PICK('legs', 3), PICK('glutes', 3), PICK('legs', 5), PICK('core', 0)],
  push:  [PICK('chest', 0), PICK('shoulders', 0), PICK('chest', 1), PICK('shoulders', 2), PICK('chest', 3), PICK('arms', 4)],
  pull:  [PICK('back', 0), PICK('back', 1), PICK('back', 2), PICK('shoulders', 3), PICK('arms', 1), PICK('arms', 3)]
};

/* Markmið: sett × endurtekningar og hvíld (sekúndur) eftir hlutverki æfingar */
export const GOALS = {
  strength: { name: 'Styrkur', short: 'Þungt, fáar endurtekningar', desc: 'Byggir upp hámarksstyrk. Þungar fjölliðaæfingar með lengri hvíld.',
    main: [4, 4, 6, 180], main2: [3, 6, 8, 150], acc: [3, 6, 10, 120], iso: [3, 8, 12, 75], core: [3, 8, 12, 60] },
  pump: { name: 'Pump', short: 'Vöðvastækkun, 8–12 endurtekningar', desc: 'Vöðvastækkun og mótun. Miðlungsþyngd, styttri hvíld og meiri „pump“.',
    main: [4, 8, 10, 120], main2: [3, 8, 12, 90], acc: [3, 10, 12, 75], iso: [3, 12, 15, 60], core: [3, 12, 15, 45] },
  endurance: { name: 'Þol', short: 'Létt, 15–20 endurtekningar', desc: 'Vöðvaþol og brennsla. Léttari þyngdir, margar endurtekningar, stutt hvíld.',
    main: [3, 12, 15, 60], main2: [3, 15, 20, 45], acc: [3, 15, 20, 45], iso: [2, 15, 20, 30], core: [3, 15, 20, 30] }
};
export const LEVELS = { beginner: { name: 'Byrjandi', rir: '2–3 endurtekningar eftir í tankinum' }, advanced: { name: 'Vanur', rir: '1–2 endurtekningar eftir í tankinum' } };

/* Sett, endurtekningar og hvíld fyrir hlutverk. Byrjendur: mest 3 sett og ekki undir 6 endurtekningum (tækni og öryggi). */
export function rxFor(goal, role, level){
  const G = GOALS[goal] || GOALS.pump, rx = (G[role] || G.acc).slice();
  if (level === 'beginner'){ rx[0] = Math.min(rx[0], 3); if (rx[1] < 6){ rx[1] = 6; rx[2] = Math.max(rx[2], 8); } }
  return rx;
}
/* Fjöldi æfinga eftir tíma og reynslu (styrkur hefur lengri hvíld, því einni færri) */
function countFor(mins, goal, level){
  let n = mins <= 30 ? 4 : mins <= 45 ? 5 : 6;
  if (goal === 'strength') n -= 1;
  if (level === 'beginner') n = Math.min(n, 5);
  return Math.max(3, n);
}

/* Þyngdaraukning: neðri hluti í fjölliðu 5 kg, annars 2,5 kg; handlóð í 2 kg skrefum */
export function incOf(id){
  const m = EXMETA[id]; if (!m) return 2.5;
  if (m.eq === 'db') return 2;
  if (m.kind === 'c' && ['legs', 'glutes'].includes(m.m) && m.eq !== 'db') return 5;
  return 2.5;
}
const roundTo = (v, step) => Math.max(0, Math.round(v / step) * step);
const e1rm = (kg, reps) => kg * (1 + reps / 30);

/* Tillaga að þyngd og endurtekningum (tvöföld framvinda).
   hist = fyrri skipti æfingarinnar, nýjast fyrst: [{ date, sets:[{kg,reps}], t:{lo,hi} }] */
export function prescribe(id, rx, hist){
  const [sets, lo, hi, rest] = rx, meta = EXMETA[id] || {}, inc = incOf(id);
  const out = { sets, lo, hi, rest, kg: null, reps: hi, note: '', trend: '' };
  const last = (hist || [])[0];
  if (meta.bw && (!last || !last.sets.some(s => s.kg > 0))){ out.kg = 0; out.note = 'Eigin líkamsþyngd'; return out; }
  if (!last || !last.sets.length){ out.reps = lo; out.note = `Ný æfing: veldu þyngd sem þú ræður við ${hi + 2} sinnum`; return out; }
  const work = last.sets.filter(s => s.reps > 0), top = work.reduce((m, s) => (s.kg > m.kg || (s.kg === m.kg && s.reps > m.reps)) ? s : m, work[0] || { kg: 0, reps: 0 });
  /* Sama endurtekningabil og síðast (eða skráð án plans en innan bilsins): tvöföld framvinda. Annars áætlun út frá 1RM. */
  const sameRange = last.t ? (last.t.lo === lo && last.t.hi === hi) : (top.reps >= lo && top.reps <= hi + 1);
  if (sameRange){
    const topKgSets = work.filter(s => s.kg === top.kg);
    if (topKgSets.length >= Math.min(sets, (last.t && last.t.sets) || sets) && topKgSets.every(s => s.reps >= hi)){
      out.kg = top.kg + inc; out.reps = lo; out.trend = `+${String(inc).replace('.', ',')} kg`; out.note = `Þú náðir ${hi} endurtekningum í öllum settum síðast. Þyngdin hækkar.`;
    } else {
      const minReps = Math.min(...topKgSets.map(s => s.reps));
      out.kg = top.kg; out.reps = Math.min(hi, Math.max(lo, minReps + 1)); out.note = `Sama þyngd. Reyndu að ná ${out.reps}+ endurtekningum í hverju setti.`;
    }
  } else {
    const mid = Math.round((lo + hi) / 2), est = e1rm(top.kg, top.reps);
    out.kg = roundTo(est / (1 + (mid + 2) / 30), meta.eq === 'db' ? 2 : 2.5); out.reps = mid;
    out.note = 'Áætlað út frá síðustu skiptum. Stilltu ef þetta er of létt eða þungt.';
  }
  return out;
}

/* Byggir upp æfinguna. ctx: { hist(id) → fyrri skipti, recent(id) → dagar síðan síðast (eða null), keep: { slotKey: id } } */
export function buildPlan(opt, ctx){
  const { groups = [], combo = null, goal = 'pump', level = 'advanced', mins = 45, shuffle = 0 } = opt;
  const G = GOALS[goal] || GOALS.pump;
  let slots;
  if (combo && COMBO_SLOTS[combo]) slots = COMBO_SLOTS[combo].map(p => ({ ...SLOTS[p.g][p.i], key: `${p.g}${p.i}` }));
  else {
    /* Einn eða tveir flokkar: aðalæfingar fyrst, svo aukaæfingar til skiptis milli flokka (eins og þjálfarar para saman) */
    const lists = groups.map(g => SLOTS[g].map((s, i) => ({ ...s, key: `${g}${i}` })));
    slots = []; const max = Math.max(0, ...lists.map(l => l.length));
    for (let i = 0; i < max; i++) lists.forEach(l => { if (l[i]) slots.push(l[i]); });
    if (groups.length > 1) slots.sort((a, b) => rank(a.r) - rank(b.r));
  }
  if (goal === 'strength' && level === 'advanced' && groups.includes('back') && !combo) slots.unshift({ r: 'main', o: [exId('Réttstöðulyfta')], b: null, key: 'back-dl' });
  const n = countFor(mins, goal, level), used = new Set(), out = [];
  for (const s of slots){
    if (out.length >= n) break;
    let opts = (level === 'beginner' && s.b) ? s.b : s.o;
    if (level === 'beginner') opts = opts.filter(id => (EXMETA[id] || {}).lvl !== 3);
    opts = opts.filter(id => !used.has(id));
    if (!opts.length) continue;
    let id;
    if (ctx.keep && ctx.keep[s.key] && opts.includes(ctx.keep[s.key])) id = ctx.keep[s.key];
    else if (s.r === 'main' || s.r === 'main2') id = opts[0];                                  /* aðalæfingar haldast eins: framvinda */
    else { /* aukaæfingar: sú sem lengst er síðan var tekin, svo fjölbreytnin haldist */
      const scored = opts.map((x, i) => ({ x, i, d: ctx.recent ? ctx.recent(x) : null }));
      scored.sort((a, b) => (b.d ?? 999) - (a.d ?? 999) || a.i - b.i);
      id = scored[(shuffle) % scored.length].x;
    }
    used.add(id);
    const role = s.r, rx = rxFor(goal, role, level);
    const p = prescribe(id, rx, ctx.hist ? ctx.hist(id) : []);
    out.push({ exId: id, name: (EXMETA[id] || {}).name, role, slot: s.key, alts: [...new Set([...s.o, ...(s.b || [])])].filter(x => x !== id), ...p });
  }
  return out;
}
const rank = r => ({ main: 0, main2: 1, acc: 2, iso: 3, core: 4 }[r] ?? 5);

/* Aðrar æfingar fyrir sama vöðva, til að skipta út */
export function alternatives(item){
  const m = (EXMETA[item.exId] || {}).m;
  const same = Object.keys(EXMETA).filter(id => EXMETA[id].m === m && id !== item.exId && !item.alts.includes(id));
  return [...item.alts, ...same];
}
/* Áætlaður tími: um 40 sek á sett + hvíld, auk upphitunar */
export const estMinutes = plan => Math.round(6 + plan.reduce((a, x) => a + x.sets * (40 + x.rest) / 60, 0));
export const restTxt = s => s >= 120 ? `${(s / 60).toString().replace('.', ',')} mín` : s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} mín` : `${s} sek`;
export const ROLE_NAME = { main: 'Aðalæfing', main2: 'Fjölliðaæfing', acc: 'Aukaæfing', iso: 'Einangrun', core: 'Miðja' };

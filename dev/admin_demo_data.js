/* Sýnishorn: tilbúnar nafnlausar samtölur fyrir um 140 notendur yfir 90 daga */
function demoMetrics(){
  let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const pad = n => String(n).padStart(2, '0'), ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const wk = d => { const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1)); return `${x.getUTCFullYear()}-W${pad(Math.ceil(((x - y0) / 86400000 + 1) / 7))}`; };
  const typeW = { lift: 30, run: 22, walk: 12, swim: 11, hike: 5, bike: 5, class: 6, yoga: 3, golf: 3, racket: 2, ski: 1, other: 2 };
  const pickType = () => { let r = rnd() * 102, a = 0; for (const [k, v] of Object.entries(typeW)) { a += v; if (r < a) return k; } return 'other'; };
  const days = [], weeks = {}, totals = { sessions: 0, sessionsByType: {} }; let users = 0;
  for (let i = 89; i >= 0; i--){
    const d = new Date(); d.setDate(d.getDate() - i); const growth = 1 + (89 - i) / 60, dow = d.getDay();
    const newUsers = Math.round(rnd() * 3 * growth); users += newUsers;
    const active = Math.round((18 + rnd() * 10) * growth * (dow === 0 ? 0.7 : dow === 6 ? 0.8 : 1));
    const sessions = Math.round(active * (0.85 + rnd() * 0.3));
    const byType = {}, hours = {};
    for (let s = 0; s < sessions; s++){ const t = pickType(); byType[t] = (byType[t] || 0) + 1;
      const h = [6, 7, 7, 12, 16, 17, 17, 18, 18, 19, 20, 21][Math.floor(rnd() * 12)]; hours[h] = (hours[h] || 0) + 1; }
    days.push({ id: `day-${ymd(d)}`, active, sessions, newUsers, sessionsByType: byType, hours, platform: { android: Math.round(active * 0.62), ios: Math.round(active * 0.3), desktop: Math.round(active * 0.08) } });
    totals.sessions += sessions; Object.entries(byType).forEach(([k, v]) => totals.sessionsByType[k] = (totals.sessionsByType[k] || 0) + v);
    const w = wk(d); weeks[w] = Math.max(weeks[w] || 0, Math.round(active * 2.6));
  }
  Object.assign(totals, { users,
    exercises: { 'x_bekkpressa': 812, 'x_hnébeygja': 640, 'x_niðurtog-pull-down-': 590, 'x_fótapressa': 552, 'x_axlapressa': 410, 'x_réttstöðulyfta': 388,
      'x_curl-tvíhöfði-': 371, 'x_kapalróður': 302, 'x_mjaðmalyfta-hip-thrust-': 285, 'x_rúmensk-réttstöðulyfta-rdl-': 240, 'x_þríhöfðapressa-pushdown-': 233,
      'x_hliðarlyftur': 214, 'x_stangaróður': 180, 'x_framstig': 152, 'x_fótakreppa': 140, 'x_upphífingar': 133 },
    subs: { class_spin: 140, class_crossfit: 96, class_hiit: 70, golf_h18: 61, golf_range: 48, golf_h9: 22, yoga_hot: 51, yoga_yoga: 40, racket_padel: 77, racket_tennis: 12, ski_xc: 19, ski_alpine: 14 },
    cfPbs: { 'Back squat': 58, 'Deadlift': 51, 'Snatch': 44, 'Clean & jerk': 39, 'Fran': 31, 'Upphífingar (max)': 27, 'Róður 2000 m': 22, 'Murph': 18, 'Annað': 15 },
    pools: { 'Laugardalslaug': 188, 'Vesturbæjarlaug': 161, 'Sundhöll Reykjavíkur': 97, 'Árbæjarlaug': 84, 'Salalaug Kópavogi': 77, 'Sundlaug Akureyrar': 70, 'Ásvallalaug': 61, 'Lágafellslaug': 48, 'Sky Lagoon': 31, 'Sundhöll Selfoss': 26 },
    spa: { hot: 402, cold: 288, sauna: 231, steam: 120, infrared: 66 },
    imports: { garmin: 214, apple: 162, strava: 88, tcx: 11, gpx: 6 },
    goals: { weekly: 168, strength: 74, runtime: 52, total: 31 }, goalsAchieved: { weekly: 0, strength: 29, runtime: 21, total: 8 },
    kudos: { fire: 1210, muscle: 980, clap: 760, sweat: 520 }, friendships: 212, couples: 38, challenges: 27,
    visibility: { ask: 71, summary: 44, full: 15, none: 12 }, platform: { android: 88, ios: 46, desktop: 8 },
    sportsSelected: { lift: 120, run: 98, swim: 84, walk: 77, hike: 52, bike: 40, golf: 31, class: 45, yoga: 22, racket: 19 },
    appearance: { weekStyle_A: 70, weekStyle_B: 28, weekStyle_C: 31, weekStyle_D: 13 } });
  const cohorts = {};
  for (let c = 0; c < 8; c++){ const d = new Date(); d.setDate(d.getDate() - 7 * c); const base = 10 + Math.round(rnd() * 12); const o = { w0: base };
    for (let w = 1; w <= c; w++) o[`w${w}`] = Math.round(base * Math.max(0.28, 0.8 - w * 0.07 + (rnd() - 0.5) * 0.08)); cohorts[wk(d)] = o; }
  const ago = n => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString(); };
  const feedback = [
    { id: 'f1', type: 'idea', text: 'Væri frábært að geta vistað æfingu sem sniðmát, t.d. „Fótadagur“, og byrjað hana aftur með einum smelli.', at: ago(0), version: '2.1', platform: 'android', status: 'new', name: 'Halla', email: 'halla@daemi.is' },
    { id: 'f2', type: 'bug', text: 'Þegar ég sný símanum á hlið í skráningu lyftinga hverfur Klára sett hnappurinn undir stikuna.', at: ago(1), version: '2.1', platform: 'ios', screen: 'log', status: 'new' },
    { id: 'f3', type: 'idea', text: 'Planki og aðrar æfingar mældar í sekúndum.', at: ago(2), version: '2.0', platform: 'android', status: 'new' },
    { id: 'f4', type: 'other', text: 'Elska hrósin! Við hjónin keppum núna í hverri viku 😄', at: ago(4), version: '2.0', platform: 'android', status: 'new' },
    { id: 'f5', type: 'bug', text: 'Innlestur úr Garmin sýndi sund í km í stað metra.', at: ago(9), version: '1.8', platform: 'desktop', screen: 'log', status: 'done' }];
  return { feedback, totals, cohorts, custom: { names: { 'ketilbjöllu sveifla rússnesk': 23, 'sled push': 19, 'farmers walk': 17, 'planki': 15, 'battle ropes': 11, 'hip abduction standandi': 7, 'wall balls': 6 } },
    days, weeks: Object.entries(weeks).map(([k, v]) => ({ id: `week-${k}`, active: v })) };
}

/* =====================================================================
   Stjórnborð Æfingabókarinnar: teiknar nafnlausar samtölur úr metrics/.
   renderDashboard(el, m) þar sem m = { totals, custom, cohorts, days: [{id, ...}], weeks: [{id, ...}] }
   ===================================================================== */
const SPORTS = { lift: 'Lyftingar', run: 'Hlaup', walk: 'Ganga', hike: 'Fjallganga', swim: 'Sund', bike: 'Hjól', ski: 'Skíði', class: 'Hóptími',
  yoga: 'Jóga og teygjur', ball: 'Boltaíþróttir', racket: 'Spaðaíþróttir', golf: 'Golf', row: 'Róður', climb: 'Klifur', combat: 'Bardagaíþróttir', dance: 'Dans', other: 'Annað' };
const SUBS = { golf_h18: 'Golf: 18 holur', golf_h9: 'Golf: 9 holur', golf_range: 'Golf: driving range', golf_short: 'Golf: stutta spilið',
  ski_xc: 'Gönguskíði', ski_alpine: 'Svigskíði', ski_touring: 'Fjallaskíði', class_spin: 'Spinning', class_crossfit: 'CrossFit', class_hiit: 'HIIT',
  class_pump: 'Body Pump', class_circuit: 'Hringþjálfun', class_zumba: 'Zumba', class_boxfit: 'Boxfit', yoga_yoga: 'Jóga', yoga_hot: 'Heitt jóga',
  yoga_pilates: 'Pilates', yoga_stretch: 'Teygjur', yoga_mobility: 'Liðleiki', racket_padel: 'Padel', racket_tennis: 'Tennis', racket_badminton: 'Badminton',
  racket_squash: 'Squash', racket_tabletennis: 'Borðtennis', ball_football: 'Fótbolti', ball_basketball: 'Körfubolti', ball_handball: 'Handbolti',
  ball_volleyball: 'Blak', row_erg: 'Róðravél', row_kayak: 'Kajak', climb_boulder: 'Grjótglíma', climb_rope: 'Línuklifur', combat_box: 'Box',
  combat_kickbox: 'Kickbox', combat_bjj: 'BJJ', combat_judo: 'Júdó', combat_karate: 'Karate', combat_mma: 'MMA' };
const SPA = { hot: 'Heiti potturinn', steam: 'Gufa', sauna: 'Sauna', infrared: 'Infrarauð sauna', cold: 'Kaldi potturinn' };
const REACT = { fire: '🔥 Eldur', muscle: '💪 Kraftur', sweat: '🥵 Sveitt', clap: '👏 Vel gert' };
const VIS = { none: 'Ekkert', ask: 'Spyrja í hvert skipti', summary: 'Alltaf yfirlit', full: 'Alltaf allt' };
const GOALS = { weekly: 'Vikuleg venja', strength: 'Styrkur', runtime: 'Hraði', total: 'Heildarmarkmið' };
const SOURCES = { garmin: 'Garmin', apple: 'Apple Watch', strava: 'Strava', gpx: 'GPX-skrá', tcx: 'TCX-skrá' };
const PLAT = { android: 'Android', ios: 'iPhone', desktop: 'Tölva' };
const DAYS = ['Sunnudagur', 'Mánudagur', 'Þriðjudagur', 'Miðvikudagur', 'Fimmtudagur', 'Föstudagur', 'Laugardagur'];
const DSHORT = ['sun', 'mán', 'þri', 'mið', 'fim', 'fös', 'lau'];
const DPL = ['sunnudögum', 'mánudögum', 'þriðjudögum', 'miðvikudögum', 'fimmtudögum', 'föstudögum', 'laugardögum'];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = (n, d = 0) => { try { return new Intl.NumberFormat('is-IS', { maximumFractionDigits: d }).format(n || 0); } catch(e){ return String(Math.round((n || 0) * 10 ** d) / 10 ** d); } };
const pct = (a, b) => b ? `${nf(a / b * 100, a / b < 0.1 ? 1 : 0)}%` : '–';
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const sumMap = o => Object.values(o || {}).reduce((a, v) => a + (typeof v === 'number' ? Math.max(0, v) : 0), 0);
const sorted = o => Object.entries(o || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
const exName = id => { const s = String(id).replace(/^x_/, '').replace(/-+/g, ' ').trim(); return s.charAt(0).toUpperCase() + s.slice(1); };

function bars(entries, label, color, max){
  if (!entries.length) return `<p class="tiny">Engin gögn ennþá.</p>`;
  const top = max || entries[0][1] || 1, total = entries.reduce((a, [, v]) => a + v, 0);
  return `<ol class="abars">${entries.map(([k, v], i) => `<li><span class="ar">${i + 1}</span><span class="an">${esc(label(k))}</span>
    <span class="ab"><span style="width:${Math.max(2, Math.round(v / top * 100))}%;background:${color(k)}"></span></span>
    <span class="av">${nf(v)}<small>${pct(v, total)}</small></span></li>`).join('')}</ol>`;
}
function lineSvg(series, colors, labels){
  const W = 640, H = 200, L = 36, R = 10, T = 12, B = 26, n = labels.length;
  const max = Math.max(1, ...series.flat()), top = max <= 5 ? 5 : Math.ceil(max / 5) * 5;
  const x = i => L + (n <= 1 ? 0 : i * (W - L - R) / (n - 1)), y = v => T + (H - T - B) * (1 - v / top);
  const step = Math.ceil(n / 8);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" class="achart">
    ${[0, top / 2, top].map(t => `<line class="ax" x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/><text x="${L - 6}" y="${y(t) + 3}" text-anchor="end">${nf(t)}</text>`).join('')}
    ${series.map((s, si) => `<path d="${s.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')}" fill="none" stroke="${colors[si]}" stroke-width="2.6" stroke-linejoin="round"/>`).join('')}
    ${labels.map((l, i) => i % step === 0 || i === n - 1 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${l}</text>` : '').join('')}</svg>`;
}
function colBars(vals, labels, color, hi){
  const W = 640, H = 170, L = 30, R = 6, T = 10, B = 24, n = vals.length, max = Math.max(1, ...vals), bw = (W - L - R) / n;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" class="achart">
    <line class="ax" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/>
    ${vals.map((v, i) => { const h = (H - T - B) * v / max; return `<rect x="${(L + i * bw + bw * 0.15).toFixed(1)}" y="${(H - B - h).toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${i === hi ? 'var(--c-run)' : color}"><title>${labels[i]}: ${nf(v)}</title></rect>`; }).join('')}
    ${labels.map((l, i) => `<text x="${(L + i * bw + bw / 2).toFixed(1)}" y="${H - 7}" text-anchor="middle">${l}</text>`).join('')}</svg>`;
}

const FB = { idea: '💡 Hugmynd', bug: '🐞 Villa', other: '💬 Annað' };
function feedbackSection(list, filter){
  const open = list.filter(f => f.status !== 'done'), shown = (filter === 'all' ? list : open).slice(0, 60);
  const counts = { idea: 0, bug: 0, other: 0 }; open.forEach(f => counts[f.type] = (counts[f.type] || 0) + 1);
  return `<section class="glass acard"><div class="ahrow"><h2>Ábendingar frá notendum ${open.length ? `<span class="fbbadge">${open.length} nýjar</span>` : ''}</h2>
      <div class="opts"><button class="chip sm" data-fbfilter="new" aria-pressed="${filter !== 'all'}">Óafgreiddar</button><button class="chip sm" data-fbfilter="all" aria-pressed="${filter === 'all'}">Allar</button></div></div>
    <p class="tiny">${counts.idea} hugmyndir, ${counts.bug} villur og ${counts.other} annað bíða afgreiðslu.</p>
    ${shown.length ? `<ul class="fblist">${shown.map(f => `<li class="${f.status === 'done' ? 'done' : ''}">
      <div class="fbh"><b>${FB[f.type] || f.type}</b><span class="tiny">${esc((f.at || '').slice(0, 10))}${f.version ? `, útg. ${esc(f.version)}` : ''}${f.platform ? `, ${esc(PLAT[f.platform] || f.platform)}` : ''}${f.screen ? `, skjár: ${esc(f.screen)}` : ''}</span></div>
      <p>${esc(f.text)}</p>
      <div class="fbf"><span class="tiny">${f.email ? `Má hafa samband: <a href="mailto:${esc(f.email)}">${esc(f.name || '')} ${esc(f.email)}</a>` : 'Nafnlaust'}</span>
        <button class="chip sm" data-fbdone="${esc(f.id)}" data-v="${f.status === 'done' ? 'new' : 'done'}">${f.status === 'done' ? 'Opna aftur' : 'Merkja afgreitt'}</button></div></li>`).join('')}</ul>`
      : `<p class="tiny">${filter === 'all' ? 'Engar ábendingar ennþá.' : 'Allar ábendingar eru afgreiddar.'}</p>`}
  </section>`;
}
export function renderDashboard(el, m, opt = {}){
  const range = opt.range || 30, T = m.totals || {}, days = (m.days || []).slice().sort((a, b) => a.id.localeCompare(b.id));
  const byDay = Object.fromEntries(days.map(d => [d.id.slice(4), d]));
  const now = new Date(), span = [...Array(range)].map((_, i) => ymd(addDays(now, i - range + 1)));
  const val = (d, k) => (byDay[d] && byDay[d][k]) || 0;
  const active = span.map(d => val(d, 'active')), sess = span.map(d => val(d, 'sessions')), newU = span.map(d => val(d, 'newUsers'));
  const last7 = span.slice(-7), prev7 = [...Array(7)].map((_, i) => ymd(addDays(now, i - 13)));
  const s7 = last7.reduce((a, d) => a + val(d, 'sessions'), 0), sp7 = prev7.reduce((a, d) => a + val(d, 'sessions'), 0);
  const weeks = (m.weeks || []).slice().sort((a, b) => a.id.localeCompare(b.id)), wau = weeks.length ? weeks[weeks.length - 1].active || 0 : 0;
  const trend = (a, b) => b ? `<span class="${a >= b ? 'up' : 'down'}">${a >= b ? '▲' : '▼'} ${pct(Math.abs(a - b), b)}</span> frá vikunni á undan` : '';
  // Íþróttir og æfingar
  const sports = sorted(T.sessionsByType), exs = sorted(T.exercises).slice(0, 15), subs = sorted(T.subs).slice(0, 12);
  const custom = sorted((m.custom || {}).names).slice(0, 12);
  // Hvenær
  const hours = [...Array(24)].map((_, h) => days.reduce((a, d) => a + ((d.hours || {})[h] || 0), 0));
  const wd = [0, 0, 0, 0, 0, 0, 0]; days.forEach(d => { const x = new Date(d.id.slice(4) + 'T12:00:00'); wd[x.getDay()] += d.sessions || 0; });
  const wdOrder = [1, 2, 3, 4, 5, 6, 0], peakH = hours.indexOf(Math.max(...hours)), peakD = wd.indexOf(Math.max(...wd));
  // Varðveisla (cohorts)
  const coh = Object.entries(m.cohorts || {}).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8);
  const ret = (c, w) => { const base = c.w0 || 0; return base ? Math.round((c[`w${w}`] || 0) / base * 100) : null; };
  const ret4 = coh.map(([, c]) => ret(c, 4)).filter(v => v != null), avgRet4 = ret4.length ? Math.round(ret4.reduce((a, b) => a + b, 0) / ret4.length) : null;
  // Félagslegt
  const users = T.users || 0, goalsN = sumMap(T.goals), achN = sumMap(T.goalsAchieved);
  // Sjálfvirkar ábendingar
  const tips = [];
  if (sports.length) tips.push(`Vinsælasta íþróttin: <b>${esc(SPORTS[sports[0][0]] || sports[0][0])}</b>, ${pct(sports[0][1], sumMap(T.sessionsByType))} allra æfinga.${sports[1] ? ` Næst: ${esc(SPORTS[sports[1][0]] || sports[1][0]).toLowerCase()}.` : ''}`);
  if (exs.length) tips.push(`Mest notaða lyftingaæfingin er <b>${esc(exName(exs[0][0]))}</b>. Efstu fimm eru góðar til að kynna, t.d. með tilbúnum æfingaplönum.`);
  if (custom.length) tips.push(`Notendur hafa búið til æfingar sem eru ekki í safninu, oftast <b>${esc(custom[0][0])}</b>${custom[1] ? ` og <b>${esc(custom[1][0])}</b>` : ''}. Gott að bæta þeim í safnið.`);
  if (hours.some(Boolean)) tips.push(`Flestar æfingar eru skráðar um <b>kl. ${peakH}–${peakH + 1}</b> og á <b>${DPL[peakD]}</b>. Það er besti tíminn fyrir áminningar og tilkynningar.`);
  if (avgRet4 != null) tips.push(`Að meðaltali eru <b>${avgRet4}%</b> nýrra notenda enn virkir 4 vikum eftir skráningu.${avgRet4 < 40 ? ' Það má bæta, t.d. með áminningum eða vikulegri samantekt.' : ' Það er góð varðveisla.'}`);
  if (goalsN) tips.push(`Markmið sett: ${nf(goalsN)}, og <b>${pct(achN, goalsN)}</b> þeirra hafa náðst. ${sorted(T.goals)[0] ? `Vinsælust: ${esc(GOALS[sorted(T.goals)[0][0]] || '')}.` : ''}`);
  const vis = sorted(T.visibility); if (vis.length) tips.push(`Algengasta deilingarstillingin er <b>${esc(VIS[vis[0][0]] || vis[0][0])}</b> (${pct(vis[0][1], sumMap(T.visibility))}).`);
  const imp = sumMap(T.imports); if (imp) tips.push(`Æfingar lesnar inn úr úrum: <b>${nf(imp)}</b>, flestar úr ${esc(SOURCES[sorted(T.imports)[0][0]] || '')}.`);
  const wsty = sorted(Object.fromEntries(Object.entries(T.appearance || {}).filter(([k]) => k.startsWith('weekStyle_'))));
  if (wsty.length) tips.push(`Vinsælasta útlit vikurits er <b>${esc(wsty[0][0].replace('weekStyle_', ''))}</b>.`);

  const lbl = span.map(d => `${+d.slice(8)}/${+d.slice(5, 7)}`);
  el.innerHTML = `
  <header class="ahead"><div><div class="eyebrow">Stjórnborð</div><h1>Æfingabókin</h1>
    <p class="tiny">Nafnlausar samtölur. Engin gögn um einstaka notendur eru sýnd eða geymd hér.</p></div>
    <div class="opts" role="group" aria-label="Tímabil">${[7, 30, 90].map(r => `<button class="chip" data-range="${r}" aria-pressed="${range === r}">${r} dagar</button>`).join('')}
      ${opt.onRefresh ? `<button class="chip" data-refresh>Uppfæra</button>` : ''}</div></header>

  <section class="akpis">
    <div class="glass akpi"><span class="l">Notendur alls</span><b>${nf(users)}</b><span class="tiny">${nf(newU.reduce((a, b) => a + b, 0))} nýir síðustu ${range} daga</span></div>
    <div class="glass akpi"><span class="l">Virkir í dag</span><b>${nf(val(ymd(now), 'active'))}</b><span class="tiny">${nf(wau)} virkir í þessari viku</span></div>
    <div class="glass akpi"><span class="l">Æfingar síðustu 7 daga</span><b>${nf(s7)}</b><span class="tiny">${trend(s7, sp7)}</span></div>
    <div class="glass akpi"><span class="l">Æfingar alls</span><b>${nf(T.sessions || 0)}</b><span class="tiny">${users ? nf((T.sessions || 0) / users, 1) : '–'} á hvern notanda</span></div>
  </section>

  ${tips.length ? `<section class="glass acard"><h2>Ábendingar</h2><ul class="atips">${tips.map(t => `<li>${t}</li>`).join('')}</ul></section>` : ''}

  ${feedbackSection(m.feedback || [], opt.fbFilter || 'new')}

  <section class="glass acard"><div class="ahrow"><h2>Virkni á dag</h2><span class="legend"><span><i style="background:var(--c-lift)"></i>Virkir notendur</span><span><i style="background:var(--c-run)"></i>Æfingar skráðar</span></span></div>
    ${lineSvg([active, sess], ['var(--c-lift)', 'var(--c-run)'], lbl)}</section>

  <div class="agrid">
    <section class="glass acard"><h2>Íþróttir</h2><p class="tiny">Fjöldi skráðra æfinga eftir íþrótt</p>${bars(sports, k => SPORTS[k] || k, k => `var(--c-${SPORTS[k] ? k : 'other'})`)}</section>
    <section class="glass acard"><h2>Vinsælustu lyftingaæfingar</h2><p class="tiny">Hve oft hver æfing hefur verið í lyftingaæfingu</p>${bars(exs, exName, () => 'var(--c-lift)')}</section>
  </div>

  <div class="agrid">
    <section class="glass acard"><h2>Tegundir innan íþrótta</h2>${bars(subs, k => SUBS[k] || k, k => `var(--c-${k.split('_')[0]})`)}</section>
    <section class="glass acard"><h2>Æfingar sem vantar í safnið</h2><p class="tiny">Heiti sem notendur skrifuðu sjálfir þegar æfing fannst ekki</p>${bars(custom, k => k, () => 'var(--c-other)')}</section>
  </div>

  <div class="agrid">
    <section class="glass acard"><h2>Hvenær er æft?</h2><p class="tiny">Skráðar æfingar eftir klukkustund</p>
      ${colBars(hours, hours.map((_, h) => h % 3 === 0 ? String(h) : ''), 'var(--c-lift)', peakH)}</section>
    <section class="glass acard"><h2>Vikudagar</h2><p class="tiny">Skráðar æfingar eftir vikudegi</p>
      ${colBars(wdOrder.map(i => wd[i]), wdOrder.map(i => DSHORT[i]), 'var(--c-walk)', wdOrder.indexOf(peakD))}</section>
  </div>

  <section class="glass acard"><h2>Varðveisla notenda</h2><p class="tiny">Hlutfall hvers nýskráningarhóps (vika) sem var virkur X vikum síðar</p>
    ${coh.length ? `<div class="atable"><table><thead><tr><th>Skráðir viku</th><th>Fjöldi</th>${[1, 2, 3, 4, 6, 8].map(w => `<th>Vika ${w}</th>`).join('')}</tr></thead><tbody>
      ${coh.map(([wk, c]) => `<tr><td>${esc(wk)}</td><td>${nf(c.w0 || 0)}</td>${[1, 2, 3, 4, 6, 8].map(w => { const r = ret(c, w);
        return `<td>${r == null || (c[`w${w}`] == null) ? '<span class="tiny">–</span>' : `<span class="heat" style="--h:${r / 100}">${r}%</span>`}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="tiny">Engin gögn ennþá.</p>'}</section>

  <div class="agrid3">
    <section class="glass acard"><h2>Félagslegt</h2><dl class="adl">
      <div><dt>Pör (maki tengdur)</dt><dd>${nf(T.couples || 0)}</dd></div><div><dt>Vinatengsl</dt><dd>${nf(T.friendships || 0)}</dd></div>
      <div><dt>Áskoranir stofnaðar</dt><dd>${nf(T.challenges || 0)}</dd></div><div><dt>Hrós gefin</dt><dd>${nf(sumMap(T.kudos))}</dd></div>
      <div><dt>Athugasemdir</dt><dd>${nf(T.comments || 0)}</dd></div><div><dt>Æfingar á notanda</dt><dd>${users ? nf((T.sessions || 0) / users, 1) : '–'}</dd></div></dl>
      ${bars(sorted(T.kudos), k => REACT[k] || k, () => 'var(--c-bike)')}</section>
    <section class="glass acard"><h2>Markmið</h2><dl class="adl"><div><dt>Sett</dt><dd>${nf(goalsN)}</dd></div><div><dt>Náð</dt><dd>${nf(achN)} <small>${pct(achN, goalsN)}</small></dd></div></dl>
      ${bars(sorted(T.goals), k => GOALS[k] || k, () => 'var(--c-walk)')}</section>
    <section class="glass acard"><h2>Deiling með vinum</h2><p class="tiny">Núverandi stilling notenda</p>${bars(sorted(T.visibility), k => VIS[k] || k, () => 'var(--c-swim)')}</section>
  </div>

  <div class="agrid4">
    <section class="glass acard"><h2>Úr úrum</h2>${bars(sorted(T.imports), k => SOURCES[k] || k, () => 'var(--c-row)')}</section>
    <section class="glass acard"><h2>CrossFit: personal best</h2><p class="tiny">Í hverju fólk skráir PB oftast</p>${bars(sorted(T.cfPbs).slice(0, 10), k => k, () => 'var(--c-class)')}</section>
    <section class="glass acard"><h2>Vinsælustu sundlaugarnar</h2><p class="tiny">Skráðar sundferðir eftir laug</p>${bars(sorted(T.pools).slice(0, 10), k => k, () => 'var(--c-swim)')}</section>
    <section class="glass acard"><h2>Gufa og pottar</h2><p class="tiny">Æfingar þar sem farið var í</p>${bars(sorted(T.spa), k => SPA[k] || k, () => 'var(--c-swim)')}</section>
    <section class="glass acard"><h2>Tæki</h2>${bars(sorted(T.platform), k => PLAT[k] || k, () => 'var(--c-other)')}
      <p class="tiny">Íþróttir sem valdar eru við nýskráningu:</p>${bars(sorted(T.sportsSelected).slice(0, 6), k => SPORTS[k] || k, k => `var(--c-${k})`)}</section>
  </div>
  <p class="tiny" style="text-align:center;margin:20px 0 40px">Gögnin koma úr nafnlausum samtölum sem appið sendir. Notendur geta slökkt á þeim í Stillingum → Persónuvernd.</p>`;
}

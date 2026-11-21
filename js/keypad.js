/* =====================================================================
   Talnaborð appsins (frá útgáfu 3.7)
   Kemur í stað lyklaborðs símans í þyngd og endurtekningum. Alltaf sama útlit, með kommu,
   skrefum (−/+), „Næsta“, „Sama“ og plötum á stöng í litakóða platnanna.

   Reitirnir eru áfram venjulegir <input> með inputmode="none": lyklaborð símans opnast ekki,
   en lyklaborð tengt við tækið, skjálesarar og gagnaflæðið (input-atburðir) virka eins og áður.

   Þrjár útgáfur eftir skjá:
     sheet  sími: spjald neðst sem opnast þegar ýtt er á reit og lokast eins og lyklaborð,
     dock   breiður skjár (opinn Fold, spjaldtölva, sími á hlið): fast spjald hægra megin,
            ekkert hylur settin og spjaldið helst opið á meðan lyftingaæfing er skráð,
     flex   Flex-hamur (Fold hálfopinn á hlið, Viewport Segments): settið efst, talnaborðið neðst.

   ui.js sér um samhengið (ctx) og aðgerðirnar (act). Hér er aðeins viðmót talnaborðsins.
   ===================================================================== */

/* Litakóði lyftingaplatna og stærð á teikningu: [litur, hæð, breidd] í px.
   10–25 kg eru jafn háar (eins og stuðaraplötur) og þekkjast á lit og þykkt. */
const PLATE = {
  25: ['red', 46, 11], 20: ['blue', 46, 10], 15: ['yellow', 46, 9], 10: ['green', 46, 8],
  5: ['white', 31, 7], 2.5: ['red', 26, 6], 2: ['blue', 24, 6], 1.5: ['yellow', 22, 5],
  1.25: ['steel', 21, 5], 1: ['green', 19, 5], 0.5: ['white', 16, 4]
};
export const plateColor = p => (PLATE[p] || ['steel'])[0];

const num = v => { const n = parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
const fmt = n => String(Math.round(n * 100) / 100).replace('.', ',');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Plötur á hvora hlið: fæstar mögulegar, stærstu innst. Reiknað í 0,25 kg einingum.
   { state: 'ok', per: [25, 10, 2.5] } | 'light' (léttara en stöngin) | 'near' (næstu þyngdir sem ganga upp)
   | 'none' (engar plötur valdar) | 'empty' (engin þyngd) */
export function platesFor(total, bar, avail){
  const list = (avail || []).map(Number).filter(p => PLATE[p]).sort((a, b) => b - a);
  if (!(total > 0) || total > 1000) return { state: 'empty' };
  if (total + 1e-9 < bar) return { state: 'light' };
  if (Math.abs(total - bar) < 1e-9) return { state: 'ok', per: [] };
  if (!list.length) return { state: 'none' };
  const units = list.map(p => Math.round(p * 4)), side4 = (total - bar) * 2;
  const lo4 = Math.floor(side4 + 1e-9), hi4 = Math.ceil(side4 - 1e-9), N = hi4 + Math.max(...units);
  const dp = new Array(N + 1).fill(Infinity); dp[0] = 0;
  for (let a = 1; a <= N; a++) for (const u of units) if (u <= a && dp[a - u] + 1 < dp[a]) dp[a] = dp[a - u] + 1;
  const pick = a => { const out = []; while (a > 0){ const i = units.findIndex(u => u <= a && dp[a - u] === dp[a] - 1); out.push(list[i]); a -= units[i]; } return out; };
  if (lo4 === hi4 && dp[lo4] < Infinity) return { state: 'ok', per: pick(lo4) };
  let a = lo4; while (a > 0 && dp[a] === Infinity) a--;
  let b = hi4; while (b <= N && dp[b] === Infinity) b++;
  return { state: 'near', lo: bar + a / 2, hi: b <= N ? bar + b / 2 : null };
}
/* [25, 25, 10, 2.5] → „2 × 25 + 10 + 2,5“ */
export function plateText(per){
  const g = [];
  per.forEach(p => { const l = g[g.length - 1]; if (l && l.p === p) l.n++; else g.push({ p, n: 1 }); });
  return g.map(x => (x.n > 1 ? `${x.n} × ` : '') + fmt(x.p)).join(' + ');
}
/* Teikning af stönginni með plötunum á báðum endum (stærstu plöturnar innst) */
export function barHtml(per, cls = ''){
  const show = per.slice(0, 10);
  const pl = p => `<i class="kpp pc-${PLATE[p][0]}" style="height:${PLATE[p][1]}px;width:${PLATE[p][2]}px"></i>`;
  return `<span class="kpbar ${cls}" aria-hidden="true"><i class="kpend"></i>${show.slice().reverse().map(pl).join('')}<i class="kpcol"></i><i class="kpshaft"></i><i class="kpcol"></i>${show.map(pl).join('')}<i class="kpend"></i></span>`;
}

const ICO = {
  bs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6H9l-6 6 6 6h11a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z"/><path d="M12 10l4 4M16 10l-4 4"/></svg>',
  hide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="12" rx="2"/><path d="M7 7h.01M11 7h.01M15 7h.01M8 11h8M9 19l3 2 3-2"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};
const HOLD = new Set(['dn', 'up', 'bs']);

/* o: { selector, enabled(), wideQuery, ctx(input), act(name, input, arg), rest() } */
export function createKeypad(o){
  const mm = q => { try { return window.matchMedia ? window.matchMedia(q) : null; } catch(e){ return null; } };
  const MQ = { coarse: mm('(pointer: coarse)'), wide: mm(o.wideQuery), flex: mm('(vertical-viewport-segments: 2)') };
  const on = q => !!(q && q.matches);
  let el = null, topEl = null, target = null, targetId = '', want = '', hidden = false, quiet = false, holdT = null, keySig = '';

  const active = () => { try { return on(MQ.coarse) && !!o.enabled(); } catch(e){ return false; } };
  const layout = () => on(MQ.flex) ? 'flex' : on(MQ.wide) ? 'dock' : 'sheet';
  const byId = id => id ? document.querySelector(`${o.selector}[data-kpid="${id}"]`) : null;
  const isKp = n => !!(n && n.matches && n.matches(o.selector));
  const inside = n => !!(n && ((el && el.contains(n)) || (topEl && topEl.contains(n))));

  function build(){
    if (el) return;
    el = document.createElement('div'); el.className = 'kp'; el.hidden = true;
    el.setAttribute('role', 'group'); el.setAttribute('aria-label', 'Talnaborð');
    el.innerHTML = '<div class="kpin"><div class="kphead"></div><div class="kpval"></div><div class="kpinfo-w"></div><div class="kpkeys"></div></div>';
    topEl = document.createElement('div'); topEl.className = 'kptop'; topEl.hidden = true;
    document.body.append(el, topEl);
    for (const n of [el, topEl]){
      n.addEventListener('pointerdown', onDown);
      n.addEventListener('mousedown', e => e.preventDefault());   /* fókusinn helst í reitnum */
      n.addEventListener('click', onClick);
    }
    ['pointerup', 'pointercancel', 'blur'].forEach(t => window.addEventListener(t, stopHold));
    Object.values(MQ).forEach(q => { if (q && q.addEventListener) q.addEventListener('change', () => { if (target || layout() !== 'sheet') sync(); }); });
  }

  /* ---------- Opna, loka, fylgja teikningu appsins ---------- */
  function setTarget(inp){
    if (target && target !== inp) target.classList.remove('kp-target');
    target = inp; targetId = inp.dataset.kpid || ''; inp.classList.add('kp-target');
  }
  function show(){
    build();
    const L = layout(), c = o.ctx(target), b = document.body;
    el.dataset.l = L; el.hidden = false;
    topEl.hidden = !(L === 'flex' && c.persistent);
    b.classList.add('kp-on'); b.classList.toggle('kp-sheet', L === 'sheet'); b.classList.toggle('kp-dock', L === 'dock'); b.classList.toggle('kp-flex', L === 'flex');
    draw(c);
    if (L === 'sheet') b.style.setProperty('--kph', el.offsetHeight + 'px');
  }
  function close(){
    stopHold();
    if (target) target.classList.remove('kp-target');
    target = null; targetId = '';
    if (el){ el.hidden = true; topEl.hidden = true; }
    document.body.classList.remove('kp-on', 'kp-sheet', 'kp-dock', 'kp-flex');
  }
  function hideNow(){
    hidden = true; const t = target; close();
    if (t && document.activeElement === t) t.blur();
  }
  function focusQuiet(inp, keepSel){
    quiet = !!keepSel;
    try { inp.focus({ preventScroll: true }); } catch(e){ inp.focus(); }
    quiet = false;
  }
  /* Kallað í lok hverrar teikningar appsins: reitirnir eru nýir, svo markmiðið er fundið aftur */
  function sync(){
    if (!active()){ if (target || (el && !el.hidden)) close(); return; }
    const L = layout();
    if (want){ const n = L !== 'sheet' ? byId(want) : null; want = ''; if (n) setTarget(n); else if (L !== 'sheet') target = null; }
    if (target && !target.isConnected){
      const n = byId(targetId); target = null;
      if (n && (L !== 'sheet' || document.activeElement === n)) setTarget(n);
    }
    if (!target && L !== 'sheet' && !hidden){ const d = document.querySelector(`${o.selector}[data-kpdock]`); if (d) setTarget(d); }
    if (!target){ close(); return; }
    if (L === 'sheet' && document.activeElement !== target){ close(); return; }
    show();
  }
  /* Sími: reiturinn (og reitirnir með honum) sjást fyrir ofan talnaborðið */
  function reveal(t){
    const card = t.closest('.setcard'), steps = card ? [...card.querySelectorAll('.stepper')] : [];
    const first = steps[0] || t.closest('.strow') || t, last = steps[steps.length - 1] || first, head = card && card.querySelector('.row1');
    (window.requestAnimationFrame || setTimeout)(() => {
      if (!el || el.hidden) return;
      const room = window.innerHeight - el.offsetHeight - 12, z = last.getBoundingClientRect();
      /* Helst sést fyrirsögn settsins líka; annars byrjar svæðið á þyngdinni */
      let a = first.getBoundingClientRect();
      if (head){ const h = head.getBoundingClientRect(); if (z.bottom - h.top <= room - 64) a = h; }
      if (z.bottom > room || a.top < 64) window.scrollBy({ top: a.top - Math.max(64, Math.min(96, room - (z.bottom - a.top))), behavior: 'smooth' });
    });
  }

  /* ---------- Teikning talnaborðsins ---------- */
  function infoHtml(c){
    if (!c.bar) return c.last ? `<div class="kpinfo"><span class="kptxt"><span>Síðast:</span> <b>${esc(c.last)}</b></span></div>` : '';
    const r = platesFor(num(c.kgVal), c.bar, c.plates);
    let line;
    if (r.state === 'ok') line = r.per.length ? `<span>Á hvora hlið:</span> <b>${plateText(r.per)}</b>` : '<b>Aðeins stöngin</b>';
    else if (r.state === 'light') line = '<span>Léttara en stöngin</span>';
    else if (r.state === 'near') line = `<span>Næst með plötunum þínum:</span> ${[r.lo, r.hi].filter(x => x != null).map(x => `<button type="button" class="kpnear" data-key="near" data-v="${x}">${fmt(x)} kg</button>`).join(' ')}`;
    else if (r.state === 'none') line = '<span>Veldu plöturnar í Stillingum</span>';
    else line = '<span>Sláðu inn þyngdina</span>';
    return `<div class="kpinfo plates">${barHtml(r.state === 'ok' ? r.per : [])}<div class="kpline"><span class="kptxt">${line}</span>
      <button type="button" class="kpbarbtn" data-key="bar" aria-label="Stöng ${c.bar} kg. Ýttu til að skipta um stöng"><span>Stöng</span> <b>${c.bar} kg</b></button></div></div>`;
  }
  function restHtml(){ const r = o.rest ? o.rest() : ''; return `<span class="kprest"${r ? '' : ' hidden'}><span>Hvíld</span> <b data-kprest>${esc(r)}</b></span>`; }
  function keysHtml(c, L){
    const b = (key, html, cls, aria, extra = '') => `<button type="button" class="kpk ${cls}" data-key="${key}"${aria ? ` aria-label="${esc(aria)}"` : ''}${extra}>${html}</button>`;
    const D = n => b(String(n), String(n), 'dg' + (L === 'flex' && n === 0 ? ' wide' : ''));
    const inc = fmt(c.inc), kg = c.mode === 'kg';
    const dn = b('dn', `−${inc}`, 'fn st', `Minnka um ${inc}`), up = b('up', `+${inc}`, 'fn st', `Auka um ${inc}`);
    const bs = b('bs', ICO.bs, 'fn', 'Eyða'), hide = b('hide', ICO.hide, 'fn', 'Fela talnaborð');
    const x = kg ? b(',', ',', 'fn cm', 'Komma')
      : b('same', `<span>Sama</span>${c.same ? `<small>${esc(c.same)}</small>` : ''}`, 'fn same', c.same ? `Sama og síðast, ${c.same}` : 'Sama og síðast', c.same ? '' : ' disabled');
    const go = b('next', kg ? `<span>${esc(c.done.label)}</span>${ICO.next}` : `${ICO.check}<span>${esc(c.done.label)}</span>`, 'go' + (L === 'flex' ? ' big' : ''), c.done.aria);
    if (L === 'flex') return [D(7), D(8), D(9), dn, bs, D(4), D(5), D(6), up, x, D(1), D(2), D(3), go, D(0), hide].join('');
    return [D(7), D(8), D(9), bs, D(4), D(5), D(6), dn, D(1), D(2), D(3), up, x, D(0), hide, go].join('');
  }
  function topHtml(c){
    const kv = c.pair && c.pair.kg ? c.pair.kg.value : '', rv = c.pair && c.pair.reps ? c.pair.reps.value : '';
    return `<div class="kptopin">
      <div class="kptoph"><div class="kpt"><b>${esc(c.exName)}</b>${c.sub ? `<span class="kpsub">${esc(c.sub)}</span>` : ''}</div>${restHtml()}
        <button type="button" class="kpclose" data-key="hide" aria-label="Loka talnaborðinu">${ICO.close}</button></div>
      <div class="kpvals">
        <button type="button" class="kpv${c.mode === 'kg' ? ' on' : ''}" data-key="tgt" data-v="kg" aria-pressed="${c.mode === 'kg'}"><span>Þyngd</span><b>${esc(kv || '0')}<small>kg</small></b></button>
        <button type="button" class="kpv${c.mode === 'reps' ? ' on' : ''}" data-key="tgt" data-v="reps" aria-pressed="${c.mode === 'reps'}"><span>Endurtekningar</span><b>${esc(rv || '0')}<small>reps</small></b></button>
      </div>${infoHtml(c)}</div>`;
  }
  function draw(c){
    if (!el || !target) return;
    c = c || o.ctx(target);
    const L = el.dataset.l || layout(), top = L === 'flex' && c.persistent, q = s => el.querySelector(s);
    q('.kphead').innerHTML = top ? '' : `<div class="kpt"><b>${esc(c.title)}</b>${c.sub ? `<span class="kpsub">${esc(c.sub)}</span>` : ''}</div>${restHtml()}`;
    q('.kpval').innerHTML = L === 'dock' ? `<b>${esc(target.value || '0')}</b><small>${c.mode === 'kg' ? 'kg' : 'reps'}</small>` : '';
    q('.kpinfo-w').innerHTML = top ? '' : infoHtml(c);
    const sig = [L, c.mode, c.inc, c.same, c.done.label, c.done.aria].join('|');
    if (sig !== keySig){ keySig = sig; q('.kpkeys').innerHTML = keysHtml(c, L); }
    if (top) topEl.innerHTML = topHtml(c);
  }

  /* ---------- Innsláttur ---------- */
  function setVal(inp, v, selAll, caret){
    inp.value = v;
    try { if (selAll) inp.setSelectionRange(0, v.length); else { const p = caret == null ? v.length : caret; inp.setSelectionRange(p, p); } } catch(e){}
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function insert(inp, ch){
    const v = inp.value; let s = inp.selectionStart, e = inp.selectionEnd;
    if (s == null){ s = e = v.length; }
    const head = v.slice(0, s), tail = v.slice(e);
    let nv = head + ch + tail;
    if (inp.dataset.kp === 'reps'){ if (!/^\d{0,3}$/.test(nv)) return; }
    else {
      if (ch === ',' && /[.,]/.test(head + tail)) return;            /* aðeins ein komma */
      if (ch === ',' && !head) nv = '0' + nv;                         /* „,5“ verður „0,5“ */
      if (!/^\d{0,4}([.,]\d{0,2})?$/.test(nv)) return;
    }
    nv = nv.replace(/^0+(?=\d)/, '');
    setVal(inp, nv, false, nv.length - tail.length);
  }
  function backspace(inp){
    const v = inp.value; let s = inp.selectionStart, e = inp.selectionEnd;
    if (s == null){ s = e = v.length; }
    if (s === e){ if (!s) return; s--; }
    setVal(inp, v.slice(0, s) + v.slice(e), false, s);
  }
  function act(key, inp, btn, fresh){
    const c = o.ctx(inp);
    if (/^\d$/.test(key) || key === ',') return insert(inp, key);
    if (key === 'bs'){ if (fresh) try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch(e){} return backspace(inp); }
    if (key === 'dn' || key === 'up'){ o.act('step', inp, key === 'up' ? 1 : -1); try { inp.setSelectionRange(0, inp.value.length); } catch(e){} return; }
    if (key === 'same'){ if (c.same) setVal(inp, c.same, true); return; }
    if (key === 'near'){ const k = c.kgInput || inp; setVal(k, fmt(+btn.dataset.v), k === inp); return; }
    if (key === 'bar'){ o.act('bar', inp); return; }
    if (key === 'next'){
      const r = o.act('next', inp);
      if (r && r.nodeType === 1){ setTarget(r); focusQuiet(r); }
      else if (r === 'close') hideNow();
      want = '';
    }
  }
  function press(key, btn){
    if (key === 'hide'){ hideNow(); return; }
    let inp = target && target.isConnected ? target : byId(targetId);
    if (!inp) return;
    if (key === 'tgt'){ const n = o.ctx(inp).pair; const t = n && n[btn.dataset.v]; if (t){ setTarget(t); focusQuiet(t); draw(); } return; }
    const run = fresh => { act(key, inp, btn, fresh); if (target) draw(); };
    if (document.activeElement !== inp){ setTarget(inp); focusQuiet(inp); setTimeout(() => run(true), 0); }
    else run(false);
  }
  function onDown(e){
    const btn = e.target.closest('[data-key]');
    if (!btn || btn.disabled) return;
    if (e.button > 0) return;
    btn.classList.add('press'); setTimeout(() => btn.classList.remove('press'), 140);
    const key = btn.dataset.key;
    press(key, btn);
    if (HOLD.has(key)){ stopHold(); holdT = setTimeout(function rep(){ press(key, btn); holdT = setTimeout(rep, 75); }, 430); }
  }
  /* Lyklaborð og skjálesarar smella án pointerdown (detail = 0); fingur og mús eru afgreidd í pointerdown */
  function onClick(e){
    const btn = e.target.closest('[data-key]');
    if (!btn || btn.disabled || e.detail !== 0) return;
    press(btn.dataset.key, btn);
  }
  function stopHold(){ if (holdT){ clearTimeout(holdT); holdT = null; } }

  document.addEventListener('focusin', e => {
    const t = e.target;
    if (!isKp(t) || !active()) return;
    const L = layout(), was = !!(el && !el.hidden);
    hidden = false; setTarget(t); show();
    if (L === 'sheet' && !quiet && !was) reveal(t);
  });
  document.addEventListener('focusout', e => {
    if (!target || e.target !== target) return;
    setTimeout(() => {
      if (!target) return;
      const a = document.activeElement;
      if (isKp(a) || inside(a)) return;
      if (layout() !== 'sheet' && target.isConnected && target.hasAttribute('data-kpdock')){ draw(); return; }
      close();
    }, 0);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && target && document.activeElement === target){ hideNow(); }
  });

  return {
    active, sync, close,
    get quiet(){ return quiet; },
    retarget(id){ want = id; },
    tick(){ if (!el || el.hidden) return; const r = o.rest ? o.rest() : '';
      [el, topEl].forEach(n => n.querySelectorAll('.kprest').forEach(x => { x.hidden = !r; const v = x.querySelector('[data-kprest]'); if (v && v.textContent !== r) v.textContent = r; })); }
  };
}

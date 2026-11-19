/* ===== Sýnishorn: flýtileiðir á milli skjáa ===== */
(() => {
  const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  const wait = (ms = 80) => new Promise(r => setTimeout(r, ms));
  const click = s => { const el = typeof s === 'string' ? q(s) : s; if (el) el.click(); };
  const set = (s, v) => { const el = q(s); if (el){ el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); } };
  const tab = t => click(`.tabs [data-tab="${t}"]`);
  const D = () => window.__demo;
  async function reset(){
    qa('.celebrate').forEach(e => e.remove());
    if (q('#sheet').classList.contains('open')) click('#sheetClose');
    if (document.body.dataset.gate !== 'app') D().gate('app');
    await wait(40);
  }
  const SCREENS = [
    ['Forsíða', [
      ['Vikan', () => tab('home')]]],
    ['Útlit vikurits', ['A', 'B', 'C', 'D'].map(v => [`Vikurit ${v}`, async () => { tab('home'); await wait(); click('#settingsBtn'); await wait();
      click(`[data-set="weekStyle"][data-val="${v}"]`); await wait(); click('[data-act="setback"]'); await wait(); window.scrollTo(0, 0); }])],
    ['Skráning', [
      ['Lyftingar, eitt sett í einu', async () => { D().clearDraft(); tab('log'); await wait(); click('[data-newtype="lift"]'); await wait(150);
        const b = qa('[data-pickex]').find(x => x.textContent.startsWith('Bekkpressa')); if (b) b.click(); await wait(120); click('[data-act="doneset"]'); window.scrollTo(0, 0); }],
      ['Hlaup með álagi', async () => { D().clearDraft(); tab('log'); await wait(); click('[data-newtype="run"]'); await wait();
        set('#dist', '10'); set('#dur', '52:10'); set('#hr', '151'); }],
      ['Golf, 18 holur', async () => { D().clearDraft(); tab('log'); await wait(); click('[data-newtype="golf"]'); await wait(); click('[data-act="setsub"][data-s="h18"]'); await wait();
        set('#cf_course', 'Grafarholtsvöllur'); set('#cf_score', '92'); set('#cf_points', '34'); }],
      ['Golf: driving range', async () => { D().clearDraft(); tab('log'); await wait(); click('[data-newtype="golf"]'); await wait(); click('[data-act="setsub"][data-s="range"]'); await wait(); set('#cf_balls', '100'); set('#cf_longest', '231'); }],
      ['Fjallganga', async () => { D().clearDraft(); tab('log'); await wait(); click('[data-newtype="hike"]'); await wait();
        set('#cf_title', 'Esjan að Steini'); set('#dist', '6,6'); set('#dur', '2:08:00'); set('#cf_elevation', '597'); }],
      ['Fljótleg skráning og sniðmát', async () => { D().clearDraft(); tab('log'); }],
      ['Æfingaplan: val', async () => { D().clearDraft(); tab('log'); await wait(); click('[data-act="planopen"]'); }],
      ['Æfingaplan: bak og styrkur', async () => { D().clearDraft(); tab('log'); await wait(); click('[data-act="planopen"]'); await wait(); { const c = document.querySelector('[data-act="plcombo"][aria-pressed="true"]'); if (c) c.click(); } await wait(); { const b = document.querySelector('[data-act="plgroup"][data-v="back"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); } await wait(); click('[data-act="plgoal"][data-v="strength"]'); await wait(); click('[data-act="plbuild"]'); }],
      ['CrossFit og personal best', async () => { D().clearDraft(); tab('log'); await wait(); const m = document.querySelector('details.more'); if (m) m.open = true; click('[data-newtype="class"]'); await wait();
        click('[data-act="setsub"][data-s="crossfit"]'); await wait(); set('#cf_box', 'CrossFit Reykjavík'); set('#cf_wod', 'Snörun og Fran'); click('[data-act="pbopen"]'); }],
      ['Hóptími', async () => { D().clearDraft(); tab('log'); await wait(); click('[data-newtype="class"]'); await wait(); set('#dur', '45'); click('[data-act="setint"][data-v="hard"]'); }],
      ['Sækja úr úri: leiðbeiningar', async () => { D().clearDraft(); tab('log'); await wait(); click('[data-act="importhelp"]'); }],
      ['Sækja úr úri: sýnidæmi', async () => { D().clearDraft(); tab('log'); await wait();
        const ago = n => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
        const csv = "Activity Type,Date,Favorite,Title,Distance,Calories,Time,Avg HR,Max HR,Total Ascent\nRunning,{D1} 07:15:32,false,Reykjavík Running,10.21,712,00:52:40,152,171,85\nPool Swim,{D3} 18:02:11,false,Laugardalslaug,\"1,500\",420,00:38:12,128,150,--\nStrength Training,{D4} 17:30:00,false,Strength,0.00,310,00:55:00,118,149,--\nHiking,{D8} 10:05:00,false,Esja,6.62,980,02:08:44,135,162,\"597\"\nGolf,{D12} 13:00:00,false,Grafarholt,7.1,1100,04:05:10,105,130,40\n".replace('{D1}', ago(1)).replace('{D3}', ago(3)).replace('{D4}', ago(4)).replace('{D8}', ago(8)).replace('{D12}', ago(12));
        D().runImport(new File([csv], 'Activities.csv', { type: 'text/csv' })); }],
      ['Allar íþróttir', async () => { D().clearDraft(); tab('log'); await wait(); const m = document.querySelector('details.more'); if (m) m.open = true; }],
      ['Sund með gufu og pottum', async () => { D().clearDraft(); tab('log'); await wait(); click('[data-newtype="swim"]'); await wait();
        set('#dist', '1000'); set('#dur', '26:30'); for (const k of ['hot', 'sauna', 'cold', 'sauna', 'cold']){ click(`[data-act="spaadd"][data-k="${k}"]`); await wait(30); } window.scrollTo(0, 0); }],
      ['Velja æfingu', async () => { D().clearDraft(); tab('log'); await wait(); click('[data-newtype="lift"]'); }]]],
    ['Vinir', [
      ['Vikan hjá vinum', async () => { tab('friends'); await wait(); click('[data-fm="week"]'); }],
      ['Stigatafla', async () => { tab('friends'); await wait(); click('[data-fm="board"]'); click('[data-bm="km"]'); }],
      ['Áskoranir', async () => { tab('friends'); await wait(); click('[data-fm="ch"]'); }],
      ['Athugasemdir við æfingu', async () => { tab('friends'); await wait(); const b = document.querySelector('.flist [data-fdetail]'); if (b) b.click(); await wait(200);
        const c = document.querySelector('.cmts'); if (c) c.scrollIntoView({ block: 'start' }); }],
      ['Prófíll vinar', async () => { tab('friends'); await wait(); D().openProfile('u3'); }],
      ['Bæta við vini', async () => { tab('friends'); await wait(); click('[data-act="addfriend"]'); }],
      ['Vinahlekkur opnaður', async () => { tab('friends'); await wait(); D().invite('HAL3ZK'); }],
      ['Vinahlekkur opnaður', async () => { tab('friends'); await wait(); D().invite('HAL3ZK'); }],
      ['Hrós sem þú fékkst', async () => { tab('home'); await wait(); click('[data-act="kudosopen"]'); }]]],
    ['Framfarir', [
      ['Markmið', async () => { tab('progress'); await wait(); click('[data-pm="goals"]'); }],
      ['Nýtt markmið', async () => { tab('progress'); await wait(); click('[data-pm="goals"]'); await wait(); click('[data-act="goalnew"]'); }],
      ['Markmið í smáatriðum', async () => { tab('progress'); await wait(); click('[data-pm="goals"]'); await wait(); click('.gcard'); }],
      ['Lyftingar', async () => { tab('progress'); await wait(); click('[data-pm="lift"]'); }],
      ['Íþróttir: hlaup', async () => { tab('progress'); await wait(); click('[data-pm="cardio"]'); click('[data-pt="run"]'); }],
      ['Íþróttir: golf', async () => { tab('progress'); await wait(); click('[data-pm="cardio"]'); click('[data-pt="golf"]'); }],
      ['Líkaminn', async () => { tab('progress'); await wait(); click('[data-pm="body"]'); }],
      ['Saga', () => tab('history')]]],
    ['Stillingar', [
      ['Stillingar', () => click('#settingsBtn')],
      ['Íþróttir í stillingum', async () => { click('#settingsBtn'); await wait(); const h = [...document.querySelectorAll('.sec-h')].find(x => x.textContent === 'Íþróttir'); if (h) h.scrollIntoView({ block: 'start' }); }],
      ['Um þig', async () => { click('#settingsBtn'); await wait(); click('[data-act="aboutedit"]'); }],
      ['Vöðvar vikunnar', async () => { tab('home'); await wait(); const m = document.querySelector('.hp-muscles'); if (m) m.scrollIntoView({ block: 'center' }); }],
      ['Vikusamantekt', async () => { tab('home'); await wait(); D().summary(); }],
      ['Árið þitt', async () => { tab('progress'); await wait(); D().year(); }],
      ['Merki og laugaleikurinn', async () => { tab('progress'); await wait(); click('[data-pm="badges"]'); }],
      ['Vikurit: punktar', async () => { D().setWeek('dots'); }],
      ['Vikurit: súlurit', async () => { D().setWeek('bars'); }],
      ['Vikurit: flísar', async () => { D().setWeek('tiles'); }],
      ['Vikurit: hringir', async () => { D().setWeek('rings'); }],
      ['Staðfesting netfangs', async () => { D().unverified(); }],
      ['Hvað sjá vinir', async () => { click('#settingsBtn'); await wait(); const h = [...document.querySelectorAll('.sec-h')].find(x => x.textContent === 'Vinir og maki'); if (h) h.scrollIntoView({ block: 'start' }); }],
      ['Spurt hvort á að deila', async () => { D().askLast(); }],
      ['Senda ábendingu', async () => { click('#settingsBtn'); await wait(); click('[data-act="fbopen"][data-v="idea"]'); }],
      ['Flytja út gögn', async () => { click('#settingsBtn'); await wait(); click('[data-act="exportopen"]'); }]]],
    ['Aðgangur og nýskráning', [
      ['Fagnaðarskjár', () => D().celebrate('Markmiði náð!', 'Bekkpressa 100 kg')],
      ['Upphafsskjár', () => D().auth('start')],
      ['Nýr aðgangur með netfangi', () => D().auth('signup')],
      ['Setja upp á heimaskjá', async () => { click('#settingsBtn'); await wait(); click('[data-act="installhelp"]'); }],
      ['Innskráning með netfangi', () => D().auth('signin')],
      ['Gleymt lykilorð', () => D().auth('reset')],
      ['Nýskráning: íþróttir', () => D().gate('sports')],
      ['Nýskráning: Um þig', () => D().gate('about')]]]
  ];
  const btn = document.createElement('button'); btn.id = 'demoBtn'; btn.type = 'button'; btn.textContent = 'Skoða skjái';
  const panel = document.createElement('div'); panel.id = 'demoPanel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Skjáir í sýnishorni');
  panel.innerHTML = `<div class="dp-h"><b>Sýnishorn</b><button type="button" class="btn ghost" data-dclose>Loka</button></div>
    <p class="tiny" style="margin:0 0 10px">Tilbúin gögn: Aron, makinn Sigga og vinirnir Jón og Gunna. Allt virkar, en breytingar hverfa þegar síðan er opnuð aftur. Útlitsstillingar haldast.</p>
    ${SCREENS.map(([grp, list], gi) => `<div class="dp-g">${grp}</div><div class="dp-l">${list.map(([l], i) => `<button type="button" class="chip" data-d="${gi}.${i}">${l}</button>`).join('')}</div>`).join('')}`;
  document.body.append(btn, panel);
  btn.addEventListener('click', () => panel.classList.toggle('open'));
  panel.addEventListener('click', async e => {
    if (e.target.closest('[data-dclose]')) return panel.classList.remove('open');
    const b = e.target.closest('[data-d]'); if (!b) return;
    const [gi, i] = b.dataset.d.split('.').map(Number);
    panel.classList.remove('open'); await reset(); await SCREENS[gi][1][i][1]();
  });
})();

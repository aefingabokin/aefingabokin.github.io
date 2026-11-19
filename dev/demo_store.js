/* ===== Sýnishorn: gagnalag í minni með tilbúnum gögnum (í stað Firebase) ===== */
const DemoStore = (() => {
  const pad = n => String(n).padStart(2, '0');
  const ymdD = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return ymdD(d); };
  const idOf = name => 'x_' + name.toLowerCase().replace(/[^a-z0-9áðéíóúýþæö]+/g, '-');
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const iso = d => new Date(d + 'T18:00:00').toISOString();
  const db = { users: {}, households: {}, sessions: {}, exercises: {}, people: {}, codes: {}, requests: {}, friendships: {},
    shared: {}, goals: {}, meas: {}, challenges: {} };
  const ME = 'u1', SIG = 'u2', JON = 'u3', GUN = 'u4', BJA = 'u5';
  db.users[ME] = { householdId: 'H1', about: { birthDate: '1987-05-14', sex: 'male', heightCm: 183, targetWeight: 85, targetBodyFat: 18 } };
  db.users[SIG] = { householdId: 'H1' };
  db.households.H1 = { owner: ME, members: [ME, SIG], profiles: { [ME]: { name: 'Aron', visibility: 'summary' }, [SIG]: { name: 'Sigga', visibility: 'full' } } };
  db.people = { [ME]: { name: 'Aron', code: 'ARON7K' }, [SIG]: { name: 'Sigga', code: 'SIG4QM' }, [JON]: { name: 'Jón', code: 'JON2XP' },
    [GUN]: { name: 'Gunna', code: 'GUN8RT' }, [BJA]: { name: 'Bjarki', code: 'BJA5WN' }, u6: { name: 'Halla', code: 'HAL3ZK' } };
  Object.entries(db.people).forEach(([u, p]) => db.codes[p.code] = u);
  db.sessions.H1 = {}; db.exercises.H1 = {};
  let n = 0; const sid = () => 'd' + (++n);
  const addS = s => { const id = sid(); db.sessions.H1[id] = { id, createdAt: iso(s.date), updatedAt: iso(s.date), notes: '', ...s }; return id; };
  const lift = (pid, date, list, dur, extra) => addS({ profileId: pid, type: 'lift', date, durationMin: dur, ...(extra || {}),
    exercises: list.map(([name, sets]) => ({ exId: idOf(name), name, sets: sets.map(([kg, reps]) => ({ kg, reps })) })) });
  const r25 = v => Math.round(v / 2.5) * 2.5;
  // Aron: 8 vikur, mán/mið/fös lyftingar, þri og lau hlaup, fim sund með pottum, sun ganga
  for (let back = 56; back >= 0; back--){
    const d = new Date(); d.setDate(d.getDate() - back); const wd = (d.getDay() + 6) % 7, date = ymdD(d), prog = (56 - back) / 56;
    const skip = rnd() < 0.12;
    if (skip && back > 1) continue;
    const bench = r25(85 + prog * 10), squat = r25(90 + prog * 12.5), press = r25(45 + prog * 5);
    if (wd === 0) lift(ME, date, [['Bekkpressa', [[bench, 8], [bench, 8], [bench + 2.5, 5]]], ['Niðurtog (pull down)', [[55, 12], [60, 10], [60, 9]]], ['Curl (tvíhöfði)', [[14, 12], [16, 9]]]], 58, { cardio: [{ when: 'pre', machine: 'bike', min: 10 }] });
    if (wd === 2) lift(ME, date, [['Hnébeygja', [[squat, 6], [squat, 6], [squat, 5]]], ['Fótapressa', [[160, 12], [180, 10]]], ['Axlapressa', [[press, 8], [press, 7]]]], 62, back % 14 < 7 ? { cardio: [{ when: 'pre', machine: 'row', min: 5, dist: 1000 }, { when: 'post', machine: 'stairs', min: 10, kcal: 95 }] } : null);
    if (wd === 4 && rnd() < 0.7) lift(ME, date, [['Réttstöðulyfta', [[r25(120 + prog * 10), 5], [r25(120 + prog * 10), 5]]], ['Stangaróður', [[60, 10], [65, 8]]], ['Bekkpressa', [[bench - 10, 10], [bench - 10, 10]]]], 50);
    if (wd === 1){ const km = 5 + Math.round(rnd() * 10) / 10, tempo = back % 14 < 7; addS({ profileId: ME, type: 'run', date, distance: km, durationMin: km * (tempo ? 5.1 : 6.0 + rnd() * 0.2), avgHr: tempo ? 168 : 146 }); }
    if (wd === 5){ const km = 9 + Math.round(rnd() * 30) / 10; addS({ profileId: ME, type: 'run', date, distance: km, durationMin: km * (6.05 + rnd() * 0.2), avgHr: 148, notes: back < 10 ? 'Ægisíða og Nauthólsvík' : '' }); }
    if (wd === 3) addS({ profileId: ME, type: 'swim', pool: ['Vesturbæjarlaug', 'Vesturbæjarlaug', 'Laugardalslaug', 'Sundhöll Reykjavíkur'][Math.floor(rnd() * 4)], date, distance: 800 + Math.round(rnd() * 4) * 100, durationMin: 22 + Math.round(rnd() * 8),
      spa: [{ kind: 'hot', min: 15 }, { kind: 'sauna', min: 12 }, { kind: 'cold', min: 2 }, { kind: 'sauna', min: 10 }, { kind: 'cold', min: 1.5 }] });
    if (wd === 6 && rnd() < 0.6) addS({ profileId: ME, type: 'walk', date, distance: 6 + Math.round(rnd() * 40) / 10, durationMin: 80 + Math.round(rnd() * 40), title: null, notes: rnd() < 0.5 ? 'Esjan með Siggu' : '' });
    // Sigga
    if (wd === 0 && rnd() < 0.85){ const km = 5 + Math.round(rnd() * 20) / 10; addS({ profileId: SIG, type: 'run', date, distance: km, durationMin: km * 6.4 }); }
    if (wd === 2 && rnd() < 0.85) addS({ profileId: SIG, type: 'swim', pool: rnd() < 0.7 ? 'Vesturbæjarlaug' : 'Seltjarnarneslaug', date, distance: 1000, durationMin: 28, spa: [{ kind: 'hot', min: 20 }, { kind: 'steam', min: 10 }, { kind: 'cold', min: 1 }] });
    if (wd === 4 && rnd() < 0.8) lift(SIG, date, [['Mjaðmalyfta (hip thrust)', [[r25(60 + prog * 15), 10], [r25(60 + prog * 15), 10], [r25(60 + prog * 15), 8]]], ['Fótapressa', [[100, 12], [110, 10]]], ['Niðurtog (pull down)', [[35, 12], [40, 10]]]], 55);
    if (wd === 6 && rnd() < 0.6) addS({ profileId: SIG, type: 'walk', date, distance: 7, durationMin: 105 });
  }
  // Fleiri íþróttir: fjallganga, golf, hóptímar, jóga og padel
  addS({ profileId: ME, type: 'hike', date: dayAgo(9), title: 'Esjan að Steini', distance: 6.6, durationMin: 128, elevation: 597, avgHr: 139 });
  addS({ profileId: ME, type: 'hike', date: dayAgo(23), title: 'Úlfarsfell', distance: 4.8, durationMin: 74, elevation: 290 });
  addS({ profileId: ME, type: 'golf', sub: 'h18', date: dayAgo(12), course: 'Grafarholtsvöllur', par: 71, score: 94, points: 31, durationMin: 250 });
  addS({ profileId: ME, type: 'golf', sub: 'h18', date: dayAgo(26), course: 'Korpúlfsstaðavöllur', par: 72, score: 97, points: 28, durationMin: 262 });
  addS({ profileId: ME, type: 'golf', sub: 'h9', date: dayAgo(5), course: 'Hvaleyrarvöllur', par: 35, score: 46, points: 17, durationMin: 125 });
  addS({ profileId: ME, type: 'golf', sub: 'range', date: dayAgo(3), balls: 120, longest: 228, durationMin: 50, pb: 'long' });
  addS({ profileId: ME, type: 'golf', sub: 'range', date: dayAgo(17), balls: 100, longest: 214, durationMin: 45 });
  addS({ profileId: ME, type: 'golf', sub: 'range', date: dayAgo(31), balls: 90, longest: 209, durationMin: 40 });
  addS({ profileId: ME, type: 'golf', sub: 'range', date: dayAgo(44), balls: 110, longest: 205, durationMin: 45 });
  addS({ profileId: ME, type: 'golf', sub: 'h18', date: dayAgo(40), course: 'Grafarholtsvöllur', par: 71, score: 99, points: 26, durationMin: 268 });
  addS({ profileId: ME, type: 'golf', sub: 'h18', date: dayAgo(54), course: 'Urriðavöllur', par: 71, score: 101, points: 25, durationMin: 275 });
  addS({ profileId: ME, type: 'class', sub: 'spin', date: dayAgo(6), durationMin: 45, intensity: 'hard', avgHr: 158 });
  addS({ profileId: SIG, type: 'class', sub: 'crossfit', date: dayAgo(30), box: 'CrossFit Reykjavík', wod: 'Fran', durationMin: 60, intensity: 'hard' });
  addS({ profileId: ME, type: 'class', sub: 'crossfit', date: dayAgo(41), box: 'CrossFit Reykjavík', wod: 'Snörun og Fran', durationMin: 60, intensity: 'hard', pb: 'cf',
    prs: [{ key: 'snatch', name: 'Snatch', kind: 'kg', value: 62.5 }, { key: 'fran', name: 'Fran', kind: 'time', value: 6.4 }] });
  addS({ profileId: ME, type: 'class', sub: 'crossfit', date: dayAgo(13), box: 'CrossFit Reykjavík', wod: 'Cindy', durationMin: 60, intensity: 'hard', pb: 'cf',
    prs: [{ key: 'cindy', name: 'Cindy', kind: 'rounds', value: 17, rounds: 17, reps: 8 }, { key: 'pullups', name: 'Upphífingar (max)', kind: 'reps', value: 18 }] });
  addS({ profileId: SIG, type: 'yoga', sub: 'hot', date: dayAgo(2), durationMin: 60 });
  addS({ profileId: SIG, type: 'yoga', sub: 'yoga', date: dayAgo(9), durationMin: 60 });
  addS({ profileId: SIG, type: 'racket', sub: 'padel', date: dayAgo(4), durationMin: 90, intensity: 'mod', result: 'Unnum 6–4, 4–6, 6–3' });
  // Vinir: yfirlit sem þeir deila
  const sh = (u, s) => { db.shared[u] = db.shared[u] || {}; const id = sid(); db.shared[u][id] = { id, ownerId: u, title: null, distance: null, durationMin: null, exerciseCount: 0, setCount: 0, volume: null, detail: null, effort: null, spa: [], kudos: {}, ...s }; };
  for (let back = 41; back >= 0; back--){
    const d = new Date(); d.setDate(d.getDate() - back); const wd = (d.getDay() + 6) % 7, date = ymdD(d);
    if ([0, 2, 4, 6].includes(wd) && rnd() < 0.85){ const km = wd === 6 ? 14 + Math.round(rnd() * 60) / 10 : 6 + Math.round(rnd() * 30) / 10, easy = wd !== 2;
      sh(JON, { date, type: 'run', distance: km, durationMin: km * (easy ? 5.6 : 4.85), effort: easy ? 'easy' : (wd === 2 ? 'hard' : 'mod') }); }
    if ([1, 3].includes(wd) && rnd() < 0.8) sh(GUN, { date, type: 'lift', exerciseCount: 4, setCount: 13, volume: 6200 + Math.round(rnd() * 900), durationMin: 60,
      detail: { notes: 'Góð æfing', exercises: [{ name: 'Hnébeygja', sets: [{ kg: 70, reps: 6 }, { kg: 72.5, reps: 5 }, { kg: 72.5, reps: 5 }] }, { name: 'Rúmensk réttstöðulyfta (RDL)', sets: [{ kg: 60, reps: 8 }, { kg: 60, reps: 8 }] }] } });
    if (wd === 5 && rnd() < 0.8) sh(GUN, { date, type: 'swim', distance: 1500, durationMin: 38, spa: [{ kind: 'infrared', min: 20, n: 1 }, { kind: 'cold', min: 3, n: 2 }] });
    if (wd === 3 && back < 20 && rnd() < 0.7) sh(GUN, { date, type: 'racket', sub: 'padel', durationMin: 90, intensity: 'hard', result: 'Sigur 2–1' });
    if (wd === 5 && back < 15) sh(JON, { date, type: 'ski', sub: 'xc', distance: 15, durationMin: 82, effort: null });
  }
  Object.values(db.shared[JON] || {}).slice(-3).forEach((x, i) => { x.kudos = i === 0 ? { [GUN]: { n: 'Gunna', r: 'fire' } } : {}; });
  db.friendships['u1_u3'] = { id: 'u1_u3', members: [ME, JON] };
  db.friendships['u1_u4'] = { id: 'u1_u4', members: [ME, GUN] };
  db.requests['u1_u5'] = { id: 'u1_u5', from: BJA, to: ME, fromName: 'Bjarki' };
  // Markmið
  db.goals[ME] = {
    _focus: { id: '_focus', type: 'focus', text: 'Sterkari bekkpressa og hálfmaraþon í vor', tags: ['Styrkur', 'Hlaup'], shared: true },
    g1: { id: 'g1', type: 'weekly', activity: 'all', metric: 'sessions', target: 5, shared: true, status: 'active', start: dayAgo(40) },
    g2: { id: 'g2', type: 'weekly', activity: 'cold', metric: 'sessions', target: 2, shared: true, status: 'active', start: dayAgo(30) },
    g3: { id: 'g3', type: 'strength', exId: 'x_bekkpressa', exName: 'Bekkpressa', kg: 100, reps: 1, deadline: dayAgo(-45), shared: true, status: 'active', start: dayAgo(50) },
    g4: { id: 'g4', type: 'runtime', distance: 10, timeMin: 55, shared: true, status: 'active', start: dayAgo(50) },
    g5: { id: 'g5', type: 'runtime', distance: 21.1, timeMin: 120, deadline: dayAgo(-160), shared: true, status: 'active', start: dayAgo(20) },
    g6: { id: 'g6', type: 'total', activity: 'all', metric: 'distance', target: 400, start: dayAgo(56), end: `${new Date().getFullYear()}-12-31`, shared: false, status: 'active' }
  };
  db.goals[SIG] = { _focus: { id: '_focus', type: 'focus', text: 'Meiri styrkur og reglulegt sund', tags: ['Styrkur', 'Sund'], shared: true },
    s1: { id: 's1', type: 'weekly', activity: 'swim', metric: 'sessions', target: 1, shared: true, status: 'active', progress: { pct: 1, valueText: '1 af 1 skipti', sub: 'Vikumarkmiði náð', streak: 6, weeks: [true, true, true, true, true, true, true, true] } } };
  db.goals[JON] = { _focus: { id: '_focus', type: 'focus', text: 'Undirbý Reykjavíkurmaraþonið', tags: ['Hlaup', 'Þol'], shared: true },
    j1: { id: 'j1', type: 'runtime', distance: 5, timeMin: 22, shared: true, status: 'achieved', achievedAt: dayAgo(2), progress: { pct: 1, valueText: '21:48', sub: `Náð` }, kudos: {} },
    j2: { id: 'j2', type: 'weekly', activity: 'run', metric: 'distance', target: 40, shared: true, status: 'active', progress: { pct: 0.62, valueText: '24,8 af 40 km', sub: 'Vantar 15,2 km í vikunni', streak: 5, weeks: [true, false, true, true, true, true, true, false] } },
    j3: { id: 'j3', type: 'runtime', distance: 42.2, timeMin: 225, deadline: dayAgo(-280), shared: true, status: 'active', progress: { pct: 0.86, valueText: '4:21:30', sub: 'Vantar 36:30. Hraði sem þarf: 5:20 mín/km' } } };
  db.goals[GUN] = { _focus: { id: '_focus', type: 'focus', text: 'Fyrsta 100 kg hnébeygjan', tags: ['Styrkur', 'Vöðvamassi'], shared: true },
    k1: { id: 'k1', type: 'strength', exId: 'x_hnébeygja', exName: 'Hnébeygja', kg: 100, reps: 1, shared: true, status: 'active', progress: { pct: 0.8, valueText: '80 kg', sub: 'Vantar 20 kg. Besta: 80 kg × 2' } } };
  // Athugasemdir og tilkynningar
  db.comments = {}; db.inbox = { [ME]: {} };
  const lastRun = Object.values(db.sessions.H1).filter(x => x.profileId === ME && x.type === 'run').sort((a, b) => b.date.localeCompare(a.date))[0];
  const atIso = (n, h) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 12, 0, 0); return d.toISOString(); };
  if (lastRun){
    db.comments[`${ME}/${lastRun.id}`] = [
      { id: 'cm1', from: JON, name: 'Jón', text: 'Flottur hraði! Má ég koma með á laugardaginn?', at: atIso(0, 9) },
      { id: 'cm2', from: GUN, name: 'Gunna', text: 'Vel gert 🔥 Ægisíðan er best á morgnana.', at: atIso(0, 10) }];
    db.inbox[ME].cm1 = { id: 'cm1', kind: 'comment', from: JON, name: 'Jón', sid: lastRun.id, text: 'Flottur hraði! Má ég koma með á laugardaginn?', what: 'Hlaup', at: atIso(0, 9), read: false };
    db.inbox[ME].cm2 = { id: 'cm2', kind: 'comment', from: GUN, name: 'Gunna', sid: lastRun.id, text: 'Vel gert 🔥 Ægisíðan er best á morgnana.', what: 'Hlaup', at: atIso(0, 10), read: false };
  }
  const jonLast = Object.values(db.shared[JON] || {}).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (jonLast) db.comments[`${JON}/${jonLast.id}`] = [{ id: 'cm3', from: GUN, name: 'Gunna', text: 'Ertu að æfa fyrir maraþonið? Þú ert á flugi!', at: atIso(1, 19) }];
  // Mælingar
  [[63, 90.8, 22.6, 37.9, 96, 58], [56, 90.4, 22.3, 38.0, null, 58], [49, 90.1, 22.0, 38.0, 95, 57], [42, 89.6, 21.8, 38.2, null, 57], [35, 89.4, 21.5, 38.2, 94.5, 56],
   [28, 88.9, 21.2, 38.3, null, 56], [21, 88.6, 20.9, 38.4, 94, 55], [14, 88.3, 20.7, 38.5, null, 55], [7, 88.0, 20.5, 38.6, 93, 54], [1, 87.8, 20.3, 38.6, null, 54]]
    .forEach(([b, w, f, m, waist, hr], i) => { db.meas['m' + i] = { id: 'm' + i, date: dayAgo(b), weight: w, bodyFat: f, muscle: m, waist, restingHr: hr, note: i === 9 ? 'Mælt á morgnana' : null }; });
  // Áskorun
  const now = new Date(), ms = ymdD(new Date(now.getFullYear(), now.getMonth(), 1)), me_ = ymdD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  db.challenges.c1 = { id: 'c1', title: `${['Janúar','Febrúar','Mars','Apríl','Maí','Júní','Júlí','Ágúst','September','Október','Nóvember','Desember'][now.getMonth()]}kílómetrar`,
    metric: 'km', target: 100, start: ms, end: me_, owner: JON, members: [ME, SIG, JON, GUN], names: { [ME]: 'Aron', [SIG]: 'Sigga', [JON]: 'Jón', [GUN]: 'Gunna' },
    progress: { [SIG]: 21.4, [JON]: 63.2, [GUN]: 9.5 } };

  // Hlustarar
  const subs = []; const on = (key, fn) => { const s = { key, fn }; subs.push(s); setTimeout(fn, 0); return () => { const i = subs.indexOf(s); if (i >= 0) subs.splice(i, 1); }; };
  const fire = key => setTimeout(() => subs.filter(s => s.key === key).forEach(s => s.fn()), 0);
  const clone = x => JSON.parse(JSON.stringify(x));
  let authCb = null, freshSignup = false;
  const meUser = { uid: ME, name: 'Aron', email: 'aron@daemi.is' };
  return {
    configured: true,
    onAuthChange(cb){ authCb = cb; setTimeout(() => cb(meUser), 0); },
    async signIn(){ authCb && authCb(meUser); }, async signOut(){ authCb && authCb(null); },
    /* Sýnishorn: nýskráning fer í gegnum fyrstu skrefin og endar í gögnum Arons */
    async signUpEmail(name, email, pw){ freshSignup = true; authCb && authCb({ ...meUser, name, email }); },
    async signInEmail(email, pw){ if (!pw) throw Object.assign(new Error('x'), { code: 'auth/missing-password' }); authCb && authCb({ ...meUser, email }); },
    async resetPassword(){ },
    async resendVerification(){ }, async refreshUser(){ return true; },
    async loadMembership(uid){ if (freshSignup){ freshSignup = false; return null; } return (db.users[uid] || {}).householdId || null; },
    async createHousehold(u){ return 'H1'; }, async joinHousehold(){ return 'H1'; },
    subscribe(hid, cb){ return on('hh', () => cb({ household: clone(db.households[hid]), sessions: Object.values(db.sessions[hid]).map(clone), exercises: Object.values(db.exercises[hid]).map(clone) })); },
    async putSession(hid, s){ db.sessions[hid][s.id] = clone(s); fire('hh'); },
    async deleteSession(hid, id){ delete db.sessions[hid][id]; fire('hh'); },
    async putExercise(hid, ex){ db.exercises[hid][ex.id] = clone(ex); fire('hh'); },
    async setProfileName(hid, uid, name){ db.households[hid].profiles[uid].name = name; fire('hh'); },
    async setVisibility(hid, uid, v){ db.households[hid].profiles[uid].visibility = v; fire('hh'); },
    async setSharing(hid, uid, v, from){ Object.assign(db.households[hid].profiles[uid], { visibility: v, shareFrom: from || null }); fire('hh'); },
    async getSettings(uid){ return (db.users[uid] || {}).settings || null; },
    async saveSettings(uid, s){ db.users[uid].settings = clone(s); },
    async getAbout(uid){ return clone((db.users[uid] || {}).about || null); },
    async saveAbout(uid, a){ db.users[uid].about = clone(a); },
    subscribeMeasurements(uid, cb){ return on('meas', () => cb(Object.values(db.meas).map(clone))); },
    async putMeasurement(uid, m){ db.meas[m.id] = clone(m); fire('meas'); },
    async deleteMeasurement(uid, id){ delete db.meas[id]; fire('meas'); },
    async ensurePerson(u, name){ return clone(db.people[u.uid]); },
    async setPhoto(uid, data){ if (data) db.people[uid].photo = data; else delete db.people[uid].photo; },
    async setPersonName(uid, name){ db.people[uid].name = name; },
    async getPerson(uid){ return clone(db.people[uid] || null); },
    async lookupCode(code){ return db.codes[code] || null; },
    async lookupEmail(email){ return ({ 'aron@daemi.is': ME, 'sigga@daemi.is': SIG, 'jon@daemi.is': JON, 'gunna@daemi.is': GUN, 'bjarki@daemi.is': BJA, 'halla@daemi.is': 'u6' })[email] || (email === 'nyr@daemi.is' ? 'u6' : null); },
    async sendRequest(from, fromName, to){ db.requests[`${to}_${from}`] = { id: `${to}_${from}`, from, to, fromName }; fire('social'); },
    async respondRequest(me, from, ok){ if (ok){ const [a, b] = [me, from].sort(); db.friendships[`${a}_${b}`] = { id: `${a}_${b}`, members: [a, b] }; } delete db.requests[`${me}_${from}`]; fire('social'); },
    async cancelRequest(from, to){ delete db.requests[`${to}_${from}`]; fire('social'); },
    async removeFriend(fid){ delete db.friendships[fid]; fire('social'); },
    subscribeSocial(uid, cb){ return on('social', () => cb({ incoming: Object.values(db.requests).filter(r => r.to === uid).map(clone),
      outgoing: Object.values(db.requests).filter(r => r.from === uid).map(clone), friendships: Object.values(db.friendships).filter(f => f.members.includes(uid)).map(clone) })); },
    subscribeShared(uid, since, cb){ return on('shared', () => cb(Object.values(db.shared[uid] || {}).filter(x => !since || x.date >= since).map(clone))); },
    async putShared(uid, d, isNew){
      db.shared[uid] = db.shared[uid] || {};
      const prev = db.shared[uid][d.id] || {};
      const doc = { ...prev, ...(isNew ? { kudos: {} } : {}), ...clone(d) };
      // Sýnishorn: vinir hafa hrósað nýlegu hlaupi
      if (isNew && uid === ME && d.type === 'run' && d.date >= dayAgo(4)) doc.kudos = { [JON]: { n: 'Jón', r: 'fire' }, [GUN]: { n: 'Gunna', r: 'sweat' } };
      if (isNew && uid === ME && d.type === 'lift' && d.date >= dayAgo(3)) doc.kudos = { [JON]: { n: 'Jón', r: 'muscle' } };
      if (isNew && uid === ME && d.type === 'hike') doc.kudos = { [GUN]: { n: 'Gunna', r: 'clap' }, [SIG]: { n: 'Sigga', r: 'fire' } };
      db.shared[uid][d.id] = doc; fire('shared');
    },
    async deleteShared(uid, id){ delete (db.shared[uid] || {})[id]; fire('shared'); },
    async setKudos(o, sid_, from, name){ const d = db.shared[o][sid_]; d.kudos = { ...(d.kudos || {}) }; if (name) d.kudos[from] = name; else delete d.kudos[from]; fire('shared'); },
    subscribeGoals(uid, own, cb){ return on('goals', () => cb(Object.values(db.goals[uid] || {}).filter(g => own || g.shared).map(clone))); },
    async putGoal(uid, g, merge){ db.goals[uid] = db.goals[uid] || {}; db.goals[uid][g.id] = merge ? { ...(db.goals[uid][g.id] || {}), ...clone(g) } : clone(g); fire('goals'); },
    async deleteGoal(uid, id){ delete db.goals[uid][id]; fire('goals'); },
    async setGoalKudos(o, gid, from, name){ const g = db.goals[o][gid]; g.kudos = { ...(g.kudos || {}) }; if (name) g.kudos[from] = name; else delete g.kudos[from]; fire('goals'); },
    subscribeChallenges(uid, cb){ return on('ch', () => cb(Object.values(db.challenges).filter(c => c.members.includes(uid)).map(clone))); },
    async createChallenge(c){ const id = 'c' + Date.now(); db.challenges[id] = { ...clone(c), id, progress: {} }; fire('ch'); return id; },
    async setProgress(cid, uid, v){ db.challenges[cid].progress[uid] = v; fire('ch'); },
    async leaveChallenge(cid, uid){ const c = db.challenges[cid]; c.members = c.members.filter(x => x !== uid); delete c.progress[uid]; fire('ch'); },
    async deleteChallenge(cid){ delete db.challenges[cid]; fire('ch'); },
    subscribeComments(owner, sid, cb){ return on('comments', () => cb((db.comments[`${owner}/${sid}`] || []).map(clone))); },
    async addComment(owner, sid, c, note){ const k = `${owner}/${sid}`; db.comments[k] = [...(db.comments[k] || []), clone(c)];
      if (note){ db.inbox[owner] = db.inbox[owner] || {}; db.inbox[owner][c.id] = { ...clone(note), id: c.id }; } fire('comments'); fire('inbox'); },
    async deleteComment(owner, sid, cid){ const k = `${owner}/${sid}`; db.comments[k] = (db.comments[k] || []).filter(x => x.id !== cid); fire('comments'); },
    subscribeInbox(uid, cb){ return on('inbox', () => cb(Object.values(db.inbox[uid] || {}).sort((a, b) => b.at.localeCompare(a.at)).map(clone))); },
    async markRead(uid, ids){ ids.forEach(id => { if (db.inbox[uid][id]) db.inbox[uid][id].read = true; }); fire('inbox'); },
    async sendFeedback(fb){ db.feedback = db.feedback || []; db.feedback.push({ ...clone(fb), at: new Date().toISOString(), status: 'new' }); },
    async importAll(hid, ss, ex){ ss.forEach(s => db.sessions[hid][s.id] = clone(s)); ex.forEach(e => db.exercises[hid][e.id] = clone(e)); fire('hh'); }
  };
})();

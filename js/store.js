/* =====================================================================
   Gagnalag Æfingabókarinnar: Firebase Auth + Firestore.
   Viðmótið (ui.js) talar aðeins við hlutinn sem createFirebaseStore skilar.

   Gagnalíkan í Firestore:
     users/{uid}                      { householdId, settings, about }  about: fæðingardagur, kyn, hæð, markmið (einkamál)
     users/{uid}/goals/{id}           markmið og áhersla (_focus); vinir og maki sjá aðeins þau sem eru shared
     feedback/{id}                   ábendingar, hugmyndir og villur frá notendum (aðeins stjórnandi les)
     metrics/{totals|custom|cohorts|day-YYYY-MM-DD|week-YYYY-Www}  nafnlausar samtölur fyrir stjórnborðið (/admin)
     users/{uid}/measurements/{id}    mælingar: þyngd, fituprósenta, ummál o.fl. (aðeins notandinn sjálfur)
     households/{hid}                 { owner, members: [uid, uid], profiles: { uid: { name } }, createdAt }
     households/{hid}/sessions/{id}   ein æfing (lyftingar, hlaup, sund …)
     households/{hid}/exercises/{id}  æfingar sem þið búið til sjálf
     people/{uid}                     { name, code, photo }  nafn, vinakóði og prófílmynd (256 px JPEG)
     codes/{CODE}                     { uid }         fletting á vinakóða
     emails/{netfang}                 { uid }         fletting á netfangi (aðeins nákvæm, ekki listi)
     users/{uid}/shared/{id}/comments/{c}  athugasemdir vina og maka við æfingu
     users/{uid}/inbox/{id}           tilkynningar, t.d. ný athugasemd
     users/{uid}/shared/{id}          yfirlit æfingar sem vinir sjá (með smáatriðum ef notandi velur „Allt“)
     requests/{til}_{frá}             vinabeiðni
     friendships/{a}_{b}              vinátta, uid í stafrófsröð
     challenges/{id}                  áskorun: { title, metric, target, start, end, owner, members, names, progress }
   ===================================================================== */
import { firebaseConfig } from './firebase-config.js';

const V = '10.12.2'; // Fest útgáfa af Firebase JS SDK
const CDN = `https://www.gstatic.com/firebasejs/${V}`;

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function makeCode(){
  const r = new Uint32Array(6); crypto.getRandomValues(r);
  return Array.from(r, n => CODE_CHARS[n % CODE_CHARS.length]).join('');
}

export const isConfigured = !!(firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith('SETTU'));

export async function createFirebaseStore(){
  if (!isConfigured) return { configured: false };

  const [{ initializeApp }, A, F] = await Promise.all([
    import(`${CDN}/firebase-app.js`),
    import(`${CDN}/firebase-auth.js`),
    import(`${CDN}/firebase-firestore.js`)
  ]);

  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  auth.languageCode = 'is';   // tölvupóstar frá Firebase á íslensku þar sem það er í boði
  let db;
  try {
    // Gögnin geymast líka í símanum svo appið virki án netsambands í ræktinni
    db = F.initializeFirestore(app, {
      localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true
    });
  } catch (e) {
    db = F.initializeFirestore(app, { ignoreUndefinedProperties: true });
  }

  const hhRef = hid => F.doc(db, 'households', hid);
  const sessCol = hid => F.collection(db, 'households', hid, 'sessions');
  const exCol = hid => F.collection(db, 'households', hid, 'exercises');

  return {
    configured: true,

    onAuthChange(cb){ return A.onAuthStateChanged(auth, u => cb(u ? { uid: u.uid, name: u.displayName || '', email: u.email || '',
      emailVerified: !!u.emailVerified, provider: ((u.providerData || [])[0] || {}).providerId || 'password' } : null)); },
    /* Staðfesting netfangs (aðeins fyrir aðgang með netfangi og lykilorði) */
    resendVerification(){ return auth.currentUser ? A.sendEmailVerification(auth.currentUser) : Promise.resolve(); },
    async refreshUser(){ if (!auth.currentUser) return false; await auth.currentUser.reload(); return !!auth.currentUser.emailVerified; },
    /* Google: sprettigluggi, en framsending ef vafrinn lokar á glugga (t.d. í sumum símum) */
    async signIn(){
      const p = new A.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
      try { await A.signInWithPopup(auth, p); }
      catch (e){ if (e && /popup-blocked|operation-not-supported/.test(e.code || '')) return A.signInWithRedirect(auth, p); throw e; }
    },
    /* Netfang og lykilorð */
    async signUpEmail(name, email, password){
      const cred = await A.createUserWithEmailAndPassword(auth, email, password);
      if (name) await A.updateProfile(cred.user, { displayName: name });
      A.sendEmailVerification(cred.user).catch(() => {});
    },
    signInEmail(email, password){ return A.signInWithEmailAndPassword(auth, email, password); },
    resetPassword(email){ return A.sendPasswordResetEmail(auth, email); },
    async signOut(){ await A.signOut(auth); },

    async loadMembership(uid){
      const snap = await F.getDoc(F.doc(db, 'users', uid));
      return snap.exists() ? (snap.data().householdId || null) : null;
    },

    async getSettings(uid){
      const snap = await F.getDoc(F.doc(db, 'users', uid));
      return snap.exists() ? (snap.data().settings || null) : null;
    },
    saveSettings(uid, settings){ return F.setDoc(F.doc(db, 'users', uid), { settings }, { merge: true }); },

    /* Persónuupplýsingar og mælingar: aðeins notandinn sjálfur hefur aðgang (sjá firestore.rules) */
    async getAbout(uid){
      const snap = await F.getDoc(F.doc(db, 'users', uid));
      return snap.exists() ? (snap.data().about || null) : null;
    },
    saveAbout(uid, about){ return F.setDoc(F.doc(db, 'users', uid), { about }, { merge: true }); },
    subscribeMeasurements(uid, cb, onError){
      return F.onSnapshot(F.collection(db, 'users', uid, 'measurements'), s => cb(s.docs.map(d => ({ ...d.data(), id: d.id }))), onError);
    },
    putMeasurement(uid, m){ return F.setDoc(F.doc(db, 'users', uid, 'measurements', m.id), m); },
    deleteMeasurement(uid, id){ return F.deleteDoc(F.doc(db, 'users', uid, 'measurements', id)); },

    async createHousehold(user, name){
      const ref = F.doc(F.collection(db, 'households'));
      await F.setDoc(ref, { owner: user.uid, members: [user.uid], profiles: { [user.uid]: { name } }, createdAt: F.serverTimestamp() });
      await F.setDoc(F.doc(db, 'users', user.uid), { householdId: ref.id, joinedAt: new Date().toISOString() }, { merge: true });
      return ref.id;
    },

    async joinHousehold(user, hid, name){
      // Ekki hægt að lesa heimilið fyrr en maður er orðinn meðlimur, svo við uppfærum beint
      await F.updateDoc(hhRef(hid), { members: F.arrayUnion(user.uid), [`profiles.${user.uid}`]: { name } });
      await F.setDoc(F.doc(db, 'users', user.uid), { householdId: hid, joinedAt: new Date().toISOString() }, { merge: true });
      return hid;
    },

    /* Hlustar á heimilið, æfingarnar og eigin æfingar. cb fær alltaf heildarstöðuna. */
    subscribe(hid, cb, onError){
      const cur = { household: null, sessions: null, exercises: null };
      const emit = () => cb({ ...cur });
      const fail = e => onError && onError(e);
      const u1 = F.onSnapshot(hhRef(hid), s => { cur.household = s.exists() ? s.data() : null; emit(); }, fail);
      const u2 = F.onSnapshot(sessCol(hid), s => { cur.sessions = s.docs.map(d => ({ ...d.data(), id: d.id })); emit(); }, fail);
      const u3 = F.onSnapshot(exCol(hid), s => { cur.exercises = s.docs.map(d => ({ ...d.data(), id: d.id })); emit(); }, fail);
      return () => { u1(); u2(); u3(); };
    },

    putSession(hid, s){ return F.setDoc(F.doc(sessCol(hid), s.id), s); },
    deleteSession(hid, id){ return F.deleteDoc(F.doc(sessCol(hid), id)); },
    putExercise(hid, ex){ return F.setDoc(F.doc(exCol(hid), ex.id), ex); },
    setProfileName(hid, uid, name){ return F.updateDoc(hhRef(hid), { [`profiles.${uid}.name`]: name }); },

    /* ---------- Vinir ---------- */
    async ensurePerson(user, name){
      const ref = F.doc(db, 'people', user.uid);
      // Svo vinir geti fundið þig með netfanginu (aðeins nákvæm fletting, enginn listi)
      if (user.email) F.setDoc(F.doc(db, 'emails', user.email.toLowerCase()), { uid: user.uid }).catch(() => {});
      const snap = await F.getDoc(ref);
      if (snap.exists() && snap.data().code){
        if (name && snap.data().name !== name) await F.updateDoc(ref, { name });
        return { ...snap.data(), name: name || snap.data().name };
      }
      for (let i = 0; i < 6; i++){
        const code = makeCode();
        try {
          await F.setDoc(F.doc(db, 'codes', code), { uid: user.uid });   // hafnað ef kóðinn er frátekinn
          await F.setDoc(ref, { name, code }, { merge: true });
          return { name, code };
        } catch (e){ if (i === 5) throw e; }
      }
    },
    /* Prófílmynd: smækkuð JPEG-mynd (data-URL) geymd beint á prófílnum, null fjarlægir hana */
    setPhoto(uid, dataUrl){ return F.setDoc(F.doc(db, 'people', uid), { photo: dataUrl ? dataUrl : F.deleteField() }, { merge: true }); },
    setPersonName(uid, name){ return F.setDoc(F.doc(db, 'people', uid), { name }, { merge: true }); },
    async getPerson(uid){ const s = await F.getDoc(F.doc(db, 'people', uid)); return s.exists() ? s.data() : null; },
    async lookupEmail(email){ const s = await F.getDoc(F.doc(db, 'emails', email.toLowerCase())); return s.exists() ? s.data().uid : null; },
    async lookupCode(code){ const s = await F.getDoc(F.doc(db, 'codes', code)); return s.exists() ? s.data().uid : null; },
    sendRequest(fromUid, fromName, toUid){
      return F.setDoc(F.doc(db, 'requests', `${toUid}_${fromUid}`), { from: fromUid, to: toUid, fromName, createdAt: F.serverTimestamp() });
    },
    async respondRequest(meUid, fromUid, accept){
      if (accept){
        const [a, b] = [meUid, fromUid].sort();
        await F.setDoc(F.doc(db, 'friendships', `${a}_${b}`), { members: [a, b], since: F.serverTimestamp() });
      }
      await F.deleteDoc(F.doc(db, 'requests', `${meUid}_${fromUid}`));
    },
    cancelRequest(fromUid, toUid){ return F.deleteDoc(F.doc(db, 'requests', `${toUid}_${fromUid}`)); },
    removeFriend(fid){ return F.deleteDoc(F.doc(db, 'friendships', fid)); },
    subscribeSocial(uid, cb, onError){
      const cur = { incoming: null, outgoing: null, friendships: null };
      const emit = () => cb({ ...cur });
      const map = s => s.docs.map(d => ({ ...d.data(), id: d.id }));
      const u1 = F.onSnapshot(F.query(F.collection(db, 'requests'), F.where('to', '==', uid)), s => { cur.incoming = map(s); emit(); }, onError);
      const u2 = F.onSnapshot(F.query(F.collection(db, 'requests'), F.where('from', '==', uid)), s => { cur.outgoing = map(s); emit(); }, onError);
      const u3 = F.onSnapshot(F.query(F.collection(db, 'friendships'), F.where('members', 'array-contains', uid)), s => { cur.friendships = map(s); emit(); }, onError);
      return () => { u1(); u2(); u3(); };
    },
    subscribeShared(uid, sinceDate, cb, onError){
      const col = F.collection(db, 'users', uid, 'shared');
      const q = sinceDate ? F.query(col, F.where('date', '>=', sinceDate)) : col;
      return F.onSnapshot(q, s => cb(s.docs.map(d => ({ ...d.data(), id: d.id }))), onError);
    },
    putShared(uid, data, isNew){
      return F.setDoc(F.doc(db, 'users', uid, 'shared', data.id), isNew ? { ...data, kudos: {} } : data, { merge: true });
    },
    deleteShared(uid, id){ return F.deleteDoc(F.doc(db, 'users', uid, 'shared', id)); },
    setKudos(ownerUid, sid, fromUid, name){
      return F.updateDoc(F.doc(db, 'users', ownerUid, 'shared', sid), { [`kudos.${fromUid}`]: name ? name : F.deleteField() });
    },
    setSharing(hid, uid, vis, shareFrom){ return F.updateDoc(hhRef(hid), { [`profiles.${uid}.visibility`]: vis, [`profiles.${uid}.shareFrom`]: shareFrom || null }); },
    setVisibility(hid, uid, vis){ return F.updateDoc(hhRef(hid), { [`profiles.${uid}.visibility`]: vis }); },

    /* ---------- Markmið ---------- */
    // Eigin markmið: öll. Annarra: aðeins þau sem eru merkt shared (reglurnar krefjast þess í fyrirspurninni)
    subscribeGoals(uid, own, cb, onError){
      const col = F.collection(db, 'users', uid, 'goals');
      return F.onSnapshot(own ? col : F.query(col, F.where('shared', '==', true)), s => cb(s.docs.map(d => ({ ...d.data(), id: d.id }))), onError);
    },
    putGoal(uid, g, merge){ return F.setDoc(F.doc(db, 'users', uid, 'goals', g.id), g, { merge: !!merge }); },
    deleteGoal(uid, gid){ return F.deleteDoc(F.doc(db, 'users', uid, 'goals', gid)); },
    setGoalKudos(ownerUid, gid, fromUid, name){
      return F.updateDoc(F.doc(db, 'users', ownerUid, 'goals', gid), { [`kudos.${fromUid}`]: name ? name : F.deleteField() });
    },

    /* ---------- Nafnlaus notkunartölfræði ----------
       Aðeins samtölur (tölur án nafna eða auðkenna) í metrics/. Aðeins stjórnandi getur lesið þær. */
    bump(docId, counts){
      const inc = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? F.increment(v) : inc(v)]));
      return F.setDoc(F.doc(db, 'metrics', docId), inc(counts), { merge: true });
    },
    async getUserMeta(uid){ const s = await F.getDoc(F.doc(db, 'users', uid)); return s.exists() ? { joinedAt: s.data().joinedAt || null } : {}; },

    /* ---------- Athugasemdir og tilkynningar ---------- */
    subscribeComments(owner, sid, cb, onError){
      const q = F.query(F.collection(db, 'users', owner, 'shared', sid, 'comments'), F.orderBy('at'));
      return F.onSnapshot(q, s => cb(s.docs.map(d => ({ ...d.data(), id: d.id }))), onError);
    },
    async addComment(owner, sid, c, note){
      await F.setDoc(F.doc(db, 'users', owner, 'shared', sid, 'comments', c.id), c);
      if (note) await F.setDoc(F.doc(db, 'users', owner, 'inbox', c.id), note);
    },
    async deleteComment(owner, sid, cid, fromMe){
      await F.deleteDoc(F.doc(db, 'users', owner, 'shared', sid, 'comments', cid));
      if (fromMe) F.deleteDoc(F.doc(db, 'users', owner, 'inbox', cid)).catch(() => {});
    },
    subscribeInbox(uid, cb, onError){
      const q = F.query(F.collection(db, 'users', uid, 'inbox'), F.orderBy('at', 'desc'), F.limit(30));
      return F.onSnapshot(q, s => cb(s.docs.map(d => ({ ...d.data(), id: d.id }))), onError);
    },
    async markRead(uid, ids){
      const b = F.writeBatch(db); ids.forEach(id => b.update(F.doc(db, 'users', uid, 'inbox', id), { read: true })); await b.commit();
    },

    /* Ábendingar og villutilkynningar: aðeins stjórnandi les þær */
    sendFeedback(fb){ return F.setDoc(F.doc(F.collection(db, 'feedback')), { ...fb, at: new Date().toISOString(), status: 'new' }); },

    /* ---------- Áskoranir ---------- */
    subscribeChallenges(uid, cb, onError){
      return F.onSnapshot(F.query(F.collection(db, 'challenges'), F.where('members', 'array-contains', uid)),
        s => cb(s.docs.map(d => ({ ...d.data(), id: d.id }))), onError);
    },
    createChallenge(c){ const ref = F.doc(F.collection(db, 'challenges')); return F.setDoc(ref, { ...c, progress: {}, createdAt: F.serverTimestamp() }).then(() => ref.id); },
    setProgress(cid, uid, value){ return F.updateDoc(F.doc(db, 'challenges', cid), { [`progress.${uid}`]: value }); },
    leaveChallenge(cid, uid){ return F.updateDoc(F.doc(db, 'challenges', cid), { members: F.arrayRemove(uid), [`progress.${uid}`]: F.deleteField() }); },
    deleteChallenge(cid){ return F.deleteDoc(F.doc(db, 'challenges', cid)); },

    /* Innlestur úr afriti (JSON úr fyrri útgáfu), í skömmtum */
    async importAll(hid, sessions, exercises){
      const items = [
        ...sessions.map(s => [F.doc(sessCol(hid), s.id), s]),
        ...exercises.map(e => [F.doc(exCol(hid), e.id), e])
      ];
      for (let i = 0; i < items.length; i += 400){
        const b = F.writeBatch(db);
        items.slice(i, i + 400).forEach(([ref, data]) => b.set(ref, data));
        await b.commit();
      }
    }
  };
}

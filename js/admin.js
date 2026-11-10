/* Stjórnborð: innskráning með Google og lestur á nafnlausum samtölum úr metrics/.
   Aðgangi er stýrt í firestore.rules (isAdmin), ekki bara hér. */
import { firebaseConfig } from './firebase-config.js';
import { renderDashboard } from './admin-view.js';

const V = '10.12.2', CDN = `https://www.gstatic.com/firebasejs/${V}`;
const root = document.getElementById('admin');
const msg = (title, body, btn) => { root.innerHTML = `<div class="gate glass"><h1>${title}</h1><p class="muted">${body}</p>${btn || ''}</div>`; };

(async () => {
  if (!firebaseConfig || String(firebaseConfig.apiKey || '').startsWith('SETTU')) return msg('Stjórnborð', 'Firebase er ekki tengt ennþá. Settu stillingarnar í js/firebase-config.js.');
  const [{ initializeApp }, A, F] = await Promise.all([import(`${CDN}/firebase-app.js`), import(`${CDN}/firebase-auth.js`), import(`${CDN}/firebase-firestore.js`)]);
  const app = initializeApp(firebaseConfig), auth = A.getAuth(app), db = F.getFirestore(app);
  let range = 30, data = null, fbFilter = 'new';
  const load = async () => {
    root.innerHTML = `<div class="gate"><p class="muted" style="text-align:center">Sæki tölur…</p></div>`;
    const snap = await F.getDocs(F.collection(db, 'metrics'));
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    data = { totals: (docs.find(d => d.id === 'totals') || {}), custom: (docs.find(d => d.id === 'custom') || {}), cohorts: (docs.find(d => d.id === 'cohorts') || {}),
      days: docs.filter(d => d.id.startsWith('day-')), weeks: docs.filter(d => d.id.startsWith('week-')) };
    delete data.cohorts.id;
    try { const fs = await F.getDocs(F.query(F.collection(db, 'feedback'), F.orderBy('at', 'desc'), F.limit(200))); data.feedback = fs.docs.map(d => ({ id: d.id, ...d.data() })); }
    catch(e){ data.feedback = []; }
    draw();
  };
  const draw = () => renderDashboard(root, data, { range, onRefresh: true, fbFilter });
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.range){ range = +b.dataset.range; draw(); }
    if (b.dataset.fbfilter){ fbFilter = b.dataset.fbfilter; draw(); }
    if (b.dataset.fbdone){ const f = data.feedback.find(x => x.id === b.dataset.fbdone); if (f){ f.status = b.dataset.v; draw();
      F.updateDoc(F.doc(db, 'feedback', f.id), { status: f.status }).catch(() => {}); } }
    if (b.hasAttribute('data-refresh')) load().catch(err => msg('Villa', esc(err.message)));
    if (b.hasAttribute('data-signin')) A.signInWithPopup(auth, new A.GoogleAuthProvider()).catch(() => {});
    if (b.hasAttribute('data-signout')) A.signOut(auth);
  });
  A.onAuthStateChanged(auth, async user => {
    if (!user) return msg('Stjórnborð', 'Skráðu þig inn með netfangi stjórnanda.', '<button class="gbtn" data-signin>Skrá inn með Google</button>');
    /* Hver hefur aðgang er ákveðið í öryggisreglunum (isAdmin), svo netfangið þarf ekki að vera í opnum kóða */
    try { await load(); }
    catch(err){
      if (err && err.code === 'permission-denied') return msg('Enginn aðgangur', `${esc(user.email || '')} hefur ekki aðgang að stjórnborðinu.`, '<button class="btn block" data-signout>Skrá út</button>');
      msg('Gat ekki sótt tölur', 'Athugaðu netið og að öryggisreglurnar séu komnar inn í Firebase.', '<button class="btn block" data-refresh>Reyna aftur</button>');
    }
  });
})().catch(err => msg('Villa', 'Náði ekki að ræsa stjórnborðið. Athugaðu netið.'));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

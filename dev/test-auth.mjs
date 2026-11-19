import { JSDOM } from 'jsdom';
import fs from 'fs';
const html = fs.readFileSync('./index.html','utf8').replace(/<link[^>]*fonts[^>]*>/g,'').replace(/<script type="module"[^>]*><\/script>/,'');
const dom = new JSDOM(html, { url: 'https://aron.github.io/aefingabokin/', pretendToBeVisual: true });
const w = dom.window;
for (const k of ['window','document','localStorage','location','history','navigator','URL','URLSearchParams','FileReader','Blob','MouseEvent','Event'])
  try { globalThis[k] = w[k]; } catch(e){ Object.defineProperty(globalThis, k, {value: w[k], configurable: true}); }
w.scrollTo = () => {}; w.confirm = () => true; globalThis.confirm = () => true; w.Element.prototype.scrollIntoView = () => {};
const errs = []; w.addEventListener('error', e => errs.push(e.message));
const accounts = { 'aron@daemi.is': { pw: 'leyniord1', uid: 'u1', name: 'Aron' } };
let authCb, resets = [];
const err = code => Object.assign(new Error(code), { code });
const Store = {
  configured: true, onAuthChange(cb){ authCb = cb; setTimeout(() => cb(null), 0); },
  async signIn(){ throw err('auth/popup-closed-by-user'); },
  async signUpEmail(name, email, pw){ if (accounts[email]) throw err('auth/email-already-in-use'); accounts[email] = { pw, uid: 'n' + Date.now(), name }; authCb({ uid: accounts[email].uid, name: '', email }); },
  async signInEmail(email, pw){ const a = accounts[email]; if (!a || a.pw !== pw) throw err('auth/invalid-credential'); authCb({ uid: a.uid, name: a.name, email }); },
  async resetPassword(email){ resets.push(email); },
  async signOut(){ authCb(null); },
  async loadMembership(uid){ return uid === 'u1' ? 'H1' : null; },
  subscribe(h, cb){ setTimeout(() => cb({ household: { owner: 'u1', members: ['u1'], profiles: { u1: { name: 'Aron' } } }, sessions: [], exercises: [] }), 0); return () => {}; }
};
const { startApp } = await import('./gh/js/ui.js');
const d = document, wait = (ms = 60) => new Promise(r => setTimeout(r, ms));
const click = s => { const el = typeof s === 'string' ? d.querySelector(s) : s; if (!el) throw new Error('missing ' + s); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
const submit = () => d.querySelector('#authform').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
const set = (s, v) => { d.querySelector(s).value = v; };
const T = s => (s || '').replace(/\s+/g, ' ').trim();
try {
  const app = startApp(Store); await wait(80);
  console.log('welcome:', T(d.querySelector('.welcome').textContent).slice(0, 220));
  console.log('tabs hidden on welcome:', w.getComputedStyle(d.querySelector('.tabs')).display);
  click('[data-act="signin"]'); await wait(); console.log('google cancelled → err shown:', !!d.querySelector('.autherr'));
  click('[data-act="authmode"][data-m="signup"]'); console.log('signup form:', d.querySelector('h1').textContent, '| fields:', [...d.querySelectorAll('#authform input')].map(i => i.id + ':' + i.autocomplete).join(','));
  set('#au_name', 'Sigga Jóns'); set('#au_email', 'ekki-netfang'); set('#au_pw', 'stutt'); submit(); await wait();
  console.log('invalid email:', T(d.querySelector('.autherr').textContent));
  set('#au_email', 'sigga@daemi.is'); set('#au_pw', 'stutt'); submit(); await wait(); console.log('short pw:', T(d.querySelector('.autherr').textContent));
  set('#au_email', 'aron@daemi.is'); set('#au_pw', 'langtlykilord'); submit(); await wait(); console.log('exists:', T(d.querySelector('.autherr').textContent));
  click('[data-act="pwtoggle"]'); console.log('pw toggle type:', d.querySelector('#au_pw').type);
  set('#au_email', 'sigga@daemi.is'); set('#au_pw', 'langtlykilord'); submit(); await wait(120);
  console.log('after signup gate:', d.body.dataset.gate, '| name prefilled:', d.querySelector('#myname') && d.querySelector('#myname').value);
  click('[data-act="signout"]'); await wait(80);
  console.log('after signout:', d.body.dataset.gate, !!d.querySelector('.welcome'));
  click('[data-act="authmode"][data-m="signin"]'); set('#au_email', 'aron@daemi.is'); set('#au_pw', 'rangt'); submit(); await wait(); console.log('wrong pw:', T(d.querySelector('.autherr').textContent));
  click('[data-act="authmode"][data-m="reset"]'); console.log('reset email kept:', d.querySelector('#au_email').value); submit(); await wait(); console.log('reset info:', T(d.querySelector('.authinfo').textContent).slice(0, 60), '| sent:', resets);
  click('[data-act="authmode"][data-m="signin"]'); set('#au_pw', 'leyniord1'); submit(); await wait(200);
  console.log('signin gate:', d.body.dataset.gate);
  app.stop(); console.log('errors', errs);
} catch (e) { console.log('FAIL', e.stack, errs); }
process.exit(0);

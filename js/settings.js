/* =====================================================================
   Stillingar hvers notanda.
   Til að bæta við nýrri stillingu:
     1. Bættu sjálfgefnu gildi við DEFAULTS.
     2. Bættu línu við SCHEMA (choice = val milli kosta, toggle = af/á, number = tala).
     3. Notaðu gildið í appinu: settings.lykill
   Stillingarnar vistast í users/{uid}.settings í Firebase og í símanum.
   ===================================================================== */

export const LS_KEY = 'aefingabokin.settings';

export const DEFAULTS = {
  theme: 'system',      // system | light | dark
  palette: 'glacier',   // sjá PALETTES
  textSize: 'normal',   // normal | large
  glass: 'on',          // on | off
  weekStyle: 'A',       // útlit vikurits: A | B | C | D
  sportPalette: 'classic', // litir íþrótta: classic | orka | nordurljos | solarlag | jokull
  homeCards: ['week', 'goals', 'stats', 'kudos', 'recent', 'prs'],
  homeHidden: [],
  tabsHidden: [],
  kgStep: 'auto',       // auto | 2.5 | 1.25 | 1 | 0.5
  startTab: 'home',     // home | log
  maxHr: null,          // hámarkspúls, notaður til að meta álag hlaupa
  analytics: 'on',      // nafnlaus notkunartölfræði: on | off
  sports: ['lift', 'run', 'walk', 'swim', 'bike', 'other']   // íþróttir sem birtast sem flísar við skráningu
};

export const SPORT_IDS = ['lift', 'run', 'walk', 'hike', 'swim', 'bike', 'ski', 'class', 'yoga', 'ball', 'racket', 'golf', 'row', 'climb', 'combat', 'dance', 'other'];

/* Litir: [grunnur, ljómi 1, ljómi 2, ljómi 3] fyrir ljóst og dökkt */
export const PALETTES = [
  { id: 'glacier', name: 'Jökull',     light: ['#D9E4F0', '#A9C8EC', '#A8E0D8', '#CFC3EE'], dark: ['#14243A', '#2F6FAE', '#1A8C8A', '#3B2F7A'] },
  { id: 'aurora',  name: 'Norðurljós', light: ['#DCEBE6', '#9FE0C4', '#B5D3EE', '#CDB9EC'], dark: ['#0B1A1F', '#138A6A', '#1E5E8C', '#4B2B7F'] },
  { id: 'sunset',  name: 'Sólsetur',   light: ['#F2E4DE', '#F5B99A', '#E9A9C6', '#C9B6EE'], dark: ['#1E1830', '#C2572F', '#6B2F5E', '#3B2F7A'] },
  { id: 'lava',    name: 'Hraun',      light: ['#E6E3E1', '#DCC3B4', '#C9CED6', '#E3B9A8'], dark: ['#141313', '#5A2A1E', '#2B2F36', '#3A1C14'] },
  { id: 'mono',    name: 'Hreint',     light: ['#EEF0F3', '#EEF0F3', '#EEF0F3', '#EEF0F3'], dark: ['#101418', '#101418', '#101418', '#101418'] }
];

export const HOME_CARDS = [
  { id: 'week',   name: 'Vikuritið' },
  { id: 'goals',  name: 'Markmið' },
  { id: 'stats',  name: 'Tölur vikunnar' },
  { id: 'kudos',  name: 'Hrós sem þú færð' },
  { id: 'recent', name: 'Síðustu æfingar' },
  { id: 'prs',    name: 'Þyngstu settin' }
];

export const OPTIONAL_TABS = [
  { id: 'friends',  name: 'Vinir' },
  { id: 'history',  name: 'Saga' },
  { id: 'progress', name: 'Framfarir' }
];

export const SCHEMA = {
  appearance: [
    { key: 'theme', label: 'Ljóst eða dökkt', type: 'choice', options: [['system', 'Eins og síminn'], ['light', 'Ljóst'], ['dark', 'Dökkt']] },
    { key: 'palette', label: 'Litaþema', type: 'palette' },
    { key: 'textSize', label: 'Textastærð', type: 'choice', options: [['normal', 'Venjuleg'], ['large', 'Stærri']] },
    { key: 'weekStyle', label: 'Útlit vikurits', hint: 'Hvernig æfingar dagsins birtast í vikunni', type: 'weekstyle' },
    { key: 'sportPalette', label: 'Litir íþrótta', hint: 'Litirnir á æfingum í vikuritinu, sögunni og línuritum', type: 'sportpal' },
    { key: 'glass', label: 'Gegnsæ glerjáferð', hint: 'Slökktu á henni ef síminn hikstar eða textinn sést illa', type: 'toggle', on: 'on', off: 'off' }
  ],
  logging: [
    { key: 'kgStep', label: 'Þyngdarskref á + og −', hint: 'Sjálfvirkt: 1 kg undir 20 kg, annars 2,5 kg', type: 'choice',
      options: [['auto', 'Sjálfvirkt'], ['2.5', '2,5 kg'], ['1.25', '1,25 kg'], ['1', '1 kg'], ['0.5', '0,5 kg']] },
    { key: 'startTab', label: 'Appið opnast á', type: 'choice', options: [['home', 'Vikunni'], ['log', 'Skrá æfingu']] },
    { key: 'maxHr', label: 'Hámarkspúls', hint: 'Notaður til að meta álag hlaupa út frá meðalpúls. Ef tómt er hann áætlaður út frá aldri, annars miðað við hraða.', type: 'number', min: 120, max: 230, placeholder: 'slög/mín' }
  ]
};

export function normalize(s){
  const o = { ...DEFAULTS, ...(s && typeof s === 'object' ? s : {}) };
  const ids = HOME_CARDS.map(c => c.id);
  o.homeCards = (Array.isArray(o.homeCards) ? o.homeCards : []).filter(id => ids.includes(id));
  // Ný spjöld fara á sinn sjálfgefna stað, ekki aftast
  DEFAULTS.homeCards.forEach((id, i) => { if (!o.homeCards.includes(id)) o.homeCards.splice(Math.min(i, o.homeCards.length), 0, id); });
  o.homeHidden = (Array.isArray(o.homeHidden) ? o.homeHidden : []).filter(id => ids.includes(id));
  o.tabsHidden = (Array.isArray(o.tabsHidden) ? o.tabsHidden : []).filter(id => OPTIONAL_TABS.some(t => t.id === id));
  if (!PALETTES.some(p => p.id === o.palette)) o.palette = DEFAULTS.palette;
  if (!['A', 'B', 'C', 'D'].includes(o.weekStyle)) o.weekStyle = DEFAULTS.weekStyle;
  if (!['classic', 'orka', 'nordurljos', 'solarlag', 'jokull'].includes(o.sportPalette)) o.sportPalette = DEFAULTS.sportPalette;
  o.sports = (Array.isArray(o.sports) ? o.sports : []).filter(id => SPORT_IDS.includes(id));
  if (!o.sports.length) o.sports = DEFAULTS.sports.slice();
  const hr = Number(o.maxHr); o.maxHr = hr >= 120 && hr <= 230 ? Math.round(hr) : null;
  return o;
}

export function readLocal(){
  try { return normalize(JSON.parse(localStorage.getItem(LS_KEY) || 'null')); } catch(e){ return normalize(null); }
}
export function writeLocal(s){ try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch(e){} }

export function prefersDark(s){
  if (s.theme === 'dark') return true;
  if (s.theme === 'light') return false;
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch(e){ return false; }
}

export function applyAppearance(s){
  const r = document.documentElement;
  if (s.theme === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', s.theme);
  r.dataset.palette = s.palette;
  r.dataset.text = s.textSize;
  r.dataset.glass = s.glass;
  if (s.sportPalette && s.sportPalette !== 'classic') r.dataset.sportpal = s.sportPalette; else delete r.dataset.sportpal;
  const p = PALETTES.find(x => x.id === s.palette) || PALETTES[0];
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', (prefersDark(s) ? p.dark : p.light)[0]);
}

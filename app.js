// MYTHORIA Guardian — tableau de bord.
// Lit les données réellement enregistrées par le Guardian (branche « guardian-data » du dépôt)
// et l'état des contrôles en cours (API publique de GitHub). Aucune donnée inventée.

// ---------- adresses ----------
const qs = new URLSearchParams(location.search);
const onPages = location.hostname.endsWith('.github.io');
// L'appli a sa propre adresse (…github.io/mythoria-guardian/) ; elle surveille le dépôt du jeu « mythoria-game ».
const OWNER = onPages ? location.hostname.split('.')[0] : 'nicolas06061997';
const NAME = 'mythoria-game';
const DATA = qs.get('data') || `https://raw.githubusercontent.com/${OWNER}/${NAME}/guardian-data/`;
const GAME = `https://${OWNER}.github.io/${NAME}/`;
const REPO = `https://github.com/${OWNER}/${NAME}`;
const ACTIONS = `${REPO}/actions/workflows/guardian.yml`;
const API_RUNS = `https://api.github.com/repos/${OWNER}/${NAME}/actions/runs?per_page=8`;
// Discussion avec les agents = issue GitHub n°1 du dépôt du jeu (les agents Claude la lisent et y répondent).
const CHAT_ISSUE = 1;
const API_ISSUE = `https://api.github.com/repos/${OWNER}/${NAME}/issues/${CHAT_ISSUE}`;
const CHAT_URL = `${REPO}/issues/${CHAT_ISSUE}`;
const AGENT_PASS_MIN = 42; // les agents passent chaque heure vers HH:42 (tâche planifiée)

// ---------- petits outils ----------
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v; // seulement pour nos icônes (jamais pour des données)
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}
const I = {
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3.2 8.6-7 10-3.8-1.4-7-5-7-10V6z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3.2 8.6-7 10-3.8-1.4-7-5-7-10V6z"/><path d="M8.5 12l2.4 2.4 4.6-4.8"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"/></svg>',
  bug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="7" y="7" width="10" height="13" rx="5"/><path d="M9 4l1.5 2M15 4l-1.5 2M3 12h4M17 12h4M4 7l3 2M20 7l-3 2M4 18l3-2M20 18l-3-2"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 001.5.9l10-6.5a1 1 0 000-1.8l-10-6.5A1 1 0 008 5.5z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/></svg>',
  dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  test: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 006 21h12a1.7 1.7 0 001.5-2.5L14 9V3"/><path d="M7 15h10"/></svg>',
  report: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>',
  crown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l4 4 5-7 5 7 4-4-2 12H5z"/></svg>',
  wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/></svg>',
  brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 3l3 3-9 9-3-3zM9 12c-3 0-4 2-4 4 0 1.5-1 2.5-2 3 4 1 8 0 8-4"/></svg>',
  scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 006 0zM18 7l-3 7a3 3 0 006 0z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2M16 7l3 3M18 5l2 2"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3h7v7M10 14L21 3M19 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h5"/></svg>',
};
const ic = name => h('span', { html: I[name], style: 'display:contents' });
const AGENT_IC = { testeur: 'test', gardien: 'shield', rapporteur: 'report', chef: 'crown', reparateur: 'wrench', graphiste: 'brush', equilibreur: 'scale',
  artiste: 'brush', ux: 'test', perf: 'report', triche: 'shield', ecrans: 'test' };

const pad = n => String(n).padStart(2, '0');
const hm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const sameDay = (a, b) => a.toDateString() === b.toDateString();
function rel(iso) {
  if (!iso) return '—';
  const d = new Date(iso), s = (Date.now() - d) / 1000;
  if (s < 60) return 'à l’instant';
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 6 * 3600) return `il y a ${Math.floor(s / 3600)} h ${pad(Math.floor(s % 3600 / 60))}`;
  const y = new Date(Date.now() - 864e5);
  if (sameDay(d, new Date())) return `aujourd’hui à ${hm(d)}`;
  if (sameDay(d, y)) return `hier à ${hm(d)}`;
  return `le ${pad(d.getDate())}/${pad(d.getMonth() + 1)} à ${hm(d)}`;
}
function dayLabel(iso) {
  const d = new Date(iso);
  if (sameDay(d, new Date())) return 'Aujourd’hui';
  if (sameDay(d, new Date(Date.now() - 864e5))) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}
const plural = (n, s, p = s + 's') => `${n} ${n > 1 ? p : s}`;
const store = { get(k, d) { try { const v = localStorage.getItem('guardian_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('guardian_' + k, JSON.stringify(v)); } catch (e) {} } };

// ---------- nouveautés de l'appli (affichées une fois sur l'accueil après chaque mise à jour) ----------
// À chaque publication : changer APP_VERSION et la liste (3 à 5 lignes, où regarder dans l'appli).
// APP_HISTORY : la plus récente en premier. Ajouter une entrée à chaque publication visible (elle sert aussi de carte
// « Nouveau dans l'appli » et alimente « Dernières mises à jour » dans l'onglet Historique).
const APP_HISTORY = [
  { v: '16/11 · n°6', at: '2026-11-16T03:00:00Z', items: [
    ['Les 6 bots sont en service', 'ils tournent à chaque contrôle du jeu depuis cette nuit : couleurs, lisibilité, performances, équilibrage, anti-triche, écrans extrêmes.'],
    ['Accueil', 'l’équipe affiche les 6 nouveaux bots et ce que chacun a trouvé au dernier contrôle.'],
    ['Contrôle', 'nouveaux onglets Fold plié, Très petit, Couché et Bots, avec leurs captures d’écran.'],
  ] },
  { v: '15/11 · n°5', at: '2026-11-15T14:45:00Z', items: [
    ['Historique', 'nouvelle rubrique « Dernières mises à jour » : ce qui a changé dans l’appli Guardian et dans le jeu, du plus récent au plus ancien.'],
  ] },
  { v: '15/11 · n°4', at: '2026-11-15T14:35:00Z', items: [
    ['Mises à jour', 'un bandeau « Nouvelle mise à jour disponible » apparaît en bas de l’appli dès qu’une nouveauté est envoyée : un appui et c’est installé.'],
    ['Accueil', 'carte « Nouveau dans l’appli » après chaque mise à jour.'],
  ] },
  { v: '15/11 · n°3', at: '2026-11-15T13:56:00Z', items: [
    ['Accueil', 'le bouton « Commander » lance un contrôle, publie une modification en attente ou revient à la version précédente.'],
    ['Discuter', 'liste « Travaux » : ce que les agents proposent, avec les boutons Oui / Non et l’avancement de chaque travail.'],
    ['Problèmes', 'quand un contrôle échoue, la photo de l’écran au moment de l’échec s’affiche sous le problème.'],
    ['Contrôle', 'nouveaux onglets (Fold plié, très petit écran, téléphone couché, bots), visibles dès que les 6 bots sont publiés dans le jeu.'],
    ['En coulisses', 'un Watchdog vérifie toutes les 15 minutes que le Guardian est vivant et te prévient sinon.'],
  ] },
];
const APP_VERSION = APP_HISTORY[0].v; // = « v » de version.json (sinon le bandeau de mise à jour s'affiche à tort)
const APP_NEWS = APP_HISTORY[0].items;
function newsCard() {
  if (store.get('seenVersion', '') === APP_VERSION) return null;
  return h('div', { class: 'card news' }, h('b', {}, '✨ Nouveau dans l’appli (' + APP_VERSION + ')'),
    h('ul', {}, APP_NEWS.map(([ou, quoi]) => h('li', {}, h('b', {}, ou + ' : '), quoi))),
    h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: () => { store.set('seenVersion', APP_VERSION); S.tab = 'historique'; S.majView = 'appli'; render(); scrollTo(0, 0); } }, 'Tout l’historique'),
      h('button', { class: 'btn gold', onclick: () => { store.set('seenVersion', APP_VERSION); render(); } }, 'J’ai vu')));
}
// Dernières mises à jour : l'appli (APP_HISTORY) et le jeu (publications réellement enregistrées par le Guardian).
function updatesCard() {
  const view = S.majView || 'jeu', D = S.data;
  const seg = h('div', { class: 'seg' }, [['jeu', 'Le jeu'], ['appli', 'L’appli Guardian']].map(([id, label]) => h('button', { class: view === id ? 'on' : '', onclick: () => { S.majView = id; render(); } }, label)));
  let body;
  if (view === 'appli') body = h('div', { class: 'card' }, APP_HISTORY.map((u, i) => h('details', { class: 'maj', open: i === 0 },
    h('summary', {}, h('b', {}, 'Version ' + u.v), h('span', { class: 'muted' }, i === 0 ? ' · installée' : ' · ' + rel(u.at))),
    h('ul', {}, u.items.map(([ou, quoi]) => h('li', {}, h('b', {}, ou + ' : '), quoi))))));
  else {
    const pubs = ((D && D.events) || []).filter(e => e.type === 'publication' || e.type === 'retour').slice(0, 10);
    const live = D && D.state && D.state.liveVersion, notes = S.gameNotes && S.gameNotes.v === live ? S.gameNotes.notes : null;
    if (live && S.gameNotes === undefined) { S.gameNotes = null; fetch(GAME + 'version.json?t=' + Date.now()).then(r => r.ok ? r.json() : null).then(j => { if (j && j.v) { S.gameNotes = { v: j.v, notes: String(j.notes || '') }; render(); } }).catch(() => {}); }
    body = h('div', { class: 'card' },
      live ? h('div', { class: 'trav' }, h('div', { class: 'trav-t' }, 'En ligne : version ' + live), notes ? h('div', { class: 'trav-d' }, notes) : null) : null,
      pubs.length ? pubs.map(e => h('div', { class: 'trav' }, h('div', { class: 'trav-t' }, (e.type === 'retour' ? '↩️ ' : '🚀 ') + e.title), h('div', { class: 'trav-m' }, `${dayLabel(e.at)} à ${hm(new Date(e.at))}`), e.detail ? h('div', { class: 'trav-d' }, e.detail) : null))
        : h('p', { class: 'muted small' }, 'Aucune publication enregistrée pour l’instant.'));
  }
  return [h('h2', {}, 'Dernières mises à jour'), seg, body];
}

// ---------- mise à jour de l'appli (comme les jeux : bandeau + bouton « Mettre à jour ») ----------
// version.json est relu toutes les 3 min et au retour sur l'appli ; s'il annonce une autre version que celle chargée,
// le bandeau #upd s'affiche. On ne recharge jamais tout seul (l'utilisateur est peut-être en train d'écrire).
async function checkUpdate() {
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return;
    const j = await r.json(); if (!j || !j.v || j.v === APP_VERSION || document.getElementById('upd')) return;
    const bar = h('div', { id: 'upd' }, h('div', {}, h('b', {}, '✨ Nouvelle mise à jour disponible'), h('small', {}, String(j.notes || '').slice(0, 140))),
      h('button', { class: 'btn gold', onclick: async () => { bar.querySelector('button').textContent = 'Installation…';
        try { const reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); } catch (e) {}
        location.reload(); } }, 'Mettre à jour'));
    document.body.append(bar);
  } catch (e) { /* hors ligne : on réessaiera */ }
}
setInterval(checkUpdate, 180000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkUpdate(); });
setTimeout(checkUpdate, 4000);

// ---------- données ----------
const S = { chat: null, chatErr: null, sending: false, me: null, tab: store.get('tab', 'accueil'), dev: 'telephone', quiet: store.get('quiet', false), data: null, offline: false, loading: false, live: null, report: null, error: null, at: 0 };

async function getJSON(file) {
  const r = await fetch(DATA + file + (DATA.startsWith('http') ? '?t=' + Math.floor(Date.now() / 60000) : ''), { cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
async function loadData() {
  S.loading = true; paintTop();
  try {
    const [state, runs, events, problems] = await Promise.all(['state.json', 'runs.json', 'events.json', 'problems.json'].map(getJSON));
    S.data = state ? { state, runs: runs || [], events: events || [], problems: problems || [] } : { empty: true };
    if (state && state.lastReport && (!S.report || S.report.date !== state.lastReport)) S.report = await getJSON(`reports/${state.lastReport}.json`).catch(() => null);
    S.offline = false; S.error = null; S.at = Date.now();
    store.set('cache', { data: S.data, report: S.report, at: S.at });
  } catch (e) {
    const c = store.get('cache', null);
    if (c) { S.data = c.data; S.report = c.report; S.at = c.at; }
    S.offline = true; S.error = String(e.message || e);
  }
  S.loading = false; render();
}
// contrôle en cours ? (API publique de GitHub, sans compte ; limitée à 60 demandes/heure : on demande toutes les 2 min)
let livePauseUntil = 0;
async function loadLive() {
  if (Date.now() < livePauseUntil) return;
  try {
    const r = await fetch(API_RUNS, { headers: ghHeaders() });
    if (r.status === 403 || r.status === 429) { livePauseUntil = Date.now() + 15 * 60e3; return; }
    if (!r.ok) return;
    const j = await r.json();
    const runs = (j.workflow_runs || []).filter(x => x.name === 'Guardian' && (x.status === 'in_progress' || x.status === 'queued'));
    const prev = !!S.live;
    S.live = runs.length ? runs.map(x => ({ at: x.run_started_at || x.created_at, event: x.event, branch: x.head_branch, url: x.html_url, title: x.display_title })) : null;
    if (prev && !S.live) setTimeout(loadData, 20000); // un contrôle vient de finir : ses résultats arrivent
    render();
  } catch (e) { /* hors ligne : on garde l'affichage */ }
}

// ---------- discussion (issue GitHub n°1) ----------
const token = () => store.get('token', '');
const ghHeaders = (json) => { const t = token(), hd = { accept: 'application/vnd.github+json' }; if (t) hd.authorization = 'Bearer ' + t; if (json) hd['content-type'] = 'application/json'; return hd; };
const AGENT_NAMES = { chef: 'Guardian (chef)', reparateur: 'Réparateur', graphiste: 'Graphiste', equilibreur: 'Équilibreur', testeur: 'Testeur' };
function parseComment(c) {
  const body = String(c.body || '');
  const m = body.match(/<!--\s*guardian\s+agent=([a-z]+)\s+type=([a-z]+)\s*-->/i);
  let text = body.replace(/<!--[\s\S]*?-->/g, '');
  if (m) text = text.replace(/^\s*🛡️?\s*\*\*Guardian[^\n]*\n/, '').replace(/\n-{3,}\s*\n\s*_Generated by[\s\S]*$/i, '');
  return { id: c.id, at: c.created_at, url: c.html_url, me: !m, agent: m ? m[1].toLowerCase() : null, type: m ? m[2].toLowerCase() : null, text: text.trim() };
}
// Une seule demande à la fois, et pause si GitHub limite les demandes (60/heure sans clé) : jamais de boucle.
let chatBusy = false, chatPauseUntil = 0;
async function loadChat() {
  if (chatBusy || Date.now() < chatPauseUntil) return;
  chatBusy = true;
  try {
    const ri = await fetch(API_ISSUE, { headers: ghHeaders() });
    if (!ri.ok) {
      if (ri.status === 403 || ri.status === 429) { const reset = +ri.headers.get('x-ratelimit-reset') * 1000; chatPauseUntil = reset > Date.now() ? Math.min(reset, Date.now() + 3600e3) : Date.now() + 10 * 60e3; }
      throw new Error(ri.status === 403 || ri.status === 429 ? 'GitHub limite les demandes pour l’instant ; nouvel essai à ' + hm(new Date(chatPauseUntil)) + (token() ? '' : ' (avec ta clé GitHub, cette limite disparaît)') : 'HTTP ' + ri.status);
    }
    const issue = await ri.json(), n = issue.comments || 0, last = Math.max(1, Math.ceil(n / 100));
    const pages = last > 1 ? [last - 1, last] : [1];
    const lists = await Promise.all(pages.map(p => fetch(`${API_ISSUE}/comments?per_page=100&page=${p}`, { headers: ghHeaders() }).then(r => r.ok ? r.json() : [])));
    const fresh = lists.flat().map(parseComment).filter(m => m.text);
    const same = S.chat && S.chat.length === fresh.length && (S.chat[S.chat.length - 1] || {}).id === (fresh[fresh.length - 1] || {}).id;
    S.chat = fresh;
    if (same && !S.chatErr) return;
    S.chatErr = null; store.set('chat', S.chat.slice(-120));
  } catch (e) { S.chatErr = String(e.message || e); if (!S.chat) S.chat = store.get('chat', null) || []; if (!chatPauseUntil || chatPauseUntil < Date.now()) chatPauseUntil = Date.now() + 60e3; }
  finally { chatBusy = false; }
  render();
}
async function checkToken(t) {
  const r = await fetch('https://api.github.com/user', { headers: { accept: 'application/vnd.github+json', authorization: 'Bearer ' + t } });
  if (!r.ok) throw new Error(r.status === 401 ? 'clé refusée par GitHub (recopie-la en entier)' : 'HTTP ' + r.status);
  return (await r.json()).login;
}
async function sendMessage(text) {
  text = String(text || '').trim();
  if (!text || S.sending) return false;
  if (!token()) { openTokenSheet(); return false; }
  S.sending = true; render();
  try {
    const r = await fetch(`${API_ISSUE}/comments`, { method: 'POST', headers: ghHeaders(true), body: JSON.stringify({ body: text }) });
    if (!r.ok) throw new Error(r.status === 401 || r.status === 403 || r.status === 404 ? 'la clé GitHub ne permet pas d’écrire (vérifie « Issues : Read and write »)' : 'HTTP ' + r.status);
    const c = await r.json();
    S.chat = [...(S.chat || []), parseComment(c)];
    store.set('draft', ''); toast('Message envoyé ✓');
    return true;
  } catch (e) { toast('Envoi impossible : ' + e.message); return false; }
  finally { S.sending = false; render(); }
}
// demandes d'autorisation encore sans réponse « oui/non D-… »
function pendingRequests() {
  const C = S.chat || [];
  return C.filter(m => m.type === 'demande').map(m => ({ ...m, code: (m.text.match(/D-\d{8}-\d+/) || [])[0] }))
    .filter(d => d.code && !C.some(x => x.me && Date.parse(x.at) > Date.parse(d.at) && new RegExp('\\b(oui|non)\\b[^\\n]*' + d.code, 'i').test(x.text)));
}
// Travaux = demandes « D-… » des agents, suivies de bout en bout grâce au code cité dans leurs messages :
// attente (pas de réponse) → accepte (oui) → test (envoi) → fait (publie) ; refuse (non) ; echec.
function travaux() {
  const C = S.chat || [], out = [];
  for (const m of C) {
    if (m.type !== 'demande') continue;
    const code = (m.text.match(/D-\d{8}-\d+/) || [])[0];
    if (!code || out.some(t => t.code === code)) continue;
    const has = new RegExp(code + '(?!\\d)'), yn = new RegExp('\\b(oui|non)\\b[^\\n]*' + code + '(?!\\d)', 'i');
    const after = C.filter(x => Date.parse(x.at) > Date.parse(m.at) && has.test(x.text));
    const ans = after.filter(x => x.me).map(x => (x.text.match(yn) || [])[1]).filter(Boolean).pop();
    const ag = after.filter(x => !x.me && ['envoi', 'publie', 'echec'].includes(x.type)).pop();
    const state = !ans ? 'attente' : /non/i.test(ans) ? 'refuse' : !ag ? 'accepte' : ag.type === 'envoi' ? 'test' : ag.type === 'publie' ? 'fait' : 'echec';
    const line = m.text.split('\n').map(l => l.replace(/\*\*/g, '').replace(has, '').replace(/\s*Réponds\b.*$/i, '').replace(/^[\s—–:·-]+/, '').trim()).find(l => l.length > 3) || code;
    out.push({ code, title: line.length > 90 ? line.slice(0, 88) + '…' : line, state, at: m.at, last: (ag || m).at, msg: m, note: ag && ag.type !== 'envoi' ? ag.text : null });
  }
  return out;
}
const T_STATE = { attente: ['Attend ta réponse', 'warn'], accepte: ['Accepté · à faire', 'info'], test: ['En test', 'info'], fait: ['En ligne', 'ok'], echec: ['Pas réussi', 'bad'], refuse: ['Refusé', 'mu'] };
function travauxCard() {
  const T = travaux(); if (!T.length) return h('div', { class: 'card empty' }, 'Aucun travail proposé pour l’instant. Les agents en proposeront au prochain passage, ou écris ta demande ci-dessous.');
  const row = t => { const [label, cls] = T_STATE[t.state], open = S.openT === t.code;
    return h('div', { class: 'trav' },
      h('button', { class: 'trav-h', onclick: () => { S.openT = open ? null : t.code; render(); } },
        h('span', { class: 'trav-t' }, t.title), h('span', { class: 'chip-s ' + cls }, label)),
      h('div', { class: 'trav-m' }, `${AGENT_NAMES[t.msg.agent] || 'Guardian'} · ${t.code} · ${rel(t.last)}`),
      open ? h('div', { class: 'trav-d' }, rich(t.msg.text), t.note ? [h('hr'), rich(t.note)] : null) : null,
      t.state === 'attente' ? h('div', { class: 'yn' }, h('button', { class: 'btn gold', onclick: () => sendMessage(`oui ${t.code}`) }, '✅ Oui, fais-le'), h('button', { class: 'btn', onclick: () => sendMessage(`non ${t.code}`) }, '✋ Non')) : null); };
  const grp = (title, states, max) => { const l = T.filter(t => states.includes(t.state)).sort((a, b) => Date.parse(b.last) - Date.parse(a.last)); return l.length ? [h('h2', {}, title, h('span', { class: 'count' }, l.length)), h('div', { class: 'card' }, l.slice(0, max).map(row))] : null; };
  return [grp('À décider', ['attente'], 20), grp('En cours', ['test', 'accepte', 'echec'], 20), grp('Terminés', ['fait'], 8), grp('Refusés', ['refuse'], 5)];
}

// ---------- actions directes (clé GitHub de l'utilisateur) ----------
const API_REPO = `https://api.github.com/repos/${OWNER}/${NAME}`;
async function gh(method, path, body) {
  const r = await fetch(API_REPO + path, { method, headers: ghHeaders(!!body), body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
  return r.status === 204 ? null : r.json().catch(() => null);
}
const keyHelp = e => [401, 403, 404].includes(e.status) ? 'ta clé GitHub n’a pas ce droit : recrée-la (Réglages → Gérer ma clé)' : e.status === 409 ? 'GitHub refuse : la modification doit d’abord être mise à jour par les agents' : e.message;
async function runAction(action, label) {
  if (!token()) { openTokenSheet(); return false; }
  try { await gh('POST', '/actions/workflows/guardian.yml/dispatches', { ref: 'main', inputs: { action } }); toast(label + ' : demandé ✓'); setTimeout(loadLive, 6000); return true; }
  catch (e) { toast('Impossible — ' + keyHelp(e)); return false; }
}
// modifications contrôlées mais que GitHub interdit au Guardian de publier seul (ex. ses propres règles)
async function pendingPublications() {
  const evs = ((S.data && S.data.events) || []).filter(e => e.type === 'bloque' && e.branch && Date.now() - Date.parse(e.at) < 14 * 864e5);
  const out = [];
  for (const e of evs) {
    if (out.some(x => x.branch === e.branch) || !/^[\w./-]+$/.test(e.branch)) continue;
    try { const c = await gh('GET', `/compare/main...${encodeURIComponent(e.branch)}`); if (c && c.ahead_by > 0) out.push({ branch: e.branch, at: e.at, detail: e.detail, ready: c.behind_by === 0, files: (c.files || []).length }); } catch (x) { /* branche supprimée ou déjà publiée */ }
    if (out.length >= 5) break;
  }
  return out;
}
async function publishBranch(p) {
  try { await gh('POST', '/merges', { base: 'main', head: p.branch, commit_message: `Publication validée par le propriétaire depuis l'appli Guardian (${p.branch})` }); toast('Publié ✓ Le Guardian contrôle le jeu en ligne.'); setTimeout(loadLive, 6000); return true; }
  catch (e) { toast('Publication impossible — ' + keyHelp(e)); return false; }
}
// bouton à deux appuis : le premier demande confirmation
function confirmBtn(cls, label, confirm, fn) {
  let armed = false; const b = h('button', { class: cls, onclick: async () => { if (!armed) { armed = true; b.textContent = confirm; setTimeout(() => { armed = false; b.textContent = label; }, 6000); return; } b.disabled = true; b.textContent = 'Envoi…'; const ok = await fn(); b.textContent = ok ? 'Fait ✓' : label; b.disabled = !!ok; armed = false; } }, label);
  return b;
}

function nextPass() { const d = new Date(); d.setSeconds(0, 0); if (d.getMinutes() >= AGENT_PASS_MIN) d.setHours(d.getHours() + 1); d.setMinutes(AGENT_PASS_MIN); return d; }

// texte simple → éléments (gras **x**, `code`, liens) sans jamais interpréter de HTML
function rich(text) {
  return text.split(/\n/).map((line, i) => {
    const parts = []; const re = /(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s)]+)/g; let k = 0, m;
    while ((m = re.exec(line))) {
      if (m.index > k) parts.push(line.slice(k, m.index));
      const t = m[0];
      parts.push(t.startsWith('**') ? h('b', {}, t.slice(2, -2)) : t.startsWith('`') ? h('code', {}, t.slice(1, -1)) : h('a', { href: t, target: '_blank', rel: 'noopener' }, t.replace(/^https?:\/\//, '').slice(0, 48)));
      k = m.index + t.length;
    }
    if (k < line.length) parts.push(line.slice(k));
    return [i ? h('br') : null, ...parts.map(p => typeof p === 'string' ? p.replace(/^[-*] /, '• ') : p)];
  });
}

// Réponses immédiates : calculées à partir des données réelles du Guardian (pas d'IA), clairement signalées.
function instantAnswer(kind) {
  const D = S.data && S.data.state ? S.data : null;
  if (!D) return 'Pas encore de données.';
  const st = D.state, open = D.problems.filter(p => p.status === 'ouvert'), day = Date.now() - 864e5;
  if (kind === 'etat') {
    const lc = st.lastCheck;
    return (open.filter(p => p.level === 'bloquant').length ? `⚠️ ${open.length} problème(s) ouvert(s) : ` + open.map(p => p.title).join(' · ') + '.' : '✅ MYTHORIA va bien : aucun problème bloquant.') +
      (lc ? ` Dernier contrôle ${rel(lc.at)} : ${lc.steps[0]}/${lc.steps[1]} étapes réussies (version ${lc.version || st.liveVersion}).` : '');
  }
  if (kind === 'bugs') {
    const recent = D.problems.slice(0, 6);
    return recent.length ? recent.map(p => `• ${p.title} (${p.where}) — ${p.status === 'ouvert' ? 'ouvert depuis ' + rel(p.firstSeen) : 'résolu ' + rel(p.resolvedAt)}`).join('\n') : 'Aucun problème détecté ces 60 derniers jours.';
  }
  if (kind === 'jour') {
    const ev = D.events.filter(e => Date.parse(e.at) > day && !e.quiet);
    const runs = D.runs.filter(r => Date.parse(r.at) > day);
    const ag = (S.chat || []).filter(m => !m.me && Date.parse(m.at) > day && ['rapport', 'envoi', 'publie'].includes(m.type));
    return `Ces dernières 24 h : ${runs.length} contrôles (${runs.filter(r => r.ok).length} réussis).` + (ev.length ? '\n' + ev.slice(0, 6).map(e => '• ' + e.title).join('\n') : '') +
      (ag.length ? `\nAgents : ${ag.length} message(s) de travail (voir la discussion).` : '\nAgents : pas de travail effectué ces 24 h.');
  }
  return '';
}

// ---------- écrans ----------
function statusCard(st) {
  const live = S.live && S.live[0];
  const liveEl = live ? h('div', { class: 'live' }, h('i'), live.event === 'schedule' ? 'Contrôle horaire en cours' : live.event === 'push' ? 'Contrôle d’une modification en cours' : 'Contrôle en cours', ` · démarré ${rel(live.at)}`) : null;
  if (!st) {
    return h('section', { class: 'status wait' },
      h('div', { class: 'row1' }, h('div', { class: 'big-ic', html: I.clock }), h('div', {}, h('h1', {}, 'Le Guardian démarre'), h('p', {}, 'Le premier contrôle du jeu va être enregistré. Les résultats apparaîtront ici automatiquement.'))),
      liveEl);
  }
  const open = S.data.problems.filter(p => p.status === 'ouvert' && p.level === 'bloquant').length;
  const lc = st.lastCheck, bad = st.status === 'probleme' || open > 0;
  const title = bad ? `${plural(Math.max(open, 1), 'problème')} à corriger` : lc ? 'MYTHORIA va bien' : 'En attente du premier contrôle';
  const sub = lc ? `Dernier contrôle ${rel(lc.at)} · ${lc.steps ? lc.steps[0] + '/' + lc.steps[1] + ' étapes réussies' : ''}` : 'En attente du premier contrôle du jeu publié.';
  return h('section', { class: 'status' + (bad ? ' bad' : lc ? '' : ' wait') },
    h('div', { class: 'row1' }, h('div', { class: 'big-ic', html: bad ? I.alert : lc ? I.check : I.clock }), h('div', {}, h('h1', {}, title), h('p', {}, sub))),
    liveEl,
    h('div', { class: 'facts' },
      h('span', {}, 'Version en ligne : ', h('b', {}, st.liveVersion || '—')),
      h('span', {}, 'Contrôle : ', h('b', {}, 'toutes les heures')),
      st.lastPublication ? h('span', {}, 'Dernière publication : ', h('b', {}, rel(st.lastPublication.at))) : null),
    h('div', { class: 'actions' },
      h('a', { class: 'btn gold', href: GAME, target: '_blank', rel: 'noopener' }, ic('play'), 'Ouvrir le jeu'),
      h('button', { class: 'btn', onclick: openRunSheet }, ic('bolt'), 'Commander')));
}

function screenHome() {
  const D = S.data, st = D && D.state;
  const kids = [newsCard(), statusCard(st)];
  if (!standalone()) kids.unshift(h('button', { class: 'inst-card', onclick: install }, h('span', { class: 'inst-ic', html: I.dl }), h('span', {}, h('b', {}, installEvt ? 'Installer l’application (1 appui)' : 'Installer l’application'), h('small', {}, 'Elle s’ouvrira en plein écran depuis ton écran d’accueil, comme tes autres applis.'))));
  if (st) {
    const c = st.counters || {}, open = D.problems.filter(p => p.status === 'ouvert' && p.level === 'bloquant').length;
    kids.push(h('h2', {}, 'En chiffres'),
      h('div', { class: 'kpis' },
        kpi(c.checks || 0, 'contrôles effectués', ''),
        kpi(open, 'problèmes ouverts', open ? 'bad' : 'ok'),
        kpi(c.problemsDetected || 0, 'problèmes détectés', ''),
        kpi(c.problemsResolved || 0, 'problèmes résolus', 'ok'),
        kpi(c.publications || 0, 'publications vérifiées', 'gold'),
        kpi((c.rollbacks || 0) + (c.blocked || 0), 'versions cassées stoppées', (c.rollbacks || c.blocked) ? 'gold' : '')),
      h('p', { class: 'note' }, `Chiffres réels, comptés depuis la mise en service${st.since ? ' (' + new Date(st.since).toLocaleDateString('fr-FR') + ')' : ''}. « Versions cassées stoppées » = modifications bloquées avant publication + retours arrière automatiques.`));
    const pend = S.chat ? pendingRequests() : [];
    if (pend.length) kids.splice(1, 0, h('button', { class: 'card pending', style: 'width:100%;text-align:left;margin-top:12px', onclick: () => { S.tab = 'discuter'; render(); } }, h('b', {}, `🔔 ${plural(pend.length, 'demande')} du Guardian attend${pend.length > 1 ? 'ent' : ''} ta réponse`), h('small', {}, 'Touche ici pour répondre Oui ou Non.')));
    kids.push(h('h2', {}, 'L’équipe du Guardian'), h('div', { class: 'card' }, (st.agents || []).map(agentRow)));
    if (S.report) kids.push(h('h2', {}, 'Dernier rapport quotidien'), reportCard(S.report, true));
  }
  return kids;
}
const kpi = (n, label, cls) => h('div', { class: 'kpi ' + cls }, h('b', {}, n), h('span', {}, label));
function agentRow(a) {
  if (['chef', 'reparateur', 'graphiste', 'equilibreur'].includes(a.id)) {
    const mine = (S.chat || []).filter(m => !m.me && (m.agent === a.id));
    const last = mine[mine.length - 1];
    a = { ...a, soon: false, last: last ? last.at : null, lastText: last ? (last.text.split('\n')[0].replace(/\*\*|`/g, '').slice(0, 90)) : 'Agent Claude : passe toutes les heures, rien à signaler pour l’instant' };
  }
  const recent = a.last && Date.now() - Date.parse(a.last) < 3 * 3600e3;
  const working = a.id === 'testeur' && S.live;
  const chip = a.soon ? h('span', { class: 'chip soon' }, h('i'), 'Bientôt')
    : working ? h('span', { class: 'chip wait' }, h('i'), 'Au travail')
    : a.last ? h('span', { class: 'chip ok' }, h('i'), recent || a.id !== 'testeur' ? 'Actif' : 'En attente')
    : ['chef', 'reparateur', 'graphiste', 'equilibreur'].includes(a.id) ? h('span', { class: 'chip ok' }, h('i'), 'En service')
    : h('span', { class: 'chip wait' }, h('i'), 'En attente');
  return h('div', { class: 'agent' + (a.soon ? ' soon' : '') },
    h('div', { class: 'av', html: I[AGENT_IC[a.id]] || I.shield }),
    h('div', { class: 'tx' }, h('div', { style: 'display:flex;justify-content:space-between;gap:8px;align-items:center' }, h('b', {}, a.name), chip), h('p', {}, a.role),
      a.last ? h('div', { class: 'last' }, `${a.lastText || 'Dernière action'} · ${rel(a.last)}`) : a.lastText ? h('div', { class: 'last' }, a.lastText) : null));
}

function screenProblems() {
  const D = S.data;
  if (!D || D.empty) return [h('div', { class: 'card empty' }, 'Aucune donnée pour l’instant : le premier contrôle arrive.')];
  const open = D.problems.filter(p => p.status === 'ouvert').sort((a, b) => (a.level === 'bloquant' ? 0 : 1) - (b.level === 'bloquant' ? 0 : 1));
  const done = D.problems.filter(p => p.status === 'résolu').sort((a, b) => Date.parse(b.resolvedAt) - Date.parse(a.resolvedAt));
  return [
    h('h2', {}, 'Problèmes en cours', h('span', { class: 'count' }, open.length)),
    open.length ? open.map(probCard) : h('div', { class: 'card empty', html: I.check + '<div>Aucun problème détecté sur le jeu en ligne.</div>' }),
    h('h2', {}, 'Résolus récemment', h('span', { class: 'count' }, done.length)),
    done.length ? done.slice(0, 30).map(probCard) : h('div', { class: 'card empty' }, 'Rien pour le moment.'),
    h('p', { class: 'note' }, 'Un problème est « résolu » quand il n’apparaît plus lors d’un contrôle complet du jeu en ligne.'),
  ];
}
function probCard(p) {
  const done = p.status === 'résolu';
  return h('div', { class: 'card' }, h('div', { class: 'prob' + (done ? ' done' : p.level !== 'bloquant' ? ' warn' : '') }, h('div', { class: 'dot' }),
    h('div', { style: 'min-width:0' }, h('b', {}, p.title), h('div', { class: 'where' }, (p.level === 'bloquant' ? 'Bloquant' : 'À surveiller') + ' · ' + p.where), h('div', { class: 'det' }, p.detail),
      h('div', { class: 'meta' }, done ? `Détecté ${rel(p.firstSeen)} · résolu ${rel(p.resolvedAt)}` : `Détecté ${rel(p.firstSeen)} · revu ${plural(p.seenCount, 'fois', 'fois')} · dernier ${rel(p.lastSeen)}`,
        p.url ? [' · ', h('a', { href: p.url, target: '_blank', rel: 'noopener' }, 'détails')] : null),
      proofShot(p))));
}
// Preuve visuelle : capture prise par le Guardian au moment de l'échec (champ « shot » du problème = fichier de shots/).
function proofShot(p) {
  if (typeof p.shot !== 'string' || !/^[\w.-]+\.(jpg|png|webp)$/i.test(p.shot)) return null;
  const src = DATA + 'shots/' + p.shot + '?t=' + (Date.parse(p.lastSeen) || 0), label = 'Écran au moment du problème';
  const b = h('button', { class: 'proof', onclick: () => view(src, label) },
    h('img', { src, alt: label, loading: 'lazy', onerror: () => b.remove() }), h('span', {}, ic('ext'), label));
  return b;
}

function screenCheck() {
  const st = S.data && S.data.state, lc = st && st.lastCheck;
  if (!lc) return [h('div', { class: 'card empty' }, 'Le premier contrôle du jeu en ligne n’est pas encore enregistré.')];
  const devs = lc.devices || [], dev = devs.find(d => d.id === S.dev) || devs[0];
  const shots = dev ? dev.steps.flatMap(s => (s.shots || []).map(f => ({ f, label: shotLabel(f) }))) : [];
  const m = (dev && dev.metrics) || {};
  return [
    h('div', { class: 'card' }, h('b', {}, `Contrôle ${lc.quick ? 'rapide' : 'complet'} · ${rel(lc.at)}`),
      h('p', { class: 'muted small', style: 'margin:4px 0 0' }, `${lc.trigger || ''} · version ${lc.version || '?'} · durée ${Math.round((lc.durationS || 0) / 60)} min${lc.tests ? ' · tests du code ' + lc.tests[0] + '/' + lc.tests[1] : ''}`),
      lc.url ? h('a', { class: 'btn full', style: 'margin-top:10px', href: lc.url, target: '_blank', rel: 'noopener' }, ic('ext'), 'Rapport complet sur GitHub') : null),
    h('h2', {}, 'Parcours joué par le Testeur'),
    h('div', { class: 'dev-tabs' }, devs.map(d => h('button', { class: d.id === dev.id ? 'on' : '', onclick: () => { S.dev = d.id; render(); } }, DEV_NAMES[d.id] || d.label || d.id))),
    h('div', { class: 'card' }, dev.steps.map(s => h('div', { class: 'step' },
      h('div', { class: 'si ' + (s.ok ? (s.warn ? 'warn' : 'ok') : 'bad') }, s.ok ? (s.warn ? '!' : '✓') : '✕'),
      h('div', { style: 'min-width:0' }, h('b', {}, s.name), h('span', { class: 't' }, (s.ms / 1000).toFixed(1) + ' s'), s.notes && s.notes.length ? h('p', {}, s.notes.join(' ')) : null)))),
    m.loadMs ? h('p', { class: 'note' }, `Chargement mesuré : ${(m.loadMs / 1000).toFixed(1)} s. Les tests tournent sur un serveur sans carte graphique : les FPS affichés y sont bien plus bas que sur un vrai téléphone ; ils servent à repérer un effondrement.`) : null,
    shots.length ? [h('h2', {}, 'Captures d’écran', h('span', { class: 'count' }, shots.length)),
      h('div', { class: 'shots' + (dev.id === 'ordinateur' || dev.id === 'paysage' ? ' wide' : '') }, shots.map(s => h('button', { class: 'shot', onclick: () => view(DATA + 'shots/' + s.f, s.label) },
        h('img', { src: DATA + 'shots/' + s.f + '?t=' + Date.parse(st.shotsAt || lc.at), alt: s.label, loading: 'lazy' }), h('span', {}, s.label))))] : null,
    lc.static && lc.static.length ? [h('h2', {}, 'Vérifications du code'), h('div', { class: 'card' }, lc.static.map(c => h('div', { class: 'step' }, h('div', { class: 'si ' + (c.ok ? 'ok' : 'bad') }, c.ok ? '✓' : '✕'), h('div', {}, h('b', {}, c.name), c.ok ? null : h('p', {}, c.detail)))))] : null,
  ];
}

const SHOT_NAMES = { bienvenue: 'Bienvenue (nom)', recompense: 'Récompense', battle: 'Accueil', 'battle-histoire': 'Accueil · histoire', heroes: 'Héros', shop: 'Boutique', kingdom: 'Royaume', 'kingdom-histoire': 'Royaume · histoire', clan: 'Clan', combat: 'Combat', resultat: 'Résultat du combat', heros: 'Mode Héros' };
const shotLabel = f => { const k = f.replace(/^[a-z]+-/, '').replace(/\.jpg$/, ''); return SHOT_NAMES[k] || (/^erreur-/.test(k) ? 'Écran au moment de l’échec' : k); };
const DEV_NAMES = { telephone: '📱 Téléphone', ordinateur: '💻 Ordinateur', guardian: '🛡️ Appli', fold: '📱 Fold plié', mini: '📱 Très petit', paysage: '📱 Couché', bots: '🤖 Bots' };

function screenChat() {
  if (S.chat === null) { setTimeout(loadChat, 0); return [h('div', { class: 'card empty' }, 'Chargement de la discussion…')]; }
  const C = S.chat, pend = pendingRequests(), np = nextPass();
  const lastAgent = [...C].reverse().find(m => !m.me), lastMe = [...C].reverse().find(m => m.me);
  const waiting = lastMe && (!lastAgent || Date.parse(lastMe.at) > Date.parse(lastAgent.at));
  const input = h('textarea', { class: 'chat-in', rows: 2, placeholder: 'Écris au Guardian… (ex. « Vérifie les performances du jeu »)', oninput: e => store.set('draft', e.target.value) });
  input.value = store.get('draft', '');
  const send = async () => { if (await sendMessage(input.value)) { input.value = ''; } };
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); });
  const quick = (label, fn) => h('button', { class: 'qchip', onclick: fn }, label);
  const answer = h('div');
  const showAnswer = (q, kind) => answer.replaceChildren(h('div', { class: 'msg bot instant' }, h('div', { class: 'who' }, '⚡ Réponse immédiate', h('span', {}, ' · tirée des données réelles du Guardian, sans IA')), h('div', { class: 'bubble' }, h('b', {}, q), h('br'), rich(instantAnswer(kind)))));
  return [
    h('div', { class: 'card chat-info' }, ic('chat'), h('div', {}, h('b', {}, 'Les agents travaillent en continu'),
      h('small', {}, `Ils enchaînent les travaux que tu as acceptés, un par passage (prochain vers ${hm(np)}), et te préviennent à chaque travail terminé. Rien ne change dans le jeu sans ton « Oui » (sauf la correction des bugs).`))),
    h('div', { class: 'seg' }, [['travaux', `Travaux${pend.length ? ' (' + pend.length + ')' : ''}`], ['messages', 'Messages']].map(([id, label]) => h('button', { class: (S.chatView || 'travaux') === id ? 'on' : '', onclick: () => { S.chatView = id; render(); } }, label))),
    (S.chatView || 'travaux') === 'travaux' ? travauxCard() : null,
    (S.chatView || 'travaux') === 'messages' ? h('div', { class: 'chat' }, C.length ? C.slice(-80).map(m => msgEl(m, pend)) : h('div', { class: 'empty' }, 'Aucun message pour l’instant. Écris ta première demande ci-dessous !')) : null,
    waiting ? h('div', { class: 'msg bot wait' }, h('div', { class: 'bubble' }, `⏳ Message reçu, les agents sont prévenus. Réponse d’ici quelques minutes (au plus tard au passage de ${hm(np)}).`)) : null,
    answer,
    (S.chatView || 'travaux') === 'travaux' ? h('h2', {}, 'Demander un travail') : null,
    h('div', { class: 'quick' },
      quick('Comment va MYTHORIA ?', () => showAnswer('Comment va MYTHORIA ?', 'etat')),
      quick('Quels bugs as-tu trouvés ?', () => showAnswer('Quels bugs as-tu trouvés ?', 'bugs')),
      quick('Qu’as-tu fait aujourd’hui ?', () => showAnswer('Qu’as-tu fait aujourd’hui ?', 'jour')),
      quick('Fais une analyse complète', () => { input.value = 'Fais une analyse complète du jeu (bugs, performances, graphismes, équilibrage) et dis-moi ce que tu as trouvé.'; input.focus(); }),
      quick('Vérifie les performances', () => { input.value = 'Vérifie les performances du jeu (chargement, fluidité en combat) et corrige ce qui ralentit.'; input.focus(); }),
      quick('Améliore les personnages', () => { input.value = 'Améliore les graphismes des personnages : propose-moi ce qui peut être fait.'; input.focus(); })),
    token() ? h('div', { class: 'composer' }, input, h('button', { class: 'btn gold send', 'aria-label': 'Envoyer', disabled: S.sending, onclick: send, html: I.send }))
      : h('div', { class: 'card' }, h('b', {}, 'Pour écrire au Guardian depuis l’appli'), h('p', { class: 'muted small' }, 'Une seule fois : crée une clé GitHub qui permet à l’appli d’envoyer tes messages (2 minutes, gratuit).'),
        h('button', { class: 'btn gold full', onclick: openTokenSheet }, ic('key'), 'Créer ma clé et l’ajouter'),
        h('a', { class: 'btn full', style: 'margin-top:8px', href: CHAT_URL, target: '_blank', rel: 'noopener' }, ic('ext'), 'Ou écrire directement sur GitHub')),
    S.chatErr ? h('p', { class: 'note' }, 'Discussion pas à jour : ' + S.chatErr) : null,
  ];
}
function msgEl(m, pend) {
  const pd = pend.find(d => d.id === m.id);
  const tag = { demande: 'Demande d’autorisation', envoi: 'Correction envoyée (en test)', publie: 'Correction publiée', echec: 'Problème rencontré', rapport: 'Rapport', reponse: '' }[m.type] || '';
  return h('div', { class: 'msg ' + (m.me ? 'me' : 'bot t-' + m.type) },
    m.me ? null : h('div', { class: 'who' }, h('span', { class: 'av-s', html: I[AGENT_IC[m.agent]] || I.shield }), AGENT_NAMES[m.agent] || 'Guardian', tag ? h('span', { class: 'tag' }, tag) : null),
    h('div', { class: 'bubble' }, rich(m.text)),
    pd ? h('div', { class: 'yn' }, h('button', { class: 'btn gold', onclick: () => sendMessage(`oui ${pd.code}`) }, '✅ Oui, fais-le'), h('button', { class: 'btn', onclick: () => sendMessage(`non ${pd.code}`) }, '✋ Non')) : null,
    h('div', { class: 'when' }, rel(m.at)));
}
function openTokenSheet() {
  const desc = encodeURIComponent('Appli MYTHORIA Guardian : discussion, contrôles, publication');
  const link = `https://github.com/settings/personal-access-tokens/new?name=${encodeURIComponent('MYTHORIA Guardian appli')}&description=${desc}&target_name=${OWNER}&expires_in=366&issues=write&actions=write&contents=write&workflows=write`;
  const inp = h('input', { class: 'inp', type: 'password', placeholder: 'Colle ta clé ici (github_pat_…)', autocomplete: 'off' });
  const msg = h('p', { class: 'small' });
  let close = null;
  const save = async () => {
    const t = inp.value.trim(); if (!t) return;
    msg.textContent = 'Vérification…';
    try { const login = await checkToken(t); store.set('token', t); S.me = login; msg.textContent = '✅ Clé valable (' + login + ').'; toast('Clé enregistrée sur ce téléphone ✓'); setTimeout(() => { close && close(); render(); loadChat(); }, 700); }
    catch (e) { msg.textContent = '❌ ' + e.message; }
  };
  close = sheet(h('h3', {}, '🔑 Ta clé pour commander le Guardian'),
    h('p', {}, 'Elle permet à l’appli d’écrire aux agents, de lancer un contrôle, de publier une modification en attente et de revenir en arrière — uniquement sur le dépôt du jeu. Elle reste sur ce téléphone : ne la donne à personne.'),
    h('ol', {},
      h('li', {}, 'Touche « Ouvrir GitHub » (connecte-toi si besoin).'),
      h('li', {}, 'Vérifie : ', h('b', {}, 'Repository access → Only select repositories → mythoria-game'), '.'),
      h('li', {}, 'Dans ', h('b', {}, 'Permissions → Repository permissions'), ', mets sur ', h('b', {}, 'Read and write'), ' : ', h('b', {}, 'Issues'), ' (discussion), ', h('b', {}, 'Actions'), ' (lancer un contrôle), ', h('b', {}, 'Contents'), ' et ', h('b', {}, 'Workflows'), ' (publier). Le lien les coche déjà.'),
      h('li', {}, 'Touche ', h('b', {}, 'Generate token'), ', puis copie la clé (elle commence par github_pat_).'),
      h('li', {}, 'Reviens ici, colle-la et touche « Enregistrer ».')),
    h('a', { class: 'btn full', href: link, target: '_blank', rel: 'noopener' }, ic('ext'), 'Ouvrir GitHub'),
    h('div', { style: 'display:flex;gap:8px;margin-top:12px' }, inp, h('button', { class: 'btn gold', onclick: save }, 'Enregistrer')), msg,
    token() ? h('button', { class: 'btn full', style: 'margin-top:8px', onclick: () => { store.set('token', ''); S.me = null; close(); render(); toast('Clé retirée de ce téléphone'); } }, 'Retirer la clé de ce téléphone') : null);
}

function screenHistory() {
  const D = S.data;
  if (!D || D.empty) return [h('div', { class: 'card empty' }, 'L’historique commencera au premier contrôle.')];
  const evs = D.events.filter(e => S.quiet || !e.quiet);
  const groups = []; let cur = null;
  for (const e of evs.slice(0, 200)) { const k = new Date(e.at).toDateString(); if (!cur || cur.k !== k) groups.push(cur = { k, at: e.at, list: [] }); cur.list.push(e); }
  return [
    updatesCard(),
    D.state.lastReport ? h('button', { class: 'list-btn', onclick: openReports }, h('span', {}, ic('report'), ' Rapports quotidiens'), h('span', { class: 'muted' }, '›')) : null,
    h('h2', {}, 'Journal'),
    h('div', { class: 'toggle' }, h('span', {}, 'Afficher aussi les contrôles réussis (toutes les heures)'), h('button', { class: 'sw' + (S.quiet ? ' on' : ''), 'aria-label': 'afficher les contrôles réussis', onclick: () => { S.quiet = !S.quiet; store.set('quiet', S.quiet); render(); } })),
    evs.length ? h('div', { class: 'tl' }, groups.map(g => [h('div', { class: 'day-h' }, dayLabel(g.at)), g.list.map(e => h('div', { class: 'ev ' + e.type },
      h('b', {}, e.title), e.detail ? h('p', {}, e.detail) : null, h('div', { class: 'when' }, hm(new Date(e.at)), e.url ? [' · ', h('a', { href: e.url, target: '_blank', rel: 'noopener' }, 'détails')] : null)))]))
      : h('div', { class: 'card empty' }, 'Rien d’important pour l’instant. Active l’interrupteur pour voir chaque contrôle.'),
  ];
}

function reportCard(r, short) {
  return h('div', { class: 'card rep' },
    h('h3', {}, 'Rapport du ' + new Date(r.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })),
    h('div', { class: 'muted small' }, `Sur les 24 h précédant ${hm(new Date(r.at))} · version ${r.version || '?'}`),
    h('div', { class: 'grid' }, h('div', {}, h('b', {}, r.liveChecks), h('span', {}, 'contrôles du jeu')), h('div', {}, h('b', {}, r.liveOk), h('span', {}, 'réussis')), h('div', {}, h('b', {}, r.publications), h('span', {}, 'publications'))),
    h('ul', {},
      h('li', {}, `Problèmes détectés : ${r.detected.length}${r.detected.length ? ' — ' + r.detected.join(' · ') : ''}`),
      h('li', {}, `Problèmes résolus : ${r.resolved.length}${r.resolved.length ? ' — ' + r.resolved.join(' · ') : ''}`),
      h('li', {}, `Encore ouverts : ${r.open.length}${r.open.length ? ' — ' + r.open.map(p => p.title).join(' · ') : ''}`),
      r.rollbacks ? h('li', {}, `Retours arrière automatiques : ${r.rollbacks}`) : null,
      r.blocked ? h('li', {}, `Modifications bloquées avant publication : ${r.blocked}`) : null,
      r.trialChecks ? h('li', {}, `Modifications contrôlées avant publication : ${r.trialChecks}`) : null,
      r.loadPhoneS ? h('li', {}, `Chargement sur téléphone (test) : ${r.loadPhoneS} s en moyenne`) : null),
    short ? null : [h('b', { style: 'display:block;margin-top:10px' }, 'Pour la suite'), h('ul', {}, (r.next || []).map(n => h('li', {}, n)))]);
}

// ---------- fenêtres ----------
function sheet(...content) {
  const back = h('div', { class: 'sheet-back', onclick: e => { if (e.target === back) close(); } });
  const close = () => { back.classList.remove('on'); setTimeout(() => back.remove(), 220); };
  back.append(h('div', { class: 'sheet', role: 'dialog' }, h('div', { class: 'grip' }), content, h('button', { class: 'btn full', style: 'margin-top:14px', onclick: close }, 'Fermer')));
  document.body.append(back); requestAnimationFrame(() => back.classList.add('on'));
  return close;
}
function view(src, label) {
  const v = h('div', { class: 'viewer', onclick: () => v.remove() }, h('img', { src, alt: label }), h('p', {}, label + ' · toucher pour fermer'));
  document.body.append(v);
}
function openRunSheet() {
  const st = (S.data && S.data.state) || {}, lp = st.lastPublication;
  if (!token()) return sheet(h('h3', {}, 'Commander le Guardian'),
    h('p', {}, 'Pour lancer un contrôle, publier ou revenir en arrière directement d’ici, l’appli a besoin de ta clé GitHub (une seule fois).'),
    h('button', { class: 'btn gold full', onclick: openTokenSheet }, ic('key'), 'Ajouter ma clé GitHub'),
    h('a', { class: 'btn full', style: 'margin-top:8px', href: ACTIONS, target: '_blank', rel: 'noopener' }, ic('ext'), 'Ou passer par GitHub'));
  const pubs = h('div', {}, h('p', { class: 'muted small' }, 'Recherche…'));
  let close = null;
  const act = (action, label, text) => h('button', { class: 'list-btn', onclick: async () => { if (await runAction(action, label)) close && close(); } }, h('span', {}, h('b', {}, label), h('br'), h('small', { class: 'muted' }, text)), h('span', { class: 'muted' }, '›'));
  close = sheet(h('h3', {}, 'Commander le Guardian'),
    h('p', {}, 'Le jeu est déjà contrôlé toutes les heures et après chaque modification. Tu peux aussi agir tout de suite :'),
    act('controle complet', 'Contrôle complet', 'Tous les écrans, un combat, les 6 bots · 15 à 20 min'),
    act('controle rapide', 'Contrôle rapide', 'Sans combat ni Mode Héros · environ 8 min'),
    act('rapport du jour', 'Rapport du jour', 'Écrit et envoie le rapport maintenant'),
    h('h3', { style: 'margin-top:20px' }, 'Publications en attente de ton accord'), pubs,
    h('h3', { style: 'margin-top:20px' }, 'Revenir à la version précédente'),
    lp && lp.prev ? [h('p', {}, `Retire la version ${lp.version} (publiée ${rel(lp.at)}) et remet celle d’avant. À utiliser si la dernière mise à jour ne te plaît pas.`),
      confirmBtn('btn full', '↩️ Revenir à la version précédente', 'Appuie encore pour confirmer le retour arrière', () => runAction('retour arriere', 'Retour arrière'))]
      : h('p', { class: 'muted small' }, 'Disponible après la prochaine publication (le Guardian note alors la version d’avant).'));
  pendingPublications().then(L => pubs.replaceChildren(...(L.length ? L.map(p => h('div', { class: 'trav' },
    h('div', { class: 'trav-t' }, 'Modification contrôlée, pas encore en ligne'), h('div', { class: 'trav-m' }, `${p.branch} · ${rel(p.at)} · ${plural(p.files, 'fichier')}`), h('div', { class: 'trav-d' }, p.detail),
    p.ready ? confirmBtn('btn gold full', '🚀 Publier cette modification', 'Appuie encore pour confirmer la publication', () => publishBranch(p)) : h('p', { class: 'muted small' }, 'Pas publiable telle quelle : les agents doivent d’abord la mettre à jour.')))
    : [h('p', { class: 'muted small' }, 'Aucune. Le Guardian publie seul tout ce qui passe ses contrôles.')])));
}
async function openReports() {
  const idx = (await getJSON('reports/index.json').catch(() => null)) || [];
  const box = h('div', {});
  const show = async d => { box.replaceChildren(h('p', { class: 'muted' }, 'Chargement…')); const r = await getJSON(`reports/${d}.json`).catch(() => null); box.replaceChildren(r ? reportCard(r, false) : h('p', {}, 'Rapport introuvable.')); };
  sheet(h('h3', {}, 'Rapports quotidiens'), h('p', {}, 'Un rapport est écrit chaque soir vers 19 h 45 à partir des contrôles réellement effectués.'),
    idx.map(d => h('button', { class: 'list-btn', onclick: () => show(d) }, h('span', {}, new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })), h('span', { class: 'muted' }, '›'))), box);
  if (idx[0]) show(idx[0]);
}
function openSettings() {
  const topic = (S.data && S.data.state && S.data.state.ntfyTopic) || 'mythoria-guardian-3c7943c185c1';
  sheet(h('h3', {}, 'Notifications sur ton téléphone'),
    h('p', {}, 'Le Guardian te prévient quand c’est important : nouveau problème, problème résolu, nouvelle version publiée, retour arrière, modification bloquée, et le rapport du soir. Gratuit, sans compte.'),
    h('ol', {}, h('li', {}, 'Installe l’application gratuite « ntfy » (Play Store).'), h('li', {}, 'Touche « S’abonner » ci-dessous : ntfy s’ouvre et propose l’abonnement. Sinon, dans ntfy : bouton +, puis tape le nom ', h('code', {}, topic), '.')),
    h('div', { class: 'actions' }, h('a', { class: 'btn', href: 'https://play.google.com/store/apps/details?id=io.heckel.ntfy', target: '_blank', rel: 'noopener' }, ic('dl'), 'Installer ntfy'), h('a', { class: 'btn gold', href: `ntfy://ntfy.sh/${topic}` }, ic('bell'), 'S’abonner')),
    h('h3', { style: 'margin-top:20px' }, 'Discussion avec le Guardian'),
    token() ? h('p', {}, '✅ Ta clé GitHub est enregistrée : tu peux écrire au Guardian depuis l’onglet Discuter.') : h('p', {}, 'Pour écrire au Guardian depuis l’appli, ajoute ta clé GitHub (une seule fois).'),
    h('button', { class: 'btn full', onclick: openTokenSheet }, ic('key'), token() ? 'Gérer ma clé' : 'Ajouter ma clé GitHub'),
    h('h3', { style: 'margin-top:20px' }, 'Application'),
    standalone() ? h('p', {}, '✅ L’application est installée et s’ouvre en plein écran.') : h('button', { class: 'btn gold full', onclick: install }, ic('dl'), 'Installer MYTHORIA Guardian'),
    h('div', { class: 'actions' }, h('a', { class: 'btn', href: GAME, target: '_blank', rel: 'noopener' }, ic('play'), 'Le jeu'), h('a', { class: 'btn', href: ACTIONS, target: '_blank', rel: 'noopener' }, ic('ext'), 'GitHub')),
    h('h3', { style: 'margin-top:20px' }, 'Ce que fait le Guardian aujourd’hui'),
    h('p', {}, 'Actif : contrôle complet du jeu toutes les heures (téléphone + ordinateur), publication protégée, retour arrière automatique, historique, rapport quotidien, notifications. 6 bots de contrôle (couleurs, lisibilité, performances, équilibrage, anti-triche, écrans extrêmes) et un Watchdog qui surveille le Guardian. Agents Claude (chef, réparateur, graphiste, équilibreur) : ils enchaînent les travaux que tu acceptes dans l’onglet Discuter, un passage par heure et une grande session chaque nuit. Tout est gratuit : GitHub (dépôt public) et ntfy ; les agents Claude utilisent ton abonnement Max existant.'),
    h('p', { class: 'note' }, `Version de l’appli : ${APP_VERSION} · Données : ${DATA.replace('https://', '')} · mises à jour ${S.at ? rel(new Date(S.at).toISOString()) : '—'}`));
}

// ---------- installation ----------
// Même fonctionnement que tes autres jeux : bouton vert « Installer », 1 appui quand Chrome le permet,
// sinon explications adaptées au navigateur.
let installEvt = null;
const standalone = () => ['standalone', 'fullscreen', 'minimal-ui'].some(m => matchMedia(`(display-mode: ${m})`).matches) || navigator.standalone === true;
function browser() {
  const u = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(u) || (/Macintosh/.test(u) && 'ontouchend' in document)) return 'ios';
  if (/SamsungBrowser/.test(u)) return 'samsung';
  if (/MiuiBrowser|XiaoMi|HuaweiBrowser/.test(u)) return 'mi';
  if (/Firefox|FxiOS/.test(u)) return 'firefox';
  if (/EdgA|Edg\//.test(u)) return 'edge';
  if (/OPR\/|Opera/.test(u)) return 'opera';
  if (/Chrome/.test(u)) return 'chrome';
  return 'autre';
}
const BNAME = { ios: 'Safari', samsung: 'Samsung Internet', mi: 'le navigateur de ton téléphone', firefox: 'Firefox', edge: 'Edge', opera: 'Opera', chrome: 'Chrome', autre: 'ton navigateur' };
const BSTEPS = {
  chrome: ['Appuie sur ⋮ en haut à droite.', 'Choisis « Installer l’application ».', 'Appuie sur « Installer ».'],
  ios: ['Appuie sur Partager ⬆️ en bas de l’écran.', 'Choisis « Sur l’écran d’accueil ».', 'Appuie sur Ajouter.'],
  samsung: ['Appuie sur l’icône ⬇️ Installer dans la barre d’adresse.', 'Sinon : ☰ Menu → « Ajouter la page à » → « Écran d’accueil ».'],
  firefox: ['Appuie sur ⋮.', 'Choisis « Installer ».'], edge: ['Appuie sur ⋯ en bas.', 'Choisis « Ajouter au téléphone ».'],
  opera: ['Appuie sur ⋮.', 'Choisis « Ajouter à… » → « Écran d’accueil ».'], mi: ['Ouvre plutôt cette page dans Chrome (bouton ci-dessous) : l’installation s’y fait en un appui.'],
  autre: ['Ouvre le menu du navigateur (☰ ou ⋮).', 'Choisis « Installer » ou « Ajouter à l’écran d’accueil ».'],
};
let pill = null;
function paintPill() {
  if (!pill) { pill = h('div', { id: 'inst' }, h('span', { onclick: install }, ''), h('button', { 'aria-label': 'Fermer', onclick: () => { pill.classList.remove('on'); store.set('noinst', Date.now()); } }, '✕')); document.body.append(pill); }
  pill.firstChild.textContent = installEvt ? '📲 Installer l’appli (1 appui)' : '📲 Installer l’appli';
  const hidden = Date.now() - (store.get('noinst', 0) || 0) < 864e5;
  pill.classList.toggle('on', !standalone() && !hidden);
}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; store.set('noinst', 0); paintPill(); render(); });
addEventListener('appinstalled', () => { installEvt = null; paintPill(); render(); toast('📲 MYTHORIA Guardian est installé sur ton écran d’accueil !'); });
async function install() {
  if (installEvt) { const e = installEvt; installEvt = null; e.prompt(); try { await e.userChoice; } catch (x) {} paintPill(); render(); return; }
  const b = browser(), android = /Android/i.test(navigator.userAgent);
  sheet(h('h3', {}, '📲 Installer MYTHORIA Guardian'),
    h('p', {}, 'Tu utilises ', h('b', {}, BNAME[b]), '. Voici comment faire :'),
    h('ol', {}, BSTEPS[b].map(t => h('li', {}, t))),
    android && b !== 'chrome' ? h('a', { class: 'btn gold full', href: 'intent://' + location.host + location.pathname + '#Intent;scheme=https;package=com.android.chrome;end' }, '🌐 Ouvrir dans Chrome') : null,
    h('p', {}, 'Une fois installée, l’appli s’ouvre en plein écran depuis ton écran d’accueil, comme tes autres applis, et se met à jour toute seule.'),
    h('p', { class: 'note' }, 'Si tu avais déjà un raccourci « MYTHORIA Guardian » qui s’ouvre avec la barre d’adresse, supprime-le de ton écran d’accueil (appui long → Supprimer).'));
}
function toast(t) { const el = h('div', { class: 'toast' }, t); document.body.append(el); setTimeout(() => el.remove(), 3500); }

// ---------- squelette ----------
const TABS = [['accueil', 'home', 'Accueil'], ['discuter', 'chat', 'Discuter'], ['problemes', 'bug', 'Problèmes'], ['controle', 'eye', 'Contrôle'], ['historique', 'list', 'Historique']];
const SCREENS = { discuter: screenChat, accueil: screenHome, problemes: screenProblems, controle: screenCheck, historique: screenHistory };
let topEl = null;
function paintTop() {
  if (!topEl) return;
  const btn = topEl.querySelector('.refresh'); if (btn) btn.classList.toggle('spin', S.loading);
  const sub = topEl.querySelector('.brand small');
  if (sub) sub.textContent = S.live ? 'Contrôle en cours…' : S.at ? `Mis à jour ${rel(new Date(S.at).toISOString())}` : 'Chargement…';
}
let renderLater = false;
function render() {
  // ne jamais redessiner pendant que tu écris un message (sinon le texte et le clavier disparaissent)
  const ae = document.activeElement;
  if (ae && ae.classList && ae.classList.contains('chat-in')) {
    if (!renderLater) { renderLater = true; ae.addEventListener('blur', () => { renderLater = false; setTimeout(render, 50); }, { once: true }); }
    return;
  }
  const app = document.getElementById('app');
  const openCount = S.data && S.data.problems ? S.data.problems.filter(p => p.status === 'ouvert' && p.level === 'bloquant').length : 0;
  topEl = h('header', { class: 'top' },
    h('img', { src: 'icons/icon.svg', alt: '' }),
    h('div', { class: 'brand' }, h('b', {}, 'MYTHORIA Guardian'), h('small', {}, '')),
    h('button', { class: 'icon-btn refresh', 'aria-label': 'Actualiser', html: I.refresh, onclick: () => { loadData(); loadLive(); } }),
    h('button', { class: 'icon-btn', 'aria-label': 'Réglages', html: I.gear, onclick: openSettings }));
  const main = h('main', {}, S.offline ? h('div', { class: 'offline' }, 'Hors ligne : affichage des dernières données reçues.') : null,
    S.data ? h('div', { class: 'screen' }, SCREENS[S.tab]()) : h('div', { class: 'boot', style: 'min-height:50vh' }, 'Chargement des données…'));
  const nav = h('nav', { class: 'nav' }, h('div', {}, TABS.map(([id, icn, label]) => h('button', { class: S.tab === id ? 'on' : '', onclick: () => { S.tab = id; store.set('tab', id); render(); scrollTo(0, 0); } },
    h('span', { html: I[icn], style: 'display:contents' }), label, id === 'problemes' && openCount ? h('span', { class: 'badge' }, openCount) : null))));
  app.replaceChildren(topEl, main, nav);
  paintTop(); paintPill();
}

// ---------- démarrage ----------
const cached = store.get('cache', null);
if (cached) { S.data = cached.data; S.report = cached.report; S.at = cached.at; }
render();
loadData(); loadLive();
setInterval(() => { if (!document.hidden) loadData(); }, 60000);
setInterval(() => { if (!document.hidden) loadLive(); }, token() ? 60000 : 180000);
loadChat();
setInterval(() => { if (!document.hidden && (S.tab === 'discuter' || S.tab === 'accueil')) loadChat(); }, token() ? 30000 : 120000);
setInterval(paintTop, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - S.at > 30000) { loadData(); loadLive(); } });
if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

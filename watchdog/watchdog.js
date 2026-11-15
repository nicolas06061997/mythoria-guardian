// MYTHORIA — Watchdog : le chien de garde qui surveille le Guardian.
// Totalement indépendant du Guardian (aucun fichier partagé). Un seul fichier, deux façons de le faire tourner :
//   • Cloudflare Worker (recommandé, vraiment « ailleurs ») : coller ce fichier, déclencheur Cron « */3 * * * * ».
//   • Node 18+ : `node watchdog/watchdog.js` (c'est ce que fait .github/workflows/watchdog.yml toutes les 15 min).
// Il vérifie :
//   1. le tableau de bord Guardian répond « 200 OK » ;
//   2. le jeu répond « 200 OK » ;
//   3. le Guardian est vivant : son dernier contrôle enregistré (state.json) a moins de MAX_AGE_MIN minutes.
// En cas de panne : notification ntfy + webhook Discord (si le secret DISCORD_WEBHOOK est fourni).
const CONFIG = {
  dashboard: 'https://nicolas06061997.github.io/mythoria-guardian/',
  game: 'https://nicolas06061997.github.io/mythoria-game/version.json',
  state: 'https://raw.githubusercontent.com/nicolas06061997/mythoria-game/guardian-data/state.json',
  ntfyTopic: 'mythoria-guardian-3c7943c185c1',
  maxAgeMin: 150,   // contrôle horaire + sa durée + les retards habituels de GitHub
  repeatMin: 180,   // pendant une panne : un rappel toutes les 3 h au plus
  timeoutMs: 15000,
};

async function get(url) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), CONFIG.timeoutMs);
  try { return await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now(), { signal: ctl.signal, redirect: 'follow', headers: { 'cache-control': 'no-cache', 'user-agent': 'mythoria-watchdog' } }); }
  finally { clearTimeout(t); }
}
// deux essais avant de parler de panne (une coupure d'une seconde n'est pas une crise)
async function probe(name, url, test) {
  let why = '';
  for (let i = 0; i < 2; i++) {
    try { const r = await get(url); if (r.status !== 200) why = 'HTTP ' + r.status; else { why = (await test(r)) || ''; if (!why) return null; } }
    catch (e) { why = e.name === 'AbortError' ? 'pas de réponse en ' + CONFIG.timeoutMs / 1000 + ' s' : String(e.message || e); }
    if (i === 0) await new Promise(r => setTimeout(r, 4000));
  }
  return { name, url, why };
}

export async function check(now = Date.now()) {
  const fails = (await Promise.all([
    probe('Le tableau de bord Guardian ne répond plus', CONFIG.dashboard, async r => (/MYTHORIA/i.test(await r.text()) ? null : 'page inattendue')),
    probe('Le jeu MYTHORIA ne répond plus', CONFIG.game, async r => { try { return (await r.json()).v ? null : 'version.json sans version'; } catch (e) { return 'version.json illisible'; } }),
    probe('Le Guardian ne contrôle plus le jeu', CONFIG.state, async r => {
      let s; try { s = await r.json(); } catch (e) { return 'state.json illisible'; }
      const age = Math.round((now - Date.parse(s.updatedAt)) / 60000);
      if (!(age >= 0)) return 'date du dernier contrôle illisible';
      return age > CONFIG.maxAgeMin ? `dernier signe de vie il y a ${Math.floor(age / 60)} h ${age % 60} min (maximum prévu : ${CONFIG.maxAgeMin} min)` : null;
    }),
  ])).filter(Boolean);
  return { ok: !fails.length, at: new Date(now).toISOString(), fails };
}

export function payloads(res) {
  const title = '🚨 Watchdog MYTHORIA : ' + (res.fails.length === 1 ? res.fails[0].name : res.fails.length + ' pannes détectées');
  const message = res.fails.map(f => `• ${f.name} — ${f.why}`).join('\n');
  return {
    ntfy: { topic: CONFIG.ntfyTopic, title, message, priority: 5, tags: ['rotating_light'], click: CONFIG.dashboard },
    discord: { username: 'MYTHORIA Watchdog', content: '🚨 **Urgence MYTHORIA**', allowed_mentions: { parse: [] },
      embeds: [{ title: title.slice(0, 250), description: message.slice(0, 3500), url: CONFIG.dashboard, color: 0xff4f5e, timestamp: res.at, fields: res.fails.map(f => ({ name: f.name.slice(0, 250), value: f.url })) }] },
  };
}

async function send(res, env) {
  const p = payloads(res), post = (url, body) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.status, e => String(e.message));
  const out = { ntfy: await post('https://ntfy.sh/', p.ntfy) };
  const hook = env && env.DISCORD_WEBHOOK;
  if (hook && /^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//.test(hook)) out.discord = await post(hook, p.discord);
  return out;
}

// Mémoire courte pour ne pas répéter la même alerte toutes les 3 minutes pendant une panne.
// Cloudflare : cache du Worker (aucun réglage). Ailleurs : `remember` fourni par l'appelant, sinon on envoie.
async function alreadySent(key) {
  if (typeof caches === 'undefined' || !caches.default) return false;
  const k = new Request('https://watchdog.local/' + encodeURIComponent(key));
  if (await caches.default.match(k)) return true;
  await caches.default.put(k, new Response('1', { headers: { 'cache-control': 'max-age=' + CONFIG.repeatMin * 60 } }));
  return false;
}

export async function run(env = {}) {
  const res = await check();
  if (res.ok) return { ...res, sent: null };
  const key = res.fails.map(f => f.name).join('|');
  if (await alreadySent(key)) return { ...res, sent: 'déjà signalé (rappel dans ' + CONFIG.repeatMin + ' min au plus)' };
  return { ...res, sent: await send(res, env) };
}

// ---- Cloudflare Worker ----
export default {
  async scheduled(event, env, ctx) { ctx.waitUntil(run(env).then(r => console.log(JSON.stringify(r)))); },
  // ouvrir l'adresse du Worker dans un navigateur = voir l'état (ne déclenche aucune alerte)
  async fetch() { const r = await check(); return new Response(JSON.stringify(r, null, 2), { status: r.ok ? 200 : 503, headers: { 'content-type': 'application/json; charset=utf-8' } }); },
};

// ---- Node (GitHub Actions, ordinateur, autre hébergeur) ----
if (typeof process !== 'undefined' && process.argv && /watchdog\.js$/.test(process.argv[1] || '')) {
  const dry = process.argv.includes('--dry');
  (dry ? check().then(r => ({ ...r, sent: 'essai à blanc : rien envoyé' })) : run(process.env)).then(r => {
    console.log(r.ok ? '✅ Tout répond : tableau de bord, jeu, Guardian vivant.' : '🚨 ' + r.fails.map(f => `${f.name} — ${f.why}`).join('\n🚨 '));
    if (!r.ok) console.log('Alerte :', JSON.stringify(r.sent));
    process.exit(r.ok ? 0 : 1);
  }, e => { console.error('Le watchdog a planté :', e); process.exit(2); });
}

# MYTHORIA Guardian (dépôt mythoria-guardian)

Appli tableau de bord installable (PWA) de MYTHORIA GUARDIAN, publiée par GitHub Pages depuis `main` :
https://nicolas06061997.github.io/mythoria-guardian/

L'utilisateur parle français et n'est pas développeur : réponses courtes, en français, étape par étape.

- Séparée du jeu (dépôt `mythoria-game`, https://nicolas06061997.github.io/mythoria-game/) pour être installée
  comme une vraie appli (sa propre adresse = sa propre portée ; dans l'adresse du jeu, Chrome ne faisait qu'un raccourci).
- Le Guardian (contrôleur Playwright, publication protégée, historique, notifications ntfy, rapport 19 h 45) vit dans
  `mythoria-game` : `guardian/`, `.github/workflows/guardian.yml`, `docs/GUARDIAN.md`. Il contrôle aussi cette appli en ligne.
- Données lues : branche `guardian-data` de `mythoria-game` via raw.githubusercontent.com (state/runs/events/problems.json,
  reports/, shots/) + API publique GitHub pour « contrôle en cours ». Jamais de données inventées.
- Fichiers : `index.html`, `app.js` (tout l'affichage, `h()` + textContent : jamais d'innerHTML avec des données),
  `app.css`, `sw.js` (changer `CACHE` à chaque modification), `manifest.webmanifest`, `icons/`.
- Installation comme les autres jeux : pastille verte `#inst` + carte `.inst-card` (`beforeinstallprompt` = 1 appui,
  sinon explications selon le navigateur).
- Test : `python3 -m http.server 8000` puis http://localhost:8000/ (données réelles) ou `?data=<dossier>/`.
- Onglet « Discuter » : issue #1 de `mythoria-game` (lecture API publique ; écriture avec la clé GitHub de l'utilisateur,
  fine-grained « Issues : Read and write », gardée en localStorage `guardian_token` sur son téléphone). Messages des agents =
  marqueur `<!-- guardian agent=… type=… -->` (règlement : `guardian/AGENTS.md` de mythoria-game) ; demandes `D-AAAAMMJJ-n`
  avec boutons Oui/Non ; « réponses immédiates » calculées depuis les données (sans IA, signalées comme telles).
- Ne jamais redessiner pendant la saisie (`render()` attend le `blur` de `.chat-in`).
- Preuve visuelle : un problème de `problems.json` peut porter `shot` (nom d'un fichier de `shots/`, capture prise au moment
  de l'échec) → vignette `.proof` dans l'onglet « Problèmes » (`proofShot`, ouvre `view`). Sans `shot` ou image absente : rien.
- Onglet « Contrôle » : un onglet par appareil de `state.lastCheck.devices` (`DEV_NAMES` : téléphone, ordinateur, appli,
  + écrans extrêmes `fold`/`mini`/`paysage` et `bots` = bots sans écran du Guardian).
- Watchdog (`watchdog/watchdog.js`, indépendant du Guardian) : tableau de bord + jeu en 200 OK, `state.json` de moins de
  150 min ; alerte ntfy + Discord (secret `DISCORD_WEBHOOK`). Lancé par `.github/workflows/watchdog.yml` (15 min) ;
  version 3 min sur Cloudflare Worker : `watchdog/LISEZMOI.md`. `node watchdog/watchdog.js --dry` = essai sans alerte.
- Onglet « Discuter » = « Travaux » (par défaut) + « Messages ». `travaux()` suit chaque demande `D-…` grâce au code cité
  dans les messages : attente → accepte (oui) → test (`envoi`) → fait (`publie`) ; refuse (non) ; echec. Oui/Non sur place.
- « Commander » (`openRunSheet`, clé GitHub avec Issues + Actions + Contents + Workflows en écriture) : lancer un contrôle /
  le rapport (`workflow_dispatch` de guardian.yml), publier une modification refusée par GitHub (événement `bloque` avec
  `branch` → `POST /merges`), revenir à la version précédente (action `retour arriere`, si `state.lastPublication.prev`).
  Actions sensibles = bouton à deux appuis (`confirmBtn`).

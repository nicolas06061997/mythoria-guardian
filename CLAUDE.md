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

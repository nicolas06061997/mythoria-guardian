# MYTHORIA Guardian

Application tableau de bord (PWA installable, séparée du jeu) de **MYTHORIA GUARDIAN**,
l'agent qui contrôle le jeu MYTHORIA toutes les heures.

- Appli : https://nicolas06061997.github.io/mythoria-guardian/
- Jeu : https://nicolas06061997.github.io/mythoria-game/
- Le Guardian lui-même (contrôleur, publication protégée, historique, notifications) vit dans le dépôt
  `mythoria-game` (`guardian/`, `.github/workflows/guardian.yml`) ; cette appli lit ses données
  (branche `guardian-data` de `mythoria-game`, via raw.githubusercontent.com) et l'état des contrôles
  en cours (API publique de GitHub). Aucune donnée inventée.

Fichiers : `index.html`, `app.js`, `app.css`, `sw.js` (hors ligne + mises à jour), `manifest.webmanifest`, `icons/`.
Test local : `python3 -m http.server 8000` puis http://localhost:8000/ (données réelles) ou `?data=<dossier>/`.

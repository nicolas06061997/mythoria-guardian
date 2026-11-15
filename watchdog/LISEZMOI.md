# Watchdog — le chien de garde du Guardian

`watchdog.js` vérifie que le tableau de bord et le jeu répondent (200 OK) et que le Guardian a bien contrôlé
le jeu récemment (moins de 150 min). En cas de panne : notification ntfy + Discord.

## Déjà en place : toutes les 15 minutes (GitHub)

`.github/workflows/watchdog.yml` le lance tout seul. Rien à faire. Limite : il vit chez GitHub, comme le Guardian.
Si GitHub entier est en panne, il ne peut pas prévenir. GitHub coupe aussi les tâches planifiées d'un dépôt
resté 60 jours sans modification (il envoie un e-mail avant).

## Pour une surveillance toutes les 3 minutes, hors de GitHub (Cloudflare, gratuit)

1. Crée un compte sur https://dash.cloudflare.com (gratuit, sans carte bancaire).
2. Menu **Workers & Pages** → **Create** → **Create Worker** → nomme-le `mythoria-watchdog` → **Deploy**.
3. **Edit code** : efface tout, colle tout le contenu de `watchdog.js`, puis **Deploy**.
4. Onglet **Settings** → **Triggers** → **Cron Triggers** → **Add** → `*/3 * * * *` → **Add trigger**.
5. (Discord) **Settings** → **Variables and Secrets** → **Add** → type **Secret**, nom `DISCORD_WEBHOOK`,
   valeur = l'adresse du webhook Discord → **Deploy**.

Vérifier : ouvre l'adresse du Worker (`https://mythoria-watchdog.….workers.dev`) : elle affiche `"ok": true`.

## Créer l'adresse du webhook Discord

Dans Discord : ton serveur → **Paramètres du salon** (roue dentée d'un salon) → **Intégrations** → **Webhooks** →
**Nouveau webhook** → **Copier l'URL du webhook**. Cette adresse est un secret : ne la colle jamais dans un fichier
du dépôt ni dans une discussion. Elle se range :

- sur GitHub, dépôts `mythoria-game` **et** `mythoria-guardian` : **Settings** → **Secrets and variables** →
  **Actions** → **New repository secret** → nom `DISCORD_WEBHOOK` ;
- sur Cloudflare (étape 5 ci-dessus) si tu utilises le Worker.

Sans ce secret, tout fonctionne quand même : les alertes partent seulement par ntfy.

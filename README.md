# BALANKA-INVEST

Site vitrine React/Vite, responsive et multilingue pour BALANKA-INVEST.

## Fonctionnalités

- Langues prioritaires dans le sélecteur : 🇫🇷 français, 🇪🇸 espagnol, 🇳🇱 néerlandais. L’allemand et l’italien restent disponibles ensuite.
- Détection initiale de la langue du navigateur avec sélection manuelle mémorisée localement.
- Formulaire sans backend : la demande est préparée pour un envoi par e-mail à `balankainvestement@gmail.com` ou par WhatsApp au `+34 656 631 447`.
- Contact direct : `+34 656 631 447`, WhatsApp `+34 665 099 206` et e-mail.
- Catalogue de services avec panier démonstratif ; aucun paiement réel n’est activé par défaut.
- Design premium avec dominante rouge sur blanc, nuances corail/bordeaux et surfaces métalliques bleu nuit.

## Développement local

```bash
npm install
npm run dev
```

Le serveur de développement écoute sur le port `3000`. Pour créer le build de production :

```bash
npm run build
```

Le projet est volontairement statique afin de pouvoir être déposé sur GitHub Pages ou un autre hébergement statique. Les liens `mailto:` et `wa.me` assurent la transmission directe des retours sans serveur applicatif.

## Déploiement GitHub Pages

Le build `dist/` peut être publié avec GitHub Actions, Pages ou un hébergement statique équivalent. Si le dépôt est servi dans un sous-chemin, configurer le `base` Vite correspondant avant le build.

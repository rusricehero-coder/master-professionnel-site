# Master Professionnel — site vitrine

Site web du **Centre Informatique Master Professionnel** (« Les Solidaires de l'informatique »),
Hêvié — Hêssa, Bénin. Site statique, en français, sans dépendance ni base de données,
prêt à être publié gratuitement sur **GitHub Pages**.

Propriétaire du projet : **AGONGLO Amédée Brice (Papirus Brice)**.

---

## 1. Ce que contient le site

| Page | Fichier | Contenu |
|---|---|---|
| Accueil | `index.html` | promesse, chiffres clés, filières phares, services, avantages, inscription, fondateur |
| Formations | `formations.html` | les 13 filières, filtres par domaine |
| Fiche filière | `formations/*.html` | objectifs, programme, débouchés, tarif, pré-inscription (13 pages) |
| Services | `services.html` | vente, maintenance, réseaux, vidéosurveillance, web, cybersécurité, formation |
| Inscriptions | `inscriptions.html` | étapes, pièces à fournir, paiement Mobile Money, formulaire, FAQ |
| À propos | `a-propos.html` | le centre, le fondateur, certifications, ouvrages |
| Contact | `contact.html` | adresse, téléphone, WhatsApp, e-mail, carte, formulaire |
| Légal | `mentions-legales.html`, `confidentialite.html` | éditeur, hébergeur, données personnelles |
| Erreur | `404.html` | page introuvable |

Le site est **100 % statique** : aucune installation, aucun serveur, aucun compte à créer.
Les formulaires ne stockent rien : ils préparent un message WhatsApp que le visiteur envoie lui-même.

---

## 2. Structure du projet

```
master pro/
├─ index.html … 404.html        pages générées (ne pas éditer à la main)
├─ formations/                  13 fiches générées
├─ data/
│  ├─ site.json                 coordonnées, services, FAQ, certifications, textes
│  └─ formations.json           les 13 filières (durée, tarif, programme…)
├─ assets/
│  ├─ css/style.css             feuille de style unique
│  ├─ js/main.js                menu, filtres, animations, formulaires WhatsApp
│  ├─ brand/                    logo (SVG + PNG), favicon
│  └─ img/og-image.png          image de partage pour les réseaux sociaux
├─ tools/
│  ├─ build.mjs                 génère les pages HTML depuis data/
│  ├─ brand.py                  génère les logos SVG
│  ├─ raster.py                 génère les icônes PNG et l'image de partage
│  └─ ttf2svg.py                convertit le logotype en courbes
└─ README.md
```

> **Important :** les fichiers `.html` sont générés. Pour modifier un texte, un tarif ou une
> filière, éditez les fichiers `data/*.json` puis relancez la génération (voir § 4).

---

## 3. Voir le site sur votre ordinateur

- **Le plus simple :** double-cliquez sur `index.html`.
- **Avec un serveur local** (recommandé pour tester les chemins comme sur le web) :

```bash
# à la racine du projet
npx serve .
# ou
python -m http.server 8080
```

Puis ouvrez <http://localhost:8080>.

---

## 4. Modifier le contenu

### a) Coordonnées, services, FAQ, certifications
Éditez `data/site.json` (téléphone, e-mail, adresse, réseaux sociaux, services, questions fréquentes…).

### b) Filières, durées, tarifs, programmes
Éditez `data/formations.json`. Chaque filière contient :

```json
{
  "slug": "intelligence-artificielle",     // nom du fichier HTML (sans accents ni espaces)
  "nom": "Intelligence artificielle",
  "categorie": "ia",                       // doit exister dans "categories"
  "duree": "2 semaines",
  "prix": "20 000",                        // sans « FCFA »
  "prix_texte": "20 000 FCFA",
  "resume": "…",
  "objectifs": ["…"],
  "programme": ["…"],
  "debouches": ["…"]
}
```

### c) Photos

Déposez vos images dans `assets/img/photos/` en les nommant `photo-01.jpg`, `photo-02.jpg`… jusqu'à
`photo-12.jpg`. La page **Galerie** (`galerie.html`) les affiche automatiquement : une photo absente
est simplement ignorée, aucun autre réglage n'est nécessaire.

### d) Avis Google

Les avis sont stockés dans `data/avis.json` :

```json
{
  "meta": { "source": "Google", "url": "https://…" },
  "avis": [
    { "nom": "Nom Prénom", "note": 5, "date": "mars 2026", "texte": "Le texte de l'avis…" }
  ]
}
```

Après `node tools/build.mjs`, les avis apparaissent sur l'accueil. Dès qu'il y en a **3 ou plus**,
la page `avis.html`, son entrée de menu et les données structurées `aggregateRating` sont générées
automatiquement (utile pour Google).

### e) Régénérer les pages

```bash
node tools/build.mjs
```

La commande réécrit les 22 pages HTML. Aucune dépendance à installer.

---

## 5. Identité visuelle

Le logo, le favicon et l'image de partage sont dans `assets/brand/` et `assets/img/`.

| Fichier | Usage |
|---|---|
| `logo-horizontal.svg` | en-tête du site (fond clair) |
| `logo-horizontal-dark.svg` | pied de page (fond sombre) |
| `logo-stacked.svg` | réseaux sociaux, affiches, documents |
| `logo-mark.svg` / `icon-512.png` | icône d'application, avatar |
| `favicon.svg`, `favicon-32.png` | onglet du navigateur |
| `og-image.png` | aperçu lors du partage d'un lien (WhatsApp, Facebook…) |

Couleurs de la charte : bleu marine `#0B2653`, bleu `#1C55C9`, corail `#E8385A`, fond `#F4F7FC`.

Pour régénérer les logos après une modification :

```bash
python tools/brand.py     # SVG (nécessite les fichiers de tools/ et la police Bahnschrift)
python tools/raster.py    # PNG (Pillow)
```

Le logotype est converti en courbes : il s'affiche à l'identique partout, sans installer de police.

---

## 6. Publier sur GitHub Pages (gratuit)

1. Créer un compte GitHub au nom de **Papirus Brice** (ou utiliser le compte existant).
2. Créer un dépôt **public** nommé par exemple `master-professionnel-site`.
3. Dans le dossier du projet :

```bash
git init -b main
git add .
git commit -m "Site vitrine Master Professionnel"
git remote add origin https://github.com/<compte>/master-professionnel-site.git
git push -u origin main
```

4. Sur GitHub : **Settings → Pages → Build and deployment**
   - Source : `Deploy from a branch`
   - Branch : `main`, dossier `/ (root)`
   - Enregistrer.
5. Le site est publié sous `https://<compte>.github.io/master-professionnel-site/`
   (compter une à deux minutes).

### Après la mise en ligne

- Mettre à jour `og:image` dans `tools/build.mjs` avec l'URL absolue
  (`https://<compte>.github.io/.../assets/img/og-image.png`) puis régénérer : certains
  réseaux sociaux n'acceptent pas les chemins relatifs.
- Ajouter le lien du site sur la fiche Google, Facebook, LinkedIn et YouTube du centre.
- Quand un nom de domaine sera acheté (`masterprofessionnel.bj` par exemple), l'ajouter dans
  **Settings → Pages → Custom domain** et mettre à jour les URL ci-dessus.

---

## 7. Choix techniques

- **Aucune dépendance** : HTML, CSS et JavaScript natifs. Rien à mettre à jour, rien à
  casser dans six mois.
- **Génération statique** : le contenu vit dans deux fichiers JSON, les 22 pages sont
  produites par `tools/build.mjs`.
- **Performance** : une seule feuille de style, un seul script, images SVG, aucune police
  téléchargée — le site s'affiche même en connexion lente.
- **Accessibilité** : contrastes vérifiés, navigation au clavier, lien d'évitement,
  libellés de formulaires, animations désactivables.
- **Sans traceur** : aucun cookie publicitaire, aucune mesure d'audience.

---

## 8. Ce qui n'est pas encore là (étapes suivantes)

1. **Photos réelles** du centre, des ateliers et des apprenants (à fournir) — des
   emplacements sont prévus dans les pages.
2. **Boutique en ligne** (ouvrages, matériel) et **paiement Mobile Money** : nécessite un
   service de paiement et un hébergement avec serveur (phase 2).
3. **Espace apprenant / cours en direct** (visioconférence, replays 24 h, rappels WhatsApp) :
   phase 3, avec un prestataire de visioconférence.
4. **Chatbot** : à brancher sur un service externe une fois le trafic établi.
5. **Nom de domaine** et adresse e-mail professionnelle (`contact@…`).

---

## 9. Contact

Centre Informatique Master Professionnel
Hêvié — Hêssa, à côté de la Micro-finance MSFP · Bénin
Téléphone / WhatsApp : +229 01 95 81 81 67 — E-mail : rusricehero@gmail.com
IFU 0202213971151 · RCCM RB-ABC-22-A-40203

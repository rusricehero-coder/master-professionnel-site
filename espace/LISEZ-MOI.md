# Espace apprenant — installation (phase 1)

Espace membre : création de compte, demande d'inscription en ligne, suivi du dossier,
tableau de bord administrateur. Tout repose sur **Supabase** (base de données + comptes),
le site reste hébergé gratuitement sur GitHub Pages.

---

## 1. Créer le projet Supabase

1. `supabase.com` → **New project**
2. Nom : `master-professionnel` · Mot de passe base : génère-en un fort et **conserve-le**
3. Région : `Europe (Frankfurt)` ou `West EU` (la plus proche du Bénin)
4. Attends ~2 minutes que le projet démarre.

## 2. Créer les tables et la sécurité

1. Menu de gauche → **SQL Editor** → **New query**
2. Colle tout le contenu de `supabase/schema.sql`
3. **Run** (en bas à droite).

Tu dois voir « Success. No rows returned ». Les tables `profiles`, `formations`,
`inscriptions` sont créées, avec les règles de sécurité (RLS) et les 13 filières.

## 3. Relier le site à Supabase

1. **Project Settings → API**
2. Copie **Project URL** et la clé **anon / public**
3. Ouvre `espace/assets/config.js` et remplace :

```js
SUPABASE_URL: "https://xxxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...",
```

> La clé `anon` est **publique par conception** : ce qui protège les données, ce sont
> les règles RLS. Ne mets **jamais** la clé `service_role` dans le site.

## 4. Autoriser les retours d'e-mail

**Authentication → URL Configuration**

- **Site URL** : `https://rusricehero-coder.github.io/master-professionnel-site/`
- **Redirect URLs** : ajoute
  `https://rusricehero-coder.github.io/master-professionnel-site/espace/`

Sans cela, le lien de confirmation d'e-mail renvoie vers une page inconnue.

## 5. Créer ton compte administrateur

1. Va sur `/espace/` et crée ton compte avec `rusricehero@gmail.com`
2. Confirme l'e-mail reçu, puis connecte-toi
3. Dans **SQL Editor**, exécute :

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'rusricehero@gmail.com');
```

4. Recharge `/espace/espace.html` : le bouton **Administration** apparaît.

## 6. Mettre en ligne

Copie le dossier `espace/` et `supabase/` dans le dépôt cloné, puis commit + push
(GitHub Desktop). Le site les publie immédiatement.

---

## Ce qui est protégé, et comment

| Risque | Protection |
|---|---|
| Lire les dossiers des autres | RLS : chaque apprenant ne voit que ses lignes |
| Modifier le statut d'une demande | réservé au rôle `admin` |
| Se nommer administrateur | trigger `proteger_role` : le rôle est rétabli |
| Vol de session | JWT Supabase à durée limitée, renouvellement automatique |
| Injection SQL | requêtes paramétrées via l'API PostgREST |
| Spam de formulaires | confirmation e-mail obligatoire + limite de tentatives Supabase |
| Fuite de clé | seule la clé publique est exposée, jamais `service_role` |

## Limites de la phase 1

- Pas encore de paiement : l'accès aux cours se valide manuellement par l'admin.
- Pas encore de visioconférence : phase 2 (Jitsi + invitations par jeton).
- Les photos de dossier ne sont pas encore téléversables (phase 1b, avec Storage).

## En cas de problème

- **« Invalid API key »** → la clé dans `config.js` est incomplète.
- **Aucune donnée** → les règles RLS bloquent : vérifie que tu es bien connecté.
- **E-mail non reçu** → regarde les spams ; sinon Supabase → Authentication → Users
  → « Confirm email » manuellement.

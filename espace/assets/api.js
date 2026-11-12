/* Client Supabase minimal, sans dépendance externe.
   Appelle directement l'API Auth et l'API REST : aucune bibliothèque à charger,
   donc plus de panne silencieuse liée au CDN.
   La clé publishable est publique ; les règles RLS protègent les données. */

const cfg = window.MP_CONFIG || {};
const URL_BASE = String(cfg.SUPABASE_URL || "").replace(/\/+$/, "");
const CLE = String(cfg.SUPABASE_ANON_KEY || "");

export const configured =
  Boolean(URL_BASE && CLE) && !URL_BASE.includes("VOTRE") && !CLE.includes("COLLER");

const CLE_SESSION = "mp_session";

function entetes(token, prefer) {
  const h = { apikey: CLE, "Content-Type": "application/json" };
  if (token) h.Authorization = "Bearer " + token;
  if (prefer) h.Prefer = prefer;
  return h;
}

async function requete(chemin, { method = "GET", body, token, prefer } = {}) {
  if (!configured) throw new Error("Configuration Supabase incomplète (espace/assets/config.js).");
  let reponse;
  try {
    reponse = await fetch(URL_BASE + chemin, {
      method,
      headers: entetes(token, prefer),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error("Connexion impossible à Supabase. Vérifie ta connexion Internet.");
  }
  const texte = await reponse.text();
  let donnees = null;
  try {
    donnees = texte ? JSON.parse(texte) : null;
  } catch {
    donnees = texte;
  }
  if (!reponse.ok) {
    const msg =
      (donnees && (donnees.msg || donnees.message || donnees.error_description || donnees.error)) ||
      "Erreur " + reponse.status;
    const err = new Error(msg);
    err.status = reponse.status;
    err.donnees = donnees;
    throw err;
  }
  return donnees;
}

/* ---------------- session ---------------- */

export function session() {
  try {
    const brut = localStorage.getItem(CLE_SESSION);
    if (!brut) return null;
    const s = JSON.parse(brut);
    if (!s || !s.access_token) return null;
    return s;
  } catch {
    return null;
  }
}

function enregistre(donnees) {
  const s = {
    access_token: donnees.access_token,
    refresh_token: donnees.refresh_token,
    expires_at: Date.now() + (donnees.expires_in || 3600) * 1000,
    user: donnees.user,
  };
  localStorage.setItem(CLE_SESSION, JSON.stringify(s));
  return s;
}

export function deconnexion() {
  localStorage.removeItem(CLE_SESSION);
  window.location.href = "index.html";
}

async function rafraichit(s) {
  const d = await requete("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: { refresh_token: s.refresh_token },
  });
  return enregistre(d);
}

export async function sessionValide() {
  let s = session();
  if (!s) return null;
  if (s.expires_at - 60000 < Date.now()) {
    try {
      s = await rafraichit(s);
    } catch {
      localStorage.removeItem(CLE_SESSION);
      return null;
    }
  }
  return s;
}

export function utilisateur() {
  const s = session();
  return s ? s.user : null;
}

/* ---------------- authentification ---------------- */

export async function inscription(email, motDePasse, meta) {
  const d = await requete("/auth/v1/signup", {
    method: "POST",
    body: { email, password: motDePasse, data: meta || {} },
  });
  if (d && d.access_token) enregistre(d);
  return d;
}

export async function connexion(email, motDePasse) {
  const d = await requete("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email, password: motDePasse },
  });
  return enregistre(d);
}

/* ---------------- base de données (REST) ---------------- */

export async function select(table, requeteQuery, token) {
  return requete("/rest/v1/" + table + "?" + requeteQuery, { token });
}

export async function insertion(table, ligne, token) {
  const d = await requete("/rest/v1/" + table, {
    method: "POST",
    body: ligne,
    token,
    prefer: "return=representation",
  });
  return d;
}

export async function modification(table, filtre, champs, token) {
  const d = await requete("/rest/v1/" + table + "?" + filtre, {
    method: "PATCH",
    body: champs,
    token,
    prefer: "return=representation",
  });
  return d;
}

/* Test de liaison : renvoie le code HTTP de l'API REST (200 = tout va bien). */
export async function testerConnexion() {
  const r = await fetch(URL_BASE + "/rest/v1/formations?select=id&limit=1", {
    headers: { apikey: CLE },
  });
  return r.status;
}

/* Message d'erreur lisible */
export function messageErreur(err) {
  const m = (err && err.message) || "";
  if (/Invalid login credentials/i.test(m)) return "E-mail ou mot de passe incorrect.";
  if (/Email not confirmed/i.test(m)) return "Confirmez d'abord votre adresse e-mail (lien reçu par mail).";
  if (/already registered|User already registered/i.test(m)) return "Un compte existe déjà avec cet e-mail.";
  if (/Password should be at least/i.test(m)) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (/rate limit|too many/i.test(m)) return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (/Invalid API key|apikey/i.test(m)) return "Clé Supabase invalide : vérifie config.js.";
  if (/row-level security/i.test(m)) return "Action non autorisée par les règles de sécurité.";
  return m || "Une erreur est survenue. Réessayez.";
}

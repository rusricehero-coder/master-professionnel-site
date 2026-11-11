/**
 * Générateur du site Master Professionnel.
 * Lit data/site.json et data/formations.json puis écrit les pages HTML.
 * Usage : node tools/build.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(readFileSync(join(ROOT, "data", "site.json"), "utf8"));
const data = JSON.parse(readFileSync(join(ROOT, "data", "formations.json"), "utf8"));
const avisData = JSON.parse(readFileSync(join(ROOT, "data", "avis.json"), "utf8"));
const AVIS = (Array.isArray(avisData.avis) ? avisData.avis : []).filter((a) => a && a.nom && a.texte);
const AVIS_URL = (avisData.meta && avisData.meta.url) || site.contact.maps_url;

const SITE_URL = "https://rusricehero-coder.github.io/master-professionnel-site/";
const C = site.contact;
const W = `https://wa.me/${C.whatsapp}`;
const MAIL = `mailto:${C.email}`;
const TEL = `tel:${C.telephone_lien}`;

/* ------------------------------------------------------------------ outils */
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const waLink = (msg) => `${W}?text=${encodeURIComponent(msg)}`;

const STROKE = {
  monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  wrench:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  printer:
    '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  network:
    '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3M12 12V8"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  camera: '<path d="m23 7-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  cap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>',
  badge: '<circle cx="12" cy="8" r="6"/><path d="m8.2 13-1.7 8L12 18l5.5 3-1.7-8"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  phone:
    '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  whatsapp:
    '<path d="M20.5 3.5A11.8 11.8 0 0 0 3.2 17.7L2 22l4.4-1.2A11.8 11.8 0 1 0 20.5 3.5z"/><path d="M8.6 7.6c-.2 0-.5 0-.7.3-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.2.2 1.8 2.8 4.4 3.8 2.1.8 2.6.7 3 .6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.2-.1-1-.4-1.8-1.1-.7-.6-1.1-1.3-1.3-1.6-.1-.2 0-.3.1-.4l.4-.5c.1-.2.1-.3 0-.5l-.8-1.8c-.2-.4-.4-.4-.5-.4z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  spark: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3z"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
};

const SOLID = {
  facebook: '<path d="M14 9h3V6h-3c-1.9 0-3.5 1.6-3.5 3.5V11H8v3h2.5v7h3v-7H17l.5-3h-4V9.5c0-.3.2-.5.5-.5z"/>',
  linkedin:
    '<path d="M4.5 9H8v12H4.5zM6.2 3a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2zM10 9h3.4v1.7c.5-1 1.7-1.9 3.4-1.9 3 0 3.7 1.9 3.7 4.6V21H17v-6.6c0-1.6-.5-2.5-1.9-2.5-1.3 0-2 1-2 2.5V21H10z"/>',
  youtube:
    '<path d="M21 8.2a3 3 0 0 0-2.1-2.1C17.2 5.6 12 5.6 12 5.6s-5.2 0-6.9.5A3 3 0 0 0 3 8.2 31 31 0 0 0 2.6 12 31 31 0 0 0 3 15.8a3 3 0 0 0 2.1 2.1c1.7.5 6.9.5 6.9.5s5.2 0 6.9-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 21.4 12 31 31 0 0 0 21 8.2zM10 15V9l5.2 3z"/>',
  instagram:
    '<path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.8a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 9.9a3.9 3.9 0 1 1 0-7.8 3.9 3.9 0 0 1 0 7.8zm7.6-10.1a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0z"/>',
  tiktok:
    '<path d="M16.6 2h-3.1v13.2a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.6a5.7 5.7 0 0 0-.8-.1 5.7 5.7 0 1 0 5.7 5.7V8.9a7 7 0 0 0 4.1 1.3V7.1a4.1 4.1 0 0 1-4.1-4.1z"/>',
  x: '<path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.2L4.8 21H1.6l7.5-8.6L1.2 3h6.6l4.5 5.6zm-1.1 16.1h1.8L7.7 4.8H5.8z"/>',
  snapchat:
    '<path d="M12 3Q17 3 17 8.5V12.5L18.2 11.9Q19 11.6 18.6 12.5Q18 13.4 17.2 13.9Q16.7 14.2 16.6 14.8V15.6Q16.6 16.2 16 16.2Q15.2 16.2 14.6 16.7Q14 17.2 13.3 17.2Q12.6 17.2 12 16.8Q11.4 17.2 10.7 17.2Q10 17.2 9.4 16.7Q8.8 16.2 8 16.2Q7.4 16.2 7.4 15.6V14.8Q7.3 14.2 6.8 13.9Q6 13.4 5.4 12.5Q5 11.6 5.8 11.9L7 12.5V8.5Q7 3 12 3Z"/>',
};

const icon = (name, cls) =>
  STROKE[name]
    ? `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${STROKE[name]}</svg>`
    : "";

const social = (name, cls) =>
  SOLID[name]
    ? `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${SOLID[name]}</svg>`
    : "";

/* "250 000 à 350 000" -> "250 000 – 350 000" ; sinon "à partir de 5 000" */
const prixCourt = (f) =>
  f.prix.includes("à") ? `${f.prix.replace(" à ", " – ")} F` : `dès ${f.prix} F`;

/* --------------------------------------------------------------- structure */
const navItems = () => [
  { href: "formations.html", label: "Formations", key: "formations" },
  { href: "services.html", label: "Services", key: "services" },
  { href: "galerie.html", label: "Galerie", key: "galerie" },
  { href: "publications.html", label: "Publications", key: "publications" },
  ...(AVIS.length >= 3 ? [{ href: "avis.html", label: "Avis", key: "avis" }] : []),
  { href: "inscriptions.html", label: "Inscriptions", key: "inscriptions" },
  { href: "a-propos.html", label: "À propos", key: "apropos" },
  { href: "contact.html", label: "Contact", key: "contact" },
];

function header(base, active) {
  const links = navItems()
    .map((n) => `<a href="${base}${n.href}"${n.key === active ? ' aria-current="page"' : ""}>${n.label}</a>`)
    .join("");
  return `<a class="skip" href="#contenu">Aller au contenu</a>
<header class="header">
  <div class="container header__inner">
    <a class="brand" href="${base}index.html" aria-label="Master Professionnel — accueil">
      <img src="${base}assets/brand/logo-horizontal.svg" alt="Master Professionnel" width="130" height="44">
    </a>
    <nav class="nav" id="menu" aria-label="Navigation principale">${links}</nav>
    <a class="btn btn--sm header__cta" href="${base}inscriptions.html">S'inscrire ${icon("arrow")}</a>
    <button class="burger" type="button" aria-label="Ouvrir le menu" aria-controls="menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>`;
}

function footer(base) {
  const liensFilieres = data.filiere
    .slice(0, 5)
    .map((f) => `<a href="${base}formations/${f.slug}.html">${esc(f.nom)}</a>`)
    .join("");
  const liensSocial = site.reseaux
    .map(
      (r) =>
        `<a href="${r.url}" target="_blank" rel="noopener" aria-label="${r.nom}">${social(
          r.nom.toLowerCase().replace("x", "x")
        )}</a>`
    )
    .join("");
  return `<footer class="footer">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        <img src="${base}assets/brand/logo-horizontal-dark.svg" alt="Master Professionnel" width="136" height="46">
        <p>${esc(site.marque.nom_complet)} — « ${esc(site.marque.surnom)} ». Formations, services informatiques et accompagnement numérique à ${esc(C.adresse_courte)}.</p>
        <div class="socials">${liensSocial}</div>
      </div>
      <div>
        <h4>Formations</h4>
        <div class="footer__links">${liensFilieres}<a href="${base}formations.html">Toutes les filières</a></div>
      </div>
      <div>
        <h4>Le centre</h4>
        <div class="footer__links">
          <a href="${base}services.html">Nos services</a>
          <a href="${base}formations.html">Formations</a>
          <a href="${base}publications.html">Livres &amp; manuels</a>
          <a href="${base}inscriptions.html">Inscriptions</a>
          <a href="${base}galerie.html">Galerie photos</a>
          ${AVIS.length >= 3 ? `<a href="${base}avis.html">Avis des apprenants</a>` : ""}
          <a href="${base}a-propos.html">À propos</a>
          <a href="${base}contact.html">Contact</a>
        </div>
      </div>
      <div>
        <h4>Contact</h4>
        <div class="footer__contact">
          <a href="${TEL}">${icon("phone")}<span>${esc(C.telephone)}</span></a>
          <a href="${MAIL}">${icon("mail")}<span>${esc(C.email)}</span></a>
          <a href="${C.maps_url}" target="_blank" rel="noopener">${icon("pin")}<span>${esc(C.adresse_courte)}</span></a>
          <a href="${AVIS_URL}" target="_blank" rel="noopener">${icon("star")}<span>Avis Google</span></a>
          <a href="${W}" target="_blank" rel="noopener">${icon("whatsapp")}<span>WhatsApp</span></a>
        </div>
      </div>
    </div>
    <div class="footer__bottom">
      <p>© <span data-year>2026</span> ${esc(site.marque.nom)}. Tous droits réservés. — IFU ${esc(
    site.legal.ifu
  )} · RCCM ${esc(site.legal.rccm)}</p>
      <nav aria-label="Liens légaux">
        <a href="${base}mentions-legales.html">Mentions légales</a>
        <a href="${base}confidentialite.html">Confidentialité</a>
      </nav>
    </div>
  </div>
</footer>`;
}

function waFloat() {
  return `<a class="wa-float" href="${waLink(
    "Bonjour Master Professionnel, je souhaite des informations sur vos formations."
  )}" target="_blank" rel="noopener" aria-label="Écrire sur WhatsApp">
    ${icon("whatsapp")}<span>WhatsApp</span>
  </a>`;
}

function layout({ base = "", active = "", title, description, body, extraHead = "", jsonld = "", scripts = [] }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#0B2653">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.marque.nom_complet)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE_URL}assets/img/og-image.png">
<meta property="og:url" content="${SITE_URL}__PATH__">
<link rel="canonical" href="${SITE_URL}__PATH__">
<meta property="og:locale" content="fr_BJ">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}assets/brand/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${base}assets/brand/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="${base}assets/brand/apple-touch-icon.png">
<link rel="stylesheet" href="${base}assets/css/style.css">
<script>document.documentElement.classList.add("js");</script>
${extraHead}${jsonld}
</head>
<body>
<div class="scroll-progress" aria-hidden="true"></div>
${header(base, active)}
<main id="contenu">
${body}
</main>
${footer(base)}
${waFloat()}
<button class="to-top" type="button" aria-label="Revenir en haut de la page">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>
</button>
<script src="${base}assets/js/main.js" defer></script>
${scripts.map((s) => `<script src="${base}${s}" defer></script>`).join("\n")}
</body>
</html>
`;
}

const ctaBand = () => `<section class="section">
  <div class="container">
    <div class="cta-band reveal">
      <h2>Prêt à commencer votre formation ?</h2>
      <p>Inscription 2 000 FCFA, sessions chaque début de mois. Passez au centre ou écrivez-nous : nous vous accompagnons dans le choix de votre filière.</p>
      <div class="btn-row">
        <a class="btn" href="inscriptions.html">S'inscrire maintenant ${icon("arrow")}</a>
        <a class="btn btn--ghost" href="${W}" target="_blank" rel="noopener">${icon("whatsapp")} Écrire sur WhatsApp</a>
      </div>
    </div>
  </div>
</section>`;

/* --------------------------------------------------------------- composants */
function fcard(f, index, base = "") {
  return `<article class="card fcard reveal" data-cat="${f.categorie}">
    <span class="fcard__num" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
    <span class="fcard__cat">${esc(catLabel(f.categorie))}</span>
    <h3>${esc(f.nom)}</h3>
    <p>${esc(f.resume)}</p>
    <div class="fcard__meta">
      <span>${icon("clock")} ${esc(f.duree)}</span>
      <span class="fcard__price">${prixCourt(f)}</span>
    </div>
    <a class="fcard__link" href="${base}formations/${f.slug}.html" aria-label="Découvrir la filière ${esc(f.nom)}"></a>
  </article>`;
}

const catLabel = (id) => (data.categories.find((c) => c.id === id) || { label: id }).label;

const pageHead = (title, intro, crumbs) => `<section class="page-head">
  <div class="container">
    <nav class="breadcrumb" aria-label="Fil d'Ariane">${crumbs}</nav>
    <h1>${title}</h1>
    ${intro ? `<p class="lead" style="color:#C6D6F2">${intro}</p>` : ""}
  </div>
</section>`;

/* ------------------------------------------------------------------- avis */
const star = (filled) =>
  `<svg viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">${STROKE.star}</svg>`;

const starsFor = (note) =>
  `<div class="review__stars" aria-label="${note} sur 5">${[1, 2, 3, 4, 5]
    .map((i) => star(i <= Math.round(Number(note) || 5)))
    .join("")}</div>`;

const initials = (name) =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();

const noteMoyenne = () => {
  if (!AVIS.length) return null;
  const sum = AVIS.reduce((total, a) => total + (Number(a.note) || 5), 0);
  return Math.round((sum / AVIS.length) * 10) / 10;
};

/* note et volume affiches sur Google (meta), a defaut moyenne des avis integres */
const noteGlobale = () => (avisData.meta && avisData.meta.note_globale) || noteMoyenne();
const nbAvis = () => (avisData.meta && avisData.meta.nombre) || AVIS.length;

const avisCard = (a) => `<article class="review">
    ${starsFor(a.note)}
    <p class="review__text">« ${esc(a.texte)} »</p>
    <div class="review__author">
      <span class="review__avatar" aria-hidden="true">${esc(initials(a.nom))}</span>
      <div>
        <div class="review__name">${esc(a.nom)}</div>
        <div class="review__meta">${esc(a.date ? a.date + " · " : "")}Avis Google</div>
      </div>
    </div>
  </article>`;

const bookCard = (l) => `<a class="book" href="${waLink(
  `Bonjour, je souhaite commander « ${l.titre} ».`
)}" target="_blank" rel="noopener">
    <span class="book__frame"><img src="${l.image}" alt="Couverture — ${esc(l.titre)}" loading="lazy" width="560" height="840"></span>
    <strong>${esc(l.titre)}</strong>
    <span class="book__sub">${esc(l.sous_titre)}</span>
  </a>`;

const ratingBadge = () => {
  const note = noteGlobale();
  if (note === null) return "";
  return `<div class="rating">
    <b>${String(note).replace(".", ",")}<span style="font-size:.9rem;color:var(--muted)">/5</span></b>
    <div>${starsFor(note)}<small>${nbAvis()} avis${
      avisData.meta && avisData.meta.source ? " sur " + esc(avisData.meta.source) : ""
    }</small></div>
  </div>`;
};

function avisSection(limit) {
  if (!AVIS.length) return "";
  const list = limit ? AVIS.slice(0, limit) : AVIS;
  return `<section class="section section--soft" id="avis">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Ils nous font confiance</span>
      <h2>Ce que disent nos apprenants</h2>
      <p class="lead">Des avis publiés par les apprenants et les clients du centre sur notre fiche Google.</p>
    </div>
    ${ratingBadge()}
    <div class="reviews" style="margin-top:26px">${list.map(avisCard).join("")}</div>
    ${
      limit && AVIS.length > limit
        ? `<div style="margin-top:28px"><a class="btn btn--outline" href="avis.html">Lire les ${AVIS.length} avis ${icon("arrow")}</a></div>`
        : ""
    }
  </div>
</section>`;
}

/* ---------------------------------------------------------------- galerie */
const PHOTO_DIR = join(ROOT, "assets", "img", "photos");
const GALERIE = existsSync(PHOTO_DIR)
  ? readdirSync(PHOTO_DIR)
      .filter((f) => /^photo-(?!auteur).*\.(jpe?g|png|webp)$/i.test(f))
      .sort()
  : [];

const galeriePage = () => {
  const figures = GALERIE.map(
    (p) =>
      `<figure><img src="assets/img/photos/${p}" alt="Le centre Master Professionnel en images" loading="lazy" width="800" height="600" onerror="this.closest('figure').remove()"></figure>`
  ).join("");

  const body = `
${pageHead(
  "Le centre en images",
  "Salles de formation, ateliers pratiques, remises d'attestations : découvrez le quotidien du Centre informatique Master Professionnel à Hêvié.",
  `<a href="index.html">Accueil</a> <span>›</span> <span aria-current="page">Galerie</span>`
)}
<section class="section">
  <div class="container">
    ${figures ? `<div class="gallery" data-gallery>${figures}</div>` : ""}
    ${figures ? `<p class="form__note" style="margin-top:18px">D'autres photos seront ajoutées au fil des sessions de formation.</p>` : ""}
    <div class="card gallery-empty" data-gallery-empty${figures ? " hidden" : ""}>
      <h3>Les photos arrivent</h3>
      <p>Les images du centre, des ateliers et des apprenants seront publiées ici très prochainement. En attendant, retrouvez nos publications sur
      <a href="${site.reseaux[0].url}" target="_blank" rel="noopener">Facebook</a> et sur
      <a href="${C.maps_url}" target="_blank" rel="noopener">notre fiche Google</a>.</p>
    </div>
  </div>
</section>
${ctaBand()}
`;
  return layout({
    title: "Galerie photos — Master Professionnel Hêvié",
    description:
      "Découvrez en images le Centre informatique Master Professionnel à Hêvié : salles de formation, ateliers pratiques et remises d'attestations.",
    active: "galerie",
    body,
    extraHead: "",
    jsonld: "",
    scripts: ["assets/js/gallery.js"],
  });
};

const avisPage = () => {
  const note = noteGlobale();
  const body = `
${pageHead(
  "Avis des apprenants et des clients",
  `${String(note).replace(".", ",")}/5 sur ${nbAvis()} avis Google. Voici une sélection de ${AVIS.length} avis accompagnés d'un commentaire, publiés sur notre fiche.`,
  `<a href="index.html">Accueil</a> <span>›</span> <span aria-current="page">Avis</span>`
)}
<section class="section">
  <div class="container">
    <div style="display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between;margin-bottom:30px">
      ${ratingBadge()}
      <a class="btn btn--outline" href="${AVIS_URL}" target="_blank" rel="noopener">${icon("star")} Voir sur Google</a>
    </div>
    <div class="reviews">${AVIS.map(avisCard).join("")}</div>
    <p class="form__note" style="margin-top:26px">Les avis sont reproduits fidèlement, orthographe comprise, tels qu'ils ont été publiés sur Google. La note de ${String(
      note
    ).replace(".", ",")}/5 porte sur l'ensemble des ${nbAvis()} avis de la fiche ; seuls les avis accompagnés d'un commentaire sont affichés ici.</p>
  </div>
</section>
${ctaBand()}
`;
  const jsonld = `<script type="application/ld+json">
${JSON.stringify(
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: site.marque.nom_complet,
    address: { "@type": "PostalAddress", addressLocality: "Hêvié", addressCountry: "BJ" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: note,
      reviewCount: nbAvis(),
      bestRating: 5,
      worstRating: 1,
    },
    review: AVIS.map((a) => ({
      "@type": "Review",
      author: { "@type": "Person", name: a.nom },
      reviewRating: { "@type": "Rating", ratingValue: Number(a.note) || 5, bestRating: 5 },
      reviewBody: a.texte,
    })),
  },
  null,
  2
)}
</script>`;
  return layout({
    title: `Avis des apprenants — Master Professionnel Hêvié`,
    description: `Avis vérifiés sur le Centre informatique Master Professionnel à Hêvié : ${AVIS.length} témoignages d'apprenants et de clients, note moyenne ${String(
      note
    ).replace(".", ",")}/5.`,
    active: "avis",
    body,
    jsonld,
  });
};

/* ----------------------------------------------------------------- accueil */
const home = () => {
  const phares = [
    "developpement-web-applications",
    "maintenance-informatique-reseaux",
    "graphisme-design",
    "intelligence-artificielle",
    "secretariat-bureautique",
    "cameras-surveillance-gps",
  ]
    .map((slug) => data.filiere.find((f) => f.slug === slug))
    .filter(Boolean);

  const stats = [
    { n: "13", suffix: "", label: "filières professionnelles" },
    { n: "2000", suffix: " F", format: "space", label: "frais d'inscription" },
    { n: "100", suffix: " %", label: "de pratique encadrée" },
    { n: "2006", suffix: "", label: "année des premiers cours", fixed: true },
  ]
    .map(
      (s) =>
        `<div class="stat"><b data-count="${s.n}"${s.format ? ` data-format="${s.format}"` : ""}${
          s.suffix ? ` data-suffix="${s.suffix}"` : ""
        }${s.fixed ? " data-static" : ""}>${s.n === "2000" ? "2 000 F" : s.n + s.suffix}</b><span>${s.label}</span></div>`
    )
    .join("");

  const OUTILS = [
    "Windows",
    "Word",
    "Excel",
    "PowerPoint",
    "Photoshop",
    "Illustrator",
    "Canva",
    "HTML & CSS",
    "JavaScript",
    "Python",
    "Réseaux",
    "Cybersécurité",
    "Intelligence artificielle",
    "Maintenance",
    "Vidéosurveillance",
  ];
  const marqueeSeq = OUTILS.map((t) => `<span>${t}</span>`).join("");
  const marquee = `<section class="marquee" aria-hidden="true"><div class="marquee__track">${marqueeSeq}${marqueeSeq}</div></section>`;

  const services = site.services
    .slice(0, 8)
    .map(
      (s) => `<article class="card reveal">
      <div class="icon-box">${icon(s.icone)}</div>
      <h3>${esc(s.titre)}</h3>
      <p>${esc(s.texte)}</p>
    </article>`
    )
    .join("");

  const avantages = site.avantages
    .map(
      (a) => `<div class="feature">
      <div class="icon-box icon-box--coral">${icon(a.icone)}</div>
      <div><h3>${esc(a.titre)}</h3><p>${esc(a.texte)}</p></div>
    </div>`
    )
    .join("");

  const etapes = site.etapes
    .map(
      (e, i) => `<div class="step reveal">
      <div class="step__num">0${i + 1}</div>
      <h3>${esc(e.titre)}</h3>
      <p>${esc(e.texte)}</p>
    </div>`
    )
    .join("");

  const body = `
<section class="hero">
  <div class="container hero__inner">
    <div>
      <span class="eyebrow eyebrow--light">Centre informatique · Hêvié, Bénin</span>
      <h1>Devenez un <span class="hl">pro du numérique</span>, formé à Hêvié.</h1>
      <p class="lead">13 filières pratiques — bureautique, graphisme, réseaux, développement, cybersécurité et intelligence artificielle — avec certificat, stage et accompagnement vers l'emploi.</p>
      <div class="hero__actions">
        <a class="btn" href="formations.html">Voir les formations ${icon("arrow")}</a>
        <a class="btn btn--ghost" href="${TEL}">${icon("phone")} ${esc(C.telephone)}</a>
      </div>
      <ul class="hero__trust">
        <li>${icon("check")} Inscription 2 000 FCFA</li>
        <li>${icon("check")} Sessions chaque début de mois</li>
        <li>${icon("check")} Cours du jour ou du soir</li>
      </ul>
    </div>
    <div class="hero__visual">
      <div class="float-card float-card--cert">${icon("badge")}<div>Certificat &amp; attestation<small>légalisation possible</small></div></div>
      <div class="window">
        <div class="window__bar"><i></i><i></i><i></i><span>master-professionnel / progression</span></div>
        <div class="window__body">
          <div class="window__title"><strong>Parcours apprenant</strong><span class="pill pill--green">Session ouverte</span></div>
          <div class="progress"><div class="progress__top"><span>Bureautique appliquée</span><span>85 %</span></div><div class="progress__track"><div class="progress__fill" style="width:85%"></div></div></div>
          <div class="progress"><div class="progress__top"><span>Réseaux &amp; maintenance</span><span>62 %</span></div><div class="progress__track"><div class="progress__fill progress__fill--coral" style="width:62%"></div></div></div>
          <div class="progress"><div class="progress__top"><span>Projet de fin de formation</span><span>40 %</span></div><div class="progress__track"><div class="progress__fill progress__fill--gold" style="width:40%"></div></div></div>
          <div class="window__title" style="margin:18px 0 0"><span class="pill pill--blue">Stage en entreprise</span><span class="pill pill--blue">Encadrement</span></div>
        </div>
      </div>
      <div class="float-card float-card--wa">${icon("whatsapp")}<div>Réponse rapide<small>sur WhatsApp</small></div></div>
    </div>
  </div>
</section>

${marquee}
<section class="stats">
  <div class="container"><div class="stats__grid">${stats}</div></div>
</section>
<section class="section">
  <div class="container">
    <div class="section-head section-head--row">
      <div><span class="eyebrow">Nos filières</span><h2>Des formations concrètes, du niveau débutant au niveau pro</h2>
      <p class="lead">Choisissez votre métier : chaque filière combine cours, ateliers pratiques et projet de fin de formation.</p></div>
      <a class="link-arrow" href="formations.html">Toutes les filières ${icon("arrow")}</a>
    </div>
    <div class="grid grid--3">${phares.map((f, i) => fcard(f, i)).join("")}</div>
  </div>
</section>

<section class="section section--soft">
  <div class="container">
    <div class="section-head section-head--center"><span class="eyebrow">Nos services</span><h2>Tout l'informatique, au même endroit</h2>
    <p class="lead">Le centre ne forme pas seulement : il équipe, dépanne, installe et sécurise les particuliers comme les entreprises.</p></div>
    <div class="grid grid--4">${services}</div>
    <div style="text-align:center;margin-top:34px"><a class="btn btn--outline" href="services.html">Découvrir tous les services ${icon("arrow")}</a></div>
  </div>
</section>

<section class="section section--white">
  <div class="container">
    <div class="contact-grid" style="align-items:center">
      <div>
        <span class="eyebrow">Pourquoi nous</span>
        <h2 style="margin-top:14px">Un accompagnement qui va jusqu'à l'emploi</h2>
        <p class="lead" style="margin-top:14px">Nous formons depuis plus de quinze ans des apprenants de tous niveaux, avec une exigence simple : savoir faire, pas seulement savoir.</p>
        <div style="margin-top:26px">${avantages}</div>
      </div>
      <div class="card" style="padding:28px">
        <h3 style="margin-bottom:14px">Ce qui est inclus</h3>
        <ul class="checklist">
          <li>${icon("check")}<span>Supports de cours et exercices pratiques</span></li>
          <li>${icon("check")}<span>Encadrement par un ingénieur en informatique</span></li>
          <li>${icon("check")}<span>Ateliers en petit groupe, matériel fourni</span></li>
          <li>${icon("check")}<span>Stage et mise en relation avec les partenaires</span></li>
          <li>${icon("check")}<span>Attestation de fin de formation</span></li>
          <li>${icon("check")}<span>Accompagnement post-formation</span></li>
        </ul>
        <a class="btn btn--block" style="margin-top:22px" href="inscriptions.html">Je m'inscris ${icon("arrow")}</a>
        <p class="form__note" style="margin-top:12px">${esc(data.meta.note)}</p>
      </div>
    </div>
  </div>
</section>

<section class="section section--coral">
  <div class="container">
    <div class="section-head section-head--center"><span class="eyebrow">Inscription</span><h2>Trois étapes, et vous commencez</h2></div>
    <div class="steps">${etapes}</div>
    <div style="text-align:center;margin-top:32px"><a class="btn" href="inscriptions.html">Voir la procédure complète ${icon("arrow")}</a></div>
  </div>
</section>

<section class="section section--soft">
  <div class="container">
    <div class="founder">
      <div class="card founder__card">
        <img class="founder__photo" src="${site.fondateur.photo}" alt="Portrait de ${esc(site.fondateur.nom)}" width="120" height="120">
        <h3>${esc(site.fondateur.nom)}</h3>
        <p>${esc(site.fondateur.role)}</p>
        <a class="link-arrow" href="a-propos.html" style="margin-top:14px">En savoir plus ${icon("arrow")}</a>
      </div>
      <div>
        <span class="eyebrow">Le fondateur</span>
        <h2 style="margin-top:14px">Un ingénieur qui enseigne ce qu'il pratique</h2>
        <p class="lead" style="margin-top:14px">${esc(site.fondateur.bio)}</p>
        <ul class="checklist" style="margin-top:20px">${site.fondateur.points
          .map((p) => `<li>${icon("check")}<span>${esc(p)}</span></li>`)
          .join("")}</ul>
      </div>
    </div>
  </div>
</section>

${avisSection(6)}
${ctaBand()}
`;

  const jsonld = `<script type="application/ld+json">
${JSON.stringify(
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: site.marque.nom_complet,
    alternateName: site.marque.surnom,
    description:
      "Centre de formation informatique à Hêvié (Bénin) : bureautique, graphisme, réseaux, développement web, cybersécurité, intelligence artificielle.",
    telephone: C.telephone,
    email: C.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: C.adresse,
      addressLocality: "Hêvié",
      addressCountry: "BJ",
    },
    geo: { "@type": "GeoCoordinates", latitude: C.coordonnees.lat, longitude: C.coordonnees.lng },
    sameAs: site.reseaux.map((r) => r.url),
    ...(AVIS.length >= 3
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: noteGlobale(),
            reviewCount: nbAvis(),
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  },
  null,
  2
)}
</script>`;

  return layout({
    title: "Master Professionnel — Formations en informatique à Hêvié, Bénin",
    description:
      "Centre informatique Master Professionnel à Hêvié : 13 filières (bureautique, graphisme, réseaux, développement web, cybersécurité, IA), services informatiques et accompagnement vers l'emploi.",
    active: "accueil",
    body,
    jsonld,
  });
};

/* --------------------------------------------------------------- formations */
const formationsPage = () => {
  const chips = data.categories
    .map(
      (c, i) =>
        `<button class="chip${i === 0 ? " is-active" : ""}" type="button" data-filter="${c.id}" aria-pressed="${
          i === 0 ? "true" : "false"
        }">${esc(c.label)}</button>`
    )
    .join("");
  const cards = data.filiere.map((f, i) => fcard(f, i)).join("");

  const body = `
${pageHead(
  "Nos 13 filières de formation",
  "Du premier contact avec un ordinateur à la cybersécurité et à l'intelligence artificielle : des parcours progressifs, pratiques et accessibles à tous les niveaux.",
  `<a href="index.html">Accueil</a> <span>›</span> <span aria-current="page">Formations</span>`
)}
<section class="section">
  <div class="container">
    <div class="filters" role="group" aria-label="Filtrer les formations">${chips}</div>
    <p class="small muted" style="margin-bottom:22px"><strong data-count>${data.filiere.length}</strong> filières affichées</p>
    <div class="grid grid--3">${cards}</div>
    <p class="form__note" style="margin-top:26px">${esc(data.meta.note)} Les frais d'inscription sont de ${esc(
      site.pieces[site.pieces.length - 1].replace("Frais d'inscription : ", "")
    )} pour la plupart des filières.</p>
  </div>
</section>
${ctaBand()}
`;
  return layout({
    title: "Formations & tarifs — Master Professionnel Hêvié",
    description:
      "13 filières de formation informatique à Hêvié : initiation, secrétariat, graphisme, maintenance, réseaux, cybersécurité, développement web, IA. Durées et tarifs.",
    active: "formations",
    body,
  });
};

const fichePage = (f, index) => {
  const base = "../";
  const autres = data.filiere
    .filter((x) => x.slug !== f.slug)
    .slice(0, 3)
    .map((x, i) => fcard(x, i, base))
    .join("");

  const body = `
<section class="page-head">
  <div class="container">
    <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="${base}index.html">Accueil</a> <span>›</span> <a href="${base}formations.html">Formations</a> <span>›</span> <span aria-current="page">${esc(
    f.nom
  )}</span></nav>
    <h1>${esc(f.nom)}</h1>
    <p class="lead" style="color:#C6D6F2">${esc(f.resume)}</p>
    <div class="btn-row" style="margin-top:22px">
      <span class="pill pill--blue">${icon("clock")} ${esc(f.duree)}</span>
      <span class="pill pill--blue">${esc(catLabel(f.categorie))}</span>
      <span class="pill pill--green">Sessions chaque mois</span>
    </div>
  </div>
</section>
<section class="section">
  <div class="container detail">
    <div class="detail__body">
      <h2>Ce que vous saurez faire</h2>
      <ul class="checklist">${f.objectifs
        .map((o) => `<li>${icon("check")}<span>${esc(o)}</span></li>`)
        .join("")}</ul>

      <h2>Programme de la formation</h2>
      <ol class="steps-list">${f.programme.map((m) => `<li>${esc(m)}</li>`).join("")}</ol>

      <h2>Débouchés</h2>
      <p>À la fin du parcours, vous pouvez viser notamment :</p>
      <div class="filters" style="margin:14px 0 0">${f.debouches
        .map((d) => `<span class="chip">${esc(d)}</span>`)
        .join("")}</div>

      <h2>Informations pratiques</h2>
      <div class="grid grid--2">
        ${site.infos_pratiques
          .map(
            (i) => `<div class="card" style="padding:18px"><h4>${esc(i.titre)}</h4><p style="margin-top:6px">${esc(
              i.texte
            )}</p></div>`
          )
          .join("")}
      </div>
    </div>

    <aside class="card aside-card">
      <p class="price-label">Tarif de la formation</p>
      <p class="price">${esc(f.prix)} <small>FCFA</small></p>
      <p class="small muted">${f.prix_texte.includes("–") ? "Selon le programme choisi" : "Tarif indiqué"}</p>
      <ul>
        <li><span>Durée</span><b>${esc(f.duree)}</b></li>
        <li><span>Inscription</span><b>${esc(f.inscription ? f.inscription : "2 000 FCFA")}</b></li>
        <li><span>Rythme</span><b>Jour ou soir</b></li>
        <li><span>Formule</span><b>Présentiel ou en ligne</b></li>
      </ul>
      <a class="btn btn--wa btn--block" href="${waLink(
        `Bonjour, je souhaite m'inscrire à la filière « ${f.nom} ». Pouvez-vous me donner les modalités ?`
      )}" target="_blank" rel="noopener">${icon("whatsapp")} Se pré-inscrire</a>
      <a class="btn btn--outline btn--block" style="margin-top:10px" href="${TEL}">${icon("phone")} Appeler le centre</a>
      <p class="form__note" style="margin-top:14px">${esc(data.meta.note)}</p>
    </aside>
  </div>
</section>

<section class="section section--soft">
  <div class="container">
    <div class="section-head"><span class="eyebrow">À découvrir aussi</span><h2>Autres filières</h2></div>
    <div class="grid grid--3">${autres}</div>
  </div>
</section>
`;
  return layout({
    base,
    title: `${f.nom} — Formation à Hêvié | Master Professionnel`,
    description: `${f.nom} à Hêvié (Bénin) : ${f.duree}, ${f.prix_texte}. ${f.resume}`,
    active: "formations",
    body,
  });
};

/* ---------------------------------------------------------------- services */
const servicesPage = () => {
  const cards = site.services
    .map(
      (s) => `<article class="card reveal">
      <div class="icon-box">${icon(s.icone)}</div>
      <h3>${esc(s.titre)}</h3>
      <p>${esc(s.texte)}</p>
    </article>`
    )
    .join("");
  const body = `
${pageHead(
  "Services informatiques",
  "Vente de matériel, maintenance, réseaux, vidéosurveillance, développement web, cybersécurité et formation : le centre couvre l'ensemble de vos besoins numériques.",
  `<a href="index.html">Accueil</a> <span>›</span> <span aria-current="page">Services</span>`
)}
<section class="section">
  <div class="container">
    <div class="grid grid--4">${cards}</div>
  </div>
</section>
<section class="section section--soft">
  <div class="container">
    <div class="section-head section-head--center"><span class="eyebrow">Notre méthode</span><h2>Une intervention simple et suivie</h2></div>
    <div class="steps">
      <div class="step"><div class="step__num">01</div><h3>Vous nous décrivez le besoin</h3><p>Par téléphone, WhatsApp ou au centre. Nous posons les bonnes questions pour cerner le problème.</p></div>
      <div class="step"><div class="step__num">02</div><h3>Nous proposons un devis clair</h3><p>Diagnostic, pièces nécessaires, délai et coût : tout est annoncé avant l'intervention.</p></div>
      <div class="step"><div class="step__num">03</div><h3>Nous intervenons et assurons le suivi</h3><p>Réparation, installation ou livraison, puis accompagnement si le besoin revient.</p></div>
    </div>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="cta-band reveal">
      <h2>Un besoin précis ? Demandez un devis.</h2>
      <p>Décrivez votre matériel ou votre projet : nous revenons vers vous avec une proposition adaptée.</p>
      <div class="btn-row">
        <a class="btn" href="${waLink("Bonjour, je souhaite un devis pour un service informatique.")}" target="_blank" rel="noopener">${icon("whatsapp")} Demander un devis</a>
        <a class="btn btn--ghost" href="contact.html">Nous contacter ${icon("arrow")}</a>
      </div>
    </div>
  </div>
</section>
`;
  return layout({
    title: "Services informatiques à Hêvié — Master Professionnel",
    description:
      "Vente de matériel, maintenance, mécanographie, réseaux, vidéosurveillance, développement web, cybersécurité et formation à Hêvié, Bénin.",
    active: "services",
    body,
  });
};

/* ------------------------------------------------------------ inscriptions */
const inscriptionsPage = () => {
  const pieces = site.pieces.map((p) => `<li>${icon("check")}<span>${esc(p)}</span></li>`).join("");
  const paiements = site.paiement
    .map((p) => `<div class="pay-card"><b>${esc(p.operateur)}</b><span>${esc(p.numero)}</span></div>`)
    .join("");
  const faq = site.faq
    .map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.r)}</p></details>`)
    .join("");
  const options = data.filiere
    .map((f) => `<option value="${esc(f.nom)}">${esc(f.nom)}</option>`)
    .join("");

  const body = `
${pageHead(
  "Inscriptions",
  "Les inscriptions sont ouvertes toute l'année. Sessions chaque début de mois, cours du jour ou du soir, en présentiel ou en ligne.",
  `<a href="index.html">Accueil</a> <span>›</span> <span aria-current="page">Inscriptions</span>`
)}
<section class="section">
  <div class="container">
    <div class="steps">
      ${site.etapes
        .map(
          (e, i) => `<div class="step"><div class="step__num">0${i + 1}</div><h3>${esc(e.titre)}</h3><p>${esc(
            e.texte
          )}</p></div>`
        )
        .join("")}
    </div>
  </div>
</section>

<section class="section section--soft">
  <div class="container">
    <div class="grid grid--2">
      <div class="card" style="padding:28px">
        <span class="eyebrow">Dossier</span>
        <h2 style="margin:12px 0 16px;font-size:1.4rem">Pièces à fournir</h2>
        <ul class="checklist">${pieces}</ul>
        <p class="pill pill--green" style="margin-top:20px">Clé USB offerte aux 30 premiers inscrits</p>
      </div>
      <div class="card" style="padding:28px">
        <span class="eyebrow">Informations pratiques</span>
        <h2 style="margin:12px 0 16px;font-size:1.4rem">À savoir avant de venir</h2>
        <ul class="checklist">
          ${site.infos_pratiques
            .map((i) => `<li>${icon("check")}<span><strong>${esc(i.titre)} :</strong> ${esc(i.texte)}</span></li>`)
            .join("")}
        </ul>
        <div style="margin-top:20px;padding:16px;border-radius:12px;background:var(--coral-100)">
          <p class="small" style="color:var(--coral-600);font-weight:700">Frais d'inscription : 2 000 FCFA (hors filières à inscription spécifique)</p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="contact-grid">
      <div>
        <span class="eyebrow">Formulaire</span>
        <h2 style="margin:14px 0 10px">Pré-inscription en ligne</h2>
        <p class="lead">Remplissez ce formulaire : votre demande s'ouvre directement dans WhatsApp, prête à être envoyée. Nous confirmons votre place et la date de session.</p>
        <div class="info-list" style="margin-top:24px">
          <div class="info-item">${icon("phone")}<div><strong>Téléphone</strong><a href="${TEL}">${esc(C.telephone)}</a></div></div>
          <div class="info-item">${icon("mail")}<div><strong>E-mail</strong><a href="${MAIL}">${esc(C.email)}</a></div></div>
        </div>
      </div>
      <form class="card form" data-wa-form data-wa-number="${C.whatsapp}" data-wa-intro="Bonjour, je souhaite me pré-inscrire à une formation." style="padding:26px">
        <div class="form__row">
          <div class="field"><label for="nom">Nom et prénoms *</label><input id="nom" name="nom" data-label="Nom" required placeholder="Votre nom complet"></div>
          <div class="field"><label for="tel">Téléphone / WhatsApp *</label><input id="tel" name="telephone" data-label="Téléphone" required inputmode="tel" placeholder="+229 …"></div>
        </div>
        <div class="form__row">
          <div class="field"><label for="filiere">Filière souhaitée *</label>
            <select id="filiere" name="filiere" data-label="Filière" required>
              <option value="">Choisir une filière…</option>${options}
            </select>
          </div>
          <div class="field"><label for="rythme">Rythme préféré</label>
            <select id="rythme" name="rythme" data-label="Rythme">
              <option value="Jour">Jour</option><option value="Soir">Soir</option><option value="Peu importe">Peu importe</option>
            </select>
          </div>
        </div>
        <div class="field"><label for="message">Votre message</label><textarea id="message" name="message" data-label="Message" placeholder="Précisez votre niveau, votre disponibilité, vos questions…"></textarea></div>
        <button class="btn btn--wa" type="submit">${icon("whatsapp")} Envoyer via WhatsApp</button>
        <p class="form__note">Aucune donnée n'est stockée sur ce site : le message est préparé puis envoyé depuis votre application WhatsApp. Vous pouvez aussi nous écrire à <a href="${MAIL}">${esc(C.email)}</a>.</p>
        <p class="form__status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </div>
</section>

<section class="section section--soft">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Paiement</span><h2>Régler les frais d'inscription</h2>
    <p class="lead">Au centre, par Mobile Money ou par virement. Conservez toujours la preuve de paiement et transmettez-la sur WhatsApp.</p></div>
    <div class="pay-grid">${paiements}</div>
    <p class="form__note" style="margin-top:16px">Bénéficiaire : ${esc(site.paiement[0].nom)}. Les coordonnées bancaires et l'adresse de réception des cryptomonnaies sont communiquées sur demande.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Questions fréquentes</span><h2>Vous vous demandez…</h2></div>
    <div class="faq">${faq}</div>
  </div>
</section>
`;
  return layout({
    title: "Inscription & pré-inscription — Master Professionnel Hêvié",
    description:
      "Inscrivez-vous au Centre informatique Master Professionnel à Hêvié : pièces à fournir, frais d'inscription 2 000 FCFA, modalités de paiement et formulaire de pré-inscription.",
    active: "inscriptions",
    body,
  });
};

/* ---------------------------------------------------------------- à propos */
const aproposPage = () => {
  const certs = site.certifications
    .map(
      (c) => `<div class="cert">${icon("badge")}<div><b>${esc(c.titre)}</b><span>${esc(
        c.organisme
      )} · ${esc(c.date)}</span>${c.url ? `<br><a href="${c.url}" target="_blank" rel="noopener">Vérifier le certificat</a>` : ""}</div></div>`
    )
    .join("");

  const body = `
${pageHead(
  "Le centre, le fondateur, la méthode",
  "Master Professionnel est un centre informatique installé à Hêvié, porté par un ingénieur qui forme depuis 2006 et qui croit à une informatique utile, concrète et accessible.",
  `<a href="index.html">Accueil</a> <span>›</span> <span aria-current="page">À propos</span>`
)}
<section class="section">
  <div class="container">
    <div class="grid grid--2" style="gap:40px;align-items:start">
      <div>
        <span class="eyebrow">Notre histoire</span>
        <h2 style="margin:14px 0 16px">« Les Solidaires de l'informatique »</h2>
        <p class="lead">Né d'une conviction simple — le numérique ne vaut que s'il se transmet — le centre accompagne les jeunes, les professionnels et les entreprises de Hêvié et des environs.</p>
        <p style="margin-top:16px;color:var(--muted)">Nous proposons des formations pratiques, du matériel, de la maintenance, des installations réseaux et des solutions numériques. Chaque apprenant est suivi, du premier cours jusqu'à son insertion professionnelle.</p>
        <ul class="checklist" style="margin-top:22px">
          <li>${icon("check")}<span>Un encadrement de proximité, en petit groupe</span></li>
          <li>${icon("check")}<span>Une pédagogie 100 % pratique, sur du matériel réel</span></li>
          <li>${icon("check")}<span>Des sessions qui démarrent chaque mois</span></li>
          <li>${icon("check")}<span>Un lien direct avec les structures partenaires</span></li>
        </ul>
      </div>
      <div class="card" style="padding:28px">
        <h3 style="margin-bottom:16px">Le centre en bref</h3>
        <ul class="facts">
          <li><span>Nom</span><b>${esc(site.marque.nom_complet)}</b></li>
          <li><span>Activité</span><b>Formation &amp; services informatiques</b></li>
          <li><span>Adresse</span><b>${esc(C.adresse_courte)}</b></li>
          <li><span>Téléphone</span><b>${esc(C.telephone)}</b></li>
          <li><span>E-mail</span><b>${esc(C.email)}</b></li>
          <li><span>IFU</span><b>${esc(site.legal.ifu)}</b></li>
          <li><span>RCCM</span><b>${esc(site.legal.rccm)}</b></li>
        </ul>
        <a class="btn btn--block" style="margin-top:20px" href="contact.html">Nous rendre visite ${icon("arrow")}</a>
      </div>
    </div>
  </div>
</section>

<section class="section section--soft">
  <div class="container">
    <div class="founder">
      <div class="card founder__card">
        <img class="founder__photo" src="${site.fondateur.photo}" alt="Portrait de ${esc(site.fondateur.nom)}" width="120" height="120">
        <h3>${esc(site.fondateur.nom)}</h3>
        <p>${esc(site.fondateur.alias)} · ${esc(site.fondateur.role)}</p>
      </div>
      <div>
        <span class="eyebrow">Portrait</span>
        <h2 style="margin:14px 0 16px">Un praticien devenu formateur</h2>
        <p class="lead">${esc(site.fondateur.bio)}</p>
        <ul class="checklist" style="margin-top:22px">${site.fondateur.points
          .map((p) => `<li>${icon("check")}<span>${esc(p)}</span></li>`)
          .join("")}</ul>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Certifications</span><h2>Des compétences vérifiables</h2>
    <p class="lead">Formations suivies et certifiées auprès d'organismes reconnus, dans les domaines enseignés au centre.</p></div>
    <div class="cert-grid">${certs}</div>
  </div>
</section>

<section class="section section--soft">
  <div class="container">
    <div class="section-head section-head--row">
      <div>
        <span class="eyebrow">Publications</span>
        <h2 style="margin-top:14px">Livres et manuels du fondateur</h2>
        <p class="lead">Essais sur l'intelligence artificielle et la société, récits, poésie, et les manuels utilisés au centre — plus de vingt supports conçus depuis 2006.</p>
      </div>
      <a class="link-arrow" href="publications.html">Tout le catalogue ${icon("arrow")}</a>
    </div>
    <div class="books books--4">${site.catalogue.ouvrages.map(bookCard).join("")}</div>
  </div>
</section>
${ctaBand()}
`;
  return layout({
    title: "À propos — Master Professionnel, Hêvié (Bénin)",
    description:
      "Découvrez le Centre informatique Master Professionnel à Hêvié, son fondateur AGONGLO Amédée Brice (Papirus Brice), ses certifications et ses ouvrages.",
    active: "apropos",
    body,
  });
};

/* ------------------------------------------------------------ publications */
const publicationsPage = () => {
  const bloc = (eyebrow, titre, intro, items, cols, soft) => `<section class="section${
    soft ? " section--soft" : ""
  }">
  <div class="container">
    <div class="section-head"><span class="eyebrow">${eyebrow}</span><h2>${titre}</h2><p class="lead">${intro}</p></div>
    <div class="books books--${cols}">${items.map(bookCard).join("")}</div>
  </div>
</section>`;

  const body = `
${pageHead(
  "Livres, manuels et guides",
  "Le centre écrit et conçoit ses propres supports : essais, récits, poésie, manuels informatiques et guides pratiques d'élevage.",
  `<a href="index.html">Accueil</a> <span>›</span> <span aria-current="page">Publications</span>`
)}
${bloc(
  "Ouvrages",
  "Essais, récits et poésie",
  "Quatre ouvrages signés Papirus Brice : histoire et souveraineté africaine, intelligence artificielle et travail, récit, poésie.",
  site.catalogue.ouvrages,
  4,
  false
)}
${bloc(
  "Manuels informatiques",
  "Les supports de cours du centre",
  "Conçus pour les formations Master Professionnel : cybersécurité, bureautique, graphisme et programmation appliquée à la santé.",
  site.catalogue.informatique,
  4,
  true
)}
${bloc(
  "Guides pratiques",
  "La collection élevage",
  "Cinq guides de terrain pour l'élevage familial ou professionnel : poulet, aliment, phytothérapie, comptabilité et espèces variées.",
  site.catalogue.elevage,
  5,
  false
)}
<section class="section section--soft">
  <div class="container">
    <div class="card" style="padding:28px;display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between">
      <div style="min-width:240px">
        <h3>Commander un ouvrage</h3>
        <p class="small muted" style="margin-top:6px">Disponibles au centre, en version physique et numérique.</p>
      </div>
      <div class="pay-grid" style="grid-template-columns:1fr 1fr;gap:12px">
        <div class="pay-card"><b>E-book</b><span>5 000 FCFA</span></div>
        <div class="pay-card"><b>Version physique</b><span>9 800 FCFA</span></div>
      </div>
      <a class="btn btn--wa" href="${waLink(
        "Bonjour, je souhaite commander un ouvrage de Papirus Brice."
      )}" target="_blank" rel="noopener">${icon("whatsapp")} Commander</a>
    </div>
  </div>
</section>
`;
  return layout({
    title: "Livres et manuels — Master Professionnel & Papirus Brice",
    description:
      "Catalogue des ouvrages et supports de cours de Papirus Brice : essais sur l'IA, récits, poésie, manuels de cybersécurité, bureautique, graphisme et guides d'élevage.",
    active: "publications",
    body,
  });
};

/* ----------------------------------------------------------------- contact */
const contactPage = () => {
  const paiements = site.paiement
    .map((p) => `<div class="pay-card"><b>${esc(p.operateur)}</b><span>${esc(p.numero)}</span></div>`)
    .join("");
  const body = `
${pageHead(
  "Parlons de votre projet",
  "Une question sur une formation, un devis, une visite au centre : nous répondons par téléphone, WhatsApp ou e-mail.",
  `<a href="index.html">Accueil</a> <span>›</span> <span aria-current="page">Contact</span>`
)}
<section class="section">
  <div class="container contact-grid">
    <div>
      <span class="eyebrow">Coordonnées</span>
      <h2 style="margin:14px 0 20px">Nous trouver à Hêvié</h2>
      <div class="info-list">
        <div class="info-item">${icon("pin")}<div><strong>Adresse</strong><p>${esc(C.adresse)}</p></div></div>
        <div class="info-item">${icon("phone")}<div><strong>Téléphone</strong><a href="${TEL}">${esc(C.telephone)}</a></div></div>
        <div class="info-item">${icon("whatsapp")}<div><strong>WhatsApp</strong><a href="${W}" target="_blank" rel="noopener">Discuter maintenant</a></div></div>
        <div class="info-item">${icon("mail")}<div><strong>E-mail</strong><a href="${MAIL}">${esc(C.email)}</a></div></div>
        <div class="info-item">${icon("clock")}<div><strong>Horaires</strong><p>${site.contact.horaires
          .map((h) => `${h.jours} : ${h.heures}`)
          .join(" · ")}</p></div></div>
      </div>
      <h3 style="margin:28px 0 0;font-size:1.02rem">Suivez le centre</h3>
      <div class="social-links">
        ${site.reseaux
          .map(
            (r) =>
              `<a class="social-link" href="${r.url}" target="_blank" rel="noopener">${social(
                r.nom.toLowerCase()
              )}<span>${esc(r.nom)}</span></a>`
          )
          .join("")}
      </div>
      <div class="btn-row" style="margin-top:20px">
        <a class="btn" href="${C.maps_url}" target="_blank" rel="noopener">${icon("pin")} Ouvrir dans Google Maps</a>
        <a class="btn btn--outline" href="${AVIS_URL}" target="_blank" rel="noopener">${icon("star")} Avis Google</a>
      </div>
    </div>
    <div>
      <div class="map">
        <iframe src="${C.maps_embed}" title="Carte — Centre informatique Master Professionnel, Hêvié" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
      <form class="card form" data-wa-form data-wa-number="${C.whatsapp}" data-wa-intro="Bonjour, je vous contacte depuis le site." style="padding:26px;margin-top:20px">
        <h3>Envoyer un message</h3>
        <div class="form__row">
          <div class="field"><label for="c-nom">Nom *</label><input id="c-nom" name="nom" data-label="Nom" required placeholder="Votre nom"></div>
          <div class="field"><label for="c-tel">Téléphone *</label><input id="c-tel" name="telephone" data-label="Téléphone" required inputmode="tel" placeholder="+229 …"></div>
        </div>
        <div class="field"><label for="c-sujet">Sujet</label>
          <select id="c-sujet" name="sujet" data-label="Sujet">
            <option>Information sur une formation</option>
            <option>Devis service informatique</option>
            <option>Partenariat</option>
            <option>Autre</option>
          </select>
        </div>
        <div class="field"><label for="c-msg">Message *</label><textarea id="c-msg" name="message" data-label="Message" required placeholder="Votre message…"></textarea></div>
        <button class="btn btn--wa" type="submit">${icon("whatsapp")} Envoyer via WhatsApp</button>
        <p class="form__note">Le message est préparé ici puis envoyé depuis WhatsApp. Vous pouvez aussi écrire à <a href="${MAIL}">${esc(C.email)}</a>.</p>
        <p class="form__status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </div>
</section>
<section class="section section--soft">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Paiement</span><h2>Moyens de paiement acceptés</h2></div>
    <div class="pay-grid">${paiements}</div>
    <p class="form__note" style="margin-top:14px">Bénéficiaire : ${esc(site.paiement[0].nom)}. Demandez le reçu lors de votre passage au centre.</p>
  </div>
</section>
`;
  return layout({
    title: "Contact — Master Professionnel Hêvié",
    description:
      "Contactez le Centre informatique Master Professionnel à Hêvié : téléphone +229 01 95 81 81 67, WhatsApp, e-mail, adresse et horaires.",
    active: "contact",
    body,
  });
};

/* ----------------------------------------------------------------- légales */
const legalPage = (which) => {
  const base = "";
  const isMentions = which === "mentions-legales";
  const title = isMentions ? "Mentions légales" : "Politique de confidentialité";
  const description = isMentions
    ? "Mentions légales du site du Centre informatique Master Professionnel (Hêvié, Bénin) : éditeur, hébergeur, propriété intellectuelle."
    : "Politique de confidentialité du site Master Professionnel : données collectées, cookies, vos droits.";

  const mentions = `
    <h2>Éditeur du site</h2>
    <p>${esc(site.legal.raison_sociale)} — ${esc(site.marque.surnom)}<br>
    ${esc(C.adresse)}<br>
    Téléphone : ${esc(C.telephone)} — E-mail : ${esc(C.email)}<br>
    Responsable de la publication : ${esc(site.legal.responsable)}<br>
    IFU : ${esc(site.legal.ifu)} — RCCM : ${esc(site.legal.rccm)}</p>
    <h2>Hébergement</h2>
    <p>${esc(site.legal.hebergeur)}</p>
    <h2>Propriété intellectuelle</h2>
    <p>L'ensemble des contenus de ce site (textes, logo, éléments graphiques, structure) est la propriété du ${esc(
      site.legal.raison_sociale
    )}, sauf mention contraire. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.</p>
    <h2>Responsabilité</h2>
    <p>Les informations publiées (filières, durées, tarifs) sont données à titre indicatif et peuvent évoluer. Le tarif applicable est celui confirmé au moment de l'inscription. Le centre ne saurait être tenu responsable des interruptions de service liées à l'hébergement ou à la connexion Internet de l'utilisateur.</p>
    <h2>Liens externes</h2>
    <p>Le site contient des liens vers des services tiers (WhatsApp, Google Maps, réseaux sociaux, plateformes de vérification de certificats). Leur utilisation est soumise à leurs propres conditions.</p>
    <h2>Droit applicable</h2>
    <p>Le présent site est soumis au droit béninois. Tout litige relève des juridictions compétentes de Cotonou.</p>`;

  const privacy = `
    <h2>Principe</h2>
    <p>Ce site est un site vitrine. Il ne crée pas de compte, n'enregistre pas de base de données de visiteurs et ne dépose aucun cookie publicitaire ou de suivi.</p>
    <h2>Données que vous nous transmettez</h2>
    <p>Les formulaires de pré-inscription et de contact ne sont pas envoyés à un serveur : ils préparent un message que vous choisissez d'envoyer vous-même via WhatsApp ou par e-mail. Les informations transmises (nom, téléphone, filière, message) servent uniquement à répondre à votre demande et à traiter votre inscription. Elles ne sont ni revendues, ni cédées à des tiers.</p>
    <h2>Cookies</h2>
    <p>Aucun cookie de mesure d'audience ou de publicité n'est utilisé. Les services intégrés (carte Google Maps, liens WhatsApp) peuvent déposer leurs propres cookies lorsque vous interagissez avec eux ; nous vous invitons à consulter leurs politiques respectives.</p>
    <h2>Durée de conservation</h2>
    <p>Les échanges reçus par WhatsApp ou par e-mail sont conservés le temps nécessaire au traitement de la demande et au suivi de l'inscription, puis archivés ou supprimés.</p>
    <h2>Vos droits</h2>
    <p>Vous pouvez demander l'accès, la rectification ou la suppression de vos données en écrivant à <a href="${MAIL}">${esc(
      C.email
    )}</a> ou en appelant le ${esc(C.telephone)}.</p>
    <h2>Sécurité</h2>
    <p>Le site est servi en HTTPS par son hébergeur. Nous vous recommandons de ne jamais transmettre de mot de passe ou de données bancaires par messagerie.</p>`;

  const body = `
${pageHead(
  title,
  isMentions
    ? "Informations légales relatives à l'éditeur et à l'hébergement de ce site."
    : "Comment ce site traite vos données et respecte votre vie privée.",
  `<a href="index.html">Accueil</a> <span>›</span> <span aria-current="page">${title}</span>`
)}
<section class="section">
  <div class="container" style="max-width:820px">
    <div class="detail__body" style="font-size:.97rem;color:#37475F">
      ${isMentions ? mentions : privacy}
      <p class="form__note" style="margin-top:32px">Dernière mise à jour : novembre 2026.</p>
    </div>
  </div>
</section>`;
  return layout({ title: `${title} — Master Professionnel`, description, active: "", body });
};

/* -------------------------------------------------------------------- 404 */
const notFound = () =>
  layout({
    title: "Page introuvable — Master Professionnel",
    description: "La page demandée n'existe pas ou a été déplacée.",
    body: `<section class="page-head"><div class="container"><h1>Page introuvable</h1>
    <p class="lead" style="color:#C6D6F2">Cette page n'existe pas ou a été déplacée.</p></div></section>
    <section class="section"><div class="container" style="text-align:center">
    <p class="lead" style="max-width:46ch;margin:0 auto 24px">Retournez à l'accueil ou parcourez nos filières de formation.</p>
    <div class="btn-row" style="justify-content:center"><a class="btn" href="index.html">Accueil ${icon(
      "arrow"
    )}</a><a class="btn btn--outline" href="formations.html">Les formations</a></div>
    </div></section>`,
  });

/* ------------------------------------------------------------------ écriture */
const write = (path, content) => {
  const full = join(ROOT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content.replace(/__PATH__/g, path === "index.html" ? "" : path), "utf8");
  return path;
};

const files = [];
files.push(write("index.html", home()));
files.push(write("formations.html", formationsPage()));
files.push(write("services.html", servicesPage()));
files.push(write("inscriptions.html", inscriptionsPage()));
files.push(write("a-propos.html", aproposPage()));
files.push(write("contact.html", contactPage()));
files.push(write("galerie.html", galeriePage()));
files.push(write("publications.html", publicationsPage()));
if (AVIS.length >= 3) files.push(write("avis.html", avisPage()));
files.push(write("mentions-legales.html", legalPage("mentions-legales")));
files.push(write("confidentialite.html", legalPage("confidentialite")));
files.push(write("404.html", notFound()));
data.filiere.forEach((f, i) => files.push(write(`formations/${f.slug}.html`, fichePage(f, i))));

/* --------------------------------------------------------------- SEO */
const PAGES_SEO = [
  "index.html",
  "formations.html",
  "services.html",
  "galerie.html",
  "publications.html",
  "avis.html",
  "inscriptions.html",
  "a-propos.html",
  "contact.html",
  "mentions-legales.html",
  "confidentialite.html",
  ...data.filiere.map((f) => `formations/${f.slug}.html`),
];
const jour = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES_SEO.map(
  (p) =>
    `  <url><loc>${SITE_URL}${p === "index.html" ? "" : p}</loc><lastmod>${jour}</lastmod><changefreq>${
      p === "index.html" ? "weekly" : "monthly"
    }</changefreq><priority>${p === "index.html" ? "1.0" : "0.7"}</priority></url>`
).join("\n")}
</urlset>
`;
files.push(write("sitemap.xml", sitemap));
files.push(write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`));

console.log(`${files.length} pages générées :`);
files.forEach((f) => console.log(" - " + f));

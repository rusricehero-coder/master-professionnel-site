/* Petites fonctions partagées par les pages de l'espace membre. */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function alerte(el, texte, type = "info") {
  if (!el) return;
  el.textContent = texte;
  el.className = "alert alert--" + type;
  el.hidden = !texte;
}

export function dateFr(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function badgeStatut(statut) {
  const map = {
    en_attente: ["En attente", "badge--attente"],
    validee: ["Validée", "badge--validee"],
    refusee: ["Refusée", "badge--refusee"],
  };
  const [label, cls] = map[statut] || [statut, "badge--attente"];
  return `<span class="badge ${cls}">${label}</span>`;
}

export function echappe(txt) {
  return String(txt ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function profilCourant(supabase) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nom, telephone, email, role")
    .eq("id", session.user.id)
    .single();
  if (error) return { id: session.user.id, role: "apprenant", nom: "", email: session.user.email };
  return data;
}

export function deconnecter(supabase) {
  return supabase.auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}

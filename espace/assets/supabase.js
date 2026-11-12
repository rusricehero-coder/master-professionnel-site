/* Initialisation du client Supabase (clé publique uniquement). */
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg = window.MP_CONFIG || {};

export const configured = Boolean(
  cfg.SUPABASE_URL &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes("VOTRE") &&
    !cfg.SUPABASE_ANON_KEY.includes("VOTRE")
);

export const supabase = createClient(
  configured ? cfg.SUPABASE_URL : "https://exemple.supabase.co",
  configured ? cfg.SUPABASE_ANON_KEY : "cle-publique"
);

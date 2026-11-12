// =====================================================================
//  Supabase Edge Function — jitsi-token
//  Délivre un jeton JaaS signé UNIQUEMENT à un apprenant invité (ou admin).
//  Secrets à définir : JAAS_APP_ID, JAAS_KEY_ID, JAAS_PRIVATE_KEY
//  (JAAS_PRIVATE_KEY = contenu intégral du fichier .pk, lignes BEGIN/END incluses)
// =====================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_ID = Deno.env.get("JAAS_APP_ID") ?? "";
const KEY_ID = Deno.env.get("JAAS_KEY_ID") ?? "";
const PRIVATE_PEM = (Deno.env.get("JAAS_PRIVATE_KEY") ?? "").replace(/\\n/g, "\n");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function base64url(input) {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemVersDer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const der = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) der[i] = bin.charCodeAt(i);
  return der;
}

async function signer(charge) {
  const cle = await crypto.subtle.importKey(
    "pkcs8",
    pemVersDer(PRIVATE_PEM),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const entete = { alg: "RS256", kid: `${APP_ID}/${KEY_ID}`, typ: "JWT" };
  const corps = base64url(JSON.stringify(entete)) + "." + base64url(JSON.stringify(charge));
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cle, new TextEncoder().encode(corps));
  return corps + "." + base64url(new Uint8Array(signature));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    if (!APP_ID || !KEY_ID || !PRIVATE_PEM) {
      return new Response(JSON.stringify({ error: "Secrets JaaS manquants" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non authentifie" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { session_id, jeton } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "Parametres manquants" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Client au nom de l'utilisateur : les règles RLS s'appliquent.
    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });

    const { data: utilisateur, error: erreurAuth } = await supabase.auth.getUser();
    if (erreurAuth || !utilisateur?.user) {
      return new Response(JSON.stringify({ error: "Session invalide" }), {
        status: 401,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    const uid = utilisateur.user.id;

    const { data: estAdmin } = await supabase.rpc("is_admin");
    const moderateur = estAdmin === true;

    // Invitation nominative (RLS : l'utilisateur ne voit que les siennes)
    let invitations = [];
    if (jeton) {
      const { data } = await supabase
        .from("invitations")
        .select("id, session_id")
        .eq("session_id", session_id)
        .eq("user_id", uid)
        .eq("jeton", jeton)
        .limit(1);
      invitations = data || [];
    }

    if (!moderateur && (!invitations || invitations.length === 0)) {
      return new Response(JSON.stringify({ error: "Invitation invalide pour cette session" }), {
        status: 403,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("id,titre,salle,debut,duree_min,statut")
      .eq("id", session_id)
      .single();

    if (!session) {
      return new Response(JSON.stringify({ error: "Session introuvable" }), {
        status: 404,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }
    if (session.statut === "annulee") {
      return new Response(JSON.stringify({ error: "Session annulee" }), {
        status: 410,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const { data: profil } = await supabase
      .from("profiles")
      .select("nom,email")
      .eq("id", uid)
      .single();

    const maintenant = Math.floor(Date.now() / 1000);
    const charge = {
      aud: "jitsi",
      iss: "chat",
      sub: APP_ID,
      room: "*",
      nbf: maintenant - 10,
      exp: maintenant + 60 * 60 * 3,
      context: {
        user: {
          id: uid,
          name: profil?.nom || profil?.email || "Apprenant",
          email: profil?.email || "",
          moderator: moderateur,
        },
        features: {
          livestreaming: false,
          recording: false,
          transcription: false,
          "outbound-call": false,
        },
      },
    };

    const jwt = await signer(charge);

    return new Response(
      JSON.stringify({
        domain: "8x8.vc",
        roomName: `${APP_ID}/${session.salle}`,
        titre: session.titre,
        jwt,
        moderateur,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

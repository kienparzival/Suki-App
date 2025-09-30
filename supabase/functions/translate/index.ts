// supabase/functions/translate/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SERVICE_SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TRANSLATE_API_KEY = Deno.env.get("GOOGLE_TRANSLATE_API_KEY")!;

/**
 * Allow your Vercel domain. Use "*" during local testing if you want.
 * If you add a custom domain later, include it here too.
 */
const ALLOWED_ORIGIN = "https://suki-app-two.vercel.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN, // or "*" temporarily
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
  "Content-Type": "application/json",
};

type Payload = { key: string; targetLang: "vi" };

Deno.serve(async (req) => {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    const { key, targetLang }: Payload = await req.json();
    if (!key || targetLang !== "vi") {
      return new Response(JSON.stringify({ error: "Bad request" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const translated = await translateWithGoogle(key, "en", "vi", TRANSLATE_API_KEY);

    // Upsert into app_translations
    const res = await fetch(`${SERVICE_SUPABASE_URL}/rest/v1/app_translations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_SUPABASE_KEY,
        "Authorization": `Bearer ${SERVICE_SUPABASE_KEY}`,
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({ key, vi: translated, source: "auto" })
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Upsert failed:", txt);
    }

    return new Response(JSON.stringify({ translated }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

async function translateWithGoogle(text: string, from: string, to: string, apiKey: string) {
  const r = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: from, target: to, format: "text" })
  });
  const j = await r.json();
  const translated = j?.data?.translations?.[0]?.translatedText;
  return (translated ?? text) as string;
}
// supabase/functions/translate/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SERVICE_SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TRANSLATE_API_KEY = Deno.env.get("GOOGLE_TRANSLATE_API_KEY")!;

const ALLOWED_ORIGIN = "https://suki-app-two.vercel.app";
const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
  "Content-Type": "application/json",
};

type Payload = { key: string; targetLang: "vi" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
    }

    const { key, targetLang }: Payload = await req.json();
    if (!key || targetLang !== "vi") {
      return new Response(JSON.stringify({ error: "Bad request" }), { status: 400, headers: corsHeaders });
    }

    // 1) Read existing (so human always wins)
    const existingRes = await fetch(
      `${SERVICE_SUPABASE_URL}/rest/v1/app_translations?key=eq.${encodeURIComponent(key)}&select=vi,source&limit=1`,
      {
        headers: {
          "apikey": SERVICE_SUPABASE_KEY,
          "Authorization": `Bearer ${SERVICE_SUPABASE_KEY}`,
        },
      }
    );
    const existing = (await existingRes.json()) as Array<{ vi: string; source: string }>;
    const row = existing?.[0];

    if (row?.source === "human") {
      // Human translation exists → return it, do NOT overwrite
      return new Response(JSON.stringify({ translated: row.vi }), { headers: corsHeaders });
    }

    // 2) Translate
    const translated = await translateWithGoogle(key, "en", "vi", TRANSLATE_API_KEY);

    // 3) Write only if missing OR auto (never replace human)
    const upsertBody = JSON.stringify({ key, vi: translated, source: "auto" });
    const upsertRes = await fetch(`${SERVICE_SUPABASE_URL}/rest/v1/app_translations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_SUPABASE_KEY,
        "Authorization": `Bearer ${SERVICE_SUPABASE_KEY}`,
        "Prefer": "resolution=merge-duplicates",
      },
      body: upsertBody,
    });
    if (!upsertRes.ok) {
      const txt = await upsertRes.text();
      console.error("Upsert failed:", txt);
      // even if upsert fails, still return the translated string
    }

    return new Response(JSON.stringify({ translated }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});

async function translateWithGoogle(text: string, from: string, to: string, apiKey: string) {
  const r = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: from, target: to, format: "text" }),
  });
  const j = await r.json();
  const translated = j?.data?.translations?.[0]?.translatedText;
  return (translated ?? text) as string;
}
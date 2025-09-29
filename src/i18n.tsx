import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Lang = "en" | "vi";
type Dict = Record<string, string>;

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const Ctx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, any>) => React.ReactNode;
}>(null as any);

function interpolate(str: string, vars?: Record<string, any>) {
  if (!vars) return str;
  const parts: (string | React.ReactNode)[] = [];
  const re = /{(\w+)}/g; let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(str))) {
    if (m.index > last) parts.push(str.slice(last, m.index));
    parts.push(vars[m[1]] ?? `{${m[1]}}`); last = re.lastIndex;
  }
  if (last < str.length) parts.push(str.slice(last));
  return parts;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>("en");
  const [viDict, setViDict] = useState<Dict>({});

  // init lang
  useEffect(() => {
    const urlLang = new URL(window.location.href).searchParams.get("lang") as Lang | null;
    const stored = (localStorage.getItem("lang") as Lang | null) ?? null;
    setLang(urlLang || stored || "en");
  }, []);
  useEffect(() => localStorage.setItem("lang", lang), [lang]);

  // load curated/auto VI once
  useEffect(() => {
    (async () => {
      const cached = localStorage.getItem("vi_dict");
      if (cached) setViDict(JSON.parse(cached));
      const { data, error } = await supabase.from("app_translations").select("key, vi");
      if (!error && data) {
        const dict: Dict = {};
        for (const row of data) dict[row.key] = row.vi;
        setViDict(dict);
        localStorage.setItem("vi_dict", JSON.stringify(dict));
      }
    })();
  }, []);

  // record misses (analytics) — optional
  const recordMiss = async (k: string) => {
    await supabase.from("app_translation_events").insert({ key: k, lang: "vi" });
  };

  // fetch on-demand translation from Edge and update cache/db
  const fetchAuto = async (k: string) => {
    try {
      const r = await fetch("/functions/v1/translate", { method: "POST", body: JSON.stringify({ key: k, targetLang: "vi" }) });
      const j = await r.json();
      const v = j?.translated ?? k;
      setViDict((prev) => {
        const next = { ...prev, [k]: v };
        localStorage.setItem("vi_dict", JSON.stringify(next));
        return next;
      });
      return v;
    } catch {
      return k; // worst case fallback
    }
  };

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, any>) => {
      if (lang === "en") return interpolate(key, vars);
      const hit = viDict[key];
      if (hit) return interpolate(hit, vars);
      // not found -> log, translate once, and show result immediately when it arrives
      recordMiss(key);
      // optimistic: show EN first render, then swap; or block until translated:
      // Here we optimistically return EN, but you can wrap <T> to suspense if desired.
      fetchAuto(key).then(); 
      if (import.meta.env.DEV) console.warn("[i18n:auto] missing -> translating:", key);
      return interpolate(key, vars);
    };
  }, [lang, viDict]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useI18n = () => useContext(Ctx);
export const T: React.FC<{ k?: string; children?: string; vars?: Record<string, any> }> = ({ k, children, vars }) => {
  const { t } = useI18n();
  const key = (k ?? children ?? "").toString();
  return <>{t(key, vars)}</>;
};

export const LangToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { lang, setLang } = useI18n();
  return (
    <button
      className={className ?? "px-3 py-1 rounded-xl border text-sm"}
      onClick={() => setLang(lang === "en" ? "vi" : "en")}
      aria-label="Toggle language"
      title={lang === "en" ? "Switch to Vietnamese" : "Chuyển sang tiếng Anh"}
      style={{flexDirection: 'column', height: 'auto', padding: '0.5rem 0.75rem'}}
    >
      <span className="text-xs font-medium">{lang === "en" ? "VI" : "EN"}</span>
    </button>
  );
};

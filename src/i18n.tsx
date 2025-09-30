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
      try {
        const cached = localStorage.getItem("vi_dict");
        if (cached) {
          const parsedCache = JSON.parse(cached);
          setViDict(parsedCache);
          console.log("[i18n] Loaded cached translations:", parsedCache);
        }
        
        const { data, error } = await supabase.from("app_translations").select("key, vi");
        if (error) {
          console.error("[i18n] Error loading translations:", error);
          // If table doesn't exist, create some basic translations
          const basicTranslations = {
            "Discover": "Khám phá",
            "Saved": "Đã lưu", 
            "Create Event": "Tạo sự kiện",
            "Browse Events": "Duyệt sự kiện",
            "Manage My Events": "Quản lý sự kiện của tôi",
            "Account Settings": "Cài đặt tài khoản",
            "Log Out": "Đăng xuất",
            "Sign In": "Đăng nhập",
            "Manage Events": "Quản lý sự kiện",
            "Monitor and manage your events and make updates": "Theo dõi và quản lý các sự kiện của bạn và thực hiện cập nhật",
            "List View": "Chế độ xem danh sách",
            "Calendar View": "Chế độ xem lịch",
            "Create New Event": "Tạo sự kiện mới",
            "Loading your events...": "Đang tải sự kiện của bạn...",
            "No events yet": "Chưa có sự kiện nào",
            "You haven't created any events yet. Start by creating your first event!": "Bạn chưa tạo sự kiện nào. Hãy bắt đầu bằng cách tạo sự kiện đầu tiên!",
            "Create Your First Event": "Tạo sự kiện đầu tiên của bạn",
            "Event": "Sự kiện",
            "Status": "Trạng thái",
            "Actions": "Hành động",
            "View": "Xem",
            "Edit": "Chỉnh sửa",
            "Copy Link": "Sao chép liên kết",
            "Copy": "Sao chép",
            "Delete": "Xóa",
            "Calendar view coming soon!": "Chế độ xem lịch sắp ra mắt!",
            "Published": "Đã xuất bản",
            "Draft": "Bản nháp",
            "Past": "Đã qua",
            "Cancelled": "Đã hủy"
          };
          setViDict(basicTranslations);
          localStorage.setItem("vi_dict", JSON.stringify(basicTranslations));
        } else if (data) {
          const dict: Dict = {};
          for (const row of data) dict[row.key] = row.vi;
          setViDict(dict);
          localStorage.setItem("vi_dict", JSON.stringify(dict));
          console.log("[i18n] Loaded translations from Supabase:", dict);
        }
      } catch (err) {
        console.error("[i18n] Error in translation loading:", err);
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
      const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate`;
      const r = await fetch(functionsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY!,
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY!}`,
        },
        body: JSON.stringify({ key: k, targetLang: "vi" }),
      });
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

export const GlobalAutoTranslate: React.FC = () => {
  const { lang } = useI18n();

  useEffect(() => {
    if (lang !== "vi") return;

    const SKIP_TAGS = new Set(["SCRIPT","STYLE","NOSCRIPT","CODE","PRE","TEXTAREA","SVG","IMG","VIDEO","CANVAS"]);
    const seen = new Set<string>();
    let stopped = false;

    const translateTextNode = async (node: Text) => {
      const original = node.nodeValue ?? "";
      const text = original.trim();

      // Skip empty/URLs/emails/numbers/mostly symbols
      if (
        text.length < 2 ||
        !/[A-Za-z]/.test(text) ||
        /^https?:\/\//.test(text) ||
        /@/.test(text) ||
        /^[\d\s.,:/\-–—()]+$/.test(text)
      ) return;

      if (seen.has(text)) return;
      seen.add(text);

      try {
        const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate`;
        const r = await fetch(functionsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY!,
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY!}`,
          },
          body: JSON.stringify({ key: text, targetLang: "vi" }),
        });
        const j = await r.json();
        const vi = j?.translated ?? text;
        if (!stopped && node.nodeValue === original) node.nodeValue = vi;
      } catch {
        /* keep EN on failure */
      }
    };

    const walk = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => {
          const parent = (n as Text).parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
          
          // Skip event-specific content (titles, descriptions)
          // Check if parent or any ancestor has event content markers
          let el = parent;
          while (el) {
            // Skip elements with data-no-translate attribute
            if (el.hasAttribute && el.hasAttribute('data-no-translate')) return NodeFilter.FILTER_REJECT;
            
            // Skip event titles and descriptions by class/id patterns
            const className = el.className || '';
            const id = el.id || '';
            if (
              className.includes('event-title') ||
              className.includes('event-name') ||
              className.includes('event-description') ||
              className.includes('event-details') ||
              id.includes('event-title') ||
              id.includes('event-description')
            ) return NodeFilter.FILTER_REJECT;
            
            el = el.parentElement;
          }
          
          const cs = getComputedStyle(parent);
          if (cs.visibility === "hidden" || cs.display === "none") return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      let node: Node | null;
      while ((node = walker.nextNode())) translateTextNode(node as Text);
    };

    // initial pass
    walk(document.body);

    // observe future DOM changes (routing, lazy loads, etc.)
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes?.forEach((n) => {
          if (n.nodeType === Node.TEXT_NODE) translateTextNode(n as Text);
          else if ((n as Element).nodeType === Node.ELEMENT_NODE) walk(n as Element);
        });
        if (m.type === "characterData") translateTextNode(m.target as Text);
      }
    });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });

    return () => { stopped = true; mo.disconnect(); };
  }, [lang]);

  return null;
};

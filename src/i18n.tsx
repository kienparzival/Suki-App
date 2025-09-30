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
  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem("lang", lang);
  }, [lang]);

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

// Keep an in-memory dictionary of Vietnamese (loaded by your provider already).
// We'll still call your Edge Function only when needed.
async function translateOnce(key: string): Promise<string> {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate`;
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY!,
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY!}`,
      },
      body: JSON.stringify({ key, targetLang: "vi" }),
    });
    const j = await r.json();
    return j?.translated ?? key;
  } catch {
    return key;
  }
}

const textNodeOriginal = new WeakMap<Node, string>();

// attributes we want to translate/restore too
const ATTRS = ["placeholder", "title", "aria-label", "alt"];

function isSkippable(node: Node) {
  // don't translate scripts/styles or anything inside a data-no-translate subtree
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    if (el.closest("[data-no-translate]")) return true;
    const tag = el.tagName.toLowerCase();
    if (tag === "script" || tag === "style" || tag === "noscript") return true;
  }
  return false;
}

function collectTextNodes(root: Node, out: Text[]) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || isSkippable(parent)) return NodeFilter.FILTER_REJECT;
      // ignore whitespace-only
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) out.push(n as Text);
}

async function applyVietnamese(root: HTMLElement) {
  // 1) text nodes
  const texts: Text[] = [];
  collectTextNodes(root, texts);

  // dedupe texts by their content (reduce calls)
  const unique = new Map<string, Text[]>();
  for (const t of texts) {
    const en = textNodeOriginal.get(t) ?? t.nodeValue!;
    // remember original English once
    if (!textNodeOriginal.has(t)) textNodeOriginal.set(t, en);
    const k = en.trim();
    const arr = unique.get(k) ?? [];
    arr.push(t);
    unique.set(k, arr);
  }

  // translate each unique key, then apply
  for (const [key, nodes] of unique.entries()) {
    const vi = await translateOnce(key);
    for (const node of nodes) node.nodeValue = node.nodeValue?.replace(key, vi) ?? vi;
  }

  // 2) attributes
  const els = root.querySelectorAll<HTMLElement>("[placeholder], [title], [aria-label], img[alt]");
  for (const el of els) {
    for (const attr of ATTRS) {
      const curr = el.getAttribute(attr);
      if (!curr) continue;

      // store original once
      const origAttrName = `data-orig-${attr}`;
      const original = el.getAttribute(origAttrName) ?? curr;
      if (!el.hasAttribute(origAttrName)) el.setAttribute(origAttrName, original);

      const vi = await translateOnce(original);
      el.setAttribute(attr, vi);
    }
  }

  // 3) <title>
  const title = document.querySelector("title");
  if (title && title.textContent) {
    const orig = title.getAttribute("data-orig-title") ?? title.textContent;
    if (!title.hasAttribute("data-orig-title")) title.setAttribute("data-orig-title", orig);
    const vi = await translateOnce(orig);
    title.textContent = vi;
  }
}

function restoreEnglish(root: HTMLElement) {
  // 1) text nodes
  const texts: Text[] = [];
  collectTextNodes(root, texts);
  for (const t of texts) {
    const orig = textNodeOriginal.get(t);
    if (orig) t.nodeValue = orig;
  }

  // 2) attributes
  const els = root.querySelectorAll<HTMLElement>("[data-orig-placeholder], [data-orig-title], [data-orig-aria-label], [data-orig-alt]");
  for (const el of els) {
    for (const attr of ATTRS) {
      const origAttrName = `data-orig-${attr}`;
      const orig = el.getAttribute(origAttrName);
      if (orig != null) el.setAttribute(attr, orig);
    }
  }

  // 3) <title>
  const title = document.querySelector("title");
  if (title) {
    const orig = title.getAttribute("data-orig-title");
    if (orig != null) title.textContent = orig;
  }
}

export const GlobalAutoTranslate: React.FC = () => {
  const { lang } = useI18n();

  useEffect(() => {
    let stopped = false;

    const apply = async () => {
      if (stopped) return;
      if (lang === "vi") await applyVietnamese(document.body);
      else restoreEnglish(document.body);
    };

    // Run immediately on lang change
    apply();

    // Observe subsequent DOM mutations so new content is kept in sync
    const mo = new MutationObserver((mutations) => {
      // only process added nodes / text changes
      for (const m of mutations) {
        if (stopped) break;
        if (m.type === "childList") {
          m.addedNodes.forEach(async (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              // single text node
              if (lang === "vi") {
                const t = node as Text;
                const en = textNodeOriginal.get(t) ?? t.nodeValue!;
                if (!textNodeOriginal.has(t)) textNodeOriginal.set(t, en);
                const vi = await translateOnce(en.trim());
                t.nodeValue = vi;
              } else {
                const t = node as Text;
                const en = textNodeOriginal.get(t);
                if (en) t.nodeValue = en;
              }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              if (lang === "vi") applyVietnamese(el);
              else restoreEnglish(el);
            }
          });
        } else if (m.type === "characterData") {
          // text node altered by React – normalize it again
          const t = m.target as Text;
          if (!t.nodeValue?.trim()) continue;
          if (lang === "vi") {
            const en = textNodeOriginal.get(t) ?? t.nodeValue;
            if (!textNodeOriginal.has(t) && en) textNodeOriginal.set(t, en);
            translateOnce((en || "").trim()).then((vi) => {
              t.nodeValue = vi;
            });
          } else {
            const en = textNodeOriginal.get(t);
            if (en) t.nodeValue = en;
          }
        }
      }
    });

    mo.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    // Cleanup on unmount / lang change
    return () => {
      stopped = true;
      mo.disconnect();
    };
  }, [lang]);

  return null;
};

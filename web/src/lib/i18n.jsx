import { createContext, useCallback, useContext, useEffect, useState } from "react";

const LangCtx = createContext({ lang: "en", setLang: () => {} });

/** Language comes from #lang=id or ?lang=id, lives in memory, and is mirrored back into the hash. */
export const readLang = () => {
  if (typeof window === "undefined") return "en";
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const l = hash.get("lang") || query.get("lang");
  return l === "id" ? "id" : "en";
};

export const writeLang = (lang) => {
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  if (lang === "id") hash.set("lang", "id");
  else hash.delete("lang");
  url.searchParams.delete("lang");
  const h = hash.toString();
  window.history.replaceState(window.history.state, "", url.pathname + url.search + (h ? `#${h}` : ""));
};

export const LangProvider = ({ children }) => {
  const [lang, setLangState] = useState(readLang);
  const setLang = useCallback((l) => {
    setLangState(l);
    writeLang(l);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    const onHash = () => setLangState(readLang());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
};

export const useLang = () => useContext(LangCtx);

/** t(dict)(key, vars): picks [en, id] and fills {name} placeholders. */
export const makeT = (dict, lang) => (key, vars) => {
  const e = dict[key];
  let s = e ? e[lang === "id" ? 1 : 0] : key;
  if (vars && typeof s === "string") for (const n in vars) s = s.split(`{${n}}`).join(vars[n]);
  return s;
};

/** Keeps the language when moving between / and /app. */
export const withLang = (path, lang) => (lang === "id" ? `${path}#lang=id` : path);

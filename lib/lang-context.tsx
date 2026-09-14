"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Lang, getT, Translations } from "./i18n";
import { Region, REGIONS } from "./regions";

type LangContextType = {
  lang: Lang;
  region: Region;
  t: Translations;
  setLang: (l: Lang) => void;
};

const LangContext = createContext<LangContextType>({
  lang: "fr",
  region: "ma",
  t: getT("fr"),
  setLang: () => {},
});

export function LangProvider({
  children,
  defaultRegion = "ma",
}: {
  children: React.ReactNode;
  defaultRegion?: Region;
}) {
  const defaultLang = REGIONS[defaultRegion].lang;
  const [lang, setLangState] = useState<Lang>(defaultLang);

  useEffect(() => {
    // Merchant dashboard: check saved lang preference
    const saved = localStorage.getItem("wallio_lang") as Lang | null;
    if (saved === "fr" || saved === "ro") {
      setLangState(saved);
    } else {
      // Client pages: auto-detect from browser
      const browser = navigator.language.toLowerCase();
      if (browser.startsWith("ro")) setLangState("ro");
      else setLangState(defaultLang);
    }
  }, [defaultLang]);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("wallio_lang", l);
  }

  return (
    <LangContext.Provider value={{ lang, region: defaultRegion, t: getT(lang), setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

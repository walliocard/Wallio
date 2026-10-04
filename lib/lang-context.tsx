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
  const [region, setRegion] = useState<Region>(defaultRegion);

  useEffect(() => {
    // Merchant dashboard: check saved lang preference
    const saved = localStorage.getItem("wallio_lang") as Lang | null;
    if (saved === "fr" || saved === "ro" || saved === "es") {
      setLangState(saved);
      // Si on est sur eu. et que la lang sauvegardée est "ro", afficher les prix RON
      if (defaultRegion === "fr" && saved === "ro") setRegion("ro");
      else setRegion(defaultRegion);
    } else {
      // Client pages: auto-detect from browser
      const browser = navigator.language.toLowerCase();
      if (browser.startsWith("ro")) {
        setLangState("ro");
        if (defaultRegion === "fr") setRegion("ro");
      } else if (browser.startsWith("es")) {
        setLangState("es");
        setRegion(defaultRegion);
      } else {
        setLangState(defaultLang);
        setRegion(defaultRegion);
      }
    }
  }, [defaultLang, defaultRegion]);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("wallio_lang", l);
    // Mettre à jour la région si on change vers/depuis roumain sur eu.
    if (defaultRegion === "fr") setRegion(l === "ro" ? "ro" : "fr");
  }

  return (
    <LangContext.Provider value={{ lang, region, t: getT(lang), setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

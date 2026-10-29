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

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  const [region, setRegion] = useState<Region>("ma");

  useEffect(() => {
    const isEu = window.location.hostname.startsWith("eu.");
    const detectedRegion: Region = isEu ? "fr" : "ma";

    const saved = localStorage.getItem("wallio_lang") as Lang | null;
    if (saved === "fr" || saved === "ro" || saved === "es") {
      setLangState(saved);
      if (isEu && saved === "ro") setRegion("ro");
      else setRegion(detectedRegion);
    } else {
      const browser = navigator.language.toLowerCase();
      if (browser.startsWith("ro")) {
        setLangState("ro");
        if (isEu) setRegion("ro");
      } else if (browser.startsWith("es")) {
        setLangState("es");
        setRegion(detectedRegion);
      } else {
        setLangState(REGIONS[detectedRegion].lang);
        setRegion(detectedRegion);
      }
    }
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("wallio_lang", l);
    const isEu = window.location.hostname.startsWith("eu.");
    if (isEu) setRegion(l === "ro" ? "ro" : "fr");
  }

  return (
    <LangContext.Provider value={{ lang, region, t: getT(lang), setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);

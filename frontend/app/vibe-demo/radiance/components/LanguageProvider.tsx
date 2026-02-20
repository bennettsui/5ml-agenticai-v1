'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Lang = 'en' | 'zh';

const STORAGE_KEY = 'radiance-lang';

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === 'zh' || stored === 'en') setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    setLangState(l);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === 'en' ? 'zh' : 'en');
  }, [lang, setLang]);

  return (
    <LangContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LangContext);
}

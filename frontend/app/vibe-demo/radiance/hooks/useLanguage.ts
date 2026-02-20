'use client';

import { useState, useEffect, useCallback } from 'react';

export type Lang = 'en' | 'zh';

const STORAGE_KEY = 'radiance-lang';

export function useLanguage(): { lang: Lang; setLang: (l: Lang) => void; toggle: () => void } {
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

  return { lang, setLang, toggle };
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from './translations';

const STORAGE_KEY = 'vyshai_locale';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') return saved;
    const browser = navigator.language?.toLowerCase() || 'es';
    return browser.startsWith('en') ? 'en' : 'es';
  });

  const setLocale = useCallback((next) => {
    if (next !== 'en' && next !== 'es') return;
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => {
    const dict = translations[locale] || translations.es;
    const t = (key) => {
      const parts = key.split('.');
      let cur = dict;
      for (const p of parts) {
        cur = cur?.[p];
      }
      return cur ?? key;
    };
    return { locale, setLocale, t, dict };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

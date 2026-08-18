import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { languageMap, supportedLanguages, en } from '../i18n';
import { LanguageOption } from '../types';

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: keyof typeof en | string) => string;
  supportedLanguages: LanguageOption[];
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => String(key),
  supportedLanguages,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(() => {
    return localStorage.getItem('perillo_language') || 'en';
  });

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('perillo_language', lang);
  };

  const value = useMemo(() => {
    const translations = languageMap[language] || languageMap.en;
    return {
      language,
      setLanguage,
      supportedLanguages,
      t: (key: string) => {
        const dictionary = translations as Record<string, string>;
        const defaultDict = languageMap.en as Record<string, string>;
        return dictionary[key] || defaultDict[key] || key;
      },
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);

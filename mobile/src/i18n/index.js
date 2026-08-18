import React, { createContext, useContext, useMemo, useState } from 'react';
import * as Localization from 'expo-localization';

import en from './en';
import hi from './hi';
import kn from './kn';
import mr from './mr';

const languageMap = {
  en,
  hi: { ...en, ...hi },
  kn: { ...en, ...kn },
  mr: { ...en, ...mr },
};

const supportedLanguages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'mr', label: 'मराठी' },
];

const I18nContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  supportedLanguages,
});

const normalizeLanguage = (languageCode) => {
  if (!languageCode) return 'en';
  return languageMap[languageCode] ? languageCode : 'en';
};

export function I18nProvider({ children }) {
  const deviceLanguage = normalizeLanguage(Localization.getLocales?.()[0]?.languageCode);
  const [language, setLanguage] = useState(deviceLanguage);

  const value = useMemo(() => {
    const translations = languageMap[language] || languageMap.en;
    return {
      language,
      setLanguage,
      supportedLanguages,
      t: (key) => translations[key] || languageMap.en[key] || key,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export { supportedLanguages };

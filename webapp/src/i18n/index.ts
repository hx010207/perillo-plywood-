import en, { Translations } from './en';
import hi from './hi';
import kn from './kn';
import mr from './mr';
import { LanguageOption } from '../types';

export const languageMap: Record<string, Partial<Translations>> = {
  en,
  hi: { ...en, ...hi },
  kn: { ...en, ...kn },
  mr: { ...en, ...mr },
};

export const supportedLanguages: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'mr', label: 'मराठी' },
];

export { en, hi, kn, mr };

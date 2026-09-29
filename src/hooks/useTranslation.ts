import { useBillShield } from './useBillShield';
import type { Language } from '../types';
import type { TranslationKey, TranslateVars } from '../data/translations';

export interface UseTranslationResult {
  t: (key: TranslationKey, vars?: TranslateVars) => string;
  language: Language;
  setLanguage: (language: Language) => void;
  isTamil: boolean;
}

/** Translation helper hook — English by default, Tamil when toggled. */
export function useTranslation(): UseTranslationResult {
  const { t, language, setLanguage } = useBillShield();
  return { t, language, setLanguage, isTamil: language === 'ta' };
}

'use client';
import frTranslations from '@/locales/fr.json';
import enTranslations from '@/locales/en.json';

export type Language = 'fr' | 'en';

export const SUPPORTED_LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

type TranslationDict = typeof frTranslations;

const translations: Record<Language, TranslationDict> = {
  fr: frTranslations,
  en: enTranslations,
};

export function getTranslations(language: Language = 'fr'): TranslationDict {
  return translations[language] ?? translations['fr'];
}

export function detectLanguage(preferredLanguage?: string | null, orgLanguage?: string | null): Language {
  const lang = preferredLanguage ?? orgLanguage ?? 'fr';
  if (lang === 'en') return 'en';
  return 'fr';
}

'use client';

import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function LanguageSettingsSection() {
  const { t } = useLanguage();

  return (
    <section
      aria-labelledby="jdv-language-settings-title"
      className="rounded-2xl border border-[#34D399]/20 bg-[#0F2347] p-5 sm:p-6"
    >
      <div className="mb-4">
        <h2 id="jdv-language-settings-title" className="text-lg font-semibold text-white">
          {t('languageSettings')}
        </h2>
        <p className="mt-1 text-sm text-slate-300">
          Choisissez la langue d’affichage de votre espace JDV CRM. Le changement est immédiat.
        </p>
      </div>
      <LanguageSwitcher variant="inline" />
    </section>
  );
}

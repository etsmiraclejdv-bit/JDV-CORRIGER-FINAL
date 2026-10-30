'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function OfflineRetryButton() {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="rounded-xl bg-[#D4AF37] px-5 py-3 font-semibold text-[#08152f]"
    >
      {t('cg.pmRetry')}
    </button>
  );
}

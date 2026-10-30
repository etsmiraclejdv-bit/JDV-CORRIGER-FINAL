'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function ServiceWorkerRegister() {
  const { t } = useLanguage();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    if ('serviceWorker' in navigator && window.isSecureContext) {
      void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
        // PWA support is progressive: a registration failure must not block CRM usage.
        console.warn('JDV CRM: service worker registration failed', error);
      });
    }

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-3 left-3 z-[100] max-w-[calc(100vw-1.5rem)] rounded-xl border border-amber-300/40 bg-[#08152f] px-4 py-3 text-sm text-amber-100 shadow-xl"
    >
      {t('sh.offline')}
    </div>
  );
}

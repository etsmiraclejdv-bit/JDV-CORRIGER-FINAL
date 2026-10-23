import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export default function LoadingState({ message, className = '' }: LoadingStateProps) {
  const { t } = useLanguage();
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="p-4 rounded-2xl bg-[#0F2347] mb-4">
        <Loader2 size={28} className="text-[#D4AF37] animate-spin" />
      </div>
      <p className="text-sm text-[#A0AEC0]">{message ?? t('cg.loadingDefault')}</p>
    </div>
  );
}

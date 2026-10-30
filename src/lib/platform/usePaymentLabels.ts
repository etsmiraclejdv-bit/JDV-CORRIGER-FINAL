import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';
import type { WebhookHealth } from '@/lib/platform/paymentsHelpers';

// Libellés traduits du suivi des paiements. Les helpers purs de paymentsHelpers.ts restent en
// français (ils sont testés) ; ce hook les remplace côté affichage.
const PAYMENT_STATUS: Record<string, TerrainKey> = {
  pending: 'cg.psPending',
  successful: 'cg.psOk',
  failed: 'cg.psFailed',
  refunded: 'cg.psRefunded',
  cancelled: 'cg.psCancelled',
};
const WEBHOOK_STATUS: Record<string, TerrainKey> = {
  received: 'cg.wsReceived',
  processed: 'cg.wsProcessed',
  ignored: 'cg.wsIgnored',
  failed: 'cg.wsFailed',
};
const EVENT_TYPE: Record<string, TerrainKey> = {
  'transaction.approved': 'cg.evApproved',
  'transaction.declined': 'cg.evDeclined',
  'transaction.canceled': 'cg.evCanceled',
  'transaction.cancelled': 'cg.evCanceled',
  'transaction.pending': 'cg.evPending',
  'transaction.created': 'cg.evCreated',
  'transaction.transferred': 'cg.evTransferred',
};

export function usePaymentLabels() {
  const { t, locale } = useLanguage();
  return {
    paymentStatus: (s: string) => (PAYMENT_STATUS[s] ? t(PAYMENT_STATUS[s]) : s),
    webhookStatus: (s: string) => (WEBHOOK_STATUS[s] ? t(WEBHOOK_STATUS[s]) : s),
    eventType: (type: string | null | undefined) =>
      type ? (EVENT_TYPE[type] ? t(EVENT_TYPE[type]) : type) : '—',
    healthMessage: (state: WebhookHealth, failed: number) =>
      state === 'none'
        ? t('cg.pmHNone')
        : state === 'errors'
          ? t('cg.pmHErr').replace('{n}', String(failed))
          : t('cg.pmHOk'),
    formatMoney: (amount: unknown, currency: string | null | undefined) => {
      const code = (currency ?? 'XOF').toUpperCase();
      const n = Number(amount);
      const v = Number.isFinite(n) ? n : 0;
      return code === 'XOF'
        ? `${new Intl.NumberFormat(locale).format(Math.round(v))} XOF`
        : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(v)} ${code}`;
    },
    formatDateTime: (iso: string | null | undefined) => {
      if (!iso) return '—';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '—';
      return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(d);
    },
  };
}

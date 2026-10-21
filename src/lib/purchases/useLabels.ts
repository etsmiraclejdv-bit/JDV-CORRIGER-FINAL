import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';
import type { OrderLineInput } from '@/lib/purchases/helpers';

const ORDER_STATUSES = ['draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled', 'closed'];
const SUPPLIER_STATUSES = ['active', 'inactive', 'blocked'];
const PAYMENT_METHODS = ['cash', 'mobile_money', 'bank_transfer', 'cheque', 'other'];

/**
 * Libellés traduits du module Achats (statuts, modes de paiement, erreurs de lignes).
 * Les fonctions pures de `helpers.ts` restent en français (elles sont testées).
 */
export function usePurchaseLabels() {
  const { t } = useLanguage();
  const fill = (key: TerrainKey, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      t(key)
    );
  return {
    orderStatus: (s: string) =>
      ORDER_STATUSES.includes(s) ? t(('bz.puOs.' + s) as TerrainKey) : s,
    supplierStatus: (s: string) =>
      SUPPLIER_STATUSES.includes(s) ? t(('bz.puSs.' + s) as TerrainKey) : s,
    paymentMethod: (v: string | null | undefined) =>
      v && PAYMENT_METHODS.includes(v) ? t(('bz.puPm.' + v) as TerrainKey) : v || '—',
    /** Même logique que `validateOrderLines`, mais avec des messages traduits. */
    lineError: (lines: OrderLineInput[]): string | null => {
      if (lines.length === 0) return t('bz.puLineNone');
      if (lines.length > 200) return t('bz.puLineMax');
      const seen = new Set<string>();
      for (const [i, l] of lines.entries()) {
        const n = i + 1;
        if (!l.article_id) return fill('bz.puLinePick', { n });
        if (seen.has(l.article_id)) return fill('bz.puLineDup', { n });
        seen.add(l.article_id);
        const qty = Number(l.quantity);
        const cost = l.unit_cost === '' ? NaN : Number(l.unit_cost);
        if (!Number.isFinite(qty) || qty <= 0) return fill('bz.puLineQty', { n });
        if (!Number.isFinite(cost) || cost < 0) return fill('bz.puLineCost', { n });
      }
      return null;
    },
  };
}

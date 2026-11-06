/**
 * Fonctions d'assainissement des entrées utilisateur (sans dépendance : testables isolément).
 */

/**
 * Retire les balises HTML et quelques caractères dangereux, puis tronque.
 * L'apostrophe est conservée (N'Diaye).
 * `maxLength` vaut 500 par défaut (comportement historique) ; les champs longs
 * (message de contact, question à l'assistant) doivent passer leur propre limite,
 * sinon ils sont coupés à 500 caractères avant toute autre vérification.
 */
export function sanitizeString(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  const limit = Number.isFinite(maxLength) && maxLength > 0 ? Math.floor(maxLength) : 500;
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/["`;\\]/g, '')
    .trim()
    .slice(0, limit);
}

export function sanitizeEmail(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().toLowerCase().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return '';
  return trimmed;
}

export function sanitizeUUID(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return '';
  return trimmed;
}

export function sanitizeNumber(value: unknown, min = 0, max = 100): number {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * Logique pure des codes uniques par produit (mode sans lecteur de codes-barres).
 * Aucune dépendance : testable isolément. Les règles reprennent celles de la base
 * (fonction jdvcrm_normalize_unit_codes_v1) pour signaler les erreurs avant l'envoi.
 */

export const UNIT_CODE_PATTERN = /^[A-Z0-9][A-Z0-9._/-]{3,63}$/;
export const MAX_CODES_PER_OPERATION = 500;

export interface ParsedCodes {
  codes: string[];
  invalid: string[];
  duplicates: string[];
}

/**
 * Découpe un texte collé ou saisi (un code par ligne, ou séparés par virgule, point-virgule,
 * espace ou tabulation), met en majuscules, retire les vides et signale invalides et doublons.
 */
export function parseCodeList(raw: string): ParsedCodes {
  const codes: string[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();
  for (const part of (raw ?? '').split(/[\s,;]+/)) {
    const code = part.trim().toUpperCase();
    if (!code) continue;
    if (!UNIT_CODE_PATTERN.test(code)) {
      if (!invalid.includes(code)) invalid.push(code);
    } else if (seen.has(code)) {
      if (!duplicates.includes(code)) duplicates.push(code);
    } else {
      seen.add(code);
      codes.push(code);
    }
  }
  return { codes, invalid, duplicates };
}

/** Message d'erreur prêt à afficher, ou null si la liste est utilisable. */
export function codeListProblem(parsed: ParsedCodes): string | null {
  if (parsed.invalid.length > 0) {
    return (
      'Code invalide (4 à 64 caractères : lettres, chiffres, . _ / -) : ' +
      parsed.invalid.slice(0, 5).join(', ')
    );
  }
  if (parsed.duplicates.length > 0) {
    return 'Code saisi plusieurs fois : ' + parsed.duplicates.slice(0, 5).join(', ');
  }
  if (parsed.codes.length > MAX_CODES_PER_OPERATION) {
    return MAX_CODES_PER_OPERATION + ' codes maximum par opération.';
  }
  return null;
}

export const UNIT_CODE_STATUSES = [
  { value: 'registered', label: 'Inscrit en agence' },
  { value: 'in_transit', label: 'En transit' },
  { value: 'with_prospecteur', label: 'Chez le prospecteur' },
  { value: 'damaged', label: 'Endommagé' },
  { value: 'missing', label: 'Manquant' },
  { value: 'blocked', label: 'Bloqué' },
] as const;

export function unitCodeStatusLabel(value: string | null | undefined): string {
  return UNIT_CODE_STATUSES.find((s) => s.value === value)?.label ?? (value || '—');
}

export const UNIT_CODE_EVENT_LABELS: Record<string, string> = {
  registered: 'Inscrit',
  dispatched: 'Expédié',
  received: 'Reçu par le prospecteur',
  damaged_on_receipt: 'Reçu endommagé',
  missing_on_receipt: 'Non reçu (manquant)',
};

export function unitCodeEventLabel(value: string | null | undefined): string {
  return UNIT_CODE_EVENT_LABELS[value ?? ''] ?? (value || '—');
}

/** Extrait un message lisible d'une erreur renvoyée par la base. */
export function friendlyRpcError(message: string | null | undefined): string {
  const text = (message ?? '').trim();
  if (!text) return 'Erreur inconnue.';
  if (/could not find the function|function .* does not exist/i.test(text)) {
    return 'La fonction des codes uniques est absente de Supabase : la migration unit_code_traceability_v1 doit être appliquée.';
  }
  return text;
}

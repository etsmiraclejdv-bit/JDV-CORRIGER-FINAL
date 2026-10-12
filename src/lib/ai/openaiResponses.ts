// Utilitaires sans dépendance pour appeler l'API OpenAI Responses (testables isolément).

export const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
export const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';

type Env = Record<string, string | undefined>;

export type OpenAIConfig = { apiKey: string; baseUrl: string; model: string };

/**
 * Lit la configuration côté serveur. OPENAI_BASE_URL est facultatif : il permet d'utiliser
 * Netlify AI Gateway (variables injectées automatiquement) ou un proxy compatible.
 * Retourne null si aucune clé n'est configurée.
 */
export function resolveOpenAIConfig(env: Env): OpenAIConfig | null {
  const apiKey = (env.OPENAI_API_KEY ?? '').trim();
  if (!apiKey) return null;
  const baseUrl = ((env.OPENAI_BASE_URL ?? '').trim() || DEFAULT_OPENAI_BASE_URL).replace(
    /\/+$/,
    ''
  );
  const model = (env.OPENAI_MODEL ?? '').trim() || DEFAULT_OPENAI_MODEL;
  return { apiKey, baseUrl, model };
}

/**
 * Extrait le texte d'une réponse brute de l'API Responses. `output_text` n'existe que dans les
 * SDK officiels : la réponse HTTP contient le texte dans output[].content[] (type « output_text »).
 */
export function extractOutputText(json: unknown): string {
  if (!json || typeof json !== 'object') return '';
  const data = json as { output_text?: unknown; output?: unknown };
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }
  if (!Array.isArray(data.output)) return '';
  const parts: string[] = [];
  for (const item of data.output) {
    if (!item || typeof item !== 'object') continue;
    const message = item as { type?: unknown; content?: unknown };
    if (message.type !== 'message' || !Array.isArray(message.content)) continue;
    for (const c of message.content) {
      const part = c as { type?: unknown; text?: unknown } | null;
      if (part?.type === 'output_text' && typeof part.text === 'string') parts.push(part.text);
    }
  }
  return parts.join('\n').trim();
}

/** Raison lisible (sans secret) d'un échec OpenAI, pour les journaux serveur. */
export function describeOpenAIFailure(status: number, json: unknown): string {
  const err = (json as { error?: { code?: unknown; type?: unknown } } | null)?.error;
  const code =
    typeof err?.code === 'string' ? err.code : typeof err?.type === 'string' ? err.type : '';
  if (status === 401) return 'clé OpenAI invalide ou révoquée (401)';
  if (status === 404 || code === 'model_not_found') return 'modèle OpenAI introuvable';
  if (status === 429) return 'quota ou limite de débit OpenAI atteint (429)';
  if (status >= 500) return 'service OpenAI indisponible (' + status + ')';
  if (status >= 400)
    return 'requête refusée par OpenAI (' + status + (code ? ', ' + code : '') + ')';
  return 'réponse OpenAI sans texte exploitable';
}

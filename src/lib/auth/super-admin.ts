import { getAuthContext } from '@/lib/auth/context';

export type SuperAdminAuthResult =
  | { ok: true; userId: string }
  | { ok: false; reason: string; message: string };

/**
 * Le concepteur est déterminé par la base (table `super_admins`, statut actif),
 * et non par une liste codée en dur dans le navigateur.
 */
export async function checkCurrentSuperAdmin(): Promise<SuperAdminAuthResult> {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return { ok: false, reason: 'not_authenticated', message: "Vous n'êtes pas connecté." };
    }
    if (!ctx.isSuperAdmin) {
      return { ok: false, reason: 'unauthorized', message: 'Compte non autorisé pour ce portail.' };
    }
    return { ok: true, userId: ctx.userId };
  } catch {
    return { ok: false, reason: 'error', message: 'Erreur lors de la vérification.' };
  }
}

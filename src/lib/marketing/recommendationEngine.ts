/**
 * JDV CRM — deterministic, explainable marketing recommendations.
 *
 * This pure module does not query Supabase, send campaigns, or spend money.
 * Callers must supply already-authorized, tenant-scoped aggregate metrics.
 */

export type MarketingMetrics = {
  /** Percentage in the inclusive range 0..100. null means unavailable. */
  storefrontConversionRatePct: number | null;
  /** Percentage in the inclusive range 0..100. null means unavailable. */
  profileCompletenessPct: number | null;
  /** Number of attributable visits in the selected period. null means unavailable. */
  qualifiedVisits: number | null;
  /** Percentage in the inclusive range 0..100. null means unavailable. */
  repeatCustomerRatePct: number | null;
  /** Number of recent customer reviews. null means unavailable. */
  recentReviews: number | null;
};

export type MarketingRecommendation = {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'conversion' | 'visibility' | 'retention' | 'reputation' | 'measurement';
  title: string;
  reason: string;
  action: string;
  successMetric: string;
  score: number;
};

const clampPct = (value: number): number =>
  Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

const safeCount = (value: number): number => Math.max(0, Number.isFinite(value) ? value : 0);

/**
 * Returns explainable recommendations from observed metrics only.
 * Missing metrics produce a measurement recommendation instead of fabricated
 * performance values. Scores are prioritization heuristics, not predictions.
 */
export function generateMarketingRecommendations(
  metrics: MarketingMetrics
): MarketingRecommendation[] {
  const recommendations: MarketingRecommendation[] = [];

  if (metrics.storefrontConversionRatePct === null || metrics.qualifiedVisits === null) {
    recommendations.push({
      id: 'instrument-conversion',
      priority: 'high',
      category: 'measurement',
      title: 'Mesurer les conversions de la vitrine',
      reason: 'Les visites qualifiées ou le taux de conversion ne sont pas disponibles.',
      action:
        'Vérifier le suivi des visites, des clics de contact et des demandes reçues avant d’interpréter la performance.',
      successMetric: 'Part des visites avec un événement de conversion mesuré',
      score: 90,
    });
  } else if (
    safeCount(metrics.qualifiedVisits) >= 30 &&
    clampPct(metrics.storefrontConversionRatePct) < 2
  ) {
    recommendations.push({
      id: 'improve-storefront-conversion',
      priority: 'high',
      category: 'conversion',
      title: 'Améliorer la conversion de la vitrine',
      reason:
        'La vitrine reçoit au moins 30 visites qualifiées, mais moins de 2 % aboutissent à une conversion mesurée.',
      action:
        'Tester un appel à l’action plus visible, des coordonnées faciles à trouver et une offre clairement expliquée.',
      successMetric: 'Taux de conversion de la vitrine',
      score: 85,
    });
  }

  if (metrics.profileCompletenessPct === null) {
    recommendations.push({
      id: 'measure-profile-completeness',
      priority: 'medium',
      category: 'visibility',
      title: 'Contrôler la complétude du profil',
      reason: 'Le niveau de complétude du profil n’est pas renseigné.',
      action:
        'Calculer la complétude à partir des champs de vitrine réellement disponibles et autorisés.',
      successMetric: 'Pourcentage de champs de profil essentiels complétés',
      score: 55,
    });
  } else if (clampPct(metrics.profileCompletenessPct) < 80) {
    recommendations.push({
      id: 'complete-business-profile',
      priority: 'medium',
      category: 'visibility',
      title: 'Compléter la vitrine de l’entreprise',
      reason: 'Le profil est complété à moins de 80 % selon l’indicateur fourni.',
      action:
        'Ajouter les informations essentielles manquantes, les horaires, les coordonnées et des visuels de qualité.',
      successMetric: 'Complétude du profil et clics de contact',
      score: 70,
    });
  }

  if (metrics.repeatCustomerRatePct === null) {
    recommendations.push({
      id: 'measure-retention',
      priority: 'low',
      category: 'measurement',
      title: 'Mettre en place une mesure de fidélisation',
      reason: 'Le taux de clients récurrents n’est pas disponible.',
      action:
        'Définir une règle de récurrence claire à partir des données clients auxquelles l’entreprise est autorisée à accéder.',
      successMetric: 'Taux de clients récurrents sur une période définie',
      score: 40,
    });
  } else if (clampPct(metrics.repeatCustomerRatePct) < 20) {
    recommendations.push({
      id: 'strengthen-retention',
      priority: 'medium',
      category: 'retention',
      title: 'Renforcer la fidélisation',
      reason: 'Le taux de clients récurrents fourni est inférieur à 20 %.',
      action:
        'Proposer un suivi après achat, une offre de retour ou un programme de fidélité avec consentement adapté.',
      successMetric: 'Taux de retour des clients sur la période suivante',
      score: 65,
    });
  }

  if (metrics.recentReviews === null) {
    recommendations.push({
      id: 'measure-reputation',
      priority: 'low',
      category: 'measurement',
      title: 'Suivre les avis clients',
      reason: 'Le nombre d’avis récents n’est pas disponible.',
      action:
        'Vérifier le module d’avis existant et afficher uniquement les avis autorisés selon les règles de modération.',
      successMetric: 'Nombre d’avis authentiques reçus et traités',
      score: 35,
    });
  } else if (safeCount(metrics.recentReviews) === 0) {
    recommendations.push({
      id: 'request-customer-feedback',
      priority: 'low',
      category: 'reputation',
      title: 'Inviter les clients à donner leur avis',
      reason: 'Aucun avis récent n’est comptabilisé pour la période choisie.',
      action:
        'Inviter les clients réels à partager honnêtement leur expérience, sans acheter ni fabriquer d’avis.',
      successMetric: 'Nombre d’avis authentiques reçus',
      score: 45,
    });
  }

  return recommendations.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

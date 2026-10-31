# Rapport de normalisation Prettier — 31 octobre 2026

Le contrôle CI du 30 octobre signalait 137 erreurs de formatage Prettier dans les quatre fichiers suivants :

- `src/app/business/dashboard/page.tsx`
- `src/app/components/PublicAccountBanner.tsx`
- `src/app/entrepot/dashboard/page.tsx`
- `src/app/entrepot/dashboard/layout.tsx`

Les fichiers sources concernés ont été normalisés avec le script officiel `npm run format`, qui utilise la version de Prettier verrouillée par le `package-lock.json`, après installation reproductible via `npm ci`.

Aucune logique métier, règle d'accès, migration SQL, donnée Supabase ou configuration de production n'a été modifiée par cette opération. Les tests et le contrôle TypeScript doivent être relancés sur le commit final de cette branche ; le lint et le build restent à confirmer par la CI.

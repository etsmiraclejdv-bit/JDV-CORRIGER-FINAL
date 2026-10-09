# Supabase — JDV CRM

Projet de référence : `CRM JDV`, région `eu-west-1`, PostgreSQL 17.

## Références

| Chemin | Rôle et limites |
|---|---|
| `src/types/database.types.ts` | Types TypeScript générés depuis le schéma live Supabase. Les régénérer après toute modification du schéma. |
| `schema/README.md` | Inventaire du schéma live et état de reproductibilité connu. |
| `schema/00_baseline_public_schema.sql` | Instantané historique daté du 2026-10-01. **Obsolète comme baseline de restauration** : ne pas l'utiliser seul pour recréer la base actuelle. |
| `migrations/` | Sources SQL présentes dans le dépôt. Elles ne représentent pas encore l'ensemble des versions appliquées en production. |
| `functions/` | Sources versionnées des trois Edge Functions : `send-email`, `company-ai-review` et `resend-service-mail`. |
| `config.toml` | Configuration Supabase et exigence JWT pour les fonctions versionnées. |

## État constaté le 2026-10-09

- Schéma `public` : **102 tables**, RLS activé sur les 102 tables dans l'inventaire consulté.
- Historique live Supabase : **136 versions** de migrations.
- Quatre versions live n'ont pas encore de source SQL récupérée dans Git : `20261008115141_ai_company_validation_v1`, `20261008174410_company_document_manual_review_v1`, `20261009011506_agency_head_chef_agence_v1` et `20261009012135_scope_prospecteur_assignments_to_agency_v1`.
- Trois Edge Functions sont déployées dans le projet live ; leurs sources sont désormais versionnées dans ce dépôt. La fonction de diagnostic Resend est durcie ici pour exiger un JWT et un rôle SUPER ADMIN. **Ce durcissement n'est pas appliqué au projet live tant qu'un déploiement explicite n'a pas eu lieu.**

## Régénérer les types

Avec le Supabase CLI installé et authentifié :

```bash
npx supabase gen types typescript --project-id arxhppptxeeyeexkdyjv --schema public > src/types/database.types.ts
npm run type-check
```

Comparer et relire le diff avant de commiter. Les types générés ne remplacent pas les migrations SQL.

## Migrations et restauration

**Ne pas exécuter `supabase db push` et ne pas annoncer une restauration depuis zéro comme reproductible** tant que les quatre sources SQL manquantes n'ont pas été retrouvées ou reconstruites à partir de preuves fiables, puis vérifiées sur une base temporaire gratuite/autorisée. Ne pas créer de branche Supabase payante pour ces vérifications sans confirmation explicite du coût.

L'instantané SQL du 2026-10-01 est conservé à titre historique et d'audit. Il décrit un schéma plus ancien que le schéma live actuel et ne doit pas être appliqué comme source de vérité.

## Secrets des Edge Functions

Configurer dans les secrets Supabase (et non dans les fichiers Git) :
- `SITE_URL` : URL canonique du site, actuellement `https://joie-de-vivr.netlify.app`.
- `RESEND_API_KEY` : clé du fournisseur d'emails.
- `EMAIL_FROM` : expéditeur validé chez Resend (facultatif, valeur de test par défaut à remplacer en production).
- `ANTHROPIC_API_KEY` et `ANTHROPIC_MODEL` : facultatifs pour `company-ai-review`; sans clé, le mode de secours est utilisé.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` : variables fournies/configurées pour les fonctions Supabase ; ne jamais exposer la clé service-role au navigateur.

La fonction `resend-service-mail` envoie uniquement vers `delivered@resend.dev`, et son code versionné vérifie que l'utilisateur est un SUPER ADMIN actif. Le code de cette branche n'est pas une confirmation de déploiement live.

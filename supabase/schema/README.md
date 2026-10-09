# Référence du schéma Supabase

Dernière vérification : **2026-10-09**. Projet `arxhppptxeeyeexkdyjv`, schéma `public`.

- Tables live répertoriées : **102**.
- RLS activé : **102/102** tables selon l'inventaire consulté.
- Historique des migrations live : **136** versions.
- Types TypeScript générés depuis le schéma live : `src/types/database.types.ts`.
- Instantané SQL historique : `00_baseline_public_schema.sql`, daté du 2026-10-01 ; il est obsolète pour restaurer le schéma actuel.

## Écart de reproductibilité bloquant

Les sources SQL correspondant aux versions ci-dessous n'ont pas été retrouvées dans le dépôt :

- `20261008115141_ai_company_validation_v1`
- `20261008174410_company_document_manual_review_v1`
- `20261009011506_agency_head_chef_agence_v1`
- `20261009012135_scope_prospecteur_assignments_to_agency_v1`

Ne pas inventer leur SQL, ne pas exécuter `supabase db push`, et ne pas traiter l'instantané historique comme une restauration actuelle complète. La reconstruction reproductible n'est pas certifiée tant que ces sources ne sont pas récupérées/reconstruites à partir de preuves fiables et qu'un replay propre n'a pas été validé.

## Régénération

```bash
npx supabase gen types typescript --project-id arxhppptxeeyeexkdyjv --schema public > src/types/database.types.ts
npm run type-check
```

La génération des types est en lecture seule sur le schéma ; elle ne modifie pas la base de données.

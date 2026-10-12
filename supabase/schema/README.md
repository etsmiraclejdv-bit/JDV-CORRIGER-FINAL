# Référence du schéma Supabase

Dernière vérification : **2026-10-12**. Projet `arxhppptxeeyeexkdyjv`, schéma `public`.

- Tables publiques live répertoriées : **108**.
- Vues publiques : **22**.
- Routines publiques : **202**.
- Politiques RLS publiques : **298**.
- RLS activé : **108/108** tables publiques selon l'inventaire consulté.
- Historique des migrations live : **152** versions.
- Le dépôt contient les sources des **152 migrations déjà enregistrées**, avec les deux migrations de vitrine réalignées sur les versions live `20261012024437` et `20261012024444`.
- Le fichier `supabase/schema/00_baseline_public_schema.sql` reste un instantané historique du 1 octobre 2026 ; ce n'est pas un export complet et actuel de la base.

## Migration en préparation

La migration `20261012180000_platform_design_media_v1.sql` est ajoutée sur une branche de travail. Elle autorise les téléversements de médias du studio uniquement sous le dossier `platform/` et pour le super-administrateur, et étend les types de médias du bucket de design. **Elle n'a pas été appliquée à la base de production.**

Avant de l'appliquer :
1. Vérifier la CI et la revue SQL.
2. Exécuter le workflow de prévisualisation en lecture seule sur cette branche.
3. Vérifier que la seule migration en attente est `20261012180000_platform_design_media_v1.sql`.
4. Appliquer uniquement après approbation explicite et contrôle des politiques de stockage.

## Reproductibilité

La réconciliation des deux migrations de vitrine aligne désormais les préfixes de fichiers avec les versions enregistrées par Supabase. Cela corrige l'écart observé dans le dernier aperçu CLI. La restauration complète depuis zéro n'est toutefois **pas certifiée** : le baseline est historique et doit être testé dans un projet de test séparé avant de servir à une reconstruction.

## Régénération des types

```bash
npm run db:types
npm run type-check
```

La génération des types est en lecture seule sur le schéma ; elle ne modifie pas la base de données.

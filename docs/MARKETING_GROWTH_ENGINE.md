# JDV CRM — Centre de croissance et d’intelligence marketing

## Objectif
Construire un centre professionnel et moderne qui aide les entreprises et commerçants clients à acquérir des prospects, convertir les visiteurs, fidéliser leurs clients et mesurer les résultats, avec des actions organiques et payantes. Cette première étape est additive : elle ne remplace aucune page existante et n’écrit aucune donnée en production.

## Expérience produit
- Interface premium, claire, responsive desktop/mobile, cohérente avec les composants et le thème JDV CRM.
- Vue d’ensemble : visiteurs, prospects, conversions, clients actifs, recommandations prioritaires et évolution sur une période.
- Croissance organique : vitrine, contenu, avis, référencement, liens de partage et parrainage.
- Publicité payante : préparation de campagnes, objectif, audience, budget estimé, calendrier et prévision explicitement marquée comme estimation.
- Recommandations explicables : priorité, raison, indicateur observé, action proposée, effort et mesure de réussite.
- États distincts : données disponibles, absence de données, erreur de chargement. Ne jamais afficher des chiffres de démonstration comme des résultats réels.

## Première version de l’algorithme
Le moteur pur TypeScript de `src/lib/marketing/recommendationEngine.ts` calcule un score déterministe à partir d’indicateurs explicitement fournis, retourne les raisons et suggère des actions. Il ne prétend pas être un modèle ML et ne lit pas directement la base de données.

## Événements à instrumenter après audit du schéma
- visite de vitrine (avec consentement et minimisation des données)
- clic sur appel à l’action
- demande de contact
- inscription terminée
- première action utile
- retour à 7 jours
- clic sur lien de parrainage et inscription attribuée
- source/campagne via UTM, sans secrets dans les URLs

Les métriques ne seront activées qu’après vérification des tables, des politiques RLS et des autorisations existantes. Aucun identifiant personnel inutile ne doit être collecté.

## Sécurité et séparation
- Les comptes entreprise ne voient que leurs propres données et agrégats autorisés.
- Le concepteur ne reçoit pas un accès global aux données opérationnelles privées des entreprises ; toute vue globale devra être agrégée et autorisée explicitement.
- Toute lecture/écriture côté serveur doit vérifier la session, le rôle et l’organisation sur le serveur, pas uniquement dans l’interface.
- Ne pas ajouter de fonction SECURITY DEFINER ou de politique RLS avant revue des migrations et du modèle de rôles.
- Aucun budget publicitaire n’est dépensé et aucune campagne n’est publiée automatiquement.

## Plan de livraison
1. Audit du code existant, du schéma Supabase, des migrations et des règles RLS.
2. Moteur de recommandations déterministe et tests unitaires.
3. Interface du centre de croissance connectée uniquement aux sources vérifiées.
4. Instrumentation des événements et calculs d’agrégats tenant-isolated.
5. Préparation de campagnes avec validation humaine.
6. Tests type-check/lint/tests/build et revue de sécurité.
7. Pull request pour revue ; aucun déploiement en production sans autorisation explicite.

## Critères d’acceptation
- Les recommandations indiquent toujours pourquoi elles sont proposées.
- Le moteur est déterministe, borné et testé sur les entrées nulles, négatives et extrêmes.
- Les données absentes ne sont pas converties artificiellement en zéro.
- Pas de dépendance ajoutée ni de modification de `package.json`.
- Aucune migration Supabase appliquée pendant cette phase.

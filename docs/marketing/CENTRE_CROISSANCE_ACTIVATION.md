# Centre de croissance — état des connexions et procédure d’activation

## État fonctionnel à ne pas masquer

- Le moteur `src/lib/marketing/recommendationEngine.ts` est un module pur : il calcule des recommandations à partir de mesures déjà autorisées. Il ne collecte pas lui-même les visites, les conversions, les avis ou les achats.
- Dans `src/app/hidden-concepteur-gate/dashboard/croissance-marketing/page.tsx`, les cinq mesures de départ sont explicitement `null`. Les cartes affichent donc « À connecter » et « — » : c’est un état non raccordé, pas une mesure à zéro.
- Le formulaire de campagne affiche une préparation de brouillon. Il ne constitue pas une connexion OAuth et ne publie pas sur un réseau.
- La liste d’actions peut être stockée dans le navigateur. Une coche ne signifie ni publication, ni synchronisation garantie, ni résultat marketing observé.
- Les migrations `jdv_marketing_campaigns` et `jdv_social_automation_organic_v1` sont des propositions versionnées dans GitHub. Leur présence dans le dépôt ne prouve pas qu’elles ont été appliquées à Supabase.

## Ordre sûr de mise en service

1. Vérifier la migration historique de Supabase et appliquer les migrations manquantes d’abord dans un environnement de test isolé.
2. Vérifier les policies RLS avec deux comptes de test distincts. Un compte ne doit voir que ses campagnes et connexions.
3. Implémenter les collecteurs de métriques sur des événements définis : visite de vitrine, clic de contact, demande envoyée, avis publié et achat confirmé. Ne pas assimiler une visite terrain à une visite web.
4. Calculer les taux sur une période explicitement affichée et montrer « données insuffisantes » quand le dénominateur manque.
5. Implémenter un parcours OAuth serveur pour chaque fournisseur, avec `state` anti-CSRF, validation de callback, scopes minimaux, chiffrement des jetons et révocation.
6. Vérifier les capacités réelles renvoyées par chaque plateforme et distinguer « compte connecté », « autorisé à publier » et « publication testée ».
7. Ajouter une file de publication avec prévisualisation, approbation humaine, fenêtre de campagne, idempotence, journal d’audit, gestion des erreurs et arrêt d’urgence.
8. Exécuter les tests sur des comptes et données de démonstration; contrôler les logs et les permissions avant toute mise en production.

## Configuration à préparer pour l’authentification sociale

Les identifiants d’application, secrets OAuth et clés de chiffrement doivent être ajoutés uniquement aux secrets du serveur / Supabase Edge Functions, jamais au code client, aux fichiers publics ou à GitHub.

Variables de configuration à définir lorsque l’application OAuth correspondante sera créée :

- `META_APP_ID`, `META_APP_SECRET`, URI de retour OAuth autorisée
- `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, URI de retour autorisée
- `X_CLIENT_ID`, `X_CLIENT_SECRET`, URI de retour autorisée
- clé de chiffrement des jetons côté serveur et version de clé
- URL publique exacte de l’application et URL de callback HTTPS

Ces noms sont une liste de configuration proposée, pas des secrets existants. Ne pas renseigner de valeurs factices en production.

## Critères de validation avant d’annoncer « activé »

- Le bouton Connecter lance l’autorisation du fournisseur et revient sur une URL vérifiée.
- Le compte, les scopes et les capacités sont récupérés depuis le fournisseur et visibles dans l’interface.
- Aucun jeton n’est lisible depuis le navigateur ni par le rôle SQL `authenticated`.
- Un utilisateur ne peut pas lire ou modifier les connexions d’un autre utilisateur.
- La déconnexion révoque ou supprime les jetons selon les capacités du fournisseur.
- Une publication ne peut être mise en file qu’après approbation, connexion valide et contrôle des capacités.
- Chaque envoi est idempotent et le statut réel du fournisseur est journalisé.
- Les métriques du Centre de croissance affichent une source, une période et une date de dernière mise à jour.
- Tous les scénarios passent en environnement de test isolé avant demande de déploiement.

## Garde-fous

Aucune migration de production, publication sociale, dépense publicitaire ou mise en production n’est autorisée par ce document. L’accès aux API, les permissions, la revue des applications et les limites de publication varient selon le fournisseur et doivent être confirmés dans son portail développeur officiel.

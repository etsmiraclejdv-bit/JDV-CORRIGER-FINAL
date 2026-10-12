# Pack de démonstration et recette JDV CRM

Ce pack sert à tester les sections et branches de JDV CRM sans polluer les données de production.

## Règles de sécurité

- Utiliser un projet Supabase de test séparé, ou une copie restaurée et anonymisée.
- Ne jamais injecter les fixtures dans le projet de production.
- Ne pas utiliser de vrais noms, numéros, emails, comptes bancaires ou pièces d'identité.
- Créer des comptes de test distincts pour chaque rôle ; ne jamais partager le compte concepteur.
- Exécuter d'abord les tests de lecture, puis les parcours d'écriture avec les données synthétiques.
- Chaque test doit vérifier l'accès autorisé ET l'accès refusé par un rôle non autorisé.
- Supprimer le jeu de démonstration uniquement depuis l'environnement de test et uniquement après vérification des références liées.

## Comptes fictifs proposés

| Compte de test | Rôle | Usage |
|---|---|---|
| demo.superadmin@example.test | SUPER_ADMIN | Studio de design, avis plateforme, contrôle global |
| demo.admin@example.test | ADMIN | Entreprise, équipe, entrepôts, catalogue, ventes |
| demo.manager@example.test | MANAGER | Suivi commercial et rapports limités |
| demo.prospecteur1@example.test | PROSPECTEUR | Prospection, rendez-vous, visites, ventes terrain |
| demo.prospecteur2@example.test | PROSPECTEUR | Test d'isolation entre deux agents |
| demo.warehouse@example.test | GESTIONNAIRE_ENTREPOT | Réceptions, mouvements, retours et clôture |
| demo.viewer@example.test | LECTURE_SEULE | Vérifier le refus des actions d'écriture |

Ces adresses sont des identifiants de documentation, pas des comptes créés. Ne leur attribuez pas de mot de passe dans Git.

## Données synthétiques

Le fichier `scenarios.json` contient des jeux de données et les résultats attendus. Les montants sont exprimés en XOF et les dates sont des dates de test. Utiliser un préfixe visible `DEMO-` pour chaque référence créée.

## Parcours à valider

1. Connexion, déconnexion, récupération de session et accès selon les rôles.
2. Création d'entreprise, statut actif/inactif, rattachement de l'équipe.
3. Création de prospect, conversion en client, visite et relance.
4. Création, déplacement et annulation d'un rendez-vous ; conservation de l'historique.
5. Catalogue, vente au comptant, vente à crédit, échéances, paiement partiel, retard et remboursement.
6. Réception de stock, transfert entre entrepôts, sortie terrain, retour et idempotence.
7. Sous-entrepôt : création réservée à l'administrateur ; refus pour un prospecteur.
8. Journal de stock et clôture quotidienne : stock initial + entrées - sorties = stock final.
9. Commissions et rapports : rapprochement avec les ventes validées et paiements.
10. Vitrine entreprise : seuls les champs publics et les avis publiés sont visibles.
11. Avis plateforme JDV CRM : envoi public, validation serveur, statut en attente, approbation concepteur et affichage public.
12. Studio de design : brouillon, prévisualisation, publication, restauration de version, couleurs, densité, arrondis, typographie, animation et média.
13. Navigation d'accueil : ancres, menu mobile, liens connexion, essai, actualités, contact et avis.
14. Accessibilité : navigation clavier, contraste, libellés de formulaire, réduction des animations.
15. Résilience : réseau coupé, erreur Supabase, double clic, rechargement et session expirée.

## Critères de sortie

- Aucun accès inter-organisation ou inter-prospecteur non autorisé.
- Aucune double écriture lorsqu'une requête est rejouée.
- Aucune clôture acceptée si les totaux ne se rapprochent pas.
- Aucun avis public en attente visible avant approbation.
- Aucune migration appliquée en production par le simple fait d'un commit ou d'une PR.
- CI verte et recette manuelle signée avant toute publication.

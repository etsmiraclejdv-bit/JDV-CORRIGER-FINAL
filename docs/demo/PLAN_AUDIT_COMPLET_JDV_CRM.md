# JDV CRM — plan d'audit de démonstration temporaire

## Objectif

Parcourir les sections de JDV CRM de façon reproductible, distinguer les défauts d'interface, les erreurs fonctionnelles, les écarts de base de données et les failles de permissions, puis retirer toutes les données de démonstration à la fin.

## Règles impératives

- Données synthétiques uniquement, avec le préfixe `DEMO-` et des adresses `@example.test`.
- Aucun compte, client, produit, stock ou mouvement réel ne doit être modifié.
- Ne pas utiliser la base de production pour charger le pack de démonstration.
- Les tests automatiques doivent rester sans écriture en production. Les tests manuels qui nécessitent des écritures doivent se faire dans un environnement isolé ou une base de test dédiée.
- Ne jamais créer de vrais utilisateurs Supabase avec des identités fictives dans le projet de production.
- Les captures d'écran doivent masquer les secrets et les données personnelles.
- Toute fonctionnalité non testable sans fournisseur externe doit être marquée « bloquée par configuration », pas « réussie ».

## Pack existant

Le jeu de scénarios se trouve dans `docs/demo/scenarios.json` et est contrôlé par `tests/demoPack.test.mjs`. Il contient déjà des rôles, deux organisations, des produits, des prospects, des ventes, des mouvements de stock et un avis en attente. Ce pack est un catalogue de données/scénarios, **pas encore un environnement de démonstration connecté automatiquement à chaque écran**.

## Matrice de validation

Pour chaque test, noter : résultat `PASS`, `FAIL`, `BLOCKED` ou `NOT TESTED`, preuve (capture/log sans données sensibles), étape de reproduction, gravité, et ticket correctif.

| Domaine | Vérifications obligatoires |
|---|---|
| Accès et rôles | Connexion/déconnexion, rôle attendu, routes protégées, accès refusé par URL directe, expiration de session |
| Concepteur | Compte concepteur séparé, paramètres et brouillons propres, aucune donnée opérationnelle privée des entreprises affichée |
| Entreprise | Création, profil, paramètres, utilisateurs et séparation entre deux organisations |
| Terrain / prospecteurs | Création et affectation des prospects, rendez-vous modifiables, visibilité limitée aux dossiers autorisés |
| Entrepôt | Création, entrées/sorties, stock négatif interdit, clôture journalière et journal horodaté |
| Sous-entrepôt | Rattachement au bon entrepôt, responsable autorisé, interdiction de manipuler un autre entrepôt |
| Approvisionnement prospecteur | Préparation côté entrepôt, code de traçabilité, confirmation par scan ou saisie manuelle, stock cohérent |
| Agence | Accès séparé de l'entrepôt, rôle dédié, périmètre des données vérifié |
| Produits / codes | Création article, unité, prix, code-barres/QR, scan caméra et scanner externe si matériel disponible |
| Ventes / paiements | Vente comptant, crédit, paiement partiel, calculs, annulation/retour et historique |
| Clients / prospects | Création, recherche, affectation, conversion et droits par utilisateur |
| Finances / rapports | Totaux, filtres par période, rapprochement avec les opérations de démonstration |
| Avis publics | Envoi d'un avis, état en attente, aucune publication sans modération |
| Vitrine publique | Chargement, navigation, contact, sélecteur de langue et absence de contenu privé |
| Studio de design | Brouillon isolé, aperçu, publication contrôlée, restauration de version |
| Langues / mobile | Changement réel de langue, navigation sur petit écran, formulaires et tableaux utilisables |
| Assistant IA | Réponse de repli, erreurs compréhensibles, aucun secret côté navigateur, respect des droits de données |
| Marketing | Trois visuels dans le bon ordre, brouillon privé, aucune publication sociale ou dépense automatique |
| Base / migrations | Comparer migrations GitHub/Supabase, contraintes, RPC, RLS, droits anon/authenticated et absence de doublons |
| Sécurité / fichiers | Validation de fichiers, accès Storage, permissions RLS, absence de secrets dans les réponses réseau |
| Erreurs / accessibilité | Console sans erreur bloquante, liens/boutons actifs, labels de formulaire, états vide/chargement/erreur |

## Ordre d'exécution recommandé

1. Tests unitaires, type-check, lint et build strict.
2. Vérifications de schéma et politiques en lecture seule.
3. Tests UI avec fixtures synthétiques dans un environnement isolé.
4. Tests de parcours par rôle, puis tests de séparation entre organisations.
5. Vérification visuelle ordinateur et mobile.
6. Rapport de défauts triés par sévérité ; ne corriger que dans une branche/PR.
7. Retrait des données de démonstration et vérification d'absence de résidus.

## Procédure de retrait — obligatoire avant clôture

1. Désactiver l'accès au mode démo et arrêter les scénarios automatisés.
2. Exporter uniquement le rapport de tests, sans secrets ni données personnelles.
3. Supprimer les fixtures créées dans l'environnement de test dédié à l'aide de leur préfixe `DEMO-` ou de leur identifiant de lot ; ne pas lancer de suppression globale sur la production.
4. Vérifier les tables, le stockage et les comptes de test de l'environnement isolé : aucun élément du lot ne doit rester.
5. Rejouer les tests de sécurité pour confirmer que le mode démo est désactivé et que les données réelles sont intactes.
6. Garder `docs/demo/scenarios.json` et les tests automatiques versionnés : ce sont des spécifications et des tests, pas des enregistrements de démonstration actifs.

## Limites actuelles

Ce document prépare l'audit ; il ne signifie pas que chaque écran a déjà été parcouru manuellement. L'automatisation complète du parcours UI et la connexion à un environnement de test isolé sont des étapes à réaliser avant de déclarer le CRM validé.

# JDV CRM — démonstration et audit de bout en bout

## Objectif

Exécuter un premier contrôle reproductible de toutes les pages déclarées dans `src/app`, détecter les marqueurs de conflits Git oubliés et repérer les pages vides. Ces contrôles sont sans écriture en production : ils ne se connectent ni à Supabase ni aux réseaux sociaux.

## Lancer les contrôles

Depuis la racine du dépôt, avec Node 22 (version attendue par le projet) :

```powershell
npm ci
npm test
npm run type-check
npm run lint
npm run build
```

Le test `full-app-demo-audit.test.mjs` imprime l’inventaire des pages détectées. La CI GitHub exécute les tests, le contrôle TypeScript, le lint et le build lors de la demande de fusion.

## Parcours fonctionnel manuel A → Z

À exécuter dans un environnement de démonstration distinct de la production, avec des comptes de test et des données fictives :

1. Page publique : chargement, logo, sélecteur de langue, liens et formulaires.
2. Authentification : connexion, déconnexion, récupération du mot de passe et refus des accès non autorisés.
3. Concepteur : navigation, personnalisation, aperçu, brouillon et restauration.
4. Entreprise : création, paramètres, vitrine, produits, clients, avis et tableaux de bord.
5. Entrepôt et sous-entrepôt : création, stock, entrées/sorties, transfert et clôture.
6. Prospecteur / terrain : rendez-vous, clients, scan ou saisie manuelle, approvisionnement et confirmation de réception.
7. Agence : connexion, droits distincts, opérations autorisées et refus des accès entre rôles.
8. Campagnes et centre de croissance : sauvegarde, indicateurs, recommandations et états « à connecter » explicites.
9. Paiements et finances : validation des formulaires et tests simulés uniquement, sans transaction réelle.
10. Assistant IA, langues, mode portable et affichage mobile : navigation, erreurs réseau et état de secours.
11. Sécurité : cloisonnement entre entreprises, contrôle RLS, absence de secrets dans le navigateur et refus des actions non autorisées.
12. Parcours complet : enchaîner création → approvisionnement → réception → vente/activité → rapport, puis vérifier la cohérence des données de test.

## Limites du contrôle automatisé

Ce test statique ne prouve pas qu’un bouton fonctionne dans un navigateur et ne valide pas l’authentification réelle, les politiques RLS, les intégrations OAuth ou les workflows métier contre Supabase. Ces tests nécessitent un environnement de préproduction, des identifiants de test et des scénarios navigateur dédiés. Ne jamais utiliser de comptes réels ni déclencher de publication ou de paiement pendant la démonstration.

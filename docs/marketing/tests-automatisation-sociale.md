# Tests de préparation — automatisation sociale

## Mode actuel
Le worker est un outil de **dry-run seulement**. Il ne met pas à jour les posts et ne contacte aucune API sociale. Le secret `JDV_SOCIAL_WORKER_SECRET` doit être long, aléatoire et stocké uniquement dans les secrets de l’environnement de développement. Cette fonction n’est pas déployée par cette PR.

## Vérifications à exécuter en développement isolé
1. Requête sans secret : 401.
2. Secret absent côté serveur ou service role absent : 503.
3. Campagne non approuvée, hors fenêtre, en pause, budget différent de zéro ou canal non organique : publication bloquée.
4. Propriétaire de campagne différent du propriétaire du post : publication bloquée.
5. Connexion absente, non connectée ou jamais vérifiée : publication bloquée.
6. Connexion valide : résultat `dry_run_only`, zéro appel fournisseur, aucune mutation.
7. Deux appels identiques : aucune publication ni mutation; l’idempotence réelle reste à valider avec une fonction atomique de claim avant d’ajouter un worker actif.

## Avant d’implémenter les adaptateurs
- Créer les applications développeur officielles, renseigner les URLs de rappel et faire approuver les scopes requis.
- Ajouter OAuth serveur avec `state` signé, usage unique, vérification du propriétaire et stockage chiffré des jetons.
- Implémenter une RPC atomique pour réserver une tâche avec verrouillage/lease et idempotence.
- Définir les scopes obligatoires et tester les capacités par plateforme; ne pas considérer un simple statut connecté comme suffisant.
- Construire un adaptateur distinct par plateforme, tests contractuels avec comptes de test et gestion des erreurs ambiguës.
- Ne pas activer un flag de publication réelle dans cette fonction; créer un déploiement séparé, soumis à approbation explicite après audit.

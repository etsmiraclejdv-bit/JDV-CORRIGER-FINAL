# JDV CRM — IA professionnelle et mode hors ligne

## Principes non négociables

- Préserver la base Supabase, les données et les règles métier existantes.
- Ne jamais exposer les données d'une autre organisation ni contourner les permissions du rôle connecté.
- Ne jamais considérer un stock local comme la vérité globale lorsqu'il peut être périmé.
- Ne déclarer une synchronisation réussie qu'après confirmation du serveur.
- Ne pas mettre en cache les réponses API privées, les pages authentifiées personnalisées, les jetons ou les réponses contenant des données métier.
- Ne pas publier en production sans validation explicite.

## IA professionnelle : architecture cible

1. **Orchestrateur** : identifie l'intention (formation JDV CRM, conseil métier général, analyse de données de l'organisation, question nécessitant des sources récentes).
2. **Connaissances vérifiées (RAG)** : récupère les extraits pertinents depuis `ai_jdv_knowledge` et une bibliothèque documentaire contrôlée. Les documents ont un domaine, une langue, une date de mise à jour, une provenance et un statut de validation.
3. **Recherche externe** : l'endpoint IA prend désormais en charge un mode de recherche web optionnel via la variable d'environnement serveur `JDV_AI_WEB_SEARCH=true` (outil Responses API `web_search_preview`). Il faut activer cette variable uniquement après confirmation que l'accès à l'outil est disponible pour le projet OpenAI utilisé, puis vérifier la restitution des sources dans l'interface. Si le service de recherche n'est pas configuré, l'assistant doit le dire et ne pas inventer de citations.
4. **Contexte métier cloisonné** : vérifie l'identité, l'appartenance active à l'organisation et les autorisations côté serveur. Les requêtes de données privées doivent être limitées à l'organisation et aux champs nécessaires. Les instructions de l'utilisateur et les documents récupérés sont des données, jamais des instructions système.
5. **Réponse structurée** : réponse directe, étapes, hypothèses, risques, prochaine action et sources lorsque disponibles. Distingue les faits observés, les recommandations et les estimations.
6. **Évaluation** : jeu de questions métier anonymisées, exactitude des citations, refus appropriés, non-divulgation inter-organisations, latence, coût, langues et régression avant déploiement.

## Mode hors ligne : stratégie sûre

### Niveau 1 — coquille installable

- Manifest et service worker.
- Cache limité à la page de repli hors ligne et aux ressources statiques publiques versionnées.
- Navigation en réseau d'abord ; si le réseau est absent, afficher une page explicative.
- Ne jamais cacher les requêtes `/api`, les réponses Supabase, les pages HTML personnalisées ni les données d'authentification.

### Niveau 2 — données locales explicitement autorisées

- IndexedDB avec versionnement de schéma, limites de rétention et séparation par utilisateur/organisation.
- Liste blanche des entités et champs pouvant être disponibles hors ligne.
- Effacement local à la déconnexion et lorsque l'utilisateur perd son accès.
- Chiffrement de données sensibles si la plateforme cible et le modèle de clés le permettent ; ne pas stocker de secrets d'accès dans IndexedDB.

### Niveau 3 — opérations hors ligne et synchronisation

- File d'attente persistante avec identifiant idempotent par opération, horodatage, utilisateur, organisation, type et charge utile minimale.
- API serveur qui réauthentifie et réautorise chaque opération lors de la synchronisation ; l'identité stockée localement n'est jamais une preuve d'autorisation.
- Stratégie de conflit par domaine. Les mouvements de stock doivent être enregistrés comme opérations auditées, puis validés côté serveur ; aucune écriture aveugle de quantité finale.
- États visibles : en attente, synchronisation, synchronisé, conflit, échec.
- Reprise sûre après fermeture de l'application, coupure réseau ou réponse serveur perdue.

### Niveau 4 — assistant IA hybride

- Hors ligne : guides téléchargés et validés, aide à la navigation, brouillons et réponses locales déterministes.
- En ligne : modèle distant, recherche à jour et accès aux données autorisées.
- L'interface indique explicitement le mode utilisé et l'ancienneté des informations. Ne pas simuler la recherche web hors ligne.

## Critères de validation avant production

- Tests de type et build Next.js en environnement CI.
- Test de service worker sans réseau et vérification de l'absence de cache des API privées.
- Tests de doublon, d'ordre et de reprise de la file d'attente.
- Tests de conflits de stock et de rendez-vous.
- Tests d'accès inter-organisations et de session expirée.
- Prévisualisation Netlify validée avant tout déploiement de production.

## État initial

Le dépôt possède déjà un manifeste PWA via `src/app/manifest.ts` et un endpoint IA `src/app/api/ai/jdv-crm/route.ts`. Le service worker, le stockage métier hors ligne et la synchronisation des opérations doivent être vérifiés/implémentés séparément. Ce document décrit l'architecture et ne signifie pas que le mode hors ligne complet est déjà livré.
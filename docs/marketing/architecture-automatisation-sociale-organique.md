# JDV CRM — architecture d’automatisation organique des réseaux sociaux

## Décision validée
- Publication automatique sur 14 jours après une validation initiale explicite de la campagne.
- Campagne **organique uniquement** : budget strictement égal à 0, aucune création de campagne publicitaire et aucun achat média.
- Aucun déploiement en production et aucune publication réelle avant audit des connexions, autorisations, scopes et tests à blanc.
- Les brouillons existants restent des brouillons. La création d’une connexion ne vaut pas consentement à publier.

## État constaté pendant l’audit
- Le CRM possède déjà `public.jdv_marketing_campaigns`, une interface de croissance marketing et des règles RLS qui isolent les campagnes par compte.
- Les Edge Functions Supabase actuellement listées sont `send-email`, `resend-service-mail` et `company-ai-review`. Aucune fonction de publication sociale ni fonction planifiée de ce flux n’a été constatée.
- La migration de schéma proposée ici n’a pas été appliquée à Supabase. Aucune Edge Function n’a été déployée et aucun réseau social n’a été contacté pour publier.

## Architecture cible

1. **Interface Concepteur > Croissance marketing**
   - Montrer les comptes connectés et leur statut vérifié, les autorisations manquantes, la portée accordée et la date de dernière vérification.
   - Bouton explicite « Valider et démarrer les 14 jours » avec résumé des plateformes, du contenu, du fuseau horaire et du budget à 0 XOF.
   - Boutons Pause immédiate, Annuler la campagne et Déconnecter le compte.
   - Ne jamais afficher les jetons OAuth ni permettre au navigateur de les lire.

2. **OAuth par fournisseur**
   - Flux OAuth serveur avec `state`/nonce à usage unique, vérification du rappel, scopes minimaux et contrôle de propriété du compte.
   - Stocker les jetons uniquement chiffrés côté serveur; clé de chiffrement dans les secrets Supabase, jamais dans le navigateur, GitHub ou les journaux.
   - Re-vérifier les autorisations et capacités avant activation, puis périodiquement; si le jeton expire ou un scope manque, mettre en pause la plateforme concernée.
   - Les comptes professionnels, applications vérifiées et approbations fournisseurs peuvent être requis.

3. **Calendrier et file de publication**
   - Générer les publications prévues en avance, dans le fuseau `Africa/Porto-Novo`, sur 14 jours à partir de l’approbation.
   - Stocker une clé d’idempotence unique par publication et plateforme. Verrouiller atomiquement les tâches à traiter pour éviter les doubles publications.
   - Le planificateur appelle un worker serveur qui vérifie de nouveau : campagne approuvée/non pausée, date dans la fenêtre, budget nul, connexion active, scopes valides, type de média accepté, limites et capacités propres à la plateforme.
   - Réessais limités avec backoff pour les erreurs temporaires; aucune répétition aveugle après une réponse ambiguë du fournisseur. Journaliser le résultat et l’identifiant du post.

4. **Tables proposées**
   - `jdv_social_connections`: métadonnées de compte, scopes et état de connexion, lisibles uniquement par le propriétaire.
   - `jdv_social_connection_secrets`: jetons chiffrés, accès réservé à `service_role`; aucune politique de lecture utilisateur.
   - `jdv_social_posts`: calendrier, état, idempotence et résultat; lecture isolée par propriétaire.
   - Colonnes d’approbation, de fenêtre de 14 jours, de pause et de fuseau horaire sur `jdv_marketing_campaigns`.
   - Migration proposée : `supabase/migrations/20261018190000_jdv_social_automation_organic_v1.sql`.

## Compatibilité des plateformes (à confirmer au moment de l’activation)
- **Facebook Pages / Instagram professionnel** : APIs Meta, compte/page admissible, permissions et jetons approuvés.
- **X** : API X et accès développeur approprié; publication conditionnée aux droits et quotas du compte développeur.
- **TikTok** : Content Posting API, scopes et examen/autorisation applicables; ne pas présumer que la publication publique est permise avant audit.
- **Threads** : API Threads, permissions et compte admissible.
- **WhatsApp** : intégrer seulement les capacités officiellement disponibles pour WhatsApp Business. Ne pas promettre la publication de *Statuts WhatsApp* via une API publique sans confirmation officielle; la messagerie Business n’est pas équivalente aux Statuts.
- Si une plateforme ne permet pas la publication automatique ou si les droits ne sont pas vérifiés, afficher « Non disponible — action manuelle requise » et ne pas tenter de contourner la restriction.

## Sécurité et contrôles bloquants
- Le worker doit refuser toute publication si `approved_at` est nul, si la campagne est hors fenêtre, si la connexion n’est pas vérifiée, si le scope de publication manque, si le budget n’est pas exactement zéro ou si le compte ne correspond pas au propriétaire.
- Aucun secret dans les variables `NEXT_PUBLIC_*`, les fichiers suivis, les erreurs client ou les journaux.
- Validation serveur des URL média, taille/type MIME, limites de texte et politique de contenu de chaque fournisseur.
- RLS/GRANT à tester avec utilisateur A, utilisateur B, rôle anon et service role. Les utilisateurs ne doivent jamais lire les secrets d’un autre compte.
- Bouton d’arrêt global côté serveur; suspendre une campagne si les scopes sont révoqués ou les erreurs d’authentification répétées.

## Plan de livraison sans production
1. Examiner cette PR et la migration SQL; ne pas l’appliquer à la base de production.
2. Ajouter les flux OAuth et les workers dans une branche de développement, avec clés de test uniquement.
3. Écrire les tests RLS, validation de fenêtre 14 jours, budget 0, idempotence, expiration de jeton, pause/annulation et réponses simulées fournisseurs.
4. Exécuter des tests à blanc (aucun appel de publication) et produire un rapport par plateforme.
5. L’utilisateur connecte et autorise explicitement chaque compte; vérifier les scopes, l’identité du compte, les capacités de publication et les conditions de chaque API.
6. Après validation séparée, demander une autorisation explicite pour fusionner/déployer. Ne jamais activer l’envoi réel automatiquement à la fusion.

## Critères d’acceptation
- Aucune publication ni dépense publicitaire pendant la phase de préparation.
- La campagne n’est planifiée qu’après approbation explicite et connexion vérifiée.
- Au plus une publication par clé d’idempotence; fenêtre stricte de 14 jours et arrêt immédiat sur pause.
- État, horodatage, plateforme, tentatives et erreurs consultables sans exposer de secrets.
- Tests démontrant l’isolation des comptes et l’impossibilité d’insérer des posts non approuvés.

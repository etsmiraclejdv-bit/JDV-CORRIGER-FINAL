# Matrice de recette par branche et section

Cocher une ligne uniquement après test avec un compte de rôle correspondant et capture du résultat. Cette matrice est une recette manuelle, pas une déclaration que les parcours ont déjà passé.

Légende : **OK** = testé et validé ; **KO** = échec ; **À TESTER** = pas encore exécuté.

## Site public JDV CRM

| Section | Cas positif | Cas négatif / robustesse | Statut initial |
|---|---|---|---|
| Accueil / navigation | Liens vers sections et connexion | Ancre absente, menu mobile, clavier | À TESTER |
| Présentation / services | Informations visibles et liens actifs | Écran étroit et zoom 200 % | À TESTER |
| Fonctionnalités | Chaque fonctionnalité mène au bon contenu | Pas de lien mort | À TESTER |
| Actualités / Google | Ouverture du panneau et liens externes sûrs | Flux indisponible, chargement vide | À TESTER |
| Tarifs | Prix et conditions lisibles | Aucun prix trompeur / élément tronqué | À TESTER |
| Inscription entreprise | Validation du formulaire et message clair | Champs invalides, doublon, session expirée | À TESTER |
| Contact concepteur | Quatre numéros, email et localisation affichés | Liens téléphone et email corrects | À TESTER |
| Avis JDV CRM | Note 1–5 et texte envoyés | Limite de débit, champs trop longs, avis en attente non public | À TESTER |
| Loading / introduction | Informations de contact et navigation visibles | Respect de la réduction des mouvements | À TESTER |
| Vitrine entreprise | Champs publics et avis publiés | Entreprise inactive et avis en attente cachés | À TESTER |

## Branche Entreprise / Administrateur

| Section | Cas positif | Cas négatif / robustesse | Statut initial |
|---|---|---|---|
| Tableau de bord | KPI rapprochés des ventes et paiements | Valeurs absentes ou chargement en erreur | À TESTER |
| Équipe / prospecteurs | Création et affectation autorisées | Rôle non autorisé, email déjà utilisé | À TESTER |
| Prospects | Créer, modifier, convertir, archiver | Un agent ne modifie pas le portefeuille d’un autre | À TESTER |
| Clients | Fiche et historique corrects | Données d’une autre organisation invisibles | À TESTER |
| Visites / relances | Date, résultat et prochaine action enregistrés | Date invalide, accès inter-agent | À TESTER |
| Rendez-vous | Déplacer jour/heure et conserver l’historique | Un agent ne peut modifier le rendez-vous d’un autre | À TESTER |
| Catalogue | Création, édition, activation, prix | Prix invalide et article archivé en vente | À TESTER |
| Ventes | Vente comptant et crédit | Stock insuffisant et double soumission | À TESTER |
| Paiements / finances | Paiement partiel, échéance, reçu | Paiement dupliqué ou confirmation client falsifiée | À TESTER |
| Commissions | Calcul conforme à la règle active | Vente annulée/retournée et paiement incomplet | À TESTER |
| Entrepôts | Réception, transfert, approvisionnement | Transfert d’une quantité supérieure au stock | À TESTER |
| Sous-entrepôts | Création admin et affectation | Refus serveur pour prospecteur / lecture seule | À TESTER |
| Mouvements de stock | Entrée, sortie, retour, stock final | Idempotence et stock négatif | À TESTER |
| Clôture journalière | Rapprochement des mouvements | Clôture incohérente ou déjà clôturée | À TESTER |
| Retours | Agent, heure, article et destination conservés | Retour sans vente/source valide | À TESTER |
| Avis clients | Avis en ligne reçu et modéré | Avis caché non affiché sur la vitrine | À TESTER |
| Rapports | Totaux rapprochés des opérations | Filtre date, pagination, données vides | À TESTER |
| Journal d’audit | Action sensible tracée | Un utilisateur ne peut modifier le journal | À TESTER |
| Paramètres / personnalisation | Charte d’entreprise appliquée | Organisation différente non affectée | À TESTER |

## Branche Prospecteur / Terrain

| Section | Cas positif | Cas négatif / robustesse | Statut initial |
|---|---|---|---|
| Tableau de bord terrain | KPI de l’agent connecté | Aucune donnée d’un autre agent | À TESTER |
| Mes prospects | Création et suivi du portefeuille | Modification d’un prospect non attribué refusée | À TESTER |
| Mes clients | Consulter ses clients et historique | Client d’un autre portefeuille inaccessible | À TESTER |
| Visites | Enregistrer une visite terrain | Géolocalisation refusée ou réseau coupé | À TESTER |
| Rendez-vous | Modifier date/heure du rendez-vous autorisé | Historique de modification préservé | À TESTER |
| Mes ventes | Vente comptant/crédit sur articles autorisés | Stock insuffisant, prix ou quantité invalides | À TESTER |
| Encaissements | Enregistrer paiement autorisé | Rejeu du même paiement détecté | À TESTER |
| Approvisionnement | Demande et réception traçables | Quantité supérieure à la demande refusée | À TESTER |
| Retours de stock | Retour associé à l’agent et à l’article | Article non attribué ou retour dupliqué refusé | À TESTER |
| Commissions | Montant affiché cohérent avec les ventes | Pas de modification de taux par agent | À TESTER |
| Personnalisation de l’écran | Thème, couleur, taille de texte et réduction d’animations | Préférences privées et thème global préservés | À TESTER |
| Assistant IA | Réponses qui guident vers la bonne section | Pas de fuite de données ou d’instructions dangereuses | À TESTER |

## Branche Entrepôt / Sous-entrepôt

| Section | Cas positif | Cas négatif / robustesse | Statut initial |
|---|---|---|---|
| Réception / entrée | Quantité, heure, article et source enregistrés | Réception en double | À TESTER |
| Sortie / transfert | Source et destination cohérentes | Source sans stock suffisant | À TESTER |
| Journal quotidien | Stock initial + entrées - sorties = stock final | Écart de quantité détecté | À TESTER |
| Retours | Nom de l’agent, date/heure et code article présents | Retour sans traçabilité | À TESTER |
| Clôture | Totaux calculés et clôture verrouillée | Modification non autorisée après clôture | À TESTER |
| Sous-entrepôts | Responsable, droits et historique | Création interdite aux rôles non admin | À TESTER |

## Branche Concepteur / Super-administrateur

| Section | Cas positif | Cas négatif / robustesse | Statut initial |
|---|---|---|---|
| Entreprises | Statuts et dossiers consultables | Pas d’accès anonyme aux dossiers privés | À TESTER |
| Demandes d’entreprise | Validation et revue documentaire tracées | Dossier incomplet ou document illisible | À TESTER |
| Utilisateurs / prospecteurs | Recherche et contrôle des rôles | Pas d’élévation de privilège par l’interface | À TESTER |
| Paiements plateforme | États vérifiés côté serveur | Webhook rejoué ou signature invalide | À TESTER |
| Maintenance | Action limitée au concepteur | Action sensible auditée | À TESTER |
| Journal d’audit | Historique lisible et intègre | Modification/suppression refusée | À TESTER |
| Studio de design | Brouillon, prévisualisation, publication, restauration | Brouillon non publié invisible au public | À TESTER |
| Médias de design | Import d’image/vidéo validé et aperçu | MIME interdit, taille > 50 Mo, rôle non autorisé | À TESTER |
| Annonces / mises à jour | Texte, visuel/vidéo publiés sur l’accueil | Annonce brouillon non visible publiquement | À TESTER |
| Avis plateforme | Modérer, approuver ou rejeter les avis | Un visiteur ne peut approuver son propre avis | À TESTER |
| Configuration globale | Couleurs, typographie, formes et animation | Respect de `prefers-reduced-motion` | À TESTER |

## Conditions de validation finale

- Tous les cas de sécurité négatifs doivent réussir (l’accès doit être refusé).
- Aucun test de recette ne doit utiliser le projet Supabase de production.
- Enregistrer les résultats avec : date, branche, rôle testé, scénario, résultat, capture/log sans données personnelles.
- Les défauts critiques et élevés doivent être corrigés avant toute publication Netlify.

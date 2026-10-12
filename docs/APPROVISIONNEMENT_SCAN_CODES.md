 feature/jdv-scan-approvisionnement
# JDV CRM — Architecture du scan et de la réception des approvisionnements

## Décision validée
- Entrepôt : lecteur USB/Bluetooth (mode clavier/HID) et saisie manuelle de secours.
- Prospecteur : caméra du smartphone, avec saisie manuelle de secours.
- Un catalogue d'articles partagé : code interne unique par entreprise, code-barres fabricant facultatif et référence affichée.
- Le scan identifie la référence article. Il ne signifie pas à lui seul que chaque unité physique possède un identifiant unique.

## Fichiers d'interface ajoutés sur la branche de travail
- `src/app/business/dashboard/catalogue/page.tsx` : saisie du code-barres et du type de code sur la fiche article.
- `src/app/entrepot/dashboard/expeditions-prospecteurs/page.tsx` : préparation par lecteur USB/Bluetooth, contrôle du stock central et création du bon.
- `src/app/terrain/dashboard/reception-marchandises/page.tsx` : réception par caméra lorsque `BarcodeDetector` est pris en charge, saisie manuelle de secours, comparaison des quantités.
- Les menus entrepôt et terrain pointent vers ces écrans.
- `src/lib/services/catalogueService.ts` et `src/types/database.types.ts` transportent les métadonnées code-barres.

## État d'intégration et limites à lever
- Les pages et les migrations sont uniquement dans la branche `feature/jdv-scan-approvisionnement`; aucune migration n'a été appliquée à Supabase.
- Le lecteur USB/Bluetooth de type HID est traité comme un clavier qui termine la lecture par Entrée.
- La lecture par caméra utilise actuellement l'API native `BarcodeDetector`. Sa disponibilité dépend du navigateur et du téléphone; les appareils incompatibles doivent utiliser la saisie manuelle. Avant mise en service générale, intégrer une bibliothèque de décodage compatible avec les navigateurs ciblés et verrouiller sa version dans le fichier de verrouillage npm.
- L'impression d'étiquettes graphiques (code-barres/QR) reste à ajouter. Les codes fabricant peuvent être saisis dès que la migration est appliquée; le code interne reste disponible comme solution de saisie manuelle.
- Exécuter ensuite le contrôle TypeScript/build et les tests transactionnels sur un projet Supabase de développement avant de fusionner ou déployer.

## Écrans à construire

### A. Catalogue / fiche article
Champs : code interne, code-barres, type de code (interne/EAN-13/EAN-8/UPC-A/Code 128/QR/autre), désignation, unité, prix de revient, stock et seuil d'alerte.
Actions : générer/imprimer une étiquette, vérifier l'unicité, désactiver un article sans supprimer son historique.
Règle : unicité du code-barres au sein d'une organisation; les codes fabricant existants sont conservés.

### B. Entrepôt — Préparer et expédier
1. Choisir l'entrepôt actif et le prospecteur autorisé.
2. Ouvrir un bon brouillon avec numéro unique.
3. Scanner les références une à une avec lecteur USB/Bluetooth; chaque lecture valide ajoute une unité ou incrémente la quantité selon le mode de comptage choisi.
4. Pour les cartons, permettre la saisie d'une quantité après un scan, sans prétendre que le scan représente plusieurs unités physiques.
5. Afficher quantité attendue, quantité scannée, stock disponible et alertes.
6. Bloquer les codes inconnus, articles inactifs, doublons de ligne et quantités supérieures au stock disponible.
7. Au bouton « Expédier », vérifier à nouveau le stock côté serveur et effectuer atomiquement la sortie de l'entrepôt, l'enregistrement du mouvement et le passage du bon à « En transit / En attente de réception ».

### C. Prospecteur — Réceptionner
1. Lister les bons « En attente de réception » assignés au prospecteur connecté.
2. Ouvrir le bon et scanner les articles reçus avec la caméra du téléphone.
3. Pour chaque article, afficher expédié, scanné/reçu, accepté, endommagé et manquant.
4. Signaler tout code inconnu ou article non attendu; autoriser une réception partielle avec commentaire.
5. À « Confirmer la réception », recalculer et valider côté serveur, puis augmenter le stock disponible du prospecteur uniquement de la quantité acceptée.
6. Le bon passe à « Reçu », « Reçu partiellement » ou « Litige »; conserver le détail des écarts.

### D. Responsable — Analyse et rapprochement
- Bons en brouillon, en transit, reçus, partiellement reçus et en litige.
- Quantités expédiées vs acceptées vs endommagées vs manquantes.
- Valeur au coût unitaire, mouvements par date, entrepôt, article et prospecteur.
- Historique de scans, utilisateur, heure, appareil, code lu et résultat.
- Export/impression du bon et du rapport d'écarts.

## Cycle de stock à respecter
1. Brouillon : aucun mouvement de stock.
2. Expédition confirmée : décrémenter le stock disponible de l'entrepôt une seule fois; enregistrer le mouvement et les unités en transit. Ne pas encore créditer le stock disponible du prospecteur.
3. Réception confirmée : créditer le stock du prospecteur de la quantité acceptée une seule fois; les unités endommagées restent séparées et les manquants sont signalés au responsable.
4. Réconciliation : toute correction doit être un mouvement compensatoire traçable, jamais une modification silencieuse d'un ancien mouvement.
5. Les RPC doivent être transactionnelles, idempotentes, vérifier organisation/rôle/affectation, verrouiller les lignes de stock et rejeter les quantités négatives.

## Modèle de données
- `articles.barcode`, `articles.barcode_type` : identifiant scannable.
- `prospecteur_supply_shipments` : en-tête du bon, source, destinataire, état et horodatages.
- `prospecteur_supply_shipment_items` : quantités expédiées, reçues, acceptées, endommagées et manquantes; snapshots du code et du nom pour préserver l'historique.
- `prospecteur_supply_scan_events` : journal immuable des scans, appareil et résultat.
- Tables existantes réutilisées : `warehouse_inventory`, `prospecteur_stocks`, `prospecteur_stock_holdings`, `stock_movements`, `prospecteur_warehouse_assignments`.

## Compatibilité des scanners
- USB/Bluetooth HID : le lecteur se comporte comme un clavier et envoie généralement Entrée après le code; l'écran doit garder le focus sur le champ de scan et éviter les doubles lectures.
- Caméra : demander la permission uniquement après action explicite, permettre le changement de caméra, arrêter le flux à la fermeture et afficher une solution de secours si le navigateur ne prend pas en charge le décodage.
- Ne pas dépendre uniquement de l'API navigateur BarcodeDetector, car son support varie. Avant mise en production, intégrer et verrouiller une bibliothèque de décodage multi-navigateurs et vérifier ses licences.
- HTTPS requis pour l'accès caméra en production.

## Sécurité et migration
La migration SQL associée ajoute le schéma et les politiques de lecture, sans toucher aux quantités existantes. Les tables n'autorisent pas les écritures directes depuis le client. Les RPC d'expédition/réception doivent être livrées et testées séparément avant activation du flux dans l'interface.
Les politiques RLS complètent les permissions SQL; elles ne remplacent pas la validation métier dans les RPC.
Voir : https://supabase.com/docs/guides/database/postgres/row-level-security
=======
# Approvisionnement entre l’entrepôt et le prospecteur — scan

## Parcours prévu

1. L’administrateur ou le personnel autorisé ouvre **Entrepôt → Expéditions prospecteurs**.
2. Il choisit un prospecteur affecté à l’entrepôt et scanne les codes-barres avec un lecteur USB/Bluetooth (émulation clavier avec Entrée).
3. Le serveur valide l’organisation, l’affectation, le code article, les quantités disponibles et la clé d’idempotence. L’expédition diminue le stock de l’entrepôt et crée un mouvement traçable.
4. Le prospecteur ouvre **Terrain → Réception marchandises**, sélectionne le bon, scanne ou saisit chaque code, puis confirme les quantités réellement reçues.
5. Le serveur vérifie les codes scannés, les quantités reçues/manquantes et inscrit le stock accepté du prospecteur. Les écarts sont enregistrés comme réception partielle ou litigieuse.

## Fichiers concernés

- `supabase/migrations/20261012170000_prospecteur_barcode_shipments_schema_v1.sql` : colonnes code-barres, bons, lignes et événements de scan.
- `supabase/migrations/20261012173000_prospecteur_barcode_shipment_rpcs_v1.sql` : RPC atomiques d’expédition et de réception.
- `src/app/entrepot/dashboard/expeditions-prospecteurs/page.tsx` : préparation et expédition.
- `src/app/terrain/dashboard/reception-marchandises/page.tsx` : réception et contrôle.
- `src/app/business/dashboard/catalogue/page.tsx` et `src/lib/services/catalogueService.ts` : métadonnées code-barres de l’article.
- Les deux layouts de navigation exposent les nouveaux écrans.

## Limites connues avant mise en service

- La caméra s’appuie sur l’API native `BarcodeDetector`, absente de certains navigateurs. Si elle est indisponible, la saisie manuelle fonctionne; une bibliothèque de décodage compatible multi-navigateurs devra être intégrée pour une couverture universelle.
- La création d’une étiquette graphique imprimable (Code 128/EAN/QR) n’est pas encore intégrée. Le catalogue permet d’enregistrer la valeur et le type du code.
- Le flux doit être validé sur une base de test avec des comptes d’entrepôt et de prospecteur réels avant la migration de production.
- La migration n’a pas été appliquée au projet Supabase de production. Aucun déploiement Netlify ni fusion dans `main` n’est prévu dans cette étape.

## Contrôles de sécurité

- Les fonctions RPC utilisent `security definer`, un `search_path` explicite et vérifient la session et les autorisations côté serveur.
- Les expéditions sont protégées contre les répétitions par une clé d’idempotence.
- Le stock n’est pas validé par le navigateur : la base vérifie le stock disponible et verrouille la ligne avant de le décrémenter.
- Les codes scannés à la réception sont transmis au serveur pour validation. Une saisie manuelle reste possible et est identifiée comme telle dans les événements de scan.
 main

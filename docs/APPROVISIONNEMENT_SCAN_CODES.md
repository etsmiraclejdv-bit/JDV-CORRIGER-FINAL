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

# JDV CRM — Studio de design

Cette branche ajoute :
- le studio de thème global réservé au concepteur ;
- la personnalisation versionnée de l'entreprise ;
- l'éditeur de formulaires avec aperçu et versions ;
- la persistance des préférences utilisateur dans `user_settings` ;
- les tables SQL de versions de design et de formulaires personnalisés.

## Ordre sûr
1. Réconcilier l'historique Supabase/GitHub avant toute migration.
2. L'audit a trouvé la version Supabase `20261011065602` sans fichier SQL correspondant dans les branches examinées.
3. Relire les migrations du studio et tester les politiques RLS dans un environnement de test.
4. Lancer `npm ci`, `npm test`, `npm run type-check` et `npm run build`.
5. Réviser les diffs avant toute fusion.

**La migration n'a pas été appliquée à Supabase. Aucune fusion et aucun déploiement Netlify n'ont été effectués.**

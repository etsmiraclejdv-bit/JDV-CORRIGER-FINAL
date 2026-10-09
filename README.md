# JDV CRM

Application CRM multi-organisation construite avec Next.js 15, React 19, TypeScript et Supabase.

## Prérequis

- Node.js **22.x** (référence commune : `.nvmrc`, `package.json`, GitHub Actions et Netlify).
- npm fourni avec Node.js.
- Accès aux variables d'environnement de Supabase et, selon les fonctionnalités utilisées, FedaPay, OpenAI, Anthropic et Resend.

## Installation locale reproductible

```bash
nvm install
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

L'application de développement est disponible sur [http://localhost:4028](http://localhost:4028). Renseigner les valeurs nécessaires dans `.env.local` avant de tester les fonctionnalités qui dépendent de services externes. Ne jamais commiter ce fichier.

## Contrôles avant intégration

```bash
npm test
npm run type-check
npm run lint
npm run build
```

Le build de CI et le build Netlify utilisent `STRICT_BUILD=true`. Le workflow CI utilise `npm ci` et Node.js 22. Une validation verte est nécessaire avant fusion ; les fonctions Edge Deno doivent aussi être vérifiées avec les outils Supabase/Deno, car elles ne font pas partie du contrôle TypeScript Next.js.

## Variables d'environnement

Le fichier [.env.example](.env.example) décrit les variables de l'application web. Les variables publiques préfixées par `NEXT_PUBLIC_` sont embarquées côté navigateur : n'y placer aucun secret. `SUPABASE_SERVICE_ROLE_KEY`, les clés FedaPay, OpenAI, Anthropic et Resend sont des secrets serveur.

Les Edge Functions ont leurs propres secrets Supabase. Configurer notamment `SITE_URL=https://joie-de-vivr.netlify.app`, `RESEND_API_KEY` et, si nécessaire, `EMAIL_FROM` pour les emails ; `ANTHROPIC_API_KEY` et `ANTHROPIC_MODEL` pour l'analyse IA des dossiers. Les variables de plateforme `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` doivent être disponibles côté fonction. Ne pas copier les secrets de production dans un fichier versionné.

## Schéma et migrations Supabase

- Types TypeScript de référence : `src/types/database.types.ts`, générés depuis le schéma live du projet Supabase.
- Inventaire et limites de reproductibilité : [supabase/schema/README.md](supabase/schema/README.md).
- Le fichier `supabase/schema/00_baseline_public_schema.sql` est un instantané historique du 1 octobre 2026, pas un export complet du schéma actuel.
- L'historique live contient 136 versions de migrations et le dépôt ne contient pas les sources SQL de quatre versions. **Ne pas exécuter `supabase db push` ni prétendre qu'une reconstruction depuis zéro est validée** avant d'avoir récupéré ces quatre sources et testé une restauration propre.

## Edge Functions versionnées

Les trois fonctions sont suivies sous `supabase/functions/` :
- `send-email` — emails d'accueil et validation d'entreprise.
- `company-ai-review` — analyse des dossiers de création d'entreprise.
- `resend-service-mail` — diagnostic d'envoi réservé au SUPER ADMIN et limité à la boîte de test Resend.

La configuration versionnée dans `supabase/config.toml` exige un JWT pour les trois fonctions. Les sources présentes dans Git ne sont pas déployées automatiquement sur Supabase ; toute mise en production doit faire l'objet d'une revue et d'un déploiement explicite.

## Déploiement

Le site de production est hébergé sur Netlify. Le build utilise Node.js 22 et le mode strict TypeScript. Aucun déploiement de production ni aucune modification de base de données ne doit être déduit d'un simple commit ou d'une PR.

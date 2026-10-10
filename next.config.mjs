import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */

// En-têtes de sécurité appliqués à toutes les pages.
// La politique de contenu (CSP) est en mode « rapport seul » : elle n'empêche rien de fonctionner.
// Quand la console du navigateur ne signale plus de violation, remplacez
// 'Content-Security-Policy-Report-Only' par 'Content-Security-Policy' pour l'appliquer.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.fedapay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.fedapay.com",
  "frame-src https://*.fedapay.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self), payment=(self)' },
  { key: 'Content-Security-Policy-Report-Only', value: csp },
];

const nextConfig = {
  // Ne jamais publier les cartes sources : elles rendent le code lisible par tout le monde.
  productionBrowserSourceMaps: false,
  distDir: process.env.DIST_DIR || '.next',

  // Mettre STRICT_BUILD=true (variable d'environnement de build) dès que `npm run type-check`
  // et `npm run lint` passent sans erreur : les erreurs bloqueront alors le déploiement.
  typescript: {
    ignoreBuildErrors: process.env.STRICT_BUILD !== 'true',
  },

  eslint: {
    ignoreDuringBuilds: process.env.STRICT_BUILD !== 'true',
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Espaces privés : ne pas les faire indexer par les moteurs de recherche
      ...['/business/:path*', '/entrepot/:path*', '/terrain/:path*', '/hidden-concepteur-gate/:path*', '/api/:path*'].map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
    ];
  },

  async redirects() {
    return [
      { source: '/business-admin-dashboard', destination: '/business/dashboard', permanent: true },
      { source: '/terrain-prospector-dashboard', destination: '/terrain/dashboard', permanent: true },
    ];
  },

  images: {
    remotePatterns: imageHosts,
    minimumCacheTTL: 60,
    qualities: [75, 85, 100],
  }
};
export default nextConfig;

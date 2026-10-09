import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ne jamais publier les cartes sources : elles rendent le code lisible par tout le monde.
  productionBrowserSourceMaps: false,
  distDir: process.env.DIST_DIR || '.next',

  // STRICT_BUILD rend le contrôle TypeScript bloquant pendant la compilation.
  typescript: {
    ignoreBuildErrors: process.env.STRICT_BUILD !== 'true',
  },

  // Le lint est contrôlé séparément par CI. Il reste consultatif pendant le nettoyage
  // du backlog historique afin que le build strict valide bien les types et la compilation.
  eslint: {
    ignoreDuringBuilds: true,
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
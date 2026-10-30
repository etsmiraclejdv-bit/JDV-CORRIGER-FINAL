import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JDV CRM',
    short_name: 'JDV CRM',
    description: 'Gestion crédit, prospecteurs terrain, stock et recouvrement.',
    lang: 'fr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F7F4EB',
    theme_color: '#147866',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Espace Prospecteur', url: '/terrain/login' },
      { name: 'Espace Entreprise', url: '/business/login' },
      { name: 'Espace Agence', url: '/entrepot/login' },
    ],
  };
}

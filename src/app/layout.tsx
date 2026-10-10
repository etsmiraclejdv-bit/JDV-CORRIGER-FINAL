import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { Suspense } from 'react';
import '../styles/tailwind.css';
import '../styles/theme.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import JdvLoadingScreen from '@/app/components/JdvLoadingScreen';
import ThemeCustomizer from '@/components/theme/ThemeCustomizer';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta-sans', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'JDV CRM — Gestion Crédit & Prospecteurs Terrain',
  description: 'JDV CRM aide les entreprises ouest-africaines à gérer la vente à crédit, les paiements journaliers, les prospecteurs terrain et le recouvrement depuis un seul tableau de bord.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

// Applique le thème choisi avant l'affichage de la page (évite le clignotement).
const themeInit = `(function(){try{var d=document.documentElement,p=JSON.parse(localStorage.getItem('jdv_theme_v1')||'{}'),t=p.theme||'light';if(t==='system')t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.dataset.theme=t;d.dataset.accent=p.accent||'gold';d.dataset.font=p.font||'md';d.dataset.motion=p.reduceMotion?'reduce':'normal';}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={jakarta.variable} data-theme="light" data-accent="gold" data-font="md" data-motion="normal" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <JdvLoadingScreen />
        {children}
        <ThemeCustomizer />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              fontFamily: 'var(--font-plus-jakarta-sans), Arial, sans-serif',
            },
          }}
        />
      </body>
    </html>
  );
}

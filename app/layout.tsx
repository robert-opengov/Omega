import { DM_Sans, Geist_Mono } from 'next/font/google';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { NavigationProgress } from '@/components/ui/atoms';
import { Providers } from '@/providers';
import { appConfig } from '@/config/app.config';
import { authConfig } from '@/config/auth.config';
import { hexToHsl, DEFAULT_THEME } from '@/lib/utils';
import { getEffectiveModules } from '@/lib/feature-overrides';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4200';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: appConfig.name, template: `%s | ${appConfig.name}` },
  description: appConfig.description,
  applicationName: appConfig.name,
  icons: {
    icon: [
      { url: '/brand/favicon.ico', sizes: 'any' },
      { url: '/brand/icon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    type: 'website',
    siteName: appConfig.name,
    title: appConfig.name,
    description: appConfig.description,
    url: siteUrl,
    images: [
      {
        url: '/brand/login.webp',
        width: 1200,
        height: 630,
        alt: `${appConfig.name} - ${appConfig.description}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: appConfig.name,
    description: appConfig.description,
    images: ['/brand/login.webp'],
  },
};

function buildThemeStyle(): Record<string, string> {
  const colors = [
    { key: 'primary', hex: appConfig.theme.primary || DEFAULT_THEME.primary },
    { key: 'secondary', hex: appConfig.theme.secondary || DEFAULT_THEME.secondary },
    { key: 'success', hex: appConfig.theme.success || DEFAULT_THEME.success },
    { key: 'warning', hex: appConfig.theme.warning || DEFAULT_THEME.warning },
    { key: 'danger', hex: appConfig.theme.danger || DEFAULT_THEME.danger },
    { key: 'info', hex: appConfig.theme.info || DEFAULT_THEME.info },
    { key: 'inProgress', hex: appConfig.theme.inProgress || DEFAULT_THEME.inProgress },
  ];
  const vars: Record<string, string> = {};
  for (const { key, hex } of colors) {
    const { h, s, l } = hexToHsl(hex);
    vars[`--${key}-h`] = String(h);
    vars[`--${key}-s`] = `${s}%`;
    vars[`--${key}-l`] = `${l}%`;
  }
  return vars;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const themeStyle = buildThemeStyle() as React.CSSProperties;
  const modules = await getEffectiveModules();

  return (
    <html lang="en" suppressHydrationWarning style={themeStyle}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('g-bp-theme')||'system';var d=s==='dark'||(s==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.add(d?'dark':'light');}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${dmSans.variable} ${geistMono.variable} antialiased`}>
        <Providers
          enableAuth={authConfig.enableAuth}
          loginMode={authConfig.loginMode}
          enableSilentLogin={authConfig.enableSilentLogin}
          enableSignup={appConfig.features.enableSignup}
          modules={modules}
        >
          <NavigationProgress />
          {children}
        </Providers>
      </body>
    </html>
  );
}

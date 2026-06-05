import './globals.css';

const SITE = 'https://chiese.vercel.app';

export const metadata = {
  verification: { google: 'qSUmnvcivQegZWaHfo1zqj3Eujhon_KN3xLXU75kzJU' },
  metadataBase: new URL(SITE),
  title: {
    default: 'Chiescaciy 甜心 · Marketplace Joki & Item Game',
    template: '%s · Chiescaciy 甜心',
  },
  description: 'Marketplace joki & item game terpercaya — Heartopia, Mobile Legends, Roblox, Fisch, Fish It. Joki lepas, gendong, & jual-beli item. Aman, cepat, transparan.',
  keywords: ['joki game','joki heartopia','joki mobile legends','joki roblox','joki fisch','joki fish it','jasa joki','beli item game','joki murah','Chiescaciy'],
  manifest: '/manifest.json',
  themeColor: '#fb7185',
  icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE,
    siteName: 'Chiescaciy 甜心',
    title: 'Chiescaciy 甜心 · Marketplace Joki & Item Game',
    description: 'Joki & item game terpercaya — Heartopia, ML, Roblox, Fisch, Fish It. Aman, cepat, transparan.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chiescaciy 甜心 · Marketplace Joki & Item Game',
    description: 'Joki & item game terpercaya — Heartopia, ML, Roblox, Fisch, Fish It.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://chiese.vercel.app/#org',
        name: 'Chiescaciy 甜心',
        url: 'https://chiese.vercel.app',
        logo: 'https://chiese.vercel.app/icon-512.png',
        description: 'Marketplace joki & item game terpercaya — Heartopia, Mobile Legends, Roblox, Fisch, Fish It. Aman, cepat, transparan.',
        sameAs: [
          'https://www.tiktok.com/@cleiclau_',
          'https://www.instagram.com/keenayie',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://chiese.vercel.app/#website',
        url: 'https://chiese.vercel.app',
        name: 'Chiescaciy 甜心',
        publisher: { '@id': 'https://chiese.vercel.app/#org' },
        inLanguage: 'id-ID',
      },
    ],
  };
  return (
    <html lang="id">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}

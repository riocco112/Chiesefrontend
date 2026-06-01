import './globals.css';

const SITE = 'https://chiese.vercel.app';

export const metadata = {
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
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Chiescaciy 甜心' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chiescaciy 甜心 · Marketplace Joki & Item Game',
    description: 'Joki & item game terpercaya — Heartopia, ML, Roblox, Fisch, Fish It.',
    images: ['/icon-512.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (<html lang="id"><body>{children}</body></html>);
}

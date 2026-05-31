import './globals.css';
export const metadata = {
  title: 'Chiescaciy 甜心 · Marketplace Joki Heartopia',
  description: 'Naik level tanpa grinding capek. Jasa joki Heartopia terpercaya — coin, level, quest, item langka.',
  manifest: '/manifest.json',
  themeColor: '#fb7185',
  icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' },
};
export default function RootLayout({ children }) {
  return (<html lang="id"><body>{children}</body></html>);
}

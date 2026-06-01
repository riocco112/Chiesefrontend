export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/seller','/checkout','/pesanan'] },
    sitemap: 'https://chiese.vercel.app/sitemap.xml',
  };
}

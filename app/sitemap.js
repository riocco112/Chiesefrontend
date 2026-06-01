export default function sitemap() {
  const base = 'https://chiese.vercel.app';
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/pesanan`, lastModified: new Date(), priority: 0.5 },
  ];
}

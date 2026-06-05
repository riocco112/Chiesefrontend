import { createServerReadClient } from '@/lib/supabaseServer';

const base = 'https://chiese.vercel.app';

export default async function sitemap() {
  // URL statis
  const staticUrls = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/pesanan`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ];

  // URL produk dinamis dari Supabase
  let produkUrls = [];
  try {
    const sb = createServerReadClient();
    const { data } = await sb
      .from('listings')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (data) {
      produkUrls = data.map((l) => ({
        url: `${base}/produk/${l.id}`,
        lastModified: l.created_at ? new Date(l.created_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch (e) {
    // kalau Supabase gagal, sitemap tetap jalan dengan URL statis
  }

  return [...staticUrls, ...produkUrls];
}

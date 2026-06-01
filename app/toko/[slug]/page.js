import { createServerReadClient } from '@/lib/supabaseServer';
import TokoClient from './TokoClient';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const sb = createServerReadClient();
    const { data } = await sb.from('stores')
      .select('name, about, description, logo_url, rating_avg, sold_count')
      .eq('slug', slug).single();
    if (!data) {
      return { title: 'Toko tidak ditemukan' };
    }
    const rating = Number(data.rating_avg || 0).toFixed(1);
    const sold = data.sold_count || 0;
    const title = `${data.name} ⭐${rating}`;
    const desc = data.about
      ? data.about.slice(0,140)
      : (data.description || `Toko jasa & item game di Chiescaciy 甜心. ⭐${rating} · ${sold} pesanan selesai. Aman, cepat, transparan.`);
    const img = data.logo_url || '/icon-512.png';
    const url = `https://chiese.vercel.app/toko/${slug}`;
    return {
      title,
      description: desc,
      alternates: { canonical: url },
      openGraph: {
        type: 'website', locale: 'id_ID', url, siteName: 'Chiescaciy 甜心',
        title: `${data.name} · Chiescaciy 甜心`, description: desc,
        images: [{ url: img, width: 512, height: 512, alt: data.name }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${data.name} · Chiescaciy 甜心`, description: desc, images: [img],
      },
    };
  } catch {
    return { title: 'Toko · Chiescaciy 甜心' };
  }
}

export default function Page() {
  return <TokoClient />;
}

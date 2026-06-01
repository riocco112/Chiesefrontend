import { createServerReadClient } from '@/lib/supabaseServer';
import ProdukClient from './ProdukClient';

const GAMEMAP={heartopia:'Heartopia',ml:'Mobile Legends',roblox:'Roblox',fisch:'Fisch',fishit:'Fish It',lainnya:'Game'};
const rupiah=(n)=>'Rp'+Number(n||0).toLocaleString('id-ID');

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const sb = createServerReadClient();
    const { data } = await sb.from('listings')
      .select('title, description, price, image_url, game, stores(name)')
      .eq('id', id).single();
    if (!data) {
      return { title: 'Produk tidak ditemukan' };
    }
    const game = GAMEMAP[data.game] || 'Game';
    const toko = data.stores?.name || 'Chiescaciy';
    const title = `${data.title} — ${rupiah(data.price)} · ${game}`;
    const desc = data.description
      ? `${data.description.slice(0,140)}`
      : `Jasa ${game} di ${toko}. ${rupiah(data.price)}. Aman, cepat, transparan di Chiescaciy 甜心.`;
    const img = data.image_url || '/icon-512.png';
    const url = `https://chiese.vercel.app/produk/${id}`;
    return {
      title,
      description: desc,
      alternates: { canonical: url },
      openGraph: {
        type: 'website', locale: 'id_ID', url, siteName: 'Chiescaciy 甜心',
        title: `${title} · ${toko}`, description: desc,
        images: [{ url: img, width: 1200, height: 900, alt: data.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} · ${toko}`, description: desc, images: [img],
      },
    };
  } catch {
    return { title: 'Produk · Chiescaciy 甜心' };
  }
}

export default function Page() {
  return <ProdukClient />;
}

'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Search, Star, ShoppingCart, Heart, Zap, ShieldCheck, Clock, Coins, Trophy, Sparkles, BadgeCheck, Flame } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';

const CATEGORIES = [
  { id: 'all', label: 'Semua', icon: Sparkles },
  { id: 'coin', label: 'Grinding Coin', icon: Coins },
  { id: 'level', label: 'Joki Level', icon: Trophy },
  { id: 'quest', label: 'Quest / Misi', icon: Flame },
  { id: 'item', label: 'Farming Item', icon: Zap },
];
const DUMMY = [
  { id: 'd1', title: 'Joki Grinding Coin 50.000', category: 'coin', price: 15000, old_price: 20000, seller: 'RicoStore', verified: true, rating_avg: 4.9, sold_count: 312, eta: '1 jam', grad: 'from-amber-200 to-yellow-300', badge: 'Terlaris' },
  { id: 'd2', title: 'Joki Level Up 1 → 20', category: 'level', price: 45000, old_price: null, seller: 'SalmanJoki', verified: true, rating_avg: 5.0, sold_count: 128, eta: '3 jam', grad: 'from-violet-200 to-fuchsia-300', badge: 'Pro' },
  { id: 'd3', title: 'Clear Semua Daily Quest', category: 'quest', price: 12000, old_price: 18000, seller: 'CozyBoost', verified: false, rating_avg: 4.7, sold_count: 89, eta: '30 mnt', grad: 'from-rose-200 to-pink-300', badge: null },
  { id: 'd4', title: 'Farming Rare Item x10', category: 'item', price: 30000, old_price: null, seller: 'RicoStore', verified: true, rating_avg: 4.8, sold_count: 56, eta: '2 jam', grad: 'from-sky-200 to-cyan-300', badge: null },
  { id: 'd5', title: 'Paket Hemat Coin 100.000', category: 'coin', price: 27000, old_price: 35000, seller: 'GrindKing', verified: true, rating_avg: 4.9, sold_count: 204, eta: '2 jam', grad: 'from-orange-200 to-amber-300', badge: 'Diskon' },
  { id: 'd6', title: 'Joki Level 20 → 40 Express', category: 'level', price: 80000, old_price: null, seller: 'SalmanJoki', verified: true, rating_avg: 5.0, sold_count: 73, eta: '6 jam', grad: 'from-indigo-200 to-purple-300', badge: 'Express' },
];
const GRADS = ['from-amber-200 to-yellow-300','from-violet-200 to-fuchsia-300','from-rose-200 to-pink-300','from-sky-200 to-cyan-300','from-orange-200 to-amber-300','from-indigo-200 to-purple-300','from-teal-200 to-emerald-300','from-pink-200 to-rose-300'];
const rupiah = (n) => 'Rp' + Number(n).toLocaleString('id-ID');

export default function Home() {
  const [activeCat, setActiveCat] = useState('all');
  const [query, setQuery] = useState('');
  const [favs, setFavs] = useState(() => new Set());
  const [items, setItems] = useState(DUMMY);
  const [isReal, setIsReal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('listings')
          .select('id, title, category, price, old_price, image_url, eta, rating_avg, sold_count, stores ( name, is_verified )')
          .eq('is_active', true).order('sold_count', { ascending: false });
        if (!error && data && data.length > 0) {
          setIsReal(true);
          setItems(data.map((d, i) => ({
            id: d.id, title: d.title, category: d.category, price: d.price, old_price: d.old_price,
            image_url: d.image_url, eta: d.eta, rating_avg: d.rating_avg, sold_count: d.sold_count,
            seller: d.stores?.name ?? 'Toko', verified: d.stores?.is_verified ?? false,
            grad: GRADS[i % GRADS.length], badge: null,
          })));
        }
      } catch (e) {}
    })();
  }, []);

  const filtered = useMemo(() => items.filter((l) => {
    const okCat = activeCat === 'all' || l.category === activeCat;
    const okQ = l.title.toLowerCase().includes(query.toLowerCase()) || (l.seller || '').toLowerCase().includes(query.toLowerCase());
    return okCat && okQ;
  }), [items, activeCat, query]);

  const toggleFav = (id) => setFavs((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-30%] left-[15%] w-[420px] h-[420px] rounded-full bg-pink-200/50 blur-[110px]" />
          <div className="absolute bottom-[-30%] right-[8%] w-[360px] h-[360px] rounded-full bg-rose-200/40 blur-[110px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="reveal max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-pink-100 text-xs font-medium text-rose-400 mb-5 shadow-sm"><Sparkles className="w-3.5 h-3.5" /> Marketplace Joki Heartopia #1</div>
            <h1 className="font-display text-4xl sm:text-6xl font-semibold leading-[1.05] tracking-tight mb-5 text-slate-800">Naik level tanpa<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">grinding capek.</span></h1>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">Pilih jasa joki terpercaya dari seller terverifikasi. Coin, level, quest, item langka — beres sambil kamu santai.</p>
            <div className="flex flex-wrap gap-3">
              <a href="#katalog" className="px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-400 shadow-lg shadow-pink-300/50 hover:scale-[1.02] transition">Jelajahi Jasa</a>
              <Link href="/seller" className="px-6 py-3 rounded-full font-semibold text-rose-400 bg-white border border-pink-200 hover:bg-pink-50 transition">Jadi Seller</Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-10 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Garansi 100%</span>
              <span className="inline-flex items-center gap-2"><Clock className="w-4 h-4 text-sky-500" /> Pengerjaan cepat</span>
              <span className="inline-flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-pink-400" /> Seller terverifikasi</span>
            </div>
          </div>
        </div>
      </section>
      <div className="px-4 md:max-w-7xl md:mx-auto sm:px-6 -mt-4 mb-2">
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari jasa joki…" className="w-full bg-white border border-pink-100 rounded-full pl-10 pr-4 py-3 text-sm placeholder:text-pink-300 text-slate-700 focus:outline-none focus:border-pink-300 transition shadow-sm" />
        </div>
      </div>
      <div id="katalog" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
          {CATEGORIES.map((c) => {
            const Icon = c.icon; const active = activeCat === c.id;
            return (<button key={c.id} onClick={() => setActiveCat(c.id)} className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition ${active ? 'bg-gradient-to-r from-pink-400 to-rose-400 border-transparent text-white shadow-md shadow-pink-300/50' : 'bg-white border-pink-100 text-slate-500 hover:bg-pink-50 hover:text-rose-400'}`}><Icon className="w-4 h-4" /> {c.label}</button>);
          })}
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-display text-2xl font-semibold text-slate-800">{activeCat === 'all' ? 'Semua Jasa' : CATEGORIES.find((c) => c.id === activeCat)?.label}</h2>
          <span className="text-sm text-slate-400">{filtered.length} jasa tersedia</span>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400"><Search className="w-10 h-10 mx-auto mb-3 opacity-40" />Nggak ada jasa yang cocok.</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {filtered.map((l, i) => {
              const CatIcon = CATEGORIES.find((c) => c.id === l.category)?.icon ?? Sparkles;
              const Card = (
                <article className="reveal group h-full rounded-3xl overflow-hidden bg-white border border-pink-100 shadow-sm hover:shadow-xl hover:shadow-pink-200/40 hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${l.grad}`}>
                    {l.image_url ? (<img src={l.image_url} alt={l.title} className="absolute inset-0 w-full h-full object-cover" />) : (<div className="absolute inset-0 grid place-items-center opacity-25"><CatIcon className="w-14 h-14 text-white" /></div>)}
                    {l.badge && <span className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur-md text-rose-500 shadow-sm">{l.badge}</span>}
                    <button onClick={(e)=>{e.preventDefault();toggleFav(l.id);}} className="absolute top-2.5 right-2.5 z-10 grid place-items-center w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-sm hover:scale-110 transition"><Heart className={`w-4 h-4 transition ${favs.has(l.id) ? 'text-rose-500' : 'text-pink-300'}`} fill={favs.has(l.id) ? 'currentColor' : 'none'} /></button>
                    {l.eta && <div className="absolute bottom-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium bg-white/95 backdrop-blur-md text-slate-600 shadow-sm"><Clock className="w-3 h-3" /> {l.eta}</div>}
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-sm leading-snug line-clamp-2 min-h-[2.5rem] text-slate-700 group-hover:text-rose-500 transition">{l.title}</h3>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400"><span className="truncate">{l.seller}</span>{l.verified && <BadgeCheck className="w-3.5 h-3.5 text-pink-400 shrink-0" />}</div>
                    <div className="flex items-center gap-1 mt-1.5 text-xs"><Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" /><span className="font-semibold text-amber-500">{Number(l.rating_avg).toFixed(1)}</span><span className="text-slate-400">· {l.sold_count} terjual</span></div>
                    <div className="flex items-end justify-between mt-3">
                      <div>{l.old_price && <div className="text-[11px] text-slate-400 line-through">{rupiah(l.old_price)}</div>}<div className="font-display text-lg font-semibold text-rose-500">{rupiah(l.price)}</div></div>
                      <div className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 shadow-md shadow-pink-300/50 group-hover:scale-110 transition"><ShoppingCart className="w-4 h-4 text-white" /></div>
                    </div>
                  </div>
                </article>
              );
              return isReal ? (<Link key={l.id} href={`/produk/${l.id}`}>{Card}</Link>) : (<div key={l.id} title="Data contoh — aktif setelah seller upload jasa">{Card}</div>);
            })}
          </div>
        )}
      </main>
      <footer className="border-t border-pink-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center text-xs text-slate-400">© 2026 Chiescaciy 甜心 · Bukan afiliasi resmi Heartopia / XD Entertainment</div>
      </footer>
    </div>
  );
}

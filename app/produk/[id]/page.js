'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, BadgeCheck, Clock, ShoppingCart, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';
const rupiah=(n)=>'Rp'+Number(n).toLocaleString('id-ID');
export default function Detail(){
  const { id }=useParams(); const router=useRouter();
  const [item,setItem]=useState(null); const [loading,setLoading]=useState(true);
  const [reviews,setReviews]=useState([]);
  useEffect(()=>{(async()=>{
    try{
      const supabase=createClient();
      const { data }=await supabase.from('listings').select('*, stores ( name, slug, is_verified, description )').eq('id',id).single();
      setItem(data);
      const { data:revs }=await supabase.from('reviews').select('rating, comment, created_at, profiles(full_name, username)').eq('listing_id',id).order('created_at',{ascending:false}).limit(20);
      setReviews(revs||[]);
    }catch(e){} finally{ setLoading(false); }
  })();},[id]);
  if(loading) return (<div><Navbar/><p className="text-center py-20 text-slate-400">Memuat…</p></div>);
  if(!item) return (<div><Navbar/><p className="text-center py-20 text-slate-400">Produk tidak ditemukan.</p></div>);
  return (
    <div className="min-h-screen">
      <Navbar/>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={()=>router.back()} className="inline-flex items-center gap-2 text-sm text-rose-400 mb-6"><ArrowLeft className="w-4 h-4"/> Kembali</button>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-pink-200 to-rose-300 overflow-hidden">
            {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-full object-cover"/>}
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold text-slate-800 mb-3">{item.title}</h1>
            <div className="flex items-center gap-2 text-sm mb-2">
              {item.game && <span className="text-[10px] font-bold bg-pink-100 text-rose-500 px-2 py-0.5 rounded-full">{({heartopia:'Heartopia',ml:'Mobile Legends',roblox:'Roblox',fisch:'Fisch',fishit:'Fish It',lainnya:'Lainnya'})[item.game]||'Game'}</span>}
              <a href={item.stores?.slug?`/toko/${item.stores.slug}`:'#'} className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-400 underline-offset-2 hover:underline">{item.stores?.name}{item.stores?.is_verified && <BadgeCheck className="w-4 h-4 text-pink-400"/>}</a>
            </div>
            <div className="flex items-center gap-1 text-sm mb-4"><Star className="w-4 h-4 text-amber-400" fill="currentColor"/><span className="font-semibold text-amber-500">{Number(item.rating_avg).toFixed(1)}</span><span className="text-slate-400">· {item.sold_count} terjual</span></div>
            <p className="text-slate-500 leading-relaxed mb-4">{item.description||'Tidak ada deskripsi.'}</p>
            {item.eta && <div className="inline-flex items-center gap-2 text-sm text-slate-600 bg-pink-50 px-3 py-1.5 rounded-full mb-6"><Clock className="w-4 h-4"/> Estimasi: {item.eta}</div>}
            <div className="font-display text-3xl font-semibold text-rose-500 mb-6">{rupiah(item.price)}</div>
            <button onClick={()=>{ localStorage.setItem('chiese_cart', JSON.stringify(item)); router.push('/checkout'); }} className="w-full py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-400 shadow-lg shadow-pink-300/50 inline-flex items-center justify-center gap-2"><ShoppingCart className="w-5 h-5"/> Beli Sekarang</button>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-lg font-semibold text-slate-800 mb-3">Ulasan Pembeli ({reviews.length})</h2>
          {reviews.length===0 ? (
            <p className="text-slate-400 text-sm">Belum ada ulasan untuk jasa ini.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r,i)=>(
                <div key={i} className="bg-white rounded-2xl border border-pink-100 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(n=>(<Star key={n} className={`w-4 h-4 ${n<=r.rating?'text-amber-400':'text-slate-200'}`} fill="currentColor"/>))}
                    </div>
                    <span className="text-[11px] text-slate-400">{new Date(r.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-600 mt-1.5">{r.profiles?.full_name || r.profiles?.username || 'Pembeli'}</div>
                  {r.comment && <p className="text-slate-500 text-sm mt-1 leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

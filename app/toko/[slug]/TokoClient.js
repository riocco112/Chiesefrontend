'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, BadgeCheck, Clock, ArrowLeft, Store as StoreIcon, Share2, MessageCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';

const rupiah=(n)=>'Rp'+Number(n).toLocaleString('id-ID');
const GAMEMAP={heartopia:'Heartopia',ml:'Mobile Legends',roblox:'Roblox',fisch:'Fisch',fishit:'Fish It',lainnya:'Lainnya'};

export default function TokoClient(){
  const { slug }=useParams(); const router=useRouter();
  const [store,setStore]=useState(null);
  const [listings,setListings]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{
    try{
      const supabase=createClient();
      const { data:s }=await supabase.from('stores').select('*').eq('slug',slug).maybeSingle();
      setStore(s);
      if(s){
        const { data:l }=await supabase.from('listings').select('*').eq('store_id',s.id).order('created_at',{ascending:false});
        setListings(l||[]);
      }
    }catch(e){} finally{ setLoading(false); }
  })();},[slug]);

  async function bagikan(){
    const url = typeof window!=='undefined' ? window.location.href : '';
    const judul = store?.name || 'Chiescaciy';
    if (navigator.share) {
      try { await navigator.share({ title: judul, text: `Cek toko "${judul}" di Chiescaciy`, url }); } catch(e){}
    } else {
      try { await navigator.clipboard.writeText(url); alert('Link disalin! Tinggal paste & bagikan'); } catch(e){ alert(url); }
    }
  }
  if(loading) return (<div><Navbar/><p className="text-center py-20 text-slate-400">Memuat…</p></div>);
  if(!store) return (<div><Navbar/><p className="text-center py-20 text-slate-400">Toko tidak ditemukan.</p></div>);

  return (
    <div className="min-h-screen">
      <Navbar/>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={()=>router.back()} className="inline-flex items-center gap-2 text-sm text-rose-400"><ArrowLeft className="w-4 h-4"/> Kembali</button>
          <button onClick={bagikan} className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-500 bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-full transition"><Share2 className="w-4 h-4"/> Bagikan</button>
        </div>

        {/* Header toko */}
        <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-200 to-rose-300 overflow-hidden shrink-0 grid place-items-center">
              {store.logo_url ? <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover"/> : <StoreIcon className="w-8 h-8 text-white"/>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-semibold text-slate-800">{store.name}</h1>
                {store.is_verified && <BadgeCheck className="w-5 h-5 text-pink-400"/>}
              </div>
              <div className="flex items-center gap-3 text-sm mt-1">
                <span className="inline-flex items-center gap-1 text-amber-500 font-semibold"><Star className="w-4 h-4" fill="currentColor"/>{Number(store.rating_avg||0).toFixed(1)}</span>
                <span className="text-slate-400">{(store.sold_count||0)+(store.seed_sold||0)} pesanan selesai</span>
              </div>
              {store.active_hours && <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-pink-50 px-3 py-1 rounded-full mt-2"><Clock className="w-3.5 h-3.5"/> {store.active_hours}</div>}
              {store.id && <div className="mt-2"><a href={`https://t.me/Jaaillbot?start=chat_${store.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-400 px-4 py-2 rounded-full shadow shadow-pink-300/40 transition hover:opacity-90"><MessageCircle className="w-4 h-4"/> Chat Penjual</a></div>}
            </div>
          </div>
          {store.about && (
            <div className="mt-4 pt-4 border-t border-pink-50">
              <div className="text-xs font-semibold text-slate-500 mb-1">Tentang Toko</div>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{store.about}</p>
            </div>
          )}
          {!store.about && store.description && (
            <p className="text-slate-500 text-sm leading-relaxed mt-4 pt-4 border-t border-pink-50">{store.description}</p>
          )}
        </div>

        {/* Daftar jasa */}
        <h2 className="font-display text-lg font-semibold text-slate-800 mb-3">Jasa & Item ({listings.length})</h2>
        {listings.length===0 ? (
          <p className="text-slate-400 text-sm">Toko ini belum punya jasa.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {listings.map(l=>(
              <button key={l.id} onClick={()=>router.push('/produk/'+l.id)} className="text-left bg-white rounded-2xl border border-pink-100 p-4 shadow-sm hover:shadow-md transition">
                <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-pink-100 to-rose-200 overflow-hidden mb-3">
                  {l.image_url && <img src={l.image_url} alt={l.title} className="w-full h-full object-cover"/>}
                </div>
                <span className="text-[10px] font-bold bg-pink-100 text-rose-500 px-2 py-0.5 rounded-full">{GAMEMAP[l.game]||'Game'}</span>
                <div className="font-semibold text-slate-700 text-sm mt-1.5">{l.title}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-rose-500 font-display font-semibold">{rupiah(l.price)}</span>
                  {l.eta && <span className="text-[11px] text-slate-400 inline-flex items-center gap-1"><Clock className="w-3 h-3"/>{l.eta}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

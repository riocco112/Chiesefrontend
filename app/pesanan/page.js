'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';
const rupiah=(n)=>'Rp'+Number(n).toLocaleString('id-ID');
const BADGE={ pending:'bg-amber-100 text-amber-700', confirmed:'bg-sky-100 text-sky-700', in_progress:'bg-violet-100 text-violet-700', completed:'bg-emerald-100 text-emerald-700', rejected:'bg-rose-100 text-rose-700' };
const LABEL={ pending:'Menunggu Bayar', confirmed:'Terkonfirmasi', in_progress:'Dikerjakan', completed:'Selesai', rejected:'Ditolak' };
export default function Pesanan(){
  const router=useRouter();
  const [orders,setOrders]=useState([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{
    const supabase=createClient();
    const { data:{ user } }=await supabase.auth.getUser();
    if(!user){ router.push('/login'); return; }
    const { data }=await supabase.from('orders').select('*, listings ( title ), stores ( name )').eq('buyer_id',user.id).order('created_at',{ascending:false});
    setOrders(data||[]); setLoading(false);
  })();},[]);
  if(loading) return (<div><Navbar/><p className="text-center py-20 text-slate-400">Memuat…</p></div>);
  return (
    <div className="min-h-screen">
      <Navbar/>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-2xl font-semibold text-slate-800 mb-6">Pesanan Saya</h1>
        {orders.length===0 ? (<p className="text-slate-400 text-center py-16">Belum ada pesanan.</p>) : (
          <div className="space-y-3">
            {orders.map(o=>(
              <div key={o.id} className="bg-white rounded-2xl border border-pink-100 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-700 text-sm">{o.listings?.title||'Jasa'}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{o.stores?.name} · {o.order_code}</div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${BADGE[o.status]||'bg-slate-100 text-slate-600'}`}>{LABEL[o.status]||o.status}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-display font-semibold text-rose-500">{rupiah(o.total)}</span>
                  <span className="text-xs text-slate-400">{o.pay_method?.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

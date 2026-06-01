'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Trash2, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase';

const rupiah=(n)=>'Rp'+Number(n).toLocaleString('id-ID');
const BADGE={ pending:'bg-amber-100 text-amber-700', confirmed:'bg-sky-100 text-sky-700', in_progress:'bg-violet-100 text-violet-700', completed:'bg-emerald-100 text-emerald-700', rejected:'bg-rose-100 text-rose-700', cancelled:'bg-slate-200 text-slate-600' };
const LABEL={ pending:'Menunggu Bayar', confirmed:'Terkonfirmasi', in_progress:'Dikerjakan', completed:'Selesai', rejected:'Ditolak', cancelled:'Dibatalkan' };

export default function Pesanan(){
  const router=useRouter();
  const [orders,setOrders]=useState([]); const [loading,setLoading]=useState(true);
  const [reviewed,setReviewed]=useState({}); // order_id -> true
  const [user,setUser]=useState(null);
  const [modal,setModal]=useState(null); // order yg lagi di-review
  const [stars,setStars]=useState(5); const [comment,setComment]=useState(''); const [busy,setBusy]=useState(false);

  async function load(){
    const supabase=createClient();
    const { data:{ user } }=await supabase.auth.getUser();
    if(!user){ router.push('/login'); return; }
    setUser(user);
    const { data }=await supabase.from('orders').select('*, listings ( title ), stores ( name )').eq('buyer_id',user.id).order('created_at',{ascending:false});
    setOrders(data||[]);
    // cek review yg udah ada
    const { data:revs }=await supabase.from('reviews').select('order_id').eq('buyer_id',user.id);
    const map={}; (revs||[]).forEach(r=>{ map[r.order_id]=true; });
    setReviewed(map);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function hapus(id){
    if(!confirm('Hapus pesanan ini dari histori kamu?')) return;
    const supabase=createClient();
    await supabase.from('orders').delete().eq('id',id);
    setOrders(prev=>prev.filter(o=>o.id!==id));
  }

  function bukaReview(o){ setModal(o); setStars(5); setComment(''); }

  async function kirimReview(){
    setBusy(true);
    const supabase=createClient();
    const { error }=await supabase.from('reviews').insert({
      order_id:modal.id, buyer_id:user.id, listing_id:modal.listing_id, rating:stars, comment:comment.trim()||null
    });
    setBusy(false);
    if(error){ alert(error.message); return; }
    setReviewed(prev=>({...prev,[modal.id]:true}));
    setModal(null);
    alert('Makasih reviewnya! ⭐');
  }

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
                  <div className="flex items-center gap-2">
                    {o.status==='completed' && !reviewed[o.id] && (
                      <button onClick={()=>bukaReview(o)} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-400 text-white hover:bg-amber-500 transition"><Star className="w-3.5 h-3.5" fill="currentColor"/> Kasih Review</button>
                    )}
                    {o.status==='completed' && reviewed[o.id] && (
                      <span className="text-xs text-emerald-500 font-semibold inline-flex items-center gap-1"><Star className="w-3.5 h-3.5" fill="currentColor"/> Sudah direview</span>
                    )}
                    <span className="text-xs text-slate-400">{o.pay_method?.toUpperCase()}</span>
                    <button onClick={()=>hapus(o.id)} className="grid place-items-center w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-100 transition" title="Hapus dari histori"><Trash2 className="w-3.5 h-3.5 text-rose-400"/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Review */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 px-4" onClick={()=>setModal(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl" onClick={e=>e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold text-slate-800 mb-1">Kasih Review</h3>
            <p className="text-xs text-slate-400 mb-4">{modal.listings?.title} · {modal.stores?.name}</p>
            <div className="flex justify-center gap-2 mb-4">
              {[1,2,3,4,5].map(n=>(
                <button key={n} onClick={()=>setStars(n)}>
                  <Star className={`w-9 h-9 transition ${n<=stars?'text-amber-400':'text-slate-200'}`} fill="currentColor"/>
                </button>
              ))}
            </div>
            <textarea className="w-full mb-4 px-4 py-3 rounded-xl bg-pink-50 border border-pink-100 text-slate-700 focus:outline-none focus:border-pink-300 text-sm" rows={3} placeholder="Cerita pengalaman kamu (opsional)" value={comment} onChange={e=>setComment(e.target.value)}/>
            <div className="flex gap-2">
              <button onClick={()=>setModal(null)} className="flex-1 py-2.5 rounded-xl font-semibold text-slate-500 bg-slate-100 text-sm">Batal</button>
              <button onClick={kirimReview} disabled={busy} className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-400 shadow-md shadow-pink-300/50 disabled:opacity-60 text-sm">{busy?'Mengirim…':'Kirim Review'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

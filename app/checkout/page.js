'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';
const rupiah=(n)=>'Rp'+Number(n).toLocaleString('id-ID');
export default function Checkout(){
  const router=useRouter();
  const [item,setItem]=useState(null); const [tg,setTg]=useState(''); const [pay,setPay]=useState('qris');
  const [busy,setBusy]=useState(false); const [msg,setMsg]=useState('');
  useEffect(()=>{ const c=localStorage.getItem('chiese_cart'); if(c) setItem(JSON.parse(c)); },[]);
  async function order(){
    setBusy(true); setMsg('');
    const supabase=createClient();
    const { data:{ user } }=await supabase.auth.getUser();
    if(!user){ setBusy(false); setMsg('Login dulu untuk memesan.'); setTimeout(()=>router.push('/login'),1500); return; }
    const { error }=await supabase.from('orders').insert({ buyer_id:user.id, store_id:item.store_id, listing_id:item.id, total:item.price, status:'pending', pay_method:pay, telegram_user:tg });
    setBusy(false);
    if(error) return setMsg(error.message);
    localStorage.removeItem('chiese_cart');
    router.push('/sukses');
  }
  if(!item) return (<div><Navbar/><p className="text-center py-20 text-slate-400">Keranjang kosong. Pilih jasa dulu di beranda.</p></div>);
  const inp="w-full mb-3 px-4 py-3 rounded-xl bg-pink-50 border border-pink-100 text-slate-700 focus:outline-none focus:border-pink-300";
  return (
    <div className="min-h-screen">
      <Navbar/>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-2xl font-semibold text-slate-800 mb-6">Checkout</h1>
        <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm mb-4">
          <div className="font-semibold text-slate-700">{item.title}</div>
          <div className="font-display text-2xl font-semibold text-rose-500 mt-2">{rupiah(item.price)}</div>
        </div>
        <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm">
          <input className={inp} placeholder="Username Telegram (mis. @salman)" value={tg} onChange={e=>setTg(e.target.value)}/>
          <select className={inp} value={pay} onChange={e=>setPay(e.target.value)}>
            <option value="qris">QRIS</option><option value="gopay">GoPay</option><option value="saweria">Saweria</option><option value="transfer">Transfer Bank</option>
          </select>
          {msg && <p className="text-rose-500 text-sm mb-3">{msg}</p>}
          <button onClick={order} disabled={busy||!tg} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-400 shadow-md shadow-pink-300/50 disabled:opacity-60">{busy?'Memproses…':'Buat Pesanan'}</button>
        </div>
      </div>
    </div>
  );
}

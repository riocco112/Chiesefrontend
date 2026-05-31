'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';

const rupiah=(n)=>'Rp'+Number(n).toLocaleString('id-ID');
const BOT='https://chies112-chiese.hf.space';

export default function Checkout(){
  const router=useRouter();
  const [item,setItem]=useState(null); const [tg,setTg]=useState(''); const [pay,setPay]=useState('qris');
  const [busy,setBusy]=useState(false); const [msg,setMsg]=useState('');
  useEffect(()=>{ const c=localStorage.getItem('chiese_cart'); if(c) setItem(JSON.parse(c)); },[]);

  async function order(){
    const id=tg.trim().replace('@','');
    if(!/^\d+$/.test(id)){ setMsg('Isi Telegram ID berupa ANGKA (chat /start ke bot dulu untuk dapat ID).'); return; }
    setBusy(true); setMsg('');
    const supabase=createClient();
    const { data:{ user } }=await supabase.auth.getUser();
    if(!user){ setBusy(false); setMsg('Login dulu untuk memesan.'); setTimeout(()=>router.push('/login'),1500); return; }
    const { data, error }=await supabase.from('orders')
      .insert({ buyer_id:user.id, store_id:item.store_id, listing_id:item.id, total:item.price, status:'pending', pay_method:pay, telegram_user:id })
      .select('*, listings(title), stores(name, pay_qris_url, pay_gopay, pay_saweria, pay_bank)');
    setBusy(false);
    if(error) return setMsg(error.message);
    const o=data&&data[0];
    if(o){
      localStorage.setItem('chiese_last_order', o.order_code);
      // susun info bayar dari toko
      const st=o.stores||{};
      let payInfo='Hubungi penjual untuk info pembayaran.';
      if(pay==='qris'&&st.pay_qris_url) payInfo='Scan QRIS: '+st.pay_qris_url;
      else if(pay==='gopay'&&st.pay_gopay) payInfo='GoPay: '+st.pay_gopay;
      else if(pay==='saweria'&&st.pay_saweria) payInfo='Saweria: '+st.pay_saweria+'\n(tulis kode '+o.order_code+' di catatan)';
      else if(pay==='transfer'&&st.pay_bank) payInfo='Transfer: '+st.pay_bank;
      // trigger bot DM buyer (jangan blokir kalau gagal)
      try{
        await fetch(BOT+'/notify/order-created',{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ record:{
            order_code:o.order_code, listing_title:(o.listings||{}).title,
            total:o.total, pay_method:pay, store_name:st.name,
            telegram_user:id, pay_info:payInfo
          }})
        });
      }catch(e){}
    }
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
          <div className="text-xs text-slate-500 mb-2 bg-pink-50 rounded-lg px-3 py-2">💡 Chat <b>/start</b> ke bot <b>@Jaaillbot</b> dulu untuk dapat Telegram ID kamu, lalu tempel di sini.</div>
          <input className={inp} placeholder="Telegram ID (angka, mis. 7710155531)" value={tg} onChange={e=>setTg(e.target.value)} inputMode="numeric"/>
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

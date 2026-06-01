'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';

const rupiah=(n)=>'Rp'+Number(n).toLocaleString('id-ID');

export default function Checkout(){
  const router=useRouter();
  const [item,setItem]=useState(null);
  const [tg,setTg]=useState('');
  const [pay,setPay]=useState('qris');
  const [loginVia,setLoginVia]=useState('Moonton');
  const [accId,setAccId]=useState('');
  const [nick,setNick]=useState('');
  const [method,setMethod]=useState('lepas');
  const [note,setNote]=useState('');
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');
  useEffect(()=>{ const c=localStorage.getItem('chiese_cart'); if(c) setItem(JSON.parse(c)); },[]);

  async function order(){
    const id=tg.trim().replace('@','');
    if(!/^\d+$/.test(id)){ setMsg('Isi Telegram ID berupa ANGKA (chat /start ke bot dulu untuk dapat ID).'); return; }
    if(!accId.trim()){ setMsg('Isi Email/ID akun game kamu.'); return; }
    if(!nick.trim()){ setMsg('Isi Nickname in-game kamu.'); return; }
    setBusy(true); setMsg('');
    const supabase=createClient();
    const { data:{ user } }=await supabase.auth.getUser();
    if(!user){ setBusy(false); setMsg('Login dulu untuk memesan.'); setTimeout(()=>router.push('/login'),1500); return; }
    const { data, error }=await supabase.from('orders')
      .insert({
        buyer_id:user.id, store_id:item.store_id, listing_id:item.id, total:item.price,
        status:'pending', pay_method:pay, telegram_user:id,
        login_via:loginVia, account_id:accId.trim(), nickname:nick.trim(),
        work_method:method, note:note.trim()||null
      })
      .select('*, listings(title), stores(name, pay_qris_url, pay_gopay, pay_saweria, pay_bank)');
    if(error){ setBusy(false); return setMsg(error.message); }
    const o=data&&data[0];
    if(o){
      localStorage.setItem('chiese_last_order', o.order_code);
      const st=o.stores||{};
      let payInfo='Hubungi penjual untuk info pembayaran.';
      if(pay==='qris'&&st.pay_qris_url) payInfo='💳 Bayar via QRIS:\n'+st.pay_qris_url;
      else if(pay==='gopay'&&st.pay_gopay) payInfo='💳 Bayar via GoPay ke: '+st.pay_gopay;
      else if(pay==='saweria'&&st.pay_saweria) payInfo='💳 Bayar via Saweria:\n'+st.pay_saweria;
      else if(pay==='transfer'&&st.pay_bank) payInfo='💳 Transfer ke Bank: '+st.pay_bank;
      const methodLabel = method==='gendong' ? 'Gendong (dibimbing, kamu main sendiri)' : 'Lepas (penjual yang main)';
      const text =
        `Halo! Pesanan baru dari <b>Chiescaciy 甜心</b>\n\n`+
        `🧾 Order ID: <code>${o.order_code}</code>\n\n`+
        `<b>Jasa:</b>\n• ${(o.listings||{}).title||'jasa'}\n\n`+
        `🎮 <b>Detail Akun:</b>\n`+
        `• Login: ${loginVia}\n`+
        `• ID/Email: ${accId.trim()}\n`+
        `• Nickname: ${nick.trim()}\n`+
        `• Metode: ${methodLabel}\n`+
        (note.trim()?`• Catatan: ${note.trim()}\n`:``)+
        `\n💰 <b>Total: ${rupiah(o.total)}</b>\n\n`+
        `${payInfo}\n\n`+
        `Setelah bayar, kirim screenshot bukti pembayaran ke bot ini ya! 📸\n\n`+
        `🔒 <i>Password akun TIDAK diminta sekarang. Nanti setelah pembayaran dikonfirmasi penjual, bot akan minta password lewat chat ini.</i>`;
      try{
        await fetch('/api/notify-order',{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ chatId:id, text })
        });
      }catch(e){}
    }
    localStorage.removeItem('chiese_cart');
    setBusy(false);
    router.push('/sukses');
  }

  if(!item) return (<div><Navbar/><p className="text-center py-20 text-slate-400">Keranjang kosong. Pilih jasa dulu di beranda.</p></div>);
  const inp="w-full mb-3 px-4 py-3 rounded-xl bg-pink-50 border border-pink-100 text-slate-700 focus:outline-none focus:border-pink-300";
  const lbl="text-xs font-semibold text-slate-500 mb-1 block";
  return (
    <div className="min-h-screen">
      <Navbar/>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-2xl font-semibold text-slate-800 mb-6">Checkout</h1>
        <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm mb-4">
          <div className="font-semibold text-slate-700">{item.title}</div>
          <div className="font-display text-2xl font-semibold text-rose-500 mt-2">{rupiah(item.price)}</div>
        </div>

        <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm mb-4">
          <div className="font-semibold text-slate-700 mb-3">🎮 Detail Akun Game</div>
          <label className={lbl}>Login Via</label>
          <select className={inp} value={loginVia} onChange={e=>setLoginVia(e.target.value)}>
            <option>Moonton</option><option>Facebook</option><option>Google</option>
            <option>TikTok</option><option>Email</option><option>Server SEA</option>
            <option>Server TW/HK/MO</option><option>Server Asia</option><option>Server Global</option><option>Lainnya</option>
          </select>
          <label className={lbl}>Email / ID Akun</label>
          <input className={inp} placeholder="email atau ID game" value={accId} onChange={e=>setAccId(e.target.value)}/>
          <label className={lbl}>Nickname In-Game</label>
          <input className={inp} placeholder="nick kamu di game" value={nick} onChange={e=>setNick(e.target.value)}/>
          <label className={lbl}>Metode Pengerjaan</label>
          <select className={inp} value={method} onChange={e=>setMethod(e.target.value)}>
            <option value="lepas">Lepas — penjual yang main akun kamu</option>
            <option value="gendong">Gendong — kamu main, dibimbing penjual</option>
          </select>
          <label className={lbl}>Catatan untuk Penjoki (opsional)</label>
          <textarea className={inp} rows={2} placeholder="target level, hero, dll" value={note} onChange={e=>setNote(e.target.value)}/>
        </div>

        <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm">
          <div className="text-xs text-slate-500 mb-2 bg-pink-50 rounded-lg px-3 py-2">💡 Chat <b>/start</b> ke bot <b>@Jaaillbot</b> dulu untuk dapat Telegram ID kamu, lalu tempel di sini.</div>
          <input className={inp} placeholder="Telegram ID (angka, mis. 7710155531)" value={tg} onChange={e=>setTg(e.target.value)} inputMode="numeric"/>
          <select className={inp} value={pay} onChange={e=>setPay(e.target.value)}>
            <option value="qris">QRIS</option><option value="gopay">GoPay</option><option value="saweria">Saweria</option><option value="transfer">Transfer Bank</option>
          </select>
          <div className="text-[11px] text-slate-400 mb-3 leading-relaxed">🔒 Password akun <b>tidak diminta di sini</b>. Bot akan minta password lewat chat setelah pembayaran dikonfirmasi. Pembayaran langsung ke penjual; jika joki batal, dana dikembalikan oleh penjual.</div>
          {msg && <p className="text-rose-500 text-sm mb-3">{msg}</p>}
          <button onClick={order} disabled={busy||!tg} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-400 shadow-md shadow-pink-300/50 disabled:opacity-60">{busy?'Memproses…':'Buat Pesanan'}</button>
        </div>
      </div>
    </div>
  );
}

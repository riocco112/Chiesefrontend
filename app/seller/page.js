'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LogOut, Store } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase';
const rupiah=(n)=>'Rp'+Number(n).toLocaleString('id-ID');
export default function Seller(){
  const router=useRouter();
  const [user,setUser]=useState(null); const [store,setStore]=useState(null);
  const [listings,setListings]=useState([]); const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({ name:'', description:'', telegram_chat_id:'', pay_qris_url:'', pay_gopay:'', pay_saweria:'' });
  const [lform,setLform]=useState({ title:'', category:'coin', price:'', eta:'', description:'' });
  const [file,setFile]=useState(null); const [busy,setBusy]=useState(false);
  const supabase=createClient();
  async function load(){
    const { data:{ user } }=await supabase.auth.getUser();
    if(!user){ router.push('/login'); return; }
    setUser(user);
    const { data:s }=await supabase.from('stores').select('*').eq('owner_id',user.id).maybeSingle();
    setStore(s);
    if(s){ const { data:l }=await supabase.from('listings').select('*').eq('store_id',s.id).order('created_at',{ascending:false}); setListings(l||[]); }
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);
  async function buatToko(){
    setBusy(true);
    const slug=form.name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
    const { error }=await supabase.from('stores').insert({ ...form, owner_id:user.id, slug });
    setBusy(false);
    if(error) return alert(error.message);
    load();
  }
  async function tambahListing(){
    setBusy(true);
    let image_url=null;
    if(file){
      const path=`${store.id}/${Date.now()}-${file.name}`;
      const { error:upErr }=await supabase.storage.from('product-images').upload(path,file);
      if(!upErr){ const { data }=supabase.storage.from('product-images').getPublicUrl(path); image_url=data.publicUrl; }
    }
    const { error }=await supabase.from('listings').insert({ store_id:store.id, title:lform.title, category:lform.category, price:parseInt(lform.price)||0, eta:lform.eta, description:lform.description, image_url });
    setBusy(false);
    if(error) return alert(error.message);
    setLform({ title:'', category:'coin', price:'', eta:'', description:'' }); setFile(null);
    load();
  }
  async function logout(){ await supabase.auth.signOut(); router.push('/'); }
  if(loading) return (<div><Navbar/><p className="text-center py-20 text-slate-400">Memuat…</p></div>);
  const inp="w-full mb-3 px-4 py-3 rounded-xl bg-pink-50 border border-pink-100 text-slate-700 focus:outline-none focus:border-pink-300";
  return (
    <div className="min-h-screen">
      <Navbar/>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-semibold text-slate-800">Dashboard Seller</h1>
          <button onClick={logout} className="inline-flex items-center gap-2 text-sm text-rose-400"><LogOut className="w-4 h-4"/> Keluar</button>
        </div>
        {!store ? (
          <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-rose-500"><Store className="w-5 h-5"/><h2 className="font-display text-xl font-semibold">Buka Toko</h2></div>
            <input className={inp} placeholder="Nama toko" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
            <textarea className={inp} placeholder="Deskripsi toko" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
            <input className={inp} placeholder="Telegram Chat ID (dari @bot /id)" value={form.telegram_chat_id} onChange={e=>setForm({...form,telegram_chat_id:e.target.value})}/>
            <input className={inp} placeholder="URL QRIS (opsional)" value={form.pay_qris_url} onChange={e=>setForm({...form,pay_qris_url:e.target.value})}/>
            <input className={inp} placeholder="Nomor GoPay (opsional)" value={form.pay_gopay} onChange={e=>setForm({...form,pay_gopay:e.target.value})}/>
            <input className={inp} placeholder="Link Saweria (opsional)" value={form.pay_saweria} onChange={e=>setForm({...form,pay_saweria:e.target.value})}/>
            <button onClick={buatToko} disabled={busy||!form.name} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-400 shadow-md shadow-pink-300/50 disabled:opacity-60">{busy?'Menyimpan…':'Buka Toko'}</button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm mb-6">
              <h2 className="font-display text-xl font-semibold text-slate-800 mb-1">{store.name}</h2>
              <p className="text-slate-400 text-sm">{store.description}</p>
            </div>
            <div className="bg-white rounded-3xl border border-pink-100 p-6 shadow-sm mb-6">
              <div className="flex items-center gap-2 mb-4 text-rose-500"><Plus className="w-5 h-5"/><h2 className="font-display text-xl font-semibold">Tambah Jasa</h2></div>
              <input className={inp} placeholder="Judul jasa" value={lform.title} onChange={e=>setLform({...lform,title:e.target.value})}/>
              <select className={inp} value={lform.category} onChange={e=>setLform({...lform,category:e.target.value})}>
                <option value="coin">Grinding Coin</option><option value="level">Joki Level</option><option value="quest">Quest / Misi</option><option value="item">Farming Item</option><option value="other">Lainnya</option>
              </select>
              <input className={inp} placeholder="Harga (angka, mis. 15000)" type="number" value={lform.price} onChange={e=>setLform({...lform,price:e.target.value})}/>
              <input className={inp} placeholder="Estimasi (mis. 1 jam)" value={lform.eta} onChange={e=>setLform({...lform,eta:e.target.value})}/>
              <textarea className={inp} placeholder="Deskripsi" value={lform.description} onChange={e=>setLform({...lform,description:e.target.value})}/>
              <input className="mb-3 text-sm text-slate-500" type="file" accept="image/*" onChange={e=>setFile(e.target.files[0])}/>
              <button onClick={tambahListing} disabled={busy||!lform.title} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-400 shadow-md shadow-pink-300/50 disabled:opacity-60">{busy?'Menyimpan…':'Tambah Jasa'}</button>
            </div>
            <h3 className="font-display text-lg font-semibold text-slate-800 mb-3">Jasa Kamu ({listings.length})</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {listings.map(l=>(<div key={l.id} className="bg-white rounded-2xl border border-pink-100 p-4"><div className="font-semibold text-slate-700 text-sm">{l.title}</div><div className="text-rose-500 font-display font-semibold mt-1">{rupiah(l.price)}</div></div>))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

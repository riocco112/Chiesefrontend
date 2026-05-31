'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { createClient } from '@/lib/supabase';
export default function Daftar() {
  const [nama,setNama]=useState(''); const [email,setEmail]=useState(''); const [pw,setPw]=useState('');
  const [msg,setMsg]=useState(''); const [loading,setLoading]=useState(false);
  const router=useRouter();
  async function submit(){
    setLoading(true); setMsg('');
    const supabase=createClient();
    const { error }=await supabase.auth.signUp({ email, password: pw, options:{ data:{ full_name: nama, username: email.split('@')[0] } } });
    setLoading(false);
    if(error) return setMsg(error.message);
    setMsg('Berhasil! Cek email buat verifikasi, lalu login.');
    setTimeout(()=>router.push('/login'),2500);
  }
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-pink-100 shadow-lg shadow-pink-200/30 p-8">
        <div className="flex justify-center mb-6"><Logo size="lg" /></div>
        <h1 className="font-display text-2xl font-semibold text-center text-slate-800 mb-6">Daftar</h1>
        <input value={nama} onChange={e=>setNama(e.target.value)} placeholder="Nama lengkap" className="w-full mb-3 px-4 py-3 rounded-xl bg-pink-50 border border-pink-100 text-slate-700 focus:outline-none focus:border-pink-300" />
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" className="w-full mb-3 px-4 py-3 rounded-xl bg-pink-50 border border-pink-100 text-slate-700 focus:outline-none focus:border-pink-300" />
        <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password (min 6 karakter)" type="password" className="w-full mb-4 px-4 py-3 rounded-xl bg-pink-50 border border-pink-100 text-slate-700 focus:outline-none focus:border-pink-300" />
        {msg && <p className="text-rose-500 text-sm mb-3">{msg}</p>}
        <button onClick={submit} disabled={loading} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-400 shadow-md shadow-pink-300/50 disabled:opacity-60">{loading?'Memproses…':'Daftar'}</button>
        <p className="text-center text-sm text-slate-400 mt-5">Sudah punya akun? <Link href="/login" className="text-rose-500 font-semibold">Masuk</Link></p>
      </div>
    </div>
  );
}

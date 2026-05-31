'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { createClient } from '@/lib/supabase';
export default function Login() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState('');
  const [msg, setMsg] = useState(''); const [loading, setLoading] = useState(false);
  const router = useRouter();
  async function submit() {
    setLoading(true); setMsg('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setLoading(false);
    if (error) return setMsg(error.message);
    router.push('/seller');
  }
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-pink-100 shadow-lg shadow-pink-200/30 p-8">
        <div className="flex justify-center mb-6"><Logo size="lg" /></div>
        <h1 className="font-display text-2xl font-semibold text-center text-slate-800 mb-6">Masuk</h1>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" className="w-full mb-3 px-4 py-3 rounded-xl bg-pink-50 border border-pink-100 text-slate-700 focus:outline-none focus:border-pink-300" />
        <input value={pw} onChange={e=>setPw(e.target.value)} placeholder="Password" type="password" className="w-full mb-4 px-4 py-3 rounded-xl bg-pink-50 border border-pink-100 text-slate-700 focus:outline-none focus:border-pink-300" />
        {msg && <p className="text-rose-500 text-sm mb-3">{msg}</p>}
        <button onClick={submit} disabled={loading} className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-400 shadow-md shadow-pink-300/50 disabled:opacity-60">{loading?'Memproses…':'Masuk'}</button>
        <p className="text-center text-sm text-slate-400 mt-5">Belum punya akun? <Link href="/daftar" className="text-rose-500 font-semibold">Daftar</Link></p>
      </div>
    </div>
  );
}

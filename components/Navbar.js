'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Receipt } from 'lucide-react';
import Logo from '@/components/Logo';
import { createClient } from '@/lib/supabase';
export default function Navbar() {
  const [user, setUser] = useState(null);
  useEffect(() => { const s=createClient(); s.auth.getUser().then(({data})=>setUser(data.user)); }, []);
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-pink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
        <Link href="/"><Logo /></Link>
        <div className="flex-1" />
        {user && <Link href="/pesanan" className="grid place-items-center w-10 h-10 rounded-full bg-pink-50 border border-pink-100 hover:bg-pink-100 transition"><Receipt className="w-5 h-5 text-rose-400" /></Link>}
        <Link href="/checkout" className="grid place-items-center w-10 h-10 rounded-full bg-pink-50 border border-pink-100 hover:bg-pink-100 transition"><ShoppingCart className="w-5 h-5 text-rose-400" /></Link>
        {user ? (
          <Link href="/seller" className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md shadow-pink-300/50">Dashboard</Link>
        ) : (
          <Link href="/login" className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md shadow-pink-300/50">Masuk</Link>
        )}
      </div>
    </header>
  );
}

'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
export default function Sukses(){
  const [code,setCode]=useState('');
  useEffect(()=>{ setCode(localStorage.getItem('chiese_last_order')||''); },[]);
  return (
    <div className="min-h-screen">
      <Navbar/>
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4"/>
        <h1 className="font-display text-2xl font-semibold text-slate-800 mb-2">Pesanan Dibuat!</h1>
        {code && <p className="text-sm text-slate-500 mb-1">Kode pesanan: <b className="text-rose-500">{code}</b></p>}
        <p className="text-slate-500 mb-6">Status <b>pending</b>. Lanjutkan pembayaran & kirim bukti ke bot Telegram untuk konfirmasi.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/pesanan" className="px-6 py-3 rounded-full font-semibold text-rose-400 bg-white border border-pink-200">Lihat Pesanan</Link>
          <Link href="/" className="px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-400 shadow-md shadow-pink-300/50">Beranda</Link>
        </div>
      </div>
    </div>
  );
}

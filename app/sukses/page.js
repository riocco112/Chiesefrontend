'use client';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
export default function Sukses(){
  return (
    <div className="min-h-screen">
      <Navbar/>
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4"/>
        <h1 className="font-display text-2xl font-semibold text-slate-800 mb-2">Pesanan Dibuat!</h1>
        <p className="text-slate-500 mb-6">Pesananmu berstatus <b>pending</b>. Lanjutkan pembayaran & kirim bukti ke bot Telegram untuk konfirmasi.</p>
        <Link href="/" className="inline-block px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-400 shadow-md shadow-pink-300/50">Kembali ke Beranda</Link>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShieldCheck, Clock, BadgeCheck, Sparkles, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';

const VIDEO_URL = 'https://res.cloudinary.com/duu9uutzz/video/upload/f_auto,q_auto:good/lv_0_20260603195106_ygtmyc.mp4';
const AUTO_MS = 50000;

export default function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  const [muted, setMuted] = useState(true);
  const touchX = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i === 0 ? 1 : 0)), AUTO_MS);
    return () => clearInterval(t);
  }, [idx]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (idx === 1) { v.currentTime = 0; v.play().catch(() => {}); }
    else { v.pause(); }
  }, [idx]);

  const go = (n) => setIdx((n + 2) % 2);
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 50) { dx < 0 ? go(idx + 1) : go(idx - 1); }
    touchX.current = null;
  };

  return (
    <div className="group relative max-w-2xl select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="overflow-hidden rounded-3xl">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
          <div className="w-full shrink-0 pr-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-pink-100 text-xs font-medium text-rose-400 mb-5 shadow-sm"><Sparkles className="w-3.5 h-3.5" /> Marketplace Joki Heartopia #1</div>
            <h1 className="font-display text-4xl sm:text-6xl font-semibold leading-[1.05] tracking-tight mb-5 text-slate-800">Naik level tanpa<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">grinding capek.</span></h1>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">Pilih jasa joki terpercaya dari seller terverifikasi. Coin, level, quest, item langka — beres sambil kamu santai.</p>
            <div className="flex flex-wrap gap-3">
              <a href="#katalog" className="px-6 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-pink-400 to-rose-400 shadow-lg shadow-pink-300/50 hover:scale-[1.02] transition">Jelajahi Jasa</a>
              <Link href="/seller" className="px-6 py-3 rounded-full font-semibold text-rose-400 bg-white border border-pink-200 hover:bg-pink-50 transition">Jadi Seller</Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-10 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Garansi 100%</span>
              <span className="inline-flex items-center gap-2"><Clock className="w-4 h-4 text-sky-500" /> Pengerjaan cepat</span>
              <span className="inline-flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-pink-400" /> Seller terverifikasi</span>
            </div>
          </div>
          <div className="w-full shrink-0 pl-1 flex items-center">
            <div className="relative w-full"><video ref={videoRef} src={VIDEO_URL} className="w-full rounded-2xl shadow-lg shadow-pink-200/50 bg-black" muted={muted} loop playsInline preload="metadata" style={{ aspectRatio: '16 / 9' }} /><button onClick={(e)=>{e.stopPropagation(); setMuted(m=>!m);}} aria-label={muted?'Nyalakan suara':'Matikan suara'} className="absolute bottom-3 right-3 grid place-items-center w-10 h-10 rounded-full bg-black/55 hover:bg-black/75 text-white transition backdrop-blur-sm">{muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button></div>
          </div>
        </div>
      </div>
      <button onClick={() => go(idx - 1)} aria-label="Sebelumnya" className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-white/90 border border-pink-100 shadow hover:bg-pink-50 transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"><ChevronLeft className="w-5 h-5 text-rose-400" /></button>
      <button onClick={() => go(idx + 1)} aria-label="Berikutnya" className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 rounded-full bg-white/90 border border-pink-100 shadow hover:bg-pink-50 transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"><ChevronRight className="w-5 h-5 text-rose-400" /></button>
      <div className="flex justify-center gap-2 mt-5">
        {[0, 1].map((i) => (
          <button key={i} onClick={() => go(i)} aria-label={`Slide ${i + 1}`} className={`h-2 rounded-full transition-all ${idx === i ? 'w-6 bg-rose-400' : 'w-2 bg-pink-200'}`} />
        ))}
      </div>
    </div>
  );
}

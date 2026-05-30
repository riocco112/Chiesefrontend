import { Heart, Sparkles } from 'lucide-react';
export default function Logo({ size = 'md' }) {
  const big = size === 'lg';
  return (
    <div className="flex items-center gap-2.5">
      <div className={`relative grid place-items-center rounded-2xl bg-gradient-to-br from-pink-400 to-rose-400 shadow-md shadow-pink-300/50 ${big ? 'w-11 h-11' : 'w-9 h-9'}`}>
        <Heart className={big ? 'w-6 h-6 text-white' : 'w-5 h-5 text-white'} fill="white" />
        <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-amber-300" fill="currentColor" />
      </div>
      <div className="leading-none">
        <span className={`font-display font-semibold tracking-tight text-rose-500 ${big ? 'text-2xl' : 'text-xl'}`}>Chiescaciy</span>
        <span className={`font-display font-semibold text-pink-400 ml-1.5 ${big ? 'text-2xl' : 'text-xl'}`}>甜心</span>
      </div>
    </div>
  );
}

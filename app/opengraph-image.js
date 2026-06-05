import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Chiescaciy 甜心 · Marketplace Joki & Item Game';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #fff5f7 0%, #ffe4ec 45%, #ffd5e5 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: -120, right: -80, width: 420, height: 420, borderRadius: '50%', background: 'rgba(251,113,150,0.25)' }} />
        <div style={{ position: 'absolute', bottom: -140, left: -60, width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,182,193,0.30)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ display: 'flex', background: '#fff', border: '2px solid #ffc2d4', color: '#f43f72', fontSize: 26, fontWeight: 600, padding: '10px 22px', borderRadius: 999 }}>✨ Marketplace Joki #1</div>
        </div>
        <div style={{ display: 'flex', fontSize: 92, fontWeight: 800, color: '#2b2b3a', lineHeight: 1.05, letterSpacing: -2 }}>Naik level tanpa</div>
        <div style={{ display: 'flex', fontSize: 92, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, marginBottom: 26, color: '#f43f72' }}>grinding capek.</div>
        <div style={{ display: 'flex', fontSize: 38, fontWeight: 700, color: '#3a3a48', marginBottom: 14 }}>Chiescaciy 甜心</div>
        <div style={{ display: 'flex', fontSize: 30, color: '#6b6b7b', marginBottom: 30 }}>Heartopia · Mobile Legends · Roblox · Fisch · Fish It</div>
        <div style={{ display: 'flex', gap: 18, fontSize: 26, color: '#4a4a58' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.7)', padding: '10px 20px', borderRadius: 14 }}>✓ Aman</div>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.7)', padding: '10px 20px', borderRadius: 14 }}>✓ Cepat</div>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.7)', padding: '10px 20px', borderRadius: 14 }}>✓ Terpercaya</div>
        </div>
      </div>
    ),
    { ...size }
  );
}

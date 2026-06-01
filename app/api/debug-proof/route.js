import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG = `https://api.telegram.org/bot${TOKEN}`;

export async function GET() {
  const out = { steps: [] };
  const log = (k, v) => out.steps.push({ [k]: v });
  try {
    const sb = createAdminClient();
    const cid = '6513138520';

    const { data: po } = await sb.from('orders')
      .select('*, listings(title), stores(name, telegram_chat_id)')
      .eq('telegram_user', cid).eq('status', 'pending')
      .order('created_at', { ascending: false }).limit(1);
    const order = po && po[0];
    log('orderFound', order ? order.order_code : 'NONE');
    const sellerChat = order?.stores?.telegram_chat_id;
    log('sellerChat', sellerChat);
    log('listingTitle', order?.listings?.title);

    // coba kirim PESAN TEKS ke seller (tanpa foto, biar ketauan send ke seller jalan apa nggak)
    const r = await fetch(`${TG}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: sellerChat, text: `🧪 TES kirim ke seller. Order ${order?.order_code}`, parse_mode: 'HTML' }),
    });
    const j = await r.json();
    log('sendToSellerResult', j);
  } catch (e) {
    log('FATAL', e.message + ' | ' + (e.stack || '').split('\n')[1]);
  }
  return NextResponse.json(out);
}
export const dynamic = 'force-dynamic';

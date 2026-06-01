import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';

export async function GET() {
  const out = { env: {}, steps: {} };
  out.env.hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  out.env.hasServiceKey = !!process.env.SUPABASE_SERVICE_KEY;
  out.env.hasBotToken = !!process.env.TELEGRAM_BOT_TOKEN;
  out.env.hasGroq = !!process.env.GROQ_API_KEY;
  try {
    const sb = createAdminClient();
    const cid = '6513138520';
    // ARAH 1 cek toko
    const { data: st, error: e1 } = await sb.from('stores').select('id, name').eq('telegram_chat_id', cid).limit(1);
    out.steps.storeOfSender = { data: st, error: e1?.message || null };
    // ARAH 2 cari order pending buyer
    const { data: po, error: e2 } = await sb.from('orders')
      .select('order_code, status, telegram_user, stores(name, telegram_chat_id)')
      .eq('telegram_user', cid).eq('status', 'pending')
      .order('created_at', { ascending: false }).limit(1);
    out.steps.pendingOrder = { data: po, error: e2?.message || null };
  } catch (e) {
    out.fatal = e.message;
  }
  return NextResponse.json(out);
}
export const dynamic = 'force-dynamic';

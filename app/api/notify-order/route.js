import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { chatId, text } = await request.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return NextResponse.json({ ok:false, error:'no token' }, { status:500 });
    if (!chatId || !/^\d+$/.test(String(chatId))) return NextResponse.json({ ok:true, skip:'invalid chat' });

    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ chat_id: chatId, text, parse_mode:'HTML' })
    });
    const data = await r.json();
    return NextResponse.json({ ok: data.ok, result: data });
  } catch (e) {
    return NextResponse.json({ ok:false, error: e.message }, { status:500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const TYPE_LABEL = { joki_lepas:'Joki Lepas', joki_gendong:'Joki Gendong', item:'Beli Item' };

function csvEscape(v){
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
}

async function tgSendMessage(token, chatId, text){
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ chat_id: chatId, text, parse_mode:'HTML' })
  }).then(r=>r.json()).catch(()=>({ok:false}));
}

async function tgSendDocument(token, chatId, filename, content, caption){
  const form = new FormData();
  form.append('chat_id', String(chatId));
  if (caption) { form.append('caption', caption); form.append('parse_mode','HTML'); }
  form.append('document', new Blob([content], { type:'text/csv' }), filename);
  return fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method:'POST', body: form })
    .then(r=>r.json()).catch(()=>({ok:false}));
}

const rupiah = (n)=>'Rp'+Number(n||0).toLocaleString('id-ID');

export async function GET(req){ return handle(req); }
export async function POST(req){ return handle(req); }

async function handle(req){
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  if (key !== process.env.REPORT_SECRET) {
    return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth:{ persistSession:false } });

  // rentang bulan berjalan
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth()+1, 1).toISOString();
  const bulanLabel = now.toLocaleDateString('id-ID', { month:'long', year:'numeric' });

  const { data: stores } = await sb.from('stores').select('id, name, telegram_chat_id, sold_count');
  let report = { bulan: bulanLabel, toko_diproses:0, order_diarsip:0, chat_dihapus:0, detail:[] };

  for (const st of (stores||[])) {
    if (!st.telegram_chat_id || !/^\d+$/.test(String(st.telegram_chat_id))) continue;

    const { data: ords } = await sb.from('orders')
      .select('created_at, order_code, order_type, total, status, pay_method, nickname, account_id, listings(title)')
      .eq('store_id', st.id).gte('created_at', start).lt('created_at', end)
      .order('created_at', { ascending:true });

    const rows = ords || [];
    if (rows.length === 0) { report.detail.push({ toko: st.name, order:0, skip:'no order' }); continue; }

    // build CSV
    const header = ['Tanggal','Kode','Jasa','Tipe','Total','Status','Bayar','Nickname','AkunID'];
    const lines = [header.join(',')];
    let omzet = 0, selesai = 0;
    for (const o of rows) {
      const tgl = new Date(o.created_at).toLocaleDateString('id-ID');
      if (o.status === 'completed') { omzet += (o.total||0); selesai++; }
      lines.push([
        tgl, o.order_code, o.listings?.title || '-', TYPE_LABEL[o.order_type]||o.order_type||'-',
        o.total||0, o.status, (o.pay_method||'-').toUpperCase(), o.nickname||'-', o.account_id||'-'
      ].map(csvEscape).join(','));
    }
    const csv = '\uFEFF' + lines.join('\n'); // BOM biar Excel kebaca UTF-8

    const filename = `Laporan_${st.name.replace(/[^a-zA-Z0-9]+/g,'_')}_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}.csv`;
    const caption = `📊 <b>Laporan ${bulanLabel}</b> — ${st.name}\n\n`
      + `• Total order: ${rows.length}\n• Selesai: ${selesai}\n• Omzet (selesai): ${rupiah(omzet)}\n\n`
      + `File CSV terlampir 📎\n<i>Data order yang sudah selesai/ditolak diarsipkan & dibersihkan dari sistem setelah laporan ini.</i>`;

    const sent = await tgSendDocument(token, st.telegram_chat_id, filename, csv, caption);

    if (sent && sent.ok) {
      report.toko_diproses++;
      // sold_count += jumlah completed (penjualan permanen)
      if (selesai > 0) {
        await sb.from('stores').update({ sold_count: (st.sold_count||0) + selesai }).eq('id', st.id);
      }
      // hapus order completed/rejected bulan ini (udah aman di CSV)
      const { data: del } = await sb.from('orders').delete()
        .eq('store_id', st.id).gte('created_at', start).lt('created_at', end)
        .in('status', ['completed','rejected']).select('id');
      report.order_diarsip += (del?.length || 0);
      report.detail.push({ toko: st.name, order: rows.length, selesai, diarsip: del?.length||0 });
    } else {
      report.detail.push({ toko: st.name, order: rows.length, error:'kirim gagal, data TIDAK dihapus' });
    }
  }

  // bersihin chat_sessions lama (closed/rejected)
  const { data: delChat } = await sb.from('chat_sessions').delete()
    .in('status', ['closed','rejected']).select('id');
  report.chat_dihapus = delChat?.length || 0;

  return NextResponse.json({ ok:true, ...report });
}

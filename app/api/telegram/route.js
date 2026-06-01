import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import Groq from 'groq-sdk';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG = `https://api.telegram.org/bot${TOKEN}`;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const rupiah = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID');

async function tg(method, payload) {
  try {
    const r = await fetch(`${TG}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await r.json();
  } catch (e) { console.error('tg err', method, e.message); return null; }
}
const send = (chat_id, text, reply_markup) =>
  tg('sendMessage', { chat_id, text, parse_mode: 'HTML', ...(reply_markup ? { reply_markup } : {}) });
const sendPhoto = (chat_id, photo, caption, reply_markup) =>
  tg('sendPhoto', { chat_id, photo, caption, parse_mode: 'HTML', ...(reply_markup ? { reply_markup } : {}) });
const editMarkup = (chat_id, message_id, reply_markup) =>
  tg('editMessageReplyMarkup', { chat_id, message_id, reply_markup });
const answerCb = (id, text) => tg('answerCallbackQuery', { callback_query_id: id, ...(text ? { text } : {}) });

const confirmKb = (code) => ({ inline_keyboard: [[
  { text: '✅ Konfirmasi', callback_data: `confirm:${code}` },
  { text: '❌ Tolak', callback_data: `reject:${code}` },
]] });
const doneKb = (code) => ({ inline_keyboard: [[
  { text: '✅ Tandai Selesai', callback_data: `done:${code}` },
]] });

async function csReply(text) {
  try {
    const r = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: 'Kamu CS Chiescaciy 甜心, marketplace jasa joki game Heartopia. Jawab ramah, singkat, Bahasa Indonesia santai. Bantu soal cara order, status, bayar. Jangan mengarang status order.' },
        { role: 'user', content: text },
      ],
      temperature: 0.6, max_tokens: 400,
    });
    return r.choices[0]?.message?.content?.trim() || 'Maaf, lagi ada gangguan. Coba lagi ya 🙏';
  } catch { return 'Maaf, lagi ada gangguan. Coba lagi ya 🙏'; }
}

export async function POST(req) {
  const update = await req.json().catch(() => ({}));
  // proses async, balas cepat
  handle(update).catch((e) => console.error('handle err', e));
  return NextResponse.json({ ok: true });
}

async function handle(update) {
  const sb = createAdminClient();

  // ===== CALLBACK TOMBOL =====
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message.chat.id;
    const msgId = cq.message.message_id;
    const [action, code] = (cq.data || '').split(':');
    if (!code) return;
    const { data: ordArr } = await sb.from('orders')
      .select('*, listings(title), stores(name)').eq('order_code', code).limit(1);
    const ord = ordArr && ordArr[0];
    if (!ord) { await answerCb(cq.id, 'Order tidak ditemukan'); return; }
    const buyerTg = ord.telegram_user;
    const storeName = ord.stores?.name || 'toko';
    if (action === 'confirm') {
      await sb.from('orders').update({ status: 'confirmed' }).eq('order_code', code);
      await answerCb(cq.id, 'Dikonfirmasi ✅');
      await editMarkup(chatId, msgId, doneKb(code));
      await send(chatId, `✅ Pembayaran <code>${code}</code> dikonfirmasi.\nKerjakan joki-nya. Kalau sudah kelar, tekan <b>Tandai Selesai</b> di atas.`);
      if (buyerTg && /^\d+$/.test(String(buyerTg)))
        await send(buyerTg, `✅ <b>Pembayaran Dikonfirmasi!</b>\n\nOrder <code>${code}</code> dikonfirmasi penjual. Joki kamu segera dikerjakan.\n\nMakasih sudah order di <b>${storeName}</b> 💝`);
    } else if (action === 'reject') {
      await sb.from('orders').update({ status: 'rejected' }).eq('order_code', code);
      await answerCb(cq.id, 'Ditolak ❌');
      await editMarkup(chatId, msgId, { inline_keyboard: [] });
      await send(chatId, `❌ Pesanan <code>${code}</code> kamu tolak.`);
      if (buyerTg && /^\d+$/.test(String(buyerTg)))
        await send(buyerTg, `❌ Maaf, bukti bayar order <code>${code}</code> ditolak penjual. Hubungi penjual untuk info lebih lanjut.`);
    } else if (action === 'done') {
      await sb.from('orders').update({ status: 'completed' }).eq('order_code', code);
      await answerCb(cq.id, 'Selesai ✅');
      await editMarkup(chatId, msgId, { inline_keyboard: [] });
      await send(chatId, `📸 Order <code>${code}</code> <b>selesai</b>.\nSekarang <b>kirim foto bukti hasil pengerjaan</b> ke chat ini, nanti aku teruskan ke pembeli.`);
    }
    return;
  }

  const msg = update.message;
  if (!msg) return;
  const chatId = msg.chat.id;
  const cid = String(chatId);
  const text = (msg.text || '').trim();
  const username = msg.from?.username || '';

  // ===== FOTO (bukti) =====
  if (msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    // ARAH 1: pengirim = SELLER kirim bukti HASIL
    const { data: stArr } = await sb.from('stores').select('id, name').eq('telegram_chat_id', cid).limit(1);
    const st = stArr && stArr[0];
    if (st) {
      const { data: ocArr } = await sb.from('orders')
        .select('*, listings(title)').eq('store_id', st.id).eq('status', 'completed')
        .is('result_proof', null).order('updated_at', { ascending: false }).limit(1);
      const oc = ocArr && ocArr[0];
      console.log('PHOTO ARAH1 seller?', !!st, 'completed-pending-proof?', !!oc);
      if (oc) {
        await sb.from('orders').update({ result_proof: fileId }).eq('order_code', oc.order_code);
        await send(chatId, `✅ Bukti hasil order <code>${oc.order_code}</code> diteruskan ke pembeli. Makasih! 🪷`);
        const bt = oc.telegram_user;
        if (bt && /^\d+$/.test(String(bt)))
          await sendPhoto(bt, fileId, `🎉 <b>Pesanan Selesai!</b>\n\nOrder <code>${oc.order_code}</code>\nJasa: ${oc.listings?.title || 'jasa'}\n\nIni bukti hasil pengerjaan dari penjual. Makasih sudah order di <b>${st.name}</b> 💝`);
        return;
      }
    }
    // ARAH 2: pengirim = BUYER kirim bukti BAYAR
    const { data: poArr } = await sb.from('orders')
      .select('*, listings(title), stores(name, telegram_chat_id)')
      .eq('telegram_user', cid).eq('status', 'pending')
      .order('created_at', { ascending: false }).limit(1);
    const po = poArr && poArr[0];
    console.log('PHOTO ARAH2 cid=', cid, 'order pending?', po ? po.order_code : 'NONE');
    if (!po) { await send(chatId, 'Bukti diterima, tapi aku nggak nemu order pending atas nama kamu. Pastikan Telegram ID di checkout sama dengan akun ini ya 🙏'); return; }
    const sellerChat = po.stores?.telegram_chat_id;
    await send(chatId, `✅ Bukti pembayaran <b>diterima</b>!\n\nOrder <code>${po.order_code}</code>\nPenjual sedang mengecek. Harap tunggu konfirmasi ya 🙏`);
    if (sellerChat) {
      const cap = `💰 <b>Bukti Pembayaran Masuk!</b>\n\nOrder: <code>${po.order_code}</code>\nPembeli ID: ${cid}\nProduk: ${po.listings?.title || 'jasa'}\nTotal: ${rupiah(po.total)}\nMetode: ${String(po.pay_method || '-').toUpperCase()}\n\n🤖 <i>Cek nominal & nama pengirim sebelum konfirmasi.</i>`;
      await sendPhoto(sellerChat, fileId, cap);
      await send(sellerChat, 'Konfirmasi pembayaran:', confirmKb(po.order_code));
    }
    return;
  }

  // ===== COMMAND / TEKS =====
  if (text.startsWith('/start')) {
    await send(chatId, `Halo${username ? ' @' + username : ''}! 💝 Selamat datang di <b>Chiescaciy 甜心</b> Bot.\n\n🆔 Telegram ID kamu: <code>${chatId}</code>\n\nBuat <b>seller</b>: salin ID di atas, paste ke form Buka Toko di website.\n\nPerintah:\n/id — cek ID\n/orders — pesanan masuk (seller)\n/help — bantuan\n\nMau tanya apa aja? Ketik aja, aku bantu jawab 😊`);
    return;
  }
  if (text.startsWith('/id')) { await send(chatId, `🆔 Telegram ID kamu: <code>${chatId}</code>`); return; }
  if (text.startsWith('/help')) { await send(chatId, '<b>Bantuan Chiese Bot</b>\n/start — mulai\n/id — cek Telegram ID\n/orders — pesanan masuk (seller)\n\nAtau ketik pertanyaan bebas, aku jawab pakai AI 🤖'); return; }
  if (text.startsWith('/orders')) {
    const { data: stArr2 } = await sb.from('stores').select('id, name').eq('telegram_chat_id', cid).limit(1);
    const st = stArr2 && stArr2[0];
    if (!st) { await send(chatId, 'Kamu belum punya toko terhubung. Buka toko dulu di website & pasang Telegram ID ini.'); return; }
    const { data: ords } = await sb.from('orders')
      .select('order_code, total, listings(title)').eq('store_id', st.id).eq('status', 'pending')
      .order('created_at', { ascending: false }).limit(10);
    if (!ords || !ords.length) { await send(chatId, `🏪 <b>${st.name}</b>\nBelum ada pesanan pending.`); return; }
    const lines = ords.map(o => `• <code>${o.order_code}</code> — ${o.listings?.title || 'jasa'} — ${rupiah(o.total)}`).join('\n');
    await send(chatId, `📦 <b>Pesanan Pending (${ords.length})</b> — ${st.name}\n\n${lines}`);
    return;
  }
  if (text) { await send(chatId, await csReply(text)); }
}

export const dynamic = 'force-dynamic';

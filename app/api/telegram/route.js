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

function bersihinText(t){
  if(!t) return t;
  return t
    .replace(/<[^>]*>/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/(^|\s)#{1,6}\s?/g, '$1')
    .replace(/`+/g, '')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function csReply(text) {
  try {
    const r = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: 'Kamu CS Chiescaciy 甜心, marketplace jasa joki & item game (Heartopia, Mobile Legends, Roblox, Fisch, Fish It). Jawab ramah, singkat, Bahasa Indonesia santai. Bantu soal cara order, status, bayar. Jangan mengarang status order. FORMAT PENTING: tulis plain text biasa. Untuk daftar/list pakai tanda titik bullet (•) atau angka (1. 2. 3.). DILARANG memakai karakter format seperti bintang (*), pagar (#), tanda bintang ganda (**), garis bawah (_), atau tag HTML apapun. Jangan bold, jangan italic, cukup teks polos yang rapi.' },
        { role: 'user', content: text },
      ],
      temperature: 0.6, max_tokens: 400,
    });
    return bersihinText(r.choices[0]?.message?.content?.trim()) || 'Maaf, lagi ada gangguan. Coba lagi ya 🙏';
  } catch { return 'Maaf, lagi ada gangguan. Coba lagi ya 🙏'; }
}

export async function POST(req) {
  const update = await req.json().catch(() => ({}));
  try { await handle(update); } catch (e) { console.error('handle err', e); }
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

    // ===== RELAY CHAT: hub (buyer minta) / acc (seller terima) / tolak (seller tolak) =====
    if (action === 'hub') {
      const storeId = code;
      const { data: stA } = await sb.from('stores').select('id, name, telegram_chat_id').eq('id', storeId).limit(1);
      const st = stA && stA[0];
      if (!st || !st.telegram_chat_id) { await answerCb(cq.id, 'Penjual tidak tersedia'); return; }
      // tutup sesi pending lama buyer ini biar nggak numpuk
      await sb.from('chat_sessions').update({ status:'closed', updated_at:new Date().toISOString() })
        .eq('buyer_chat_id', String(chatId)).in('status', ['pending','active']);
      const { data: ins } = await sb.from('chat_sessions')
        .insert({ buyer_chat_id: String(chatId), seller_chat_id: String(st.telegram_chat_id), store_id: st.id, status: 'pending' })
        .select('id').limit(1);
      const sid = ins && ins[0] && ins[0].id;
      await answerCb(cq.id, 'Permintaan dikirim ke penjual ✅');
      await send(chatId, `📨 Permintaan chat dikirim ke penjual <b>${st.name}</b>. Tunggu penjual menerima ya 💝`);
      await send(st.telegram_chat_id, `🔔 <b>Ada pembeli mau menghubungi kamu</b>
Toko: ${st.name}

Mau dilayani? Kalau terima, pesan pembeli akan diteruskan ke kamu lewat bot.`, { inline_keyboard: [[{ text: '✅ Terima', callback_data: `acc:${sid}` }, { text: '❌ Tolak', callback_data: `tolak:${sid}` }]] });
      return;
    }
    if (action === 'acc' || action === 'tolak') {
      const sid = code;
      const { data: csA } = await sb.from('chat_sessions').select('*').eq('id', sid).limit(1);
      const sess = csA && csA[0];
      if (!sess) { await answerCb(cq.id, 'Sesi tidak ditemukan'); return; }
      if (String(sess.seller_chat_id) !== String(chatId)) { await answerCb(cq.id, 'Bukan untuk kamu'); return; }
      if (sess.status !== 'pending') { await answerCb(cq.id, 'Sesi sudah diproses'); return; }
      if (action === 'tolak') {
        await sb.from('chat_sessions').update({ status:'rejected', updated_at:new Date().toISOString() }).eq('id', sid);
        await answerCb(cq.id, 'Ditolak');
        await editMarkup(chatId, msgId, { inline_keyboard: [] });
        await send(chatId, '❌ Permintaan chat ditolak.');
        await send(sess.buyer_chat_id, '🙏 Maaf, penjual lagi nggak bisa dihubungi sekarang. Coba lagi nanti ya 💝');
        return;
      }
      // acc: aktifkan + tutup sesi aktif lain pihak ini
      await sb.from('chat_sessions').update({ status:'closed', updated_at:new Date().toISOString() })
        .or(`buyer_chat_id.eq.${sess.buyer_chat_id},seller_chat_id.eq.${sess.seller_chat_id}`).eq('status','active');
      await sb.from('chat_sessions').update({ status:'active', updated_at:new Date().toISOString() }).eq('id', sid);
      await answerCb(cq.id, 'Diterima ✅');
      await editMarkup(chatId, msgId, { inline_keyboard: [] });
      await send(chatId, '✅ Kamu menerima chat. Tulis pesan, aku teruskan utuh ke pembeli. Ketik /stop untuk mengakhiri.');
      await send(sess.buyer_chat_id, '✅ Penjual siap! Silakan tulis pesanmu, akan ku-sampaikan utuh tanpa diubah. Ketik /stop untuk mengakhiri 💝');
      return;
    }

    const { data: ordArr } = await sb.from('orders')
      .select('*, listings(title), stores(name, telegram_chat_id)').eq('order_code', code).limit(1);
    const ord = ordArr && ordArr[0];
    if (!ord) { await answerCb(cq.id, 'Order tidak ditemukan'); return; }
    const buyerTg = ord.telegram_user;
    const storeName = ord.stores?.name || 'toko';

    if (action === 'confirm') {
      const otype = ord.order_type || 'joki_lepas';
      const isLepas = otype === 'joki_lepas';
      const needLink = otype === 'item' && ord.handover === 'server_seller';
      const hoLabel = ord.handover === 'server_buyer' ? 'Server/Town Buyer'
        : ord.handover === 'server_seller' ? 'Server/Town Penjual'
        : ord.handover === 'global' ? 'Server Global' : '-';
      const typeLabel = otype === 'joki_lepas' ? 'Joki Lepas'
        : otype === 'joki_gendong' ? 'Joki Gendong' : 'Beli Item';
      const detail = `🎮 <b>Detail ${code}</b>\n`
        + `• Tipe: ${typeLabel}\n`
        + (isLepas ? `• Login: ${ord.login_via || '-'}\n` : '')
        + `• User ID/Username: <code>${ord.account_id || '-'}</code>\n`
        + `• Nickname: ${ord.nickname || '-'}\n`
        + (ord.handover ? `• Lokasi: ${hoLabel}\n` : '')
        + (ord.note ? `• Catatan: ${ord.note}\n` : '');

      await sb.from('orders').update({ status: 'confirmed', await_password: (isLepas || needLink) }).eq('order_code', code);
      await answerCb(cq.id, 'Dikonfirmasi ✅');
      await editMarkup(chatId, msgId, doneKb(code));

      if (isLepas) {
        await send(chatId, `✅ Pembayaran <code>${code}</code> dikonfirmasi.\n\n${detail}\n⏳ Menunggu pembeli kirim <b>password</b> lewat chat. Akan ku-teruskan ke sini begitu masuk.`);
        if (buyerTg && /^\d+$/.test(String(buyerTg)))
          await send(buyerTg, `✅ <b>Pembayaran Dikonfirmasi!</b>\n\nOrder <code>${code}</code> dikonfirmasi penjual.\n\n🔒 Sekarang kirim <b>DATA LOGIN</b> akun kamu ke chat ini biar penjual bisa masuk. Kirim email/username login + password dalam 1 pesan.\n\nContoh:\n<code>email: nama@gmail.com\npassword: rahasia123</code>\n\nData langsung diteruskan ke penjual dan <b>tidak disimpan</b> di sistem.\n\nMakasih sudah order di <b>${storeName}</b> 💝`);
      } else if (otype === 'joki_gendong') {
        await send(chatId, `✅ Pembayaran <code>${code}</code> dikonfirmasi.\n\n${detail}\n👥 <b>Joki Gendong</b> — hubungi pembeli & ajak main bareng. Tidak perlu password. Kalau kelar, tekan <b>Tandai Selesai</b>.`);
        if (buyerTg && /^\d+$/.test(String(buyerTg)))
          await send(buyerTg, `✅ <b>Pembayaran Dikonfirmasi!</b>\n\nOrder <code>${code}</code> — <b>Joki Gendong</b>.\n\n👥 Penjual akan menghubungi kamu untuk main bareng. Pastikan online ya. <b>Password tidak diperlukan.</b>\n\nMakasih sudah order di <b>${storeName}</b> 💝`);
      } else {
        await send(chatId, `✅ Pembayaran <code>${code}</code> dikonfirmasi.\n\n${detail}\n🛍️ <b>Beli Item</b> — serah-terima via trading in-game.` + (needLink ? `\n\n🔗 Lokasi = server kamu. <b>Kirim link/kode private server</b> ke chat ini, nanti ku-teruskan ke pembeli.` : `\n\nGabung ke lokasi pembeli/global untuk trading. Kalau kelar, tekan <b>Tandai Selesai</b>.`));
        if (buyerTg && /^\d+$/.test(String(buyerTg)))
          await send(buyerTg, `✅ <b>Pembayaran Dikonfirmasi!</b>\n\nOrder <code>${code}</code> — <b>Beli Item</b>.\n\n🛍️ Penjual akan menghubungi kamu untuk trading in-game.` + (needLink ? ` Tunggu link/kode private server dari penjual ya.` : ``) + `\n\nMakasih sudah order di <b>${storeName}</b> 💝`);
      }
    } else if (action === 'reject') {
      await sb.from('orders').update({ status: 'rejected', await_password: false }).eq('order_code', code);
      await answerCb(cq.id, 'Ditolak ❌');
      await editMarkup(chatId, msgId, { inline_keyboard: [] });
      await send(chatId, `❌ Pesanan <code>${code}</code> kamu tolak.`);
      if (buyerTg && /^\d+$/.test(String(buyerTg)))
        await send(buyerTg, `❌ Maaf, bukti bayar order <code>${code}</code> ditolak penjual. Hubungi penjual untuk info lebih lanjut.`);
    } else if (action === 'done') {
      await sb.from('orders').update({ status: 'completed', await_password: false }).eq('order_code', code);
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
    // ARAH 1: SELLER kirim bukti HASIL
    const { data: stArr } = await sb.from('stores').select('id, name').eq('telegram_chat_id', cid).limit(1);
    const st = stArr && stArr[0];
    if (st) {
      const { data: ocArr } = await sb.from('orders')
        .select('*, listings(title)').eq('store_id', st.id).eq('status', 'completed')
        .is('result_proof', null).order('updated_at', { ascending: false }).limit(1);
      const oc = ocArr && ocArr[0];
      if (oc) {
        await sb.from('orders').update({ result_proof: fileId }).eq('order_code', oc.order_code);
        await send(chatId, `✅ Bukti hasil order <code>${oc.order_code}</code> diteruskan ke pembeli. Makasih! 🪷`);
        const bt = oc.telegram_user;
        if (bt && /^\d+$/.test(String(bt)))
          await sendPhoto(bt, fileId, `🎉 <b>Pesanan Selesai!</b>\n\nOrder <code>${oc.order_code}</code>\nJasa: ${oc.listings?.title || 'jasa'}\n\nIni bukti hasil pengerjaan dari penjual. Makasih sudah order di <b>${st.name}</b> 💝`);
        return;
      }
    }
    // ARAH 2: BUYER kirim bukti BAYAR
    const { data: poArr } = await sb.from('orders')
      .select('*, listings(title), stores(name, telegram_chat_id)')
      .eq('telegram_user', cid).eq('status', 'pending')
      .order('created_at', { ascending: false }).limit(1);
    const po = poArr && poArr[0];
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

  // ===== COMMAND =====
  if (text.startsWith('/start')) {
    // deep link: /start chat_<storeId> -> mulai alur hubungi penjual
    const sp = text.split(' ');
    const payload = sp[1] || '';
    if (payload.startsWith('chat_')) {
      const storeId = payload.slice(5);
      const { data: stArr } = await sb.from('stores').select('id, name, telegram_chat_id, is_active').eq('id', storeId).limit(1);
      const st = stArr && stArr[0];
      if (!st) { await send(chatId, 'Toko tidak ditemukan 🙏'); return; }
      if (String(st.telegram_chat_id) === String(cid)) { await send(chatId, 'Ini toko kamu sendiri 😄'); return; }
      await send(chatId, `💬 Mau menghubungi penjual <b>${st.name}</b>?

Tekan tombol di bawah, nanti aku mintakan izin ke penjual dulu. Kalau penjual setuju, kamu bisa chat langsung (pesan diteruskan apa adanya lewat aku, biar privasi dua pihak aman) 💝`, { inline_keyboard: [[{ text: '💬 Hubungkan ke Penjual', callback_data: `hub:${st.id}` }]] });
      return;
    }
    await send(chatId, `Halo${username ? ' @' + username : ''}! 💝 Selamat datang di <b>Chiescaciy 甜心</b> Bot.\n\n🆔 Telegram ID kamu: <code>${chatId}</code>\n\nBuat <b>seller</b>: salin ID di atas, paste ke form Buka Toko di website.\n\nPerintah:\n/id — cek ID\n/orders — pesanan masuk (seller)\n/help — bantuan\n\nMau tanya apa aja? Ketik aja, aku bantu jawab 😊`);
    return;
  }
  if (text.startsWith('/stop')) {
    const { data: cs } = await sb.from('chat_sessions')
      .select('*').or(`buyer_chat_id.eq.${cid},seller_chat_id.eq.${cid}`).eq('status','active').limit(1);
    const sess = cs && cs[0];
    if (sess) {
      await sb.from('chat_sessions').update({ status:'closed', updated_at:new Date().toISOString() }).eq('id', sess.id);
      const other = String(sess.buyer_chat_id)===String(cid) ? sess.seller_chat_id : sess.buyer_chat_id;
      await send(chatId, '💬 Chat ditutup. Makasih ya 💝');
      if (other) await send(other, '💬 Lawan chat menutup percakapan. Sesi selesai 💝');
    } else {
      await send(chatId, 'Lagi nggak ada chat aktif.');
    }
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

  // ===== RELAY: buyer kirim PASSWORD, atau seller kirim LINK SERVER =====
  if (text && !text.startsWith('/')) {
    // (a) BUYER nunggu kirim password (joki_lepas)
    const { data: apArr } = await sb.from('orders')
      .select('*, listings(title), stores(name, telegram_chat_id)')
      .eq('telegram_user', cid).eq('await_password', true).eq('status', 'confirmed')
      .eq('order_type', 'joki_lepas')
      .order('updated_at', { ascending: false }).limit(1);
    const ap = apArr && apArr[0];
    if (ap) {
      await sb.from('orders').update({ await_password: false, status: 'in_progress' }).eq('order_code', ap.order_code);
      const sc = ap.stores?.telegram_chat_id;
      if (sc) {
        await send(sc, `🔑 <b>Data login masuk — ${ap.order_code}</b>\n• Login via: ${ap.login_via || '-'}\n• User ID/Username: <code>${ap.account_id || '-'}</code>\n• Nickname: ${ap.nickname || '-'}\n\n📩 <b>Data dari pembeli:</b>\n<code>${text}</code>\n\nSilakan kerjakan joki. Kalau kelar, tekan <b>Tandai Selesai</b>.`, doneKb(ap.order_code));
      }
      await send(chatId, `✅ Data login order <code>${ap.order_code}</code> diteruskan ke penjual. Joki segera dikerjakan ya! 💝\n\n🔒 <i>Demi keamanan, hapus pesan password kamu setelah joki selesai.</i>`);
      return;
    }
    // (b) SELLER nunggu kirim link server (item + server_seller)
    const { data: slArr } = await sb.from('stores').select('id, name').eq('telegram_chat_id', cid).limit(1);
    const slStore = slArr && slArr[0];
    if (slStore) {
      const { data: liArr } = await sb.from('orders')
        .select('*, listings(title)').eq('store_id', slStore.id)
        .eq('await_password', true).eq('status', 'confirmed').eq('order_type', 'item')
        .order('updated_at', { ascending: false }).limit(1);
      const li = liArr && liArr[0];
      if (li) {
        await sb.from('orders').update({ await_password: false, status: 'in_progress', server_link: text }).eq('order_code', li.order_code);
        const bt = li.telegram_user;
        if (bt && /^\d+$/.test(String(bt)))
          await send(bt, `🔗 <b>Link/Kode Server dari Penjual</b>\n\nOrder <code>${li.order_code}</code>\n${text}\n\nGabung untuk trading item ya. Setelah barang diterima, transaksi selesai 💝`);
        await send(chatId, `✅ Link server order <code>${li.order_code}</code> diteruskan ke pembeli. Kalau barang sudah diserahkan, tekan <b>Tandai Selesai</b>.`, doneKb(li.order_code));
        return;
      }
    }
    // (c) RELAY CHAT aktif → forward utuh ke lawan, jangan CS AI
    const { data: csArr } = await sb.from('chat_sessions')
      .select('*').or(`buyer_chat_id.eq.${cid},seller_chat_id.eq.${cid}`).eq('status','active')
      .order('updated_at', { ascending: false }).limit(1);
    const sess = csArr && csArr[0];
    if (sess) {
      const isBuyer = String(sess.buyer_chat_id) === String(cid);
      const other = isBuyer ? sess.seller_chat_id : sess.buyer_chat_id;
      const label = isBuyer ? '📩 Pesan dari Pembeli' : '📩 Pesan dari Penjual';
      if (other) {
        await send(other, `${label}:
${text}`);
        await sb.from('chat_sessions').update({ updated_at:new Date().toISOString() }).eq('id', sess.id);
      }
      return;
    }

    // (d) selain itu → CS AI
    await send(chatId, await csReply(text));
  }
}

export const dynamic = 'force-dynamic';

// Upload gambar ke Cloudinary (unsigned). Dipakai semua: foto produk, logo toko, avatar.
const CLOUD = 'duu9uutzz';
const PRESET = 'chiese_unsigned';

export async function uploadImage(file, folder = 'chiese') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', PRESET);
  fd.append('folder', folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST', body: fd,
  });
  if (!res.ok) throw new Error('Upload gagal');
  const data = await res.json();
  return data.secure_url;
}

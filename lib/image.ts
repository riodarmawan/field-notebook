// Mengecilkan gambar di browser sebelum diunggah: sisi terpanjang maksimal 1600 px,
// format WebP. Foto 4 MB biasanya jadi di bawah 300 KB.

const ACCEPTED = /^image\/(jpeg|png|webp|gif|avif)$/; // SVG sengaja ditolak (bisa membawa skrip)

export async function compressImage(file: File, maxSide = 1600, quality = 0.82) {
  if (!ACCEPTED.test(file.type)) throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Image is over 20 MB.");

  // createImageBitmap membaca orientasi EXIF, jadi foto dari HP tidak miring.
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height)); // tidak pernah diperbesar
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser cannot process images.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/webp", quality));
  // Browser lama tanpa dukungan WebP mengembalikan PNG yang besar dan ditolak bucket.
  if (!blob || blob.type !== "image/webp") throw new Error("This browser cannot create WebP images. Try a recent browser.");
  return blob;
}

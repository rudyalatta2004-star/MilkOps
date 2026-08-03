/**
 * Comprime y redimensiona una imagen antes de guardarla en IndexedDB.
 * Reduce el peso de las fotos para no saturar el almacenamiento local
 * ni la futura sincronización a la nube.
 */
export async function comprimirImagen(
  file: File | Blob,
  maxLado = 1024,
  calidad = 0.8,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? (file as Blob)),
      "image/jpeg",
      calidad,
    );
  });
}

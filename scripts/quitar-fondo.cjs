// Elimina el fondo blanco del logo por relleno (flood-fill) desde los bordes,
// preservando el blanco interior (cuerpo de la vaca). Resultado: PNG transparente.
const sharp = require("sharp");
const path = require("path");

const SRC = path.resolve(__dirname, "../public/logo-original.png");
const OUT = path.resolve(__dirname, "../public/logo.png");

(async () => {
  const { data, info } = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const isWhite = (i) =>
    data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235;

  const visited = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) stack.push(x, 0, x, height - 1);
  for (let y = 0; y < height; y++) stack.push(0, y, width - 1, y);

  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const p = y * width + x;
    if (visited[p]) continue;
    visited[p] = 1;
    const i = p * channels;
    if (!isWhite(i)) continue;
    data[i + 3] = 0;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  await sharp(data, { raw: { width, height, channels } }).png().toFile(OUT);
  console.log("Listo:", width + "x" + height);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Genera los iconos de app (favicon + apple) desde public/icono.png (la vaca).
const sharp = require("sharp");
const path = require("path");
const src = path.resolve(__dirname, "../public/icono.png");

(async () => {
  await sharp(src)
    .resize(512, 512)
    .png()
    .toFile(path.resolve(__dirname, "../app/icon.png"));
  await sharp(src)
    .resize(180, 180)
    .png()
    .toFile(path.resolve(__dirname, "../app/apple-icon.png"));
  console.log("iconos generados: app/icon.png, app/apple-icon.png");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

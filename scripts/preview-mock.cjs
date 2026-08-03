// Genera una vista previa (HTML) del Inicio con los logos reales incrustados,
// para mostrar el diseño cuando el panel del navegador no compone imágenes.
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const OUT = process.argv[2];

(async () => {
  const att = await sharp(path.resolve(__dirname, "../public/logo.png"))
    .resize({ width: 360 })
    .png()
    .toBuffer();
  const cow = await sharp(path.resolve(__dirname, "../public/icono.png"))
    .resize({ width: 120 })
    .png()
    .toBuffer();
  const attB64 = `data:image/png;base64,${att.toString("base64")}`;
  const cowB64 = `data:image/png;base64,${cow.toString("base64")}`;

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vista previa — Inicio</title>
<style>
  :root{--bg:#e7e3db;--surface:#fff;--border:#dcd6c9;--primary:#2f9d5f;
    --text:#23271e;--muted:#6f6a5e;--infoSoft:#e0f0f2;--info:#3b95a3;
    --okSoft:#e4f4e8;--ok:#2f9d5f;--warnSoft:#f8edd7;--warn:#c98a2b;}
  *{box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}
  body{margin:0;background:#c9c4b8;padding:24px;display:flex;justify-content:center;}
  .phone{width:390px;background:var(--bg);border-radius:28px;overflow:hidden;
    box-shadow:0 20px 60px rgba(0,0,0,.25);border:1px solid #cfc9b8;}
  header{display:flex;align-items:center;gap:10px;background:#fff;
    padding:12px 16px;border-bottom:1px solid var(--border);}
  header img{width:34px;height:34px;border-radius:9px;object-fit:cover;}
  header .name{font-weight:600;color:var(--text);font-size:17px;flex:1;}
  header .cloud{color:var(--muted);}
  main{padding:20px 16px 12px;}
  .hero{display:flex;justify-content:center;padding:6px 0 18px;}
  .hero img{width:200px;height:auto;}
  .search{display:flex;align-items:center;gap:10px;background:#fff;
    border:1px solid var(--border);border-radius:16px;padding:0 14px;height:60px;
    box-shadow:0 1px 2px rgba(70,60,30,.06);}
  .search .ph{color:#9aa08c;font-size:15px;}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px;}
  .stat{background:#fff;border:1px solid var(--border);border-radius:16px;padding:14px;}
  .chip{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;}
  .stat .num{font-size:26px;font-weight:700;color:var(--text);margin-top:10px;line-height:1;}
  .stat .lbl{font-size:13px;color:var(--muted);margin-top:6px;}
  .card{background:#fff;border:1px solid var(--border);border-radius:18px;padding:18px;margin-top:18px;}
  .card .row{display:flex;align-items:center;gap:10px;}
  .card .row .t{font-weight:600;color:var(--text);}
  .card .row .s{font-size:12px;color:var(--muted);}
  .fields{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;}
  .field label{display:block;font-size:13px;font-weight:500;color:var(--text);margin-bottom:6px;}
  .field .inp{height:46px;border:1px solid var(--border);border-radius:12px;
    display:flex;align-items:center;padding:0 12px;color:var(--text);font-size:14px;background:#fff;}
  .btn{margin-top:14px;height:52px;border-radius:14px;background:var(--primary);color:#fff;
    font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;font-size:16px;}
  nav{display:grid;grid-template-columns:repeat(5,1fr);background:#fff;border-top:1px solid var(--border);}
  nav a{padding:10px 0;text-align:center;font-size:11px;color:var(--muted);text-decoration:none;}
  nav a.active{color:var(--primary);font-weight:600;}
  nav .ico{display:block;margin:0 auto 2px;}
</style></head><body>
<div class="phone">
  <header>
    <img src="${cowB64}" alt="">
    <span class="name">MilkOps</span>
    <svg class="cloud" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.5A3.5 3.5 0 0 0 6 19z"/></svg>
  </header>
  <main>
    <div class="hero"><img src="${attB64}" alt="ATT"></div>
    <div class="search">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2f9d5f" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <span class="ph">Buscar animal por nombre…</span>
    </div>
    <div class="stats">
      <div class="stat"><div class="chip" style="background:var(--okSoft);color:var(--ok)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/></svg></div><div class="num">2</div><div class="lbl">Animales</div></div>
      <div class="stat"><div class="chip" style="background:var(--okSoft);color:var(--ok)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 12 5 5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg></div><div class="num">0</div><div class="lbl">Preñadas</div></div>
      <div class="stat"><div class="chip" style="background:var(--warnSoft);color:var(--warn)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"><circle cx="12" cy="12" r="9"/></svg></div><div class="num">2</div><div class="lbl">Vacías</div></div>
    </div>
    <div class="card" style="padding:0;overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;background:var(--infoSoft);padding:14px 18px">
        <div class="row">
          <div class="chip" style="background:var(--info);color:#fff"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7Z"/></svg></div>
          <div><div class="t" style="color:var(--info)">Litros del día</div><div class="s" style="color:var(--info)">Puedes anotar varias veces</div></div>
        </div>
        <div style="font-size:18px;font-weight:700;color:var(--info)">135 L</div>
      </div>
      <div style="padding:18px">
        <div class="fields" style="margin-top:0">
          <div class="field"><label>Fecha</label><div class="inp">26/07/2026</div></div>
          <div class="field"><label>Litros</label><div class="inp" style="color:#9aa08c">Ej. 120</div></div>
        </div>
        <div class="btn">+ Agregar</div>
      </div>
      <div style="border-top:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:10px;padding:10px 18px;font-size:14px"><span style="color:var(--muted)">Toma 1</span><span style="flex:1;font-weight:600;color:var(--text)">60 L</span></div>
        <div style="display:flex;align-items:center;gap:10px;padding:10px 18px;font-size:14px"><span style="color:var(--muted)">Toma 2</span><span style="flex:1;font-weight:600;color:var(--text)">75 L</span></div>
      </div>
    </div>
  </main>
  <nav>
    <a class="active"><svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>Inicio</a>
    <a><svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7Z"/></svg>Producción</a>
    <a><svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l2 5 4-10 2 5h6"/></svg>Salud</a>
    <a><svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="7.3" x2="12" y2="16.7"/><path d="M14.3 9.2c-.5-.8-1.3-1.3-2.3-1.3-1.3 0-2.3.7-2.3 1.8 0 1 .8 1.5 2.3 1.8 1.5.3 2.3.8 2.3 1.8 0 1.1-1 1.8-2.3 1.8-1 0-1.8-.5-2.3-1.3"/><line x1="12" y1="2.5" x2="12" y2="4.8"/><line x1="12" y1="19.2" x2="12" y2="21.5"/><line x1="2.5" y1="12" x2="4.8" y2="12"/><line x1="19.2" y1="12" x2="21.5" y2="12"/><line x1="5.4" y1="5.4" x2="7" y2="7"/><line x1="17" y1="17" x2="18.6" y2="18.6"/><line x1="18.6" y1="5.4" x2="17" y2="7"/><line x1="7" y1="17" x2="5.4" y2="18.6"/></svg>Finanzas</a>
    <a><svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>Reportes</a>
  </nav>
</div>
</body></html>`;

  fs.writeFileSync(OUT, html, "utf8");
  console.log("HTML escrito:", OUT, "bytes:", html.length);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

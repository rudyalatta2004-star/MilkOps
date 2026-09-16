import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MilkOps — Gestión de ganado lechero",
    short_name: "MilkOps",
    description:
      "Control offline de producción de leche, sanidad y reproducción del hato.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    categories: ["business", "productivity"],
    background_color: "#e7e3db",
    theme_color: "#2f9d5f",
    orientation: "portrait",
    lang: "es",
    icons: [
      {
        src: "/logo-app.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-app.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

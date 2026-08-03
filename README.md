# MilkOps

Aplicación web **offline-first (PWA)** para la gestión de ganado lechero: perfil de cada animal, producción de leche, sanidad, reproducción (con calendario de celo estilo Flo), control financiero y reportes en Excel.

## Características

- **Animales**: ficha con foto, raza, precio, estados productivo y reproductivo; búsqueda global por nombre/arete y por secciones.
- **Producción**: registro de litros por día (admite varias tomas) y medición mensual por animal.
- **Salud**:
  - Sanidad: vacunas, desparasitaciones y tratamientos.
  - Reproducción: celo, inseminación/monta, diagnóstico y parto. Cálculo automático de **meses de gestación** y **fecha probable de parto (FPP = inseminación + 283 días)**.
  - **Calendario de celo**: ciclo estral de 21 días (ventana 18–24) proyectado desde el último celo.
- **Finanzas**: ingresos y gastos por rubro, **liquidez mensual** con semáforo.
- **Reportes**: exportación a **Excel (.xlsx)** con diseño por secciones (Resumen, Animales, Producción, Balance Financiero).
- **Offline-first**: funciona sin internet (IndexedDB) e instalable como PWA. Sincronización opcional con la nube (Supabase).

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- **Dexie.js** (IndexedDB) para almacenamiento local offline
- **Supabase** (PostgreSQL + Auth + Storage) para la nube (opcional)
- **ExcelJS** para los reportes y **Lucide** para los iconos

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Nube (opcional)

Copia `.env.local.example` a `.env.local` y coloca tus claves de Supabase. Ejecuta el script `supabase/schema.sql` en tu proyecto de Supabase. Más detalles en [`supabase/README.md`](supabase/README.md).

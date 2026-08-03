import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para la sincronización con la nube (Fase 6).
 *
 * Se activa solo si están configuradas las variables de entorno. Si no,
 * `supabase` es null y la app funciona 100% local (offline-first) sin
 * ningún error. Así el proyecto es usable antes de conectar la nube.
 *
 * Variables (archivo .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const cloudEnabled = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/** Nombre del bucket de Storage para las fotos de los animales. */
export const BUCKET_FOTOS = "fotos-animales";

-- ============================================================
-- APPVACA — Esquema de la base de datos en Supabase (Fase 6)
-- Monousuario: cada fila pertenece a un usuario (user_id) y la
-- seguridad a nivel de fila (RLS) garantiza que cada cuenta solo
-- ve y modifica sus propios datos.
--
-- Cómo usar: Supabase → SQL Editor → pega todo esto → Run.
-- ============================================================

-- ---------- Tabla: animales ----------
create table if not exists public.animales (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nombre text not null,
  arete text,
  raza text,
  sexo text,
  fecha_nacimiento date,
  estado_productivo text,
  estado_reproductivo text,
  fecha_inseminacion date,
  precio numeric,
  foto_url text,
  observaciones text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Tabla: leche (control semanal) ----------
create table if not exists public.leche (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  animal_id uuid not null,
  fecha date not null,
  litros numeric not null,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Tabla: sanidad ----------
create table if not exists public.sanidad (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  animal_id uuid not null,
  tipo text not null,
  producto text not null,
  fecha date not null,
  dosis text,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Tabla: reproduccion ----------
create table if not exists public.reproduccion (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  animal_id uuid not null,
  tipo text not null,
  fecha date not null,
  reproductor text,
  fpp date,
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Tabla: gastos ----------
create table if not exists public.gastos (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  concepto text not null,
  monto numeric not null,
  categoria text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Tabla: ingresos ----------
create table if not exists public.ingresos (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  concepto text not null,
  monto numeric not null,
  tipo text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Tabla: produccion_diaria ----------
create table if not exists public.produccion_diaria (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha date not null,
  litros numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Tabla: eliminaciones (marcas de borrado) ----------
-- Permite que un borrado hecho en un dispositivo se aplique en los demás.
create table if not exists public.eliminaciones (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tabla text not null,
  registro_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Seguridad a nivel de fila (RLS) ----------
alter table public.animales      enable row level security;
alter table public.leche         enable row level security;
alter table public.sanidad       enable row level security;
alter table public.reproduccion  enable row level security;
alter table public.gastos        enable row level security;
alter table public.ingresos      enable row level security;
alter table public.produccion_diaria enable row level security;
alter table public.eliminaciones enable row level security;

-- Política única por tabla: el usuario solo accede a sus filas.
do $$
declare t text;
begin
  foreach t in array array['animales','leche','sanidad','reproduccion','gastos','ingresos','produccion_diaria','eliminaciones'] loop
    execute format('drop policy if exists "propias" on public.%I;', t);
    execute format(
      'create policy "propias" on public.%I
         for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id);', t);
  end loop;
end $$;

-- ---------- Storage: bucket de fotos ----------
insert into storage.buckets (id, name, public)
values ('fotos-animales', 'fotos-animales', true)
on conflict (id) do nothing;

-- El usuario puede subir/leer/borrar solo sus propias fotos
-- (organizadas en carpetas por user_id: "<user_id>/<archivo>").
drop policy if exists "fotos propias" on storage.objects;
create policy "fotos propias" on storage.objects
  for all
  using (bucket_id = 'fotos-animales' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'fotos-animales' and (storage.foldername(name))[1] = auth.uid()::text);

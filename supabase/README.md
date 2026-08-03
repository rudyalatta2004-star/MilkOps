# Configurar la nube (Supabase) — APPVACA

La app funciona **sin internet y sin nube**. Este paso es opcional y sirve para
**respaldar y sincronizar** tus datos en la nube (RNF-02). Es monousuario: cada
cuenta ve solo sus propios animales.

## Pasos

### 1. Crear el proyecto (una sola vez)
1. Entra a <https://supabase.com> y crea una cuenta gratuita.
2. Crea un **New project**. Elige un nombre y una contraseña de base de datos
   (guárdala). Espera ~2 minutos a que se aprovisione.

### 2. Crear las tablas y la seguridad
1. En el proyecto, ve a **SQL Editor**.
2. Abre el archivo [`schema.sql`](./schema.sql) de esta carpeta, copia **todo**
   su contenido, pégalo en el editor y pulsa **Run**.
   Esto crea las tablas (animales, leche, sanidad, reproduccion), la seguridad
   por usuario (RLS) y el bucket de fotos.

### 3. Obtener las claves
1. Ve a **Project Settings → API**.
2. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Conectar la app
1. En la raíz del proyecto, copia `.env.local.example` como `.env.local`.
2. Pega las dos claves.
3. Reinicia la app (`npm run dev` o `npm run build && npm start`).

### 5. Usar
1. Abre **Cuenta y nube** en la app.
2. Crea tu cuenta (correo + contraseña) e inicia sesión.
3. Pulsa **Sincronizar ahora**. A partir de ahí, la app sincroniza sola cada
   vez que recupera conexión a internet.

## Notas
- Las fotos se suben al bucket `fotos-animales`, en una carpeta por usuario.
- Resolución de conflictos: **la última edición gana** (por fecha de
  modificación).
- Seguridad: con RLS activo, cada usuario solo puede leer/escribir sus datos.

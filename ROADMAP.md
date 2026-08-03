# APPVACA — Plan de Desarrollo por Fases

> **Estado (2026-07-25):** Fases 0–5 COMPLETADAS y verificadas. Registro de leche = semanal. Solo modo claro. Falta Fase 6 (nube, requiere decidir monousuario/multiusuario) y Fase 7 (pulido/despliegue).


> PWA offline-first para gestión de ganado lechero (producción, sanidad, reproducción y reportes).
> Stack: Next.js + PWA + Dexie.js (IndexedDB) + Supabase (PostgreSQL + Storage) + Tailwind CSS + SheetJS.

---

## Resumen de fases

| Fase | Nombre | Objetivo principal | Requisitos que cubre |
|------|--------|--------------------|----------------------|
| 0 | Cimientos | Proyecto, arquitectura de datos y esqueleto de UI | Base para todo |
| 1 | Perfil del animal (local) | CRUD de vacas + búsqueda + foto | RF-01, RNF-04 |
| 2 | Producción lechera | Registro e historial de leche | RF-02 |
| 3 | Sanidad y reproducción | Vacunas + celo/inseminación + cálculos | RF-03, RF-04 |
| 4 | Reportes Excel | Exportación `.xlsx` + resumen ejecutivo | RF-05 |
| 5 | PWA + Offline real | Service Worker, instalable, caché | RNF-01, RNF-03, RNF-05 |
| 6 | Nube + Sincronización | Supabase, auth, sync bidireccional, fotos | RNF-02 |
| 7 | Pulido y despliegue | QA en campo, rendimiento, publicación | Todos |

**Estrategia clave:** construir *local-first* (Fases 1–5) y recién en la Fase 6 conectar la nube. Así la app funciona desde el día 1 sin depender de Supabase, y la sincronización se agrega sobre una base ya estable.

---

## FASE 0 — Cimientos y arquitectura

**Meta:** dejar el proyecto listo para construir features sin frenos.

- [ ] Inicializar Next.js (App Router) + TypeScript + Tailwind CSS.
- [ ] Configurar estructura de carpetas (`/app`, `/components`, `/lib/db`, `/lib/utils`, `/types`).
- [ ] Definir el **modelo de datos** (ver sección "Modelo de datos" abajo). Esto es lo más importante de esta fase.
- [ ] Configurar Dexie.js con las tablas base y versionado de esquema.
- [ ] Definir sistema de diseño: paleta de alto contraste, tamaños de botón grandes (mín. 48px táctil), tipografía legible al sol.
- [ ] Layout base con navegación inferior (tabs) pensada para el pulgar.

**Entregable:** app que arranca, con navegación vacía y base de datos local vacía pero funcional.

---

## FASE 1 — Perfil del animal (RF-01)

**Meta:** poder registrar, buscar y ver vacas 100% en local.

- [ ] Formulario de alta/edición de vaca: Nombre, ID/Arete, Raza, Estado productivo (en ordeño / seca).
- [ ] Captura de fotografía: `<input type="file" accept="image/*" capture="environment">` (cámara) + opción galería.
- [ ] Guardar la foto como Blob en IndexedDB (aún sin nube).
- [ ] **RF-01.1** Buscador por nombre con autocompletado en tiempo real (filtrado local mientras se escribe).
- [ ] **RF-01.2** Ficha/perfil del animal con foto + datos básicos.
- [ ] Listado general de animales (grilla con foto y nombre grande).

**Entregable:** puedes dar de alta vacas, buscarlas por nombre y ver su ficha con foto. Ya es usable.

---

## FASE 2 — Control de producción lechera (RF-02)

**Meta:** registrar e histórico de leche.

- [ ] **RF-02.1** Registro diario de litros por vaca, desglosado en ordeño de **mañana** y **tarde**.
- [ ] Validaciones (litros positivos, un registro por turno/día editable).
- [ ] **RF-02.2** Historial de producción: vistas de acumulado **diario, semanal y mensual** por animal.
- [ ] Gráfico simple de tendencia (opcional pero muy útil en campo).

**Entregable:** control diario de leche con historiales consultables.

---

## FASE 3 — Sanidad y reproducción (RF-03, RF-04)

**Meta:** trazabilidad sanitaria y reproductiva con cálculos automáticos.

**Sanidad (RF-03):**
- [ ] **RF-03.1** Registro de vacunas/desparasitaciones/tratamientos: producto, fecha, dosis.
- [ ] Historial sanitario por vaca (orden cronológico).

**Reproducción (RF-04):**
- [ ] **RF-04.1** Registro de fechas de celo e inseminación/monta.
- [ ] **RF-04.2** Estado reproductivo visible: `Preñada` / `Inseminada` / `Vacía`.
- [ ] **RF-04.3** Cálculo de meses de gestación (cuando está `Preñada`).
- [ ] **RF-04.4** Cálculo automático de FPP = fecha de inseminación + 283 días.
- [ ] Indicadores visuales (colores/badges) del estado reproductivo en la ficha y el listado.

**Entregable:** ficha completa del animal con toda su vida productiva, sanitaria y reproductiva.

---

## FASE 4 — Reportes y exportación Excel (RF-05)

**Meta:** exportar la información consolidada.

- [ ] **RF-05.1** Generar y descargar `.xlsx` con SheetJS (todo en el navegador, sin servidor):
      ID/Arete, Nombre, Raza, Estado productivo, Litros/día, Estado reproductivo, meses de gestación (si preñada), última inseminación/celo, FPP, última vacuna, observaciones.
- [ ] **RF-05.2** Pestaña de **resumen ejecutivo**: total litros, promedio por vaca, total preñadas/vacías.
- [ ] Botón de descarga accesible desde la vista de reportes.

**Entregable:** reporte Excel descargable con detalle + resumen.

---

## FASE 5 — PWA y Offline real (RNF-01, RNF-03, RNF-05)

**Meta:** que sea instalable y funcione sin señal.

- [ ] `manifest.json` (nombre, iconos, colores, `display: standalone`).
- [ ] Service Worker con Workbox (`next-pwa` o configuración manual).
- [ ] Estrategias de caché: app shell + assets (RNF-05, respuesta < 1s).
- [ ] **RNF-01** Verificar que todo lo de Fases 1–4 funciona sin internet (los datos ya viven en IndexedDB).
- [ ] **RNF-03** Prueba de instalación en Android, iOS y PC desde el navegador.
- [ ] Indicador visual de estado de conexión (online/offline).

**Entregable:** app instalable en el teléfono, funcional en el campo sin datos.

> Nota: si en la Fase 1 ya construiste todo sobre Dexie, el offline "de datos" ya funciona. Esta fase suma el *shell instalable* y la caché de recursos.

---

## FASE 6 — Nube y sincronización (RNF-02)

**Meta:** respaldo en la nube y sync automática. La fase técnicamente más delicada.

- [ ] Crear proyecto Supabase: tablas PostgreSQL espejo del modelo local, RLS (Row Level Security).
- [ ] Autenticación de usuarios (Supabase Auth).
- [ ] **RNF-02** Motor de sincronización:
      - Marcar cada registro local con `syncStatus` (pending/synced) y `updatedAt`.
      - Cola de cambios pendientes (outbox).
      - Al recuperar conexión: subir pendientes → bajar novedades.
      - Estrategia de resolución de conflictos (definir: "última escritura gana" u otra).
- [ ] Subida de **fotografías** a Supabase Storage cuando hay conexión (reemplazar/complementar el Blob local).
- [ ] Detección de reconexión (evento `online`) para disparar sync.

**Entregable:** datos y fotos respaldados en la nube, sincronización automática al reconectar.

> Decisión de diseño pendiente: ¿app monousuario (un ganadero) o multiusuario (varios peones + dueño compartiendo hato)? Esto cambia el diseño de RLS y sincronización. **Conviene decidirlo antes de la Fase 6.**

---

## FASE 7 — Pulido, QA y despliegue

- [ ] Pruebas reales en campo (dispositivo real, con sol, guantes, sin señal).
- [ ] Optimización de rendimiento y tamaño de imágenes (comprimir fotos antes de guardar).
- [ ] Manejo de errores y estados vacíos amigables.
- [ ] Despliegue (Vercel para el frontend + Supabase ya en la nube).
- [ ] Documentación de uso para el ganadero.

---

## Modelo de datos (borrador inicial)

```
Animal
  id (uuid)         nombre        arete/ID
  raza              estadoProductivo (ordeño|seca)
  fotoBlob/fotoUrl  estadoReproductivo (preñada|inseminada|vacia)
  createdAt  updatedAt  syncStatus

RegistroLeche
  id  animalId  fecha  turno (mañana|tarde)  litros
  updatedAt  syncStatus

RegistroSanitario
  id  animalId  tipo (vacuna|desparasitacion|tratamiento)
  producto  fecha  dosis  observaciones
  updatedAt  syncStatus

EventoReproductivo
  id  animalId  tipo (celo|inseminacion|monta|parto)
  fecha  fpp (calculada)  observaciones
  updatedAt  syncStatus
```

---

## Decisiones a confirmar antes de empezar

1. **¿Monousuario o multiusuario?** (afecta auth y sincronización — Fase 6).
2. **Idioma/región de fechas** (formato de fecha, zona horaria para FPP).
3. **¿La foto es obligatoria** al crear la vaca o puede quedar pendiente?
4. **Unidad y turnos de ordeño:** ¿siempre mañana/tarde o puede haber un 3er ordeño?
```

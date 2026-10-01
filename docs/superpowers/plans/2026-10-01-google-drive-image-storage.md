# Google Drive Image Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alojar automaticamente en Google Drive todas las fotografias de IKA, servirlas con permisos correctos y migrar las existentes sin interrupciones.

**Architecture:** El servidor mantendra una conexion OAuth cifrada, optimizara imagenes y las subira a la jerarquia `IKA Web Media`. Una tabla de activos relacionara cada archivo con su ID de Drive y dos lectores separados serviran contenido publico cacheable y perfiles privados autenticados. La migracion sera idempotente y no retirara ningun original hasta superar la verificacion.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase/PostgreSQL, Google Drive REST API v3, OAuth 2.0, Sharp, Vercel.

---

### Task 1: Modelo privado de Drive

**Files:**
- Create: `supabase/migrations/202610010001_google_drive_media.sql`
- Modify: `lib/supabase/database.types.ts` if generated types are present

- [ ] Crear `google_drive_connections` con token cifrado, cuenta, carpeta raiz y mapa de subcarpetas; habilitar RLS sin politicas publicas.
- [ ] Crear `drive_media_assets` con `drive_file_id`, categoria, visibilidad, miembro propietario, MIME, dimensiones, origen, estado de migracion y error.
- [ ] Crear indices por archivo, origen, estado y propietario.
- [ ] Aplicar la migracion remota y verificar tablas y politicas.

### Task 2: OAuth cifrado y cliente Drive

**Files:**
- Create: `lib/google-drive/crypto.ts`
- Create: `lib/google-drive/crypto.test.mjs`
- Create: `lib/google-drive/oauth.ts`
- Create: `lib/google-drive/client.ts`
- Create: `app/api/admin/google-drive/connect/route.ts`
- Create: `app/api/admin/google-drive/callback/route.ts`
- Create: `app/api/admin/google-drive/status/route.ts`
- Modify: `.env.example`

- [ ] Escribir pruebas en rojo para cifrado autenticado, descifrado y rechazo con clave incorrecta.
- [ ] Implementar AES-256-GCM usando `GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY`.
- [ ] Implementar generacion de URL OAuth, state firmado, intercambio de codigo y renovacion de access token.
- [ ] Crear o localizar las carpetas con IDs ya creados y guardar la conexion cifrada.
- [ ] Exponer estado sin devolver secretos y exigir super admin con PIN para conectar.

### Task 3: Optimizacion, subida y lectura

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `lib/google-drive/image-processing.ts`
- Create: `lib/google-drive/media.ts`
- Create: `app/api/admin/media/upload/route.ts`
- Create: `app/api/media/public/[assetId]/route.ts`
- Create: `app/api/media/private/[assetId]/route.ts`

- [ ] Instalar `sharp` como dependencia explicita.
- [ ] Probar e implementar validacion, correccion EXIF, WebP, limite 1920 px publico y 1200 px privado.
- [ ] Subir mediante multipart a Drive y registrar el activo solo tras respuesta correcta.
- [ ] Servir activos publicos con cache CDN e ETag.
- [ ] Servir perfiles privados solo al miembro propietario o administradores autorizados, con `private, no-store`.

### Task 4: Panel de conexion y migracion

**Files:**
- Create: `components/admin/google-drive-admin.tsx`
- Modify: `components/admin/admin-panel.tsx`
- Create: `app/api/admin/google-drive/migration/route.ts`
- Create: `lib/google-drive/migration.ts`

- [ ] Mostrar estado, cuenta, carpeta y boton de conexion/reconexion.
- [ ] Mostrar contadores `pending`, `copied`, `verified`, `switched` y `failed`.
- [ ] Implementar lotes reanudables con identificador de origen para impedir duplicados.
- [ ] Mantener el origen actual cuando una copia o verificacion falle.
- [ ] Registrar conexion, inicio, reintento y resultado en auditoria.

### Task 5: Sustituir todas las cargas dinamicas

**Files:**
- Modify: `components/admin/news-admin.tsx`
- Modify: `components/admin/events-admin.tsx`
- Modify: `components/admin/pages-admin.tsx`
- Modify: `components/admin/locations-admin.tsx`
- Modify: `components/admin/official-instructors-admin.tsx`
- Modify: `components/admin/settings-admin.tsx`
- Modify: `app/api/admin/members/route.ts`
- Modify: `app/api/portal/me/route.ts`

- [ ] Reemplazar cargas a `public-media` por `/api/admin/media/upload` con categoria correcta.
- [ ] Reemplazar cargas de perfil por la variante privada asociada al miembro.
- [ ] Guardar URLs estables `/api/media/public/<assetId>` o `/api/media/private/<assetId>`.
- [ ] Comprobar que un fallo de Drive no altera la imagen anterior.

### Task 6: Migrar imagenes actuales

**Files:**
- Create: `scripts/migrate-images-to-drive.mjs`
- Create: `app/images/[...path]/route.ts`
- Modify: referencias de contenido que contengan rutas locales cuando sea necesario

- [ ] Inventariar URLs de base de datos, objetos de Supabase Storage y fotografias locales.
- [ ] Copiar y optimizar cada imagen conservando `source_key` unico.
- [ ] Verificar bytes, MIME y lectura de cada destino.
- [ ] Actualizar referencias de base de datos dentro de una fase `switched` recuperable.
- [ ] Servir rutas historicas `/images/...` desde el mapa de Drive.
- [ ] Generar informe de totales y fallos antes de retirar originales.

### Task 7: Verificacion y retirada segura

**Files:**
- Verify: todos los archivos anteriores
- Modify/Delete: fotografias migradas de `public/images` solo tras verificacion de produccion

- [ ] Ejecutar pruebas unitarias, typecheck, lint dirigido y build.
- [ ] Verificar visualmente cada superficie publica y privada en escritorio, tablet y movil.
- [ ] Confirmar que los recuentos de origen y Drive coinciden y que no hay referencias rotas.
- [ ] Publicar la fase de lectura y carga sin borrar originales.
- [ ] Tras la comprobacion de produccion, retirar objetos de Supabase y fotografias locales migradas, conservando inventario recuperable.

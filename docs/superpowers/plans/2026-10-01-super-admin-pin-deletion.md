# Super Admin PIN Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir eliminar perfiles PIN duplicados desde el panel de super admin sin poder borrar la identidad actual ni el ultimo administrador activo.

**Architecture:** Una funcion pura validara las reglas de seguridad y tendra pruebas de regresion con el runner nativo de Node. La ruta existente distinguira entre cerrar sesion y eliminar un perfil mediante `directorId`; la interfaz incorporara una accion de papelera, confirmacion y mensajes localizados.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase, Tailwind CSS, Node test runner.

---

### Task 1: Reglas de seguridad comprobables

**Files:**
- Create: `lib/admin/director-deletion.ts`
- Create: `lib/admin/director-deletion.test.mjs`

- [x] **Step 1: Escribir pruebas que fallen**

Probar que `validateDirectorDeletion` rechaza el identificador vacio, la identidad actual y el ultimo perfil activo, y acepta otro perfil cuando queda al menos un administrador activo.

- [x] **Step 2: Ejecutar las pruebas en rojo**

Run: `node --experimental-strip-types --test lib/admin/director-deletion.test.mjs`
Expected: FAIL porque el modulo aun no existe.

- [x] **Step 3: Implementar la validacion minima**

Crear `validateDirectorDeletion({ targetId, currentDirectorId, targetIsActive, activeDirectorCount })`, que devuelva un mensaje de error localizado en servidor o `null` cuando el borrado sea valido.

- [x] **Step 4: Ejecutar las pruebas en verde**

Run: `node --experimental-strip-types --test lib/admin/director-deletion.test.mjs`
Expected: cuatro pruebas aprobadas y cero fallos.

### Task 2: Operacion de borrado y auditoria

**Files:**
- Modify: `app/api/admin/director-pin/route.ts`

- [x] **Step 1: Mantener el cierre de identidad existente**

Si `DELETE` no recibe `directorId`, revocar el token actual y devolver `{ ok: true }` como hasta ahora.

- [x] **Step 2: Validar el borrado solicitado**

Con `directorId`, exigir rol super admin e identidad PIN validada; cargar el perfil objetivo y contar los perfiles activos antes de llamar a `validateDirectorDeletion`.

- [x] **Step 3: Registrar y eliminar**

Escribir `director_pin.delete` con nombre e identificador objetivo en metadatos, eliminar el perfil y devolver `{ ok: true, directorId }`. Las sesiones se eliminaran por cascada y la auditoria conservara su fila mediante `set null`.

### Task 3: Interfaz, confirmacion e idiomas

**Files:**
- Modify: `components/admin/admin-panel.tsx`

- [x] **Step 1: Conectar la accion**

Crear `deleteDirector`, enviar `DELETE /api/admin/director-pin?directorId=<id>`, mostrar el resultado y recargar perfiles.

- [x] **Step 2: Anadir el boton de papelera**

Usar el icono `Trash2`, deshabilitarlo para `scope.director.id` y pedir confirmacion con el nombre del perfil.

- [x] **Step 3: Traducir textos**

Definir eliminar, confirmacion, exito, error y proteccion de identidad actual para `en`, `es`, `it`, `fr`, `ja`, `zh`, `cs`, `id`, `ms`, `eu`, `pt` y `de`.

### Task 4: Verificacion y produccion

**Files:**
- Verify: `app/api/admin/director-pin/route.ts`
- Verify: `components/admin/admin-panel.tsx`
- Verify: `lib/admin/director-deletion.ts`
- Verify: `lib/admin/director-deletion.test.mjs`

- [x] **Step 1: Ejecutar prueba, tipos y lint dirigido**

Run: `node --experimental-strip-types --test lib/admin/director-deletion.test.mjs`
Expected: cero fallos.

Run: `npm.cmd run typecheck`
Expected: exit code 0.

Run: `npx.cmd eslint app/api/admin/director-pin/route.ts components/admin/admin-panel.tsx lib/admin/director-deletion.ts lib/admin/director-deletion.test.mjs`
Expected: exit code 0.

- [x] **Step 2: Compilar produccion**

Run: `npm.cmd run build`
Expected: exit code 0 y todas las paginas generadas.

- [x] **Step 3: Publicar**

Revisar `git diff --check`, crear un commit limitado a estos archivos y enviar `main` a `origin` para activar Vercel.

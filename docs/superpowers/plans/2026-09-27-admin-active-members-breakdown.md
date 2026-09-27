# Admin Active Members Breakdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar en la cabecera administrativa el total global de miembros activos desglosado en adultos y ninos, traducido en todos los idiomas disponibles.

**Architecture:** La ruta `/api/admin/scope` realizara tres conteos paralelos sobre `members`: total activo, adultos activos y ninos activos. `AdminPanel` ampliara su contrato `AdminSummary` y mostrara los dos subtotales dentro de la metrica actual, con un contenedor flexible para pantallas estrechas.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase, Tailwind CSS, Node test runner.

---

### Task 1: Ampliar el contrato del resumen

**Files:**
- Modify: `app/api/admin/scope/route.ts`
- Modify: `components/admin/admin-panel.tsx`

- [x] **Step 1: Incorporar los conteos de grupos en la API**

Anadir a `Promise.all` dos consultas con `status = active`, filtradas respectivamente por `member_group = adult` y `member_group = child`.

- [x] **Step 2: Exponer los nuevos campos**

Devolver `activeAdults` y `activeChildren` dentro de `summary` y anadir ambos numeros a `AdminSummary`.

- [x] **Step 3: Ejecutar la comprobacion de tipos**

Run: `npm.cmd run typecheck`
Expected: exit code 0.

### Task 2: Mostrar el desglose responsive y traducido

**Files:**
- Modify: `components/admin/admin-panel.tsx`

- [x] **Step 1: Ampliar el contrato de textos**

Anadir `summaryAdults` y `summaryChildren` a `AdminPanelCopy`.

- [x] **Step 2: Anadir las traducciones explicitas**

Definir las dos etiquetas para `en`, `es`, `it`, `fr`, `ja`, `zh`, `cs`, `id`, `ms`, `eu`, `pt` y `de`.

- [x] **Step 3: Componer la metrica**

Mantener `AdminSummaryItem` para la metrica total y pasarle un detalle flexible que muestre, en este orden, adultos y ninos con sus numeros correspondientes.

- [x] **Step 4: Verificar la adaptacion**

Comprobar que el bloque usa `flex-wrap`, conserva la rejilla de tres metricas en escritorio y permite saltos de linea sin solapamiento en movil y tablet.

### Task 3: Verificacion y publicacion

**Files:**
- Test: `app/api/admin/scope/route.ts`
- Test: `components/admin/admin-panel.tsx`

- [x] **Step 1: Ejecutar lint y tipos**

Run: `npm.cmd run lint -- app/api/admin/scope/route.ts components/admin/admin-panel.tsx`
Expected: exit code 0.

Run: `npm.cmd run typecheck`
Expected: exit code 0.

- [x] **Step 2: Compilar produccion**

Run: `npm.cmd run build`
Expected: compilacion y generacion de paginas con exit code 0.

- [x] **Step 3: Revisar el diff**

Run: `git diff --check`
Expected: sin errores de espacios ni conflictos.

- [ ] **Step 4: Publicar**

Crear un commit limitado a estos archivos y enviar `main` a `origin` para activar el despliegue de Vercel.

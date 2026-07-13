# Pendientes — USAER 7607

> Próximo objetivo: Items de media prioridad — APIs a URLSearchParams y dead code cleanup.
> Tests: 321 ✅ | 0 ❌ | 40 test files
> Build: 0 errores TypeScript

## ✅ Alta Prioridad — Resuelto

| # | Item | Fix |
|---|------|-----|
| 1 | Tests Kiosco rotos | `getByLabelText` → `getAllByLabelText()[0]` |
| 2 | Dashboard test roto | `getByText('Distribución por Condición')` → `getByText('Distribución')` + `getByText('Por condición')` |
| 3 | RACStudentTimeline sin test | Test creado con 7 tests: loading, empty, timeline render, navegación, N/A |
| 4 | CalendarView sin test | Cubierto por SchoolCalendar.test.tsx (17 tests de integración) |

## 🟡 Media Prioridad

## 🟡 Media Prioridad

### 5. 7 APIs usan string concatenation insegura para query params
**Archivos**: `notificaciones.ts`, `calendar.ts`, `rac.ts`, `rae.ts`, `usuarios.ts`, `escuelas.ts`, `alumnos.ts`
**Problema**: Todas construyen URLs como `` `/recurso/?page=${page}&search=${encodeURIComponent(search)}` `` en vez de usar `URLSearchParams` o el `params` de axios.
**Riesgo**: Bajo (ya usan `encodeURIComponent` en search), pero es inconsistente con `oficios.ts` (única API que usa `URLSearchParams`) y `asistencia.ts`/`avisos.ts`/`permisos.ts`/`incidencias.ts` (usan `axios.params`).
**Fix**: Unificar a `URLSearchParams` (7 APIs, ~2-3 líneas cada una).
**Esfuerzo**: Medio (~30 min).

### 6. Dependencias muertas: react-dnd + react-dnd-html5-backend + concurrently
**Archivos**: `frontend/package.json`
**Problema**: `react-dnd` y `react-dnd-html5-backend` no se importan en ningún lado del código fuente. `concurrently` (devDep) tampoco se usa en scripts.
**Fix**: `npm uninstall react-dnd react-dnd-html5-backend concurrently`
**Esfuerzo**: Bajo (~5 min + verificar build).

### 7. Kiosco responsive — dos botones submit con mismo aria-label
**Archivo**: `frontend/src/pages/asistencia/Kiosco.tsx`
**Problema**: El botón submit desktop (`hidden sm:block`) y mobile (`sm:hidden`) tienen el mismo `aria-label="Checar asistencia"`. Confuso para screen readers y rompe tests.
**Fix**: El botón mobile debería tener `aria-label="Checar asistencia (móvil)"` o mejor, ocultar el desktop del árbol de accesibilidad cuando no corresponde.
**Esfuerzo**: Bajo (~10 min, relacionado con ítem 1).

## 🟢 Baja Prioridad / Futuro

### 8. Virtualización de listas
Evaluar `@tanstack/react-virtual` para RAECaptureGrid y DataTable cuando hay 100+ alumnos.
**Trigger**: Cuando alguien reporte lentitud con listas grandes.

### 9. Dashboard con datos reales en staging
Conectar dashboard a datos reales en staging. Verificar:
- `get_rae_progress()` devuelve datos correctos
- `get_asistencia_trend()` devuelve tendencia semanal
- Filtro por escuela funciona

### 10. Migración total a URLSearchParams + axios.params
Una vez hecho el ítem 5, consolidar el patrón en **todas** las APIs. Decisión de diseño:
- **Opción A**: `URLSearchParams` (explícito, more verbose) — `oficios.ts` como referencia.
- **Opción B**: `axios.params` (más limpio, auto-encoding) — `asistencia.ts`, `avisos.ts`, `permisos.ts` como referencia.
Elegir una y migrar todas.

### 11. Auth: Token vs JWT
`client.ts` usa esquema `Token` (DRF token auth), no `Bearer JWT`. Sin refresh token. Si se implementa expiración de sesión real, va a hacer falta refresh interceptor.

### 12. Páginas con header manual (baja, evaluada)
RAECaptureGrid, RACForm, RACStudentTimeline, Dashboard — tienen headers complejos que no encajan en PageHeader genérico. Decisión conciente: dejarlas como están.

## Historial de Commits Recientes

| Commit | Descripción |
|---|---|
| `1ad1b07` | Unificar 4 APIs a named functions + fixes visual audit |
| `215b577` | Unificar frontend con PageHeader + FilterCard + skeletons |

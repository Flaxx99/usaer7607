# Pendientes — USAER 7607

> Próximo objetivo: Dashboard con datos reales en staging.
> Tests: 321 ✅ | 0 ❌ | 40 test files
> Build: 0 errores TypeScript

## ✅ Resuelto

| # | Prioridad | Item |
|---|-----------|------|
| 1 | 🔴 | Tests Kiosco rotos — `getByLabelText` → `getAllByLabelText()[0]` |
| 2 | 🔴 | Dashboard test roto — texto "Distribución por Condición" nunca existió como un solo nodo |
| 3 | 🔴 | RACStudentTimeline — test creado con 7 tests |
| 4 | 🔴 | CalendarView — cubierto por SchoolCalendar (17 tests de integración) |
| 5 | 🟡 | **7 APIs** convertidas de string concat a `axios.params` (unificado con el resto) |
| 6 | 🟡 | **Dead code**: `react-dnd`, `react-dnd-html5-backend`, `concurrently` eliminados |
| 7 | 🟡 | **Kiosco a11y**: `aria-label` duplicado removido del botón mobile (tiene texto visible) |
| 10 | 🟢 | **TODAS las APIs** unificadas a `axios.params` — 15 APIs, mismo patrón |

## 🟢 Baja Prioridad / Futuro

## 🟢 Baja Prioridad / Futuro

### 8. Virtualización de listas
Evaluar `@tanstack/react-virtual` para RAECaptureGrid y DataTable cuando hay 100+ alumnos.
**Trigger**: Cuando alguien reporte lentitud con listas grandes.

### 9. Dashboard con datos reales en staging
Conectar dashboard a datos reales en staging. Verificar:
- `get_rae_progress()` devuelve datos correctos
- `get_asistencia_trend()` devuelve tendencia semanal
- Filtro por escuela funciona

### 10. Auth: Token vs JWT
`client.ts` usa esquema `Token` (DRF token auth), no `Bearer JWT`. Sin refresh token. Si se implementa expiración de sesión real, va a hacer falta refresh interceptor.

### 11. Páginas con header manual (baja, evaluada)
RAECaptureGrid, RACForm, RACStudentTimeline, Dashboard — tienen headers complejos que no encajan en PageHeader genérico. Decisión conciente: dejarlas como están.

## Historial de Commits Recientes

| Commit | Descripción |
|---|---|
| `3b24f1d` | Fix tests Kiosco + Dashboard + RACStudentTimeline test |
| `1ad1b07` | Unificar 4 APIs a named functions + fixes visual audit |
| `215b577` | Unificar frontend con PageHeader + FilterCard + skeletons |

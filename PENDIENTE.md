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

### 8. Virtualización de listas (evaluada — no requiere cambios)
RAECaptureGrid tiene 30-60 alumnos por escuela con filtros; DataTable ya usa TanStack Table con `getPaginationRowModel` (10 por página). No hay beneficio real con virtualización hoy.
**Trigger**: Cuando alguien reporte lentitud con 200+ alumnos.

### 9. Dashboard con datos reales en staging (backend verificado)
- `build_dashboard_data()` con 12 sub-funciones independientes (cada una con try/except)
- 27 tests backend OK, endpoint `/usuarios/dashboard-data/` listo
- Frontend maneja loading, error (con retry), empty states
- Pendiente de deploy a staging para probar con datos reales

### 10. ~~Auth: Token vs JWT~~ ✅ **RESUELTO**
Migrado a `djangorestframework-simplejwt`:
- Access token: 30 min | Refresh token: 7 días
- `Bearer` scheme en vez de `Token`
- Interceptor 401 → refresh automático (con queue de requests concurrentes)
- Backend: blacklist de refresh tokens en logout
- Frontend: logout llama al backend con refresh token

### 11. Páginas con header manual (baja, evaluada)
RAECaptureGrid, RACForm, RACStudentTimeline, Dashboard — tienen headers complejos que no encajan en PageHeader genérico. Decisión conciente: dejarlas como están.

## Historial de Commits Recientes

| Commit | Descripción |
|---|---|
| `8bb0009` | Migrar de DRF Token a JWT con auto-refresh interceptor |
| `54681b4` | Unificar 15 APIs a axios.params + dead code + Kiosco a11y |
| `3b24f1d` | Fix tests Kiosco + Dashboard + RACStudentTimeline test |

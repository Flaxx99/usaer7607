# Changelog

## [Unreleased]

### Added
- **Bloqueo optimista RAE**: campo `version` en `RegistroRAE` para detección de colisiones.
  - `RAEInitCaptureView` devuelve la versión actual del registro.
  - `RAEBulkSaveView` valida la versión (409 Conflict si fue modificado por otro usuario) e incrementa al guardar.
  - Frontend envía `version` en el payload y muestra toast específico en caso de conflicto.

- **Exportaciones RAE a Excel**:
  - `ExportRAEView`: llena la plantilla oficial (`rae_template.xlsx`) con datos de escuela, docentes, conteos por género/condición, y listado completo de alumnos.
  - `ExportAllRAEView`: genera un Excel consolidado de todas las escuelas del ciclo activo.

- **Gestión de registros RAE**:
  - `RAECerrarView`: endpoint POST para cerrar/reabrir un registro.
  - `RAEProgressView`: endpoint GET con progreso de captura por escuela (% completado).

### Changed
- `BulkRAESaveSerializer` ahora requiere el campo `version` (IntegerField, obligatorio).
- `RAEInitResponse` (Pydantic DTO + TypeScript) ahora incluye `version: int`.
- `raeApi.saveBulk` acepta `version: number` en el payload.

### Fixed
- Reconstruidas vistas faltantes en `usaer_system/rae/views.py` que se habían perdido durante una reescritura previa del archivo.

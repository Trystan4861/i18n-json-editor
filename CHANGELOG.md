# Change Log

All notable changes to the "ei18n-json-editor" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [v1.0.5]

### Fixed
- Improved i18n folder detection to find any i18n folder in the project structure
- Enhanced recursive directory scanning to detect i18n folders at any level
- Fixed issue where existing i18n folders were not being detected properly
- Added detailed logging for better troubleshooting of folder detection issues
- Optimized workspace folder configuration to automatically include found i18n directories
- Fixed issue with duplicate i18n folders appearing in configuration
- Normalized path formats to ensure consistent use of forward slashes
- Preserved folder configuration when removing duplicates

## [v1.0.4]

### Fixed
- Fixed the error "There is no registered data provider that can provide view data" that occurred in the compiled extension
- Improved integration with the activity bar to ensure compatibility in the compiled version
- Optimized extension initialization to ensure all entry points work correctly
- Reinforced extension activation through multiple activation events

## [v1.0.3]

### Added
- Menú contextual para columnas de idioma con opciones avanzadas
- Función para ordenar traducciones alfabéticamente (ascendente/descendente) por idioma
- Opción para ocultar columnas de idioma directamente desde el encabezado
- Función para eliminar archivos de idioma con confirmación doble

### Changed
- Mejorado el sistema de gestión de visibilidad de columnas
- Optimizado el manejo de la configuración para evitar problemas de caché

### Fixed
- Corregidos problemas con la actualización de la interfaz al cambiar la visibilidad de columnas
- Mejorado el manejo de errores en operaciones de archivo

## [v1.0.2]

### Changed
- Reemplazados modales personalizados por SweetAlert2 para diálogos de confirmación
- Mejorada la experiencia de usuario en diálogos de selección múltiple
- Añadidos estilos personalizados para integrar SweetAlert2 con el tema de VSCode

## [v1.0.1]

### Added
- Soporte para múltiples carpetas de trabajo
- Selector de carpetas de trabajo en la interfaz
- Control de cambios sin guardar al cambiar entre carpetas

### Fixed
- Reemplazados diálogos modales nativos por personalizados para evitar restricciones del sandbox
- Unificado el sistema de notificaciones para evitar mensajes duplicados
- Corregido el manejo de confirmaciones al descartar cambios

## [v1.0.0]

### Added
- Botón lateral para abrir el editor de traducciones
- Función para encontrar las siguientes traducciones faltantes
- Opción para añadir un nuevo idioma
- Soporte para idiomas RTL (derecha a izquierda)
- Función para mostrar/ocultar idiomas en la interfaz del editor
- Interfaz de traducción para el propio editor
- Botones de recarga para actualizar el contenido
- Advertencia de cambios no guardados

### Changed
- Refactorización del código para mejorar la estructura
- Modificaciones en package.json
- Se movió la configuración a la carpeta .vscode

### Fixed
- Corrección del botón lateral
- Solo una instancia del editor puede estar abierta a la vez
- Corrección para mantener idiomas ocultos previamente eliminados
- Corrección de mensajes de error
- Corrección para limpiar la barra de búsqueda
- Corrección de problemas de interfaz
- Corrección del botón de la barra de estado

### Initial release
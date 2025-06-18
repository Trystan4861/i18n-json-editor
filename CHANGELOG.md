# Change Log

All notable changes to the "ei18n-json-editor" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [v1.0.6]

### Changed
- Refactorizado código redundante en varios archivos
- Mejorada la estructura de métodos para evitar duplicación
- Optimizado el manejo de traducciones vacías
- Simplificada la lógica de carga de archivos

### Fixed
- Corregido problema de duplicación en el método de filtrado de traducciones
- Mejorado el rendimiento en la búsqueda de traducciones vacías
- Unificada la validación de traducciones vacías

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
- Context menu for language columns with advanced options
-  Function to sort translations alphabetically (ascending/descending) by language
- Option to hide language columns directly from the header
- Function to delete language files with double confirmation

### Changed
- Improved column visibility management system
- Optimized configuration handling to avoid cache issues

### Fixed
- Fixed issues with UI updates when changing column visibility
- Improved error handling in file operations

## [v1.0.2]

### Changed
- Replaced custom modals with SweetAlert2 for confirmation dialogs
- Improved user experience in multi-selection dialogs
- Added custom styles to integrate SweetAlert2 with the VSCode theme

## [v1.0.1]

### Added
- Support for multiple workspaces
- Workspace folder selector in the interface
- Unsaved changes control when switching between folders

### Fixed
- Replaced native modal dialogs with custom ones to avoid sandbox restrictions
- Unified notification system to avoid duplicate messages
- Fixed confirmation handling when discarding changes

## [v1.0.0]

### Added
- Side button to open the translation editor
- Function to find the next missing translations
- Option to add a new language
- Support for RTL (right-to-left) languages
- Function to show/hide languages in the editor interface
- Translation interface for the editor itself
- Reload buttons to refresh content
- Unsaved changes warning

### Changed

- Code refactoring to improve structure
- Modifications in package.json
- Configuration moved to the .vscode folder

### Fixed
- Fixed the side button
- Only one instance of the editor can be open at a time
- Fix to keep previously hidden languages removed
- Error message correction
- Fix to clear the search bar
- UI issues fixed
- Fixed the status bar button

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
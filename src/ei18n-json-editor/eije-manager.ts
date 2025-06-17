import * as vscode from 'vscode';
import * as _path from 'path';
import { EIJEFileSystem } from './services/eije-filesystem';

import { EIJEConfiguration } from './eije-configuration';
import { EIJEData } from './eije-data';
import { EIJEDataTranslation } from './models/eije-data-translation';
import { I18nService } from '../i18n/i18n-service';
import { NotificationService } from './services/notification-service';

export class EIJEManager {
    get isWorkspace() {
        return this.folderPath === null;
    }
    private _data: EIJEData;

    // Mantener un registro de la configuración anterior
    private _previousAllowEmptyTranslations: boolean;
    
    constructor(private _context: vscode.ExtensionContext, private _panel: vscode.WebviewPanel, public folderPath: string) {
        
        // Configurar el servicio de notificaciones con el panel webview
        NotificationService.getInstance().setWebviewPanel(this._panel);
        
        // Inicializar configuración de forma asíncrona en entorno web
        EIJEConfiguration.initializeConfigurationAsync().then(() => {
            // Después de cargar la configuración, enviar al frontend
            this._panel.webview.postMessage({ 
                command: 'configurationUpdate', 
                allowEmptyTranslations: EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS,
                defaultLanguage: EIJEConfiguration.DEFAULT_LANGUAGE,
                forceKeyUPPERCASE: EIJEConfiguration.FORCE_KEY_UPPERCASE
            });
        }).catch(error => {
            console.error('Error initializing configuration:', error);
        });
        
        // Guardar/inicializar el archivo de configuración (método síncrono para desktop)
        EIJEConfiguration.saveFullConfiguration();
        
        // Almacenar el valor actual de allowEmptyTranslations
        this._previousAllowEmptyTranslations = EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS;
        
        // Configurar un listener para cambios en la configuración
        this._context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('i18nJsonEditor.allowEmptyTranslations')) {
                    // Si cambió la configuración de allowEmptyTranslations
                    const newAllowEmptyValue = EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS;
                    
                    // Solo actualizar si realmente cambió el valor
                    if (this._previousAllowEmptyTranslations !== newAllowEmptyValue) {
                        this._previousAllowEmptyTranslations = newAllowEmptyValue;
                        
                        // Revalidar todas las traducciones con la nueva configuración
                        this._data._revalidateAllTranslations();
                        
                        // Actualizar UI con el nuevo estado
                        const currentPage = this._data.getCurrentPage();
                        this.checkEmptyTranslations(currentPage);
                        
                        // Refrescar la tabla de datos para mostrar posibles nuevos errores
                        this.refreshDataTable();
                    }
                }
            })
        );
        
        this._data = new EIJEData(this);
        this._initEvents();
        this._initTemplate();
        
        // Inicializar el template de forma asíncrona
        this.initializeTemplate();
        
        // Inicializar datos de forma asíncrona
        this._initializeData();
        
        // Guardar la configuración cuando se cierra el panel
        this._panel.onDidDispose(() => {
            EIJEConfiguration.saveFullConfiguration();
        });
    }

    private async initializeTemplate(): Promise<void> {
        try {
            const templateHtml = await this.getTemplateAsync();
            this._panel.webview.html = templateHtml;
        } catch (error) {
            console.error('Error initializing template:', error);
            this._panel.webview.html = '<html><body><h1>Error loading template</h1><p>' + error + '</p></body></html>';
        }
    }

    private async _initializeData(): Promise<void> {
        try {
            // Establecer la carpeta de trabajo inicial
            await this.setInitialWorkspaceFolder();
            
            await this._data.initialize();
            
            // Limpiar idiomas eliminados de las listas de visibles/ocultos
            await this.cleanupDeletedLanguages();
            
            // Inicializar el selector de carpetas de trabajo
            this.initializeWorkspaceFolderSelector();
            
            this.refreshDataTable();
        } catch (error) {
            console.error('Error initializing data:', error);
        }
    }
    
    // Método para obtener la ruta de la carpeta actual
    getFolderPath(): string | null {
        return this.folderPath;
    }
    
    // Método para actualizar la ruta de la carpeta y recargar los datos
    async updateFolderPath(folderPath: string | null): Promise<void> {
        this.folderPath = folderPath;
        await this.reloadData();
    }

    _initEvents() {
        this._panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'add':
                    this._data.add();
                    return;
                case 'mark':
                    this._data.mark(message.id);
                    return;
                case 'navigate':
                    this._data.navigate(message.page);
                    return;
                case 'pageSize':
                    this._data.pageSize(+message.value);
                    return;
                case 'refresh':
                    this.refreshDataTable();
                    return;
                case 'reload':
                    this.reloadData().catch(error => console.error('Error reloading data:', error));
                    return;
                case 'showNewLanguageInput':
                    this._showNewLanguageInput();
                    return;
                case 'newLanguage':
                    this.createNewLanguage(message.langCode);
                    return;
                case 'remove':
                    this._data.remove(message.id);
                    return;
                case 'save':
                    await this._data.save();
                    return;
                case 'switchWorkspaceFolder':
                    await this.switchWorkspaceFolder(message.folderName);
                    return;
                case 'saveAndSwitchWorkspaceFolder':
                    await this._data.save();
                    await this.switchWorkspaceFolder(message.folderName);
                    return;
                case 'discardAndSwitchWorkspaceFolder':
                    await this.discardChangesAndSwitchWorkspaceFolder(message.folderName);
                    return;
                case 'discardChanges':
                    await this.discardChanges();
                    return;
                case 'search':
                    this._data.search(message.value);
                    return;
                case 'select':
                    this._data.select(message.id);
                    return;
                case 'sort':
                    this._data.sort(message.column, message.ascending);
                    return;
                case 'switch-view':
                    this._data.switchView(message.view);
                    return;
                case 'update':
                    this._data.update(message.id, message.value, message.language);
                    return;
                case 'translate':
                    this._data.translate(message.id, message.language);
                    return;

                case 'toggleColumn':
                    this.toggleColumnVisibility(message.language, message.visible);
                    return;
                case 'updateColumnVisibility':
                    this.updateColumnVisibility(message.columnsToShow, message.columnsToHide);
                    return;
                case 'checkEmptyTranslations':
                    this.checkEmptyTranslations(message.currentPage);
                    return;
                case 'navigateToNextEmptyTranslation':
                    this.navigateToNextEmptyTranslation();
                    return;
                case 'deleteLanguage':
                    await this.deleteLanguage(message.language);
                    return;
                    
                case 'createI18nDirectory':
                    // Crear directorio i18n
                    const customPath = message.customPath;
                    const createdPath = EIJEConfiguration.createI18nDirectory(customPath);
                    
                    if (createdPath) {
                        // Limpiar la caché de configuración para forzar la recarga
                        EIJEConfiguration.clearConfigCache();
                        
                        // Notificar al usuario usando el servicio de notificaciones
                        const i18n = I18nService.getInstance();
                        NotificationService.getInstance().showSuccessMessage(
                            i18n.t('ui.messages.i18nFolderCreated'),
                            true // Usar Flashy
                        );
                        
                        // Esperar un momento para que la configuración se actualice
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        // Obtener el nombre de la carpeta creada
                        const folderName = customPath ? 
                            (customPath.endsWith('/i18n') || customPath.endsWith('\\i18n') ? 
                                customPath.slice(0, -5) : customPath) : 
                            '/';
                        
                        // Reiniciar completamente el editor con la nueva carpeta
                        await this.switchWorkspaceFolder(folderName);
                    }
                    return;
                    
                case 'closeEditor':
                    // Cerrar el editor
                    this._panel.dispose();
                    return;
            }
        });
    }
    
    async toggleColumnVisibility(language: string, visible: boolean) {
        // No se permite ocultar la columna 'key' ni el idioma por defecto
        const defaultLanguage = EIJEConfiguration.DEFAULT_LANGUAGE;
        if (language === 'key' || language === defaultLanguage) {
            return;
        }
        
        try {
            // Limpiar caché completamente antes de leer la configuración actual
            EIJEConfiguration.clearConfigCache();
            
            // Forzar recarga de configuración
            let visibleColumns = [...EIJEConfiguration.VISIBLE_COLUMNS];
            let hiddenColumns = [...EIJEConfiguration.HIDDEN_COLUMNS];
            
            if (visible) {
                // Mostrar columna
                if (!visibleColumns.includes(language)) {
                    visibleColumns.push(language);
                }
                // Eliminar de columnas ocultas si existe
                hiddenColumns = hiddenColumns.filter(col => col !== language);
            } else {
                // Ocultar columna
                visibleColumns = visibleColumns.filter(col => col !== language);
                // Añadir a columnas ocultas si no existe
                if (!hiddenColumns.includes(language)) {
                    hiddenColumns.push(language);
                }
            }
            
            // Guardar configuración de forma síncrona para asegurar que se aplique
            await EIJEConfiguration.saveVisibleColumns(visibleColumns);
            await EIJEConfiguration.saveHiddenColumns(hiddenColumns);
            
            // Guardar la configuración completa para mantener el archivo actualizado
            await EIJEConfiguration.saveFullConfiguration();
            
            // Limpiar caché completamente para forzar recarga
            EIJEConfiguration.clearConfigCache();
            
            // Notificar al webview sobre el cambio
            this._panel.webview.postMessage({
                command: 'showFlashyNotification',
                message: visible ? `Columna "${language}" mostrada` : `Columna "${language}" ocultada`,
                type: 'info',
                duration: 2000
            });
            
            // Actualizar la tabla inmediatamente
            this.refreshDataTable();
        } catch (error) {
            console.error('Error al cambiar visibilidad de columna:', error);
            
            // Notificar al webview sobre el error
            this._panel.webview.postMessage({
                command: 'showFlashyNotification',
                message: `Error al ${visible ? 'mostrar' : 'ocultar'} la columna "${language}"`,
                type: 'error',
                duration: 3000
            });
        }
    }
    
    updateColumnVisibility(columnsToShow: string[], columnsToHide: string[]) {
        
        const allLanguages = this._data.getLanguages();
        let newVisibleColumns: string[] = [];
        let newHiddenColumns: string[] = [];
        
        const defaultLanguage = EIJEConfiguration.DEFAULT_LANGUAGE;
        allLanguages.forEach(language => {
            if (language === defaultLanguage) {
                return;
            }
            
            if (columnsToShow.includes(language)) {
                newVisibleColumns.push(language);
            } else if (columnsToHide.includes(language)) {
                newHiddenColumns.push(language);
            } else {
                const currentVisible = EIJEConfiguration.VISIBLE_COLUMNS;
                const currentHidden = EIJEConfiguration.HIDDEN_COLUMNS;
                
                if (currentVisible.includes(language)) {
                    newVisibleColumns.push(language);
                } else if (currentHidden.includes(language)) {
                    newHiddenColumns.push(language);
                } else {
                    newVisibleColumns.push(language);
                }
            }
        });
        
        // Guardar configuración de forma asíncrona
        Promise.all([
            EIJEConfiguration.saveVisibleColumns(newVisibleColumns),
            EIJEConfiguration.saveHiddenColumns(newHiddenColumns)
        ]).then(() => {
            // Limpiar caché específico para forzar recarga
            EIJEConfiguration.clearConfigCache('visibleColumns');
            EIJEConfiguration.clearConfigCache('hiddenColumns');
            
            // Forzar actualización completa de la configuración
            EIJEConfiguration.saveFullConfiguration();
            
            // Esperar un momento antes de actualizar la tabla para asegurar que la configuración se guarde
            setTimeout(() => {
                this.refreshDataTable();
            }, 100);
        });
    }
    
    async reloadData(): Promise<void> {
        // Guardar la configuración completa
        EIJEConfiguration.saveFullConfiguration();
        
        this._data = new EIJEData(this);
        await this._data.initialize();
        this.refreshDataTable();
        const i18n = I18nService.getInstance();
        NotificationService.getInstance().showInformationMessage(i18n.t('ui.messages.reloaded'));
    }
    
    async _showNewLanguageInput() {
        const i18n = I18nService.getInstance();
        // Show VS Code input box to get language code
        const langCode = await vscode.window.showInputBox({
            prompt: i18n.t('ui.prompts.enterLanguageCode'),
            placeHolder: i18n.t('ui.prompts.languageCodePlaceholder'),
            validateInput: (value: string) => {
                if (!value || value.trim() === '') {
                    return i18n.t('ui.messages.languageCodeEmpty');
                }
                if (value.length > 5) {
                    return i18n.t('ui.messages.languageCodeTooLong');
                }
                return null; // Input is valid
            }
        });

        // If user provided a language code, create the language file
        if (langCode) {
            this.createNewLanguage(langCode).catch(error => console.error('Error creating new language:', error));
        }
    }

    async createNewLanguage(langCode: string): Promise<void> {
        const i18n = I18nService.getInstance();
        
        if (!langCode || langCode.length > 5) {
            NotificationService.getInstance().showErrorMessage(i18n.t('ui.messages.languageCodeInvalid'));
            return;
        }
        
        try {
            let targetPath: string;
            
            if (this.folderPath) {
                // Use the current folder if opened from a specific folder
                targetPath = this.folderPath;
            } else if (EIJEConfiguration.WORKSPACE_FOLDERS && EIJEConfiguration.WORKSPACE_FOLDERS.length > 0) {
                // Use the first workspace folder if opened from workspace
                targetPath = EIJEConfiguration.WORKSPACE_FOLDERS[0].path;
            } else {
                NotificationService.getInstance().showErrorMessage(i18n.t('ui.messages.noTargetFolder'));
                return;
            }
            
            const filePath = _path.join(targetPath, `${langCode}.json`);
            
            // Check if file already exists
            if (await EIJEFileSystem.exists(filePath)) {
                NotificationService.getInstance().showWarningMessage(i18n.t('ui.messages.languageFileExists', `${langCode}.json`));
                return;
            }
            
            // Check if English template file exists
            const englishFilePath = _path.join(targetPath, 'en.json');
            let jsonContent = {};
            
            if (await EIJEFileSystem.exists(englishFilePath)) {
                try {
                    // Use English file as template
                    const englishContent = await EIJEFileSystem.readFile(englishFilePath);
                    jsonContent = JSON.parse(englishContent);
                    NotificationService.getInstance().showInformationMessage(i18n.t('ui.messages.createdWithTemplate', `${langCode}.json`));
                } catch (err) {
                    // If there's an error reading/parsing the English file, use empty object
                    NotificationService.getInstance().showWarningMessage(i18n.t('ui.messages.templateReadError'));
                }
            } else {
                NotificationService.getInstance().showInformationMessage(i18n.t('ui.messages.templateNotFound'));
            }
            
            // Create new language file
            const fileContent = JSON.stringify(jsonContent, null, EIJEConfiguration.JSON_SPACE);
            await EIJEFileSystem.writeFile(filePath, fileContent);
            
            NotificationService.getInstance().showInformationMessage(i18n.t('ui.messages.languageFileCreated', `${langCode}.json`));
            
            // Agregar el nuevo idioma como visible por defecto
            await this.addLanguageAsVisible(langCode);
            
            // Guardar la configuración completa
            EIJEConfiguration.saveFullConfiguration();
            
            // Reload the editor to show the new language
            await this.reloadData();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            NotificationService.getInstance().showErrorMessage(i18n.t('ui.messages.fileCreationError', errorMessage));
        }
    }

    /**
     * Elimina un archivo de idioma
     * @param language Código del idioma a eliminar
     */
    async deleteLanguage(language: string): Promise<void> {
        const i18n = I18nService.getInstance();
        
        if (!language) {
            NotificationService.getInstance().showErrorMessage(i18n.t('ui.messages.languageCodeInvalid'));
            return;
        }
        
        try {
            let targetPath: string;
            
            if (this.folderPath) {
                // Usar la carpeta actual si se abrió desde una carpeta específica
                targetPath = this.folderPath;
            } else if (EIJEConfiguration.WORKSPACE_FOLDERS && EIJEConfiguration.WORKSPACE_FOLDERS.length > 0) {
                // Usar la primera carpeta del workspace si se abrió desde el workspace
                targetPath = EIJEConfiguration.WORKSPACE_FOLDERS[0].path;
            } else {
                NotificationService.getInstance().showErrorMessage(i18n.t('ui.messages.noTargetFolder'));
                return;
            }
            
            const filePath = _path.join(targetPath, `${language}.json`);
            
            // Verificar si el archivo existe
            if (!(await EIJEFileSystem.exists(filePath))) {
                NotificationService.getInstance().showWarningMessage(i18n.t('ui.messages.languageFileNotFound', `${language}.json`));
                return;
            }
            
            // Verificar que no sea el idioma por defecto (en)
            if (language === EIJEConfiguration.DEFAULT_LANGUAGE) {
                NotificationService.getInstance().showErrorMessage(i18n.t('ui.messages.cannotDeleteDefaultLanguage'));
                return;
            }
            
            // Eliminar el archivo
            await EIJEFileSystem.deleteFile(filePath);
            
            // Eliminar el idioma de las columnas visibles
            await this.removeLanguageFromVisibleColumns(language);
            
            // Guardar la configuración completa
            EIJEConfiguration.saveFullConfiguration();
            
            // Mostrar mensaje de éxito
            NotificationService.getInstance().showInformationMessage(i18n.t('ui.messages.languageFileDeleted', `${language}.json`));
            
            // Recargar el editor para reflejar los cambios
            await this.reloadData();
            
            // Enviar notificación al webview
            this._panel.webview.postMessage({
                command: 'showFlashyNotification',
                message: `El idioma ${language} ha sido eliminado permanentemente`,
                type: 'success',
                duration: 3000
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            NotificationService.getInstance().showErrorMessage(i18n.t('ui.messages.fileDeletionError', errorMessage));
        }
    }
    
    /**
     * Elimina un idioma de las columnas visibles
     */
    private async removeLanguageFromVisibleColumns(langCode: string): Promise<void> {
        try {
            // Limpiar caché antes de leer la configuración actual
            EIJEConfiguration.clearConfigCache();
            
            // Obtener las columnas actuales
            let visibleColumns = [...EIJEConfiguration.VISIBLE_COLUMNS];
            
            // Remover el idioma de las columnas visibles
            visibleColumns = visibleColumns.filter(col => col !== langCode);
            
            // Actualizar la configuración
            await EIJEConfiguration.saveVisibleColumns(visibleColumns);
        } catch (error) {
            console.error('Error removing language from visible columns:', error);
        }
    }

    /**
     * Agregar un idioma como visible por defecto
     */
    private async addLanguageAsVisible(langCode: string): Promise<void> {
        try {
            // Limpiar caché antes de leer la configuración actual
            EIJEConfiguration.clearConfigCache();
            
            // Obtener las columnas actuales
            let visibleColumns = [...EIJEConfiguration.VISIBLE_COLUMNS];
            let hiddenColumns = [...EIJEConfiguration.HIDDEN_COLUMNS];
            
            // Remover el idioma de ocultos si estaba ahí
            hiddenColumns = hiddenColumns.filter(col => col !== langCode);
            
            // Agregar a visibles si no está ya
            if (!visibleColumns.includes(langCode)) {
                visibleColumns.push(langCode);
            }
            
            // Guardar la configuración actualizada
            await EIJEConfiguration.saveVisibleColumns(visibleColumns);
            await EIJEConfiguration.saveHiddenColumns(hiddenColumns);
            
        } catch (error) {
            console.error('Error adding language as visible:', error);
        }
    }

    /**
     * Limpiar idiomas eliminados de las listas de visibles/ocultos
     */
    private async cleanupDeletedLanguages(): Promise<void> {
        try {
            // Obtener idiomas disponibles actualmente
            const availableLanguages = this._data.getLanguages();
            
            // Limpiar caché antes de leer la configuración actual
            EIJEConfiguration.clearConfigCache();
            
            // Obtener la carpeta de trabajo actual
            const currentWorkspaceFolder = EIJEConfiguration.DEFAULT_WORKSPACE_FOLDER;
            
            // Obtener las columnas actuales (específicas para la carpeta actual)
            let visibleColumns = [...EIJEConfiguration.VISIBLE_COLUMNS];
            let hiddenColumns = [...EIJEConfiguration.HIDDEN_COLUMNS];
            
            // Filtrar columnas visibles para mantener solo idiomas que existen
            const originalVisibleCount = visibleColumns.length;
            visibleColumns = visibleColumns.filter(col => 
                col === 'key' || availableLanguages.includes(col)
            );
            
            // Filtrar columnas ocultas para mantener solo idiomas que existen
            const originalHiddenCount = hiddenColumns.length;
            hiddenColumns = hiddenColumns.filter(col => 
                availableLanguages.includes(col)
            );
            
            // Solo guardar si hubo cambios
            if (visibleColumns.length !== originalVisibleCount || 
                hiddenColumns.length !== originalHiddenCount) {
                
                await EIJEConfiguration.saveVisibleColumns(visibleColumns);
                await EIJEConfiguration.saveHiddenColumns(hiddenColumns);
                
                console.log('Cleaned up deleted languages from visibility configuration');
            }
            
            // Limpiar también todas las configuraciones de carpetas de trabajo
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = _path.join(workspaceFolder.uri.fsPath, '.vscode', '.ei18n-editor-config.json');
                
                if (EIJEFileSystem.existsSync(configPath)) {
                    const configContent = EIJEFileSystem.readFileSync(configPath);
                    const config = JSON.parse(configContent);
                    
                    // Limpiar las configuraciones globales
                    if (config.visibleColumns) {
                        const originalGlobalVisibleCount = config.visibleColumns.length;
                        config.visibleColumns = config.visibleColumns.filter((col: string) => 
                            col === 'key' || availableLanguages.includes(col)
                        );
                        
                        if (config.visibleColumns.length !== originalGlobalVisibleCount) {
                            // Guardar la configuración actualizada
                            EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
                            console.log('Cleaned up deleted languages from global visibility configuration');
                        }
                    }
                    
                    if (config.hiddenColumns) {
                        const originalGlobalHiddenCount = config.hiddenColumns.length;
                        config.hiddenColumns = config.hiddenColumns.filter((col: string) => 
                            availableLanguages.includes(col)
                        );
                        
                        if (config.hiddenColumns.length !== originalGlobalHiddenCount) {
                            // Guardar la configuración actualizada
                            EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
                            console.log('Cleaned up deleted languages from global visibility configuration');
                        }
                    }
                    
                    // Limpiar las configuraciones específicas por carpeta
                    if (config.workspaceFolders && Array.isArray(config.workspaceFolders)) {
                        let configUpdated = false;
                        
                        // Recorrer todas las carpetas de trabajo
                        config.workspaceFolders.forEach((folder: any) => {
                            // Limpiar visibleColumns
                            if (folder.visibleColumns && Array.isArray(folder.visibleColumns)) {
                                const originalFolderVisibleCount = folder.visibleColumns.length;
                                folder.visibleColumns = folder.visibleColumns.filter((col: string) => 
                                    col === 'key' || availableLanguages.includes(col)
                                );
                                
                                if (folder.visibleColumns.length !== originalFolderVisibleCount) {
                                    configUpdated = true;
                                }
                            }
                            
                            // Limpiar hiddenColumns
                            if (folder.hiddenColumns && Array.isArray(folder.hiddenColumns)) {
                                const originalFolderHiddenCount = folder.hiddenColumns.length;
                                folder.hiddenColumns = folder.hiddenColumns.filter((col: string) => 
                                    availableLanguages.includes(col)
                                );
                                
                                if (folder.hiddenColumns.length !== originalFolderHiddenCount) {
                                    configUpdated = true;
                                }
                            }
                        });
                        
                        // Si se actualizó alguna configuración, guardar el archivo
                        if (configUpdated) {
                            EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
                            console.log('Cleaned up deleted languages from workspace folders configuration');
                        }
                    }
                    
                    // Eliminar configuraciones específicas por carpeta en el nivel raíz
                    let rootConfigUpdated = false;
                    Object.keys(config).forEach(key => {
                        if (key.startsWith('visibleColumns_') || key.startsWith('hiddenColumns_')) {
                            delete config[key];
                            rootConfigUpdated = true;
                        }
                    });
                    
                    // Si se eliminaron configuraciones en el nivel raíz, guardar el archivo
                    if (rootConfigUpdated) {
                        EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
                        console.log('Removed legacy workspace-specific configurations from root level');
                    }
                }
            }
            
        } catch (error) {
            console.error('Error cleaning up deleted languages:', error);
        }
    }
    
    checkEmptyTranslations(currentPage: number) {
        // Check for empty translations on the current page
        const emptyTranslations = this._data.findEmptyTranslations(currentPage);
        
        // Count all empty translations in the entire dataset
        const emptyTranslationsCount = this._data.countEmptyTranslations();
        
        // Solo considerar las traducciones vacías como error si no están permitidas
        const allowEmptyTranslations = EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS;
        const hasError = !allowEmptyTranslations && emptyTranslationsCount.hasEmpty;
        
        this._panel.webview.postMessage({ 
            command: 'emptyTranslationsFound', 
            emptyTranslations: emptyTranslations,
            hasEmptyTranslations: hasError,
            allowEmptyTranslations: EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS,
            hasAnyEmptyTranslations: emptyTranslationsCount.hasEmpty,
            totalEmptyCount: emptyTranslationsCount.count
        });
    }
    
    navigateToNextEmptyTranslation() {
        // Find and navigate to the next empty translation
        const nextEmptyTranslation = this._data.findNextEmptyTranslation();
        if (nextEmptyTranslation) {
            // If an empty translation is found, navigate to its page and select it
            this._data.navigate(nextEmptyTranslation.page, true); // Skip refresh
            this._data.select(nextEmptyTranslation.id, true); // Skip refresh
            
            // Luego actualizamos la interfaz una sola vez
            this.refreshDataTable();
            
            // También debemos enviar un mensaje para actualizar la información de traducciones vacías
            this.checkEmptyTranslations(nextEmptyTranslation.page);
        } else {
            // If no empty translation is found, show a message
            const i18n = I18nService.getInstance();
            NotificationService.getInstance().showInformationMessage(i18n.t('ui.messages.noEmptyTranslations'));
        }
    }

    _initTemplate() {
        if (this.isWorkspace) {
            this._panel.webview.postMessage({ command: 'folders', folders: EIJEConfiguration.WORKSPACE_FOLDERS });
        }
        
        // Enviar configuración inicial al frontend, especialmente importante en entorno web
        this._panel.webview.postMessage({ 
            command: 'configurationUpdate', 
            allowEmptyTranslations: EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS,
            defaultLanguage: EIJEConfiguration.DEFAULT_LANGUAGE,
            forceKeyUPPERCASE: EIJEConfiguration.FORCE_KEY_UPPERCASE
        });
    }

    refreshDataTable() {
        // Limpiar caché de configuración para asegurar que se usen los valores más recientes
        EIJEConfiguration.clearConfigCache();
        
        // Renderizar el contenido con los datos actualizados
        const renderedContent = this._data.render();
        
        // Enviar el contenido actualizado al webview
        this._panel.webview.postMessage({ command: 'content', render: renderedContent });
    }

    /**
     * Update the translation and refresh the empty translations count
     * @param translation The translation to update
     */
    updateTranslation(translation: EIJEDataTranslation) {
        this._panel.webview.postMessage({ command: 'update', translation: translation });
        
        // Actualizar el contador de traducciones faltantes después de cada modificación
        const currentPage = this._data.getCurrentPage();
        this.checkEmptyTranslations(currentPage);
    }
    
    /**
     * Envía un mensaje al frontend
     * @param message El mensaje a enviar
     */
    postMessage(message: any) {
        this._panel.webview.postMessage(message);
    }
    
    /**
     * Envía un mensaje al frontend con el resultado del guardado
     * @param success Indica si el guardado fue exitoso
     */
    sendSaveResult(success: boolean) {
        // Contar traducciones vacías para actualizar el estado de la UI
        const emptyTranslationsCount = this._data.countEmptyTranslations();
        const hasEmptyTranslations = emptyTranslationsCount.hasEmpty;
        
        this._panel.webview.postMessage({ 
            command: 'saveResult', 
            success: success,
            allowEmptyTranslations: EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS,
            hasEmptyTranslations: hasEmptyTranslations
        });
        
        // Actualizar el estado de la UI después de guardar
        const currentPage = this._data.getCurrentPage();
        this.checkEmptyTranslations(currentPage);
    }

    async getTemplateAsync(): Promise<string> {
        const template = vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'template.html'));

        const linksPath = [
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'bootstrap.min.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'template.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'tippy.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'font-awesome.min.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'sweetalert2-custom.css'))
        ];

        const scriptsPath = [
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'jquery.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'bootstrap.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'popper.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'tippy.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'sweetalert2.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'flashy.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'template.js'))
        ];
        
        // Get i18n translations
        const i18n = I18nService.getInstance();
        
        // Helper function to replace i18n template tags
        const replaceI18nTags = (html: string): string => {
            return html.replace(/\{\{i18n\.([^}]+)\}\}/g, (match, key) => {
                return i18n.t(key) || match;
            });
        };

        try {
            const templateContent = await EIJEFileSystem.readFile(template.fsPath);
            
            const linksHtml = linksPath
                .map(l => {
                    const uri = this._panel.webview.asWebviewUri ? this._panel.webview.asWebviewUri(l) : l.with({ scheme: 'vscode-resource' });
                    return `<link rel="stylesheet" href="${uri}">`;
                })
                .join('\n');
            
            const scriptsHtml = scriptsPath
                .map(l => {
                    const uri = this._panel.webview.asWebviewUri ? this._panel.webview.asWebviewUri(l) : l.with({ scheme: 'vscode-resource' });
                    return `<script src="${uri}"></script>`;
                })
                .join('\n');
            
            const finalHtml = replaceI18nTags(
                templateContent
                    .replace('{{LINKS}}', linksHtml)
                    .replace('{{SCRIPTS}}', scriptsHtml)
            );
            
            return finalHtml;
            
        } catch (error) {
            console.error('Error generating template:', error);
            return '<html><body><h1>Error loading template</h1><p>' + error + '</p></body></html>';
        }
    }

    getTemplate(): string {
        const template = vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'template.html'));

        const linksPath = [
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'bootstrap.min.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'template.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'tippy.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'font-awesome.min.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'sweetalert2-custom.css'))
        ];

        const scriptsPath = [
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'jquery.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'bootstrap.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'popper.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'tippy.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'sweetalert2.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'flashy.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'template.js'))
        ];
        
        // Get i18n translations
        const i18n = I18nService.getInstance();
        
        // Helper function to replace i18n template tags
        const replaceI18nTags = (html: string): string => {
            return html.replace(/\{\{i18n\.([^}]+)\}\}/g, (match, key) => {
                return i18n.t(key) || match;
            });
        };

        try {
            const templateContent = EIJEFileSystem.readFileSync(template.fsPath).toString();
            
            const linksHtml = linksPath
                .map(l => {
                    const uri = this._panel.webview.asWebviewUri ? this._panel.webview.asWebviewUri(l) : l.with({ scheme: 'vscode-resource' });
                    return `<link rel="stylesheet" href="${uri}">`;
                })
                .join('\n');
            
            const scriptsHtml = scriptsPath
                .map(l => {
                    const uri = this._panel.webview.asWebviewUri ? this._panel.webview.asWebviewUri(l) : l.with({ scheme: 'vscode-resource' });
                    return `<script src="${uri}"></script>`;
                })
                .join('\n');
            
            const finalHtml = replaceI18nTags(
                templateContent
                    .replace('{{LINKS}}', linksHtml)
                    .replace('{{SCRIPTS}}', scriptsHtml)
            );
            return finalHtml;
            
        } catch (error) {
            console.error('Error generating template:', error);
            return '<html><body><h1>Error loading template</h1><p>' + error + '</p></body></html>';
        }
    }

    // Método para cambiar la carpeta de trabajo
    private async switchWorkspaceFolder(folderName: string): Promise<void> {
        try {
            // Si no hay nombre de carpeta, no hacer nada
            if (!folderName) {
                return;
            }
            
            // Verificar si hay cambios sin guardar
            if (this._data && this._data.hasUnsavedChanges()) {
                // Usar el servicio de notificaciones para mostrar el mensaje de error
                NotificationService.getInstance().showErrorMessage(
                    I18nService.getInstance().t('ui.messages.cannotSwitchWithUnsavedChanges', 'No se puede cambiar de carpeta de trabajo sin guardar o descartar los cambios.')
                );
                
                // Enviar mensaje al frontend para restaurar la selección anterior
                this._panel.webview.postMessage({
                    command: 'restoreWorkspaceFolderSelection',
                    folderName: EIJEConfiguration.DEFAULT_WORKSPACE_FOLDER
                });
                
                return;
            }
            
            // Guardar la carpeta seleccionada como predeterminada
            await EIJEConfiguration.saveDefaultWorkspaceFolder(folderName);
            
            // Limpiar la caché de configuración para forzar la recarga de las columnas visibles/ocultas
            EIJEConfiguration.clearConfigCache('visibleColumns');
            EIJEConfiguration.clearConfigCache('hiddenColumns');
            EIJEConfiguration.clearConfigCache('workspaceFolders');
            
            // Buscar la carpeta en la configuración
            const workspaceFolders = EIJEConfiguration.WORKSPACE_FOLDERS;
            const selectedFolder = workspaceFolders.find(f => f.name === folderName);
            
            if (selectedFolder) {
                // Crear nueva instancia de EIJEData para la nueva carpeta
                this._data = new EIJEData(this);
                
                // Cambiar la ruta de la carpeta (convertir de relativa a absoluta)
                this.folderPath = EIJEConfiguration.resolveRelativePath(selectedFolder.path);
                
                // Reinicializar los datos
                await this._data.initialize();
                
                // Limpiar idiomas eliminados de las listas de visibles/ocultos
                await this.cleanupDeletedLanguages();
                
                // Actualizar la interfaz
                this.refreshDataTable();
                
                // Enviar confirmación al frontend
                this._panel.webview.postMessage({
                    command: 'workspaceFolderChanged',
                    folderName: folderName
                });
                
                // Inicializar el selector de carpetas con la nueva carpeta activa
                this.initializeWorkspaceFolderSelector(folderName);
                
                // Enviar la configuración actualizada al frontend
                this._panel.webview.postMessage({ 
                    command: 'configurationUpdate', 
                    allowEmptyTranslations: EIJEConfiguration.ALLOW_EMPTY_TRANSLATIONS,
                    defaultLanguage: EIJEConfiguration.DEFAULT_LANGUAGE,
                    forceKeyUPPERCASE: EIJEConfiguration.FORCE_KEY_UPPERCASE
                });
                
            } else {
                console.error('Workspace folder not found:', folderName);
            }
        } catch (error) {
            console.error('Error switching workspace folder:', error);
        }
    }

    // Método para descartar cambios
    private async discardChanges(): Promise<void> {
        try {
            // Descartar cambios en los datos
            if (this._data) {
                await this._data.discardChanges();
            }
            
            // Actualizar la interfaz
            this.refreshDataTable();
            
            // Mostrar mensaje de confirmación
            NotificationService.getInstance().showInformationMessage(I18nService.getInstance().t('ui.messages.changesDiscarded'), true);
        } catch (error) {
            console.error('Error discarding changes:', error);
        }
    }
    
    // Método para descartar cambios y cambiar de carpeta
    private async discardChangesAndSwitchWorkspaceFolder(folderName: string): Promise<void> {
        try {
            // Descartar cambios
            await this.discardChanges();
            
            // Cambiar de carpeta
            await this.switchWorkspaceFolder(folderName);
        } catch (error) {
            console.error('Error discarding changes and switching workspace folder:', error);
        }
    }

    // Método para establecer la carpeta de trabajo inicial
    private async setInitialWorkspaceFolder(): Promise<void> {
        // Validar las carpetas de trabajo y eliminar las que no existen
        await this.validateWorkspaceFolders();
        
        // Obtener las carpetas de trabajo actualizadas
        const workspaceFolders = EIJEConfiguration.WORKSPACE_FOLDERS;
        
        if (workspaceFolders.length === 0) {
            console.log('No workspace folders found, showing prompt to create one');
            
            // Mostrar diálogo para crear una carpeta i18n
            // Usamos setTimeout para asegurarnos de que el panel esté completamente inicializado
            setTimeout(() => {
                // Mostrar mensaje en el webview usando SweetAlert2
                this._panel.webview.postMessage({
                    command: 'showCreateI18nPrompt',
                    title: 'No se encontraron carpetas i18n',
                    text: 'No se encontraron directorios i18n en el proyecto. ¿Desea crear uno?'
                });
            }, 500);
            
            // No retornamos aquí para permitir que el editor se inicialice completamente
            // Mostramos un mensaje de estado en lugar de cerrar el editor
            this._panel.webview.html = this.getHtmlForNoWorkspaceFolders();
            return;
        }
        
        // Obtener la carpeta por defecto de la configuración
        const defaultFolder = EIJEConfiguration.DEFAULT_WORKSPACE_FOLDER;
        let selectedFolder: any = null;
        
        // Si hay una carpeta específica proporcionada al abrir la extensión, usarla
        if (this.folderPath) {
            // Verificar si la carpeta proporcionada está en la lista de carpetas de trabajo
            // Primero intentar con la ruta tal como está
            let matchingFolder = workspaceFolders.find(f => f.path === this.folderPath);
            
            // Si no se encuentra, intentar resolver las rutas relativas de las carpetas de trabajo
            if (!matchingFolder) {
                matchingFolder = workspaceFolders.find(f => {
                    const absolutePath = EIJEConfiguration.resolveRelativePath(f.path);
                    return absolutePath === this.folderPath;
                });
            }
            
            if (matchingFolder) {
                // Si la carpeta está en la lista, usarla
                selectedFolder = matchingFolder;
            } else if (defaultFolder && workspaceFolders.some(f => f.name === defaultFolder)) {
                // Si la carpeta no está en la lista pero hay una carpeta por defecto, usarla
                selectedFolder = workspaceFolders.find(f => f.name === defaultFolder);
            }
            // Si no hay carpeta por defecto, no seleccionar ninguna automáticamente
        } else if (defaultFolder && workspaceFolders.some(f => f.name === defaultFolder)) {
            // Si no hay folderPath específico pero hay una carpeta por defecto, usarla
            selectedFolder = workspaceFolders.find(f => f.name === defaultFolder);
        }
        // Si no hay carpeta por defecto, no seleccionar ninguna automáticamente
        
        // Actualizar el folderPath con la carpeta seleccionada
        if (selectedFolder) {
            // Convertir la ruta relativa a absoluta si es necesario
            this.folderPath = EIJEConfiguration.resolveRelativePath(selectedFolder.path);
            
            // Si la carpeta seleccionada es diferente a la carpeta por defecto, actualizar la configuración
            if (selectedFolder.name !== defaultFolder) {
                await EIJEConfiguration.saveDefaultWorkspaceFolder(selectedFolder.name);
            }
        } else {
            // Si no hay carpeta seleccionada, limpiar el folderPath para que no se carguen datos
            this.folderPath = '';
        }
    }

    // Método para validar las carpetas de trabajo y eliminar las que no existen
    private async validateWorkspaceFolders(): Promise<void> {
        // Obtener las carpetas de trabajo actuales
        const workspaceFolders = [...EIJEConfiguration.WORKSPACE_FOLDERS];
        const validFolders = [];
        let configChanged = false;
        
        // Verificar cada carpeta
        for (const folder of workspaceFolders) {
            // Resolver la ruta relativa a absoluta
            const absolutePath = EIJEConfiguration.resolveRelativePath(folder.path);
            
            try {
                // Verificar si la carpeta existe
                const exists = await EIJEFileSystem.exists(absolutePath);
                
                if (exists) {
                    // Si existe, mantenerla
                    validFolders.push(folder);
                } else {
                    // Si no existe, marcar que la configuración ha cambiado
                    console.log(`Workspace folder not found: ${folder.path} (${absolutePath})`);
                    configChanged = true;
                }
            } catch (error) {
                console.error(`Error validating workspace folder ${folder.path}:`, error);
                // En caso de error, asumir que la carpeta no existe
                configChanged = true;
            }
        }
        
        // Si se eliminaron carpetas, actualizar la configuración
        if (configChanged) {
            // Actualizar la configuración con las carpetas válidas
            await EIJEConfiguration.saveWorkspaceFolders(validFolders);
            
            // Si la carpeta por defecto ya no existe, actualizarla
            const defaultFolder = EIJEConfiguration.DEFAULT_WORKSPACE_FOLDER;
            if (defaultFolder && !validFolders.some(f => f.name === defaultFolder)) {
                // Establecer la primera carpeta válida como predeterminada, o vacío si no hay ninguna
                const newDefaultFolder = validFolders.length > 0 ? validFolders[0].name : '';
                await EIJEConfiguration.saveDefaultWorkspaceFolder(newDefaultFolder);
            }
            
            // Limpiar la caché de configuración
            EIJEConfiguration.clearConfigCache();
        }
    }
    
    // Método para obtener el HTML cuando no hay carpetas de trabajo
    private getHtmlForNoWorkspaceFolders(): string {
        // Obtener las rutas a los recursos
        const styleUri = this._panel.webview.asWebviewUri(
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'bootstrap.min.css'))
        );
        const customStyleUri = this._panel.webview.asWebviewUri(
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'template.css'))
        );
        const sweetalertCssUri = this._panel.webview.asWebviewUri(
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'css', 'sweetalert2-custom.css'))
        );
        const jqueryUri = this._panel.webview.asWebviewUri(
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'jquery.min.js'))
        );
        const bootstrapJsUri = this._panel.webview.asWebviewUri(
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'bootstrap.min.js'))
        );
        const sweetalertJsUri = this._panel.webview.asWebviewUri(
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'sweetalert2.min.js'))
        );
        const templateJsUri = this._panel.webview.asWebviewUri(
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'js', 'template.js'))
        );
        
        return `<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ei18n-json-editor</title>
            <link href="${styleUri}" rel="stylesheet">
            <link href="${customStyleUri}" rel="stylesheet">
            <link href="${sweetalertCssUri}" rel="stylesheet">
        </head>
        <body>
            <div class="container mt-5">
                <div class="row">
                    <div class="col-12 text-center">
                        <h2>${I18nService.getInstance().t('ui.messages.noWorkspaceFolders')}</h2>
                        <p class="mt-3">${I18nService.getInstance().t('ui.messages.createI18nToStart')}</p>
                        <button id="create-i18n-btn" class="btn btn-primary mt-3">${I18nService.getInstance().t('ui.buttons.create')}</button>
                    </div>
                </div>
            </div>
            
            <div id="flashy-container"></div>
            
            <script src="${jqueryUri}"></script>
            <script src="${bootstrapJsUri}"></script>
            <script src="${sweetalertJsUri}"></script>
            <script src="${templateJsUri}"></script>
            <script>
                (function() {
                    const vscode = acquireVsCodeApi();
                    
                    // Mostrar el diálogo de creación de carpeta i18n al cargar la página
                    setTimeout(() => {
                        const i18n = I18nService.getInstance();
                        showCreateI18nPrompt(
                            i18n.t('ui.messages.noI18nFoldersFound'),
                            i18n.t('ui.messages.createI18nFolder')
                        );
                    }, 500);
                    
                    // Manejar el clic en el botón de crear carpeta i18n
                    document.getElementById('create-i18n-btn').addEventListener('click', () => {
                        showCreateI18nPrompt('Crear carpeta i18n', '¿Dónde desea crear la carpeta i18n?');
                    });
                })();
            </script>
        </body>
        </html>`;
    }
    
    // Método para inicializar el selector de carpetas de trabajo
    private initializeWorkspaceFolderSelector(currentFolder?: string): void {
        const workspaceFolders = EIJEConfiguration.WORKSPACE_FOLDERS;
        
        console.log('Initializing workspace folder selector:', { workspaceFolders, currentFolder, folderPath: this.folderPath });
        
        if (workspaceFolders.length === 0) {
            console.log('No workspace folders found');
            return;
        }
        
        // Determinar la carpeta actual
        let activeFolder = currentFolder;
        if (!activeFolder) {
            // Buscar la carpeta que corresponde al folderPath actual
            // Primero intentar con la ruta tal como está
            let currentFolderObj = workspaceFolders.find(f => f.path === this.folderPath);
            
            // Si no se encuentra, intentar resolver las rutas relativas
            if (!currentFolderObj) {
                currentFolderObj = workspaceFolders.find(f => {
                    const absolutePath = EIJEConfiguration.resolveRelativePath(f.path);
                    return absolutePath === this.folderPath;
                });
            }
            
            if (currentFolderObj) {
                activeFolder = currentFolderObj.name;
            } else {
                const defaultFolder = EIJEConfiguration.DEFAULT_WORKSPACE_FOLDER;
                if (defaultFolder && workspaceFolders.some(f => f.name === defaultFolder)) {
                    activeFolder = defaultFolder;
                }
                // Si no hay carpeta por defecto, no seleccionar ninguna automáticamente
            }
        }
        
        console.log('Sending initWorkspaceFolders message:', { folders: workspaceFolders, currentFolder: activeFolder });
        
        // Enviar datos al frontend con un pequeño delay para asegurar que el webview esté listo
        setTimeout(() => {
            this._panel.webview.postMessage({
                command: 'initWorkspaceFolders',
                folders: workspaceFolders,
                currentFolder: activeFolder || null
            });
        }, 100);
    }
}

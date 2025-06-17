import * as vscode from 'vscode';
import * as _path from 'path';

import { EIJEFolder } from './models/eije-folder';
import { TranslationServiceEnum } from './services/eije-translation-service';
import { EIJEFileSystem } from './services/eije-filesystem';

export class EIJEConfiguration {
    // Cache para configuración en memoria
    private static _configCache: { [key: string]: any } = {};
    
    // Ya no necesitamos detectar el entorno web
    
    // Control para evitar creación repetitiva de archivo de configuración
    private static _configFileCreated: boolean = false;
    
    // Limpiar caché de configuración (solo para configuraciones específicas)
    static clearConfigCache(specificKey?: string): void {
        if (specificKey) {
            delete this._configCache[`config_${specificKey}`];
        } else {
            this._configCache = {};
        }
        // NO limpiar el caché de detección de entorno web para evitar re-detección
        // NO resetear _configFileCreated para evitar recreación
    }
    
    // Ruta del archivo de configuración dentro de .vscode
    private static getConfigPath(workspaceFolder: vscode.WorkspaceFolder): string {
        try {
            // Asegurar que el directorio .vscode existe
            const vscodePath = _path.join(workspaceFolder.uri.fsPath, '.vscode');
            if (!EIJEFileSystem.existsSync(vscodePath)) {
                EIJEFileSystem.mkdirSync(vscodePath, { recursive: true });
            }
            
            const configPath = _path.join(vscodePath, '.ei18n-editor-config.json');
            
            // Si el archivo no existe, crearlo con configuración por defecto SOLO UNA VEZ
            if (!EIJEFileSystem.existsSync(configPath) && !this._configFileCreated) {
                this.createDefaultConfigFile(configPath);
                this._configFileCreated = true;
            }
            
            return configPath;
        } catch (error) {
            console.error('Error getting config path:', error);
            return '';
        }
    }
    
    private static createDefaultConfigFile(configPath: string): void {
        try {
            // Buscar directorios i18n en el proyecto
            const workspaceFolders = this.findI18nDirectories();
            
            // Determinar la carpeta de trabajo predeterminada
            let defaultWorkspaceFolder = "";
            if (workspaceFolders.length > 0) {
                defaultWorkspaceFolder = workspaceFolders[0].name;
            }
            
            const defaultConfig = {
                allowEmptyTranslations: false,
                defaultLanguage: "en",
                forceKeyUPPERCASE: true,
                jsonSpace: 2,
                keySeparator: ".",
                lineEnding: "\n",
                supportedFolders: ["i18n"],
                workspaceFolders: workspaceFolders,
                defaultWorkspaceFolder: defaultWorkspaceFolder,
                translationService: "Coming soon",
                translationServiceApiKey: "Coming soon",
                visibleColumns: [],
                hiddenColumns: []
            };
            
            EIJEFileSystem.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
            
            // Si no se encontraron directorios i18n, mostrar un mensaje al usuario
            if (workspaceFolders.length === 0) {
                this.showCreateI18nDirectoryPrompt();
            }
        } catch (error) {
            console.error('Error creating default config file:', error);
        }
    }
    
    /**
     * Busca directorios i18n en el proyecto
     * @returns Array de objetos con información de los directorios i18n encontrados
     */
    private static findI18nDirectories(): Array<{name: string, path: string}> {
        const workspaceFolders: Array<{name: string, path: string}> = [];
        
        try {
            // Obtener todas las carpetas del espacio de trabajo
            const vscodeWorkspaceFolders = vscode.workspace.workspaceFolders;
            if (!vscodeWorkspaceFolders || vscodeWorkspaceFolders.length === 0) {
                return workspaceFolders;
            }
            
            // Para cada carpeta del espacio de trabajo, buscar directorios i18n
            for (const folder of vscodeWorkspaceFolders) {
                this.findI18nDirectoriesInFolder(folder.uri.fsPath, "", workspaceFolders);
            }
        } catch (error) {
            console.error('Error finding i18n directories:', error);
        }
        
        return workspaceFolders;
    }
    
    /**
     * Convierte una ruta relativa a absoluta usando la ruta base del espacio de trabajo
     * @param relativePath Ruta relativa (ej: "frontend/i18n")
     * @returns Ruta absoluta
     */
    public static resolveRelativePath(relativePath: string): string {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return relativePath;
            }
            return _path.join(workspaceFolder.uri.fsPath, relativePath);
        } catch (error) {
            console.error('Error resolving relative path:', error);
            return relativePath;
        }
    }

    /**
     * Busca recursivamente directorios i18n en una carpeta
     * @param basePath Ruta base de la carpeta
     * @param relativePath Ruta relativa dentro de la carpeta base
     * @param result Array donde se almacenarán los resultados
     */
    private static findI18nDirectoriesInFolder(basePath: string, relativePath: string, result: Array<{name: string, path: string}>): void {
        try {
            const currentPath = _path.join(basePath, relativePath);
            const items = EIJEFileSystem.readdirSync(currentPath);
            
            // Verificar si hay un directorio i18n en la ruta actual
            if (items.includes("i18n")) {
                const i18nPath = _path.join(currentPath, "i18n");
                const stats = EIJEFileSystem.statSync(i18nPath);
                
                if (stats.isDirectory()) {
                    // Verificar si hay archivos JSON en el directorio i18n
                    const i18nFiles = EIJEFileSystem.readdirSync(i18nPath);
                    const hasJsonFiles = i18nFiles.some(file => file.endsWith('.json'));
                    
                    if (hasJsonFiles) {
                        // Crear un nombre descriptivo para la carpeta
                        const displayPath = relativePath ? relativePath : "/";
                        // Usar ruta relativa en lugar de absoluta
                        const relativei18nPath = relativePath ? `${relativePath}/i18n` : "i18n";
                        result.push({
                            name: displayPath,
                            path: relativei18nPath
                        });
                    }
                }
            }
            
            // Buscar en subdirectorios (hasta 3 niveles de profundidad para evitar búsquedas muy largas)
            if (relativePath.split(_path.sep).length < 3) {
                for (const item of items) {
                    // Ignorar directorios ocultos y node_modules
                    if (item.startsWith('.') || item === 'node_modules') {
                        continue;
                    }
                    
                    const itemPath = _path.join(currentPath, item);
                    const stats = EIJEFileSystem.statSync(itemPath);
                    
                    if (stats.isDirectory()) {
                        const newRelativePath = relativePath ? _path.join(relativePath, item) : item;
                        this.findI18nDirectoriesInFolder(basePath, newRelativePath, result);
                    }
                }
            }
        } catch (error) {
            console.error(`Error searching in directory ${relativePath}:`, error);
        }
    }
    
    /**
     * Muestra un mensaje al usuario preguntando si desea crear un directorio i18n
     */
    private static showCreateI18nDirectoryPrompt(): void {
        // Utilizamos vscode.window.showInformationMessage para mostrar un mensaje con botones
        vscode.window.showInformationMessage(
            'No se encontraron directorios i18n en el proyecto. ¿Desea crear uno?',
            'Sí', 'No'
        ).then(selection => {
            if (selection === 'Sí') {
                this.createI18nDirectory();
            }
        });
    }
    
    /**
     * Crea un directorio i18n en la raíz del proyecto
     */
    private static createI18nDirectory(): void {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return;
            }
            
            const i18nPath = _path.join(workspaceFolder.uri.fsPath, 'i18n');
            
            // Crear el directorio i18n si no existe
            if (!EIJEFileSystem.existsSync(i18nPath)) {
                EIJEFileSystem.mkdirSync(i18nPath);
                
                // Crear un archivo en.json de ejemplo
                const enJsonPath = _path.join(i18nPath, 'en.json');
                EIJEFileSystem.writeFileSync(enJsonPath, JSON.stringify({
                    "WELCOME": "Welcome",
                    "HELLO": "Hello",
                    "GOODBYE": "Goodbye"
                }, null, 2));
                
                // Actualizar el archivo de configuración para incluir el nuevo directorio
                this.updateConfigWithNewI18nDirectory(i18nPath);
                
                // Mostrar mensaje de éxito
                vscode.window.showInformationMessage('Directorio i18n creado con éxito.');
            }
        } catch (error) {
            console.error('Error creating i18n directory:', error);
            vscode.window.showErrorMessage('Error al crear el directorio i18n.');
        }
    }
    
    /**
     * Actualiza el archivo de configuración para incluir el nuevo directorio i18n
     * @param i18nPath Ruta del directorio i18n creado
     */
    private static updateConfigWithNewI18nDirectory(i18nPath: string): void {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return;
            }
            
            const configPath = this.getConfigPath(workspaceFolder);
            if (!configPath || !EIJEFileSystem.existsSync(configPath)) {
                return;
            }
            
            // Leer el archivo de configuración
            const configContent = EIJEFileSystem.readFileSync(configPath);
            if (!configContent) {
                return;
            }
            
            const config = JSON.parse(configContent);
            
            // Agregar el nuevo directorio a workspaceFolders
            config.workspaceFolders = config.workspaceFolders || [];
            config.workspaceFolders.push({
                name: "/",
                path: i18nPath
            });
            
            // Establecer como directorio predeterminado
            config.defaultWorkspaceFolder = "/";
            
            // Guardar la configuración actualizada
            EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
            
            // Limpiar la caché de configuración
            this.clearConfigCache();
        } catch (error) {
            console.error('Error updating config with new i18n directory:', error);
        }
    }

    // Versión asíncrona para entorno web
    private static async getConfigPathAsync(workspaceFolder: vscode.WorkspaceFolder): Promise<string> {
        const vscodePath = _path.join(workspaceFolder.uri.fsPath, '.vscode');
        if (!(await EIJEFileSystem.exists(vscodePath))) {
            await EIJEFileSystem.mkdir(vscodePath);
        }
        return _path.join(vscodePath, '.ei18n-editor-config.json');
    }

    private static isWebEnvironment(): boolean {
        // Siempre retornamos false ya que solo funcionará en escritorio
        return false;
    }
    // Lista de códigos de idioma RTL (Right-to-Left)
    public static readonly RTL_LANGUAGES = [
        'ar', // Árabe
        'dv', // Divehi
        'fa', // Persa (Farsi)
        'he', // Hebreo
        'ks', // Cachemir
        'ku', // Kurdo
        'ps', // Pashto
        'sd', // Sindhi
        'ug', // Uigur
        'ur', // Urdu
        'yi'  // Yiddish
    ];
    
    /**
     * Verifica si un idioma es RTL (Right-to-Left)
     * @param language Código de idioma (ej. 'ar', 'he')
     * @returns true si el idioma es RTL, false en caso contrario
     */
    static isRTL(language: string): boolean {
        // Extraer código base del idioma (ej. 'ar-EG' -> 'ar')
        const baseLanguage = language.split('-')[0].toLowerCase();
        return this.RTL_LANGUAGES.includes(baseLanguage);
    }

    // Obtener una configuración específica del archivo local o global
    private static getConfigValue<T>(configName: string, globalSettingName: string, defaultValue: T): T {
        const cacheKey = `config_${configName}`;
        
        // Verificar caché primero
        if (this._configCache[cacheKey] !== undefined) {
            return this._configCache[cacheKey];
        }
        
        let value: T = defaultValue;
        
        const isWeb = this.isWebEnvironment();
        
        if (isWeb) {
            // En entorno web, intentar leer archivo local usando métodos asíncronos
            // pero como este método es síncrono, usar configuración global como fallback
            const globalValue = vscode.workspace.getConfiguration().get<T>(globalSettingName);
            value = globalValue !== undefined ? globalValue : defaultValue;
            
            // Intentar cargar configuración local de forma asíncrona en background
            this.loadConfigFromFileAsync(configName).then(fileValue => {
                if (fileValue !== undefined) {
                    this._configCache[cacheKey] = fileValue;
                }
            }).catch(() => {
                // Ignorar errores silenciosamente
            });
        } else {
            try {
                // Primero intentar leer del archivo de configuración local
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    const configPath = this.getConfigPath(workspaceFolder);
                    
                    if (configPath && EIJEFileSystem.existsSync(configPath)) {
                        const configContent = EIJEFileSystem.readFileSync(configPath);
                        if (configContent) {
                            const config = JSON.parse(configContent);
                            
                            if (config[configName] !== undefined) {
                                value = config[configName] as T;
                            } else {
                                // Si no está en el archivo local, usar configuración global
                                const globalValue = vscode.workspace.getConfiguration().get<T>(globalSettingName);
                                value = globalValue !== undefined ? globalValue : defaultValue;
                            }
                        } else {
                            // Si el archivo está vacío, usar configuración global
                            const globalValue = vscode.workspace.getConfiguration().get<T>(globalSettingName);
                            value = globalValue !== undefined ? globalValue : defaultValue;
                        }
                    } else {
                        // Si no hay archivo local, usar configuración global
                        const globalValue = vscode.workspace.getConfiguration().get<T>(globalSettingName);
                        value = globalValue !== undefined ? globalValue : defaultValue;
                    }
                }
            } catch (e) {
                console.error(`Error loading ${configName} from config file:`, e);
                // En caso de error, usar configuración global
                const globalValue = vscode.workspace.getConfiguration().get<T>(globalSettingName);
                value = globalValue !== undefined ? globalValue : defaultValue;
            }
        }
        
        // Guardar en caché
        this._configCache[cacheKey] = value;
        return value;
    }

    // Método auxiliar para cargar configuración de archivo de forma asíncrona
    private static async loadConfigFromFileAsync<T>(configName: string): Promise<T | undefined> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = await this.getConfigPathAsync(workspaceFolder);
                if (await EIJEFileSystem.exists(configPath)) {
                    const configContent = await EIJEFileSystem.readFile(configPath);
                    if (configContent) {
                        const config = JSON.parse(configContent);
                        return config[configName] as T;
                    }
                }
            }
        } catch (e) {
            console.error(`Error loading ${configName} from config file async:`, e);
        }
        return undefined;
    }

    // Versión asíncrona para entorno web
    private static async getConfigValueAsync<T>(configName: string, globalSettingName: string, defaultValue: T): Promise<T> {
        if (this.isWebEnvironment()) {
            // En entorno web, solo usar configuración global
            const value = vscode.workspace.getConfiguration().get<T>(globalSettingName);
            return value !== undefined ? value : defaultValue;
        }

        try {
            // Primero intentar leer del archivo de configuración local
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = await this.getConfigPathAsync(workspaceFolder);
                if (await EIJEFileSystem.exists(configPath)) {
                    const configContent = await EIJEFileSystem.readFile(configPath);
                    const config = JSON.parse(configContent);
                    if (config[configName] !== undefined) {
                        return config[configName] as T;
                    }
                }
            }
        } catch (e) {
            console.error(`Error loading ${configName} from config file:`, e);
        }
        
        // Si no se encuentra en el archivo local, usar la configuración global
        const value = vscode.workspace.getConfiguration().get<T>(globalSettingName);
        return value !== undefined ? value : defaultValue;
    }

    static get FORCE_KEY_UPPERCASE(): boolean {
        return this.getConfigValue<boolean>('forceKeyUPPERCASE', 'i18nJsonEditor.forceKeyUPPERCASE', true);
    }

    static get JSON_SPACE(): string | number {
        return this.getConfigValue<string | number>('jsonSpace', 'i18nJsonEditor.jsonSpace', 2);
    }

    static get KEY_SEPARATOR(): string | false {
        const value = this.getConfigValue<string | boolean>('keySeparator', 'i18nJsonEditor.keySeparator', '.');
        return value !== undefined && value !== true ? value : '.';
    }

    static get LINE_ENDING(): string {
        return this.getConfigValue<string>('lineEnding', 'i18nJsonEditor.lineEnding', '\n');
    }

    static get SUPPORTED_FOLDERS(): string[] {
        return this.getConfigValue<string[]>('supportedFolders', 'i18nJsonEditor.supportedFolders', ['i18n']);
    }
    
    static get TRANSLATION_SERVICE(): TranslationServiceEnum {
        return this.getConfigValue<TranslationServiceEnum>('translationService', 'i18nJsonEditor.translationService', 'Coming soon' as any);
    }

    static get TRANSLATION_SERVICE_API_KEY(): string {
        return this.getConfigValue<string>('translationServiceApiKey', 'i18nJsonEditor.translationServiceApiKey', 'Coming soon');
    }
    
    static get ALLOW_EMPTY_TRANSLATIONS(): boolean {
        return this.getConfigValue<boolean>('allowEmptyTranslations', 'i18nJsonEditor.allowEmptyTranslations', false);
    }

    static get DEFAULT_LANGUAGE(): string {
        return this.getConfigValue<string>('defaultLanguage', 'i18nJsonEditor.defaultLanguage', 'en');
    }

    static get VISIBLE_COLUMNS(): string[] {
        // Obtener la carpeta de trabajo actual
        const currentWorkspaceFolder = this.DEFAULT_WORKSPACE_FOLDER;
        
        // Si hay una carpeta de trabajo actual, intentar obtener las columnas visibles específicas para esa carpeta
        if (currentWorkspaceFolder) {
            // Obtener la configuración de workspaceFolders
            const workspaceFolders = this.getConfigValue<any[]>('workspaceFolders', 'i18nJsonEditor.workspaceFolders', []);
            
            // Buscar la carpeta actual en la configuración
            const folderConfig = workspaceFolders.find(f => f.name === currentWorkspaceFolder);
            
            // Si se encontró la carpeta y tiene configuración de columnas visibles, usarla
            if (folderConfig && folderConfig.visibleColumns) {
                return folderConfig.visibleColumns;
            }
            
            // Si no se encontró configuración específica, usar un array vacío
            return [];
        } else {
            // Si no hay carpeta de trabajo actual, usar la configuración global
            const result = this.getConfigValue<string[]>('visibleColumns', 'i18nJsonEditor.visibleColumns', []);
            return result;
        }
    }
    
    static get HIDDEN_COLUMNS(): string[] {
        // Obtener la carpeta de trabajo actual
        const currentWorkspaceFolder = this.DEFAULT_WORKSPACE_FOLDER;
        
        // Si hay una carpeta de trabajo actual, intentar obtener las columnas ocultas específicas para esa carpeta
        if (currentWorkspaceFolder) {
            // Obtener la configuración de workspaceFolders
            const workspaceFolders = this.getConfigValue<any[]>('workspaceFolders', 'i18nJsonEditor.workspaceFolders', []);
            
            // Buscar la carpeta actual en la configuración
            const folderConfig = workspaceFolders.find(f => f.name === currentWorkspaceFolder);
            
            // Si se encontró la carpeta y tiene configuración de columnas ocultas, usarla
            if (folderConfig && folderConfig.hiddenColumns) {
                return folderConfig.hiddenColumns;
            }
            
            // Si no se encontró configuración específica, usar un array vacío
            return [];
        } else {
            // Si no hay carpeta de trabajo actual, usar la configuración global
            const result = this.getConfigValue<string[]>('hiddenColumns', 'i18nJsonEditor.hiddenColumns', []);
            return result;
        }
    }
    
    // Guarda toda la configuración en el archivo local
    static saveFullConfiguration(): void {
        if (this.isWebEnvironment()) {
            // En entorno web, intentar guardar en archivo local usando métodos asíncronos
            this.saveFullConfigurationAsync().catch(() => {
                // Si falla, usar configuración global como fallback
                const config = vscode.workspace.getConfiguration();
                
                Promise.all([
                    config.update('i18nJsonEditor.forceKeyUPPERCASE', this.FORCE_KEY_UPPERCASE, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.jsonSpace', this.JSON_SPACE, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.keySeparator', this.KEY_SEPARATOR, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.lineEnding', this.LINE_ENDING, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.supportedFolders', this.SUPPORTED_FOLDERS, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.translationService', this.TRANSLATION_SERVICE, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.translationServiceApiKey', this.TRANSLATION_SERVICE_API_KEY, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.allowEmptyTranslations', this.ALLOW_EMPTY_TRANSLATIONS, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.defaultLanguage', this.DEFAULT_LANGUAGE, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.visibleColumns', this.VISIBLE_COLUMNS, vscode.ConfigurationTarget.Global),
                    config.update('i18nJsonEditor.hiddenColumns', this.HIDDEN_COLUMNS, vscode.ConfigurationTarget.Global)
                ]).catch(error => {
                    console.error('Error saving web configuration:', error);
                });
            });
            return;
        }
        
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = this.getConfigPath(workspaceFolder);
                let config: any = {};
                
                // Load existing config if it exists
                if (EIJEFileSystem.existsSync(configPath)) {
                    const configContent = EIJEFileSystem.readFileSync(configPath);
                    config = JSON.parse(configContent);
                }
                
                // Update all configuration values
                config.forceKeyUPPERCASE = this.FORCE_KEY_UPPERCASE;
                config.jsonSpace = this.JSON_SPACE;
                config.keySeparator = this.KEY_SEPARATOR;
                config.lineEnding = this.LINE_ENDING;
                config.supportedFolders = this.SUPPORTED_FOLDERS;
                config.translationService = this.TRANSLATION_SERVICE;
                config.translationServiceApiKey = this.TRANSLATION_SERVICE_API_KEY;
                config.allowEmptyTranslations = this.ALLOW_EMPTY_TRANSLATIONS;
                config.defaultLanguage = this.DEFAULT_LANGUAGE;
                config.defaultWorkspaceFolder = this.DEFAULT_WORKSPACE_FOLDER;
                
                // Asegurarse de que workspaceFolders existe
                config.workspaceFolders = config.workspaceFolders || [];
                
                // Si hay carpetas de trabajo configuradas, eliminar las configuraciones globales
                if (config.workspaceFolders.length > 0) {
                    // Eliminar las configuraciones globales si hay carpetas de trabajo
                    delete config.visibleColumns;
                    delete config.hiddenColumns;
                    
                    // Eliminar también las configuraciones específicas por carpeta en el nivel raíz
                    Object.keys(config).forEach(key => {
                        if (key.startsWith('visibleColumns_') || key.startsWith('hiddenColumns_')) {
                            delete config[key];
                        }
                    });
                    
                    // Obtener la carpeta de trabajo actual
                    const currentWorkspaceFolder = this.DEFAULT_WORKSPACE_FOLDER;
                    
                    // Guardar configuraciones específicas por carpeta si hay una carpeta seleccionada
                    if (currentWorkspaceFolder) {
                        // Buscar la carpeta actual en la configuración
                        const folderIndex = config.workspaceFolders.findIndex((f: any) => f.name === currentWorkspaceFolder);
                        
                        if (folderIndex >= 0) {
                            // Si se encontró la carpeta, actualizar su configuración
                            config.workspaceFolders[folderIndex].visibleColumns = this.VISIBLE_COLUMNS;
                            config.workspaceFolders[folderIndex].hiddenColumns = this.HIDDEN_COLUMNS;
                        }
                    }
                } else {
                    // Si no hay carpetas de trabajo configuradas, usar configuración global
                    config.visibleColumns = this.VISIBLE_COLUMNS;
                    config.hiddenColumns = this.HIDDEN_COLUMNS;
                }
                
                // Save config
                EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
            }
        } catch (e) {
            console.error('Error saving configuration:', e);
        }
    }

    // Versión asíncrona para entorno web
    static async saveFullConfigurationAsync(): Promise<void> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = await this.getConfigPathAsync(workspaceFolder);
                let config: any = {};
                
                // Load existing config if it exists
                if (await EIJEFileSystem.exists(configPath)) {
                    const configContent = await EIJEFileSystem.readFile(configPath);
                    if (configContent) {
                        config = JSON.parse(configContent);
                    }
                }
                
                // Update all configuration values
                config.forceKeyUPPERCASE = this.FORCE_KEY_UPPERCASE;
                config.jsonSpace = this.JSON_SPACE;
                config.keySeparator = this.KEY_SEPARATOR;
                config.lineEnding = this.LINE_ENDING;
                config.supportedFolders = this.SUPPORTED_FOLDERS;
                config.translationService = this.TRANSLATION_SERVICE;
                config.translationServiceApiKey = this.TRANSLATION_SERVICE_API_KEY;
                config.allowEmptyTranslations = this.ALLOW_EMPTY_TRANSLATIONS;
                config.defaultLanguage = this.DEFAULT_LANGUAGE;
                config.defaultWorkspaceFolder = this.DEFAULT_WORKSPACE_FOLDER;
                
                // Asegurarse de que workspaceFolders existe
                config.workspaceFolders = config.workspaceFolders || [];
                
                // Si hay carpetas de trabajo configuradas, eliminar las configuraciones globales
                if (config.workspaceFolders.length > 0) {
                    // Eliminar las configuraciones globales si hay carpetas de trabajo
                    delete config.visibleColumns;
                    delete config.hiddenColumns;
                    
                    // Eliminar también las configuraciones específicas por carpeta en el nivel raíz
                    Object.keys(config).forEach(key => {
                        if (key.startsWith('visibleColumns_') || key.startsWith('hiddenColumns_')) {
                            delete config[key];
                        }
                    });
                    
                    // Obtener la carpeta de trabajo actual
                    const currentWorkspaceFolder = this.DEFAULT_WORKSPACE_FOLDER;
                    
                    // Guardar configuraciones específicas por carpeta si hay una carpeta seleccionada
                    if (currentWorkspaceFolder) {
                        // Buscar la carpeta actual en la configuración
                        const folderIndex = config.workspaceFolders.findIndex((f: any) => f.name === currentWorkspaceFolder);
                        
                        if (folderIndex >= 0) {
                            // Si se encontró la carpeta, actualizar su configuración
                            config.workspaceFolders[folderIndex].visibleColumns = this.VISIBLE_COLUMNS;
                            config.workspaceFolders[folderIndex].hiddenColumns = this.HIDDEN_COLUMNS;
                        }
                    }
                } else {
                    // Si no hay carpetas de trabajo configuradas, usar configuración global
                    config.visibleColumns = this.VISIBLE_COLUMNS;
                    config.hiddenColumns = this.HIDDEN_COLUMNS;
                }
                
                // Save config
                await EIJEFileSystem.writeFile(configPath, JSON.stringify(config, null, 2));
            }
        } catch (e) {
            console.error('Error saving configuration async:', e);
            throw e; // Re-throw para que el catch en saveFullConfiguration funcione
        }
    }
    
    static async saveHiddenColumns(columns: string[]): Promise<void> {
        // Obtener la carpeta de trabajo actual
        const currentWorkspaceFolder = this.DEFAULT_WORKSPACE_FOLDER;
        
        // Limpiar caché para asegurar que se lea la configuración más reciente
        this.clearConfigCache('hiddenColumns');
        
        if (this.isWebEnvironment()) {
            // En entorno web, usar configuración global de VS Code
            if (currentWorkspaceFolder) {
                // Si hay una carpeta de trabajo actual, actualizar la configuración de workspaceFolders
                await this.updateWorkspaceFolderConfig(currentWorkspaceFolder, { hiddenColumns: columns });
            } else {
                // Si no hay carpeta de trabajo actual, actualizar la configuración global
                const config = vscode.workspace.getConfiguration();
                await config.update('i18nJsonEditor.hiddenColumns', columns, vscode.ConfigurationTarget.Global);
                // También actualizar el caché inmediatamente
                this._configCache['config_hiddenColumns'] = columns;
            }
            return;
        }
        
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = this.getConfigPath(workspaceFolder);
                if (configPath) {
                    let config: any = {};
                    
                    if (EIJEFileSystem.existsSync(configPath)) {
                        const configContent = EIJEFileSystem.readFileSync(configPath);
                        try {
                            config = JSON.parse(configContent);
                        } catch (parseError) {
                            console.error('Error parsing config file:', parseError);
                            // Si hay error al parsear, usar un objeto vacío
                            config = {};
                        }
                    }
                    
                    if (currentWorkspaceFolder) {
                        // Si hay una carpeta de trabajo actual, actualizar la configuración de workspaceFolders
                        config.workspaceFolders = config.workspaceFolders || [];
                        
                        // Buscar la carpeta actual en la configuración
                        const folderIndex = config.workspaceFolders.findIndex((f: any) => f.name === currentWorkspaceFolder);
                        
                        if (folderIndex >= 0) {
                            // Si se encontró la carpeta, actualizar su configuración
                            config.workspaceFolders[folderIndex].hiddenColumns = columns;
                        } else {
                            // Si no se encontró la carpeta, agregarla
                            config.workspaceFolders.push({
                                name: currentWorkspaceFolder,
                                hiddenColumns: columns
                            });
                        }
                        
                        // Si hay carpetas de trabajo configuradas, eliminar la configuración global
                        if (config.workspaceFolders.length > 0) {
                            delete config.hiddenColumns;
                        }
                    } else {
                        // Si no hay carpeta de trabajo actual, actualizar la configuración global
                        config.hiddenColumns = columns;
                    }
                    
                    // Guardar la configuración
                    EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
                    
                    // Actualizar el caché inmediatamente
                    if (currentWorkspaceFolder) {
                        // Actualizar el caché de workspaceFolders
                        this._configCache['config_workspaceFolders'] = config.workspaceFolders;
                    } else {
                        // Actualizar el caché de hiddenColumns
                        this._configCache['config_hiddenColumns'] = columns;
                    }
                }
            }
        } catch (e) {
            console.error('Error saving hidden columns:', e);
            throw e; // Propagar el error para manejarlo en el llamador
        }
    }
    
    static async saveVisibleColumns(columns: string[]): Promise<void> {
        // Obtener la carpeta de trabajo actual
        const currentWorkspaceFolder = this.DEFAULT_WORKSPACE_FOLDER;
        
        // Limpiar caché para asegurar que se lea la configuración más reciente
        this.clearConfigCache('visibleColumns');
        
        if (this.isWebEnvironment()) {
            // En entorno web, usar configuración global de VS Code
            if (currentWorkspaceFolder) {
                // Si hay una carpeta de trabajo actual, actualizar la configuración de workspaceFolders
                await this.updateWorkspaceFolderConfig(currentWorkspaceFolder, { visibleColumns: columns });
            } else {
                // Si no hay carpeta de trabajo actual, actualizar la configuración global
                const config = vscode.workspace.getConfiguration();
                await config.update('i18nJsonEditor.visibleColumns', columns, vscode.ConfigurationTarget.Global);
                // También actualizar el caché inmediatamente
                this._configCache['config_visibleColumns'] = columns;
            }
            return;
        }
        
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = this.getConfigPath(workspaceFolder);
                if (configPath) {
                    let config: any = {};
                    
                    if (EIJEFileSystem.existsSync(configPath)) {
                        const configContent = EIJEFileSystem.readFileSync(configPath);
                        try {
                            config = JSON.parse(configContent);
                        } catch (parseError) {
                            console.error('Error parsing config file:', parseError);
                            // Si hay error al parsear, usar un objeto vacío
                            config = {};
                        }
                    }
                    
                    if (currentWorkspaceFolder) {
                        // Si hay una carpeta de trabajo actual, actualizar la configuración de workspaceFolders
                        config.workspaceFolders = config.workspaceFolders || [];
                        
                        // Buscar la carpeta actual en la configuración
                        const folderIndex = config.workspaceFolders.findIndex((f: any) => f.name === currentWorkspaceFolder);
                        
                        if (folderIndex >= 0) {
                            // Si se encontró la carpeta, actualizar su configuración
                            config.workspaceFolders[folderIndex].visibleColumns = columns;
                        } else {
                            // Si no se encontró la carpeta, agregarla
                            config.workspaceFolders.push({
                                name: currentWorkspaceFolder,
                                visibleColumns: columns
                            });
                        }
                        
                        // Si hay carpetas de trabajo configuradas, eliminar la configuración global
                        if (config.workspaceFolders.length > 0) {
                            delete config.visibleColumns;
                        }
                    } else {
                        // Si no hay carpeta de trabajo actual, actualizar la configuración global
                        config.visibleColumns = columns;
                    }
                    
                    // Guardar la configuración
                    EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
                    
                    // Actualizar el caché inmediatamente
                    if (currentWorkspaceFolder) {
                        // Actualizar el caché de workspaceFolders
                        this._configCache['config_workspaceFolders'] = config.workspaceFolders;
                    } else {
                        // Actualizar el caché de visibleColumns
                        this._configCache['config_visibleColumns'] = columns;
                    }
                }
            }
        } catch (e) {
            console.error('Error saving visible columns:', e);
            throw e; // Propagar el error para manejarlo en el llamador
        }
    }
    
    // Método auxiliar para actualizar la configuración de una carpeta de trabajo específica
    private static async updateWorkspaceFolderConfig(folderName: string, configUpdate: any): Promise<void> {
        try {
            // Obtener la configuración actual
            const config = vscode.workspace.getConfiguration();
            const workspaceFolders = await config.get<any[]>('i18nJsonEditor.workspaceFolders') || [];
            
            // Buscar la carpeta en la configuración
            const folderIndex = workspaceFolders.findIndex((f: any) => f.name === folderName);
            
            if (folderIndex >= 0) {
                // Si se encontró la carpeta, actualizar su configuración
                const updatedFolders = [...workspaceFolders];
                updatedFolders[folderIndex] = {
                    ...updatedFolders[folderIndex],
                    ...configUpdate
                };
                
                // Guardar la configuración actualizada
                await config.update('i18nJsonEditor.workspaceFolders', updatedFolders, vscode.ConfigurationTarget.Global);
                
                // Actualizar el caché
                this._configCache['config_workspaceFolders'] = updatedFolders;
            }
        } catch (e) {
            console.error('Error updating workspace folder config:', e);
        }
    }

    static async saveDefaultWorkspaceFolder(folderName: string): Promise<void> {
        if (this.isWebEnvironment()) {
            // En entorno web, usar configuración local de archivo
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    const configPath = await this.getConfigPathAsync(workspaceFolder);
                    let config: any = {};
                    
                    if (await EIJEFileSystem.exists(configPath)) {
                        const configContent = await EIJEFileSystem.readFile(configPath);
                        if (configContent) {
                            config = JSON.parse(configContent);
                        }
                    }
                    
                    config.defaultWorkspaceFolder = folderName;
                    await EIJEFileSystem.writeFile(configPath, JSON.stringify(config, null, 2));
                    
                    // Actualizar el caché inmediatamente
                    this._configCache['config_defaultWorkspaceFolder'] = folderName;
                }
            } catch (e) {
                console.error('Error saving default workspace folder in web environment:', e);
            }
            return;
        }
        
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = this.getConfigPath(workspaceFolder);
                if (configPath) {
                    let config: any = {};
                    
                    if (EIJEFileSystem.existsSync(configPath)) {
                        const configContent = EIJEFileSystem.readFileSync(configPath);
                        config = JSON.parse(configContent);
                    }
                    
                    config.defaultWorkspaceFolder = folderName;
                    EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
                    
                    // Actualizar el caché inmediatamente
                    this._configCache['config_defaultWorkspaceFolder'] = folderName;
                }
            }
        } catch (e) {
            console.error('Error saving default workspace folder:', e);
        }
    }

    static get DEFAULT_WORKSPACE_FOLDER(): string {
        return this.getConfigValue<string>('defaultWorkspaceFolder', 'i18nJsonEditor.defaultWorkspaceFolder', '');
    }

    static get WORKSPACE_FOLDERS(): EIJEFolder[] {
        const folders = this.getConfigValue<EIJEFolder[]>('workspaceFolders', 'i18nJsonEditor.workspaceFolders', []);
        let workspaceFolder: vscode.WorkspaceFolder | undefined = vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
            return [];
        }

        const _folders: EIJEFolder[] = [];
        folders?.forEach(d => {
            // Verificar si la ruta es absoluta o relativa
            const isAbsolutePath = d.path.includes(':') || d.path.startsWith('/');
            
            if (isAbsolutePath) {
                // Si es una ruta absoluta, verificar que exista
                if (EIJEFileSystem.existsSync(d.path)) {
                    _folders.push({ name: d.name, path: d.path });
                }
            } else {
                // Si es una ruta relativa, verificar que exista la ruta absoluta correspondiente
                const absolutePath = _path.join(workspaceFolder.uri.fsPath, d.path);
                if (EIJEFileSystem.existsSync(absolutePath)) {
                    // Mantener la ruta relativa en la configuración
                    _folders.push({ name: d.name, path: d.path });
                }
            }
        });

        return _folders !== undefined ? _folders : [];
    }

    // Método para inicializar configuración de forma asíncrona en entorno web
    static async initializeConfigurationAsync(): Promise<void> {
        if (this.isWebEnvironment()) {
            try {
                // Intentar cargar configuración del archivo local
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    const configPath = await this.getConfigPathAsync(workspaceFolder);
                    
                    // Crear directorio .vscode si no existe
                    const vscodePath = _path.join(workspaceFolder.uri.fsPath, '.vscode');
                    if (!(await EIJEFileSystem.exists(vscodePath))) {
                        await EIJEFileSystem.mkdir(vscodePath);
                    }
                    
                    // Si el archivo no existe, crearlo con configuración por defecto
                    if (!(await EIJEFileSystem.exists(configPath))) {
                        const defaultConfig = {
                            allowEmptyTranslations: false,
                            defaultLanguage: "en",
                            forceKeyUPPERCASE: true,
                            jsonSpace: 2,
                            keySeparator: ".",
                            lineEnding: "\n",
                            supportedFolders: ["i18n"],
                            workspaceFolders: [],
                            defaultWorkspaceFolder: "",
                            translationService: "Coming soon",
                            translationServiceApiKey: "Coming soon",
                            visibleColumns: [],
                            hiddenColumns: []
                        };
                        
                        await EIJEFileSystem.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
                    }
                    
                    // Cargar configuración del archivo
                    const configContent = await EIJEFileSystem.readFile(configPath);
                    if (configContent) {
                        const config = JSON.parse(configContent);
                        
                        // Actualizar caché con valores del archivo
                        Object.keys(config).forEach(key => {
                            this._configCache[`config_${key}`] = config[key];
                        });
                    }
                }
            } catch (error) {
                console.error('Error initializing configuration async:', error);
            }
        }
    }
}

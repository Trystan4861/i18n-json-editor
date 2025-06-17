import * as vscode from 'vscode';
import * as _path from 'path';

import { EIJEFolder } from './models/eije-folder';
import { TranslationServiceEnum } from './services/eije-translation-service';
import { EIJEFileSystem } from './services/eije-filesystem';
import { I18nService } from '../i18n/i18n-service';
import { NotificationService } from './services/notification-service';

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
            console.log('Getting config path for workspace folder:', workspaceFolder.uri.fsPath);
            
            // Asegurar que el directorio .vscode existe
            const vscodePath = _path.join(workspaceFolder.uri.fsPath, '.vscode');
            console.log('VS Code path:', vscodePath);
            
            if (!EIJEFileSystem.existsSync(vscodePath)) {
                console.log('Creating .vscode directory');
                EIJEFileSystem.mkdirSync(vscodePath, { recursive: true });
            }
            
            const configPath = _path.join(vscodePath, '.ei18n-editor-config.json');
            console.log('Config path:', configPath);
            
            // Si el archivo no existe, crearlo con configuración por defecto SOLO UNA VEZ
            if (!EIJEFileSystem.existsSync(configPath)) {
                console.log('Config file does not exist');
                if (!this._configFileCreated) {
                    console.log('Creating default config file');
                    this.createDefaultConfigFile(configPath);
                    this._configFileCreated = true;
                } else {
                    console.log('Config file already created in this session, skipping creation');
                }
            } else {
                console.log('Config file already exists');
            }
            
            return configPath;
        } catch (error) {
            console.error('Error getting config path:', error);
            return '';
        }
    }
    
    private static createDefaultConfigFile(configPath: string): void {
        try {
            console.log('Creating default config file at:', configPath);
            
            // Verificar si estamos en modo desarrollo o producción
            const isDevelopment = process.env.NODE_ENV === 'development';
            console.log('Environment:', isDevelopment ? 'development' : 'production');
            
            // Buscar directorios i18n en el proyecto
            console.log('Searching for i18n directories...');
            const workspaceFolders = this.findI18nDirectories();
            
            console.log(`Found ${workspaceFolders.length} i18n directories:`, workspaceFolders);
            
            // Si no se encontraron carpetas, intentar buscar manualmente la carpeta src/i18n
            if (workspaceFolders.length === 0) {
                console.log('No i18n directories found, trying manual detection...');
                
                // Obtener la ruta raíz del proyecto
                const rootPath = vscode.workspace.rootPath || 
                    (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 
                        ? vscode.workspace.workspaceFolders[0].uri.fsPath : '');
                
                if (rootPath) {
                    console.log('Root path:', rootPath);
                    
                    // Verificar si existe la carpeta src/i18n
                    const srcI18nPath = _path.join(rootPath, 'src', 'i18n');
                    console.log('Checking src/i18n path:', srcI18nPath);
                    
                    if (EIJEFileSystem.existsSync(srcI18nPath)) {
                        console.log('src/i18n directory exists, adding to workspaceFolders');
                        workspaceFolders.push({
                            name: 'src',
                            path: 'src/i18n'
                        });
                    } else {
                        console.log('src/i18n directory does not exist');
                    }
                } else {
                    console.log('No root path found');
                }
            }
            
            // Determinar la carpeta de trabajo predeterminada
            let defaultWorkspaceFolder = "";
            if (workspaceFolders.length > 0) {
                defaultWorkspaceFolder = workspaceFolders[0].name;
                console.log('Default workspace folder:', defaultWorkspaceFolder);
            } else {
                console.log('No default workspace folder set');
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
                translationServiceApiKey: "Coming soon"
                // Las columnas visibles/ocultas ahora se manejan a nivel de cada carpeta de trabajo
            };
            
            console.log('Writing config file with:', defaultConfig);
            EIJEFileSystem.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
            console.log('Config file written successfully');
            
            // Si no se encontraron directorios i18n, mostrar un mensaje al usuario
            if (workspaceFolders.length === 0) {
                console.log('No i18n directories found, showing prompt to create one');
                this.showCreateI18nDirectoryPrompt();
            } else {
                console.log(`Found ${workspaceFolders.length} i18n directories, no need to show prompt`);
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
            console.log('Workspace folders:', vscodeWorkspaceFolders);
            
            // Forzar la detección de la carpeta src/i18n independientemente del espacio de trabajo
            // Esto es una solución temporal para asegurar que se detecte la carpeta
            const rootPath = vscode.workspace.rootPath || (vscodeWorkspaceFolders && vscodeWorkspaceFolders.length > 0 ? vscodeWorkspaceFolders[0].uri.fsPath : '');
            console.log('Root path:', rootPath);
            
            if (rootPath) {
                // Verificar si existe la carpeta src/i18n en la raíz del proyecto
                const srcI18nPath = _path.join(rootPath, 'src', 'i18n');
                console.log('Checking src/i18n path:', srcI18nPath);
                
                if (EIJEFileSystem.existsSync(srcI18nPath)) {
                    console.log('src/i18n directory exists');
                    try {
                        const stats = EIJEFileSystem.statSync(srcI18nPath);
                        if (stats.isDirectory()) {
                            // Verificar si hay archivos JSON
                            const i18nFiles = EIJEFileSystem.readdirSync(srcI18nPath);
                            console.log('Files in src/i18n:', i18nFiles);
                            const hasJsonFiles = i18nFiles.some(file => file.endsWith('.json'));
                            
                            if (hasJsonFiles) {
                                console.log('Found src/i18n directory with JSON files');
                                workspaceFolders.push({
                                    name: 'src',
                                    path: 'src/i18n'
                                });
                            }
                        }
                    } catch (error) {
                        console.error('Error checking src/i18n directory:', error);
                    }
                } else {
                    console.log('src/i18n directory does not exist');
                }
                
                // Intentar buscar cualquier carpeta i18n en el proyecto
                console.log('Searching for any i18n folder in the project');
                this.findAnyI18nFolder(rootPath, workspaceFolders);
            }
            
            // Continuar con la búsqueda normal si hay carpetas de espacio de trabajo
            if (vscodeWorkspaceFolders && vscodeWorkspaceFolders.length > 0) {
                console.log(`Searching for i18n directories in ${vscodeWorkspaceFolders.length} workspace folders`);
                
                // Para cada carpeta del espacio de trabajo, buscar directorios i18n
                for (const folder of vscodeWorkspaceFolders) {
                    console.log(`Searching in workspace folder: ${folder.uri.fsPath}`);
                    this.findI18nDirectoriesInFolder(folder.uri.fsPath, "", workspaceFolders);
                }
            } else {
                console.log('No workspace folders found in vscode.workspace.workspaceFolders');
            }
            
            console.log(`Found ${workspaceFolders.length} i18n directories:`, workspaceFolders);
        } catch (error) {
            console.error('Error finding i18n directories:', error);
        }
        
        return workspaceFolders;
    }
    
    /**
     * Busca cualquier carpeta i18n en el proyecto
     * @param rootPath Ruta raíz del proyecto
     * @param result Array donde se almacenarán los resultados
     */
    private static findAnyI18nFolder(rootPath: string, result: Array<{name: string, path: string}>): void {
        try {
            // Verificar si la carpeta i18n existe directamente en la raíz
            const i18nPath = _path.join(rootPath, 'i18n');
            if (EIJEFileSystem.existsSync(i18nPath) && EIJEFileSystem.statSync(i18nPath).isDirectory()) {
                const i18nFiles = EIJEFileSystem.readdirSync(i18nPath);
                const hasJsonFiles = i18nFiles.some(file => file.endsWith('.json'));
                
                if (hasJsonFiles) {
                    console.log('Found i18n directory in root with JSON files');
                    result.push({
                        name: '/',
                        path: 'i18n'
                    });
                    return;
                }
            }
            
            // Buscar en carpetas comunes
            const commonFolders = ['src', 'app', 'public', 'assets', 'locales'];
            for (const folder of commonFolders) {
                const folderPath = _path.join(rootPath, folder);
                if (EIJEFileSystem.existsSync(folderPath) && EIJEFileSystem.statSync(folderPath).isDirectory()) {
                    // Verificar si hay una carpeta i18n dentro
                    const i18nPath = _path.join(folderPath, 'i18n');
                    if (EIJEFileSystem.existsSync(i18nPath) && EIJEFileSystem.statSync(i18nPath).isDirectory()) {
                        const i18nFiles = EIJEFileSystem.readdirSync(i18nPath);
                        const hasJsonFiles = i18nFiles.some(file => file.endsWith('.json'));
                        
                        if (hasJsonFiles) {
                            console.log(`Found i18n directory in ${folder} with JSON files`);
                            result.push({
                                name: folder,
                                path: `${folder}/i18n`
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in findAnyI18nFolder:', error);
        }
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
                        
                        // Verificar si esta carpeta ya está en los resultados para evitar duplicados
                        const exists = result.some(folder => folder.path === relativei18nPath);
                        if (!exists) {
                            result.push({
                                name: displayPath,
                                path: relativei18nPath
                            });
                            console.log(`Found i18n directory: ${relativei18nPath}`);
                        }
                    }
                }
            }
            
            // También verificar si el directorio actual se llama "i18n"
            if (_path.basename(currentPath) === "i18n") {
                const stats = EIJEFileSystem.statSync(currentPath);
                
                if (stats.isDirectory()) {
                    // Verificar si hay archivos JSON en el directorio i18n
                    const i18nFiles = EIJEFileSystem.readdirSync(currentPath);
                    const hasJsonFiles = i18nFiles.some(file => file.endsWith('.json'));
                    
                    if (hasJsonFiles) {
                        // Crear un nombre descriptivo para la carpeta
                        const parentPath = _path.dirname(relativePath);
                        const displayPath = parentPath && parentPath !== "." ? parentPath : "/";
                        
                        // Usar ruta relativa en lugar de absoluta
                        const exists = result.some(folder => folder.path === relativePath);
                        if (!exists) {
                            result.push({
                                name: displayPath,
                                path: relativePath
                            });
                            console.log(`Found i18n directory (direct): ${relativePath}`);
                        }
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
                    
                    try {
                        const stats = EIJEFileSystem.statSync(itemPath);
                        
                        if (stats.isDirectory()) {
                            const newRelativePath = relativePath ? _path.join(relativePath, item) : item;
                            this.findI18nDirectoriesInFolder(basePath, newRelativePath, result);
                        }
                    } catch (error) {
                        // Ignorar errores al acceder a directorios específicos
                        console.error(`Error accessing directory ${itemPath}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error(`Error searching in directory ${relativePath}:`, error);
        }
    }
    
    /**
     * Busca todas las carpetas i18n en el proyecto
     * @param rootPath Ruta raíz del proyecto
     * @returns Array de objetos con información de las carpetas i18n encontradas
     */
    private static findAllI18nFolders(rootPath: string): EIJEFolder[] {
        console.log('Finding all i18n folders in:', rootPath);
        const result: EIJEFolder[] = [];
        
        try {
            // Buscar recursivamente en todas las carpetas
            this.findI18nFoldersRecursive(rootPath, '', result);
            
            console.log(`Found ${result.length} i18n folders:`, result);
        } catch (error) {
            console.error('Error finding i18n folders:', error);
        }
        
        return result;
    }
    
    /**
     * Busca recursivamente carpetas i18n en el proyecto
     * @param basePath Ruta base
     * @param relativePath Ruta relativa
     * @param result Array donde se almacenarán los resultados
     */
    private static findI18nFoldersRecursive(basePath: string, relativePath: string, result: EIJEFolder[]): void {
        try {
            const currentPath = relativePath ? _path.join(basePath, relativePath) : basePath;
            
            // Verificar si el directorio actual es una carpeta i18n
            if (_path.basename(currentPath) === 'i18n') {
                try {
                    // Verificar si hay archivos JSON en la carpeta
                    const files = EIJEFileSystem.readdirSync(currentPath);
                    const hasJsonFiles = files.some(file => file.endsWith('.json'));
                    
                    if (hasJsonFiles) {
                        // Determinar el nombre de la carpeta
                        const parentDir = _path.dirname(relativePath);
                        const displayName = parentDir && parentDir !== '.' ? parentDir : '/';
                        
                        // Verificar si esta carpeta ya está en los resultados
                        const exists = result.some(folder => folder.path === relativePath);
                        if (!exists) {
                            result.push({
                                name: displayName,
                                path: relativePath
                            });
                            console.log(`Found i18n folder: ${relativePath}`);
                        }
                        
                        // No seguir buscando en esta rama
                        return;
                    }
                } catch (error) {
                    console.error(`Error checking i18n folder ${currentPath}:`, error);
                }
            }
            
            // Buscar carpetas i18n en el directorio actual
            try {
                const items = EIJEFileSystem.readdirSync(currentPath);
                
                // Verificar si hay una carpeta i18n en el directorio actual
                if (items.includes('i18n')) {
                    const i18nPath = _path.join(currentPath, 'i18n');
                    
                    try {
                        const stats = EIJEFileSystem.statSync(i18nPath);
                        
                        if (stats.isDirectory()) {
                            // Verificar si hay archivos JSON en la carpeta
                            const files = EIJEFileSystem.readdirSync(i18nPath);
                            const hasJsonFiles = files.some(file => file.endsWith('.json'));
                            
                            if (hasJsonFiles) {
                                // Determinar el nombre de la carpeta
                                const displayName = relativePath || '/';
                                const relativei18nPath = relativePath ? `${relativePath}/i18n` : 'i18n';
                                
                                // Verificar si esta carpeta ya está en los resultados
                                const exists = result.some(folder => folder.path === relativei18nPath);
                                if (!exists) {
                                    result.push({
                                        name: displayName,
                                        path: relativei18nPath
                                    });
                                    console.log(`Found i18n folder: ${relativei18nPath}`);
                                }
                            }
                        }
                    } catch (error) {
                        console.error(`Error checking i18n folder ${i18nPath}:`, error);
                    }
                }
                
                // Buscar en subdirectorios (limitar la profundidad para evitar búsquedas muy largas)
                if (!relativePath || relativePath.split(_path.sep).length < 3) {
                    for (const item of items) {
                        // Ignorar directorios ocultos y node_modules
                        if (item.startsWith('.') || item === 'node_modules') {
                            continue;
                        }
                        
                        const itemPath = _path.join(currentPath, item);
                        
                        try {
                            const stats = EIJEFileSystem.statSync(itemPath);
                            
                            if (stats.isDirectory()) {
                                const newRelativePath = relativePath ? _path.join(relativePath, item) : item;
                                this.findI18nFoldersRecursive(basePath, newRelativePath, result);
                            }
                        } catch (error) {
                            // Ignorar errores al acceder a directorios específicos
                        }
                    }
                }
            } catch (error) {
                console.error(`Error reading directory ${currentPath}:`, error);
            }
        } catch (error) {
            console.error(`Error in findI18nFoldersRecursive for ${relativePath}:`, error);
        }
    }
    
    /**
     * Muestra un mensaje al usuario preguntando si desea crear un directorio i18n
     * @param panel Panel del webview para enviar el mensaje SweetAlert2
     */
    public static showCreateI18nDirectoryPrompt(panel?: vscode.WebviewPanel): void {
        // Obtener los textos del servicio de i18n
        const i18n = I18nService.getInstance();
        const title = i18n.t('ui.messages.noI18nFoldersFound');
        const text = i18n.t('ui.messages.createI18nFolder');
        
        if (panel) {
            // Si tenemos un panel webview, usamos SweetAlert2
            panel.webview.postMessage({
                command: 'showCreateI18nPrompt',
                title: title,
                text: text
            });
        } else {
            // Si no hay panel webview, usamos el diálogo nativo de VS Code
            vscode.window.showInformationMessage(
                `${title}. ${text}`,
                i18n.t('ui.buttons.yes', 'Sí'), 
                i18n.t('ui.buttons.no', 'No')
            ).then(selection => {
                if (selection === i18n.t('ui.buttons.yes', 'Sí')) {
                    this.createI18nDirectory();
                }
            });
        }
    }
    
    /**
     * Crea un directorio i18n en la ruta especificada o en la raíz del proyecto
     * @param customPath Ruta personalizada relativa a la raíz del proyecto (opcional)
     * @returns La ruta relativa del directorio i18n creado, o null si no se creó
     */
    public static createI18nDirectory(customPath?: string): string | null {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return null;
            }
            
            // Determinar la ruta donde se creará el directorio i18n
            let i18nParentPath = workspaceFolder.uri.fsPath;
            let relativePath = '';
            
            if (customPath) {
                // Eliminar "i18n" del final si está presente
                const cleanPath = customPath.endsWith('/i18n') || customPath.endsWith('\\i18n') 
                    ? customPath.slice(0, -5) 
                    : customPath;
                
                relativePath = cleanPath;
                i18nParentPath = _path.join(workspaceFolder.uri.fsPath, cleanPath);
                
                // Crear directorios intermedios si no existen
                if (!EIJEFileSystem.existsSync(i18nParentPath)) {
                    EIJEFileSystem.mkdirSync(i18nParentPath, { recursive: true });
                }
            }
            
            // Ruta completa al directorio i18n
            const i18nPath = _path.join(i18nParentPath, 'i18n');
            const relativei18nPath = relativePath ? `${relativePath}/i18n` : 'i18n';
            
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
                this.updateConfigWithNewI18nDirectory(relativei18nPath, relativePath || '/');
                
                // No mostramos mensaje aquí, lo mostrará el manager con Flashy
                
                return relativei18nPath;
            }
            
            return null;
        } catch (error) {
            console.error('Error creating i18n directory:', error);
            vscode.window.showErrorMessage('Error al crear el directorio i18n.');
            return null;
        }
    }
    
    /**
     * Actualiza el archivo de configuración para incluir el nuevo directorio i18n
     * @param i18nPath Ruta relativa al directorio i18n
     * @param displayName Nombre a mostrar para la carpeta (por defecto "/")
     */
    private static updateConfigWithNewI18nDirectory(i18nPath: string, displayName: string = "/"): void {
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
            
            // Verificar si ya existe una carpeta con el mismo nombre o ruta
            const existingFolderIndex = config.workspaceFolders.findIndex((f: any) => 
                f.name === displayName || f.path === i18nPath
            );
            
            if (existingFolderIndex >= 0) {
                // Actualizar la carpeta existente
                config.workspaceFolders[existingFolderIndex] = {
                    name: displayName,
                    path: i18nPath,
                    visibleColumns: config.workspaceFolders[existingFolderIndex].visibleColumns || [],
                    hiddenColumns: config.workspaceFolders[existingFolderIndex].hiddenColumns || []
                };
            } else {
                // Agregar nueva carpeta
                config.workspaceFolders.push({
                    name: displayName,
                    path: i18nPath,
                    visibleColumns: [],
                    hiddenColumns: []
                });
            }
            
            // Establecer como directorio predeterminado si no hay uno configurado
            if (!config.defaultWorkspaceFolder) {
                config.defaultWorkspaceFolder = displayName;
            }
            
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
    
    static async saveWorkspaceFolders(folders: Array<{name: string, path: string}>): Promise<void> {
        if (this.isWebEnvironment()) {
            // En entorno web, usar configuración local de archivo
            try {
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (workspaceFolder) {
                    const configPath = await this.getConfigPathAsync(workspaceFolder);
                    let config: any = {};
                    
                    if (await EIJEFileSystem.exists(configPath)) {
                        const configContent = await EIJEFileSystem.readFile(configPath);
                        config = JSON.parse(configContent.toString());
                    }
                    
                    // Actualizar las carpetas de trabajo
                    config.workspaceFolders = folders;
                    
                    // Guardar la configuración actualizada
                    await EIJEFileSystem.writeFile(configPath, JSON.stringify(config, null, 2));
                    
                    // Actualizar el caché
                    this._configCache['config_workspaceFolders'] = folders;
                }
            } catch (e) {
                console.error('Error saving workspace folders:', e);
            }
        } else {
            // En entorno de escritorio, usar configuración de VS Code
            try {
                const config = vscode.workspace.getConfiguration();
                await config.update('i18nJsonEditor.workspaceFolders', folders, vscode.ConfigurationTarget.Global);
                
                // Actualizar el caché
                this._configCache['config_workspaceFolders'] = folders;
            } catch (e) {
                console.error('Error saving workspace folders:', e);
            }
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
        console.log('Getting WORKSPACE_FOLDERS');
        
        // Obtener carpetas de la configuración
        const folders = this.getConfigValue<EIJEFolder[]>('workspaceFolders', 'i18nJsonEditor.workspaceFolders', []);
        console.log('Folders from config:', folders);
        
        let workspaceFolder: vscode.WorkspaceFolder | undefined = vscode.workspace.workspaceFolders?.[0];
        console.log('Workspace folder:', workspaceFolder?.uri.fsPath);

        if (!workspaceFolder) {
            console.log('No workspace folder found, returning empty array');
            return [];
        }

        // Si no hay carpetas en la configuración, buscar carpetas i18n en el proyecto
        if (!folders || folders.length === 0) {
            console.log('No folders in config, searching for i18n directories');
            
            // Buscar todas las carpetas i18n en el proyecto
            const foundFolders = this.findAllI18nFolders(workspaceFolder.uri.fsPath);
            console.log('Found i18n folders:', foundFolders);
            
            if (foundFolders.length > 0) {
                // Normalizar las carpetas encontradas (eliminar duplicados y normalizar rutas)
                const normalizedFolders = this.normalizeI18nFolders(foundFolders);
                console.log('Normalized i18n folders:', normalizedFolders);
                
                // Actualizar la configuración con las carpetas encontradas
                const configPath = this.getConfigPath(workspaceFolder);
                if (configPath && EIJEFileSystem.existsSync(configPath)) {
                    try {
                        const configContent = EIJEFileSystem.readFileSync(configPath);
                        if (configContent) {
                            const config = JSON.parse(configContent);
                            
                            // Agregar las carpetas encontradas a la configuración
                            config.workspaceFolders = [];
                            
                            for (const folder of normalizedFolders) {
                                config.workspaceFolders.push({
                                    name: folder.name,
                                    path: folder.path,
                                    visibleColumns: [],
                                    hiddenColumns: []
                                });
                            }
                            
                            // Establecer la primera carpeta como predeterminada
                            if (!config.defaultWorkspaceFolder && normalizedFolders.length > 0) {
                                config.defaultWorkspaceFolder = normalizedFolders[0].name;
                            }
                            
                            // Guardar la configuración actualizada
                            EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
                            console.log('Updated config with found i18n folders');
                            
                            // Limpiar la caché de configuración
                            this.clearConfigCache();
                        }
                    } catch (error) {
                        console.error('Error updating config with found i18n folders:', error);
                    }
                }
                
                // Devolver las carpetas encontradas normalizadas
                return normalizedFolders;
            }
        }

        // Verificar las carpetas de la configuración
        const _folders: EIJEFolder[] = [];
        
        // Normalizar las carpetas de la configuración
        if (folders && folders.length > 0) {
            // Primero, normalizar las rutas (convertir todas las barras invertidas a barras normales)
            const normalizedFolders = folders.map(folder => ({
                ...folder,
                path: folder.path.replace(/\\/g, '/')
            }));
            
            // Eliminar duplicados basados en la ruta normalizada
            const uniqueFolders = this.removeDuplicateFolders(normalizedFolders);
            
            // Verificar que las carpetas existan
            for (const folder of uniqueFolders) {
                // Verificar si la ruta es absoluta o relativa
                const isAbsolutePath = folder.path.includes(':') || folder.path.startsWith('/');
                
                if (isAbsolutePath) {
                    // Si es una ruta absoluta, verificar que exista
                    if (EIJEFileSystem.existsSync(folder.path)) {
                        console.log(`Folder exists (absolute path): ${folder.path}`);
                        _folders.push(folder);
                    } else {
                        console.log(`Folder does not exist (absolute path): ${folder.path}`);
                    }
                } else {
                    // Si es una ruta relativa, verificar que exista la ruta absoluta correspondiente
                    const absolutePath = _path.join(workspaceFolder.uri.fsPath, folder.path);
                    if (EIJEFileSystem.existsSync(absolutePath)) {
                        console.log(`Folder exists (relative path): ${folder.path} -> ${absolutePath}`);
                        // Mantener la ruta relativa en la configuración
                        _folders.push(folder);
                    } else {
                        console.log(`Folder does not exist (relative path): ${folder.path} -> ${absolutePath}`);
                    }
                }
            }
        }

        console.log('Returning folders:', _folders);
        return _folders;
    }
    
    /**
     * Normaliza las carpetas i18n encontradas
     * @param folders Carpetas i18n encontradas
     * @returns Carpetas i18n normalizadas
     */
    private static normalizeI18nFolders(folders: EIJEFolder[]): EIJEFolder[] {
        if (!folders || folders.length === 0) {
            return [];
        }
        
        // Normalizar las rutas (convertir todas las barras invertidas a barras normales)
        const normalizedFolders = folders.map(folder => ({
            name: folder.name,
            path: folder.path.replace(/\\/g, '/')
        }));
        
        // Eliminar duplicados
        return this.removeDuplicateFolders(normalizedFolders);
    }
    
    /**
     * Elimina carpetas duplicadas basadas en la ruta
     * @param folders Carpetas a procesar
     * @returns Carpetas sin duplicados
     */
    private static removeDuplicateFolders(folders: EIJEFolder[]): EIJEFolder[] {
        const uniquePaths = new Map<string, EIJEFolder>();
        
        // Usar un Map para mantener solo una entrada por ruta
        for (const folder of folders) {
            const normalizedPath = folder.path.toLowerCase();
            
            // Si la carpeta ya existe y tiene configuración adicional, preservarla
            if (uniquePaths.has(normalizedPath)) {
                const existingFolder = uniquePaths.get(normalizedPath)!;
                
                // Preservar visibleColumns y hiddenColumns si existen
                if (folder.visibleColumns && !existingFolder.visibleColumns) {
                    existingFolder.visibleColumns = folder.visibleColumns;
                }
                
                if (folder.hiddenColumns && !existingFolder.hiddenColumns) {
                    existingFolder.hiddenColumns = folder.hiddenColumns;
                }
            } else {
                // Si la carpeta no existe, agregarla
                uniquePaths.set(normalizedPath, { ...folder });
            }
        }
        
        return Array.from(uniquePaths.values());
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

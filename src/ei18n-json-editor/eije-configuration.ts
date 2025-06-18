import * as vscode from 'vscode';
import * as _path from 'path';

import { EIJEFolder } from './models/eije-folder';
import { TranslationServiceEnum } from './services/eije-translation-service';
import { EIJEFileSystem } from './services/eije-filesystem';
import { I18nService } from '../i18n/i18n-service';
import { NotificationService } from './services/notification-service';
import { EnvironmentUtils } from '../utils/environment-utils';

/**
 * Opciones para la búsqueda de carpetas i18n
 */
interface I18nFolderSearchOptions {
    /** Buscar en carpetas comunes predefinidas (src, app, public, etc.) */
    searchCommonFolders?: boolean;
    /** Buscar específicamente en src/i18n */
    checkSrcI18n?: boolean;
    /** Buscar en todas las carpetas del workspace */
    searchWorkspaceFolders?: boolean;
    /** Profundidad máxima de búsqueda recursiva */
    maxDepth?: number;
    /** Directorios a ignorar durante la búsqueda */
    ignoreDirs?: string[];
    /** Tipo de resultado (simple o folder) */
    resultType?: 'simple' | 'folder';
    /** Ruta base para la búsqueda (si no se especifica, se usa la raíz del workspace) */
    basePath?: string;
    /** Ruta relativa dentro de la ruta base (para búsquedas específicas) */
    relativePath?: string;
    /** Verificar si el directorio actual es una carpeta i18n */
    checkCurrentDir?: boolean;
    /** Resultado donde se almacenarán las carpetas encontradas (para acumular resultados) */
    result?: Array<{name: string, path: string}> | EIJEFolder[];
}

export class EIJEConfiguration {
    private static _configCache: { [key: string]: any } = {};
    private static _configFileCreated: boolean = false;
    
    static clearConfigCache(specificKey?: string): void {
        if (specificKey) {
            delete this._configCache[`config_${specificKey}`];
        } else {
            this._configCache = {};
        }
    }
    
    private static getConfigPath(workspaceFolder: vscode.WorkspaceFolder): string {
        try {
            const vscodePath = _path.join(workspaceFolder.uri.fsPath, '.vscode');
            
            if (!EIJEFileSystem.existsSync(vscodePath)) {
                EIJEFileSystem.mkdirSync(vscodePath, { recursive: true });
            }
            
            const configPath = _path.join(vscodePath, '.ei18n-editor-config.json');
            
            if (!EIJEFileSystem.existsSync(configPath)) {
                if (!this._configFileCreated) {
                    this.createDefaultConfigFile(configPath);
                    this._configFileCreated = true;
                }
            }
            
            return configPath;
        } catch (error) {
            console.error('Error getting config path:', error);
            return '';
        }
    }
    
    private static createDefaultConfigFile(configPath: string): void {
        try {
            const isDevelopment = process.env.NODE_ENV === 'development';
            
            const workspaceFolders = this.findI18nFolders({
                searchCommonFolders: true,
                checkSrcI18n: true,
                searchWorkspaceFolders: true,
                maxDepth: 3
            }) as Array<{name: string, path: string}>;
            
            if (workspaceFolders.length === 0) {
                const rootPath = vscode.workspace.rootPath || 
                    (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 
                        ? vscode.workspace.workspaceFolders[0].uri.fsPath : '');
                
                if (rootPath) {
                    const deepSearchResults = this.findI18nFolders({
                        basePath: rootPath,
                        searchCommonFolders: true,
                        checkSrcI18n: true,
                        searchWorkspaceFolders: false,
                        maxDepth: 5,
                        ignoreDirs: ['.git', 'node_modules', '.vscode', 'dist', 'build', 'out', 'coverage']
                    }) as Array<{name: string, path: string}>;
                    
                    if (deepSearchResults.length > 0) {
                        deepSearchResults.forEach(result => {
                            workspaceFolders.push(result);
                        });
                    }
                }
            }
            
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
                translationServiceApiKey: "Coming soon"
            };
            
            EIJEFileSystem.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
            
            if (workspaceFolders.length === 0) {
                this.showCreateI18nDirectoryPrompt();
            }
        } catch (error) {
            console.error('Error creating default config file:', error);
        }
    }
    


    /**
     * Método unificado para buscar carpetas i18n con opciones configurables
     * @param options Opciones de búsqueda
     * @returns Array de objetos con información de los directorios i18n encontrados
     */
    /**
     * Cache para almacenar resultados de búsquedas previas de carpetas i18n
     * Clave: combinación de parámetros de búsqueda, Valor: resultados encontrados
     */
    private static i18nFoldersCache: Map<string, Array<{name: string, path: string}>> = new Map();
    
    /**
     * Método unificado para buscar carpetas i18n con opciones configurables y caché
     * @param options Opciones de búsqueda
     * @returns Array de objetos con información de los directorios i18n encontrados
     */
    private static findI18nFolders(options: I18nFolderSearchOptions = {}): Array<{name: string, path: string}> | EIJEFolder[] {
        // Valores por defecto
        const defaultOptions: I18nFolderSearchOptions = {
            searchCommonFolders: true,
            checkSrcI18n: true,
            searchWorkspaceFolders: true,
            maxDepth: 3,
            ignoreDirs: ['.git', 'node_modules', '.vscode', 'dist', 'build', 'out', 'coverage'],
            resultType: 'simple',
            checkCurrentDir: false
        };
        
        // Combinar opciones por defecto con las proporcionadas
        const opts = { ...defaultOptions, ...options };
        
        // Si se proporciona un resultado existente, no usar caché
        if (opts.result) {
            return this.findI18nFoldersInternal(opts);
        }
        
        // Generar una clave única para esta combinación de opciones
        const cacheKey = JSON.stringify({
            basePath: opts.basePath || 'default',
            relativePath: opts.relativePath || '',
            searchCommonFolders: opts.searchCommonFolders,
            checkSrcI18n: opts.checkSrcI18n,
            searchWorkspaceFolders: opts.searchWorkspaceFolders,
            maxDepth: opts.maxDepth,
            resultType: opts.resultType
        });
        
        // Verificar si tenemos resultados en caché para estas opciones
        if (this.i18nFoldersCache.has(cacheKey)) {
            const cachedResult = this.i18nFoldersCache.get(cacheKey) || [];
            
            // Convertir el resultado al tipo solicitado si es necesario
            if (opts.resultType === 'folder') {
                return cachedResult.map(item => ({
                    name: item.name,
                    path: item.path
                })) as EIJEFolder[];
            }
            
            return [...cachedResult]; // Devolver una copia para evitar modificaciones accidentales
        }
        
        // Si no está en caché, realizar la búsqueda
        const result = this.findI18nFoldersInternal(opts);
        
        // Almacenar en caché solo si no es un resultado proporcionado externamente
        if (!opts.result && Array.isArray(result)) {
            this.i18nFoldersCache.set(cacheKey, [...result]);
        }
        
        return result;
    }
    
    /**
     * Implementación interna del método findI18nFolders sin caché
     * @param opts Opciones de búsqueda
     * @returns Array de objetos con información de los directorios i18n encontrados
     */
    private static findI18nFoldersInternal(opts: I18nFolderSearchOptions): Array<{name: string, path: string}> | EIJEFolder[] {
        // Resultado unificado (usar el proporcionado o crear uno nuevo)
        const result: Array<{name: string, path: string}> = opts.result as Array<{name: string, path: string}> || [];
        
        try {
            // Obtener todas las carpetas del espacio de trabajo
            const vscodeWorkspaceFolders = vscode.workspace.workspaceFolders;
            
            // Determinar la ruta base
            let basePath = opts.basePath;
            if (!basePath) {
                basePath = vscode.workspace.rootPath || 
                    (vscodeWorkspaceFolders && vscodeWorkspaceFolders.length > 0 ? 
                    vscodeWorkspaceFolders[0].uri.fsPath : '');
            }
            
            // Si se proporciona una ruta relativa, construir la ruta completa
            const currentPath = opts.relativePath ? 
                _path.join(basePath, opts.relativePath) : basePath;
            
            // Verificar si el directorio actual es una carpeta i18n
            if (opts.checkCurrentDir && _path.basename(currentPath) === 'i18n') {
                this.checkI18nDirectory(basePath, opts.relativePath || '', result);
            }
            
            if (basePath) {
                // Verificar src/i18n si está habilitada la opción (caso común)
                if (opts.checkSrcI18n) {
                    this.checkSpecificI18nPath(basePath, 'src', 'i18n', result);
                }
                
                // Buscar en carpetas comunes si está habilitada la opción
                if (opts.searchCommonFolders) {
                    this.searchCommonI18nFolders(basePath, result);
                }
                
                // Si se proporciona una ruta relativa, buscar en esa ubicación específica
                if (opts.relativePath) {
                    // Optimización: Primero verificar si la ruta contiene 'i18n' antes de buscar recursivamente
                    if (opts.relativePath.includes('i18n')) {
                        this.searchI18nFoldersRecursive(
                            basePath, 
                            opts.relativePath, 
                            result, 
                            opts.maxDepth,
                            opts.ignoreDirs
                        );
                    }
                }
            }
            
            // Buscar en todas las carpetas del workspace si está habilitada la opción
            if (opts.searchWorkspaceFolders && vscodeWorkspaceFolders && vscodeWorkspaceFolders.length > 0) {
                // Optimización: Limitar la profundidad de búsqueda en carpetas del workspace
                const workspaceMaxDepth = Math.min(opts.maxDepth, 3);
                
                for (const folder of vscodeWorkspaceFolders) {
                    // Optimización: Primero buscar en ubicaciones comunes antes de hacer búsqueda recursiva
                    if (opts.checkSrcI18n) {
                        this.checkSpecificI18nPath(folder.uri.fsPath, 'src', 'i18n', result);
                    }
                    
                    if (opts.searchCommonFolders) {
                        this.searchCommonI18nFolders(folder.uri.fsPath, result);
                    }
                    
                    // Búsqueda recursiva con profundidad limitada
                    this.searchI18nFoldersRecursive(
                        folder.uri.fsPath, 
                        "", 
                        result, 
                        workspaceMaxDepth,
                        opts.ignoreDirs
                    );
                }
            }
        } catch (error) {
            console.error('Error finding i18n directories:', error);
        }
        
        // Convertir el resultado al tipo solicitado si es necesario
        if (opts.resultType === 'folder') {
            return result.map(item => ({
                name: item.name,
                path: item.path
            })) as EIJEFolder[];
        }
        
        return result;
    }
    
    /**
     * Verifica si un directorio es una carpeta i18n válida (contiene archivos JSON)
     * @param basePath Ruta base
     * @param relativePath Ruta relativa
     * @param result Array donde se almacenarán los resultados
     * @returns true si es una carpeta i18n válida, false en caso contrario
     */
    private static checkI18nDirectory(
        basePath: string, 
        relativePath: string, 
        result: Array<{name: string, path: string}>
    ): boolean {
        try {
            const currentPath = relativePath ? _path.join(basePath, relativePath) : basePath;
            
            // Verificar si es un directorio
            const stats = EIJEFileSystem.statSync(currentPath);
            if (!stats.isDirectory()) {
                return false;
            }
            
            // Verificar si hay archivos JSON
            const files = EIJEFileSystem.readdirSync(currentPath);
            const hasJsonFiles = files.some(file => file.endsWith('.json'));
            
            if (hasJsonFiles) {
                // Determinar el nombre de la carpeta
                const parentDir = relativePath ? _path.dirname(relativePath) : '';
                const displayName = parentDir && parentDir !== '.' ? parentDir : '/';
                
                // Verificar si esta carpeta ya está en los resultados para evitar duplicados
                const exists = result.some(folder => folder.path === relativePath);
                if (!exists) {
                    result.push({
                        name: displayName,
                        path: relativePath
                    });
                }
                return true;
            }
        } catch (error) {
            console.error(`Error checking i18n directory ${relativePath}:`, error);
        }
        
        return false;
    }
    
    /**
     * Verifica si existe una carpeta i18n en una ruta específica
     * @param rootPath Ruta raíz
     * @param parentDir Directorio padre (ej: 'src')
     * @param i18nDirName Nombre del directorio i18n (normalmente 'i18n')
     * @param result Array donde se almacenarán los resultados
     */
    private static checkSpecificI18nPath(
        rootPath: string, 
        parentDir: string, 
        i18nDirName: string, 
        result: Array<{name: string, path: string}>
    ): void {
        // Construir la ruta relativa
        const relativePath = parentDir ? `${parentDir}/${i18nDirName}` : i18nDirName;
        
        // Usar el método unificado con opciones específicas
        this.findI18nFolders({
            basePath: rootPath,
            relativePath: relativePath,
            searchCommonFolders: false,
            checkSrcI18n: false,
            searchWorkspaceFolders: false,
            checkCurrentDir: true,
            result: result
        });
    }
    
    /**
     * Busca carpetas i18n en ubicaciones comunes del proyecto
     * @param rootPath Ruta raíz del proyecto
     * @param result Array donde se almacenarán los resultados
     */
    private static searchCommonI18nFolders(rootPath: string, result: Array<{name: string, path: string}>): void {
        try {
            const commonFolders = ['src', 'app', 'public', 'assets', 'locales'];
            for (const folder of commonFolders) {
                // Usar el método unificado para cada carpeta común
                this.findI18nFolders({
                    basePath: rootPath,
                    relativePath: folder + '/i18n',
                    searchCommonFolders: false,
                    checkSrcI18n: false,
                    searchWorkspaceFolders: false,
                    checkCurrentDir: true,
                    result: result
                });
            }
        } catch (error) {
            console.error('Error in searchCommonI18nFolders:', error);
        }
    }
    
    /**
     * Busca directorios i18n en el proyecto
     * @returns Array de objetos con información de los directorios i18n encontrados
     */
    private static findI18nDirectories(): Array<{name: string, path: string}> {
        // Usar el método unificado con las opciones por defecto
        return this.findI18nFolders({
            searchCommonFolders: true,
            checkSrcI18n: true,
            searchWorkspaceFolders: true
        }) as Array<{name: string, path: string}>;
    }
    
    /**
     * Busca cualquier carpeta i18n en el proyecto
     * @param rootPath Ruta raíz del proyecto
     * @param result Array donde se almacenarán los resultados
     */
    private static findAnyI18nFolder(rootPath: string, result: Array<{name: string, path: string}>): void {
        // Usar el método unificado con opciones específicas
        this.findI18nFolders({
            basePath: rootPath,
            searchCommonFolders: true,
            checkSrcI18n: false,
            searchWorkspaceFolders: false,
            result: result,
            checkCurrentDir: true
        });
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
     * @param maxDepth Profundidad máxima de búsqueda
     * @param ignoreDirs Directorios a ignorar
     */
    private static searchI18nFoldersRecursive(
        basePath: string, 
        relativePath: string, 
        result: Array<{name: string, path: string}>,
        maxDepth: number = 3,
        ignoreDirs: string[] = ['.git', 'node_modules', '.vscode', 'dist', 'build']
    ): void {
        // Usar el método unificado con opciones específicas
        this.findI18nFolders({
            basePath: basePath,
            relativePath: relativePath,
            searchCommonFolders: false,
            checkSrcI18n: false,
            searchWorkspaceFolders: false,
            maxDepth: maxDepth,
            ignoreDirs: ignoreDirs,
            checkCurrentDir: true,
            result: result
        });
    }
    
    /**
     * Método de compatibilidad para mantener el API existente
     * @param basePath Ruta base de la carpeta
     * @param relativePath Ruta relativa dentro de la carpeta base
     * @param result Array donde se almacenarán los resultados
     */
    private static findI18nDirectoriesInFolder(basePath: string, relativePath: string, result: Array<{name: string, path: string}>): void {
        // Usar el método unificado con opciones específicas
        this.findI18nFolders({
            basePath: basePath,
            relativePath: relativePath,
            searchCommonFolders: false,
            checkSrcI18n: false,
            searchWorkspaceFolders: false,
            maxDepth: 3,
            ignoreDirs: ['.git', 'node_modules', '.vscode', 'dist', 'build'],
            result: result
        });
    }
    
    /**
     * Busca todas las carpetas i18n en el proyecto
     * @param rootPath Ruta raíz del proyecto
     * @returns Array de objetos con información de las carpetas i18n encontradas
     */
    private static findAllI18nFolders(rootPath: string): EIJEFolder[] {
        // Usar el método unificado con opciones específicas
        return this.findI18nFolders({
            basePath: rootPath,
            searchCommonFolders: true,
            checkSrcI18n: true,
            searchWorkspaceFolders: false,
            maxDepth: 4,
            ignoreDirs: ['.git', 'node_modules', '.vscode', 'dist', 'build'],
            resultType: 'folder'
        }) as EIJEFolder[];
    }
    
    /**
     * Busca recursivamente carpetas i18n en el proyecto con optimizaciones de rendimiento
     * @param basePath Ruta base
     * @param relativePath Ruta relativa
     * @param result Array donde se almacenarán los resultados
     * @param maxDepth Profundidad máxima de búsqueda
     * @param ignoreDirs Directorios a ignorar
     */
    private static findI18nFoldersRecursive(
        basePath: string, 
        relativePath: string, 
        result: Array<{name: string, path: string}> | EIJEFolder[],
        maxDepth: number = 3,
        ignoreDirs: string[] = ['.git', 'node_modules', '.vscode', 'dist', 'build', 'out', 'coverage']
    ): void {
        // Control de profundidad para evitar búsquedas excesivas
        const depth = relativePath.split(_path.sep).filter(Boolean).length;
        if (depth > maxDepth) {
            return;
        }
        
        try {
            const currentPath = relativePath ? _path.join(basePath, relativePath) : basePath;
            
            // Verificar si el directorio actual es una carpeta i18n
            if (_path.basename(currentPath) === 'i18n') {
                this.checkI18nDirectory(basePath, relativePath, result as Array<{name: string, path: string}>);
                // No seguir buscando en esta rama si ya es una carpeta i18n
                return;
            }
            
            try {
                // Leer el contenido del directorio
                const items = EIJEFileSystem.readdirSync(currentPath);
                
                if (!items || items.length === 0) {
                    return;
                }
                
                // Optimización: Primero buscar si hay un directorio 'i18n' directamente
                if (items.includes('i18n')) {
                    const newRelativePath = relativePath ? _path.join(relativePath, 'i18n') : 'i18n';
                    const i18nPath = _path.join(currentPath, 'i18n');
                    
                    try {
                        const stats = EIJEFileSystem.statSync(i18nPath);
                        if (stats.isDirectory()) {
                            this.checkI18nDirectory(basePath, newRelativePath, result as Array<{name: string, path: string}>);
                        }
                    } catch (error) {
                        // Ignorar errores al acceder al directorio i18n
                    }
                }
                
                // Procesar otros subdirectorios solo si no hemos alcanzado la profundidad máxima
                if (depth < maxDepth) {
                    // Filtrar directorios a procesar
                    const dirsToProcess = items.filter(item => 
                        !item.startsWith('.') && 
                        !ignoreDirs.includes(item) && 
                        !item.includes('.') // Heurística simple para evitar archivos
                    );
                    
                    for (const item of dirsToProcess) {
                        const itemPath = _path.join(currentPath, item);
                        
                        try {
                            const stats = EIJEFileSystem.statSync(itemPath);
                            
                            if (stats.isDirectory()) {
                                const newRelativePath = relativePath ? _path.join(relativePath, item) : item;
                                
                                // Llamada recursiva directa en lugar de usar findI18nFolders para evitar sobrecarga
                                this.findI18nFoldersRecursive(
                                    basePath,
                                    newRelativePath,
                                    result,
                                    maxDepth,
                                    ignoreDirs
                                );
                            }
                        } catch (error) {
                            // Ignorar errores al acceder a directorios específicos
                        }
                    }
                }
            } catch (error) {
                // Ignorar errores de lectura de directorios para continuar con la búsqueda
            }
        } catch (error) {
            // Ignorar errores generales para continuar con la búsqueda
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
        const cachedValue = this.getConfigFromCache<T>(cacheKey);
        if (cachedValue !== undefined) {
            return cachedValue;
        }
        
        let value: T;
        
        const isWeb = EnvironmentUtils.isWebEnvironment();
        
        if (isWeb) {
            // En entorno web, usar configuración global y cargar archivo en background
            value = this.getConfigFromGlobalSettings<T>(globalSettingName, defaultValue);
            
            // Intentar cargar configuración local de forma asíncrona en background
            this.loadConfigFromFileAsync(configName).then(fileValue => {
                if (fileValue !== undefined) {
                    this._configCache[cacheKey] = fileValue;
                }
            }).catch(() => {
                // Ignorar errores silenciosamente
            });
        } else {
            // En entorno de escritorio, intentar leer del archivo primero
            value = this.getConfigFromFile<T>(configName, globalSettingName, defaultValue);
        }
        
        // Guardar en caché
        this._configCache[cacheKey] = value;
        return value;
    }
    
    /**
     * Obtiene un valor de configuración desde la caché
     * @param cacheKey Clave de caché a buscar
     * @returns El valor en caché o undefined si no existe
     */
    private static getConfigFromCache<T>(cacheKey: string): T | undefined {
        return this._configCache[cacheKey];
    }
    
    /**
     * Obtiene un valor de configuración desde el archivo local
     * @param configName Nombre de la configuración en el archivo
     * @param globalSettingName Nombre de la configuración en la configuración global
     * @param defaultValue Valor por defecto si no se encuentra
     * @returns El valor de configuración
     */
    private static getConfigFromFile<T>(configName: string, globalSettingName: string, defaultValue: T): T {
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
                            return config[configName] as T;
                        }
                    }
                }
            }
            
            // Si no se encuentra en el archivo, usar configuración global
            return this.getConfigFromGlobalSettings<T>(globalSettingName, defaultValue);
        } catch (e) {
            console.error(`Error loading ${configName} from config file:`, e);
            // En caso de error, usar configuración global
            return this.getConfigFromGlobalSettings<T>(globalSettingName, defaultValue);
        }
    }
    
    /**
     * Obtiene un valor de configuración desde la configuración global de VS Code
     * @param globalSettingName Nombre de la configuración en la configuración global
     * @param defaultValue Valor por defecto si no se encuentra
     * @returns El valor de configuración
     */
    private static getConfigFromGlobalSettings<T>(globalSettingName: string, defaultValue: T): T {
        const globalValue = vscode.workspace.getConfiguration().get<T>(globalSettingName);
        return globalValue !== undefined ? globalValue : defaultValue;
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
    
    // Guarda la configuración en el archivo local
    private static saveConfigToFile(configPath: string, config: any): void {
        try {
            EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('Error writing configuration file:', error);
            throw error;
        }
    }

    // Actualiza la configuración de una carpeta de trabajo específica en el objeto de configuración local
    private static updateLocalWorkspaceFolderConfig(config: any): void {
        // Asegurarse de que workspaceFolders existe
        config.workspaceFolders = config.workspaceFolders || [];
        
        if (config.workspaceFolders.length > 0) {
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
    }

    // Elimina configuraciones antiguas o redundantes
    private static cleanupLegacyConfig(config: any): void {
        if (config.workspaceFolders && config.workspaceFolders.length > 0) {
            // Eliminar las configuraciones globales si hay carpetas de trabajo
            delete config.visibleColumns;
            delete config.hiddenColumns;
            
            // Eliminar también las configuraciones específicas por carpeta en el nivel raíz
            Object.keys(config).forEach(key => {
                if (key.startsWith('visibleColumns_') || key.startsWith('hiddenColumns_')) {
                    delete config[key];
                }
            });
        }
    }

    // Guarda toda la configuración en el archivo local
    static saveFullConfiguration(): void {
        
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
                
                // Limpiar configuraciones antiguas
                this.cleanupLegacyConfig(config);
                
                // Actualizar configuración de carpeta de trabajo en el objeto local
                this.updateLocalWorkspaceFolderConfig(config);
                
                // Guardar configuración en archivo
                this.saveConfigToFile(configPath, config);
            }
        } catch (e) {
            console.error('Error saving configuration:', e);
        }
    }


    
    /**
     * Método genérico para guardar la configuración de columnas (visibles u ocultas)
     * @param columnType Tipo de columnas ('visibleColumns' o 'hiddenColumns')
     * @param columns Array de columnas a guardar
     */
    static async saveColumnConfig(columnType: 'visibleColumns' | 'hiddenColumns', columns: string[]): Promise<void> {
        // Obtener la carpeta de trabajo actual
        const currentWorkspaceFolder = this.DEFAULT_WORKSPACE_FOLDER;
        
        // Limpiar caché para asegurar que se lea la configuración más reciente
        this.clearConfigCache(columnType);
        
        // Nota: Se ha eliminado el código para entorno web ya que isWebEnvironment() siempre devuelve false
        
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
                            config.workspaceFolders[folderIndex][columnType] = columns;
                        } else {
                            // Si no se encontró la carpeta, agregarla
                            const newFolder: any = {
                                name: currentWorkspaceFolder
                            };
                            newFolder[columnType] = columns;
                            config.workspaceFolders.push(newFolder);
                        }
                        
                        // Si hay carpetas de trabajo configuradas, eliminar la configuración global
                        if (config.workspaceFolders.length > 0) {
                            delete config[columnType];
                        }
                    } else {
                        // Si no hay carpeta de trabajo actual, actualizar la configuración global
                        config[columnType] = columns;
                    }
                    
                    // Guardar la configuración
                    EIJEFileSystem.writeFileSync(configPath, JSON.stringify(config, null, 2));
                    
                    // Actualizar el caché inmediatamente
                    if (currentWorkspaceFolder) {
                        // Actualizar el caché de workspaceFolders
                        this._configCache['config_workspaceFolders'] = config.workspaceFolders;
                    } else {
                        // Actualizar el caché del tipo de columna específico
                        this._configCache[`config_${columnType}`] = columns;
                    }
                }
            }
        } catch (e) {
            console.error(`Error saving ${columnType}:`, e);
            throw e; // Propagar el error para manejarlo en el llamador
        }
    }
    
    /**
     * Guarda la configuración de columnas ocultas
     * @param columns Array de columnas ocultas
     */
    static async saveHiddenColumns(columns: string[]): Promise<void> {
        return this.saveColumnConfig('hiddenColumns', columns);
    }
    
    /**
     * Guarda la configuración de columnas visibles
     * @param columns Array de columnas visibles
     */
    static async saveVisibleColumns(columns: string[]): Promise<void> {
        return this.saveColumnConfig('visibleColumns', columns);
    }
    
    // Nota: Se ha eliminado el método updateWorkspaceFolderConfigAsync ya que era código muerto
    // debido a que isWebEnvironment() siempre devuelve false
    
    static async saveWorkspaceFolders(folders: Array<{name: string, path: string}>): Promise<void> {
        // Nota: Se ha eliminado el bloque condicional para entorno web ya que isWebEnvironment() siempre devuelve false
        
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

    static async saveDefaultWorkspaceFolder(folderName: string): Promise<void> {
        // Nota: Se ha eliminado el bloque condicional para entorno web ya que isWebEnvironment() siempre devuelve false
        
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
        // Obtener carpetas de la configuración
        const folders = this.getConfigValue<EIJEFolder[]>('workspaceFolders', 'i18nJsonEditor.workspaceFolders', []);
        
        let workspaceFolder: vscode.WorkspaceFolder | undefined = vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
            return [];
        }

        // Si no hay carpetas en la configuración, buscar carpetas i18n en el proyecto
        if (!folders || folders.length === 0) {
            // Buscar todas las carpetas i18n en el proyecto
            const foundFolders = this.findAllI18nFolders(workspaceFolder.uri.fsPath);
            
            if (foundFolders.length > 0) {
                // Normalizar las carpetas encontradas (eliminar duplicados y normalizar rutas)
                const normalizedFolders = this.normalizeI18nFolders(foundFolders);
                
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
                        _folders.push(folder);
                    }
                } else {
                    // Si es una ruta relativa, verificar que exista la ruta absoluta correspondiente
                    const absolutePath = _path.join(workspaceFolder.uri.fsPath, folder.path);
                    if (EIJEFileSystem.existsSync(absolutePath)) {
                        // Mantener la ruta relativa en la configuración
                        _folders.push(folder);
                    }
                }
            }
        }

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

    // Método simplificado para inicializar configuración
    static async initializeConfigurationAsync(): Promise<void> {
        // Este método se mantiene para compatibilidad con código existente
        // pero ya no contiene lógica específica para entorno web
        // ya que isWebEnvironment() siempre devuelve false
    }
}

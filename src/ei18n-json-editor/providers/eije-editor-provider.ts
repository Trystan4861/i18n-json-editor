import * as vscode from 'vscode';
import * as _path from 'path';
import { EIJEFileSystem } from '../services/eije-filesystem';

import { EIJEConfiguration } from '../eije-configuration';
import { EIJEManager } from '../eije-manager';
import { I18nService } from '../../i18n/i18n-service';
import { NotificationService } from '../services/notification-service';
import { EnvironmentUtils } from '../../utils/environment-utils';

export class EIJEEditorProvider {
    // Referencia estática para rastrear el panel activo
    private static currentPanel: vscode.WebviewPanel | undefined;
    private static currentManager: EIJEManager | undefined;

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const i18n = I18nService.getInstance(context);
        
        // Función para verificar si una carpeta es soportada (síncrona)
        const isSupportedFolder = (folderPath: string): boolean => {
            if (!vscode.workspace.workspaceFolders) {
                return false;
            }
            
            for (const workspaceFolder of vscode.workspace.workspaceFolders) {
                const rootPath = workspaceFolder.uri.fsPath;
                
                for (const supportedFolder of EIJEConfiguration.SUPPORTED_FOLDERS) {
                    
                    // Verificar por nombre de carpeta - usar lógica más robusta para entorno web
                    let folderBaseName: string;
                    let relativePath: string;
                    
                    if (EnvironmentUtils.isWebEnvironment()) {
                        // En entorno web, manejar las rutas manualmente
                        const normalizedFolderPath = folderPath.replace(/\\/g, '/');
                        const normalizedRootPath = rootPath.replace(/\\/g, '/');
                        
                        // Extraer el nombre base de la carpeta
                        const pathParts = normalizedFolderPath.split('/');
                        folderBaseName = pathParts[pathParts.length - 1];
                        
                        // Calcular la ruta relativa
                        if (normalizedFolderPath.startsWith(normalizedRootPath)) {
                            relativePath = normalizedFolderPath.substring(normalizedRootPath.length + 1);
                        } else {
                            relativePath = normalizedFolderPath;
                        }
                    } else {
                        // En entorno desktop, usar las funciones normales de path
                        folderBaseName = _path.basename(folderPath);
                        relativePath = _path.relative(rootPath, folderPath);
                    }
                    
                    if (folderBaseName === supportedFolder) {
                        return true;
                    }
                    
                    // Si la ruta relativa es exactamente el nombre de la carpeta soportada
                    if (relativePath === supportedFolder) {
                        return true;
                    }
                    
                    // Verificar por ruta relativa
                    if (supportedFolder.includes('/') || supportedFolder.includes('\\')) {
                        const cleanPath = supportedFolder.replace(/^\.?[\/\\]/, ''); // Remover ./ o / inicial
                        const expectedPath = _path.join(rootPath, cleanPath);
                        
                        if (_path.resolve(folderPath) === _path.resolve(expectedPath)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        // Función asíncrona para verificar si una carpeta es soportada (para entorno web)
        const isSupportedFolderAsync = async (folderPath: string): Promise<boolean> => {
            if (!vscode.workspace.workspaceFolders) {
                return false;
            }
            
            for (const workspaceFolder of vscode.workspace.workspaceFolders) {
                const rootPath = workspaceFolder.uri.fsPath;
                
                for (const supportedFolder of EIJEConfiguration.SUPPORTED_FOLDERS) {
                    
                    // Verificar por nombre de carpeta - usar lógica más robusta para entorno web
                    let folderBaseName: string;
                    let relativePath: string;
                    
                    if (EnvironmentUtils.isWebEnvironment()) {
                        // En entorno web, manejar las rutas manualmente
                        const normalizedFolderPath = folderPath.replace(/\\/g, '/');
                        const normalizedRootPath = rootPath.replace(/\\/g, '/');
                        
                        // Extraer el nombre base de la carpeta
                        const pathParts = normalizedFolderPath.split('/');
                        folderBaseName = pathParts[pathParts.length - 1];
                        
                        // Calcular la ruta relativa
                        if (normalizedFolderPath.startsWith(normalizedRootPath)) {
                            relativePath = normalizedFolderPath.substring(normalizedRootPath.length + 1);
                        } else {
                            relativePath = normalizedFolderPath;
                        }
                    } else {
                        // En entorno desktop, usar las funciones normales de path
                        folderBaseName = _path.basename(folderPath);
                        relativePath = _path.relative(rootPath, folderPath);
                    }
                    
                    if (folderBaseName === supportedFolder) {
                        // Verificar que la carpeta realmente existe
                        const exists = await EIJEFileSystem.exists(folderPath);
                        if (exists) {
                            return true;
                        }
                    }
                    
                    // Si la ruta relativa es exactamente el nombre de la carpeta soportada
                    if (relativePath === supportedFolder) {
                        const exists = await EIJEFileSystem.exists(folderPath);
                        if (exists) {
                            return true;
                        }
                    }
                    
                    // Verificar por ruta relativa
                    if (supportedFolder.includes('/') || supportedFolder.includes('\\')) {
                        const cleanPath = supportedFolder.replace(/^\.?[\/\\]/, ''); // Remover ./ o / inicial
                        const expectedPath = _path.join(rootPath, cleanPath);
                        
                        if (_path.resolve(folderPath) === _path.resolve(expectedPath)) {
                            // Verificar que la carpeta realmente existe
                            const exists = await EIJEFileSystem.exists(folderPath);
                            if (exists) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        };
        
        // Listener para cambios en la selección del explorador
        const updateContextMenu = () => {
            // Por defecto, mostrar el menú contextual para todas las carpetas
            // La lógica de verificación se hará en el comando
            vscode.commands.executeCommand('setContext', 'ext:showContextMenu', true);
        };
        
        // Actualizar contexto inicialmente
        updateContextMenu();
        
        // Listener para cambios en la configuración
        const configListener = vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('i18nJsonEditor.supportedFolders')) {
                updateContextMenu();
            }
        });
        
        context.subscriptions.push(configListener);

        return vscode.commands.registerCommand('ei18n-json-editor', async (uri: vscode.Uri) => {
            // Determinar la ruta de la carpeta
            let folderPath = null;
            
            if (!uri && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
                
                // Buscar carpetas soportadas tanto por nombre como por ruta relativa
                for (const supportedFolder of EIJEConfiguration.SUPPORTED_FOLDERS) {
                    let testPath: string;
                    
                    if (supportedFolder.includes('/') || supportedFolder.includes('\\')) {
                        // Es una ruta relativa (ej: "src/i18n", "./src/i18n", "/src/i18n")
                        const cleanPath = supportedFolder.replace(/^\.?[\/\\]/, ''); // Remover ./ o / inicial
                        testPath = _path.join(rootPath, cleanPath);
                    } else {
                        // Es solo un nombre de carpeta (ej: "i18n")
                        testPath = _path.join(rootPath, supportedFolder);
                    }
                    
                    // Usar método síncrono ya que estamos en entorno de escritorio
                    const exists = EIJEFileSystem.existsSync(testPath);
                    
                    if (exists) {
                        folderPath = testPath;
                        break;
                    }
                }
            } else if (uri) {
                // Verificar si la carpeta seleccionada es soportada
                const isSupported = isSupportedFolder(uri.fsPath);
                
                if (isSupported) {
                    folderPath = uri.fsPath;
                } else {
                    // Si no es una carpeta soportada, mostrar mensaje de error
                    NotificationService.getInstance().showErrorMessage(
                        i18n.t('ui.messages.unsupportedFolder', _path.basename(uri.fsPath))
                    );
                    return;
                }
            }

            // Si ya existe un panel, enfocarlo en lugar de crear uno nuevo
            if (EIJEEditorProvider.currentPanel) {
                EIJEEditorProvider.currentPanel.reveal(vscode.ViewColumn.One);
                // Opcionalmente, actualizar el contenido si la carpeta ha cambiado
                if (folderPath && folderPath !== EIJEEditorProvider.currentManager?.getFolderPath()) {
                    EIJEEditorProvider.currentManager?.updateFolderPath(folderPath);
                }
                return;
            }

            // Si no existe, crear un nuevo panel
            const panel = vscode.window.createWebviewPanel(
                'ei18n-json-editor',
                i18n.t('extension.title'),
                vscode.ViewColumn.One,
                {
                    retainContextWhenHidden: true,
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(_path.join(context.extensionPath, 'media'))]
                }
            );

            // Crear y guardar el manager
            const manager = new EIJEManager(context, panel, folderPath);
            EIJEEditorProvider.currentPanel = panel;
            EIJEEditorProvider.currentManager = manager;

            // Cuando el panel se cierra, borrar las referencias
            panel.onDidDispose(() => {
                EIJEEditorProvider.currentPanel = undefined;
                EIJEEditorProvider.currentManager = undefined;
            });
        });
    }

    constructor(private readonly _context: vscode.ExtensionContext) {}
}
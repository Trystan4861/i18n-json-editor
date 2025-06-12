import * as vscode from 'vscode';
import * as _path from 'path';
import * as fs from 'fs';

import { EIJEConfiguration } from '../eije-configuration';
import { EIJEManager } from '../eije-manager';
import { I18nService } from '../../i18n/i18n-service';

export class EIJEEditorProvider {
    // Referencia estática para rastrear el panel activo
    private static currentPanel: vscode.WebviewPanel | undefined;
    private static currentManager: EIJEManager | undefined;

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const i18n = I18nService.getInstance(context);
        
        // Función para verificar si una carpeta es soportada
        const isSupportedFolder = (folderPath: string): boolean => {
            if (!vscode.workspace.workspaceFolders) {
                return false;
            }
            
            for (const workspaceFolder of vscode.workspace.workspaceFolders) {
                const rootPath = workspaceFolder.uri.fsPath;
                
                for (const supportedFolder of EIJEConfiguration.SUPPORTED_FOLDERS) {
                    // Verificar por nombre de carpeta
                    if (_path.basename(folderPath) === supportedFolder) {
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

        return vscode.commands.registerCommand('ei18n-json-editor', (uri: vscode.Uri) => {
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
                    
                    if (fs.existsSync(testPath)) {
                        folderPath = testPath;
                        break;
                    }
                }
            } else if (uri) {
                // Verificar si la carpeta seleccionada es soportada
                if (isSupportedFolder(uri.fsPath)) {
                    folderPath = uri.fsPath;
                } else {
                    // Si no es una carpeta soportada, mostrar mensaje de error
                    vscode.window.showErrorMessage(
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

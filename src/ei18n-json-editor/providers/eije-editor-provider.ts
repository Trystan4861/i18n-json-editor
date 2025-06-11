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
        vscode.commands.executeCommand('setContext', 'ext:supportedFolders', EIJEConfiguration.SUPPORTED_FOLDERS);
        const i18n = I18nService.getInstance(context);

        return vscode.commands.registerCommand('ei18n-json-editor', (uri: vscode.Uri) => {
            // Determinar la ruta de la carpeta
            let folderPath = null;
            if (!uri && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
                const i18nPath = _path.join(rootPath, 'i18n');
                if (fs.existsSync(i18nPath)) {
                    folderPath = i18nPath;
                }
            } else if (uri) {
                folderPath = uri.fsPath;
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

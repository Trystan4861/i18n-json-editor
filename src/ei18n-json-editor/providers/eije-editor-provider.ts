import * as vscode from 'vscode';
import * as _path from 'path';
import * as fs from 'fs';

import { IJEConfiguration } from '../eije-configuration';
import { IJEManager } from '../eije-manager';
import { I18nService } from '../../i18n/i18n-service';

export class IJEEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        vscode.commands.executeCommand('setContext', 'ext:supportedFolders', IJEConfiguration.SUPPORTED_FOLDERS);
        const i18n = I18nService.getInstance(context);

        return vscode.commands.registerCommand('i18n-json-editor', (uri: vscode.Uri) => {
            const panel = vscode.window.createWebviewPanel('i18n-json-editor', i18n.t('extension.title'), vscode.ViewColumn.One, {
                retainContextWhenHidden: true,
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(_path.join(context.extensionPath, 'media'))]
            });

            // Si no se proporciona URI y hay carpetas de trabajo, usar la carpeta i18n en la raíz
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

            const manager = new IJEManager(context, panel, folderPath);
        });
    }

    constructor(private readonly _context: vscode.ExtensionContext) {}
}

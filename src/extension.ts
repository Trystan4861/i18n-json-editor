import * as vscode from 'vscode';
import * as _path from 'path';

import { IJEEditorProvider } from './i18n-json-editor/providers/ije-editor-provider';
import { IJEConfiguration } from './i18n-json-editor/ije-configuration';
import { I18nService } from './i18n/i18n-service';

export function activate(context: vscode.ExtensionContext) {
    // Initialize the i18n service
    const i18n = I18nService.getInstance(context);
    
    // Set language based on VS Code UI language
    const vscodeLanguage = vscode.env.language;
    if (vscodeLanguage.startsWith('es')) {
        i18n.setLanguage('es');
    } else {
        i18n.setLanguage('en');
    }

    if (IJEConfiguration.WORKSPACE_FOLDERS) {
        let myStatusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        myStatusBarItem.command = 'i18n-json-editor';
        myStatusBarItem.text = `$(symbol-string) ${i18n.t('extension.statusBar')}`;
        myStatusBarItem.show();
    }

    context.subscriptions.push(IJEEditorProvider.register(context));
}

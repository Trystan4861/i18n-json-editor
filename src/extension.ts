import * as vscode from 'vscode';
import * as _path from 'path';

import { EIJEEditorProvider } from './ei18n-json-editor/providers/eije-editor-provider';
import { EIJEConfiguration } from './ei18n-json-editor/eije-configuration';
import { I18nService } from './i18n/i18n-service';

export async function activate(context: vscode.ExtensionContext) {
    // Initialize the i18n service
    const i18n = I18nService.getInstance(context);
    
    // Wait for translations to load
    await i18n.waitForLoad();
    
    // Set language based on VS Code UI language
    const vscodeLanguage = vscode.env.language;
    if (vscodeLanguage.startsWith('es')) {
        i18n.setLanguage('es');
    } else {
        i18n.setLanguage('en');
    }

    // Crear el elemento de la barra de estado
    let myStatusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    myStatusBarItem.command = 'ei18n-json-editor';
    myStatusBarItem.text = `$(symbol-string) ${i18n.t('extension.statusBar')}`;
    myStatusBarItem.show();
    context.subscriptions.push(myStatusBarItem);

    // Registrar un comando para abrir el editor directamente desde la barra de actividad
    const openFromActivityBarCommand = vscode.commands.registerCommand('ei18n-json-editor.openFromActivityBar', () => {
        vscode.commands.executeCommand('ei18n-json-editor');
    });
    
    context.subscriptions.push(openFromActivityBarCommand);
    
    // Configurar el contexto para mostrar el menú contextual
    vscode.commands.executeCommand('setContext', 'ext:showContextMenu', true);
    
    // Registrar el proveedor del editor
    context.subscriptions.push(EIJEEditorProvider.register(context));
    
    // Cuando se hace clic en el icono de la barra de actividad, abrir el editor directamente
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('trystan4861-eije-view', {
        resolveWebviewView: () => {
            // Abrir el editor directamente
            vscode.commands.executeCommand('ei18n-json-editor');
        }
    }));
}

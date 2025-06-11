import * as vscode from 'vscode';
import * as _path from 'path';

import { EIJEEditorProvider } from './ei18n-json-editor/providers/eije-editor-provider';
import { EIJEConfiguration } from './ei18n-json-editor/eije-configuration';
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

    if (EIJEConfiguration.WORKSPACE_FOLDERS) {
        let myStatusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        myStatusBarItem.command = 'ei18n-json-editor';
        myStatusBarItem.text = `$(symbol-string) ${i18n.t('extension.statusBar')}`;
        myStatusBarItem.show();
    }

    // Al hacer clic en el icono de la barra de actividad, queremos que se abra directamente el editor
    // Mantenemos un TreeDataProvider mínimo para mostrar algo en la vista
    class SimpleTreeDataProvider implements vscode.TreeDataProvider<string> {
        private _onDidChangeTreeData: vscode.EventEmitter<string | undefined | null | void> = new vscode.EventEmitter<string | undefined | null | void>();
        readonly onDidChangeTreeData: vscode.Event<string | undefined | null | void> = this._onDidChangeTreeData.event;
        
        getTreeItem(element: string): vscode.TreeItem {
            return new vscode.TreeItem(element, vscode.TreeItemCollapsibleState.None);
        }
        
        getChildren(element?: string): Thenable<string[]> {
            if (element) {
                return Promise.resolve([]);
            }
            return Promise.resolve([i18n.t('extension.openingEditor')]);
        }
    }
    
    const treeView = vscode.window.createTreeView('trystan4861-eije-view', { 
        treeDataProvider: new SimpleTreeDataProvider(),
        showCollapseAll: false
    });
    
    // Cuando la vista se vuelve visible, automáticamente abrir el editor
    treeView.onDidChangeVisibility(e => {
        if (e.visible) {
            // Pequeño retraso para asegurar que todo esté listo
            setTimeout(() => {
                vscode.commands.executeCommand('ei18n-json-editor').then(() => {
                    // Opcionalmente, ocultar la vista después de abrir el editor
                    vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
                });
            }, 100);
        }
    });
    
    context.subscriptions.push(treeView);
    
    context.subscriptions.push(EIJEEditorProvider.register(context));
}

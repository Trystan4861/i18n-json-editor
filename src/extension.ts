import * as vscode from 'vscode';
import * as _path from 'path';

import { EIJEEditorProvider } from './ei18n-json-editor/providers/eije-editor-provider';
import { EIJEConfiguration } from './ei18n-json-editor/eije-configuration';
import { I18nService } from './i18n/i18n-service';

export async function activate(context: vscode.ExtensionContext) {
    // Initialize the i18n service
    let i18n: I18nService;
    
    try {
        // Initialize the i18n service
        i18n = I18nService.getInstance(context);
        
        // Wait for translations to load
        await i18n.waitForLoad();
        
        // Set language based on VS Code UI language
        const vscodeLanguage = vscode.env.language;
        if (vscodeLanguage.startsWith('es')) {
            i18n.setLanguage('es');
        } else {
            i18n.setLanguage('en');
        }
        
        // Log successful initialization
        console.log('Enhanced i18n JSON Editor: i18n service initialized successfully');
    } catch (error) {
        console.error('Enhanced i18n JSON Editor: Error initializing i18n service', error);
        // Ensure i18n is initialized even if there's an error
        i18n = I18nService.getInstance(context);
    }
    
    // Registrar un comando para cerrar la vista de la extensión
    const closeViewCommand = vscode.commands.registerCommand('ei18n-json-editor.closeView', () => {
        vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
    });
    
    context.subscriptions.push(closeViewCommand);

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
    
    // Crear una clase para el elemento del árbol
    class EIJETreeItem extends vscode.TreeItem {
        constructor(
            public readonly label: string,
            public readonly collapsibleState: vscode.TreeItemCollapsibleState,
            public readonly command?: vscode.Command
        ) {
            super(label, collapsibleState);
        }
    }

    // Crear un proveedor de datos para la vista de árbol
    class EIJETreeDataProvider implements vscode.TreeDataProvider<EIJETreeItem> {
        private _onDidChangeTreeData: vscode.EventEmitter<EIJETreeItem | undefined | null | void> = new vscode.EventEmitter<EIJETreeItem | undefined | null | void>();
        readonly onDidChangeTreeData: vscode.Event<EIJETreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

        getTreeItem(element: EIJETreeItem): vscode.TreeItem {
            return element;
        }

        getChildren(element?: EIJETreeItem): Thenable<EIJETreeItem[]> {
            if (element) {
                return Promise.resolve([]);
            } else {
                // Crear un único elemento que muestra el estado de carga
                const loadingItem = new EIJETreeItem(
                    `Cargando ${i18n.t('extension.title')}...`,
                    vscode.TreeItemCollapsibleState.None
                );
                
                // Agregar un icono de carga al elemento
                loadingItem.iconPath = new vscode.ThemeIcon('loading~spin');
                
                return Promise.resolve([loadingItem]);
            }
        }
    }
    
    // Registrar el proveedor de datos para la vista de árbol
    const treeDataProvider = new EIJETreeDataProvider();
    const treeView = vscode.window.createTreeView('trystan4861-eije-view', { 
        treeDataProvider: treeDataProvider,
        showCollapseAll: false
    });
    
    // Evento que se activa cada vez que la vista se vuelve visible
    treeView.onDidChangeVisibility(e => {
        if (e.visible) {
            // Abrir automáticamente el editor y cerrar la vista
            setTimeout(() => {
                vscode.commands.executeCommand('ei18n-json-editor').then(() => {
                    // Usar el comando para cerrar la barra lateral
                    vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
                });
            }, 300);
        }
    });
    
    context.subscriptions.push(treeView);
    
    // No es necesario mostrar un mensaje de carga inicial ya que el editor se abrirá automáticamente
}

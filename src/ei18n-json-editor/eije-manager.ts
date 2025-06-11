import * as vscode from 'vscode';
import * as fs from 'fs';
import * as _path from 'path';

import { EIJEConfiguration } from './eije-configuration';
import { EIJEData } from './eije-data';
import { EIJEDataTranslation } from './models/eije-data-translation';
import { I18nService } from '../i18n/i18n-service';

export class EIJEManager {
    get isWorkspace() {
        return this.folderPath === null;
    }
    private _data: EIJEData;

    constructor(private _context: vscode.ExtensionContext, private _panel: vscode.WebviewPanel, public folderPath: string) {
        // Guardar/inicializar el archivo de configuración
        EIJEConfiguration.saveFullConfiguration();
        
        this._data = new EIJEData(this);
        this._initEvents();
        this._initTemplate();
        _panel.webview.html = this.getTemplate();
        
        // Guardar la configuración cuando se cierra el panel
        this._panel.onDidDispose(() => {
            EIJEConfiguration.saveFullConfiguration();
        });
    }

    _initEvents() {
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'add':
                    this._data.add();
                    return;
                case 'mark':
                    this._data.mark(message.id);
                    return;
                case 'navigate':
                    this._data.navigate(message.page);
                    return;
                case 'pageSize':
                    this._data.pageSize(+message.value);
                    return;
                case 'refresh':
                    this.refreshDataTable();
                    return;
                case 'reload':
                    this.reloadData();
                    return;
                case 'showNewLanguageInput':
                    this._showNewLanguageInput();
                    return;
                case 'newLanguage':
                    this.createNewLanguage(message.langCode);
                    return;
                case 'remove':
                    this._data.remove(message.id);
                    return;
                case 'save':
                    this._data.save();
                    return;
                case 'filterFolder':
                    this._data.filterFolder(message.value);
                    return;
                case 'search':
                    this._data.search(message.value);
                    return;
                case 'select':
                    this._data.select(message.id);
                    return;
                case 'sort':
                    this._data.sort(message.column, message.ascending);
                    return;
                case 'switch-view':
                    this._data.switchView(message.view);
                    return;
                case 'update':
                    this._data.update(message.id, message.value, message.language);
                    return;
                case 'translate':
                    this._data.translate(message.id, message.language);
                    return;
                case 'folder':
                    this._data.changeFolder(message.id, message.value);
                    return;
                case 'toggleColumn':
                    this.toggleColumnVisibility(message.language, message.visible);
                    return;
                case 'checkEmptyTranslations':
                    this.checkEmptyTranslations(message.currentPage);
                    return;
                case 'navigateToNextEmptyTranslation':
                    this.navigateToNextEmptyTranslation();
                    return;
            }
        });
    }
    
    toggleColumnVisibility(language: string, visible: boolean) {
        // No se permite ocultar la columna 'key' ni 'en'
        if (language === 'key' || language === 'en') {
            return;
        }
        
        let visibleColumns = EIJEConfiguration.VISIBLE_COLUMNS;
        let hiddenColumns = EIJEConfiguration.HIDDEN_COLUMNS;
        
        if (visible) {
            // Mostrar columna
            if (!visibleColumns.includes(language)) {
                visibleColumns.push(language);
            }
            // Eliminar de columnas ocultas si existe
            hiddenColumns = hiddenColumns.filter(col => col !== language);
        } else {
            // Ocultar columna
            visibleColumns = visibleColumns.filter(col => col !== language);
            // Añadir a columnas ocultas si no existe
            if (!hiddenColumns.includes(language)) {
                hiddenColumns.push(language);
            }
        }
        
        // Guardar configuración
        EIJEConfiguration.saveVisibleColumns(visibleColumns);
        EIJEConfiguration.saveHiddenColumns(hiddenColumns);
        
        // Guardar la configuración completa para mantener el archivo actualizado
        EIJEConfiguration.saveFullConfiguration();
        
        // Actualizar la tabla
        this.refreshDataTable();
    }
    
    reloadData() {
        // Guardar la configuración completa
        EIJEConfiguration.saveFullConfiguration();
        
        this._data = new EIJEData(this);
        this.refreshDataTable();
        const i18n = I18nService.getInstance();
        vscode.window.showInformationMessage(i18n.t('ui.messages.reloaded'));
    }
    
    async _showNewLanguageInput() {
        const i18n = I18nService.getInstance();
        // Show VS Code input box to get language code
        const langCode = await vscode.window.showInputBox({
            prompt: i18n.t('ui.prompts.enterLanguageCode'),
            placeHolder: i18n.t('ui.prompts.languageCodePlaceholder'),
            validateInput: (value: string) => {
                if (!value || value.trim() === '') {
                    return i18n.t('ui.messages.languageCodeEmpty');
                }
                if (value.length > 5) {
                    return i18n.t('ui.messages.languageCodeTooLong');
                }
                return null; // Input is valid
            }
        });

        // If user provided a language code, create the language file
        if (langCode) {
            this.createNewLanguage(langCode);
        }
    }

    createNewLanguage(langCode: string) {
        const i18n = I18nService.getInstance();
        
        if (!langCode || langCode.length > 5) {
            vscode.window.showErrorMessage(i18n.t('ui.messages.languageCodeInvalid'));
            return;
        }
        
        try {
            let targetPath: string;
            
            if (this.folderPath) {
                // Use the current folder if opened from a specific folder
                targetPath = this.folderPath;
            } else if (EIJEConfiguration.WORKSPACE_FOLDERS && EIJEConfiguration.WORKSPACE_FOLDERS.length > 0) {
                // Use the first workspace folder if opened from workspace
                targetPath = EIJEConfiguration.WORKSPACE_FOLDERS[0].path;
            } else {
                vscode.window.showErrorMessage(i18n.t('ui.messages.noTargetFolder'));
                return;
            }
            
            const filePath = _path.join(targetPath, `${langCode}.json`);
            
            // Check if file already exists
            if (fs.existsSync(filePath)) {
                vscode.window.showWarningMessage(i18n.t('ui.messages.languageFileExists', `${langCode}.json`));
                return;
            }
            
            // Check if English template file exists
            const englishFilePath = _path.join(targetPath, 'en.json');
            let jsonContent = {};
            
            if (fs.existsSync(englishFilePath)) {
                try {
                    // Use English file as template
                    const englishContent = fs.readFileSync(englishFilePath, 'utf8');
                    jsonContent = JSON.parse(englishContent);
                    vscode.window.showInformationMessage(i18n.t('ui.messages.createdWithTemplate', `${langCode}.json`));
                } catch (err) {
                    // If there's an error reading/parsing the English file, use empty object
                    vscode.window.showWarningMessage(i18n.t('ui.messages.templateReadError'));
                }
            } else {
                vscode.window.showInformationMessage(i18n.t('ui.messages.templateNotFound'));
            }
            
            // Create new language file
            const fileContent = JSON.stringify(jsonContent, null, EIJEConfiguration.JSON_SPACE);
            fs.writeFileSync(filePath, fileContent);
            
            vscode.window.showInformationMessage(i18n.t('ui.messages.languageFileCreated', `${langCode}.json`));
            
            // Guardar la configuración completa
            EIJEConfiguration.saveFullConfiguration();
            
            // Reload the editor to show the new language
            this.reloadData();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(i18n.t('ui.messages.fileCreationError', errorMessage));
        }
    }
    
    checkEmptyTranslations(currentPage: number) {
        // Check for empty translations on the current page
        const emptyTranslations = this._data.findEmptyTranslations(currentPage);
        
        // Count all empty translations in the entire dataset
        const emptyTranslationsCount = this._data.countEmptyTranslations();
        
        this._panel.webview.postMessage({ 
            command: 'emptyTranslationsFound', 
            emptyTranslations: emptyTranslations,
            hasEmptyTranslations: emptyTranslationsCount.hasEmpty,
            totalEmptyCount: emptyTranslationsCount.count
        });
    }
    
    navigateToNextEmptyTranslation() {
        // Find and navigate to the next empty translation
        const nextEmptyTranslation = this._data.findNextEmptyTranslation();
        if (nextEmptyTranslation) {
            // If an empty translation is found, navigate to its page and select it
            this._data.navigate(nextEmptyTranslation.page, true); // Skip refresh
            this._data.select(nextEmptyTranslation.id, true); // Skip refresh
            
            // Luego actualizamos la interfaz una sola vez
            this.refreshDataTable();
            
            // También debemos enviar un mensaje para actualizar la información de traducciones vacías
            this.checkEmptyTranslations(nextEmptyTranslation.page);
        } else {
            // If no empty translation is found, show a message
            const i18n = I18nService.getInstance();
            vscode.window.showInformationMessage(i18n.t('ui.messages.noEmptyTranslations'));
        }
    }

    _initTemplate() {
        if (this.isWorkspace) {
            this._panel.webview.postMessage({ command: 'folders', folders: EIJEConfiguration.WORKSPACE_FOLDERS });
        }
    }

    refreshDataTable() {
        this._panel.webview.postMessage({ command: 'content', render: this._data.render() });
    }

    /**
     * Update the translation and refresh the empty translations count
     * @param translation The translation to update
     */
    updateTranslation(translation: EIJEDataTranslation) {
        this._panel.webview.postMessage({ command: 'update', translation: translation });
        
        // Actualizar el contador de traducciones faltantes después de cada modificación
        const currentPage = this._data.getCurrentPage();
        this.checkEmptyTranslations(currentPage);
    }
    
    /**
     * Envía un mensaje al frontend con el resultado del guardado
     * @param success Indica si el guardado fue exitoso
     */
    sendSaveResult(success: boolean) {
        this._panel.webview.postMessage({ 
            command: 'saveResult', 
            success: success 
        });
    }

    getTemplate(): string {
        const template = vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'template.html'));

        const linksPath = [
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'bootstrap.min.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'template.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'fontello', 'css', 'fontello.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'font-awesome.min.css'))
        ];

        const scriptsPath = [
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'jquery.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'bootstrap.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'popper.min.js')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'template.js'))
        ];
        
        // Get i18n translations
        const i18n = I18nService.getInstance();
        
        // Helper function to replace i18n template tags
        const replaceI18nTags = (html: string): string => {
            return html.replace(/\{\{i18n\.([^}]+)\}\}/g, (match, key) => {
                return i18n.t(key) || match;
            });
        };

        return replaceI18nTags(
            fs.readFileSync(template.fsPath)
                .toString()
                .replace(
                    '{{LINKS}}',
                    linksPath
                        .map(l => `<link rel="stylesheet" href="${this._panel.webview.asWebviewUri ? this._panel.webview.asWebviewUri(l) : l.with({ scheme: 'vscode-resource' })}">`)
                        .join('\n')
                )
                .replace(
                    '{{SCRIPTS}}',
                    scriptsPath
                        .map(l => `<script src="${this._panel.webview.asWebviewUri ? this._panel.webview.asWebviewUri(l) : l.with({ scheme: 'vscode-resource' })}"></script>`)
                        .join('\n')
                )
        );
    }
}

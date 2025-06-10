import * as vscode from 'vscode';
import * as fs from 'fs';
import * as _path from 'path';

import { IJEConfiguration } from './ije-configuration';
import { IJEData } from './ije-data';
import { IJEDataTranslation } from './models/ije-data-translation';
import { I18nService } from '../i18n/i18n-service';

export class IJEManager {
    get isWorkspace() {
        return this.folderPath === null;
    }
    private _data: IJEData;

    constructor(private _context: vscode.ExtensionContext, private _panel: vscode.WebviewPanel, public folderPath: string) {
        this._data = new IJEData(this);
        this._initEvents();
        this._initTemplate();
        _panel.webview.html = this.getTemplate();
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
            }
        });
    }
    
    reloadData() {
        this._data = new IJEData(this);
        this.refreshDataTable();
        vscode.window.showInformationMessage('i18n editor reloaded');
    }
    
    async _showNewLanguageInput() {
        // Show VS Code input box to get language code
        const langCode = await vscode.window.showInputBox({
            prompt: 'Enter language code (max 5 characters)',
            placeHolder: 'e.g. es_ES or de',
            validateInput: (value: string) => {
                if (!value || value.trim() === '') {
                    return 'Language code cannot be empty';
                }
                if (value.length > 5) {
                    return 'Language code must be maximum 5 characters';
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
        if (!langCode || langCode.length > 5) {
            vscode.window.showErrorMessage('Language code must be maximum 5 characters!');
            return;
        }
        
        try {
            let targetPath: string;
            
            if (this.folderPath) {
                // Use the current folder if opened from a specific folder
                targetPath = this.folderPath;
            } else if (IJEConfiguration.WORKSPACE_FOLDERS && IJEConfiguration.WORKSPACE_FOLDERS.length > 0) {
                // Use the first workspace folder if opened from workspace
                targetPath = IJEConfiguration.WORKSPACE_FOLDERS[0].path;
            } else {
                vscode.window.showErrorMessage('No target folder available to create language file');
                return;
            }
            
            const filePath = _path.join(targetPath, `${langCode}.json`);
            
            // Check if file already exists
            if (fs.existsSync(filePath)) {
                vscode.window.showWarningMessage(`Language file ${langCode}.json already exists`);
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
                    vscode.window.showInformationMessage(`Created ${langCode}.json using English template`);
                } catch (err) {
                    // If there's an error reading/parsing the English file, use empty object
                    vscode.window.showWarningMessage(`Could not read English template. Creating empty file.`);
                }
            } else {
                vscode.window.showInformationMessage(`English template not found. Creating empty file.`);
            }
            
            // Create new language file
            const fileContent = JSON.stringify(jsonContent, null, IJEConfiguration.JSON_SPACE);
            fs.writeFileSync(filePath, fileContent);
            
            vscode.window.showInformationMessage(`New language file ${langCode}.json created`);
            
            // Reload the editor to show the new language
            this.reloadData();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Error creating language file: ${errorMessage}`);
        }
    }

    _initTemplate() {
        if (this.isWorkspace) {
            this._panel.webview.postMessage({ command: 'folders', folders: IJEConfiguration.WORKSPACE_FOLDERS });
        }
    }

    refreshDataTable() {
        this._panel.webview.postMessage({ command: 'content', render: this._data.render() });
    }

    updateTranslation(translation: IJEDataTranslation) {
        this._panel.webview.postMessage({ command: 'update', translation: translation });
    }

    getTemplate(): string {
        const template = vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'template.html'));

        const linksPath = [
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'bootstrap.min.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'template.css')),
            vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'fontello', 'css', 'fontello.css'))
        ];

        const scriptsPath = [vscode.Uri.file(_path.join(this._context.extensionPath, 'media', 'template.js'))];
        
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

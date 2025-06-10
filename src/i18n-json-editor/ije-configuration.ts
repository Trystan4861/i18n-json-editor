import * as vscode from 'vscode';
import * as fs from 'fs';
import * as _path from 'path';

import { IJEFolder } from './models/ije-folder';
import { TranslationServiceEnum } from './services/ije-translation-service';

export class IJEConfiguration {
    // Ruta del archivo de configuración dentro de .vscode
    private static getConfigPath(workspaceFolder: vscode.WorkspaceFolder): string {
        // Asegurar que el directorio .vscode existe
        const vscodePath = _path.join(workspaceFolder.uri.fsPath, '.vscode');
        if (!fs.existsSync(vscodePath)) {
            fs.mkdirSync(vscodePath, { recursive: true });
        }
        return _path.join(vscodePath, '.i18n-editor-config.json');
    }
    // Lista de códigos de idioma RTL (Right-to-Left)
    public static readonly RTL_LANGUAGES = [
        'ar', // Árabe
        'dv', // Divehi
        'fa', // Persa (Farsi)
        'he', // Hebreo
        'ks', // Cachemir
        'ku', // Kurdo
        'ps', // Pashto
        'sd', // Sindhi
        'ug', // Uigur
        'ur', // Urdu
        'yi'  // Yiddish
    ];
    
    /**
     * Verifica si un idioma es RTL (Right-to-Left)
     * @param language Código de idioma (ej. 'ar', 'he')
     * @returns true si el idioma es RTL, false en caso contrario
     */
    static isRTL(language: string): boolean {
        // Extraer código base del idioma (ej. 'ar-EG' -> 'ar')
        const baseLanguage = language.split('-')[0].toLowerCase();
        return this.RTL_LANGUAGES.includes(baseLanguage);
    }

    static get FORCE_KEY_UPPERCASE(): boolean {
        const value = vscode.workspace.getConfiguration().get<boolean>('i18nJsonEditor.forceKeyUPPERCASE');
        return value !== undefined ? value : true;
    }

    static get JSON_SPACE(): string | number {
        const value = vscode.workspace.getConfiguration().get<string | number>('i18nJsonEditor.jsonSpace');
        return value !== undefined ? value : 2;
    }

    static get KEY_SEPARATOR(): string | false {
        const value = vscode.workspace.getConfiguration().get<string | boolean>('i18nJsonEditor.keySeparator');
        return value !== undefined && value !== true ? value : '.';
    }

    static get LINE_ENDING(): string {
        const value = vscode.workspace.getConfiguration().get<string>('i18nJsonEditor.lineEnding');
        return value !== undefined ? value : '\n';
    }

    static get SUPPORTED_FOLDERS(): string[] {
        const value = vscode.workspace.getConfiguration().get<string[]>('i18nJsonEditor.supportedFolders');
        return value !== undefined ? value : ['i18n'];
    }
    
    static get TRANSLATION_SERVICE(): TranslationServiceEnum {
        const value = vscode.workspace.getConfiguration().get<TranslationServiceEnum>('i18nJsonEditor.translationService');
        return value !== undefined ? value : null;
    }

    static get TRANSLATION_SERVICE_API_KEY(): string {
        const value = vscode.workspace.getConfiguration().get<string>('i18nJsonEditor.translationServiceApiKey');
        return value !== undefined ? value : null;
    }
    
    static get VISIBLE_COLUMNS(): string[] {
        // Get visible columns from workspace state or settings
        let visibleColumns: string[] = [];
        try {
            // Try to get from the local project settings file
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = this.getConfigPath(workspaceFolder);
                if (fs.existsSync(configPath)) {
                    const configContent = fs.readFileSync(configPath, 'utf8');
                    const config = JSON.parse(configContent);
                    if (Array.isArray(config.visibleColumns)) {
                        return config.visibleColumns;
                    }
                }
            }
        } catch (e) {
            console.error('Error loading visible columns:', e);
        }
        
        // Si no hay columnas visibles guardadas, mostrar todas por defecto
        // Esto se hace en IJEData._loadFolder donde se cargan los idiomas
        return visibleColumns;
    }
    
    static get HIDDEN_COLUMNS(): string[] {
        // Obtener columnas ocultas de la configuración
        let hiddenColumns: string[] = [];
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = this.getConfigPath(workspaceFolder);
                if (fs.existsSync(configPath)) {
                    const configContent = fs.readFileSync(configPath, 'utf8');
                    const config = JSON.parse(configContent);
                    if (Array.isArray(config.hiddenColumns)) {
                        return config.hiddenColumns;
                    }
                }
            }
        } catch (e) {
            console.error('Error loading hidden columns:', e);
        }
        
        return hiddenColumns;
    }
    
    static saveHiddenColumns(columns: string[]): void {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = this.getConfigPath(workspaceFolder);
                let config: any = {};
                
                // Load existing config if it exists
                if (fs.existsSync(configPath)) {
                    const configContent = fs.readFileSync(configPath, 'utf8');
                    config = JSON.parse(configContent);
                }
                
                // Update hidden columns
                config.hiddenColumns = columns;
                
                // Save config
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            }
        } catch (e) {
            console.error('Error saving hidden columns:', e);
        }
    }
    
    static saveVisibleColumns(columns: string[]): void {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const configPath = this.getConfigPath(workspaceFolder);
                let config: any = {};
                
                // Load existing config if it exists
                if (fs.existsSync(configPath)) {
                    const configContent = fs.readFileSync(configPath, 'utf8');
                    config = JSON.parse(configContent);
                }
                
                // Update visible columns
                config.visibleColumns = columns;
                
                // Save config
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            }
        } catch (e) {
            console.error('Error saving visible columns:', e);
        }
    }

    static get WORKSPACE_FOLDERS(): IJEFolder[] {
        const folders = vscode.workspace.getConfiguration().get<IJEFolder[]>('i18nJsonEditor.workspaceFolders');
        let workspaceFolder: vscode.WorkspaceFolder | undefined = vscode.workspace.workspaceFolders[0];

        const _folders: IJEFolder[] = [];
        folders.forEach(d => {
            var path = vscode.Uri.file(_path.join(workspaceFolder.uri.fsPath, d.path)).fsPath;
            if (fs.existsSync(path)) {
                _folders.push({ name: d.name, path: path });
            }
        });

        return _folders !== undefined ? _folders : [];
    }
}

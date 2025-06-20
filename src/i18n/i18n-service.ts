import * as vscode from 'vscode';
import * as path from 'path';
import { EIJEFileSystem } from '../ei18n-json-editor/services/eije-filesystem';

export class I18nService {
    private static instance: I18nService;
    private translations: { [key: string]: any } = {};
    private currentLanguage: string = 'en';
    private isLoaded: boolean = false;
    private loadPromise: Promise<void> | null = null;

    private constructor(private context: vscode.ExtensionContext) {
        this.loadPromise = this.loadTranslations();
    }

    public static getInstance(context?: vscode.ExtensionContext): I18nService {
        if (!I18nService.instance && context) {
            I18nService.instance = new I18nService(context);
        }
        return I18nService.instance;
    }


    private async loadTranslations(): Promise<void> {
        try {
            // Solo cargamos desde archivos ya que estamos en entorno de escritorio
            const langFiles = ['en.json', 'es.json'];
            
            // Intentar cargar desde la carpeta out/i18n primero (compilado)
            const outI18nDir = path.join(this.context.extensionPath, 'out', 'i18n');
            const srcI18nDir = path.join(this.context.extensionPath, 'src', 'i18n');
            
            let loaded = false;
            
            // Primero intentar cargar desde out/i18n
            for (const file of langFiles) {
                try {
                    const lang = file.split('.')[0];
                    const filePath = path.join(outI18nDir, file);
                    
                    if (await EIJEFileSystem.exists(filePath)) {
                        const content = await EIJEFileSystem.readFile(filePath);
                        this.translations[lang] = JSON.parse(content);
                        loaded = true;
                    }
                } catch (error) {
                    console.error(`Failed to load translation file ${file} from out/i18n:`, error);
                }
            }
            
            // Si no se cargó nada desde out/i18n, intentar desde src/i18n
            if (!loaded) {
                for (const file of langFiles) {
                    try {
                        const lang = file.split('.')[0];
                        const filePath = path.join(srcI18nDir, file);
                        
                        if (await EIJEFileSystem.exists(filePath)) {
                            const content = await EIJEFileSystem.readFile(filePath);
                            this.translations[lang] = JSON.parse(content);
                        }
                    } catch (error) {
                        console.error(`Failed to load translation file ${file} from src/i18n:`, error);
                    }
                }
            }
            
            // Si no se cargó nada, crear un objeto vacío con estructura básica
            if (Object.keys(this.translations).length === 0) {
                this.translations = {
                    en: { extension: {}, ui: {} },
                    es: { extension: {}, ui: {} }
                };
                console.warn('No translation files found. Using empty translations.');
            }
            
            this.isLoaded = true;
        } catch (error) {
            console.error('Failed to load translations:', error);
            // Fallback a objeto vacío con estructura básica
            this.translations = {
                en: { extension: {}, ui: {} },
                es: { extension: {}, ui: {} }
            };
            this.isLoaded = true;
        }
    }

    public async waitForLoad(): Promise<void> {
        if (this.loadPromise) {
            await this.loadPromise;
        }
    }

    public setLanguage(lang: string): void {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
        } else {
            console.warn(`Language ${lang} not available, using default language`);
        }
    }

    public getLanguage(): string {
        return this.currentLanguage;
    }

    public t(key: string, ...args: any[]): string {
        try {
            // Si las traducciones no están cargadas o no existe el idioma actual, devolver la clave
            if (!this.isLoaded || !this.translations[this.currentLanguage]) {
                console.warn(`Translation not available for language ${this.currentLanguage}. Using key as fallback.`);
                return key;
            }

            const keyParts = key.split('.');
            let value: any = this.translations[this.currentLanguage];
            
            for (const part of keyParts) {
                value = value?.[part];
                if (value === undefined) {
                    return key; // Return the key if the translation is not found
                }
            }
            
            // Replace {0}, {1}, etc. with the corresponding arguments
            if (args.length > 0 && typeof value === 'string') {
                return value.replace(/{(\d+)}/g, (match, index) => {
                    const argIndex = parseInt(index, 10);
                    return argIndex < args.length ? args[argIndex] : match;
                });
            }
            
            return typeof value === 'string' ? value : key;
        } catch (error) {
            console.error(`Translation error for key ${key}:`, error);
            return key;
        }
    }
}
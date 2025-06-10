import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class I18nService {
    private static instance: I18nService;
    private translations: { [key: string]: any } = {};
    private currentLanguage: string = 'en';

    private constructor(private context: vscode.ExtensionContext) {
        this.loadTranslations();
    }

    public static getInstance(context?: vscode.ExtensionContext): I18nService {
        if (!I18nService.instance && context) {
            I18nService.instance = new I18nService(context);
        }
        return I18nService.instance;
    }

    private loadTranslations(): void {
        const langFiles = ['en.json', 'es.json'];
        const i18nDir = path.join(this.context.extensionPath, 'src', 'i18n');

        langFiles.forEach(file => {
            try {
                const lang = file.split('.')[0];
                const filePath = path.join(i18nDir, file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    this.translations[lang] = JSON.parse(content);
                }
            } catch (error) {
                console.error(`Failed to load translation file ${file}:`, error);
            }
        });
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
            const keyParts = key.split('.');
            let value = this.translations[this.currentLanguage];
            
            for (const part of keyParts) {
                value = value[part];
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
            
            return value;
        } catch (error) {
            console.error(`Translation error for key ${key}:`, error);
            return key;
        }
    }
}
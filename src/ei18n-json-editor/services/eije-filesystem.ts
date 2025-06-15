/**
 * Servicio de sistema de archivos que funciona tanto en Node.js como en entorno web
 * Autor: trystan4861
 */

import * as vscode from 'vscode';

export class EIJEFileSystem {
    private static isWebEnvironment(): boolean {
        // Detectar si estamos en un entorno web usando múltiples métodos
        try {
            // Método 1: Verificar si process existe y tiene node
            const noNodeProcess = typeof process === 'undefined' || process.versions?.node === undefined;
            
            // Método 2: Verificar UIKind de VS Code
            const isVSCodeWeb = typeof vscode !== 'undefined' && vscode.env?.uiKind === vscode.UIKind.Web;
            
            // Método 3: Verificar si estamos en un dominio web conocido
            const isWebDomain = typeof globalThis !== 'undefined' && 
                typeof globalThis.location !== 'undefined' &&
                (globalThis.location.hostname?.includes('github.dev') || 
                 globalThis.location.hostname?.includes('vscode.dev'));
            
            return noNodeProcess || isVSCodeWeb || isWebDomain;
        } catch (error) {
            // En caso de error, asumir entorno web por seguridad
            return true;
        }
    }

    // Métodos síncronos para compatibilidad con código existente
    static readFileSync(filePath: string): string {
        if (this.isWebEnvironment()) {
            // En entorno web, no podemos hacer operaciones síncronas
            // Retornamos una cadena vacía sin mostrar warning
            return '';
        } else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                return fs.readFileSync(filePath, 'utf8');
            } catch (error) {
                console.error('Error reading file:', error);
                return '';
            }
        }
    }

    static writeFileSync(filePath: string, content: string): void {
        if (this.isWebEnvironment()) {
            // En entorno web, no podemos hacer operaciones síncronas
            // No hacemos nada sin mostrar warning
            return;
        } else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                fs.writeFileSync(filePath, content, 'utf8');
            } catch (error) {
                console.error('Error writing file:', error);
            }
        }
    }

    static existsSync(filePath: string): boolean {
        if (this.isWebEnvironment()) {
            // En entorno web, no podemos hacer operaciones síncronas
            // Retornamos false sin mostrar warning
            return false;
        } else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                return fs.existsSync(filePath);
            } catch (error) {
                console.error('Error checking file existence:', error);
                return false;
            }
        }
    }

    static mkdirSync(dirPath: string, options?: any): void {
        if (this.isWebEnvironment()) {
            // En entorno web, no podemos hacer operaciones síncronas
            // No hacemos nada sin mostrar warning
            return;
        } else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                fs.mkdirSync(dirPath, options);
            } catch (error) {
                console.error('Error creating directory:', error);
            }
        }
    }

    static readdirSync(dirPath: string): string[] {
        if (this.isWebEnvironment()) {
            // En entorno web, no podemos hacer operaciones síncronas
            // Retornamos array vacío sin mostrar warning
            return [];
        } else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                return fs.readdirSync(dirPath);
            } catch (error) {
                console.error('Error reading directory:', error);
                return [];
            }
        }
    }

    static async readFile(filePath: string): Promise<string> {
        if (this.isWebEnvironment()) {
            // Usar la API de VS Code para entorno web
            const uri = vscode.Uri.file(filePath);
            const data = await vscode.workspace.fs.readFile(uri);
            // Convertir Uint8Array a string sin usar Buffer
            const decoder = new TextDecoder('utf-8');
            return decoder.decode(data);
        } else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                return fs.readFileSync(filePath, 'utf8');
            } catch (error) {
                console.error('Error reading file:', error);
                return '';
            }
        }
    }

    static async writeFile(filePath: string, content: string): Promise<void> {
        if (this.isWebEnvironment()) {
            // Usar la API de VS Code para entorno web
            const uri = vscode.Uri.file(filePath);
            // Convertir string a Uint8Array sin usar Buffer
            const encoder = new TextEncoder();
            const data = encoder.encode(content);
            await vscode.workspace.fs.writeFile(uri, data);
        } else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                fs.writeFileSync(filePath, content, 'utf8');
            } catch (error) {
                console.error('Error writing file:', error);
            }
        }
    }

    static async exists(filePath: string): Promise<boolean> {
        if (this.isWebEnvironment()) {
            // Usar la API de VS Code para entorno web
            try {
                const uri = vscode.Uri.file(filePath);
                await vscode.workspace.fs.stat(uri);
                return true;
            } catch {
                return false;
            }
        } else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                return fs.existsSync(filePath);
            } catch (error) {
                console.error('Error checking file existence:', error);
                return false;
            }
        }
    }

    static async readdir(dirPath: string): Promise<string[]> {
        if (this.isWebEnvironment()) {
            // Usar la API de VS Code para entorno web
            const uri = vscode.Uri.file(dirPath);
            const entries = await vscode.workspace.fs.readDirectory(uri);
            return entries.map(([name]) => name);
        } else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                return fs.readdirSync(dirPath);
            } catch (error) {
                console.error('Error reading directory:', error);
                return [];
            }
        }
    }

    static async mkdir(dirPath: string): Promise<void> {
        if (this.isWebEnvironment()) {
            // Usar la API de VS Code para entorno web
            const uri = vscode.Uri.file(dirPath);
            await vscode.workspace.fs.createDirectory(uri);
        } else {
            // Usar fs para entorno Node.js - importación dinámica
            try {
                const fs = eval('require')('fs');
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
            } catch (error) {
                console.error('Error creating directory:', error);
            }
        }
    }
}
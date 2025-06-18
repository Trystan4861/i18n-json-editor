/**
 * Servicio de sistema de archivos para la versión de escritorio de VS Code
 * Autor: trystan4861
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';

export class EIJEFileSystem {

    // Métodos síncronos para compatibilidad con código existente
    static readFileSync(filePath: string): string {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            console.error('Error reading file:', error);
            return '';
        }
    }

    static writeFileSync(filePath: string, content: string): void {
        try {
            fs.writeFileSync(filePath, content, 'utf8');
        } catch (error) {
            console.error('Error writing file:', error);
        }
    }

    static existsSync(filePath: string): boolean {
        try {
            return fs.existsSync(filePath);
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    static mkdirSync(dirPath: string, options?: any): void {
        try {
            fs.mkdirSync(dirPath, options);
        } catch (error) {
            console.error('Error creating directory:', error);
        }
    }

    static readdirSync(dirPath: string): string[] {
        try {
            return fs.readdirSync(dirPath);
        } catch (error) {
            console.error('Error reading directory:', error);
            return [];
        }
    }
    
    static statSync(path: string): fs.Stats {
        try {
            return fs.statSync(path);
        } catch (error) {
            console.error('Error getting file stats:', error);
            throw error;
        }
    }

    // Métodos asíncronos que utilizan realmente fs.promises
    static async readFile(filePath: string): Promise<string> {
        try {
            return await fsPromises.readFile(filePath, 'utf8');
        } catch (error) {
            console.error('Error reading file:', error);
            return '';
        }
    }

    static async writeFile(filePath: string, content: string): Promise<void> {
        try {
            await fsPromises.writeFile(filePath, content, 'utf8');
        } catch (error) {
            console.error('Error writing file:', error);
        }
    }

    static async exists(filePath: string): Promise<boolean> {
        try {
            await fsPromises.access(filePath);
            return true;
        } catch (error) {
            return false;
        }
    }

    static async readdir(dirPath: string): Promise<string[]> {
        try {
            return await fsPromises.readdir(dirPath);
        } catch (error) {
            console.error('Error reading directory:', error);
            return [];
        }
    }

    static async mkdir(dirPath: string): Promise<void> {
        try {
            const exists = await EIJEFileSystem.exists(dirPath);
            if (!exists) {
                await fsPromises.mkdir(dirPath, { recursive: true });
            }
        } catch (error) {
            console.error('Error creating directory:', error);
        }
    }

    /**
     * Elimina un archivo
     * @param filePath Ruta del archivo a eliminar
     */
    static async deleteFile(filePath: string): Promise<void> {
        try {
            const exists = await EIJEFileSystem.exists(filePath);
            if (exists) {
                await fsPromises.unlink(filePath);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error; // Propagar el error para manejarlo en el llamador
        }
    }
}
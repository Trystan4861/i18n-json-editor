/**
 * Servicio para manejar notificaciones con tiempos personalizados
 */

import * as vscode from 'vscode';

export class NotificationService {
    private static _instance: NotificationService;
    
    // Tiempos de notificación por tipo
    private readonly INFO_TIMEOUT = 3000; // 3 segundos para notificaciones informativas
    private readonly SAVED_TIMEOUT = 3000; // 3 segundos para notificación de guardado
    private readonly ERROR_TIMEOUT = 0; // 0 significa que requiere cierre manual
    
    // Almacena los timers activos para poder cancelarlos
    private _activeTimers: Map<string, NodeJS.Timeout> = new Map();
    
    private constructor() {}
    
    public static getInstance(): NotificationService {
        if (!NotificationService._instance) {
            NotificationService._instance = new NotificationService();
        }
        return NotificationService._instance;
    }
    
    /**
     * Muestra un mensaje informativo que desaparece después de un tiempo determinado
     * @param message Mensaje a mostrar
     * @param isSaveMessage Indica si es un mensaje de guardado (para usar tiempo específico)
     */
    public showInformationMessage(message: string, isSaveMessage: boolean = false): void {
        // Primero cancelamos cualquier timer existente para este mensaje
        this.clearTimer(message);
        
        // Mostramos la notificación usando el API de VSCode
        const timeout = isSaveMessage ? this.SAVED_TIMEOUT : this.INFO_TIMEOUT;
        
        // Mostramos el mensaje y configuramos un timer para cerrarlo
        const messagePromise = vscode.window.showInformationMessage(message);
        
        // Guardar referencia al timer para poder cancelarlo si es necesario
        const timer = setTimeout(() => {
            // VSCode no proporciona un API directo para cerrar notificaciones, pero podemos
            // usar un truco: mostrar un mensaje vacío con el mismo título
            // que será reemplazado inmediatamente
            vscode.window.showInformationMessage('');
            this._activeTimers.delete(message);
        }, timeout);
        
        this._activeTimers.set(message, timer);
    }
    
    /**
     * Muestra un mensaje de error que requiere cierre manual por el usuario
     * @param message Mensaje de error a mostrar
     */
    public showErrorMessage(message: string): void {
        // Los mensajes de error no tienen auto-cierre (timeout = 0)
        vscode.window.showErrorMessage(message);
    }
    
    /**
     * Muestra un mensaje de advertencia
     * @param message Mensaje de advertencia a mostrar
     */
    public showWarningMessage(message: string): void {
        // Primero cancelamos cualquier timer existente para este mensaje
        this.clearTimer(message);
        
        // Mostramos el mensaje y configuramos un timer para cerrarlo
        const messagePromise = vscode.window.showWarningMessage(message);
        
        // Guardar referencia al timer para poder cancelarlo si es necesario
        const timer = setTimeout(() => {
            // Truco para cerrar la notificación
            vscode.window.showWarningMessage('');
            this._activeTimers.delete(message);
        }, this.INFO_TIMEOUT);
        
        this._activeTimers.set(message, timer);
    }
    
    /**
     * Cancela el timer para un mensaje específico
     * @param message El mensaje cuyo timer se cancelará
     */
    private clearTimer(message: string): void {
        if (this._activeTimers.has(message)) {
            clearTimeout(this._activeTimers.get(message)!);
            this._activeTimers.delete(message);
        }
    }
    
    /**
     * Cancela todos los timers activos
     */
    public clearAllTimers(): void {
        this._activeTimers.forEach(timer => {
            clearTimeout(timer);
        });
        this._activeTimers.clear();
    }
}
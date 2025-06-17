/**
 * Servicio para manejar notificaciones usando Flashy.js
 * @author trystan4861
 */

import * as vscode from 'vscode';

export class NotificationService {
    private static _instance: NotificationService;
    private _webviewPanel: vscode.WebviewPanel | null = null;
    
    private constructor() {}
    
    public static getInstance(): NotificationService {
        if (!NotificationService._instance) {
            NotificationService._instance = new NotificationService();
        }
        return NotificationService._instance;
    }
    
    /**
     * Establece el panel de webview para enviar notificaciones
     * @param panel Panel de webview activo
     */
    public setWebviewPanel(panel: vscode.WebviewPanel): void {
        this._webviewPanel = panel;
    }
    
    /**
     * Muestra un mensaje informativo usando Flashy
     * @param message Mensaje a mostrar
     * @param isSaveMessage Indica si es un mensaje de guardado
     */
    public showInformationMessage(message: string, isSaveMessage: boolean = false): void {
        this.sendFlashyNotification(message, 'success', 3000);
    }
    
    /**
     * Muestra un mensaje de éxito usando Flashy
     * @param message Mensaje a mostrar
     * @param useFlashy Indica si se debe usar Flashy o notificaciones nativas
     */
    public showSuccessMessage(message: string, useFlashy: boolean = true): void {
        if (useFlashy) {
            this.sendFlashyNotification(message, 'success', 3000);
        } else {
            vscode.window.showInformationMessage(message);
        }
    }
    
    /**
     * Muestra un mensaje de error usando Flashy
     * @param message Mensaje de error a mostrar
     */
    public showErrorMessage(message: string): void {
        this.sendFlashyNotification(message, 'error', 0); // 0 = sin auto-cierre
    }
    
    /**
     * Muestra un mensaje de advertencia usando Flashy
     * @param message Mensaje de advertencia a mostrar
     */
    public showWarningMessage(message: string): void {
        this.sendFlashyNotification(message, 'warning', 3000);
    }
    
    /**
     * Envía una notificación Flashy al webview
     * @param message Mensaje a mostrar
     * @param type Tipo de notificación (success, error, warning, info)
     * @param duration Duración en milisegundos (0 = sin auto-cierre)
     */
    private sendFlashyNotification(message: string, type: string, duration: number): void {
        if (!this._webviewPanel) {
            // Fallback a notificaciones nativas de VSCode si no hay webview
            switch (type) {
                case 'success':
                    vscode.window.showInformationMessage(message);
                    break;
                case 'error':
                    vscode.window.showErrorMessage(message);
                    break;
                case 'warning':
                    vscode.window.showWarningMessage(message);
                    break;
                default:
                    vscode.window.showInformationMessage(message);
            }
            return;
        }

        this._webviewPanel.webview.postMessage({
            command: 'showFlashyNotification',
            message: message,
            type: type,
            duration: duration
        });
    }
}
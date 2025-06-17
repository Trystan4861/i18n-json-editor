import * as vscode from "vscode";
import * as _path from "path";

import { EIJEManager } from "./eije-manager";
import { EIJEConfiguration } from "./eije-configuration";

export class IJEEditorProvider {
  private static readonly viewType = "ei18n-json-editor.editor";

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    vscode.commands.executeCommand('setContext', 'ext:supportedFolders',EIJEConfiguration.SUPPORTED_FOLDERS);

    return vscode.commands.registerCommand("ei18n-json-editor", async (uri: vscode.Uri) => {
      // Si se abrió desde el menú contextual sobre una carpeta, verificar si es una carpeta i18n o contiene una
      let folderPath = null;
      let shouldAddToConfig = false;
      
      if (uri) {
        const stats = await vscode.workspace.fs.stat(uri);
        const isDirectory = (stats.type & vscode.FileType.Directory) !== 0;
        
        if (isDirectory) {
          const folderName = _path.basename(uri.fsPath);
          
          // Si la carpeta seleccionada es una carpeta i18n
          if (folderName === 'i18n') {
            folderPath = uri.fsPath;
            shouldAddToConfig = true;
          } else {
            // Verificar si contiene una carpeta i18n
            try {
              const i18nPath = _path.join(uri.fsPath, 'i18n');
              const i18nStats = await vscode.workspace.fs.stat(vscode.Uri.file(i18nPath));
              const isI18nDirectory = (i18nStats.type & vscode.FileType.Directory) !== 0;
              
              if (isI18nDirectory) {
                folderPath = i18nPath;
                shouldAddToConfig = true;
              }
            } catch (error) {
              // La carpeta i18n no existe dentro de la carpeta seleccionada
            }
          }
          
          // Si se encontró una carpeta i18n válida, agregarla a la configuración
          if (shouldAddToConfig && folderPath) {
            // Obtener la ruta relativa
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
              const relativePath = _path.relative(workspaceFolder.uri.fsPath, folderPath);
              // Si la carpeta es i18n, usar el nombre del directorio padre como nombre de la carpeta
              const parentDir = _path.dirname(relativePath);
              const displayName = parentDir === '.' ? '/' : parentDir;
              
              // Agregar a la configuración
              EIJEConfiguration.createI18nDirectory(relativePath);
            }
          }
        }
      }
      
      // Crear el panel del webview
      const panel = vscode.window.createWebviewPanel("ei18n-json-editor", "ei18n-json-editor", vscode.ViewColumn.One, {
        retainContextWhenHidden: true,
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(_path.join(context.extensionPath, "media"))],
      });

      // Inicializar el manager con la ruta de la carpeta (si se proporcionó)
      const manager = new EIJEManager(context, panel, folderPath);
    });
  }

  constructor(private readonly _context: vscode.ExtensionContext) {}
}

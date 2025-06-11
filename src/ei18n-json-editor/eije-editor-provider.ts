import * as vscode from "vscode";
import * as _path from "path";

import { EIJEManager } from "./eije-manager";
import { EIJEConfiguration } from "./eije-configuration";

export class IJEEditorProvider {
  private static readonly viewType = "ei18n-json-editor.editor";

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    vscode.commands.executeCommand('setContext', 'ext:supportedFolders',EIJEConfiguration.SUPPORTED_FOLDERS);

    return vscode.commands.registerCommand("ei18n-json-editor", (uri: vscode.Uri) => {
      const panel = vscode.window.createWebviewPanel("ei18n-json-editor", "ei18n-json-editor", vscode.ViewColumn.One, {
        retainContextWhenHidden: true,
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(_path.join(context.extensionPath, "media"))],
      });

      const manager = new EIJEManager(context, panel, uri ? uri.fsPath : null);
    });
  }

  constructor(private readonly _context: vscode.ExtensionContext) {}
}

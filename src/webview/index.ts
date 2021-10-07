import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { extensionName } from '../constants';

export class SimulatorPanel {

   public static currentPanel?: SimulatorPanel;
   public static readonly viewType = `${extensionName}.simulator`;

   private readonly _panel: vscode.WebviewPanel;
   private readonly _extensionUri: vscode.Uri;
   private _disposables: vscode.Disposable[] = [];

   private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
      this._panel = panel;
      this._extensionUri = extensionUri;

      this._update();

      this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
      this._panel.webview.onDidReceiveMessage(
         message => { },
         undefined,
         this._disposables
      );
   }

   dispose() {
      SimulatorPanel.currentPanel = undefined;

      this._panel.dispose();

      this._disposables.forEach(d => d.dispose());
   }

   static createOrShow(extensionUri: vscode.Uri) {
      const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

      if (SimulatorPanel.currentPanel) {
         SimulatorPanel.currentPanel._panel.reveal(column);
         return;
      }

      const panel = vscode.window.createWebviewPanel(
         SimulatorPanel.viewType,
         'Simulator',
         column || vscode.ViewColumn.One,
         SimulatorPanel.getWebviewOptions(extensionUri)
      );

      SimulatorPanel.currentPanel = new SimulatorPanel(panel, extensionUri);
   }

   private static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
      SimulatorPanel.currentPanel = new SimulatorPanel(panel, extensionUri);
   }

   private static getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
      return {
         enableScripts: true,
         localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist')]
      };
   }

   private _update() {
      this._panel.webview.html = this.getWebviewContent(this._panel.webview, this._extensionUri);
   }

   private getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
      return this.replaceHtmlVars(
         fs.readFileSync(path.join(extensionUri.fsPath, 'dist', 'webview.html')).toString('utf-8'),
         webview,
         extensionUri.fsPath
      );
   }

   private replaceHtmlVars(html: string, webview: vscode.Webview, extensionPath: string): string {
      return html
         .replace(/\${scriptNonce}/g, this.getNonce())
         .replace(/\${styleNonce}/g, this.getNonce())
         .replace(/\${cspSource}/g, webview.cspSource)
         .replace(/\${distPath}/g, webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'dist'))).toString());
   }

   private getNonce() {
      let text = '';
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (let i = 0; i < 32; i++) {
         text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
   }

}

import * as vscode from 'vscode';
import * as path from 'path';
import * as ejs from 'ejs';
import { extensionName } from '../constants';

export class Webview {

   private readonly disposables: vscode.Disposable[] = [];

   constructor(extensionUri: vscode.Uri) {
      this.disposables.push(
         SimulatorPanel.registerSerializer(extensionUri)
      );
   }

   dispose(): void {
      this.disposables.forEach(d => d.dispose());
   }

}

export class SimulatorPanel {

   public static currentPanel?: SimulatorPanel;
   public static readonly viewType = `${extensionName}.simulator`;

   private disposables: vscode.Disposable[] = [];

   private constructor(
      private readonly panel: vscode.WebviewPanel,
      private readonly extensionUri: vscode.Uri
   ) {
      this.extensionUri = extensionUri;

      this.update();

      this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
      this.panel.webview.onDidReceiveMessage(
         message => { },
         undefined,
         this.disposables
      );
   }

   dispose() {
      SimulatorPanel.currentPanel = undefined;

      this.panel.dispose();

      this.disposables.forEach(d => d.dispose());
   }

   static createOrShow(extensionUri: vscode.Uri) {
      const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

      if (SimulatorPanel.currentPanel) {
         SimulatorPanel.currentPanel.panel.reveal(column);
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
         localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist', 'webview')]
      };
   }

   private async update() {
      this.panel.webview.html = await this.getWebviewContent(this.panel.webview, this.extensionUri);
   }

   private async getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): Promise<string> {
      return await ejs.renderFile(
         path.join(extensionUri.fsPath, 'dist', 'webview', 'index.ejs'),
         {
            scriptNonce: this.getNonce(),
            styleNonce: this.getNonce(),
            cspSource: webview.cspSource,
            distPath: webview.asWebviewUri(vscode.Uri.file(path.join(extensionUri.fsPath, 'dist', 'webview'))).toString(),
            iframeSrc: 'http://localhost:3000'
         }
      );
   }

   static registerSerializer(extensionUri: vscode.Uri): vscode.Disposable {
      if (vscode.window.registerWebviewPanelSerializer) {
         return vscode.window.registerWebviewPanelSerializer(SimulatorPanel.viewType, {
            async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
               webviewPanel.webview.options = SimulatorPanel.getWebviewOptions(extensionUri);
               SimulatorPanel.revive(webviewPanel, extensionUri);
            }
         });
      }
      return { dispose: () => { } };
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

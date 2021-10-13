import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as ejs from 'ejs';
import * as equal from 'fast-deep-equal';
import { extensionName } from '../constants';

type Script = {
   name: string,
   content: string
};

type SimulatorOptions = {
   pythonOnly: boolean,
   scripts: Script[]
};

export class Webview {

   private readonly disposables: vscode.Disposable[] = [];

   constructor(extensionUri: vscode.Uri) {
      this.disposables.push(
         SimulatorPanel.registerSerializer(extensionUri),
         ...this.registerCommands(extensionUri)
      );
   }

   dispose(): void {
      this.disposables.forEach(d => d.dispose());
   }

   registerCommands(extensionUri: vscode.Uri): vscode.Disposable[] {
      return [
         vscode.commands.registerCommand(`${extensionName}.runSimulator`, () => this.runSimulator(extensionUri)),
         vscode.commands.registerCommand(`${extensionName}.runInSimulator`, (uri?: vscode.Uri) => {
            const scripts: Script[] = [];

            if (uri) {
               const name = path.basename(uri.fsPath);
               const content = fs.readFileSync(uri.fsPath).toString();
               scripts.push({ name, content });
            }

            this.runSimulator(extensionUri, { pythonOnly: true, scripts });
         })
      ];
   }

   private runSimulator(extensionUri: vscode.Uri, options?: Partial<SimulatorOptions>): void {
      SimulatorPanel.createOrShow(extensionUri, options);
   }

}

class SimulatorPanel {

   public static currentPanel?: SimulatorPanel;
   public static readonly viewType = `${extensionName}.simulator`;

   private disposables: vscode.Disposable[] = [];

   private constructor(
      private readonly panel: vscode.WebviewPanel,
      private readonly extensionUri: vscode.Uri,
      private options: SimulatorOptions
   ) {
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

   static createOrShow(extensionUri: vscode.Uri, options?: Partial<SimulatorOptions>) {
      const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

      const fullOptions: SimulatorOptions = { pythonOnly: false, scripts: [], ...options };

      if (SimulatorPanel.currentPanel) {
         if (
            SimulatorPanel.currentPanel.options.pythonOnly !== fullOptions.pythonOnly
            || !equal(SimulatorPanel.currentPanel.options.scripts, fullOptions.scripts)
         ) {
            SimulatorPanel.currentPanel.options = fullOptions;
            const query = '?' + fullOptions.scripts
               .map(script => `scriptName=${encodeURI(script.name)}&scriptContent=${encodeURI(script.content)}`)
               .join('&');
            SimulatorPanel.currentPanel.panel.webview.postMessage({
               command: 'UpdateIframeSource',
               source: 'http://localhost:3000' + (fullOptions.pythonOnly ? '/python' : '') + query,
            });
         }

         SimulatorPanel.currentPanel.panel.reveal();
         return;
      }

      const panel = vscode.window.createWebviewPanel(
         SimulatorPanel.viewType,
         'Simulator',
         column || vscode.ViewColumn.One,
         SimulatorPanel.getWebviewOptions(extensionUri)
      );

      SimulatorPanel.currentPanel = new SimulatorPanel(panel, extensionUri, fullOptions);
   }

   private static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
      SimulatorPanel.currentPanel = new SimulatorPanel(panel, extensionUri, { pythonOnly: false, scripts: [] });
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
      const iframeHostSource = 'http://localhost:3000';
      const iframeSourceQuery = '?' + this.options.scripts
         .map(script => `scriptName=${encodeURI(script.name)}&scriptContent=${encodeURI(script.content)}`)
         .join('&');
      return await ejs.renderFile(
         path.join(extensionUri.fsPath, 'dist', 'webview', 'index.ejs'),
         {
            scriptNonce: this.getNonce(),
            styleNonce: this.getNonce(),
            cspSource: webview.cspSource,
            iframeHostSource,
            iframeSource: iframeHostSource + (this.options.pythonOnly ? '/python' : '') + iframeSourceQuery,
            distPath: webview.asWebviewUri(vscode.Uri.file(path.join(extensionUri.fsPath, 'dist', 'webview'))).toString()
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

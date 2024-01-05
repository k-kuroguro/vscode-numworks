import * as ejs from 'ejs';
import * as equal from 'fast-deep-equal';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Config } from '../config';
import { extensionName } from '../constants';

type Script = {
   uri: vscode.Uri,
   name: string,
   content: string
};

type PanelOptions = {
   column: vscode.ViewColumn
};

type SimulatorOptions = {
   pythonOnly: boolean,
   scripts: Script[]
};

type Options = PanelOptions & SimulatorOptions;

const config = Config.getInstance();
const scriptExt = '.py';

const uriToScript = (uri: vscode.Uri): Script => ({
   uri,
   name: path.basename(uri.fsPath),
   content: fs.readFileSync(uri.fsPath).toString()
});

const getScriptsFromUri = (uri: vscode.Uri): Script[] => {
   if (!config.allowMultipleScripts) return [uriToScript(uri)];

   const parent = vscode.Uri.joinPath(uri, '..');
   const scriptUris = fs.readdirSync(parent.fsPath)
      .filter(f => path.extname(f) === scriptExt)
      .sort()
      .map(f => vscode.Uri.joinPath(parent, f));
   return scriptUris.map(uriToScript);
};

const getScriptsFromEditor = (editor: vscode.TextEditor): Script[] => getScriptsFromUri(editor.document.uri);

export class Webview {

   private readonly disposables: vscode.Disposable[] = [];

   constructor(extensionUri: vscode.Uri) {
      this.disposables.push(
         ...this.registerCommands(extensionUri)
      );
   }

   dispose(): void {
      this.disposables.forEach(d => d.dispose());
   }

   registerCommands(extensionUri: vscode.Uri): vscode.Disposable[] {
      return [
         vscode.commands.registerCommand(`${extensionName}.runSimulator`, () =>
            this.runSimulator(extensionUri, { column: vscode.window.activeTextEditor?.viewColumn })
         ),
         vscode.commands.registerCommand(`${extensionName}.runPythonSimulator`, (uri?: vscode.Uri) => {
            const scripts = uri
               ? getScriptsFromUri(uri)
               : vscode.window.activeTextEditor ? getScriptsFromEditor(vscode.window.activeTextEditor) : [];
            this.runSimulator(extensionUri, { pythonOnly: true, scripts, column: vscode.window.activeTextEditor?.viewColumn });
         }),
         vscode.commands.registerCommand(`${extensionName}.runPythonSimulatorAtTheSide`, (uri?: vscode.Uri) => {
            const scripts = uri
               ? getScriptsFromUri(uri)
               : vscode.window.activeTextEditor ? getScriptsFromEditor(vscode.window.activeTextEditor) : [];
            this.runSimulator(extensionUri, { pythonOnly: true, scripts, column: vscode.ViewColumn.Two });
         })
      ];
   }

   private runSimulator(extensionUri: vscode.Uri, options?: Partial<Options>): void {
      SimulatorPanel.createOrShow(extensionUri, options);
   }

}

class SimulatorPanel {

   public static currentPanel?: SimulatorPanel;
   public static readonly viewType = `${extensionName}.simulator`;

   private disposables: vscode.Disposable[] = [];
   private watchers: fs.FSWatcher[] = [];

   private constructor(
      private readonly panel: vscode.WebviewPanel,
      private readonly extensionUri: vscode.Uri,
      private options: SimulatorOptions
   ) {
      this.updateContent();

      this.watchers = options.scripts.map(script =>
         fs.watch(script.uri.fsPath, () => {
            this.options.scripts = getScriptsFromUri(script.uri);
            SimulatorPanel.currentPanel?.updateContent();
         }));

      this.disposables.push(
         this.panel.onDidDispose(() => {
            this.dispose();
            this.watchers.forEach(w => w.close());
         }),
         this.panel.webview.onDidReceiveMessage(
            message => {
               switch (message.command) {
                  case 'RequestScripts':
                     this.sendScripts();
                     break;
               }
            }
         )
      );

      this.panel.iconPath = vscode.Uri.joinPath(extensionUri, 'resources', 'icon', 'webview.svg');
   }

   dispose() {
      SimulatorPanel.currentPanel = undefined;

      this.panel.dispose();

      this.disposables.forEach(d => d.dispose());
   }

   static createOrShow(extensionUri: vscode.Uri, options?: Partial<Options>) {
      const column = options?.column;
      const simulatorOptions: SimulatorOptions = { pythonOnly: false, scripts: [], ...options };

      // panel.reveal does not work well when change column to Two, so recreate panel.
      if (column === vscode.ViewColumn.Two) {
         SimulatorPanel.currentPanel?.panel.dispose();
      }

      if (SimulatorPanel.currentPanel) {
         if (!equal(SimulatorPanel.currentPanel.options.scripts, simulatorOptions.scripts)) {
            SimulatorPanel.currentPanel.watchers.forEach(w => w.close());
            SimulatorPanel.currentPanel.watchers = simulatorOptions.scripts.map(script =>
               fs.watch(script.uri.fsPath, () => {
                  if (!SimulatorPanel.currentPanel) return;
                  SimulatorPanel.currentPanel.options.scripts = getScriptsFromUri(script.uri);
                  SimulatorPanel.currentPanel.updateContent();
               }));
         }

         SimulatorPanel.currentPanel.options = simulatorOptions;

         SimulatorPanel.currentPanel.updateContent();

         SimulatorPanel.currentPanel.panel.reveal(column);
         return;
      }

      const panel = vscode.window.createWebviewPanel(
         SimulatorPanel.viewType,
         'Simulator',
         column || vscode.ViewColumn.One,
         SimulatorPanel.getWebviewOptions(extensionUri)
      );

      SimulatorPanel.currentPanel = new SimulatorPanel(panel, extensionUri, simulatorOptions);
   }

   private static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
      SimulatorPanel.currentPanel = new SimulatorPanel(panel, extensionUri, { pythonOnly: false, scripts: [] });
   }

   private static getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
      return {
         enableScripts: true,
         localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'resources', 'webview')]
      };
   }

   private async updateContent() {
      this.panel.webview.html = await this.getWebviewContent(this.panel.webview, this.extensionUri);
      this.sendScripts();
   }

   private async getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): Promise<string> {
      const iframeHostSource = 'http://localhost:3000';
      return await ejs.renderFile(
         path.join(extensionUri.fsPath, 'resources', 'webview', 'index.ejs'),
         {
            scriptNonce: this.getNonce(),
            styleNonce: this.getNonce(),
            cspSource: webview.cspSource,
            iframeHostSource,
            iframeSource: iframeHostSource + (this.options.pythonOnly ? '/python' : ''),
            resourcePath: webview.asWebviewUri(vscode.Uri.file(path.join(extensionUri.fsPath, 'resources', 'webview'))).toString(),
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

   private sendScripts() {
      this.panel.webview.postMessage({
         command: 'SendScripts',
         scripts: this.options.scripts
      });
   }
}

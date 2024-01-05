import * as vscode from 'vscode';
import { extensionName } from './constants';

export class Config {

   private _onDidChangeConfig: vscode.EventEmitter<Config.ConfigItems | undefined | void> = new vscode.EventEmitter<Config.ConfigItems | undefined | void>();
   readonly onDidChangeConfig: vscode.Event<Config.ConfigItems | undefined | void> = this._onDidChangeConfig.event;

   private static instance: Config = new Config();
   private workspaceConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(extensionName);
   private disposables: vscode.Disposable[] = [];

   private constructor() {
      this.disposables.push(
         vscode.workspace.onDidChangeConfiguration(e => {
            this.loadWorkspaceConfig();
            if (e.affectsConfiguration(`${extensionName}.${Config.ConfigItem.AllowMultipleScripts}`)) this._onDidChangeConfig.fire([Config.ConfigItem.AllowMultipleScripts]);
         })
      );
   }

   static getInstance(): Config {
      return Config.instance;
   }

   loadWorkspaceConfig(): void {
      this.workspaceConfig = vscode.workspace.getConfiguration(extensionName);
   }

   dispose(): void {
      this.disposables.forEach(d => d.dispose());
   }

   get allowMultipleScripts(): boolean {
      return this.workspaceConfig.get(Config.ConfigItem.AllowMultipleScripts) ?? false;
   }

   set allowMultipleScripts(allow: boolean) {
      this.workspaceConfig.update(Config.ConfigItem.AllowMultipleScripts, allow, vscode.ConfigurationTarget.Global);
      this._onDidChangeConfig.fire([Config.ConfigItem.AllowMultipleScripts]);
   }

}

export namespace Config {

   export const ConfigItem = {
      AllowMultipleScripts: 'allowMultipleScripts'
   } as const;
   export type ConfigItem = typeof ConfigItem[keyof typeof ConfigItem];
   export type ConfigItems = ConfigItem[];

}

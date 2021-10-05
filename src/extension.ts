import { ExtensionContext } from 'vscode';
import { registerCommands } from './commands';

//TODO: server port
//TODO: python only or full sim
//TODO: setting
//TODO: activation event
//TODO: 書き込み 読み込み

export function activate(context: ExtensionContext) {
   context.subscriptions.push(
      ...registerCommands(context.extensionPath)
   );
}

export function deactivate() { }

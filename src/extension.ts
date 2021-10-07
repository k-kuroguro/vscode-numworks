import * as path from 'path';
import { ExtensionContext } from 'vscode';
import { registerCommands } from './commands';
import { Server } from './server';

//TODO: server port
//TODO: setting
//TODO: activation event
//TODO: 書き込み 読み込み

export function activate(context: ExtensionContext) {
   const sv = new Server(path.join(context.extensionPath, 'dist'));

   context.subscriptions.push(
      sv,
      ...registerCommands(sv)
   );
}

export function deactivate() { }

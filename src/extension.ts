import * as path from 'path';
import { ExtensionContext } from 'vscode';
import { registerCommands } from './commands';
import { Server } from './server';
import { Webview } from './webview';

//TODO: server port
//TODO: setting
//TODO: activation event
//TODO: 書き込み 読み込み
//TODO: リソース整理
//TODO: webview sv未起動時処理
//TODO: res minify

export function activate(context: ExtensionContext) {
   //TODO: Uri or Path 統一
   const sv = new Server(path.join(context.extensionPath, 'dist'));

   context.subscriptions.push(
      sv,
      new Webview(context.extensionUri),
      ...registerCommands(context.extensionUri, sv)
   );
}

export function deactivate() { }

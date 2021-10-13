import * as path from 'path';
import { ExtensionContext } from 'vscode';
import { Server } from './server';
import { Webview } from './webview';

//TODO: res minify
//TODO: Url ハードコーディング
//TODO: sim 最適化
//TODO: webview上のショートかっと

export function activate(context: ExtensionContext) {
   //TODO: Uri or Path 統一
   const sv = new Server(path.join(context.extensionPath, 'dist'));
   sv.open();

   context.subscriptions.push(
      sv,
      new Webview(context.extensionUri)
   );
}

export function deactivate() { }

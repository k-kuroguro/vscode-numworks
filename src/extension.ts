import * as path from 'path';
import { ExtensionContext } from 'vscode';
import { Config } from './config';
import { Server } from './server';
import { Webview } from './webview';

//TODO: res minify
//TODO: Url ハードコーディング

export function activate(context: ExtensionContext) {
   //TODO: Uri or Path 統一
   const sv = new Server(path.join(context.extensionPath, 'resources', 'simulator'));
   sv.open();

   const config = Config.getInstance();
   const webview = new Webview(context.extensionUri);

   context.subscriptions.push(
      sv,
      config,
      webview
   );
}

export function deactivate() { }

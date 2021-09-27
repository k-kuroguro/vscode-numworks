import * as assert from 'assert';
import * as vscode from 'vscode';
import { extensionId } from '../../constants';

suite('Extension Test Suite', () => {
   let extension: vscode.Extension<any>;
   const timeout = async (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

   suiteSetup(() => {
      extension = vscode.extensions.getExtension(extensionId) as vscode.Extension<any>;
   });

   test('Activation test', async () => {
      await extension.activate();
      assert.strictEqual(extension.isActive, true);
   });

   test('Extension loads in VSCode and is active', async () => {
      await timeout(1500);
      assert.strictEqual(extension.isActive, true);
   });
});

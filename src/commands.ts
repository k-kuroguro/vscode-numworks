import open = require('open');
import { commands, Disposable, window } from 'vscode';
import { extensionName } from './constants';
import { Server } from './server';

const runSimulator = async (path: string) => {
   const sv = new Server(path);
   sv.open();
   if (await window.showInformationMessage('open http://loclahost:3000 in chrome', 'open') === 'open') {
      open('http://localhost:3000', { app: { name: open.apps.chrome } });
   }
};

export const registerCommands = (path: string): Disposable[] => {
   return [
      commands.registerCommand(`${extensionName}.runSimulator`, () => runSimulator(path))
   ];
};

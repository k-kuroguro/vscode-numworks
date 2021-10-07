import * as open from 'open';
import { commands, Disposable, window } from 'vscode';
import { extensionName } from '../constants';
import { Server } from '../server';

const runSimulator = async (sv: Server) => {
   sv.open();
   if (await window.showInformationMessage('Open http://loclahost:3000 in chrome', 'Open') === 'Open') {
      open('http://localhost:3000', { app: { name: open.apps.chrome } });
   }
};

export const registerCommands = (sv: Server): Disposable[] => {
   return [
      commands.registerCommand(`${extensionName}.runSimulator`, () => runSimulator(sv))
   ];
};

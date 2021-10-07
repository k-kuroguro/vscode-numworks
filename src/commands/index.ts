import * as open from 'open';
import { commands, Disposable, window } from 'vscode';
import { extensionName } from '../constants';
import { Server } from '../server';

const runSimulator = async (sv: Server, pythonOnly: boolean = false) => {
   sv.open();
   //TODO: Do not ask again.
   const url = `http://localhost:3000${pythonOnly ? '/python' : ''}`;
   const result = await window.showInformationMessage(`Open ${url} in chrome`, 'Open');
   if (result === 'Open') open(url, { app: { name: open.apps.chrome } });
};

export const registerCommands = (sv: Server): Disposable[] => {
   return [
      commands.registerCommand(`${extensionName}.runSimulator`, () => runSimulator(sv)),
      commands.registerCommand(`${extensionName}.runPythonSimulator`, () => runSimulator(sv, true))
   ];
};

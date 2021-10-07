import * as open from 'open';
import { commands, Disposable, window } from 'vscode';
import { extensionName } from '../constants';
import { Server } from '../server';

const openSimulator = async (sv: Server, pythonOnly: boolean = false) => {
   if (!sv.isOpened()) sv.open();
   open(`http://localhost:3000${pythonOnly ? '/python' : ''}`, { app: { name: open.apps.chrome } });
};

export const registerCommands = (sv: Server): Disposable[] => {
   return [
      commands.registerCommand(`${extensionName}.openSimulator`, () => openSimulator(sv)),
      commands.registerCommand(`${extensionName}.openPythonSimulator`, () => openSimulator(sv, true))
   ];
};

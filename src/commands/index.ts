import { commands, Disposable, Uri } from 'vscode';
import { extensionName } from '../constants';
import { Server } from '../server';
import { SimulatorPanel } from '../webview';

const openSimulator = async (extensionUri: Uri, sv: Server) => {
   if (!sv.isOpened()) sv.open();
   SimulatorPanel.createOrShow(extensionUri);
};

export const registerCommands = (extensionUri: Uri, sv: Server): Disposable[] => {
   return [
      commands.registerCommand(`${extensionName}.openSimulator`, () => openSimulator(extensionUri, sv))
   ];
};

import { commands, Disposable, Uri } from 'vscode';
import { extensionName } from '../constants';
import { SimulatorPanel } from '../webview';

const openSimulator = async (extensionUri: Uri) => {
   SimulatorPanel.createOrShow(extensionUri);
};

export const registerCommands = (extensionUri: Uri): Disposable[] => {
   return [
      commands.registerCommand(`${extensionName}.openSimulator`, () => openSimulator(extensionUri))
   ];
};

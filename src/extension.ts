import * as vscode from 'vscode';
import { IdeCommands } from './modules/ide/commands';
import { parseRange } from './utils';

export const PREFIX: string = 'xoQAMaintCIJobAnalyzer';

export function activate(context: vscode.ExtensionContext) {
	function newCommand(shortName: string, fn: (...args: any[]) => any, thisArg?: any) {
		context.subscriptions.push(vscode.commands.registerCommand(`${PREFIX}.${shortName}`, fn));
	}


	const commands = new IdeCommands();
	commands.init();

	newCommand('pullTheBuilds', async () => {
		let buildsInput = await vscode.window.showInputBox({
			placeHolder: '10, 11, 12-15',
			prompt: 'the range is inclusive'
		});
		if (!buildsInput) {
			// do nothing
			return;
		}
		let builds = parseRange(buildsInput);
		commands.pullTheBuilds(builds);
	});

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
		commands.readConfiguration();
	}));
	context.subscriptions.push(vscode.commands.registerTextEditorCommand(`${PREFIX}.showTCInfo`, (editor, edit) => {
		commands.createAWebView(editor);
	}));

}

// this method is called when your extension is deactivated
export function deactivate() { }

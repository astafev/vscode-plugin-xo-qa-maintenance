import * as vscode from 'vscode';
import { IdeCommands } from './modules/vscode/commands';
import { parseRange, makeLogger } from './utils';
import { TreeView } from './modules/vscode/tree-view/treeView';
import { FileTreeItem } from './modules/vscode/tree-view/fileItem';
import { ProtractorRun } from './modules/vscode/protractor-runner';
import { TestTreeItem } from './modules/vscode/tree-view/testItem';

export const PREFIX: string = 'xoQAMaintCIJobAnalyzer';

export function activate(context: vscode.ExtensionContext) {
	function newCommand(shortName: string, fn: (...args: any[]) => any, _thisArg?: any) {
		context.subscriptions.push(vscode.commands.registerCommand(`${PREFIX}.${shortName}`, fn));
	}
	const log = makeLogger();

	const commands = new IdeCommands();
	commands.init();

	newCommand('protractorRun', ProtractorRun.run);
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
	newCommand('showTCInfo2', (item) => {
		if (item instanceof TestTreeItem) {
			try {
				commands.createAWebViewFromIdTitle({
					id: item.id,
					title: item.testName,
				});
			} catch (e) {
				unhandledError(e);
			}	
		}
	});
	context.subscriptions.push(vscode.commands.registerTextEditorCommand(`${PREFIX}.showTCInfo`, (editor, edit) => {
		try {
			commands.createAWebViewFromEditor(editor);
		} catch (e) {
			unhandledError(e);
		}
	}));

	log.debug('Creating a tree view');
	vscode.window.registerTreeDataProvider('testsExplorer', new TreeView(context));

	function unhandledError(e: any) {
		log.error(`Error occured! Uncaught exception. `, e);
		commands.error(`Uncaught exception. ${e}`);
	}
	process.on('uncaughtException', unhandledError);
	process.on('unhandledRejection', unhandledError);
}


// this method is called when your extension is deactivated
export function deactivate() { }

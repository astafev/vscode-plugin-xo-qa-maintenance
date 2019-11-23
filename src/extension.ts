import * as vscode from 'vscode';
import { IdeCommands } from './modules/vscode/commands';
import { makeLogger } from './utils';
import { TreeView } from './modules/vscode/tree-view/treeView';
import { ProtractorRun } from './modules/vscode/protractor-runner';
import { TestTreeItem } from './modules/vscode/tree-view/testItem';
import { Configuration } from './modules/vscode/configuration';

export const PREFIX: string = 'xoQAMaintCIJobAnalyzer';

export function activate(context: vscode.ExtensionContext) {
	function newCommand(shortName: string, fn: (...args: any[]) => any, _thisArg?: any) {
		context.subscriptions.push(vscode.commands.registerCommand(`${PREFIX}.${shortName}`, fn));
	}
	const log = makeLogger();

	const myCommands = new IdeCommands();
	Configuration.init();

	const treeDataProvider = new TreeView(context);
	//vscode.window.registerTreeDataProvider('testsExplorer', treeView);
	let treeView = vscode.window.createTreeView('testsExplorer', { treeDataProvider });
	treeDataProvider.treeView = treeView;
	


	newCommand('pullTheBuilds', () => {
		return myCommands.pullTheBuildsCmd().then(() => {
			return treeDataProvider.refresh();
		});
	});

	newCommand('pullCiBuilds...', () => {
		return myCommands.pullCiBuildsCmd().then(() => {
			return treeDataProvider.refresh();
		});
	});

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
		return Configuration.onUpdate(event);
	}));
	newCommand('showTCInfo2', (item) => {
		if (item instanceof TestTreeItem) {
			try {
				myCommands.createAWebViewFromIdTitle({
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
			myCommands.createAWebViewFromEditor(editor);
		} catch (e) {
			unhandledError(e);
		}
	}));
	context.subscriptions.push(vscode.commands.registerTextEditorCommand(`${PREFIX}.protractorRun`, (editor, edit) => {
		try {
			ProtractorRun.run(editor);
		} catch (e) {
			unhandledError(e);
		}
	}));
	/*newCommand('protractorRun', (el)=> {
		return ProtractorRun.runTreeView(el);
	});*/

	newCommand('refreshNode', (el) => treeDataProvider.refreshNode(el));
	

	function unhandledError(e: any) {
		log.error(`Error occured! Uncaught exception. `, e);
		myCommands.error(`Uncaught exception. ${e}`);
	}
	process.on('uncaughtException', unhandledError);
	process.on('unhandledRejection', unhandledError);


	// TODO actions right in the code:
	// https://github.com/gabduss/runProtractorVsCodeExtension/blob/master/src/extension.ts

	// context.subscriptions.push(vscode.languages.registerCodeLensProvider())
}


// this method is called when your extension is deactivated
export function deactivate() { }

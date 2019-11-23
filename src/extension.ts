import * as vscode from 'vscode';
import { IdeCommands } from './modules/vscode/commands';
import { parseRange, makeLogger } from './utils';
import { TreeView } from './modules/vscode/tree-view/treeView';
import { FileTreeItem } from './modules/vscode/tree-view/fileItem';
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

	const treeView = new TreeView(context);
	vscode.window.registerTreeDataProvider('testsExplorer', treeView);
	
	newCommand('pullTheBuilds', () => {
		return myCommands.pullTheBuildsCmd().then(()=>{
			return treeView.refresh();
		});
	});
	
	newCommand('pullCiBuilds...', () => {
		return myCommands.pullCiBuildsCmd().then(()=>{
			return treeView.refresh();
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
	context.subscriptions.push(vscode.commands.registerTextEditorCommand(`${PREFIX}.showInTreeView`, async (editor, edit) => {
		try {
			myCommands.showInTreeView(editor);
		} catch (e) {
			unhandledError(e);
		}
	}));
	context.subscriptions.push(vscode.commands.registerTextEditorCommand(`${PREFIX}.protractorRun`, (editor, edit) => {
		try {
			ProtractorRun.runFromEditor(editor);
		} catch (e) {
			unhandledError(e);
		}
	}));

	log.debug('Creating a tree view');
	newCommand('refreshNode', (el) => treeView.refreshNode(el));
	newCommand('protractorRun', ProtractorRun.runTreeView);

	function unhandledError(e: any) {
		log.error(`Error occured! Uncaught exception. `, e);
		myCommands.error(`Uncaught exception. ${e}`);
	}
	process.on('uncaughtException', unhandledError);
	process.on('unhandledRejection', unhandledError);
}


// this method is called when your extension is deactivated
export function deactivate() { }

import * as vscode from 'vscode';
import { IdeCommands } from './modules/ide/commands';
import { parseRange } from './utils';

export function activate(context: vscode.ExtensionContext) {
	let commands = new IdeCommands({
		jenkinsToken: '11e511b2463afa1d7ec883db743dad6ea9',
		jenkinsUser: 'eastafev'
	}, {
		db: 'F:/data/vscode-extension-maintenance/responsetek.db',
		jenkinsJob: 'http://jenkins.aureacentral.com/job/ResponseTek/job/eng-qa-integration/job/common-pipeline/'
	});
	console.log('Starting');
	//commands.init();
	console.log('Started');
	let disposable = vscode.commands.registerCommand('xoQAMaintCIJobAnalyzer.pullTheBuilds', async () => {
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

	context.subscriptions.push(disposable);


}

// this method is called when your extension is deactivated
export function deactivate() { }

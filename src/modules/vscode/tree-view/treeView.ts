import * as vscode from 'vscode';
import { FileTreeItem } from './fileItem';
import { makeLogger } from '../../../utils';

export interface TreeViewItem {
    toTreeItem(context: vscode.ExtensionContext): Promise<vscode.TreeItem>;
    getChildren(): Promise<TreeViewItem[]>;
    toString(): string;
}


/**
 * https://github.com/vscode-box/vscode-ast/blob/master/src/astExplorer.ts
 */
export class TreeView implements vscode.TreeDataProvider<TreeViewItem> {
    private log = makeLogger();

    private _onDidChangeTreeData: vscode.EventEmitter<TreeViewItem | undefined> = new vscode.EventEmitter<TreeViewItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TreeViewItem | undefined> = this._onDidChangeTreeData.event;

    constructor(private context: vscode.ExtensionContext) {
        vscode.commands.registerCommand('xoQAMaintCIJobAnalyzer.openFile', (resource, line) => this.openResource(resource, line));
    }

    private openResource(resource: string, line: number = 1): void {
        let position = new vscode.Position(line, 0);
        vscode.window.showTextDocument(vscode.Uri.file(resource), {
            selection: new vscode.Range(position, position)
        });
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }

    refreshNode(element: TreeViewItem) {
        this._onDidChangeTreeData.fire(element);
    }

    getTreeItem(element: TreeViewItem): Thenable<vscode.TreeItem> {
        return element.toTreeItem(this.context);
    }

    getChildren(element?: TreeViewItem | undefined): Promise<TreeViewItem[]> {
        if (!element) {
            return Promise.all([this.getRoot()]);
        }
        return element.getChildren();
    }

    private getRoot(): Promise<TreeViewItem> {
        if (!vscode.workspace.rootPath) {
            this.log.info(`Root path is not available. ${JSON.stringify(vscode.workspace)}`);
            return Promise.resolve({
                toTreeItem: (context) => {
                    return Promise.resolve(new vscode.TreeItem(`Can't detect the root path`));
                }
            } as TreeViewItem
            );
        }
        this.log.info(`Getting root for ${vscode.workspace.rootPath}`);
        return FileTreeItem.parseRoot(vscode.workspace.rootPath);
    }
}
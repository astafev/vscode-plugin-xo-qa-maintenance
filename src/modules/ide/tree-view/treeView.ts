import * as vscode from 'vscode';
import { FileTreeItem } from './fileItem';
import { makeLogger } from '../../../utils';

export interface TreeViewItem {
    toTreeItem(): Promise<vscode.TreeItem>;
    getChildren(): Promise<TreeViewItem[]>;
    toString(): string;
}


/**
 * https://github.com/vscode-box/vscode-ast/blob/master/src/astExplorer.ts
 */
export class TreeView implements vscode.TreeDataProvider<TreeViewItem> {
    private log = makeLogger();
    onDidChangeTreeData?: vscode.Event<TreeViewItem | null | undefined> | undefined;

    getTreeItem(element: TreeViewItem): Thenable<vscode.TreeItem> {
        return element.toTreeItem();
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
                toTreeItem: () => {
                    return Promise.resolve(new vscode.TreeItem(`Can't detect the root path`));
                }
            } as TreeViewItem
            );
        }
        this.log.info(`Getting root for ${vscode.workspace.rootPath}`);
        return FileTreeItem.parseRoot(vscode.workspace.rootPath);
    }
}
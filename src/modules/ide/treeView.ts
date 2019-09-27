import * as vscode from 'vscode';

/**
 * https://github.com/vscode-box/vscode-ast/blob/master/src/astExplorer.ts
 */
export class TreeView implements vscode.TreeDataProvider<any> {
    onDidChangeTreeData?: vscode.Event<any> | undefined; getTreeItem(element: any): vscode.TreeItem | Thenable<vscode.TreeItem> {
        throw new Error("Method not implemented.");
    }
    getChildren(element?: any): vscode.ProviderResult<any[]> {
        throw new Error("Method not implemented.");
    }


}
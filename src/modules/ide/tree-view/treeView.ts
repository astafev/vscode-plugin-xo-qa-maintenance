import * as vscode from 'vscode';
import * as fs from 'fs';
import { promisify } from 'util';
import { utils } from 'mocha';

interface TestCaseTreeItem {
    id: number;
    name: string;
}

class FileItem {
    constructor(private readonly uri: vscode.Uri,
        type: vscode.FileType) {
    }

    public isDirectory() {
        return ;
    }
}

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
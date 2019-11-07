import { TreeViewItem, TreeView } from "./treeView";
import * as vscode from 'vscode';
import { TextUtil } from "../text-util";
import * as path from 'path';

export class TestTreeItem implements TreeViewItem {

    constructor(private testName: string,
        private fileName: string,
        private line: number) { }

    toTreeItem(context: vscode.ExtensionContext): Promise<vscode.TreeItem> {
        let treeItem = new vscode.TreeItem(this.testName, vscode.TreeItemCollapsibleState.None);
        treeItem.iconPath = context.asAbsolutePath(path.join('media', 'explorer-icons', 'checked.svg'));
        treeItem.command = { command: 'xoQAMaintCIJobAnalyzer.openFile', title: "Open File", arguments: [this.fileName, this.line], };
        return Promise.resolve(treeItem);
    }

    getChildren(): Promise<TreeViewItem[]> {
        return Promise.resolve([]);
    }

    toString(): string {
        return `it(${this.testName})`;
    }

    static async parseFile(file: string): Promise<TestTreeItem[]> {
        let e2e = await TextUtil.fromPath(file);
        return e2e.getAllTests().map(itFn => {
            return new TestTreeItem(itFn.title, file, itFn.line);
        });
    }
}
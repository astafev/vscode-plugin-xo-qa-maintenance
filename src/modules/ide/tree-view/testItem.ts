import { TreeViewItem, TreeView } from "./treeView";
import * as vscode from 'vscode';
import { TextUtil } from "../text-util";
import * as path from 'path';

export class TestTreeItem implements TreeViewItem {

    constructor(private testName: string) { }

    toTreeItem(context: vscode.ExtensionContext): Promise<vscode.TreeItem> {
        let treeItem = new vscode.TreeItem(this.testName, vscode.TreeItemCollapsibleState.None);
        treeItem.iconPath = context.asAbsolutePath(path.join('media', 'explorer-icons', 'checked.svg'));
        setTimeout(() => {
            treeItem.iconPath = context.asAbsolutePath(path.join('media', 'explorer-icons', 'cancel.svg'));
        }, 2000);
        return Promise.resolve(treeItem);
    }

    getChildren(): Promise<TreeViewItem[]> {
        return Promise.resolve([]);
    }

    toString(): string {
        return `it(${this.testName})`;
    }

    static async parseFile(path: string): Promise<TestTreeItem[]> {
        let e2e = await TextUtil.fromPath(path);
        return e2e.getAllTests().map(itFn => {
            return new TestTreeItem(itFn.title);
        });
    }
}
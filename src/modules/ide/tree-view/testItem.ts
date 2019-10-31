import { TreeViewItem, TreeView } from "./treeView";
import * as vscode from 'vscode';
import { TextUtil } from "../text-util";

export class TestTreeItem implements TreeViewItem {

    constructor(private testName: string) { }

    toTreeItem(): Promise<vscode.TreeItem> {
        return Promise.resolve(new vscode.TreeItem(this.testName, vscode.TreeItemCollapsibleState.None));
    }
    getChildren(): Promise<TreeViewItem[]> {
        return Promise.resolve([]);
    }

    toString(): string {
        return `it(${this.testName})`;
    }

    static async parseFile(path: string): Promise<TestTreeItem[]> {
        let e2e = await TextUtil.fromPath(path);
        return e2e.getAllTests().map(itFn=>{
            return new TestTreeItem(itFn.title);
        });
    }
}
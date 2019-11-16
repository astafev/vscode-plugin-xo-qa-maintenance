import { TreeViewItem, TreeView } from "./treeView";
import * as vscode from 'vscode';
import { TextUtil } from "../text-util";
import * as path from 'path';
import { InfoProvider } from "../../db/info-provider";

export class TestTreeItem implements TreeViewItem {
    public readonly id: number;

    constructor(public readonly testName: string,
        public readonly fileName: string,
        private line: number) {
        this.id = TextUtil.parseTestCaseIdFromTitle(testName);
    }

    async toTreeItem(context: vscode.ExtensionContext): Promise<vscode.TreeItem> {
        let dbData = this.pullDbData();
        return {
            label: this.testName,
            iconPath: this.getIcon(dbData.status, context),
            command: { command: 'xoQAMaintCIJobAnalyzer.openFile', title: "Open File", arguments: [this.fileName, this.line], },
            contextValue: 'testItem',
        };
    }

    private getIcon(status: string, context: vscode.ExtensionContext) {
        let folder = path.join('media', 'explorer-icons', 'statuses');
        switch (status) {
            case "passed":
                return context.asAbsolutePath(path.join(folder, 'success.svg'));
            case "failed":
                return context.asAbsolutePath(path.join(folder, 'failure.svg'));
            default:
                return context.asAbsolutePath(path.join(folder, 'question.svg'));
        }
    }

    private pullDbData() {
        return InfoProvider.instance.getInfoForTreeView(this.id);
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
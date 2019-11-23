import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MyTreeItem } from './treeView';
import { TestTreeItem } from './testItem';
import { makeLogger } from '../../../utils';

const PATH_FROM_ROOT = path.join('e2e', 'test-suites');


const log = makeLogger();
export class FileTreeItem implements MyTreeItem {
    constructor(public readonly filePath: string, private fsStat: fs.Stats,
        private parent?: FileTreeItem,
        private baseName = path.basename(filePath)) {
        log.debug(`Creating a file tree item ${filePath}`);
    }

    getParent() {
        return this.parent;
    }

    get isDirectory() {
        return this.fsStat.isDirectory();
    }

    async getChildren(): Promise<MyTreeItem[]> {
        if (this.fsStat.isDirectory()) {
            return fs.promises.readdir(this.filePath).then(files => {
                return Promise.all(files.map(async (file) => {
                    let fullPath = path.join(this.filePath, file);
                    return new FileTreeItem(fullPath, await fs.promises.lstat(fullPath), this, file);
                }));
            });
        } else {
            if (this.isE2e()) {
                return TestTreeItem.parseFile(this);
            } else {
                return Promise.resolve([]);
            }
        }
    }

    toString(): string {
        return `File: ${path.basename(this.filePath)}`;
    }

    private isE2e(path = this.baseName) {
        return this.baseName.endsWith('.e2e-spec.ts');
    }

    private getIcon(context: vscode.ExtensionContext) {
        let iconPath = (fileName: string) => {
            return context.asAbsolutePath(path.join('media', 'explorer-icons', 'files', `${fileName}.svg`));
        };
        if (this.isE2e()) {
            return iconPath('e2e');
        }
        if (this.baseName.endsWith('helper.ts')) {
            return iconPath('helper');
        }
        if (this.baseName.endsWith('po.ts')) {
            return iconPath('po');
        }
        if (this.baseName.endsWith('constant.ts') || this.baseName.endsWith('constants.ts')) {
            return iconPath('constants');
        }
        return iconPath('file');
    }

    toTreeItem(context: vscode.ExtensionContext): Promise<vscode.TreeItem> {
        let state = vscode.TreeItemCollapsibleState.None;
        if (this.isDirectory) {
            state = vscode.TreeItemCollapsibleState.Collapsed;
        } else if (this.isE2e()) {
            state = vscode.TreeItemCollapsibleState.Collapsed;
        }
        const item = new vscode.TreeItem(this.baseName, state);
        item.contextValue = 'fileItem';
        if (!this.isDirectory) {
            item.command = { command: 'xoQAMaintCIJobAnalyzer.openFile', title: "Open File", arguments: [this.filePath], };
            item.iconPath = this.getIcon(context);
        }
        return Promise.resolve(item);
    }

    static async parseRoot(root: string) {
        const suitesRoot = path.join(root, PATH_FROM_ROOT);
        return new FileTreeItem(suitesRoot, await fs.promises.lstat(suitesRoot));
    }
}

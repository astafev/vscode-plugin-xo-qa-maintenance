import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { TreeViewItem } from './treeView';
import { TestTreeItem } from './testItem';
import { makeLogger } from '../../../utils';

const PATH_FROM_ROOT = 'e2e/test-suites';


const log = makeLogger();
export class FileTreeItem implements TreeViewItem {
    constructor(private filePath: string, private fsStat: fs.Stats, private baseName = path.basename(filePath)) {
        log.info(`Creating a file tree item ${filePath}`);
    }
    
    async getChildren(): Promise<TreeViewItem[]> {
        if (this.fsStat.isDirectory()) {
            return fs.promises.readdir(this.filePath).then(files => {
                return Promise.all(files.map(async (file) => {
                    let fullPath = `${this.filePath}/${file}`;
                    return new FileTreeItem(fullPath, await fs.promises.lstat(fullPath), file);
                }));
            });
        } else {
            if (this.isE2e()) {
                return TestTreeItem.parseFile(this.filePath);
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

    toTreeItem(): Promise<vscode.TreeItem> {
        let state = vscode.TreeItemCollapsibleState.None;
        if (this.fsStat.isDirectory()) {
            state = vscode.TreeItemCollapsibleState.Collapsed;
        } else if (this.isE2e()) {
            state = vscode.TreeItemCollapsibleState.Collapsed;
        }
        return Promise.resolve(new vscode.TreeItem(path.basename(this.filePath), state));
    }

    static async parseRoot(root: string) {
        const suitesRoot = root + `/${PATH_FROM_ROOT}`;
        return new FileTreeItem(suitesRoot, await fs.promises.lstat(suitesRoot));
    }
}

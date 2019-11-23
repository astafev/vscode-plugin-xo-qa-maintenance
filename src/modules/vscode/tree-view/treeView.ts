import * as vscode from 'vscode';
import { FileTreeItem } from './fileItem';
import { makeLogger } from '../../../utils';
import * as path from 'path';
import * as _ from 'lodash';

export interface MyTreeItem {
    toTreeItem(context: vscode.ExtensionContext): Promise<vscode.TreeItem>;
    getChildren(): Promise<MyTreeItem[]>;
    toString(): string;
    getParent(): MyTreeItem | undefined;
}


/**
 * https://github.com/vscode-box/vscode-ast/blob/master/src/astExplorer.ts
 */
export class TreeView implements vscode.TreeDataProvider<MyTreeItem> {
    private log = makeLogger();

    private _onDidChangeTreeData: vscode.EventEmitter<MyTreeItem | undefined> = new vscode.EventEmitter<MyTreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<MyTreeItem | undefined> = this._onDidChangeTreeData.event;

    // need for reveal functionality
    private activeFile?: string;
    treeView?: vscode.TreeView<MyTreeItem>;
    private itemsCache: Map<string, MyTreeItem> = new Map;

    constructor(private context: vscode.ExtensionContext) {
        vscode.commands.registerCommand('xoQAMaintCIJobAnalyzer.openFile', (resource, line) => this.openResource(resource, line));
        if (vscode.window.activeTextEditor) {
            this.activeFile = vscode.window.activeTextEditor.document.fileName;
        }
        vscode.window.onDidChangeActiveTextEditor(e => {
            if (e) {
                this.activeFile = e.document.fileName;
                this.openDocument(this.activeFile);
            }
        });
    }

    openDocument(fileName: string) {
        if (this.treeView) {
            let item = this.itemsCache.get(fileName);
            if (item) {
                this.treeView.reveal(item, { expand: 1 });
            } else {
                // the part of tree is not inited yet, try to walk manually to the correct items
                let pathStack = [fileName];
                while (!item) {
                    let dirName = path.dirname(pathStack[pathStack.length - 1]);
                    item = this.itemsCache.get(dirName);
                    if (!item) {
                        pathStack.push(dirName);
                    }
                    if (pathStack.length > 12) {
                        // too complicated, probably we faced an error
                        return;
                    }
                }

                const treeView = this.treeView;
                function findCorrectItem(item: MyTreeItem | undefined, idx: number) {
                    if (!item) {
                        return;
                    }
                    if (idx === -1) {
                        treeView.reveal(item);
                    }
                    const dirPath = pathStack[idx];
                    item.getChildren().then(items => {
                        const correctDir = items.find(child => {
                            return (child as FileTreeItem).filePath === dirPath;
                        });
                        findCorrectItem(correctDir, idx - 1);
                    });
                }
                findCorrectItem(item, pathStack.length - 1);
            }
        }
    }

    private openResource(resource: string, line: number = 1): void {
        const position = new vscode.Position(line, 0);
        vscode.window.showTextDocument(vscode.Uri.file(resource), {
            selection: new vscode.Range(position, position)
        });

        if (line === 1) {
            const item = this.itemsCache.get(resource);
            if (item && this.treeView) {
                this.treeView.reveal(item, { expand: 1 });
            }
        }
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    refreshNode(element: MyTreeItem) {
        this._onDidChangeTreeData.fire(element);
    }

    getTreeItem(element: MyTreeItem): Thenable<vscode.TreeItem> {
        return element.toTreeItem(this.context).then(item => {

            if (element instanceof FileTreeItem) {
                this.itemsCache.set(element.filePath, element);

                if (this.activeFile && this.activeFile.includes(element.filePath)) {
                    item.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
                }
            }

            return item;
        });
    }


    getChildren(element?: MyTreeItem | undefined): Promise<MyTreeItem[]> {
        if (!element) {
            return Promise.all([this.getRoot()]);
        }
        return element.getChildren();
    }

    private getRoot(): Promise<MyTreeItem> {
        if (!vscode.workspace.rootPath) {
            this.log.info(`Root path is not available. ${JSON.stringify(vscode.workspace)}`);
            return Promise.resolve({
                toTreeItem: (context) => {
                    return Promise.resolve(new vscode.TreeItem(`Can't detect the root path`));
                }
            } as MyTreeItem
            );
        }
        this.log.info(`Getting root for ${vscode.workspace.rootPath}`);
        return FileTreeItem.parseRoot(vscode.workspace.rootPath);
    }

    public getParent(element: MyTreeItem): MyTreeItem | undefined {
        return element.getParent();
    }
}
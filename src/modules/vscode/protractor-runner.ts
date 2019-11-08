import * as vscode from 'vscode';
import * as path from 'path';
import { FileTreeItem } from './tree-view/fileItem';
import { TreeViewItem } from './tree-view/treeView';

/** a lot is borrowed from https://github.com/lnaie/vscode-protractor-test-runner/blob/master/src/extension.ts */
export namespace ProtractorRun {
    let spawnCmd = require('spawn-command');
    let treeKill = require('tree-kill');
    let process: any = null;
    let commandOutput: vscode.OutputChannel = vscode.window.createOutputChannel('ProtractorTestRunnerLog');

    export function run(item: TreeViewItem) {
        if (item instanceof FileTreeItem) {
            let fileItem = item as FileTreeItem;
            if (fileItem.isDirectory) {
                ProtractorRun.startProcess(path.join(fileItem.filePath, '**\\*.e2e-spec.ts'));
            } else {
                ProtractorRun.startProcess(fileItem.filePath);
            }
        }
        console.log(item);
    }

    export function startProcess(filePath: string) {
        // Already running one?
        if (process) {
            const msg = 'There is a command running right now. Terminate it before executing a new command?';
            vscode.window.showWarningMessage(msg, 'Ok', 'Cancel')
                .then((choice) => {
                    if (choice === 'Ok') {
                        killActiveProcess();
                    }
                });
            return;
        }

        // Show log window
        commandOutput.show();

        // Start a new command
        var cmd = `protractor --specs ${filePath}**`;
        commandOutput.appendLine(`> Running command: ${cmd}...`);

        if (!vscode.workspace.rootPath) {
            throw new Error('Root path is not defined, cannot procceed with the command!');
        }
        runShellCommand(cmd, vscode.workspace.rootPath)
            .then(() => {
                commandOutput.appendLine(`> Command finished successfully.`);
            })
            .catch((reason) => {
                commandOutput.appendLine(`> ERROR: ${reason}`);
            });
    }

    // Tries to kill the active process that is running a command.
    export function killActiveProcess() {
        if (!process) {
            return;
        }

        commandOutput.appendLine(`> Killing PID ${process.pid}...`);
        treeKill(process.pid, 'SIGTERM', (err: any) => {
            if (err) {
                commandOutput.appendLine("> ERROR: Failed to kill process.");
            }
            else {
                commandOutput.appendLine("> Process killed.");
                process = null;
            }
        });
    }

    function printOutputDelegate(data: any) {
        commandOutput.append(data.toString());
    }

    function runShellCommand(cmd: string, cwd: string) {
        return new Promise((accept, reject) => {
            var opts: any = {};
            if (vscode.workspace) {
                opts.cwd = cwd;
            }

            process = spawnCmd(cmd, opts);
            process.stdout.on('data', printOutputDelegate);
            process.stderr.on('data', printOutputDelegate);
            process.on('close', (status: any) => {
                if (status) {
                    reject(`Command exited with status code ${status}.`);
                } else {
                    accept();
                }
                process = null;
            });
        });
    }

}
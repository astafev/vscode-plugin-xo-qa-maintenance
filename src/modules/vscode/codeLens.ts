import * as vscode from 'vscode';
import * as _ from 'lodash';
import { TextUtil } from './text-util';


export class CodelensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(doc: vscode.TextDocument, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
        let previous: string[] = [];
        if (!doc.fileName.endsWith('.e2e-spec.ts')) {
            return;
        }
        const e2eParsed = TextUtil.parseTextDocument(doc);

        let arrays = e2eParsed.its.map(test => {
            const position = new vscode.Position(test.line, 4);
            const range = new vscode.Range(position, position);
            const id = `${TextUtil.parseTestCaseIdFromTitle(test.title)}`;
            const array = [new vscode.CodeLens(range, {
                command: "xoQAMaintCIJobAnalyzer.protractorRunFromCodeLens",
                title: "Run",
                arguments: [doc.fileName, id],
            }),
            new vscode.CodeLens(range, {
                command: "xoQAMaintCIJobAnalyzer.showTcInfoFromCodeLens",
                title: "Show TC Info",
                arguments: [test.title],
            }),
            new vscode.CodeLens(range, {
                command: "xoQAMaintCIJobAnalyzer.protractorDebug",
                title: "Debug",
                arguments: [doc.fileName, id],
            })
            ];
            if (!_.isEmpty(previous)) {
                previous.push(id);
                array.push(
                    new vscode.CodeLens(range, {
                        command: "xoQAMaintCIJobAnalyzer.protractorRunFromCodeLens",
                        title: "Run Up To",
                        arguments: [doc.fileName, previous.join('|')],
                    }));
                array.push(
                    new vscode.CodeLens(range, {
                        command: "xoQAMaintCIJobAnalyzer.protractorDebug",
                        title: "Debug Up To",
                        arguments: [doc.fileName, previous.join('|')],
                    })
                );
            } else {
                previous.push(id);
            }
            return array;
        });

        let range = new vscode.Range(new vscode.Position(e2eParsed.describe.line, 4), new vscode.Position(e2eParsed.describe.line, 4));
        arrays.push([
            new vscode.CodeLens(range, {
                command: "xoQAMaintCIJobAnalyzer.protractorRunFromCodeLens",
                title: "Run The File",
                arguments: [doc.fileName, undefined],
            }),
            new vscode.CodeLens(range, {
                command: "xoQAMaintCIJobAnalyzer.protractorDebug",
                title: "Debug The File",
                arguments: [doc.fileName, undefined],
            })
        ]);
        return _.flatten(arrays);
    }

}

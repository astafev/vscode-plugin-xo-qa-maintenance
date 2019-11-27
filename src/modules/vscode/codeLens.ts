import * as vscode from 'vscode';
import * as _ from 'lodash';
import { TextUtil } from './text-util';
import { IdTitle } from '../dto/idTitle';


export class CodelensProvider implements vscode.CodeLensProvider {
    provideCodeLenses(doc: vscode.TextDocument, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
        let previous: string[] = [];
        let arrays = TextUtil.parseTextDocument(doc).map(test => {
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
            })
            ];
            if (!_.isEmpty(previous)) {
                previous.push(id);
                array.push(
                    new vscode.CodeLens(range, {
                        command: "xoQAMaintCIJobAnalyzer.protractorRunFromCodeLens",
                        title: "Run Up to",
                        arguments: [doc.fileName, previous.join('|')],
                    }));
            } else {
                previous.push(id);
            }
            return array;
        });
        return _.flatten(arrays);
    }

}
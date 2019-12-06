import * as ts from 'typescript';
import * as _ from 'lodash';
import { TextDocument, Selection, TextEditor, Position } from "vscode";
import { IdTitle } from "../dto/idTitle";
import { makeLogger } from '../../utils';
import * as fs from 'fs';

export interface E2eFileParsed {
    its: ItFunction[];
    describe: {
        line: number
    };
}

interface ItFunction {
    title: string;
    body: ts.Block;
    position: number;
    line: number;
    endLine: number;
}

/** heavy object, drop as soon as possible */
export class E2eFile {
    private _its?: ItFunction[];
    private describeLine?: number;
    constructor(private uri: string, private text: string) {
    }

    private describeOrIt(itOrDescribe: ts.ExpressionStatement, document: ts.SourceFile): ItFunction {
        function getStringLiteralValue(node: ts.Node) {
            if (node.kind !== ts.SyntaxKind.StringLiteral && node.kind !== ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
                throw new Error(`Not a string literal. ${node}`);
            }
            return (node as ts.StringLiteral).text;
        }
        let _callExpression = (itOrDescribe as ts.ExpressionStatement).expression;
        if (_callExpression.kind !== ts.SyntaxKind.CallExpression) {
            throw new Error(`Not a call expression. ${_callExpression.kind}`);
        }
        let callExpression = (_callExpression as ts.CallExpression);
        if (callExpression.arguments.length !== 2 && callExpression.arguments.length !== 3) {
            throw new Error(`Not 2 arguments. ${callExpression.arguments.length}`);
        }
        let fnName = (callExpression.expression as ts.Identifier).escapedText;
        if (fnName !== "describe" && fnName !== "it" && fnName !== "fdescribe" && fnName !== "fit") {
            throw new Error(`Unknown fn name. ${fnName}`);
        }
        let name = '';
        let arg0 = callExpression.arguments[0];
        switch (arg0.kind) {

            case ts.SyntaxKind.PropertyAccessExpression:
                // "describe" method
                let propertyAccess = arg0 as ts.PropertyAccessExpression;
                name = `${(propertyAccess.expression as ts.Identifier).text}.${(propertyAccess.name as ts.Identifier).text}`;
                break;
            case ts.SyntaxKind.BinaryExpression:
                // name is split into 2 lines
                name = getStringLiteralValue((arg0 as ts.BinaryExpression).left) + getStringLiteralValue((arg0 as ts.BinaryExpression).right);
                break;
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                // typical case for "it" method
                name = getStringLiteralValue(arg0);
                break;
            default:
        }
        return {
            title: name,
            body: (callExpression.arguments[1] as ts.ArrowFunction).body as ts.Block,
            position: callExpression.pos,
            // by some reason, the pos is always somewhere 2 lines before
            line: document.getLineAndCharacterOfPosition(callExpression.arguments[0].pos).line,
            endLine: document.getLineAndCharacterOfPosition(callExpression.end).line
        };
    }

    private getDom(): ts.SourceFile {
        return ts.createSourceFile(
            this.uri,
            this.text,
            ts.ScriptTarget.Latest);
    }

    private e2eBody(document: ts.SourceFile): ts.Block {
        for (let node of document.getChildren()[0].getChildren()) {
            if (node.kind !== ts.SyntaxKind.ExpressionStatement) {
                continue;
            }
            try {
                return this.describeOrIt(node as ts.ExpressionStatement, document).body;
            } catch (e) {
                continue;
            }
        }
        throw new Error(`Can't parse the file. Do you have not a e2e file open?`);
    }

    private parse(): E2eFileParsed {

        let document = this.getDom();
        let describe = this.e2eBody(document);
        let cases = describe.statements.filter(node => {
            return node.kind === ts.SyntaxKind.ExpressionStatement;
        });
        this.describeLine = document.getLineAndCharacterOfPosition(describe.pos).line;
        let _its: ItFunction[] = cases.map(node => {
            try {
                return this.describeOrIt(node as ts.ExpressionStatement, document);
            } catch (e) {
                // beforeEach/beforeAll
                return null;
            }
        }).filter(el => {
            return el !== null;
        }) as ItFunction[];
        this._its = _its;
        return {
            its: _its,
            describe: {
                line: this.describeLine
            }
        };
    }

    private _getTestCase(selection: Selection): ItFunction {
        let its = this._its;
        if (its === undefined) {
            its = this.parse().its;
        }
        const line = selection.active.line;
        for (let it of its) {
            if (line >= it.line - 1 && line <= it.endLine) {
                return it;
            }
        }
        throw new Error('No function found');
    }

    public getTestCase(selection: Selection): IdTitle {

        let it = this._getTestCase(selection);

        return {
            id: TextUtil.parseTestCaseIdFromTitle(it.title),
            title: it.title
        };
    }

    public getAllTests(): E2eFileParsed {
        if (!this._its) {
            return this.parse();
        }
        return {
            its: this._its,
            describe: {
                line: this.describeLine || -1
            }
        };
    }
}

// TODO cache results of parsing
export class TextUtil {
    private log = makeLogger();

    public static parseTextDocument(document: TextDocument): {
        its: ItFunction[],
        describe: {
            line: number
        }
     } {
        return TextUtil.fromTextDocument(document).getAllTests();
    }

    private static fromTextDocument(document: TextDocument) {
        return new E2eFile(document.uri.toString(),
            document.getText());
    }

    static getTitle(editor: TextEditor): IdTitle {
        return TextUtil.fromTextDocument(editor.document).getTestCase(editor.selection);
    }

    static async fromPath(uri: string) {
        return new E2eFile(uri,
            (await fs.promises.readFile(uri)).toString());
    }

    public static parseTestCaseIdFromTitle(title: string) {
        let result = new RegExp("\w*\\[C?(\\d+)]").exec(title);
        if (result === null) {
            throw new Error(`Unknown test case name format: ${title}`);
        }
        return Number.parseInt(result[1]);
    }
}

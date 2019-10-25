import * as ts from 'typescript';
import * as fs from 'fs';

function getDom() {
    let url = 'F:\\Aurea\\QA\\responsetek-qa-automation\\automated-protractor-tests\\e2e\\test-suites\\end-to-end-regression-test-suite\\emanager\\emanager-actions\\verify-that-actions-text-that-includes-xss-attack-cleaned.e2e-spec.ts';
    url = 'F:\\Aurea\\QA\\responsetek-qa-automation\\automated-protractor-tests\\e2e\\test-suites\\regression-test-suite\\admin-portal\\manage-portal\\system-management-tool\\RESPTK-2465\\resptk-2465.e2e-spec.ts';
    return ts.createSourceFile(
        url,
        fs.readFileSync(url).toString(),
        ts.ScriptTarget.Latest);
}


function e2eBody(dom: ts.SourceFile): ts.Block {
    for (let node of dom.getChildren()[0].getChildren()) {
        if (node.kind !== ts.SyntaxKind.ExpressionStatement) {
            continue;
        }
        try {
            return describeOrIt(node as ts.ExpressionStatement).secondArgument;
        } catch (e) {
            continue;
        }
    }
    throw new Error(`Can't parse the file. Do you have not a e2e file open?`);
}

function describeOrIt(itOrDescribe: ts.ExpressionStatement): {
    firstArgument: string, secondArgument: ts.Block, position: number
} {
    let _callExpression = (itOrDescribe as ts.ExpressionStatement).expression;
    if (_callExpression.kind !== ts.SyntaxKind.CallExpression) {
        throw new Error(`Not a call expression. ${_callExpression.kind}`);
    }
    let callExpression = (_callExpression as ts.CallExpression);
    if (callExpression.arguments.length !== 2) {
        throw new Error(`Not 2 arguments. ${callExpression.arguments.length}`);
    }
    let fnName = (callExpression.expression as ts.Identifier).escapedText;
    if (fnName !== "describe" && fnName !== "it") {
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
            name = getStringLiteralValue((arg0 as ts.BinaryExpression).left) + getStringLiteralValue((arg0 as ts.BinaryExpression).right);
            break;
        case ts.SyntaxKind.StringLiteral:
            name = getStringLiteralValue(arg0);
            break;
        default:
    }
    return {
        firstArgument: name,
        secondArgument: (callExpression.arguments[1] as ts.ArrowFunction).body as ts.Block,
        position: callExpression.pos
    };
}
function getStringLiteralValue(node: ts.Node) {
    if(node.kind !== ts.SyntaxKind.StringLiteral) {
        throw new Error(`Not a string literal. ${node}`);
    }
    return (node as ts.StringLiteral).text;
}

let dom = getDom();
/*dom.forEachChild(() => {
    console.log(new Date());
});*/
let body = e2eBody(dom);
let cases = body.statements.filter(node => {
    return node.kind === ts.SyntaxKind.ExpressionStatement;
});
cases.forEach(node => {
    try {
        console.log(
            describeOrIt(node as ts.ExpressionStatement).firstArgument
        );
    } catch (e) {
        // beforeEach/beforeAll
    }
});
//delint(dom);